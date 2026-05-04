/* ================================================================
   RUMBO — main.js
   ================================================================ */

/* --- Toggle QR donación --- */
function toggleQR(btn) {
  var panel = btn.nextElementSibling;
  var open  = btn.getAttribute('aria-expanded') === 'true';
  if (open) {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 14h3M14 17v3"/></svg> Yape / Plin';
  } else {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cerrar';
  }
}

/* --- Año automático --- */
document.getElementById('year').textContent = new Date().getFullYear();

/* --- Navbar scroll --- */
var navbar = document.getElementById('navbar');
window.addEventListener('scroll', function () {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* --- Menú móvil --- */
var navToggle  = document.getElementById('navToggle');
var mobileMenu = document.getElementById('mobileMenu');
navToggle.addEventListener('click', function () {
  mobileMenu.classList.toggle('open');
  navToggle.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
});
mobileMenu.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', function () {
    mobileMenu.classList.remove('open');
    navToggle.textContent = '☰';
  });
});

/* --- FAQ: tabs con nuevo diseño --- */
(function () {
  var tabs = document.querySelectorAll('#faqTabs .faq-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var group = tab.dataset.group;
      document.querySelectorAll('.faq-group').forEach(function (g) {
        g.classList.toggle('active', g.dataset.group === group);
      });
    });
  });
})();

/* --- Niveles: reveal-on-scroll y dots --- */
(function () {
  /* Reveal .in en niv-section y pil-section */
  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.niv-section, .pil-section').forEach(function (s) { revealIO.observe(s); });
  } else {
    document.querySelectorAll('.niv-section, .pil-section').forEach(function (s) { s.classList.add('in'); });
  }

  /* Dots scroll-sync del carrusel móvil de niveles */
  var track = document.getElementById('nivTrack');
  var dots  = document.querySelectorAll('#nivDots .niv-dot');
  if (!track || !dots.length) return;
  var raf = 0;
  track.addEventListener('scroll', function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var cards = track.querySelectorAll('.niv-card');
      var center = track.getBoundingClientRect().left + track.getBoundingClientRect().width / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === best); });
    });
  }, { passive: true });
  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      var i = +d.dataset.i;
      var card = track.querySelectorAll('.niv-card')[i];
      if (card) { track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: 'smooth' }); }
    });
  });
})();

/* --- Protección fotos de equipo (clic derecho y arrastre) --- */
document.querySelectorAll('.team-avatar').forEach(function (el) {
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  el.addEventListener('dragstart',   function (e) { e.preventDefault(); });
});

/* --- Mini-carruseles de fotos dentro de cada tarjeta de actividad ---
   Detecta automáticamente cuántas fotos hay en cada .mini-photos.
   Si hay solo 1 foto, no hace nada. Si hay 2 o más, crea los dots.
*/
var miniCarousels = [];
var autoplayTimer  = null;
var AUTOPLAY_MS    = 3000;

function initMiniCarousels() {
  document.querySelectorAll('.mini-photos').forEach(function (container) {
    var imgs = Array.prototype.slice.call(container.querySelectorAll('img'));
    if (imgs.length < 2) return;

    var track = document.createElement('div');
    track.className = 'mini-track';
    imgs.forEach(function (img) { track.appendChild(img); });
    container.appendChild(track);

    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'mini-dots';

    var mc = { track: track, dots: dotsWrap, index: 0, total: imgs.length };
    miniCarousels.push(mc);

    imgs.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'mini-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Foto ' + (i + 1));
      dot.addEventListener('click', (function (idx) {
        return function () { goMiniSlide(mc, idx); };
      })(i));
      dotsWrap.appendChild(dot);
    });
    container.appendChild(dotsWrap);
  });
}

function goMiniSlide(mc, index) {
  mc.index = index;
  mc.track.style.transform = 'translateX(-' + (100 * index) + '%)';
  Array.prototype.forEach.call(mc.dots.children, function (d, i) {
    d.classList.toggle('active', i === index);
  });
}

function tickAutoplay() {
  miniCarousels.forEach(function (mc) {
    goMiniSlide(mc, (mc.index + 1) % mc.total);
  });
}

initMiniCarousels();

