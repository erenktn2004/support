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
      document.getElementById('oBuyer').textContent = fmt.format(p + 0.99);
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
