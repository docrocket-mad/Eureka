const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Init DB ──
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saves (
      code VARCHAR(8) PRIMARY KEY,
      discovered TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
initDB().catch(err => console.error('DB init failed:', err));

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// ── Serve static files ──
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/music', express.static(path.join(__dirname, 'music')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest.json'));
});
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'eureka.html'));
});
app.get('/cosmos', (req, res) => {
  res.sendFile(path.join(__dirname, 'cosmos.html'));
});
app.get('/data.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'data.js'));
});

// ── Save progress ──
app.post('/api/save', async (req, res) => {
  try {
    const { code, discovered } = req.body;
    if (!Array.isArray(discovered)) return res.status(400).json({ error: 'discovered must be an array' });

    if (code) {
      // Update existing save
      const result = await pool.query(
        'UPDATE saves SET discovered = $1, updated_at = NOW() WHERE code = $2 RETURNING code',
        [discovered, code.toUpperCase()]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Save code not found' });
      return res.json({ code: code.toUpperCase(), saved: true });
    }

    // New save
    const newCode = generateCode();
    await pool.query(
      'INSERT INTO saves (code, discovered) VALUES ($1, $2)',
      [newCode, discovered]
    );
    res.json({ code: newCode, saved: true });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Save failed' });
  }
});

// ── Load progress ──
app.get('/api/load/:code', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT discovered, updated_at FROM saves WHERE code = $1',
      [req.params.code.toUpperCase()]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Save code not found' });
    res.json({ discovered: result.rows[0].discovered, updated_at: result.rows[0].updated_at });
  } catch (err) {
    console.error('Load error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

// ── Report bug/feature → Artificer ──
const ARTIFICER_WEBHOOK = 'https://portal.artificer.systems/api/webhook/bug-report';
const ARTIFICER_KEY = process.env.ARTIFICER_WEBHOOK_KEY || '';

app.post('/api/report', async (req, res) => {
  try {
    const { text, ticket_type, meta } = req.body;
    if (!text) return res.status(400).json({ error: 'No report text' });

    const title = text.length > 80 ? text.slice(0, 77) + '...' : text;
    const description = `${text}\n\n---\nDiscovered: ${meta?.discovered || '?'} elements\nBrowser: ${meta?.browser || 'unknown'}\nScreen: ${meta?.screen || '?'}\nTime: ${meta?.timestamp || new Date().toISOString()}`;

    if (ARTIFICER_KEY) {
      const https = require('https');
      const payload = JSON.stringify({
        source: 'eureka',
        project_id: 14,
        priority: 'medium',
        title: `[Eureka] ${title}`,
        description,
        reporter: 'Eureka Player (voice)',
        ticket_type: ticket_type || 'bug',
      });
      await new Promise((resolve, reject) => {
        const url = new URL(ARTIFICER_WEBHOOK);
        const opts = {
          hostname: url.hostname, port: 443, path: url.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': ARTIFICER_KEY, 'Content-Length': Buffer.byteLength(payload) }
        };
        const r = https.request(opts, (resp) => {
          let d = ''; resp.on('data', c => d += c); resp.on('end', () => resolve(d));
        });
        r.on('error', reject);
        r.write(payload);
        r.end();
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Report failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Eureka! running on port ${PORT}`));
