// =====================================================================================
// CONFIGURAZIONE DEL SITO: unico punto da modificare
// =====================================================================================
var SM_CONFIG = {
  // Offerta lancio: true = fascia in alto e prezzi lancio sul sito; false = prezzi normali (l'offerta si chiude a mano).
  // Chi ha già comprato col lancio continua a rinnovare a quel prezzo anche dopo: il programma apre il sito con ?pc=...
  OFFERTA_LANCIO: true,
  LINK: {
    annuale: 'https://buy.stripe.com/9B600k3qWbEJ0TF1UFa3u00',          // 290 € / 12 mesi
    mensile: 'https://buy.stripe.com/bJebJ2d1w105aufbvfa3u01',          // 29 € / 1 mese
    lancio_annuale: 'https://buy.stripe.com/14A4gAe5A6kp59Vbvfa3u02',                                                // 99 € / 12 mesi
    lancio_mensile: 'https://buy.stripe.com/cNi00k8LgaAF0TFfLva3u03'                                                // 11 € / 1 mese
  },
  PIXEL_ID: '942098881955871',   // Meta Pixel "SwitchManager sito"
  // le richieste dei moduli arrivano nel Foglio Google dell'editore, scheda "Richieste"
  DESTINAZIONE: 'https://script.google.com/macros/s/AKfycby_mgLsuPlT4xTHtmFmE717bRmoVfCvl5WozujGseCcHpLIkouv9jDrv6sXRZ14KK5ztA/exec'
};

// =====================================================================================
// Offerta lancio: la classe "lancio" su <html> si decide subito (prima del disegno: niente salti di layout).
// Con ?pc=CODICE (link dal programma) i pulsanti di acquisto portano il codice PC a Stripe e, a offerta
// chiusa, chi ha già comprato col lancio rivede i suoi prezzi (lo chiede allo script delle vendite).
// =====================================================================================
(function () {
  var q = new URLSearchParams(location.search), pc = (q.get('pc') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14);
  try { if (pc) sessionStorage.setItem('sm_pc', pc); else pc = sessionStorage.getItem('sm_pc') || ''; } catch (e) { }
  var L = SM_CONFIG.LINK, pronti = !!(L.lancio_annuale && L.lancio_mensile);
  if (SM_CONFIG.OFFERTA_LANCIO && pronti) document.documentElement.classList.add('lancio', 'lancio-aperta');

  var st = document.createElement('style');
  st.textContent = 'html:not(.lancio) .solo-lancio{display:none!important}html.lancio .solo-normale{display:none!important}' +
    'html:not(.lancio-aperta) .fascia-lancio{display:none}' +
    '.fascia-lancio{background:linear-gradient(135deg,#4f46e5,#059669);color:#fff;font:600 14.5px/1.45 "Segoe UI",system-ui,sans-serif}' +
    '.fascia-lancio div{max-width:1160px;margin:0 auto;padding:9px 20px;display:flex;gap:10px 16px;align-items:center;justify-content:center;flex-wrap:wrap;text-align:center}' +
    '.fascia-lancio a{color:#4338ca;background:#fff;border-radius:99px;padding:5px 14px;font-weight:800;text-decoration:none;white-space:nowrap}';
  document.head.appendChild(st);

  function collega() {
    document.querySelectorAll('[data-link]').forEach(function (a) {
      var u = L[a.getAttribute('data-link')];
      if (u) a.href = u + (pc ? (u.indexOf('?') < 0 ? '?' : '&') + 'client_reference_id=' + encodeURIComponent(pc) : '');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', collega); else collega();

  // offerta chiusa: un cliente lancio che rinnova dal programma rivede i prezzi lancio
  if (pc && pronti && !SM_CONFIG.OFFERTA_LANCIO && window.fetch) {
    fetch(SM_CONFIG.DESTINAZIONE + '?azione=listino&pc=' + encodeURIComponent(pc)).then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.lancio) document.documentElement.classList.add('lancio'); }).catch(function () { });
  }
})();

