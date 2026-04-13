/**
 * Eureka push notifications [ticket-644]
 *
 * Web-push subscription registration + daily re-engagement cron.
 *
 * Setup:
 *   - VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY env vars (generate with
 *     `npx web-push generate-vapid-keys` once and store in Railway).
 *   - VAPID_SUBJECT env var (mailto: address).
 */

const webpush = require('web-push');
const cron = require('node-cron');
const { REACTIONS } = require('./data.js');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:devan@artificer.systems';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const enabled = () => !!(VAPID_PUBLIC && VAPID_PRIVATE);

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(8) REFERENCES saves(code) ON DELETE CASCADE,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      last_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_push_code ON push_subscriptions(code);
    ALTER TABLE saves ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ DEFAULT NOW();
  `);
}

// Find an undiscovered combo for this user — pick a reaction whose pair contains
// at least one element the user has, but whose result they haven't discovered.
function pickUnusedCombo(discovered) {
  if (!discovered || discovered.length === 0) return null;
  const dset = new Set(discovered);
  const pool = [];
  for (const [key, result] of Object.entries(REACTIONS)) {
    if (dset.has(result)) continue;                    // already discovered
    const [a, b] = key.split('+');
    // Both ingredients must be discovered (or be starter atoms — H/O/C/N always available)
    const STARTERS = new Set(['H', 'O', 'C', 'N']);
    if ((dset.has(a) || STARTERS.has(a)) && (dset.has(b) || STARTERS.has(b))) {
      pool.push({ a, b, result });
    }
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const HINTS_RESET_LINES = [
  "Dr. Rocket just restocked the lab — your hints have reset!",
  "Fresh hints are waiting. What will you mix up today?",
  "The lab is open. New hints, fresh discoveries.",
];

function buildNotification(discovered) {
  // 60% combo suggestion, 40% hints reset — combos feel more personal
  if (Math.random() < 0.6) {
    const combo = pickUnusedCombo(discovered);
    if (combo) {
      const intros = [
        `Dr. Rocket thinks you should try combining ${combo.a} and ${combo.b}... something sparky might happen.`,
        `Have you ever mixed ${combo.a} with ${combo.b}? Dr. Rocket has a hunch about this one.`,
        `${combo.a} + ${combo.b}? Dr. Rocket says it's worth a try.`,
      ];
      return {
        title: 'Eureka',
        body: '⚗️ ' + intros[Math.floor(Math.random() * intros.length)],
        url: '/'
      };
    }
  }
  return {
    title: 'Eureka',
    body: '🔬 ' + HINTS_RESET_LINES[Math.floor(Math.random() * HINTS_RESET_LINES.length)],
    url: '/'
  };
}

async function sendOne(pool, sub, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    await pool.query('UPDATE push_subscriptions SET last_sent_at = NOW() WHERE id = $1', [sub.id]);
    return true;
  } catch (err) {
    // 404/410 = subscription expired; remove it
    if (err.statusCode === 404 || err.statusCode === 410) {
      await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
    } else {
      console.error('[push] send error:', err.statusCode || err.message);
    }
    return false;
  }
}

async function runDailyCheck(pool) {
  if (!enabled()) {
    console.log('[push] VAPID not configured — skipping daily check');
    return { sent: 0 };
  }
  // Eligible saves: opened > 24h ago, push_subscriptions exist, not pushed in last 24h
  const { rows: candidates } = await pool.query(`
    SELECT s.code, s.discovered, s.last_opened_at,
           ps.id as sub_id, ps.endpoint, ps.p256dh, ps.auth, ps.last_sent_at
    FROM saves s
    JOIN push_subscriptions ps ON ps.code = s.code
    WHERE s.last_opened_at < NOW() - INTERVAL '24 hours'
      AND (ps.last_sent_at IS NULL OR ps.last_sent_at < NOW() - INTERVAL '24 hours')
  `);
  let sent = 0;
  for (const c of candidates) {
    const payload = buildNotification(c.discovered || []);
    const ok = await sendOne(pool, {
      id: c.sub_id, endpoint: c.endpoint, p256dh: c.p256dh, auth: c.auth
    }, payload);
    if (ok) sent++;
  }
  console.log(`[push] daily check — ${candidates.length} candidates, ${sent} sent`);
  return { candidates: candidates.length, sent };
}

function registerRoutes(app, pool) {
  ensureSchema(pool).catch(err => console.error('[push] ensureSchema:', err.message));

  app.get('/api/push/vapid-key', (req, res) => {
    if (!VAPID_PUBLIC) return res.status(503).json({ error: 'Push not configured' });
    res.json({ key: VAPID_PUBLIC });
  });

  app.post('/api/push/subscribe', async (req, res) => {
    if (!enabled()) return res.status(503).json({ error: 'Push not configured' });
    const { code, subscription } = req.body || {};
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    if (!code) return res.status(400).json({ error: 'code required' });
    try {
      await pool.query(
        `INSERT INTO push_subscriptions (code, endpoint, p256dh, auth)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (endpoint) DO UPDATE SET code = EXCLUDED.code`,
        [code, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('[push] subscribe error:', err);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  });

  app.post('/api/push/unsubscribe', async (req, res) => {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ ok: true });
  });

  // Bump last_opened_at — called by the app on each launch
  app.post('/api/push/ping', async (req, res) => {
    const { code } = req.body || {};
    if (!code) return res.json({ ok: true });
    await pool.query('UPDATE saves SET last_opened_at = NOW() WHERE code = $1', [code]).catch(() => {});
    res.json({ ok: true });
  });

  // Manual trigger for testing
  app.post('/api/push/_run', async (req, res) => {
    if (req.headers['x-admin-key'] !== process.env.PUSH_ADMIN_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const r = await runDailyCheck(pool);
    res.json(r);
  });
}

function startCron(pool) {
  if (!enabled()) {
    console.log('[push] VAPID not configured — cron not started');
    return;
  }
  // Daily at 17:00 UTC (~1pm Halifax during EDT, ~12pm during EST)
  cron.schedule('0 17 * * *', () => {
    runDailyCheck(pool).catch(err => console.error('[push] cron error:', err.message));
  });
  console.log('[push] cron scheduled — daily 17:00 UTC');
}

module.exports = { registerRoutes, startCron, runDailyCheck, ensureSchema };
