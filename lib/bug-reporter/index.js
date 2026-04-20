/**
 * Bug Reporter — shared server module [ticket-904]
 *
 * Drop-in voice-to-ticket system for any Artificer-built Express app.
 * One require, one mount, zero config beyond env vars.
 *
 * Usage:
 *   const bugReporter = require('./lib/bug-reporter');
 *   app.use(bugReporter({
 *     source: 'lab-lounge',
 *     webhookUrl: 'https://artificer.systems/api/webhook/bug-report',
 *     webhookKey: process.env.ARTIFICER_WEBHOOK_KEY,
 *     anthropicKey: process.env.ANTHROPIC_API_KEY,
 *   }));
 *
 * Mounts:
 *   POST /api/voice-bug-report  — text transcript → Claude parse → submit ticket(s)
 *   GET  /js/ai-bug-reporter.js — serves the client-side drop-in script
 */

const express = require('express');
const path = require('path');

module.exports = function createBugReporter(config = {}) {
  const {
    source = 'unknown',
    webhookUrl = 'https://artificer.systems/api/webhook/bug-report',
    webhookKey = '',
    anthropicKey = '',
  } = config;

  const router = express.Router();

  // Serve the client-side script
  router.get('/js/ai-bug-reporter.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.js'));
  });

  // Voice bug report: transcript text → Claude parse → submit to Artificer
  // Client uses browser Web Speech API for transcription, sends text here
  router.post('/api/voice-bug-report', express.json(), async (req, res) => {
    try {
      const { transcript, source: reqSource, page_url } = req.body;
      if (!transcript || !transcript.trim()) {
        return res.status(400).json({ error: 'No transcript provided' });
      }
      // If no local API key, forward transcript to Artificer for processing
      if (!anthropicKey) {
        if (!webhookUrl || !webhookKey) {
          return res.status(500).json({ error: 'Bug reporter not configured — no API key or webhook' });
        }
        // Submit raw transcript as a single ticket directly to Artificer
        try {
          const submitResp = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': webhookKey },
            body: JSON.stringify({
              source: reqSource || source,
              title: transcript.slice(0, 80),
              description: `**Voice report (unprocessed):**\n${transcript}\n\n**Page:** ${page_url || 'Not specified'}`,
              priority: 'medium',
              page_url: page_url || '',
              reporter: 'Voice Reporter',
            }),
          });
          if (submitResp.ok) {
            const result = await submitResp.json();
            return res.json({
              bugs: [{ title: transcript.slice(0, 80), what_happened: transcript, expected: '', steps: null, severity: 'medium' }],
              transcript,
              tickets: [{ title: transcript.slice(0, 80), ticket_id: result.id || result.ticket_id }],
              submitted: true,
            });
          }
        } catch (fwdErr) {
          console.error('[BugReporter] Forward failed:', fwdErr.message);
        }
        return res.status(500).json({ error: 'Could not submit bug report' });
      }

      // Use raw fetch to Anthropic API — works regardless of SDK version
      const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `You are a bug report parser. The text below is someone describing software bugs.

Extract structured fields. The person may describe MULTIPLE separate bugs. Split them into individual tickets.

Return ONLY valid JSON with this exact shape:
{
  "bugs": [
    {
      "title": "short bug title (under 80 chars)",
      "what_happened": "what went wrong",
      "expected": "what the user expected to happen",
      "steps": "steps to reproduce (if mentioned), or null",
      "severity": "critical | medium | low"
    }
  ]
}

If there is only one bug, the array will have one item. If the person describes multiple distinct issues, create a separate entry for each.

If the text is unclear or empty, return: { "error": "Could not understand the report" }

Here is the transcript:
${transcript}`
          }]
        }),
      });

      if (!apiResp.ok) {
        const errText = await apiResp.text();
        console.error('[BugReporter] Anthropic API error:', apiResp.status, errText);
        throw new Error('AI service error: ' + apiResp.status);
      }

      const apiData = await apiResp.json();
      const text = apiData.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.json({ error: 'Could not parse bug report' });
      }

      const result = JSON.parse(jsonMatch[0]);
      if (result.error) {
        return res.json({ error: result.error });
      }

      const bugs = result.bugs || [result];

      // Auto-submit each bug to Artificer webhook
      const tickets = [];
      const submitErrors = [];
      if (!webhookUrl || !webhookKey) {
        submitErrors.push(`Missing webhook config: url=${!!webhookUrl}, key=${!!webhookKey}`);
        console.error('[BugReporter] ' + submitErrors[0]);
      } else {
        for (const bug of bugs) {
          try {
            const description = [
              bug.what_happened ? `**What happened:** ${bug.what_happened}` : '',
              bug.expected ? `**Expected:** ${bug.expected}` : '',
              bug.steps ? `**Steps:** ${bug.steps}` : '',
              `**Page:** ${page_url || 'Not specified'}`,
              `\n---\n**Raw transcript:** ${transcript}`,
            ].filter(Boolean).join('\n\n');

            const submitResp = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': webhookKey,
              },
              body: JSON.stringify({
                source: reqSource || source,
                title: bug.title || 'Voice bug report',
                description,
                priority: bug.severity === 'critical' ? 'critical' : bug.severity === 'low' ? 'feature_request' : 'medium',
                page_url: page_url || '',
                reporter: 'Voice Reporter',
              }),
            });

            if (submitResp.ok) {
              const ticketResult = await submitResp.json();
              tickets.push({ title: bug.title, ticket_id: ticketResult.id || ticketResult.ticket_id });
              console.log(`[BugReporter] Ticket #${ticketResult.id || ticketResult.ticket_id} created for "${bug.title}"`);
            } else {
              const errBody = await submitResp.text();
              const msg = `Webhook returned ${submitResp.status}: ${errBody.slice(0, 200)}`;
              submitErrors.push(msg);
              console.error('[BugReporter] ' + msg);
            }
          } catch (submitErr) {
            submitErrors.push('Submit error: ' + submitErr.message);
            console.error('[BugReporter] Ticket submit failed:', submitErr.message);
          }
        }
      }

      // Log API usage if pool is available
      try {
        const pool = req.app?.locals?.pool;
        if (pool) {
          await pool.query(
            `INSERT INTO api_usage (app, user_label, model, input_tokens, output_tokens, endpoint)
             VALUES ($1, $2, $3, $4, $5, '/api/voice-bug-report')`,
            [source, 'voice-bug', apiData.model || 'claude-sonnet', apiData.usage?.input_tokens || 0, apiData.usage?.output_tokens || 0]
          );
        }
      } catch (logErr) { /* silent */ }

      res.json({
        bugs,
        transcript,
        tickets,
        submitted: tickets.length > 0,
        submit_errors: submitErrors.length > 0 ? submitErrors : undefined,
      });
    } catch (err) {
      console.error('[BugReporter] Error:', err.message);
      res.status(500).json({ error: 'Failed to process bug report' });
    }
  });

  return router;
};
