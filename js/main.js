/* ================================================================
   RUMBO — main.js
   ================================================================ */

/* --- Año automático en el footer --- */
document.getElementById('year').textContent = new Date().getFullYear();

/* --- Navbar: clase "scrolled" al hacer scroll --- */
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

/* --- FAQ: acordeón --- */
function toggleFAQ(btn) {
  var answer = btn.nextElementSibling;
  var isOpen  = answer.classList.contains('open');
  /* Cierra todos */
  document.querySelectorAll('.faq-answer').forEach(function (a) { a.classList.remove('open'); });
  document.querySelectorAll('.faq-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  /* Abre el seleccionado si estaba cerrado */
  if (!isOpen) {
    answer.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

/* --- Carruseles --- */
var carousels = {
  activities: { track: document.getElementById('activities-track'), index: 0 },
  team:       { track: document.getElementById('team-track'),       index: 0 }
};

/* Añadir clase "single" si el carrusel tiene un solo slide (centra el card) */
Object.keys(carousels).forEach(function (type) {
  var track = carousels[type].track;
  if (track && track.children.length === 1) {
    track.classList.add('single');
  }
});

function getVisibleSlides(type) {
  var w = window.innerWidth;
  if (type === 'activities') return w <= 600 ? 1 : w <= 992 ? 2 : 3;
  return w <= 600 ? 1 : w <= 992 ? 2 : 4; /* team */
}

function slideCarousel(type, dir) {
  var c       = carousels[type];
  var slides  = c.track.children.length;
  var visible = getVisibleSlides(type);
  var maxIndex = Math.max(0, slides - visible);
  c.index = Math.min(Math.max(c.index + dir, 0), maxIndex);
  /* No mover si hay clase "single" */
  if (!c.track.classList.contains('single')) {
    c.track.style.transform = 'translateX(-' + (100 / slides) * c.index + '%)';
  }
}

window.addEventListener('resize', function () {
  slideCarousel('activities', 0);
  slideCarousel('team', 0);
});

/* --- Animaciones al hacer scroll (IntersectionObserver) --- */
var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up, .problem-item').forEach(function (el) {
  observer.observe(el);
});

/* --- Formulario de contacto ---
   Si Formspree está configurado (el action NO contiene XXXXXXXX),
   envía via fetch y muestra mensaje de éxito.
   Si no, abre el cliente de correo del visitante como fallback.
*/
function handleContactForm(event) {
  event.preventDefault();
  var form   = event.target;
  var action = form.action;

  if (action.includes('XXXXXXXX')) {
    /* Formspree no configurado → fallback mailto */
    var nombre  = form.nombre.value;
    var email   = form.email.value;
    var mensaje = form.mensaje.value;
    var subject = encodeURIComponent('Contacto desde rumbo.org.pe — ' + nombre);
    var body    = encodeURIComponent('Nombre: ' + nombre + '\nEmail: ' + email + '\n\n' + mensaje);
    window.location.href = 'mailto:rumbo.transformatufuturo@gmail.com?subject=' + subject + '&body=' + body;
  } else {
    /* Formspree configurado → envío silencioso */
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
