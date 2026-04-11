/* ================================================================
   RUMBO — main.js
   ================================================================ */

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

/* --- FAQ: cambio de grupo --- */
function faqFilter(group, btn) {
  document.querySelectorAll('.faq-filter').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.faq-group').forEach(function (g) { g.classList.remove('active'); });
  document.querySelector('.faq-group[data-group="' + group + '"]').classList.add('active');
  document.querySelectorAll('.faq-answer').forEach(function (a) { a.classList.remove('open'); });
  document.querySelectorAll('.faq-btn').forEach(function (b) { b.classList.remove('open'); });
}

/* --- FAQ: acordeón --- */
function toggleFAQ(btn) {
  var answer = btn.nextElementSibling;
  var isOpen = answer.classList.contains('open');
  var group  = btn.closest('.faq-group');
  group.querySelectorAll('.faq-answer').forEach(function (a) { a.classList.remove('open'); });
  group.querySelectorAll('.faq-btn').forEach(function (b) { b.classList.remove('open'); });
  if (!isOpen) { answer.classList.add('open'); btn.classList.add('open'); }
}

/* --- Protección fotos de equipo (clic derecho y arrastre) --- */
document.querySelectorAll('.team-avatar').forEach(function (el) {
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  el.addEventListener('dragstart',   function (e) { e.preventDefault(); });
});

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
  updateButtons(name);
}

function getVisible(name) {
  var w = window.innerWidth;
  if (name === 'activities') return w <= 600 ? 1 : w <= 992 ? 2 : 3;
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
  var slides   = c.track.children.length;
  var maxIndex = Math.max(0, slides - getVisible(name));
  c.index = Math.min(Math.max(c.index + dir, 0), maxIndex);
  c.track.style.transform = 'translateX(-' + (100 / slides) * c.index + '%)';
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
