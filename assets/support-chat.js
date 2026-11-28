(function () {
  if (window.__mgSupportChat) return;
  window.__mgSupportChat = true;

  var ENDPOINT = 'https://efqintcnqarnigsqvnoo.supabase.co/functions/v1/support-chat';
  var TURNSTILE_SITE_KEY = '';
  var CONTACT = 'support@milligateapp.com';
  var MAX_CHARS = 600;
  var MAX_HISTORY = 10;

  var en = document.documentElement.lang === 'en';
  var lang = en ? 'en' : 'de';
  var T = en ? {
    open: 'Open support chat',
    launcher: 'Help',
    title: 'Milligate Support',
    badge: 'AI assistant',
    close: 'Close chat',
    notice: 'You are chatting with an AI. Answers may contain mistakes. For personal help: request a human.',
    privacy: 'Privacy policy',
    start: 'Start chat',
    human: 'Request a human',
    placeholder: 'Ask a question…',
    send: 'Send',
    you: 'You',
    ai: 'AI',
    aiLong: 'Answer from the AI assistant',
    typing: 'The AI assistant is writing…',
    verifying: 'Running security check…',
    hello: 'Hi! I am the Milligate AI assistant. I can answer general questions about tickets, events and the Creator Studio. I cannot see orders or accounts.',
    hoTitle: 'Request a human',
    hoIntro: 'Our support team will reply by email, usually within 1–2 business days. Please do not enter passwords or card details.',
    hoEmail: 'Your email address',
    hoTopic: 'Your request',
    hoTranscript: 'Include this chat in the request',
    hoSend: 'Send request',
    hoCancel: 'Back to chat',
    hoInvalid: 'Please enter a valid email address and describe your request.',
    error: 'That did not work. Please try again or write to ' + CONTACT + '.',
    tooLong: 'Please keep your message under ' + MAX_CHARS + ' characters.',
    chars: 'characters left'
  } : {
    open: 'Support-Chat öffnen',
    launcher: 'Hilfe',
    title: 'Milligate Support',
    badge: 'KI-Assistent',
    close: 'Chat schließen',
    notice: 'Du chattest mit einer KI. Antworten können Fehler enthalten. Für persönliche Hilfe: Mensch anfordern.',
    privacy: 'Datenschutz',
    start: 'Chat starten',
    human: 'Mensch anfordern',
    placeholder: 'Stell deine Frage…',
    send: 'Senden',
    you: 'Du',
    ai: 'KI',
    aiLong: 'Antwort des KI-Assistenten',
    typing: 'Der KI-Assistent schreibt…',
    verifying: 'Sicherheitsprüfung läuft…',
    hello: 'Hallo! Ich bin der KI-Assistent von Milligate. Ich beantworte allgemeine Fragen zu Tickets, Events und dem Creator Studio. Bestellungen und Konten kann ich nicht einsehen.',
    hoTitle: 'Mensch anfordern',
    hoIntro: 'Unser Support-Team antwortet per E-Mail, in der Regel innerhalb von 1–2 Werktagen. Bitte keine Passwörter oder Kartendaten eingeben.',
    hoEmail: 'Deine E-Mail-Adresse',
    hoTopic: 'Dein Anliegen',
    hoTranscript: 'Diesen Chatverlauf mitsenden',
    hoSend: 'Anfrage senden',
    hoCancel: 'Zurück zum Chat',
    hoInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein und beschreib dein Anliegen.',
    error: 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib an ' + CONTACT + '.',
    tooLong: 'Bitte halte deine Nachricht unter ' + MAX_CHARS + ' Zeichen.',
    chars: 'Zeichen übrig'
  };
  var privacyHref = en ? '/en/privacy/' : '/datenschutz/';

  var base = (document.currentScript && document.currentScript.src) || '/assets/support-chat.js';
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = base.replace(/support-chat\.js.*$/, 'support-chat.css');
  document.head.appendChild(css);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function linkify(target, text) {
    var re = /(?<![@\w.\/])(https?:\/\/)?((?:www\.|studio\.)?milligateapp\.com(?:\/[^\s,;)]*)?)/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      var url = m[2].replace(/[.!?]+$/, '');
      if (m.index > last) target.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = el('a', null, url);
      a.href = 'https://' + url;
      a.rel = 'noopener';
      if (url.indexOf('studio.') === 0) a.target = '_blank';
      target.appendChild(a);
      last = m.index + (m[1] || '').length + url.length;
      re.lastIndex = last;
    }
    if (last < text.length) target.appendChild(document.createTextNode(text.slice(last)));
  }

  var history = [];
  var session = null;
  var tsToken = null;
  var tsWidget = null;
  var tsWaiters = [];
  var busy = false;
  var started = false;

  var launcher = el('button', 'mgsc-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-label', T.open);
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'mgsc-panel');
  launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>';
  launcher.appendChild(el('span', null, T.launcher));

  var panel = el('div', 'mgsc-panel');
  panel.id = 'mgsc-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'mgsc-title');

  var head = el('div', 'mgsc-head');
  var titleWrap = el('div', 'mgsc-title-wrap');
  var title = el('h2', 'mgsc-title', T.title);
  title.id = 'mgsc-title';
  titleWrap.appendChild(title);
  titleWrap.appendChild(el('span', 'mgsc-badge', T.badge));
  var closeBtn = el('button', 'mgsc-icon');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', T.close);
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  head.appendChild(titleWrap);
  head.appendChild(closeBtn);

  var notice = el('div', 'mgsc-notice');
  var noticeText = el('p', null, T.notice + ' ');
  var privacy = el('a', null, T.privacy);
  privacy.href = privacyHref;
  noticeText.appendChild(privacy);
  notice.appendChild(noticeText);

  var intro = el('div', 'mgsc-intro');
  var startBtn = el('button', 'btn btn-grad btn-sm', T.start);
  startBtn.type = 'button';
  intro.appendChild(startBtn);

  var log = el('div', 'mgsc-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-relevant', 'additions');
  log.hidden = true;

  var status = el('p', 'mgsc-status');
  status.setAttribute('role', 'status');

  var ts = el('div', 'mgsc-ts');

  var form = el('form', 'mgsc-form');
  form.hidden = true;
  var inputId = 'mgsc-input';
  var inputLabel = el('label', 'mgsc-sr', T.placeholder);
  inputLabel.htmlFor = inputId;
  var input = el('textarea', 'mgsc-input');
  input.id = inputId;
  input.rows = 2;
  input.maxLength = MAX_CHARS;
  input.placeholder = T.placeholder;
  input.setAttribute('aria-describedby', 'mgsc-count');
  var count = el('span', 'mgsc-count');
  count.id = 'mgsc-count';
  var sendBtn = el('button', 'btn btn-dark btn-sm mgsc-send', T.send);
  sendBtn.type = 'submit';
  form.appendChild(inputLabel);
  form.appendChild(input);
  var formRow = el('div', 'mgsc-row');
  formRow.appendChild(count);
  formRow.appendChild(sendBtn);
  form.appendChild(formRow);

  var hoForm = el('form', 'mgsc-ho');
  hoForm.hidden = true;
  hoForm.setAttribute('aria-labelledby', 'mgsc-ho-title');
  var hoTitle = el('h3', null, T.hoTitle);
  hoTitle.id = 'mgsc-ho-title';
  hoTitle.tabIndex = -1;
  hoForm.appendChild(hoTitle);
  hoForm.appendChild(el('p', 'mgsc-small', T.hoIntro));
  var hoEmailLabel = el('label', 'mgsc-label', T.hoEmail);
  var hoEmail = el('input');
  hoEmail.type = 'email';
  hoEmail.required = true;
  hoEmail.autocomplete = 'email';
  hoEmail.maxLength = 254;
  hoEmailLabel.appendChild(hoEmail);
  var hoTopicLabel = el('label', 'mgsc-label', T.hoTopic);
  var hoTopic = el('textarea');
  hoTopic.rows = 4;
  hoTopic.required = true;
  hoTopic.maxLength = 2000;
  hoTopicLabel.appendChild(hoTopic);
  var hoCheckLabel = el('label', 'mgsc-check');
  var hoCheck = el('input');
  hoCheck.type = 'checkbox';
  hoCheck.checked = true;
  hoCheckLabel.appendChild(hoCheck);
  hoCheckLabel.appendChild(el('span', null, T.hoTranscript));
  var hoMsg = el('p', 'mgsc-small mgsc-msg');
  hoMsg.setAttribute('role', 'status');
  var hoRow = el('div', 'mgsc-row');
  var hoCancel = el('button', 'btn btn-line btn-sm', T.hoCancel);
  hoCancel.type = 'button';
  var hoSend = el('button', 'btn btn-grad btn-sm', T.hoSend);
  hoSend.type = 'submit';
  hoRow.appendChild(hoCancel);
  hoRow.appendChild(hoSend);
  hoForm.appendChild(hoEmailLabel);
  hoForm.appendChild(hoTopicLabel);
  hoForm.appendChild(hoCheckLabel);
  hoForm.appendChild(hoMsg);
  hoForm.appendChild(hoRow);

  var foot = el('div', 'mgsc-foot');
  var humanBtn = el('button', 'mgsc-human', T.human);
  humanBtn.type = 'button';
  foot.appendChild(humanBtn);

  var body = el('div', 'mgsc-body');
  body.appendChild(notice);
  body.appendChild(intro);
  body.appendChild(log);
  body.appendChild(hoForm);
  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(status);
  panel.appendChild(ts);
  panel.appendChild(form);
  panel.appendChild(foot);

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  function updateCount() {
    count.textContent = (MAX_CHARS - input.value.length) + ' ' + T.chars;
  }
  updateCount();

  function addBubble(role, text) {
    var item = el('div', 'mgsc-msg-row mgsc-' + role);
    var label = el('span', 'mgsc-who', role === 'user' ? T.you : T.ai);
    if (role === 'assistant') label.setAttribute('aria-label', T.aiLong);
    var bubble = el('div', 'mgsc-bubble');
    if (role === 'assistant') linkify(bubble, text); else bubble.textContent = text;
    item.appendChild(label);
    item.appendChild(bubble);
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    launcher.classList.toggle('mgsc-hide', open);
    if (open) {
      (started ? input : startBtn).focus();
    } else {
      launcher.focus();
    }
  }

  function loadTurnstile() {
    if (!TURNSTILE_SITE_KEY || tsWidget !== null || document.getElementById('mgsc-ts-script')) return;
    window.mgscTurnstileReady = function () {
      tsWidget = window.turnstile.render(ts, {
        sitekey: TURNSTILE_SITE_KEY,
        language: lang,
        appearance: 'interaction-only',
        callback: function (token) {
          tsToken = token;
          var w = tsWaiters; tsWaiters = [];
          w.forEach(function (f) { f(); });
        },
        'expired-callback': function () { tsToken = null; },
        'error-callback': function () { tsToken = null; }
      });
    };
    var s = document.createElement('script');
    s.id = 'mgsc-ts-script';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=mgscTurnstileReady';
    s.async = true;
    document.head.appendChild(s);
  }

  function resetTurnstile() {
    tsToken = null;
    if (tsWidget !== null && window.turnstile) window.turnstile.reset(tsWidget);
  }

  function ready() {
    if (session || !TURNSTILE_SITE_KEY || tsToken) return Promise.resolve();
    status.textContent = T.verifying;
    loadTurnstile();
    return new Promise(function (resolve) {
      var done = false;
      var finish = function () { if (!done) { done = true; resolve(); } };
      tsWaiters.push(finish);
      setTimeout(finish, 20000);
    });
  }

  function call(payload) {
    return ready().then(function () {
      payload.channel = 'web';
      payload.lang = lang;
      if (session) payload.session = session;
      else if (tsToken) { payload.turnstileToken = tsToken; resetTurnstile(); }
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit'
      });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j || {} }; });
    }).then(function (res) {
      if (res.body.session) session = res.body.session;
      if (res.status === 403 && res.body.error === 'verify') session = null;
      return res;
    });
  }

  function start() {
    started = true;
    intro.hidden = true;
    log.hidden = false;
    form.hidden = false;
    addBubble('assistant', T.hello);
    loadTurnstile();
    input.focus();
  }

  function showHandover() {
    if (!started) start();
    var lastUser = '';
    for (var i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') { lastUser = history[i].content; break; }
    }
    if (!hoTopic.value) hoTopic.value = lastUser;
    hoMsg.textContent = '';
    hoMsg.className = 'mgsc-small mgsc-msg';
    log.hidden = true;
    form.hidden = true;
    hoForm.hidden = false;
    hoTitle.focus();
  }

  function hideHandover() {
    hoForm.hidden = true;
    log.hidden = false;
    form.hidden = false;
    input.focus();
  }

  function send(text, retried) {
    busy = true;
    sendBtn.disabled = true;
    status.textContent = T.typing;
    var msgs = history.slice(-MAX_HISTORY);
    call({ action: 'chat', messages: msgs }).then(function (res) {
      if (res.status === 403 && res.body.error === 'verify' && !retried && TURNSTILE_SITE_KEY) {
        return send(text, true);
      }
      var b = res.body;
      var reply = b.ok ? b.reply : (b.message || T.error);
      history.push({ role: 'assistant', content: reply });
      addBubble('assistant', reply);
      if (b.ok && b.handover) humanBtn.classList.add('mgsc-pulse');
    }).catch(function () {
      addBubble('assistant', T.error);
    }).then(function () {
      busy = false;
      sendBtn.disabled = false;
      status.textContent = '';
    });
  }

  launcher.addEventListener('click', function () { setOpen(true); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  startBtn.addEventListener('click', start);
  humanBtn.addEventListener('click', showHandover);
  hoCancel.addEventListener('click', hideHandover);
  input.addEventListener('input', updateCount);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var text = input.value.trim();
    if (!text) return;
    if (text.length > MAX_CHARS) { status.textContent = T.tooLong; return; }
    input.value = '';
    updateCount();
    history.push({ role: 'user', content: text });
    if (history.length > MAX_HISTORY * 2) history = history.slice(-MAX_HISTORY * 2);
    addBubble('user', text);
    send(text, false);
  });

  hoForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = hoEmail.value.trim();
    var topic = hoTopic.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || topic.length < 3) {
      hoMsg.className = 'mgsc-small mgsc-msg mgsc-err';
      hoMsg.textContent = T.hoInvalid;
      return;
    }
    hoSend.disabled = true;
    call({ action: 'handover', email: email, topic: topic, messages: hoCheck.checked ? history.slice(-MAX_HISTORY) : [] })
      .then(function (res) {
        var b = res.body;
        hoMsg.className = 'mgsc-small mgsc-msg ' + (b.ok ? 'mgsc-ok' : 'mgsc-err');
        hoMsg.textContent = b.message || (b.ok ? '' : T.error);
        if (b.ok) {
          hoTopic.value = '';
          humanBtn.classList.remove('mgsc-pulse');
        }
      })
      .catch(function () {
        hoMsg.className = 'mgsc-small mgsc-msg mgsc-err';
        hoMsg.textContent = T.error;
      })
      .then(function () { hoSend.disabled = false; });
  });
})();
