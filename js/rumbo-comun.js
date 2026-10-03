/* =====================================================================
   RUMBO · Utilidades compartidas del sistema de asesorías
   (asesorias.html, mi-reserva.html y panel.html)
   No necesitas editar este archivo.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.RUMBO_CONFIG || {};
  // Tolerancia: si se pegó la dirección con "/rest/v1/" (u otra ruta de la API)
  // o con espacios, se deja solo https://TU-PROYECTO.supabase.co
  if (CFG.supabaseUrl) {
    CFG.supabaseUrl = String(CFG.supabaseUrl).trim()
      .replace(/\/+$/, '')
      .replace(/\/(rest|auth|functions|storage)\/v1$/i, '')
      .replace(/\/+$/, '');
  }
  if (CFG.supabaseKey) CFG.supabaseKey = String(CFG.supabaseKey).trim();
  var ZONA = 'America/Lima';
  var params = new URLSearchParams(location.search);
  var configurado = !!(CFG.supabaseUrl && CFG.supabaseKey && window.supabase);
  var demo = params.get('demo') === '1';

  var cliente = null;
  if (configurado && !demo) {
    cliente = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'rumbo-panel-sesion' }
    });
  }

  /* ---------- Llamadas al servidor ---------- */
  function rpc(nombre, p) {
    if (demo) return DEMO.rpc(nombre, p || {});
    if (!cliente) return Promise.reject(new Error('El sistema de reservas aún no está conectado.'));
    return cliente.rpc(nombre, p || {}).then(function (r) {
      if (r.error) throw new Error(r.error.message || 'Error de conexión');
      return r.data;
    });
  }

  function api(accion, datos) {
    if (demo) return DEMO.api(accion, datos || {});
    if (!cliente) return Promise.reject(new Error('El sistema de reservas aún no está conectado.'));
    var body = Object.assign({ accion: accion }, datos || {});
    return cliente.functions.invoke('rumbo-api', { body: body }).then(function (r) {
      if (!r.error) return r.data;
      var ctx = r.error.context;
      if (ctx && typeof ctx.json === 'function') {
        return ctx.json().then(function (j) {
          throw new Error((j && j.error) || r.error.message);
        }, function () { throw new Error(r.error.message); });
      }
      throw new Error(r.error.message || 'No pudimos conectar con el servidor.');
    });
  }

  /* ---------- Fechas (siempre en hora de Lima) ---------- */
  var fmt = {
    clave: new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }),
    hora: new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, hour: 'numeric', minute: '2-digit', hour12: true }),
    hora24: new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false }),
    larga: new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long' }),
    corta: new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, weekday: 'short', day: 'numeric', month: 'short' }),
    mes: new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, month: 'long', year: 'numeric' }),
    fechaHora: new Intl.DateTimeFormat('es-PE', { timeZone: ZONA, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function aFecha(x) { return x instanceof Date ? x : new Date(x); }

  var F = {
    ZONA: ZONA,
    clave: function (x) { return fmt.clave.format(aFecha(x)); },                     // 2026-10-03
    hoy: function () { return fmt.clave.format(new Date()); },
    hora: function (x) { return fmt.hora.format(aFecha(x)).replace(/\s/g, ' '); },   // 7:00 p. m.
    hora24: function (x) { return fmt.hora24.format(aFecha(x)); },                   // 19:00
    larga: function (x) { return cap(fmt.larga.format(aFecha(x))); },                // Sábado, 3 de octubre
    corta: function (x) { return cap(fmt.corta.format(aFecha(x))); },                // Sáb, 3 oct
    mes: function (x) { return cap(fmt.mes.format(aFecha(x))); },
    fechaHora: function (x) { return fmt.fechaHora.format(aFecha(x)); },
    completa: function (x) { return F.larga(x) + ' · ' + F.hora(x); },
    // Instante (Date) a partir de "YYYY-MM-DD" + hora local de Lima (Lima = UTC−5, sin horario de verano)
    instante: function (clave, h, m) {
      return new Date(clave + 'T' + String(h).padStart(2, '0') + ':' + String(m || 0).padStart(2, '0') + ':00-05:00');
    },
    sumarDias: function (clave, n) {
      var d = new Date(clave + 'T12:00:00-05:00');
      d.setUTCDate(d.getUTCDate() + n);
      return fmt.clave.format(d);
    },
    diaSemana: function (clave) { // 1 = lunes … 7 = domingo
      var d = new Date(clave + 'T12:00:00-05:00').getUTCDay();
      return d === 0 ? 7 : d;
    },
    relativo: function (x) {
      var ms = aFecha(x).getTime() - Date.now();
      var h = Math.round(ms / 36e5);
      if (Math.abs(h) < 1) { var m = Math.round(ms / 6e4); return m >= 0 ? 'en ' + m + ' min' : 'hace ' + (-m) + ' min'; }
      if (Math.abs(h) < 48) return h >= 0 ? 'en ' + h + ' h' : 'hace ' + (-h) + ' h';
      var d = Math.round(h / 24); return d >= 0 ? 'en ' + d + ' días' : 'hace ' + (-d) + ' días';
    }
  };

  /* ---------- Varios ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function soles(n) {
    var v = Number(n || 0);
    return 'S/ ' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
  }
  function primerNombre(n) { return String(n || '').trim().split(/\s+/)[0]; }
  function whatsappLink(numero, texto) {
    var n = String(numero || CFG.whatsapp || '').replace(/[^0-9]/g, '');
    return 'https://wa.me/' + n + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  function toast(mensaje, tipo) {
    var cont = document.getElementById('rumbo-toasts');
    if (!cont) {
      cont = document.createElement('div');
      cont.id = 'rumbo-toasts';
      cont.setAttribute('role', 'status');
      cont.setAttribute('aria-live', 'polite');
      document.body.appendChild(cont);
    }
    var t = document.createElement('div');
    t.className = 'rumbo-toast ' + (tipo || 'ok');
    t.textContent = mensaje;
    cont.appendChild(t);
    setTimeout(function () { t.classList.add('fuera'); }, tipo === 'error' ? 6500 : 4000);
    setTimeout(function () { t.remove(); }, tipo === 'error' ? 7000 : 4500);
  }

  // Reduce fotos grandes (capturas de Yape) antes de subirlas.
  function prepararArchivo(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('Elige un archivo.'));
      var esImagen = /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
      var esPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!esImagen && !esPdf) return reject(new Error('Sube una imagen (captura) o un PDF.'));
      var lector = new FileReader();
      if (esPdf) {
        if (file.size > 5 * 1024 * 1024) return reject(new Error('El PDF pesa más de 5 MB.'));
        lector.onload = function () { resolve({ base64: String(lector.result).split(',')[1], tipo: 'application/pdf', vista: null }); };
        lector.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };
        lector.readAsDataURL(file);
        return;
      }
      lector.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
          var k = Math.min(1, max / Math.max(w, h));
          var c = document.createElement('canvas');
          c.width = Math.round(w * k); c.height = Math.round(h * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          var url = c.toDataURL('image/jpeg', 0.85);
          resolve({ base64: url.split(',')[1], tipo: 'image/jpeg', vista: url });
        };
        img.onerror = function () {
          if (file.size > 5 * 1024 * 1024) return reject(new Error('La imagen pesa más de 5 MB.'));
          var tipo = /png/i.test(file.type) ? 'image/png' : /webp/i.test(file.type) ? 'image/webp' : 'image/jpeg';
          resolve({ base64: String(lector.result).split(',')[1], tipo: tipo, vista: null });
        };
        img.src = lector.result;
      };
      lector.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };
      lector.readAsDataURL(file);
    });
  }

  /* =====================================================================
     MODO DEMOSTRACIÓN (?demo=1): datos de ejemplo, no guarda nada.
     Sirve para ver la página funcionando antes de conectar Supabase.
     ===================================================================== */
  var DEMO = (function () {
    var asesores = [
      { id: 'd1', slug: 'sheyla-campos', nombre: 'Sheyla Campos', rol_publico: 'Coordinadora General', formacion: 'Ingeniera Empresarial (UP)', trabajo: 'Strategy Analyst en Rappi', foto_url: 'assets/team/sheyla-campos.jpg', linkedin_url: 'https://www.linkedin.com/in/sheyla-campos-gonzales', etiquetas: ['Vocacional', 'Liderazgo', 'Estrategia'], temas: ['vocacional', 'universidad'], cupo_mensual: 4, usadas_mes: 1, horas: { 6: [9, 10, 11] } },
      { id: 'd2', slug: 'junior-julon', nombre: 'Junior Julón', rol_publico: 'Coordinador General · Líder de Finanzas', formacion: 'Financista (UP)', trabajo: 'Analista de Estrategia de Inversiones en Rimac Seguros', foto_url: 'assets/team/junior-julon.jpg', linkedin_url: 'https://www.linkedin.com/in/juniorjulon/', etiquetas: ['Becas', 'Finanzas', 'Estrategia educativa'], temas: ['becas'], cupo_mensual: 4, usadas_mes: 2, horas: { 2: [19, 20], 4: [19, 20] } },
      { id: 'd3', slug: 'mariana-martinez', nombre: 'Mariana Martínez', rol_publico: 'Líder de Comunicaciones y Marketing', formacion: 'Ingeniera Empresarial (UP)', trabajo: 'Business & Strategy Consultant en Minsait', foto_url: 'assets/team/mariana-martinez.jpg', linkedin_url: 'https://www.linkedin.com/in/marianamartinezd/', etiquetas: ['CV', 'Entrevistas', 'Marca personal'], temas: ['cv', 'entrevistas'], cupo_mensual: 4, usadas_mes: 4, horas: {} },
      { id: 'd4', slug: 'lucerito-malpartida', nombre: 'Lucerito Malpartida', rol_publico: 'Líder de Comunicaciones y Marketing', formacion: 'Ingeniera de la Información (UP)', trabajo: 'B2B Process & Transformation Lead en Pepsico', foto_url: 'assets/team/lucerito-malpartida.jpg', linkedin_url: 'https://www.linkedin.com/in/luceritomj/', etiquetas: ['Becas internacionales', 'Habilidades digitales'], temas: ['becas', 'habilidades'], cupo_mensual: 4, usadas_mes: 0, horas: { 1: [20], 3: [20], 5: [18] } },
      { id: 'd5', slug: 'breinner-ramos', nombre: 'Breinner Ramos', rol_publico: 'Líder de Operaciones y Proyectos', formacion: 'Ingeniero Empresarial (UP)', trabajo: 'Consultor & Account Executive en Tuxpas', foto_url: 'assets/team/breinner-ramos.jpg', linkedin_url: 'https://www.linkedin.com/in/breinner-ramos-rodriguez/', etiquetas: ['Networking', 'Productividad', 'Orientación'], temas: ['habilidades', 'universidad', 'vocacional'], cupo_mensual: 4, usadas_mes: 2, horas: { 7: [10, 11] } },
      { id: 'd6', slug: 'maria-arias', nombre: 'María Arias', rol_publico: 'Líder de Operaciones y Proyectos', formacion: 'Ingeniera de la Información (UP)', trabajo: 'Consultora de Analítica en Pacífico Seguros', foto_url: 'assets/team/maria-arias.jpg', linkedin_url: 'https://www.linkedin.com/in/maria-emilia-arias-condori/', etiquetas: ['Analítica', 'Organización', 'Vida universitaria'], temas: ['universidad'], cupo_mensual: 4, usadas_mes: 1, horas: { 3: [19], 6: [16] } },
      { id: 'd7', slug: 'blanca-mondalgo', nombre: 'Blanca Mondalgo', rol_publico: 'Líder de Gestión de Aprendizaje', formacion: 'Administradora (UP)', trabajo: 'Analista de Riesgo Crediticio en BCP', foto_url: 'assets/team/blanca-mondalgo.jpeg', linkedin_url: 'https://www.linkedin.com/in/blanca-mondalgo-murga-125747201/', etiquetas: ['Hábitos de estudio', 'Finanzas', 'Planificación'], temas: ['becas', 'bienestar'], cupo_mensual: 4, usadas_mes: 3, horas: { 2: [18], 5: [19] } },
      { id: 'd8', slug: 'carla-valderrama', nombre: 'Carla Valderrama', rol_publico: 'Líder de Gestión de Aprendizaje', formacion: 'Ingeniera Empresarial (UP)', trabajo: 'Líder de Proyectos en BPL', foto_url: 'assets/team/carla-valderrama.jpeg', linkedin_url: 'https://www.linkedin.com/in/carlasofiavalderrama/', etiquetas: ['Gestión del tiempo', 'Bienestar', 'Proyectos'], temas: ['bienestar'], cupo_mensual: 4, usadas_mes: 1, horas: { 1: [19], 4: [18] } }
    ];
    var temas = [
      { id: 'becas', nombre: 'Becas y financiamiento educativo', orden: 1 },
      { id: 'cv', nombre: 'Armado de CV / Perfil profesional', orden: 2 },
      { id: 'vocacional', nombre: 'Orientación vocacional (¿qué carrera estudiar?)', orden: 3 },
      { id: 'universidad', nombre: 'Elección de universidad / instituto', orden: 4 },
      { id: 'entrevistas', nombre: 'Preparación para entrevistas', orden: 5 },
      { id: 'bienestar', nombre: 'Bienestar y gestión del estrés académico', orden: 6 },
      { id: 'habilidades', nombre: 'Habilidades digitales / productividad', orden: 7 },
      { id: 'otro', nombre: 'Otro tema', orden: 99 }
    ];
    var ajustes = {
      precio_individual: 20, precio_pack: 50, duracion_min: 60, anticipacion_horas: 48, ventana_dias: 30,
      plazo_pago_horas: 24, limite_reprogramar_horas: 24, max_reprogramaciones: 1, descuento_referido_monto: 5,
      whatsapp_numero: CFG.whatsapp || '51999999999', yape_numero: '999 999 999', plin_numero: '999 999 999',
      pago_titular: 'RUMBO (demo)', cuenta_bancaria: '', qr_url: 'assets/qr-donacion.jpg',
      reservas_abiertas: true, mensaje_cerrado: ''
    };
    function slots(miembro, tema) {
      var lista = asesores.filter(function (a) {
        if (miembro) return a.id === miembro;
        var hay = asesores.some(function (x) { return x.temas.indexOf(tema) >= 0; });
        return !tema || !hay || a.temas.indexOf(tema) >= 0;
      });
      var out = [], hoy = F.hoy(), limite = Date.now() + ajustes.anticipacion_horas * 36e5;
      for (var i = 0; i <= ajustes.ventana_dias; i++) {
        var clave = F.sumarDias(hoy, i), dia = F.diaSemana(clave);
        lista.forEach(function (a) {
          if (a.usadas_mes >= a.cupo_mensual) return;
          (a.horas[dia] || []).forEach(function (h) {
            var t = F.instante(clave, h);
            if (t.getTime() >= limite) out.push({ miembro_id: a.id, inicio: t.toISOString() });
          });
        });
      }
      return out.sort(function (x, y) { return x.inicio < y.inicio ? -1 : 1; });
    }
    function espera(v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 350); }); }
    return {
      temas: temas,
      rpc: function (n, p) {
        if (n === 'asesores_publicos') return espera(asesores.map(function (a) {
          var s = slots(a.id); return Object.assign({}, a, { proximo: s.length ? s[0].inicio : null });
        }));
        if (n === 'ajustes_publicos') return espera(ajustes);
        if (n === 'slots_disponibles') return espera(slots(p.p_miembro, p.p_tema));
        if (n === 'validar_cupon') {
          var c = String(p.p_codigo || '').toUpperCase();
          var precio = p.p_plan === 'pack' ? ajustes.precio_pack : ajustes.precio_individual;
          if (c === 'AMIGOS') return espera({ valido: true, tipo: 'amigos', descuento: precio * 0.1, total: precio * 0.9, requiere_amigo: true, mensaje: 'Descuento de amigos aplicado. Escribe el correo de tu amigo.' });
          if (c.indexOf('BECA') === 0) return espera({ valido: true, tipo: 'beca', descuento: precio, total: 0, mensaje: '¡Código de beca válido! Tu asesoría es gratuita.' });
          return espera({ valido: false, mensaje: 'Ese código no existe o ya no está activo. (Demo: prueba AMIGOS o BECA-DEMO)' });
        }
        if (n === 'reserva_por_token') return espera(DEMO.reservaEjemplo());
        if (n === 'guardar_diagnostico' || n === 'guardar_encuesta') return espera(true);
        if (n === 'buscar_reserva') return espera(/DEMO/i.test(String(p.p_codigo || '')) ? '00000000-0000-4000-8000-000000000000' : null);
        return Promise.reject(new Error('Demo: ' + n + ' no disponible'));
      },
      api: function (accion, d) {
        if (accion === 'reservar') {
          var precio = d.plan === 'pack' ? ajustes.precio_pack : ajustes.precio_individual;
          var beca = String(d.cupon || '').toUpperCase().indexOf('BECA') === 0;
          return espera({ codigo: 'RB-DEMO1', token: '00000000-0000-4000-8000-000000000000', estado: beca ? 'confirmada' : 'pendiente_pago',
            monto: beca ? 0 : precio, pago_vence_at: new Date(Date.now() + 24 * 36e5).toISOString() });
        }
        if (accion === 'subir_voucher') return espera({ ok: true, estado: 'en_revision' });
        if (accion === 'reprogramar') return espera({ ok: true, inicio: d.inicio });
        if (accion === 'recuperar_reservas') return espera({ ok: true, aviso: 'Demo: si hay reservas con ese correo, se enviarían sus enlaces.' });
        return Promise.reject(new Error('Demo: acción no disponible'));
      },
      reservaEjemplo: function () {
        var s = slots('d2');
        return {
          codigo: 'RB-DEMO1', estado: params.get('estado') || 'pendiente_pago', plan: 'individual', modalidad: 'A',
          nombre: 'Ana Quispe', email: 'ana@ejemplo.pe', tema: 'Becas y financiamiento educativo',
          precio_lista: 20, descuento: 0, monto: 20, pago_vence_at: new Date(Date.now() + 20 * 36e5).toISOString(),
          voucher_subido_at: null, pago_rechazo_motivo: null, created_at: new Date().toISOString(),
          asesor: { id: 'd2', nombre: 'Junior Julón', rol: 'Coordinador General · Líder de Finanzas', foto_url: 'assets/team/junior-julon.jpg', trabajo: 'Rimac Seguros' },
          diagnostico: null, codigo_referido: 'REF-ANA-7KQ',
          sesiones: [{ id: 's1', numero: 1, inicio: s[0] ? s[0].inicio : new Date().toISOString(), fin: new Date(new Date(s[0] ? s[0].inicio : Date.now()).getTime() + 36e5).toISOString(), estado: 'activa',
            meet_url: 'https://meet.google.com/abc-defg-hij', reprogramaciones: 0, puede_reprogramar: true, encuesta_hecha: false }],
          ajustes: ajustes
        };
      }
    };
  })();

  window.RUMBO = {
    cfg: CFG,
    params: params,
    configurado: configurado || demo,
    demo: demo,
    cliente: cliente,
    rpc: rpc,
    api: api,
    F: F,
    esc: esc,
    soles: soles,
    primerNombre: primerNombre,
    whatsappLink: whatsappLink,
    toast: toast,
    prepararArchivo: prepararArchivo,
    DEMO: DEMO
  };
})();