/* Leer configuración de auto-avance desde el atributo data-autoplay de la sección */
var actSection = document.getElementById('actividades');
if (actSection && actSection.dataset.autoplay === 'true') {
  AUTOPLAY_MS   = parseInt(actSection.dataset.autoplayMs, 10) || 3000;
  autoplayTimer = setInterval(tickAutoplay, AUTOPLAY_MS);
}

/* --- Carruseles ---
   Los botones ‹ › están en .carousel-section-inner (fuera del overflow).
   updateButtons oculta el botón cuando no hay más slides en esa dirección.
*/
var carousels = {};

function initCarousel(name, trackId, outerId) {
  var track   = document.getElementById(trackId);
  var outer   = document.getElementById(outerId);
  if (!track || !outer) return;
  var btnPrev = outer.querySelector('.prev');
  var btnNext = outer.querySelector('.next');

  /* Un solo slide: centrar y ocultar botones */
  if (track.children.length === 1) {
    track.classList.add('single');
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
  }

  carousels[name] = { track: track, btnPrev: btnPrev, btnNext: btnNext, index: 0 };
  applyCentering(name);
  updateButtons(name);
}

function applyCentering(name) {
  var c = carousels[name];
  if (!c || c.track.classList.contains('single')) return;
  var few = c.track.children.length <= getVisible(name);
  c.track.classList.toggle('carousel-centered', few);
  if (c.btnPrev) c.btnPrev.style.display = few ? 'none' : '';
  if (c.btnNext) c.btnNext.style.display = few ? 'none' : '';
}

function getVisible(name) {
  var w = window.innerWidth;
  if (name === 'activities') return w <= 600 ? 1 : 2;
  return w <= 600 ? 1 : w <= 992 ? 2 : 4;
}

function updateButtons(name) {
  var c = carousels[name];
  if (!c) return;
  var maxIndex = Math.max(0, c.track.children.length - getVisible(name));
  if (c.btnPrev) c.btnPrev.classList.toggle('btn-hidden', c.index <= 0);
  if (c.btnNext) c.btnNext.classList.toggle('btn-hidden', c.index >= maxIndex);
}

function slideCarousel(name, dir) {
  var c = carousels[name];
  if (!c || c.track.classList.contains('single')) return;
  var slides     = c.track.children.length;
  var visible    = getVisible(name);
  var maxIndex   = Math.max(0, slides - visible);
  c.index = Math.min(Math.max(c.index + dir, 0), maxIndex);
  var slideWidth = c.track.parentElement.offsetWidth / visible;
  c.track.style.transform = 'translateX(-' + slideWidth * c.index + 'px)';
  updateButtons(name);
}

initCarousel('activities', 'activities-track', 'act-outer');
initCarousel('team',       'team-track',       'team-outer');

window.addEventListener('resize', function () {
  ['activities', 'team'].forEach(function (name) {
    var c = carousels[name];
    if (!c || c.track.classList.contains('single')) return;
    c.index = 0;
    c.track.style.transform = '';
    applyCentering(name);
    updateButtons(name);
  });
});

/* --- Animaciones scroll (IntersectionObserver) ---
   threshold bajo (0.05) y rootMargin amplio para que los elementos
   en el viewport al cargar también se muestren.
*/
if ('IntersectionObserver' in window) {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); /* una sola vez */
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.fade-up, .problem-item').forEach(function (el) {
    observer.observe(el);
  });
} else {
  /* Fallback: mostrar todo si IntersectionObserver no está disponible */
  document.querySelectorAll('.fade-up, .problem-item').forEach(function (el) {
    el.classList.add('visible');
  });
}

/* --- Formulario de contacto --- */
function handleContactForm(event) {
  event.preventDefault();
  var form   = event.target;
  var action = form.action;
  if (action.includes('XXXXXXXX')) {
    var nombre  = form.nombre.value;
    var email   = form.email.value;
    var mensaje = form.mensaje.value;
    var subject = encodeURIComponent('Contacto desde rumbo.org.pe — ' + nombre);
    var body    = encodeURIComponent('Nombre: ' + nombre + '\nEmail: ' + email + '\n\n' + mensaje);
    window.location.href = 'mailto:rumbo.transformatufuturo@gmail.com?subject=' + subject + '&body=' + body;
  } else {
    fetch(action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (r.ok) {
        form.reset();
        document.getElementById('formSuccess').style.display = 'block';
      }
    });
  }
}
