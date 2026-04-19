/**
 * AI Bug Reporter — client-side drop-in [ticket-904]
 *
 * Add to any page:
 *   <script src="/js/ai-bug-reporter.js" data-source="lab-lounge"></script>
 *
 * Injects a floating mic button. Uses browser Speech Recognition
 * (Chrome/Edge) or text input fallback (Firefox/Safari).
 * Transcript → server parses via Claude → auto-creates Artificer tickets.
 *
 * Config via data attributes:
 *   data-source       — project identifier (e.g. "lab-lounge", "lab-os")
 *   data-accent-color — button/accent color (default: #7c3aed)
 *   data-api-url      — voice-bug endpoint (default: /api/voice-bug-report)
 */

(function() {
  'use strict';

  var script = document.currentScript || document.querySelector('script[data-source]');
  var CONFIG = {
    source: script && script.dataset.source || 'unknown',
    apiUrl: script && script.dataset.apiUrl || '/api/voice-bug-report',
    accentColor: script && script.dataset.accentColor || '#7c3aed',
  };

  // Check for Speech Recognition support
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var hasSpeech = !!SpeechRecognition;

  var recognition = null;
  var isListening = false;
  var overlay = null;

  function init() {
    injectStyles();
    injectButton();
    injectOverlay();
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.abr-btn {',
      '  position: fixed; bottom: 80px; right: 20px;',
      '  width: 46px; height: 46px; border-radius: 50%;',
      '  background: ' + CONFIG.accentColor + '; color: #fff;',
      '  border: none; cursor: pointer; z-index: 99999;',
      '  display: flex; align-items: center; justify-content: center;',
      '  box-shadow: 0 4px 20px rgba(0,0,0,0.3);',
      '  transition: transform 0.15s, box-shadow 0.15s;',
      '  font-size: 1.2rem;',
      '}',
      '.abr-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.4); }',
      '.abr-overlay {',
      '  display: none; position: fixed; inset: 0; z-index: 100000;',
      '  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);',
      '  align-items: center; justify-content: center;',
      '}',
      '.abr-overlay.open { display: flex; }',
      '.abr-card {',
      '  background: #1a1a2e; border-radius: 20px;',
      '  padding: 28px 24px; max-width: 480px; width: 90%;',
      '  text-align: center; color: #e8e8f0;',
      '  font-family: system-ui, -apple-system, sans-serif;',
      '  box-shadow: 0 20px 60px rgba(0,0,0,0.5);',
      '}',
      '.abr-card h2 { font-size: 1.1rem; margin: 0 0 6px; font-weight: 700; }',
      '.abr-card p { font-size: 0.82rem; color: rgba(200,200,220,0.5); margin: 0 0 16px; line-height: 1.5; }',
      '.abr-mic {',
      '  width: 72px; height: 72px; border-radius: 50%;',
      '  background: ' + CONFIG.accentColor + ';',
      '  border: none; color: #fff; font-size: 1.8rem;',
      '  cursor: pointer; margin: 0 auto 12px;',
      '  display: flex; align-items: center; justify-content: center;',
      '  transition: all 0.2s;',
      '}',
      '.abr-mic.recording { background: #ef4444; animation: abr-pulse 1.2s ease-in-out infinite; }',
      '@keyframes abr-pulse {',
      '  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }',
      '  50% { box-shadow: 0 0 0 16px rgba(239,68,68,0); }',
      '}',
      '.abr-status { font-size: 0.78rem; color: rgba(200,200,220,0.4); margin-bottom: 12px; min-height: 1.2em; }',
      '.abr-transcript {',
      '  width: 100%; min-height: 80px; max-height: 160px; resize: vertical;',
      '  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);',
      '  border-radius: 10px; padding: 12px; color: #e8e8f0;',
      '  font-family: inherit; font-size: 0.85rem; margin-bottom: 12px;',
      '  outline: none;',
      '}',
      '.abr-transcript:focus { border-color: ' + CONFIG.accentColor + '; }',
      '.abr-transcript::placeholder { color: rgba(200,200,220,0.3); }',
      '.abr-preview { text-align: left; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; margin-bottom: 10px; font-size: 0.82rem; }',
      '.abr-preview + .abr-preview { margin-top: 8px; }',
      '.abr-preview h3 { font-size: 0.9rem; color: ' + CONFIG.accentColor + '; margin: 0 0 6px; }',
      '.abr-preview .field { margin-bottom: 6px; }',
      '.abr-preview .label { font-size: 0.68rem; color: rgba(200,200,220,0.4); text-transform: uppercase; letter-spacing: 0.08em; }',
      '.abr-preview .value { color: #e8e8f0; margin-top: 1px; }',
      '.abr-actions { display: flex; gap: 8px; justify-content: center; }',
      '.abr-actions button {',
      '  padding: 9px 20px; border-radius: 10px; border: none;',
      '  font-size: 0.82rem; font-weight: 700; cursor: pointer; font-family: inherit;',
      '}',
      '.abr-submit { background: ' + CONFIG.accentColor + '; color: #fff; }',
      '.abr-submit:hover { opacity: 0.9; }',
      '.abr-done { background: rgba(255,255,255,0.08); color: rgba(200,200,220,0.7); }',
      '.abr-done:hover { background: rgba(255,255,255,0.12); }',
      '.abr-close { position: absolute; top: 10px; right: 14px; background: none; border: none; color: rgba(200,200,220,0.4); font-size: 1.4rem; cursor: pointer; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  function injectButton() {
    var btn = document.createElement('button');
    btn.className = 'abr-btn';
    btn.innerHTML = '\uD83D\uDC1B';
    btn.title = 'Report a bug';
    btn.onclick = openOverlay;
    document.body.appendChild(btn);
  }

  function injectOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'abr-overlay';
    overlay.innerHTML =
      '<div class="abr-card" style="position:relative;">' +
        '<button class="abr-close" onclick="window._abrClose()">&times;</button>' +
        '<h2>Report a Bug</h2>' +
        '<p>Describe what happened \u2014 one issue or many. We\u2019ll sort it out.</p>' +
        (hasSpeech
          ? '<button class="abr-mic" id="abrMicBtn" onclick="window._abrToggleRecord()">\uD83C\uDFA4</button>'
          : '') +
        '<div class="abr-status" id="abrStatus">' +
          (hasSpeech ? 'Tap the mic to start, or type below' : 'Describe the bug below') +
        '</div>' +
        '<textarea class="abr-transcript" id="abrTranscript" placeholder="Describe the bug(s) here\u2026 e.g. \'The sidebar overlaps the content and also the save button doesn\'t work\'"></textarea>' +
        '<div id="abrPreview"></div>' +
        '<div id="abrActions" class="abr-actions">' +
          '<button class="abr-submit" onclick="window._abrSubmit()">Submit Report</button>' +
        '</div>' +
      '</div>';
    overlay.onclick = function(e) { if (e.target === overlay) closeOverlay(); };
    document.body.appendChild(overlay);
  }

  function openOverlay() {
    overlay.classList.add('open');
    resetState();
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    stopListening();
    resetState();
  }

  function resetState() {
    isListening = false;
    var mic = document.getElementById('abrMicBtn');
    if (mic) {
      mic.classList.remove('recording');
      mic.innerHTML = '\uD83C\uDFA4';
    }
    document.getElementById('abrStatus').textContent =
      hasSpeech ? 'Tap the mic to start, or type below' : 'Describe the bug below';
    document.getElementById('abrTranscript').value = '';
    document.getElementById('abrTranscript').style.display = '';
    document.getElementById('abrPreview').innerHTML = '';
    var actions = document.getElementById('abrActions');
    actions.innerHTML = '<button class="abr-submit" onclick="window._abrSubmit()">Submit Report</button>';
  }

  function stopListening() {
    if (recognition) {
      try { recognition.stop(); } catch(e) {}
    }
    isListening = false;
  }

  function toggleRecord() {
    if (!hasSpeech) return;

    if (isListening) {
      stopListening();
      var mic = document.getElementById('abrMicBtn');
      if (mic) {
        mic.classList.remove('recording');
        mic.innerHTML = '\uD83C\uDFA4';
      }
      document.getElementById('abrStatus').textContent = 'Review and submit, or keep talking';
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    var finalTranscript = document.getElementById('abrTranscript').value;

    recognition.onresult = function(event) {
      var interim = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      document.getElementById('abrTranscript').value = finalTranscript + interim;
    };

    recognition.onerror = function(event) {
      if (event.error === 'not-allowed') {
        document.getElementById('abrStatus').textContent = 'Microphone access denied. Type your report instead.';
      }
      isListening = false;
      var mic = document.getElementById('abrMicBtn');
      if (mic) {
        mic.classList.remove('recording');
        mic.innerHTML = '\uD83C\uDFA4';
      }
    };

    recognition.onend = function() {
      // Speech recognition auto-stops after silence — restart if still listening
      if (isListening) {
        try { recognition.start(); } catch(e) {}
      }
    };

    try {
      recognition.start();
      isListening = true;
      var mic = document.getElementById('abrMicBtn');
      if (mic) {
        mic.classList.add('recording');
        mic.innerHTML = '\u23F9';
      }
      document.getElementById('abrStatus').textContent = 'Listening\u2026 tap to stop';
    } catch (err) {
      document.getElementById('abrStatus').textContent = 'Could not start speech recognition. Type your report instead.';
    }
  }

  function submit() {
    var transcript = document.getElementById('abrTranscript').value.trim();
    if (!transcript) {
      document.getElementById('abrStatus').textContent = 'Please describe the bug first.';
      return;
    }

    stopListening();
    document.getElementById('abrStatus').textContent = 'Analysing your report\u2026';
    document.getElementById('abrTranscript').style.display = 'none';
    var mic = document.getElementById('abrMicBtn');
    if (mic) mic.style.display = 'none';
    document.getElementById('abrActions').innerHTML = '';

    fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: transcript,
        source: CONFIG.source,
        page_url: window.location.href,
      }),
    })
    .then(function(resp) {
      if (!resp.ok) throw new Error('Server error: ' + resp.status);
      return resp.json();
    })
    .then(function(data) {
      if (data.bugs && data.bugs.length > 0) {
        showResults(data.bugs, data.tickets || [], data.submitted);
      } else if (data.error) {
        document.getElementById('abrStatus').textContent = data.error;
        showRetry();
      } else {
        document.getElementById('abrStatus').textContent = 'Could not process report.';
        showRetry();
      }
    })
    .catch(function(err) {
      console.error('[BugReporter] Error:', err);
      document.getElementById('abrStatus').textContent = 'Failed: ' + err.message;
      showRetry();
    });
  }

  function showResults(bugs, tickets, submitted) {
    var preview = document.getElementById('abrPreview');
    var count = bugs.length;
    var ticketIds = tickets.map(function(t) { return '#' + t.ticket_id; }).join(', ');

    if (submitted && tickets.length > 0) {
      document.getElementById('abrStatus').textContent =
        '\u2705 ' + count + (count === 1 ? ' ticket' : ' tickets') + ' submitted! (' + ticketIds + ')';
    } else {
      document.getElementById('abrStatus').textContent =
        'Parsed ' + count + (count === 1 ? ' bug' : ' bugs') + ':';
    }

    preview.innerHTML = bugs.map(function(bug, i) {
      return '<div class="abr-preview">' +
        '<h3>' + escapeHtml(bug.title || 'Bug Report') + '</h3>' +
        '<div class="field"><div class="label">What happened</div><div class="value">' + escapeHtml(bug.what_happened || '') + '</div></div>' +
        '<div class="field"><div class="label">Expected</div><div class="value">' + escapeHtml(bug.expected || '') + '</div></div>' +
        (bug.steps ? '<div class="field"><div class="label">Steps</div><div class="value">' + escapeHtml(bug.steps) + '</div></div>' : '') +
        '<div class="field"><div class="label">Severity</div><div class="value">' + escapeHtml(bug.severity || 'medium') + '</div></div>' +
      '</div>';
    }).join('');

    document.getElementById('abrActions').innerHTML =
      '<button class="abr-done" onclick="window._abrClose()">Done</button>';
  }

  function showRetry() {
    document.getElementById('abrTranscript').style.display = '';
    var mic = document.getElementById('abrMicBtn');
    if (mic) mic.style.display = '';
    document.getElementById('abrActions').innerHTML =
      '<button class="abr-submit" onclick="window._abrSubmit()">Try Again</button>';
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window._abrToggleRecord = toggleRecord;
  window._abrClose = closeOverlay;
  window._abrReset = resetState;
  window._abrSubmit = submit;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