// =====================================================================================
// Animazioni allo scorrimento (solo pagina principale). La classe js-anim si aggiunge subito,
// prima che la pagina venga disegnata: senza JavaScript o con "riduci movimento" tutto resta visibile.
// =====================================================================================
(function () {
  var fermo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fermo && 'IntersectionObserver' in window) document.documentElement.classList.add('js-anim');

  function avvia() {
    var header = document.querySelector('header.top');
    if (!header || !document.querySelector('.hero')) return;   // altre pagine: niente animazioni
    var desktop = matchMedia('(min-width: 768px)').matches;

    // barra di avanzamento della lettura
    var barra = document.createElement('div');
    barra.className = 'avanzamento'; barra.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barra);

    var schermo = document.querySelector('.hero .schermo');
    var come = document.getElementById('come');
    var passi = come ? come.querySelectorAll('.passo') : [];
    var linea = null;
    if (passi.length > 1) {
      linea = document.createElement('div');
      linea.className = 'linea-passi'; linea.setAttribute('aria-hidden', 'true');
      come.querySelector('.wrap').appendChild(linea);
    }
    function posizionaLinea() {
      if (!linea) return;
      var primo = passi[0], ultimo = passi[passi.length - 1];
      linea.style.top = primo.offsetTop + 'px';
      linea.style.height = (ultimo.offsetTop + ultimo.offsetHeight - primo.offsetTop) + 'px';
    }
    posizionaLinea();
    addEventListener('resize', posizionaLinea);
    addEventListener('load', posizionaLinea);

    var attesa = false;
    function aggiorna() {
      attesa = false;
      var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      header.classList.toggle('compatta', y > 40);
      barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (fermo) return;
      if (schermo && desktop) {
        var p = Math.min(1, y / 400);
        schermo.style.transform = p >= 1 ? 'none'
          : 'perspective(1400px) rotateX(' + (10 * (1 - p)).toFixed(2) + 'deg) scale(' + (0.96 + 0.04 * p).toFixed(4) + ')';
      }
      if (linea) {
        var r = come.getBoundingClientRect();
        var q = Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top - linea.offsetTop) / linea.offsetHeight));
        linea.style.transform = 'scaleY(' + q.toFixed(3) + ')';
      }
    }
    addEventListener('scroll', function () { if (!attesa) { attesa = true; requestAnimationFrame(aggiorna); } }, { passive: true });
    aggiorna();

    // cronometro: da 0:00 a 1:48 la prima volta che entra in vista
    var crono = document.getElementById('cronometro');
    function contaCronometro() {
      var fine = 108, durata = 1400, t0 = performance.now();
      (function passo(t) {
        var p = Math.min(1, (t - t0) / durata), s = Math.round(fine * (1 - Math.pow(1 - p, 3)));
        crono.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
        if (p < 1) requestAnimationFrame(passo);
      })(t0);
    }

    // domande: apertura e chiusura fluida
    if (!fermo && Element.prototype.animate) document.querySelectorAll('#domande details').forEach(function (d) {
      var s = d.querySelector('summary');
      s.addEventListener('click', function (e) {
        e.preventDefault();
        if (d._anim) d._anim.cancel();
        var da = d.offsetHeight, a;
        if (d.open) {
          var cs = getComputedStyle(d);
          d.classList.add('chiusura');
          a = s.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
        }
        else { d.open = true; a = d.offsetHeight; }
        d._anim = d.animate({ height: [da + 'px', a + 'px'] }, { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
        d._anim.onfinish = function () { d._anim = null; if (d.classList.contains('chiusura')) { d.open = false; d.classList.remove('chiusura'); } };
      });
    });

    if (fermo || !('IntersectionObserver' in window)) return;

    // ritardi in sequenza dentro ogni gruppo
    [['.punti > div'], ['.funzioni > div'], ['.prezzi .piano']].forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (el, i) { el.style.setProperty('--i', i); });
    });
    var bersagli = '.punti > div, #come h2, #come .intro, .passo .testo, .passo .immagine, #funzioni h2, #funzioni .intro, .funzioni > div,' +
      ' #prezzi h2, #prezzi .intro, #prezzi .etichetta, .piano, #domande h2, #domande details, #prova h2, #prova form, #prova .btn.primary, .schermo .barra';
    var oss = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        var el = v.target;
        el.classList.add('in');
        oss.unobserve(el);
        if (el.classList.contains('barra') && crono) contaCronometro();
        if (el.matches('.funzioni > div')) setTimeout(function () { el.classList.add('fatto-in'); }, 900);
      });
    }, { threshold: 0.15 });
    if (crono) crono.textContent = '0:00';
    document.querySelectorAll(bersagli).forEach(function (el) { oss.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();
})();

