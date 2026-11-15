(function () {
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var qr = document.getElementById('qr');
  if (qr) {
    var n = 21, seed = 7, html = '';
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var finder = function (r, c) {
      var o = [[0, 0], [0, 14], [14, 0]];
      for (var i = 0; i < 3; i++) {
        var yy = r - o[i][0], xx = c - o[i][1];
        if (yy >= 0 && yy < 7 && xx >= 0 && xx < 7) {
          return (yy === 0 || yy === 6 || xx === 0 || xx === 6 || (yy >= 2 && yy <= 4 && xx >= 2 && xx <= 4)) ? 1 : 0;
        }
      }
      return -1;
    };
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var f = finder(r, c);
        var on = f === -1 ? rnd() > .52 : f === 1;
        html += on ? '<i></i>' : '<b></b>';
      }
    }
    qr.innerHTML = html;
  }

  var calc = document.getElementById('calc');
  if (calc) {
    var lang = document.documentElement.lang === 'en' ? 'en-IE' : 'de-AT';
    var fmt = new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' });
    var price = document.getElementById('cPrice');
    var qty = document.getElementById('cQty');
    var update = function () {
      var p = Math.max(0, parseFloat(String(price.value).replace(',', '.')) || 0);
      var q = Math.max(0, Math.floor(parseFloat(qty.value) || 0));
      document.getElementById('oBuyer').textContent = fmt.format(p + Math.min(2.49, 1.29 + Math.round(p * 2) / 100));
      document.getElementById('oFee').textContent = fmt.format(0);
      document.getElementById('oPerTicket').textContent = fmt.format(p);
      document.getElementById('oTotal').textContent = fmt.format(p * q);
    };
    price.addEventListener('input', update);
    qty.addEventListener('input', update);
    update();
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
(function () {
  var en = document.documentElement.lang === 'en';
  var base = '/';
  var bar = document.createElement('div');
  bar.className = 'launch-bar';
  bar.innerHTML = en
    ? '<div class="wrap"><span><strong>Milligate launches soon</strong> on the App Store and Google Play. Organizers can already set up their events.</span><a href="' + base + 'partner/">Set up your event</a><a href="' + base + 'warteliste/">Notify me</a></div>'
    : '<div class="wrap"><span><strong>Milligate startet in Kürze</strong> im App Store und bei Google Play. Veranstalter können ihr Event schon jetzt anlegen.</span><a href="' + base + 'partner/">Event anlegen</a><a href="' + base + 'warteliste/">Zum Start benachrichtigen</a></div>';
  var top = document.querySelector('header.top');
  if (top) top.parentNode.insertBefore(bar, top);

  var ENDPOINT = 'https://efqintcnqarnigsqvnoo.supabase.co/functions/v1/website-forms';
  var forms = document.querySelectorAll('form[data-form]');
  Array.prototype.forEach.call(forms, function (form) {
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'form-msg';
      msg.textContent = '';
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll('input[required]:not([type="checkbox"])'), function (el) {
        var bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()));
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) ok = false;
      });
      var consent = form.querySelector('input[name="consent"]');
      consent.closest('.check').classList.toggle('invalid', !consent.checked);
      if (!consent.checked) ok = false;
      if (!ok) {
        msg.className = 'form-msg err';
        msg.textContent = 'Bitte fülle die Pflichtfelder aus und bestätige die Einwilligung.';
        return;
      }
      var data = { type: form.getAttribute('data-form'), consent: true, source: (location.pathname + location.search).slice(0, 80) };
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name && el.name !== 'consent') data[el.name] = el.value;
      });
      btn.disabled = true;
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.body && res.body.error);
          form.reset();
          msg.className = 'form-msg ok';
          msg.textContent = data.type === 'waitlist'
            ? 'Fast geschafft! Wir haben dir eine E-Mail geschickt. Bitte bestätige deine Adresse über den Link darin.'
            : 'Danke! Deine Anfrage ist angekommen. Ich melde mich innerhalb von 24 Stunden bei dir.';
        })
        .catch(function (err) {
          msg.className = 'form-msg err';
          msg.textContent = err && err.message === 'invalid_email'
            ? 'Bitte gib eine gültige E-Mail-Adresse ein.'
            : 'Das hat leider nicht geklappt. Bitte versuch es noch einmal oder schreib an ketaneren@gmail.com.';
        })
        .then(function () { btn.disabled = false; });
    });
  });

  var box = document.getElementById('waitStatus');
  if (box) {
    var st = new URLSearchParams(location.search).get('status');
    var texts = {
      bestaetigt: ['ok', 'Danke, deine E-Mail-Adresse ist bestätigt. Wir melden uns zum Start der App!'],
      abgemeldet: ['ok', 'Du wurdest abgemeldet und bekommst keine E-Mails mehr von uns.'],
      ungueltig: ['err', 'Dieser Link ist ungültig oder abgelaufen. Trag dich einfach noch einmal ein.']
    };
    if (texts[st]) {
      box.className = 'status-box ' + texts[st][0];
      box.textContent = texts[st][1];
      box.hidden = false;
    }
  }
})();
