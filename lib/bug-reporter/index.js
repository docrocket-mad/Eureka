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
 *   POST /api/voice-bug-report  — audio blob → Claude transcription + parse → submit ticket
 *   GET  /js/ai-bug-reporter.js — serves the client-side drop-in script
 */

const express = require('express');
const multer = require('multer');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

  // Voice bug report: audio → Claude (transcribe + parse) → submit to Artificer
  router.post('/api/voice-bug-report', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
      if (!anthropicKey) return res.status(500).json({ error: 'AI service not configured' });

      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      const audioBase64 = req.file.buffer.toString('base64');
      const mediaType = req.file.mimetype || 'audio/webm';

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'media',
              source: { type: 'base64', media_type: mediaType, data: audioBase64 },
            },
            {
              type: 'text',
              text: `You are a bug report parser. The audio above is someone verbally describing a software bug.

Transcribe what they said, then extract structured fields. Return ONLY valid JSON with this exact shape:
{
  "title": "short bug title (under 80 chars)",
  "what_happened": "what went wrong",
  "expected": "what the user expected to happen",
  "steps": "steps to reproduce (if mentioned), or null",
  "severity": "critical | medium | low",
  "transcript": "the full verbatim transcription"
}

If the audio is unclear or empty, return: { "error": "Could not understand audio" }`
            }
          ]
        }]
      });

      const text = response.content[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.json({ error: 'Could not parse bug report from audio' });
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error) {
        return res.json({ error: parsed.error });
      }

      // Auto-submit to Artificer webhook
      let ticketId = null;
      if (webhookUrl && webhookKey) {
        try {
          const description = [
            parsed.what_happened ? `**What happened:** ${parsed.what_happened}` : '',
            parsed.expected ? `**Expected:** ${parsed.expected}` : '',
            parsed.steps ? `**Steps:** ${parsed.steps}` : '',
            `**Page:** ${req.body?.page_url || 'Not specified'}`,
            parsed.transcript ? `\n---\n**Raw transcript:** ${parsed.transcript}` : '',
          ].filter(Boolean).join('\n\n');

          const submitResp = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': webhookKey,
            },
            body: JSON.stringify({
              source: req.body?.source || source,
              title: parsed.title || 'Voice bug report',
              description,
              priority: parsed.severity === 'critical' ? 'critical' : parsed.severity === 'low' ? 'feature_request' : 'medium',
              page_url: req.body?.page_url || '',
              reporter: 'Voice Reporter',
            }),
          });

          if (submitResp.ok) {
            const result = await submitResp.json();
            ticketId = result.id || result.ticket_id;
          }
        } catch (submitErr) {
          console.error('[BugReporter] Ticket submit failed:', submitErr.message);
        }
      }

      // Log API usage if pool is available
      try {
        const pool = req.app?.locals?.pool;
        if (pool) {
          await pool.query(
            `INSERT INTO api_usage (app, user_label, model, input_tokens, output_tokens, endpoint)
             VALUES ($1, $2, $3, $4, $5, '/api/voice-bug-report')`,
            [source, 'voice-bug', response.model, response.usage?.input_tokens || 0, response.usage?.output_tokens || 0]
          );
        }
      } catch (logErr) { /* silent */ }

      res.json({ parsed, ticket_id: ticketId, submitted: !!ticketId });
    } catch (err) {
      console.error('[BugReporter] Error:', err.message);
      res.status(500).json({ error: 'Failed to process voice bug report' });
    }
  });

  return router;
};
