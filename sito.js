// =====================================================================================
// CONFIGURAZIONE DEL SITO: unico punto da modificare
// =====================================================================================
var SM_CONFIG = {
  PIXEL_ID: '942098881955871',   // Meta Pixel "SwitchManager sito"
  // le richieste dei moduli arrivano nel Foglio Google dell'editore, scheda "Richieste"
  DESTINAZIONE: 'https://script.google.com/macros/s/AKfycby_mgLsuPlT4xTHtmFmE717bRmoVfCvl5WozujGseCcHpLIkouv9jDrv6sXRZ14KK5ztA/exec'
};

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
