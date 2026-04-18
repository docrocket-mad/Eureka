/**
 * AI Bug Reporter — client-side drop-in [ticket-904]
 *
 * Add to any page:
 *   <script src="/js/ai-bug-reporter.js" data-source="lab-lounge"></script>
 *
 * Injects a floating mic button. Record → stop → server transcribes
 * & parses via Claude → preview → auto-submitted as Artificer ticket.
 *
 * Config via data attributes:
 *   data-source       — project identifier (e.g. "lab-lounge", "lab-os")
 *   data-accent-color — button/accent color (default: #7c3aed)
 *   data-api-url      — voice-bug endpoint (default: /api/voice-bug-report)
 */

(function() {
  'use strict';

  const script = document.currentScript || document.querySelector('script[data-source]');
  const CONFIG = {
    source: script?.dataset.source || 'unknown',
    apiUrl: script?.dataset.apiUrl || '/api/voice-bug-report',
    accentColor: script?.dataset.accentColor || '#7c3aed',
  };

  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let overlay = null;

  function init() {
    injectStyles();
    injectButton();
    injectOverlay();
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .abr-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: ${CONFIG.accentColor};
        color: #fff;
        border: none;
        cursor: pointer;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: transform 0.15s, box-shadow 0.15s;
        font-size: 1.3rem;
      }
      .abr-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.4); }
      .abr-overlay {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(8px);
        align-items: center;
        justify-content: center;
      }
      .abr-overlay.open { display: flex; }
      .abr-card {
        background: #1a1a2e;
        border-radius: 20px;
        padding: 32px 28px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        color: #e8e8f0;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      }
      .abr-card h2 { font-size: 1.2rem; margin: 0 0 8px; font-weight: 700; }
      .abr-card p { font-size: 0.85rem; color: rgba(200,200,220,0.5); margin: 0 0 20px; line-height: 1.5; }
      .abr-mic {
        width: 80px; height: 80px; border-radius: 50%;
        background: ${CONFIG.accentColor};
        border: none; color: #fff; font-size: 2rem;
        cursor: pointer; margin: 0 auto 16px;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      .abr-mic.recording {
        background: #ef4444;
        animation: abr-pulse 1.2s ease-in-out infinite;
      }
      @keyframes abr-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
        50% { box-shadow: 0 0 0 16px rgba(239,68,68,0); }
      }
      .abr-status { font-size: 0.8rem; color: rgba(200,200,220,0.4); margin-bottom: 16px; min-height: 1.2em; }
      .abr-preview { text-align: left; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px; font-size: 0.85rem; }
      .abr-preview h3 { font-size: 0.95rem; color: ${CONFIG.accentColor}; margin: 0 0 8px; }
      .abr-preview .field { margin-bottom: 8px; }
      .abr-preview .label { font-size: 0.7rem; color: rgba(200,200,220,0.4); text-transform: uppercase; letter-spacing: 0.08em; }
      .abr-preview .value { color: #e8e8f0; margin-top: 2px; }
      .abr-actions { display: flex; gap: 8px; justify-content: center; }
      .abr-actions button {
        padding: 10px 24px; border-radius: 10px; border: none;
        font-size: 0.85rem; font-weight: 700; cursor: pointer;
        font-family: inherit;
      }
      .abr-done { background: rgba(255,255,255,0.08); color: rgba(200,200,220,0.7); }
      .abr-done:hover { background: rgba(255,255,255,0.12); }
      .abr-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: rgba(200,200,220,0.4); font-size: 1.5rem; cursor: pointer; }
    `;
    document.head.appendChild(style);
  }

  function injectButton() {
    const btn = document.createElement('button');
    btn.className = 'abr-btn';
    btn.innerHTML = '\uD83D\uDC1B';
    btn.title = 'Report a bug (voice)';
    btn.onclick = openOverlay;
    document.body.appendChild(btn);
  }

  function injectOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'abr-overlay';
    overlay.innerHTML = `
      <div class="abr-card" style="position:relative;">
        <button class="abr-close" onclick="window._abrClose()">&times;</button>
        <h2>Report a Bug</h2>
        <p>Just tell us what happened. Don\u2019t filter yourself \u2014 describe what you were doing, what went wrong, and what you expected. We\u2019ll organise it.</p>
        <button class="abr-mic" id="abrMicBtn" onclick="window._abrToggleRecord()">\uD83C\uDFA4</button>
        <div class="abr-status" id="abrStatus">Tap the mic to start recording</div>
        <div id="abrPreview" style="display:none;"></div>
        <div id="abrActions" style="display:none;" class="abr-actions"></div>
      </div>
    `;
    overlay.onclick = function(e) { if (e.target === overlay) closeOverlay(); };
    document.body.appendChild(overlay);
  }

  function openOverlay() {
    overlay.classList.add('open');
    resetState();
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    resetState();
  }

  function resetState() {
    audioChunks = [];
    isRecording = false;
    const mic = document.getElementById('abrMicBtn');
    if (mic) {
      mic.classList.remove('recording');
      mic.innerHTML = '\uD83C\uDFA4';
      mic.style.display = '';
    }
    document.getElementById('abrStatus').textContent = 'Tap the mic to start recording';
    document.getElementById('abrPreview').style.display = 'none';
    document.getElementById('abrActions').style.display = 'none';
    document.getElementById('abrActions').innerHTML = '';
  }

  async function toggleRecord() {
    if (isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      document.getElementById('abrMicBtn').classList.remove('recording');
      document.getElementById('abrMicBtn').innerHTML = '\uD83C\uDFA4';
      document.getElementById('abrStatus').textContent = 'Processing...';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks = [];

      mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async function() {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        await processRecording(blob);
      };

      mediaRecorder.start();
      isRecording = true;
      document.getElementById('abrMicBtn').classList.add('recording');
      document.getElementById('abrMicBtn').innerHTML = '\u23F9';
      document.getElementById('abrStatus').textContent = 'Recording... tap to stop';
    } catch (err) {
      document.getElementById('abrStatus').textContent = 'Microphone access denied. Please allow mic access and try again.';
    }
  }

  async function processRecording(blob) {
    document.getElementById('abrStatus').textContent = 'Analysing your report...';
    document.getElementById('abrMicBtn').style.display = 'none';

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'bug-report.webm');
      formData.append('source', CONFIG.source);
      formData.append('page_url', window.location.href);
      formData.append('user_agent', navigator.userAgent);

      const resp = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) throw new Error('Server error: ' + resp.status);
      const data = await resp.json();

      if (data.bugs && data.bugs.length > 0) {
        showResults(data.bugs, data.tickets || [], data.submitted);
      } else if (data.parsed) {
        // Backwards compat with old single-bug format
        showResults([data.parsed], data.ticket_id ? [{ title: data.parsed.title, ticket_id: data.ticket_id }] : [], data.submitted);
      } else {
        document.getElementById('abrStatus').textContent = data.error || 'Could not process recording.';
        document.getElementById('abrMicBtn').style.display = '';
        showRetry();
      }
    } catch (err) {
      console.error('[BugReporter] Error:', err);
      document.getElementById('abrStatus').textContent = 'Processing failed: ' + err.message;
      document.getElementById('abrMicBtn').style.display = '';
      showRetry();
    }
  }

  function showResults(bugs, tickets, submitted) {
    const preview = document.getElementById('abrPreview');
    preview.style.display = 'block';

    const count = bugs.length;
    const ticketIds = tickets.map(t => '#' + t.ticket_id).join(', ');

    if (submitted && tickets.length > 0) {
      document.getElementById('abrStatus').textContent = '\u2705 ' + count + (count === 1 ? ' ticket' : ' tickets') + ' submitted! (' + ticketIds + ')';
    } else {
      document.getElementById('abrStatus').textContent = 'Parsed ' + count + (count === 1 ? ' bug' : ' bugs') + ':';
    }

    preview.innerHTML = bugs.map(function(bug, i) {
      return '<div class="abr-preview"' + (i > 0 ? ' style="margin-top:10px;"' : '') + '>' +
        '<h3>' + escapeHtml(bug.title || 'Bug Report') + '</h3>' +
        '<div class="field"><div class="label">What happened</div><div class="value">' + escapeHtml(bug.what_happened || '') + '</div></div>' +
        '<div class="field"><div class="label">Expected</div><div class="value">' + escapeHtml(bug.expected || '') + '</div></div>' +
        (bug.steps ? '<div class="field"><div class="label">Steps</div><div class="value">' + escapeHtml(bug.steps) + '</div></div>' : '') +
        '<div class="field"><div class="label">Severity</div><div class="value">' + escapeHtml(bug.severity || 'medium') + '</div></div>' +
      '</div>';
    }).join('');

    var actions = document.getElementById('abrActions');
    actions.style.display = 'flex';
    actions.innerHTML = '<button class="abr-done" onclick="window._abrClose()">Done</button>';
  }

  function showRetry() {
    const actions = document.getElementById('abrActions');
    actions.style.display = 'flex';
    actions.innerHTML = '<button class="abr-done" onclick="window._abrReset()">Try Again</button>';
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  window._abrToggleRecord = toggleRecord;
  window._abrClose = closeOverlay;
  window._abrReset = resetState;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