// =====================================================================================
// Consenso cookie, Meta Pixel, UTM. Il Pixel si carica solo dopo "Accetta".
// =====================================================================================
(function () {
  var CHIAVE = 'sm_consenso_cookie';
  function leggi(k, s) { try { return (s || localStorage).getItem(k); } catch (e) { return null; } }
  function scrivi(k, v, s) { try { (s || localStorage).setItem(k, v); } catch (e) { } }

  // UTM: si salvano all'arrivo e accompagnano ogni contatto inviato dai moduli
  var q = new URLSearchParams(location.search);
  ['utm_source', 'utm_campaign', 'utm_content'].forEach(function (k) {
    if (q.get(k)) scrivi(k, q.get(k).slice(0, 200), sessionStorage);
  });
  function utm() {
    var o = {};
    ['utm_source', 'utm_campaign', 'utm_content'].forEach(function (k) { o[k] = leggi(k, sessionStorage) || ''; });
    return o;
  }

  var pixelAttivo = false, inAttesa = [];   // eventi avvenuti prima della scelta sul banner
  function avviaPixel() {
    if (pixelAttivo || !SM_CONFIG.PIXEL_ID) return;
    pixelAttivo = true;
    /* codice base Meta Pixel */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', SM_CONFIG.PIXEL_ID);
    fbq('track', 'PageView');
    inAttesa.splice(0).forEach(function (e) { traccia(e[0], e[1]); });
  }

  // eventi standard (Lead, InitiateCheckout...) o personalizzati (DownloadTrial)
  var STANDARD = ['Lead', 'InitiateCheckout', 'Contact', 'CompleteRegistration', 'Purchase', 'ViewContent'];
  function traccia(nome, dati) {
    if (!pixelAttivo) { if (leggi(CHIAVE) !== 'no') inAttesa.push([nome, dati]); return; }
    fbq(STANDARD.indexOf(nome) >= 0 ? 'track' : 'trackCustom', nome, dati || {});
  }

  function banner() {
    if (document.getElementById('sm-cookie')) return;
    var st = document.createElement('style');
    st.textContent = '#sm-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:999;max-width:560px;margin:0 auto;' +
      'background:#0f172a;color:#e6e9f2;border-radius:16px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.35);' +
      'font:15px/1.5 "Segoe UI",system-ui,sans-serif}#sm-cookie p{margin:0 0 12px;color:#cbd5e1}#sm-cookie a{color:#a5b4fc}' +
      '#sm-cookie div{display:flex;gap:10px;flex-wrap:wrap}#sm-cookie button{font:inherit;font-weight:700;border:0;border-radius:10px;' +
      'padding:9px 16px;cursor:pointer}#sm-cookie .si{background:#4f46e5;color:#fff}#sm-cookie .no{background:#334155;color:#e6e9f2}';
    document.head.appendChild(st);
    var b = document.createElement('div');
    b.id = 'sm-cookie'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Consenso cookie');
    b.innerHTML = '<p>Usiamo i cookie di <b>Meta Pixel</b> per misurare l\'efficacia delle nostre pubblicità su Instagram e Facebook. ' +
      'Si attivano solo se accetti. <a href="privacy.html#cookie">Informativa</a></p>' +
      '<div><button class="si" type="button">Accetta</button><button class="no" type="button">Rifiuta</button></div>';
    b.querySelector('.si').onclick = function () { scrivi(CHIAVE, 'si'); b.remove(); avviaPixel(); };
    b.querySelector('.no').onclick = function () { scrivi(CHIAVE, 'no'); b.remove(); };
    document.body.appendChild(b);
  }

  window.SM = {
    config: SM_CONFIG,
    traccia: traccia,
    utm: utm,
    // per il link "Preferenze cookie": revocare il consenso ricarica la pagina senza Pixel
    preferenzeCookie: function () {
      if (leggi(CHIAVE) === 'si') { scrivi(CHIAVE, 'no'); location.reload(); } else { banner(); }
    }
  };

  var c = leggi(CHIAVE);
  if (c === 'si') avviaPixel();
  else if (c !== 'no') {
    if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner);
  }
})();
