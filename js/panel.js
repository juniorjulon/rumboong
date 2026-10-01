/* =====================================================================
   RUMBO · Panel del equipo (panel.html)
   Cada integrante entra con su correo y contraseña. Lo que ve depende de
   sus roles: asesor (su agenda y sus sesiones), coordinador (todo, pagos,
   cupones, ajustes) y administrador (además, roles y accesos).
   ===================================================================== */
(function () {
  'use strict';
  var R = window.RUMBO, F = R.F, esc = R.esc, db = R.cliente;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  var S = { yo: null, ajustes: null, temas: [], miembros: [], ruta: 'inicio', porVerificar: 0, disp: null, filtros: {} };

  /* =================================================================
     Utilidades
     ================================================================= */
  function traducir(msg) {
    msg = String(msg || '');
    if (/row-level security|permission denied/i.test(msg)) return 'No tienes permiso para hacer esto.';
    if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
    if (/Email not confirmed/i.test(msg)) return 'Tu correo aún no está confirmado. Pide al administrador que vuelva a crear tu acceso.';
    if (/duplicate key/i.test(msg)) return 'Ese registro ya existe (código o correo repetido).';
    if (/Failed to fetch|NetworkError/i.test(msg)) return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
    return msg;
  }
  function q(p) { return p.then(function (r) { if (r.error) throw new Error(traducir(r.error.message)); return r.data; }); }
  function api(accion, datos) { return R.api(accion, datos).catch(function (e) { throw new Error(traducir(e.message)); }); }
  function esCoord() { return !!(S.yo && (S.yo.es_coordinador || S.yo.es_admin)); }
  function esAdmin() { return !!(S.yo && S.yo.es_admin); }
  function miembro(id) { return S.miembros.find(function (m) { return m.id === id; }) || {}; }
  function asesores() { return S.miembros.filter(function (m) { return m.es_asesor && m.activo; }); }
  function tema(id) { var t = S.temas.find(function (x) { return x.id === id; }); return t ? t.nombre : '—'; }
  function wspNumero(n) { var d = String(n || '').replace(/[^0-9]/g, ''); return d.length === 9 ? '51' + d : d; }
  function opciones(lista, valor, vacio) {
    return (vacio ? '<option value="">' + esc(vacio) + '</option>' : '') + lista.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(valor) ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');
  }
  function horasOpciones(sel) {
    var a = S.ajustes || { hora_min: 7, hora_max: 21 }, out = [];
    for (var h = 0; h <= 23; h++) out.push([h, String(h).padStart(2, '0') + ':00' + (h < a.hora_min || h > a.hora_max ? ' (fuera de rango)' : '')]);
    return opciones(out, sel == null ? 19 : sel);
  }
  function aleatorio(n) {
    var abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', b = new Uint8Array(n), s = '';
    crypto.getRandomValues(b);
    for (var i = 0; i < n; i++) s += abc[b[i] % abc.length];
    return s;
  }
  function claveSemana(clave) { return F.sumarDias(clave, 1 - F.diaSemana(clave)); } // lunes de esa semana
  function cargando(btn, on, txt) {
    if (!btn) return;
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin" aria-hidden="true"></span> ' + (txt || 'Guardando…'); }
    else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
  }
  function marcaGuardado(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('si');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('si'); }, 1800);
  }

  var ESTADO_RES = {
    pendiente_pago: ['Pendiente de pago', 'chip-ambar'],
    en_revision: ['Por verificar', 'chip-azul'],
    confirmada: ['Confirmada', 'chip-verde'],
    cancelada: ['Cancelada', 'chip-rojo'],
    expirada: ['Vencida', 'chip-gris']
  };
  var ESTADO_SES = {
    activa: ['Programada', 'chip-azul'],
    realizada: ['Realizada', 'chip-verde'],
    no_asistio: ['No asistió', 'chip-rojo'],
    cancelada: ['Cancelada', 'chip-gris']
  };
  function chip(mapa, k) { var e = mapa[k] || [k, 'chip-gris']; return '<span class="chip ' + e[1] + '">' + esc(e[0]) + '</span>'; }

  /* ---------- Modal ---------- */
  function modal(o) {
    var fondo = document.createElement('div');
    fondo.className = 'modal-fondo';
    fondo.innerHTML = '<div class="modal' + (o.chico ? ' chico' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.titulo) + '">' +
      '<div class="modal-head"><h2>' + esc(o.titulo) + '</h2><button class="modal-cerrar" type="button" aria-label="Cerrar">×</button></div>' +
      '<div class="modal-body">' + (o.html || '') + '</div>' + (o.pie ? '<div class="modal-pie">' + o.pie + '</div>' : '') + '</div>';
    document.body.appendChild(fondo);
    document.body.style.overflow = 'hidden';
    function cerrar() { fondo.remove(); if (!$('.modal-fondo')) document.body.style.overflow = ''; document.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    document.addEventListener('keydown', tecla);
    $('.modal-cerrar', fondo).addEventListener('click', cerrar);
    fondo.addEventListener('mousedown', function (e) { if (e.target === fondo) cerrar(); });
    var m = { el: fondo, cerrar: cerrar, $: function (s) { return $(s, fondo); } };
    if (o.alAbrir) o.alAbrir(m);
    return m;
  }

  // Pide datos con un formulario pequeño. campos: [{id, label, tipo, valor, opciones, requerido, ayuda}]
  function pedir(titulo, campos, textoBoton, claseBoton) {
    return new Promise(function (resolve) {
      var html = (campos.intro ? '<p class="p-sub">' + campos.intro + '</p>' : '') + campos.map(function (c) {
        var input;
        if (c.tipo === 'textarea') input = '<textarea class="form-textarea" id="pd-' + c.id + '">' + esc(c.valor || '') + '</textarea>';
        else if (c.tipo === 'select') input = '<select class="form-select" id="pd-' + c.id + '">' + c.opciones + '</select>';
        else if (c.tipo === 'check') return '<label class="check mb"><input type="checkbox" id="pd-' + c.id + '"' + (c.valor ? ' checked' : '') + '> ' + c.label + '</label>';
        else input = '<input class="form-input" id="pd-' + c.id + '" type="' + (c.tipo || 'text') + '" value="' + esc(c.valor == null ? '' : c.valor) + '"' + (c.min ? ' min="' + c.min + '"' : '') + '>';
        return '<div class="campo"><label class="form-label" for="pd-' + c.id + '">' + esc(c.label) + '</label>' + input + (c.ayuda ? '<div class="ayuda">' + c.ayuda + '</div>' : '') + '</div>';
      }).join('');
      var listo = false;
      var m = modal({
        titulo: titulo, chico: true, html: html,
        pie: '<button class="btn btn-line" type="button" data-x>Cancelar</button><button class="btn ' + (claseBoton || 'btn-primary') + '" type="button" data-ok>' + esc(textoBoton || 'Aceptar') + '</button>'
      });
      m.$('[data-x]').addEventListener('click', function () { m.cerrar(); });
      m.$('[data-ok]').addEventListener('click', function () {
        var vals = {};
        for (var i = 0; i < campos.length; i++) {
          var c = campos[i], el = m.$('#pd-' + c.id);
          vals[c.id] = c.tipo === 'check' ? el.checked : el.value.trim();
          if (c.requerido && !vals[c.id]) { el.classList.add('invalido'); el.focus(); R.toast('Completa: ' + c.label, 'error'); return; }
        }
        listo = true; m.cerrar(); resolve(vals);
      });
      var obs = new MutationObserver(function () { if (!document.body.contains(m.el)) { obs.disconnect(); if (!listo) resolve(null); } });
      obs.observe(document.body, { childList: true });
      var primero = m.$('input,textarea,select');
      if (primero) setTimeout(function () { primero.focus(); }, 50);
    });
  }

  /* =================================================================
     Sesión del equipo
     ================================================================= */
  function iniciar() {
    if (!R.configurado || R.demo || !db) { $('#sinConfig').hidden = false; return; }
    $('#formLogin').addEventListener('submit', entrar);
    $('#btnSalir').addEventListener('click', function () { db.auth.signOut().then(mostrarLogin); });
    db.auth.getSession().then(function (r) {
      if (r.data && r.data.session) cargarYo(r.data.session.user); else mostrarLogin();
    });
    db.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') mostrarLogin(); });
    window.addEventListener('hashchange', function () { if (S.yo) navegar(); });
  }

  function mostrarLogin(aviso) {
    S.yo = null;
    $('#vistaApp').hidden = true;
    $('#vistaLogin').hidden = false;
    var a = $('#loginAviso');
    a.hidden = !aviso;
    a.textContent = aviso || '';
  }

  function entrar(ev) {
    ev.preventDefault();
    var btn = $('#btnLogin');
    cargando(btn, true, 'Entrando…');
    db.auth.signInWithPassword({ email: $('#lg-email').value.trim(), password: $('#lg-pass').value })
      .then(function (r) {
        if (r.error) throw new Error(traducir(r.error.message));
        return cargarYo(r.data.user);
      })
      .catch(function (e) { mostrarLogin(e.message); })
      .then(function () { cargando(btn, false); });
  }

  function cargarYo(user) {
    return q(db.from('miembros').select('*').eq('user_id', user.id).eq('activo', true).maybeSingle()).then(function (yo) {
      if (!yo) {
        db.auth.signOut();
        mostrarLogin('Tu usuario existe pero no está vinculado a ningún integrante activo. Pide al administrador que revise tu acceso en Equipo.');
        return;
      }
      S.yo = yo;
      return Promise.all([
        q(db.from('ajustes').select('*').eq('id', 1).single()),
        q(db.from('temas').select('*').order('orden')),
        q(db.from('miembros').select('*').order('orden').order('nombre'))
      ]).then(function (res) {
        S.ajustes = res[0]; S.temas = res[1]; S.miembros = res[2];
        $('#vistaLogin').hidden = true;
        $('#vistaApp').hidden = false;
        $('#uNombre').textContent = yo.nombre;
        $('#uRoles').innerHTML = (yo.es_admin ? '<span class="chip chip-ambar">Admin</span> ' : '') +
          (yo.es_coordinador ? '<span class="chip chip-azul">Coordinación</span> ' : '') +
          (yo.es_asesor ? '<span class="chip chip-teal">Asesor</span>' : '');
        if (!location.hash) history.replaceState(null, '', '#inicio');
        navegar();
        if (esCoord()) actualizarContador();
      });
    }).catch(function (e) { mostrarLogin(e.message); });
  }

  function actualizarContador() {
    return q(db.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision').then(function (r) { return { data: r.count, error: r.error }; }))
      .then(function (n) { S.porVerificar = n || 0; pintarNav(); })
      .catch(function () {});
  }

  /* =================================================================
     Navegación
     ================================================================= */
  var VISTAS = [
    { id: 'inicio', t: 'Inicio', i: 'ti-home', ver: function () { return true; } },
    { id: 'disponibilidad', t: 'Disponibilidad', i: 'ti-calendar-time', ver: function () { return S.yo.es_asesor || esCoord(); } },
    { id: 'sesiones', t: 'Mis sesiones', i: 'ti-video', ver: function () { return S.yo.es_asesor || esCoord(); } },
    { id: 'reservas', t: 'Reservas y pagos', i: 'ti-receipt', ver: esCoord },
    { id: 'cupones', t: 'Cupones y becas', i: 'ti-ticket', ver: esCoord },
    { id: 'equipo', t: 'Equipo', i: 'ti-users', ver: esCoord },
    { id: 'ajustes', t: 'Ajustes', i: 'ti-settings', ver: esCoord },
    { id: 'correos', t: 'Correos', i: 'ti-mail', ver: esCoord },
    { id: 'cuenta', t: 'Mi cuenta', i: 'ti-user-circle', ver: function () { return true; } }
  ];

  function pintarNav() {
    $('#nav').innerHTML = VISTAS.filter(function (v) { return v.ver(); }).map(function (v) {
      var badge = v.id === 'reservas' && S.porVerificar ? ' <span class="cuenta">' + S.porVerificar + '</span>' : '';
      return '<a href="#' + v.id + '" class="' + (S.ruta === v.id ? 'on' : '') + '"><i class="ti ' + v.i + '" aria-hidden="true"></i>' + esc(v.t) + badge + '</a>';
    }).join('');
  }

  function navegar() {
    var id = (location.hash || '#inicio').slice(1);
    var v = VISTAS.find(function (x) { return x.id === id; });
    if (!v || !v.ver()) { id = 'inicio'; v = VISTAS[0]; }
    S.ruta = id;
    pintarNav();
    var c = $('#contenido');
    c.innerHTML = '<div class="cargando">Cargando…</div>';
    window.scrollTo(0, 0);
    var fn = { inicio: vInicio, disponibilidad: vDisponibilidad, sesiones: vSesiones, reservas: vReservas, cupones: vCupones, equipo: vEquipo, ajustes: vAjustes, correos: vCorreos, cuenta: vCuenta }[id];
    try { fn(c); } catch (e) { console.error(e); c.innerHTML = '<div class="alert alert-r">' + esc(e.message) + '</div>'; }
  }

  function errorVista(c, e) {
    console.error(e);
    c.innerHTML = '<div class="alert alert-r"><i class="ti ti-alert-triangle" aria-hidden="true"></i><div>' + esc(e.message || e) + '</div></div>';
  }

  /* =================================================================
     INICIO
     ================================================================= */
  function vInicio(c) {
    var hora = Number(F.hora24(new Date()).slice(0, 2));
    var saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    c.innerHTML = '<h1 class="p-h1">' + saludo + ', ' + esc(R.primerNombre(S.yo.nombre)) + ' 👋</h1>' +
      '<p class="p-sub">Resumen de ' + esc(F.mes(new Date())) + '.</p>' +
      '<div id="avisos"></div><div class="kpis" id="kpis"><div class="cargando">Cargando…</div></div>' +
      '<div class="p-sec"><div class="p-sec-t">Próximas sesiones (7 días)' + (esCoord() ? '<div class="seg" id="segProx"><button type="button" class="on" data-v="mias">Mías</button><button type="button" data-v="todas">Todo el equipo</button></div>' : '') + '</div><div id="proximas"><div class="cargando"></div></div></div>' +
      (esCoord() ? '<div class="p-sec"><div class="p-sec-t">Cupos y disponibilidad del equipo</div><div id="cupos"></div></div>' : '');

    R.rpc('resumen_panel', {}).then(function (r) {
      if (!$('#kpis')) return;
      var k = [
        ['sesiones', 'Sesiones confirmadas del mes'],
        ['realizadas', 'Sesiones realizadas'],
        ['informes_pendientes', 'Informes por enviar', r.informes_pendientes > 0],
        ['satisfaccion', 'Satisfacción promedio (1–5)']
      ];
      if (esCoord()) k = [
        ['por_verificar', 'Pagos por verificar', r.por_verificar > 0, '#reservas'],
        ['ingresos', 'Ingresos del mes', false, null, R.soles(r.ingresos)],
        ['reservas_confirmadas', 'Reservas confirmadas'],
        ['pendientes_pago', 'Esperando pago']
      ].concat(k).concat([['becas', 'Asesorías becadas (Mod. B)']]);
      $('#kpis').innerHTML = k.map(function (x) {
        var v = x[4] != null ? x[4] : (r[x[0]] == null ? '—' : r[x[0]]);
        var inner = '<div class="v">' + esc(v) + '</div><div class="l">' + esc(x[1]) + '</div>';
        return '<div class="kpi' + (x[2] ? ' alerta' : '') + '">' + (x[3] ? '<a href="' + x[3] + '">' + inner + '</a>' : inner) + '</div>';
      }).join('');
      if (esCoord()) {
        $('#cupos').innerHTML = '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Asesor</th><th>Sesiones este mes</th><th>Cupo</th><th>Horas fijas/semana</th></tr></thead><tbody>' +
          (r.por_asesor || []).map(function (a) {
            var lleno = a.cupo != null && a.usadas >= a.cupo;
            return '<tr><td class="fuerte" data-l="Asesor">' + esc(a.nombre) + '</td><td data-l="Sesiones">' + a.usadas + (lleno ? ' <span class="chip chip-ambar">lleno</span>' : '') + '</td>' +
              '<td data-l="Cupo">' + (a.cupo == null ? 'Sin límite' : a.cupo) + '</td><td data-l="Horas/semana">' + (a.horas_semanales ? a.horas_semanales : '<span class="chip chip-rojo">sin horario</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      if (esCoord() && r.por_verificar > 0 && $('#avisos')) {
        $('#avisos').insertAdjacentHTML('beforeend', '<div class="alert alert-y mb"><i class="ti ti-receipt" aria-hidden="true"></i><div>Hay <strong>' + r.por_verificar + ' comprobante(s)</strong> esperando verificación. <a href="#reservas">Revisar ahora</a></div></div>');
      }
    }).catch(function (e) { $('#kpis').innerHTML = '<div class="alert alert-r">' + esc(e.message) + '</div>'; });

    if (S.yo.es_asesor) {
      q(db.from('disponibilidad_semanal').select('dia', { count: 'exact', head: true }).eq('miembro_id', S.yo.id).then(function (r) { return { data: r.count, error: r.error }; }))
        .then(function (n) {
          if (!n && $('#avisos')) $('#avisos').insertAdjacentHTML('afterbegin', '<div class="alert alert-b mb"><i class="ti ti-calendar-plus" aria-hidden="true"></i><div><strong>Aún no publicas tu horario.</strong> Los estudiantes no podrán reservar contigo hasta que marques tus horas libres. <a href="#disponibilidad">Configurar mi disponibilidad</a></div></div>');
        }).catch(function () {});
    }

    function cargarProximas(todas) {
      var ahora = new Date(), fin = new Date(Date.now() + 7 * 864e5);
      var consulta = db.from('sesiones').select('id, inicio, fin, numero, meet_url, miembro_id, estado, reservas!inner(codigo, nombre, whatsapp, estado, tema_id)')
        .eq('estado', 'activa').eq('reservas.estado', 'confirmada')
        .gte('fin', ahora.toISOString()).lt('inicio', fin.toISOString()).order('inicio');
      if (!todas) consulta = consulta.eq('miembro_id', S.yo.id);
      q(consulta).then(function (lista) {
        if (!$('#proximas')) return;
        $('#proximas').innerHTML = lista.length ? lista.map(function (s) {
          return '<div class="ses prox"><div class="ses-top"><div><div class="ses-quien">' + esc(s.reservas.nombre) + '</div>' +
            '<div class="ses-meta">' + esc(F.completa(s.inicio)) + ' (' + esc(F.relativo(s.inicio)) + ') · ' + esc(tema(s.reservas.tema_id)) +
            (todas ? ' · con <strong>' + esc(miembro(s.miembro_id).nombre || '') + '</strong>' : '') + '</div></div>' +
            (s.meet_url ? '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="' + esc(s.meet_url) + '"><i class="ti ti-video" aria-hidden="true"></i> Meet</a>' : '<span class="chip chip-ambar">sin link</span>') +
            '</div></div>';
        }).join('') : '<div class="bloque vacio-msg">No hay sesiones en los próximos 7 días.</div>';
      }).catch(function (e) { $('#proximas').innerHTML = '<div class="alert alert-r">' + esc(e.message) + '</div>'; });
    }
    cargarProximas(false);
    var seg = $('#segProx');
    if (seg) $$('button', seg).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', seg).forEach(function (x) { x.classList.toggle('on', x === b); });
        cargarProximas(b.dataset.v === 'todas');
      });
    });
  }

  /* =================================================================
     DISPONIBILIDAD
     ================================================================= */
  function vDisponibilidad(c) {
    var lista = esCoord() ? asesores() : [S.yo];
    if (!S.disp || !lista.some(function (m) { return m.id === S.disp.miembro; })) {
      S.disp = { miembro: S.yo.es_asesor ? S.yo.id : (lista[0] || {}).id, semana: claveSemana(F.hoy()) };
    }
    if (!S.disp.miembro) { c.innerHTML = '<div class="bloque vacio-msg">No hay asesores activos.</div>'; return; }
    var m = miembro(S.disp.miembro);
    c.innerHTML = '<h1 class="p-h1">Disponibilidad</h1>' +
      '<p class="p-sub">Marca las horas en que puedes atender. <strong>Los cambios se guardan solos</strong> y la web los muestra al instante. Cada bloque es una sesión de 60 minutos que empieza a esa hora (hora de Lima).</p>' +
      (esCoord() ? '<div class="filtros"><label class="form-label" style="margin:0" for="selMiembro">Asesor</label><select class="form-select" id="selMiembro" style="max-width:320px">' +
        opciones(lista.map(function (x) { return [x.id, x.nombre]; }), S.disp.miembro) + '</select></div>' : '') +
      '<div class="p-sec" style="margin-top:6px"><div class="p-sec-t"><span>1 · Horario fijo semanal</span><span class="guardado" id="okSemanal">✓ Guardado</span></div>' +
      '<p class="p-sub" style="margin-bottom:10px">Se repite todas las semanas. En computadora puedes arrastrar para marcar varias horas.</p>' +
      '<div class="disp-wrap"><div class="disp" id="gridSemanal"></div></div>' +
      '<div class="leyenda"><span><i style="background:var(--green)"></i>Disponible</span><span><i style="background:var(--bg);border:1.5px solid var(--line-soft)"></i>No disponible</span></div></div>' +
      '<div class="p-sec"><div class="p-sec-t"><span>2 · Cambios para una semana específica</span><div class="semana-nav"><button type="button" id="semAnt" aria-label="Semana anterior">‹</button><strong id="semTxt"></strong><button type="button" id="semSig" aria-label="Semana siguiente">›</button></div></div>' +
      '<p class="p-sub" style="margin-bottom:10px">Toca una hora verde para <strong>bloquearla solo ese día</strong>, o una vacía para <strong>agregar un horario extra</strong>. Toca el nombre del día para bloquear el día completo.</p>' +
      '<div class="disp-wrap"><div class="disp" id="gridFecha"><div class="cargando"></div></div></div>' +
      '<div class="leyenda"><span><i style="background:var(--green)"></i>Disponible (horario fijo)</span><span><i style="background:var(--rumbo-sky)"></i>Extra</span><span><i style="background:repeating-linear-gradient(45deg,var(--red-l),var(--red-l) 3px,#fff 3px,#fff 6px);border:1px solid #F2B8B5"></i>Bloqueado</span><span><i style="background:var(--rumbo-navy)"></i>Reservado</span><span><i style="background:var(--amber-l);border:1px solid var(--rumbo-amber)"></i>Apartado (sin pago)</span></div></div>' +
      '<div class="p-sec"><div class="p-sec-t">3 · Bloquear varios días (viajes, exámenes, vacaciones)</div>' +
      '<div class="bloque"><div class="form-grid">' +
        '<div class="campo"><label class="form-label" for="blDesde">Desde</label><input class="form-input" type="date" id="blDesde" min="' + F.hoy() + '"></div>' +
        '<div class="campo"><label class="form-label" for="blHasta">Hasta</label><input class="form-input" type="date" id="blHasta" min="' + F.hoy() + '"></div>' +
        '<div class="campo"><label class="form-label" for="blMotivo">Motivo (opcional)</label><input class="form-input" id="blMotivo" maxlength="80" placeholder="Viaje, exámenes…"></div>' +
      '</div><button class="btn btn-primary btn-sm" type="button" id="btnBloquear">Bloquear esos días</button>' +
      '<div id="listaBloqueos" style="margin-top:14px"></div></div></div>' +
      '<p class="ayuda">Cupo mensual de ' + esc(m.nombre) + ': <strong>' + (m.cupo_mensual == null ? 'sin límite' : m.cupo_mensual + ' sesiones') + '</strong>. Cuando se llena, la web deja de ofrecer horarios de ese mes.</p>';

    var sel = $('#selMiembro');
    if (sel) sel.addEventListener('change', function () { S.disp.miembro = sel.value; vDisponibilidad(c); });
    $('#semAnt').addEventListener('click', function () { S.disp.semana = F.sumarDias(S.disp.semana, -7); pintarSemana(); });
    $('#semSig').addEventListener('click', function () { S.disp.semana = F.sumarDias(S.disp.semana, 7); pintarSemana(); });
    $('#btnBloquear').addEventListener('click', bloquearRango);

    q(db.from('disponibilidad_semanal').select('dia, hora').eq('miembro_id', S.disp.miembro)).then(function (filas) {
      S.disp.semanal = {};
      filas.forEach(function (f) { S.disp.semanal[f.dia + '-' + f.hora] = true; });
      pintarSemanal();
      pintarSemana();
      pintarBloqueos();
    }).catch(function (e) { errorVista(c, e); });
  }

  function rangoHoras() {
    var a = S.ajustes, out = [];
    var min = Math.min(a.hora_min, 23), max = Math.max(a.hora_max, min);
    // incluir horas fuera de rango que ya estén marcadas
    Object.keys(S.disp.semanal || {}).forEach(function (k) { var h = Number(k.split('-')[1]); if (h < min) min = h; if (h > max) max = h; });
    for (var h = min; h <= max; h++) out.push(h);
    return out;
  }

  function etiquetaHora(h) { return String(h).padStart(2, '0') + ':00'; }

  function pintarSemanal() {
    var g = $('#gridSemanal');
    g.style.gridTemplateColumns = (window.innerWidth < 560 ? '36px' : '46px') + ' repeat(7, minmax(0, 1fr))';
    var html = '<div></div>' + DIAS.map(function (d) { return '<div class="d">' + d + '</div>'; }).join('');
    rangoHoras().forEach(function (h) {
      html += '<div class="h">' + etiquetaHora(h) + '</div>';
      for (var d = 1; d <= 7; d++) {
        var on = !!S.disp.semanal[d + '-' + h];
        html += '<button type="button" class="celda' + (on ? ' on' : '') + '" data-d="' + d + '" data-h="' + h + '" aria-pressed="' + on + '" aria-label="' + DIAS[d - 1] + ' ' + etiquetaHora(h) + '">' + (on ? '✓' : '') + '</button>';
      }
    });
    g.innerHTML = html;
    activarPintado(g);
  }

  // Clic para alternar; con mouse se puede arrastrar para pintar varias celdas.
  function activarPintado(g) {
    var pintando = false, modo = false, cambios = {};
    function aplicar(cel) {
      var k = cel.dataset.d + '-' + cel.dataset.h;
      var actual = !!S.disp.semanal[k];
      if (actual === modo) return;
      if (modo) S.disp.semanal[k] = true; else delete S.disp.semanal[k];
      cambios[k] = modo;
      cel.classList.toggle('on', modo);
      cel.textContent = modo ? '✓' : '';
      cel.setAttribute('aria-pressed', modo);
    }
    g.addEventListener('pointerdown', function (e) {
      var cel = e.target.closest('.celda');
      if (!cel) return;
      e.preventDefault();
      modo = !S.disp.semanal[cel.dataset.d + '-' + cel.dataset.h];
      cambios = {};
      aplicar(cel);
      pintando = e.pointerType === 'mouse';
      if (!pintando) guardarSemanal(cambios);
    });
    g.addEventListener('pointerover', function (e) {
      if (!pintando) return;
      var cel = e.target.closest('.celda');
      if (cel) aplicar(cel);
    });
    document.addEventListener('pointerup', function () {
      if (!pintando) return;
      pintando = false;
      guardarSemanal(cambios);
    });
    g.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('celda')) {
        e.preventDefault();
        var cel = e.target;
        modo = !S.disp.semanal[cel.dataset.d + '-' + cel.dataset.h];
        cambios = {}; aplicar(cel); guardarSemanal(cambios);
      }
    });
  }

  function guardarSemanal(cambios) {
    var mid = S.disp.miembro;
    var altas = [], bajas = {};
    Object.keys(cambios).forEach(function (k) {
      var d = Number(k.split('-')[0]), h = Number(k.split('-')[1]);
      if (cambios[k]) altas.push({ miembro_id: mid, dia: d, hora: h });
      else (bajas[d] = bajas[d] || []).push(h);
    });
    var ops = [];
    if (altas.length) ops.push(q(db.from('disponibilidad_semanal').upsert(altas, { onConflict: 'miembro_id,dia,hora', ignoreDuplicates: true })));
    Object.keys(bajas).forEach(function (d) {
      ops.push(q(db.from('disponibilidad_semanal').delete().eq('miembro_id', mid).eq('dia', Number(d)).in('hora', bajas[d])));
    });
    if (!ops.length) return;
    Promise.all(ops).then(function () { marcaGuardado('okSemanal'); pintarSemana(); })
      .catch(function (e) { R.toast(e.message, 'error'); vDisponibilidad($('#contenido')); });
  }

  function pintarSemana() {
    var lunes = S.disp.semana, domingo = F.sumarDias(lunes, 6), hoy = F.hoy();
    var g = $('#gridFecha');
    if (!g) return;
    $('#semTxt').textContent = F.corta(F.instante(lunes, 12)) + ' – ' + F.corta(F.instante(domingo, 12));
    $('#semAnt').disabled = lunes <= claveSemana(hoy);
    $('#semSig').disabled = lunes >= F.sumarDias(claveSemana(hoy), 7 * 8);
    g.innerHTML = '<div class="cargando"></div>';
    var mid = S.disp.miembro;
    var desde = F.instante(lunes, 0).toISOString(), hasta = F.instante(F.sumarDias(lunes, 7), 0).toISOString();
    Promise.all([
      q(db.from('disponibilidad_fecha').select('fecha, hora, tipo').eq('miembro_id', mid).gte('fecha', lunes).lte('fecha', domingo)),
      q(db.from('dias_bloqueados').select('fecha, motivo').eq('miembro_id', mid).gte('fecha', lunes).lte('fecha', domingo)),
      q(db.from('sesiones').select('inicio, estado, reservas(nombre, estado)').eq('miembro_id', mid).neq('estado', 'cancelada').gte('inicio', desde).lt('inicio', hasta))
    ]).then(function (res) {
      var fecha = {}, bloq = {}, ses = {};
      res[0].forEach(function (f) { fecha[f.fecha + '|' + f.hora] = f.tipo; });
      res[1].forEach(function (b) { bloq[b.fecha] = b.motivo || 'Bloqueado'; });
      res[2].forEach(function (s) { ses[F.clave(s.inicio) + '|' + Number(F.hora24(s.inicio).slice(0, 2))] = s; });
      S.disp.fecha = fecha; S.disp.bloq = bloq;
      var horas = rangoHoras();
      Object.keys(fecha).concat(Object.keys(ses)).forEach(function (k) {
        var h = Number(k.split('|')[1]);
        if (horas.indexOf(h) < 0) horas.push(h);
      });
      horas.sort(function (a, b) { return a - b; });
      g.style.gridTemplateColumns = (window.innerWidth < 560 ? '36px' : '46px') + ' repeat(7, minmax(0, 1fr))';
      var html = '<div></div>';
      for (var i = 0; i < 7; i++) {
        var dia = F.sumarDias(lunes, i), pasado = dia < hoy;
        html += '<button type="button" class="d' + (bloq[dia] ? ' bloq' : '') + '" data-dia="' + dia + '"' + (pasado ? ' disabled' : '') +
          ' title="' + (bloq[dia] ? 'Quitar bloqueo del día' : 'Bloquear el día completo') + '">' + DIAS[i] + '<small>' + Number(dia.slice(8)) + '</small></button>';
      }
      var ahora = Date.now() + Number(S.ajustes.anticipacion_horas || 0) * 0;
      horas.forEach(function (h) {
        html += '<div class="h">' + etiquetaHora(h) + '</div>';
        for (var i = 0; i < 7; i++) {
          var dia = F.sumarDias(lunes, i), k = dia + '|' + h;
          var base = !!S.disp.semanal[F.diaSemana(dia) + '-' + h];
          var t = F.instante(dia, h).getTime();
          var cls = 'celda', txt = '', titulo = '';
          if (ses[k]) {
            var r = ses[k].reservas || {};
            cls += r.estado === 'confirmada' ? ' reservada' : ' pendiente';
            txt = R.primerNombre(r.nombre || 'Reserva');
            titulo = (r.estado === 'confirmada' ? 'Reservado: ' : 'Apartado (esperando pago): ') + (r.nombre || '');
          } else if (t < ahora) { cls += ' pasada' + (base || fecha[k] === 'extra' ? ' on' : ''); }
          else if (bloq[dia]) { cls += ' dia-bloq'; titulo = 'Día bloqueado'; }
          else if (fecha[k] === 'bloqueo') { cls += ' bloqueo'; txt = '✕'; titulo = 'Bloqueado solo este día (toca para liberar)'; }
          else if (fecha[k] === 'extra') { cls += ' extra'; txt = '+'; titulo = 'Horario extra (toca para quitar)'; }
          else if (base) { cls += ' on'; txt = '✓'; titulo = 'Disponible (toca para bloquear solo este día)'; }
          else { titulo = 'Toca para agregar un horario extra este día'; }
          html += '<button type="button" class="' + cls + '" data-k="' + k + '" title="' + esc(titulo) + '" aria-label="' + esc(DIAS[i] + ' ' + Number(dia.slice(8)) + ' ' + etiquetaHora(h) + ': ' + (titulo || txt)) + '">' + esc(txt) + '</button>';
        }
      });
      g.innerHTML = html;
      $$('.celda', g).forEach(function (b) {
        if (/reservada|pendiente|pasada|dia-bloq/.test(b.className)) return;
        b.addEventListener('click', function () { alternarFecha(b.dataset.k); });
      });
      $$('button.d', g).forEach(function (b) { b.addEventListener('click', function () { alternarDia(b.dataset.dia); }); });
    }).catch(function (e) { g.innerHTML = '<div class="alert alert-r">' + esc(e.message) + '</div>'; });
  }

  function alternarFecha(k) {
    var dia = k.split('|')[0], h = Number(k.split('|')[1]), mid = S.disp.miembro;
    var actual = S.disp.fecha[k];
    var base = !!S.disp.semanal[F.diaSemana(dia) + '-' + h];
    var op;
    if (actual) op = db.from('disponibilidad_fecha').delete().eq('miembro_id', mid).eq('fecha', dia).eq('hora', h);
    else op = db.from('disponibilidad_fecha').insert({ miembro_id: mid, fecha: dia, hora: h, tipo: base ? 'bloqueo' : 'extra' });
    q(op).then(pintarSemana).catch(function (e) { R.toast(e.message, 'error'); });
  }

  function alternarDia(dia) {
    var mid = S.disp.miembro;
    var op = S.disp.bloq[dia]
      ? db.from('dias_bloqueados').delete().eq('miembro_id', mid).eq('fecha', dia)
      : db.from('dias_bloqueados').insert({ miembro_id: mid, fecha: dia, motivo: 'Bloqueado desde el panel' });
    q(op).then(function () { pintarSemana(); pintarBloqueos(); }).catch(function (e) { R.toast(e.message, 'error'); });
  }

  function bloquearRango() {
    var d1 = $('#blDesde').value, d2 = $('#blHasta').value || d1, motivo = $('#blMotivo').value.trim();
    if (!d1) { R.toast('Elige la fecha de inicio.', 'error'); return; }
    if (d2 < d1) { R.toast('La fecha final debe ser posterior a la inicial.', 'error'); return; }
    var filas = [], d = d1;
    while (d <= d2 && filas.length < 120) { filas.push({ miembro_id: S.disp.miembro, fecha: d, motivo: motivo || null }); d = F.sumarDias(d, 1); }
    var btn = $('#btnBloquear');
    cargando(btn, true);
    q(db.from('dias_bloqueados').upsert(filas, { onConflict: 'miembro_id,fecha' }))
      .then(function () { R.toast(filas.length + ' día(s) bloqueado(s).'); $('#blDesde').value = ''; $('#blHasta').value = ''; $('#blMotivo').value = ''; pintarSemana(); pintarBloqueos(); })
      .catch(function (e) { R.toast(e.message, 'error'); })
      .then(function () { cargando(btn, false); });
  }

  function pintarBloqueos() {
    q(db.from('dias_bloqueados').select('fecha, motivo').eq('miembro_id', S.disp.miembro).gte('fecha', F.hoy()).order('fecha').limit(60)).then(function (l) {
      var cont = $('#listaBloqueos');
      if (!cont) return;
      cont.innerHTML = l.length ? '<div class="form-label">Días bloqueados próximos</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + l.map(function (b) {
        return '<span class="chip chip-rojo">' + esc(F.corta(F.instante(b.fecha, 12))) + (b.motivo ? ' · ' + esc(b.motivo) : '') +
          ' <button type="button" data-quitar="' + b.fecha + '" style="border:none;background:none;color:inherit;font-weight:800;cursor:pointer" aria-label="Quitar">×</button></span>';
      }).join('') + '</div>' : '<p class="ayuda">No tienes días bloqueados.</p>';
      $$('[data-quitar]', cont).forEach(function (b) {
        b.addEventListener('click', function () {
          q(db.from('dias_bloqueados').delete().eq('miembro_id', S.disp.miembro).eq('fecha', b.dataset.quitar)).then(function () { pintarBloqueos(); pintarSemana(); });
        });
      });
    });
  }

  /* =================================================================
     MIS SESIONES
     ================================================================= */
  function vSesiones(c) {
    var f = S.filtros.ses || (S.filtros.ses = { vista: 'proximas', quien: 'mias' });
    if (!S.yo.es_asesor) f.quien = 'todas';
    c.innerHTML = '<h1 class="p-h1">' + (f.quien === 'todas' ? 'Sesiones del equipo' : 'Mis sesiones') + '</h1>' +
      '<p class="p-sub">Después de cada sesión márcala como realizada y, cuando envíes el informe (máximo 48 h), marca “Informe enviado”.</p>' +
      '<div class="filtros"><div class="seg" id="segVista">' +
        [['proximas', 'Próximas'], ['informe', 'Informe pendiente'], ['pasadas', 'Pasadas']].map(function (x) { return '<button type="button" data-v="' + x[0] + '" class="' + (f.vista === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') +
      '</div>' + (esCoord() && S.yo.es_asesor ? '<div class="seg" id="segQuien"><button type="button" data-v="mias" class="' + (f.quien === 'mias' ? 'on' : '') + '">Mías</button><button type="button" data-v="todas" class="' + (f.quien === 'todas' ? 'on' : '') + '">Todo el equipo</button></div>' : '') +
      '</div><div id="listaSes"><div class="cargando"></div></div>';
    $$('#segVista button').forEach(function (b) { b.addEventListener('click', function () { f.vista = b.dataset.v; vSesiones(c); }); });
    $$('#segQuien button').forEach(function (b) { b.addEventListener('click', function () { f.quien = b.dataset.v; vSesiones(c); }); });

    var ahora = new Date().toISOString();
    var consulta = db.from('sesiones')
      .select('*, reservas!inner(id, codigo, nombre, email, whatsapp, es_menor, apoderado_nombre, apoderado_telefono, apoderado_email, tema_id, detalle, plan, estado, modalidad, grado, ciudad)')
      .eq('reservas.estado', 'confirmada').neq('estado', 'cancelada');
    if (f.quien !== 'todas') consulta = consulta.eq('miembro_id', S.yo.id);
    if (f.vista === 'proximas') consulta = consulta.gte('fin', ahora).order('inicio');
    else if (f.vista === 'informe') consulta = consulta.lt('fin', ahora).is('informe_enviado_at', null).in('estado', ['activa', 'realizada']).order('inicio', { ascending: false });
    else consulta = consulta.lt('fin', ahora).gte('inicio', new Date(Date.now() - 90 * 864e5).toISOString()).order('inicio', { ascending: false });

    q(consulta.limit(200)).then(function (lista) {
      if (!lista.length) { $('#listaSes').innerHTML = '<div class="bloque vacio-msg">' + (f.vista === 'informe' ? '¡Todo al día! No hay informes pendientes. 🎉' : 'No hay sesiones aquí.') + '</div>'; return; }
      var rids = lista.map(function (s) { return s.reserva_id; }), sids = lista.map(function (s) { return s.id; });
      return Promise.all([
        q(db.from('diagnosticos').select('*').in('reserva_id', rids)),
        q(db.from('encuestas').select('*').in('sesion_id', sids))
      ]).then(function (res) {
        var diag = {}, enc = {};
        res[0].forEach(function (d) { diag[d.reserva_id] = d.respuestas; });
        res[1].forEach(function (e) { enc[e.sesion_id] = e; });
        $('#listaSes').innerHTML = lista.map(function (s) { return tarjetaSesion(s, diag[s.reserva_id], enc[s.id], f.quien === 'todas'); }).join('');
        enlazarSesiones(c);
      });
    }).catch(function (e) { errorVista($('#listaSes'), e); });
  }

  var ETIQ_DIAG = { objetivo: 'Qué quiere lograr', situacion: 'En qué punto está', avance: 'Qué ha hecho', opciones: 'Opciones que considera', duda: 'Mayor duda', seguimiento: 'Seguimiento preferido', extra: 'Algo más' };

  function tarjetaSesion(s, diag, enc, conAsesor) {
    var r = s.reservas, pasada = new Date(s.fin).getTime() < Date.now();
    var pendInforme = pasada && !s.informe_enviado_at && s.estado !== 'no_asistio';
    var wsp = 'https://wa.me/' + wspNumero(r.whatsapp) + '?text=' + encodeURIComponent('Hola ' + R.primerNombre(r.nombre) + ', te escribe ' + R.primerNombre(S.yo.nombre) + ' de RUMBO 👋');
    var acc = '';
    if (s.meet_url && !pasada) acc += '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="' + esc(s.meet_url) + '"><i class="ti ti-video" aria-hidden="true"></i> Entrar al Meet</a>';
    acc += '<a class="btn btn-wsp btn-sm" target="_blank" rel="noopener" href="' + esc(wsp) + '"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> WhatsApp</a>';
    acc += '<a class="btn btn-line btn-sm" href="mailto:' + esc(r.email) + '"><i class="ti ti-mail" aria-hidden="true"></i> Correo</a>';
    if (new Date(s.inicio).getTime() - 15 * 6e4 < Date.now()) {
      acc += '<button class="btn btn-sm ' + (s.estado === 'realizada' ? 'btn-verde' : 'btn-line') + '" type="button" data-marcar="realizada" data-id="' + s.id + '">✓ Realizada</button>';
      acc += '<button class="btn btn-sm ' + (s.estado === 'no_asistio' ? 'btn-rojo' : 'btn-line') + '" type="button" data-marcar="no_asistio" data-id="' + s.id + '">No asistió</button>';
      acc += '<button class="btn btn-sm ' + (s.informe_enviado_at ? 'btn-verde' : 'btn-line') + '" type="button" data-informe="' + (s.informe_enviado_at ? '0' : '1') + '" data-id="' + s.id + '">' + (s.informe_enviado_at ? '✓ Informe enviado' : '📄 Marcar informe enviado') + '</button>';
    }
    var diagHtml = diag
      ? '<dl class="diag">' + Object.keys(diag).map(function (k) { return '<dt>' + esc(ETIQ_DIAG[k] || k) + '</dt><dd>' + esc(diag[k]) + '</dd>'; }).join('') + '</dl>'
      : '<p class="ayuda">Aún no completa el diagnóstico.</p>';
    var encHtml = enc ? '<div class="diag"><strong>' + '★'.repeat(enc.calificacion || 0) + '</strong>' + (enc.recomendaria != null ? ' · recomendaría: ' + enc.recomendaria + '/10' : '') +
      (enc.lo_mejor ? '<dt>Lo más útil</dt><dd>' + esc(enc.lo_mejor) + '</dd>' : '') + (enc.mejorar ? '<dt>A mejorar</dt><dd>' + esc(enc.mejorar) + '</dd>' : '') +
      (enc.testimonio ? '<dt>Testimonio' + (enc.autoriza_testimonio ? ' (autoriza publicar)' : ' (privado)') + '</dt><dd>' + esc(enc.testimonio) + '</dd>' : '') + '</div>' : '';
    return '<div class="ses ' + (pendInforme ? 'pend' : (!pasada ? 'prox' : '')) + '">' +
      '<div class="ses-top"><div><div class="ses-quien">' + esc(r.nombre) + (r.es_menor ? ' <span class="chip chip-ambar">menor</span>' : '') + (r.modalidad === 'B' ? ' <span class="chip chip-teal">beca</span>' : '') + '</div>' +
      '<div class="ses-meta">' + esc(F.completa(s.inicio)) + ' · ' + esc(F.relativo(s.inicio)) + '<br>' + esc(tema(r.tema_id)) + (r.plan === 'pack' ? ' · Pack, sesión ' + s.numero + '/3' : '') +
      (r.grado ? ' · ' + esc(r.grado) : '') + (r.ciudad ? ' · ' + esc(r.ciudad) : '') + (conAsesor ? ' · con <strong>' + esc(miembro(s.miembro_id).nombre || '') + '</strong>' : '') + '</div></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' + chip(ESTADO_SES, s.estado) + (pendInforme ? '<span class="chip chip-ambar">informe pendiente</span>' : '') + '</div></div>' +
      '<div class="ses-acc">' + acc + '</div>' +
      (r.detalle ? '<p class="small" style="margin-top:10px;color:var(--ink-soft)"><em>“' + esc(r.detalle) + '”</em></p>' : '') +
      (r.es_menor ? '<p class="ayuda">Apoderado: ' + esc(r.apoderado_nombre || '—') + (r.apoderado_telefono ? ' · ' + esc(r.apoderado_telefono) : '') + (r.apoderado_email ? ' · ' + esc(r.apoderado_email) : '') + '</p>' : '') +
      '<details' + (diag && !pasada ? ' open' : '') + '><summary>Diagnóstico previo' + (diag ? ' ✓' : '') + '</summary>' + diagHtml + '</details>' +
      (enc ? '<details><summary>Encuesta del estudiante</summary>' + encHtml + '</details>' : '') +
      '<details><summary>Mis notas privadas' + (s.notas_asesor ? ' ✓' : '') + '</summary><textarea class="form-textarea" id="nota-' + s.id + '" style="margin-top:8px" maxlength="4000">' + esc(s.notas_asesor || '') + '</textarea>' +
      '<button class="btn btn-line btn-sm" type="button" data-nota="' + s.id + '" style="margin-top:6px">Guardar nota</button></details>' +
    '</div>';
  }

  function enlazarSesiones(c) {
    $$('[data-marcar]', c).forEach(function (b) {
      b.addEventListener('click', function () {
        cargando(b, true, '');
        R.rpc('marcar_sesion', { p_sesion: b.dataset.id, p_estado: b.dataset.marcar })
          .then(function () { R.toast('Sesión actualizada.'); vSesiones(c); })
          .catch(function (e) { R.toast(traducir(e.message), 'error'); cargando(b, false); });
      });
    });
    $$('[data-informe]', c).forEach(function (b) {
      b.addEventListener('click', function () {
        cargando(b, true, '');
        R.rpc('marcar_sesion', { p_sesion: b.dataset.id, p_informe_enviado: b.dataset.informe === '1' })
          .then(function () { R.toast(b.dataset.informe === '1' ? '¡Gracias! Informe marcado como enviado.' : 'Marca quitada.'); vSesiones(c); })
          .catch(function (e) { R.toast(traducir(e.message), 'error'); cargando(b, false); });
      });
    });
    $$('[data-nota]', c).forEach(function (b) {
      b.addEventListener('click', function () {
        cargando(b, true);
        R.rpc('marcar_sesion', { p_sesion: b.dataset.nota, p_notas: $('#nota-' + b.dataset.nota).value })
          .then(function () { R.toast('Nota guardada.'); })
          .catch(function (e) { R.toast(traducir(e.message), 'error'); })
          .then(function () { cargando(b, false); });
      });
    });
  }

  /* =================================================================
     RESERVAS Y PAGOS (coordinación)
     ================================================================= */
  var SELECT_RESERVA = '*, asesor:miembros!reservas_miembro_id_fkey(id, nombre, email), sesiones(id, numero, inicio, fin, estado, meet_url, meet_metodo, google_event_id, reprogramaciones, informe_enviado_at)';

  function vReservas(c) {
    var f = S.filtros.res || (S.filtros.res = { estado: S.porVerificar ? 'en_revision' : 'activas', asesor: '', texto: '' });
    c.innerHTML = '<div class="p-sec-t" style="margin:0"><h1 class="p-h1">Reservas y pagos</h1>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" type="button" id="btnNueva"><i class="ti ti-plus" aria-hidden="true"></i> Reserva manual</button>' +
      '<button class="btn btn-line btn-sm" type="button" id="btnCsv"><i class="ti ti-download" aria-hidden="true"></i> Exportar CSV</button></div></div>' +
      '<p class="p-sub">Verifica comprobantes, mueve o cancela sesiones y registra reservas que llegan por WhatsApp.</p>' +
      '<div class="filtros"><div class="seg" id="segEstado">' +
        [['en_revision', 'Por verificar' + (S.porVerificar ? ' (' + S.porVerificar + ')' : '')], ['pendiente_pago', 'Esperando pago'], ['confirmada', 'Confirmadas'], ['activas', 'Activas'], ['cerradas', 'Canceladas/vencidas'], ['todas', 'Todas']]
          .map(function (x) { return '<button type="button" data-v="' + x[0] + '" class="' + (f.estado === x[0] ? 'on' : '') + '">' + esc(x[1]) + '</button>'; }).join('') +
      '</div><select class="form-select" id="fAsesor">' + opciones(asesores().map(function (m) { return [m.id, m.nombre]; }), f.asesor, 'Todos los asesores') + '</select>' +
      '<input class="form-input" id="fTexto" placeholder="Buscar nombre, correo o código" value="' + esc(f.texto) + '"></div>' +
      '<div id="tablaRes"><div class="cargando"></div></div>';
    $$('#segEstado button').forEach(function (b) { b.addEventListener('click', function () { f.estado = b.dataset.v; vReservas(c); }); });
    $('#fAsesor').addEventListener('change', function () { f.asesor = this.value; vReservas(c); });
    var t;
    $('#fTexto').addEventListener('input', function () { var v = this.value; clearTimeout(t); t = setTimeout(function () { f.texto = v; pintarTabla(); }, 250); });
    $('#btnNueva').addEventListener('click', function () { nuevaReserva(c); });
    $('#btnCsv').addEventListener('click', exportarCsv);

    var consulta = db.from('reservas').select(SELECT_RESERVA).order('created_at', { ascending: false }).limit(500);
    if (f.estado === 'activas') consulta = consulta.in('estado', ['pendiente_pago', 'en_revision', 'confirmada']);
    else if (f.estado === 'cerradas') consulta = consulta.in('estado', ['cancelada', 'expirada']);
    else if (f.estado !== 'todas') consulta = consulta.eq('estado', f.estado);
    if (f.asesor) consulta = consulta.eq('miembro_id', f.asesor);
    var lista = [];
    q(consulta).then(function (l) { lista = l; S.ultimaLista = l; pintarTabla(); }).catch(function (e) { errorVista($('#tablaRes'), e); });

    function pintarTabla() {
      var txt = (f.texto || '').toLowerCase();
      var filas = lista.filter(function (r) {
        return !txt || [r.nombre, r.email, r.codigo, r.whatsapp].join(' ').toLowerCase().indexOf(txt) >= 0;
      });
      if (!filas.length) { $('#tablaRes').innerHTML = '<div class="bloque vacio-msg">No hay reservas con estos filtros.</div>'; return; }
      $('#tablaRes').innerHTML = '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Reserva</th><th>Estudiante</th><th>Asesor</th><th>Sesiones</th><th>Monto</th><th>Estado</th></tr></thead><tbody>' +
        filas.map(function (r) {
          var ses = (r.sesiones || []).filter(function (s) { return s.estado !== 'cancelada' || r.estado !== 'confirmada'; }).sort(function (a, b) { return a.numero - b.numero; });
          return '<tr class="clic" data-id="' + r.id + '"><td data-l="Reserva"><span class="fuerte">' + esc(r.codigo) + '</span><div class="mini">' + esc(F.fechaHora(r.created_at)) + '</div></td>' +
            '<td data-l="Estudiante"><span class="fuerte">' + esc(r.nombre) + '</span>' + (r.es_menor ? ' <span class="chip chip-ambar">menor</span>' : '') + '<div class="mini">' + esc(r.email) + '</div></td>' +
            '<td data-l="Asesor">' + esc(r.asesor ? r.asesor.nombre : '—') + (r.asignado_por_rumbo ? ' <span class="chip chip-gris">auto</span>' : '') + '</td>' +
            '<td data-l="Sesiones">' + ses.map(function (s) { return esc(F.corta(s.inicio)) + ' ' + esc(F.hora(s.inicio)); }).join('<br>') + '</td>' +
            '<td data-l="Monto">' + esc(R.soles(r.monto)) + (r.cupon_codigo ? '<div class="mini">' + esc(r.cupon_codigo) + '</div>' : '') + '</td>' +
            '<td data-l="Estado">' + chip(ESTADO_RES, r.estado) + (r.estado === 'pendiente_pago' && r.pago_vence_at ? '<div class="mini">vence ' + esc(F.relativo(r.pago_vence_at)) + '</div>' : '') +
              (r.voucher_path ? '<div class="mini"><i class="ti ti-paperclip" aria-hidden="true"></i> voucher</div>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      $$('tr.clic', $('#tablaRes')).forEach(function (tr) {
        tr.addEventListener('click', function () { detalleReserva(tr.dataset.id, function () { vReservas(c); actualizarContador(); }); });
      });
    }
  }

  function exportarCsv() {
    var l = S.ultimaLista || [];
    var cols = ['codigo', 'estado', 'created_at', 'nombre', 'email', 'whatsapp', 'ciudad', 'grado', 'es_menor', 'apoderado_nombre', 'tema', 'asesor', 'plan', 'modalidad', 'precio_lista', 'descuento', 'monto', 'cupon_codigo', 'pago_metodo', 'pago_verificado_at', 'sesiones', 'origen'];
    var filas = l.map(function (r) {
      var v = Object.assign({}, r, {
        tema: tema(r.tema_id), asesor: r.asesor ? r.asesor.nombre : '',
        sesiones: (r.sesiones || []).map(function (s) { return F.fechaHora(s.inicio) + ' (' + s.estado + ')'; }).join(' | ')
      });
      return cols.map(function (k) { var x = v[k] == null ? '' : String(v[k]); return '"' + x.replace(/"/g, '""') + '"'; }).join(',');
    });
    var blob = new Blob(['﻿' + cols.join(',') + '\n' + filas.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'reservas-rumbo-' + F.hoy() + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function detalleReserva(id, alCambiar) {
    var m = modal({ titulo: 'Reserva', html: '<div class="cargando"></div>' });
    Promise.all([
      q(db.from('reservas').select(SELECT_RESERVA).eq('id', id).single()),
      q(db.from('historial').select('*').eq('reserva_id', id).order('created_at')),
      q(db.from('diagnosticos').select('respuestas').eq('reserva_id', id).maybeSingle())
    ]).then(function (res) {
      var r = res[0], hist = res[1], diag = res[2] && res[2].respuestas;
      var activa = ['pendiente_pago', 'en_revision', 'confirmada'].indexOf(r.estado) >= 0;
      var ses = (r.sesiones || []).sort(function (a, b) { return a.numero - b.numero; });
      $('.modal-head h2', m.el).textContent = 'Reserva ' + r.codigo;
      var acc = '';
      if (r.estado === 'en_revision' || r.estado === 'pendiente_pago') {
        acc += '<button class="btn btn-verde btn-sm" type="button" data-a="verificar"><i class="ti ti-check" aria-hidden="true"></i> Pago verificado</button>';
        if (r.estado === 'en_revision') acc += '<button class="btn btn-line btn-sm" type="button" data-a="rechazar"><i class="ti ti-x" aria-hidden="true"></i> Rechazar comprobante</button>';
      }
      if (r.voucher_path) acc += '<button class="btn btn-line btn-sm" type="button" data-a="voucher"><i class="ti ti-photo" aria-hidden="true"></i> Ver comprobante</button>';
      if (activa) acc += '<button class="btn btn-line btn-sm" type="button" data-a="reasignar"><i class="ti ti-arrows-exchange" aria-hidden="true"></i> Reasignar asesor</button>';
      if (r.estado === 'confirmada') {
        if (ses.some(function (s) { return s.estado === 'activa' && !s.google_event_id; })) acc += '<button class="btn btn-amber btn-sm" type="button" data-a="meet"><i class="ti ti-video-plus" aria-hidden="true"></i> Reintentar Meet</button>';
        acc += '<button class="btn btn-line btn-sm" type="button" data-a="reenviar"><i class="ti ti-mail-forward" aria-hidden="true"></i> Reenviar confirmación</button>';
      }
      if (r.estado === 'pendiente_pago') acc += '<button class="btn btn-line btn-sm" type="button" data-a="reenviar"><i class="ti ti-mail-forward" aria-hidden="true"></i> Reenviar datos de pago</button>';
      if (activa) acc += '<button class="btn btn-rojo btn-sm" type="button" data-a="cancelar"><i class="ti ti-trash" aria-hidden="true"></i> Cancelar reserva</button>';

      var linkEst = (S.ajustes.url_sitio || location.origin).replace(/\/+$/, '') + '/mi-reserva.html?t=' + r.token;
      var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' + chip(ESTADO_RES, r.estado) +
        (r.modalidad === 'B' ? '<span class="chip chip-teal">Beca (Mod. B)</span>' : '') + '<span class="chip chip-gris">origen: ' + esc(r.origen) + '</span></div>' +
        (r.pago_rechazo_motivo ? '<div class="alert alert-r mb"><i class="ti ti-alert-triangle" aria-hidden="true"></i><div>Último rechazo: ' + esc(r.pago_rechazo_motivo) + '</div></div>' : '') +
        '<div class="acciones-res">' + acc + '</div>' +
        '<dl class="datos">' +
          '<dt>Estudiante</dt><dd><strong>' + esc(r.nombre) + '</strong>' + (r.es_menor ? ' <span class="chip chip-ambar">menor</span>' : '') + '</dd>' +
          '<dt>Contacto</dt><dd><a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a> · <a target="_blank" rel="noopener" href="https://wa.me/' + wspNumero(r.whatsapp) + '">' + esc(r.whatsapp) + '</a></dd>' +
          '<dt>Ciudad / grado</dt><dd>' + esc(r.ciudad || '—') + ' · ' + esc(r.grado || '—') + '</dd>' +
          (r.es_menor ? '<dt>Apoderado</dt><dd>' + esc(r.apoderado_nombre || '—') + ' · ' + esc(r.apoderado_telefono || '') + ' ' + esc(r.apoderado_email || '') + (r.apoderado_autoriza ? ' · ✅ autoriza' : ' · ⚠️ sin autorización') + '</dd>' : '') +
          '<dt>Tema</dt><dd>' + esc(tema(r.tema_id)) + '</dd>' +
          (r.detalle ? '<dt>Detalle</dt><dd><em>' + esc(r.detalle) + '</em></dd>' : '') +
          '<dt>Asesor</dt><dd>' + esc(r.asesor ? r.asesor.nombre : '—') + (r.asignado_por_rumbo ? ' (asignado automáticamente)' : '') + '</dd>' +
          '<dt>Plan</dt><dd>' + (r.plan === 'pack' ? 'Pack de 3 sesiones' : 'Sesión individual') + '</dd>' +
          '<dt>Monto</dt><dd><strong>' + esc(R.soles(r.monto)) + '</strong>' + (Number(r.descuento) ? ' (lista ' + esc(R.soles(r.precio_lista)) + ', descuento ' + esc(R.soles(r.descuento)) + ' con ' + esc(r.cupon_codigo || '') + ')' : '') + '</dd>' +
          (r.amigo_email ? '<dt>Amigo</dt><dd>' + esc(r.amigo_email) + ' <span id="chkAmigo" class="mini"></span></dd>' : '') +
          (r.pago_metodo ? '<dt>Pago</dt><dd>' + esc(r.pago_metodo) + (r.pago_verificado_at ? ' · verificado ' + esc(F.fechaHora(r.pago_verificado_at)) + ' por ' + esc(miembro(r.pago_verificado_por).nombre || '—') : '') + '</dd>' : '') +
          (r.estado === 'pendiente_pago' ? '<dt>Plazo de pago</dt><dd>' + esc(F.completa(r.pago_vence_at)) + ' (' + esc(F.relativo(r.pago_vence_at)) + ')</dd>' : '') +
          '<dt>Enlace del estudiante</dt><dd><a href="' + esc(linkEst) + '" target="_blank" rel="noopener">Abrir “Mi reserva”</a></dd>' +
        '</dl>' +
        '<div class="p-sec"><div class="p-sec-t">Sesiones</div>' + ses.map(function (s) {
          return '<div class="ses" style="margin-bottom:8px"><div class="ses-top"><div><div class="ses-quien" style="font-size:14px">Sesión ' + s.numero + ' · ' + esc(F.completa(s.inicio)) + '</div>' +
            '<div class="ses-meta">' + (s.meet_url ? '<a target="_blank" rel="noopener" href="' + esc(s.meet_url) + '">' + esc(s.meet_url) + '</a> <span class="mini">(' + esc(s.meet_metodo || '') + ')</span>' : (r.estado === 'confirmada' ? '⚠️ sin link de Meet' : 'El link se crea al confirmar el pago')) +
            (s.reprogramaciones ? ' · reprogramada ' + s.reprogramaciones + ' vez' : '') + (s.informe_enviado_at ? ' · informe ✓' : '') + '</div></div>' +
            '<div style="display:flex;gap:6px;align-items:center">' + chip(ESTADO_SES, s.estado) +
            (s.estado === 'activa' && activa ? '<button class="btn btn-line btn-sm" type="button" data-mover="' + s.id + '">Mover</button>' : '') + '</div></div></div>';
        }).join('') + '</div>' +
        (diag ? '<div class="p-sec"><div class="p-sec-t">Diagnóstico</div><dl class="diag">' + Object.keys(diag).map(function (k) { return '<dt>' + esc(ETIQ_DIAG[k] || k) + '</dt><dd>' + esc(diag[k]) + '</dd>'; }).join('') + '</dl></div>' : '') +
        '<div class="p-sec"><div class="p-sec-t">Notas internas</div><textarea class="form-textarea" id="notasInt" maxlength="4000">' + esc(r.notas_internas || '') + '</textarea><button class="btn btn-line btn-sm" type="button" id="btnNotas" style="margin-top:6px">Guardar notas</button></div>' +
        '<div class="p-sec"><div class="p-sec-t">Historial</div><div class="hist">' + hist.map(function (h) {
          return '<div><b>' + esc(h.accion.replace(/_/g, ' ')) + '</b> · ' + esc(h.actor) + ' · ' + esc(F.fechaHora(h.created_at)) + '</div>';
        }).join('') + '</div></div>';
      $('.modal-body', m.el).innerHTML = html;

      if (r.amigo_email) {
        q(db.from('reservas').select('codigo, estado').ilike('email', r.amigo_email).in('estado', ['pendiente_pago', 'en_revision', 'confirmada']))
          .then(function (l) { var el = $('#chkAmigo', m.el); if (el) el.textContent = l.length ? '✅ su amigo tiene reserva (' + l[0].codigo + ')' : '⚠️ aún no encontramos reserva de su amigo'; }).catch(function () {});
      }

      function hecho(res) { R.toast((res && res.aviso) || 'Listo.'); m.cerrar(); if (alCambiar) alCambiar(); }
      function falla(btn) { return function (e) { R.toast(traducir(e.message), 'error'); cargando(btn, false); }; }

      $('#btnNotas', m.el).addEventListener('click', function () {
        var b = this; cargando(b, true);
        q(db.from('reservas').update({ notas_internas: $('#notasInt', m.el).value }).eq('id', r.id)).then(function () { R.toast('Notas guardadas.'); }).catch(function (e) { R.toast(e.message, 'error'); }).then(function () { cargando(b, false); });
      });

      $$('[data-a]', m.el).forEach(function (b) {
        b.addEventListener('click', function () {
          var a = b.dataset.a;
          if (a === 'verificar') {
            pedir('Confirmar pago de ' + R.soles(r.monto), [{ id: 'metodo', label: 'Método de pago', tipo: 'select', opciones: opciones([['yape', 'Yape'], ['plin', 'Plin'], ['transferencia', 'Transferencia'], ['efectivo', 'Efectivo']], r.pago_metodo || 'yape') }],
              'Confirmar y enviar Meet', 'btn-verde').then(function (v) {
              if (!v) return;
              cargando(b, true, 'Confirmando…');
              api('verificar_pago', { reserva_id: r.id, metodo: v.metodo }).then(hecho, falla(b));
            });
          } else if (a === 'rechazar') {
            pedir('Rechazar comprobante', [{ id: 'motivo', label: 'Motivo (lo verá el estudiante)', tipo: 'textarea', requerido: true, ayuda: 'Ej.: El monto no coincide (S/ 15 en vez de S/ 20) o la imagen no es legible.' }], 'Rechazar y avisar', 'btn-rojo').then(function (v) {
              if (!v) return;
              cargando(b, true);
              api('rechazar_pago', { reserva_id: r.id, motivo: v.motivo }).then(hecho, falla(b));
            });
          } else if (a === 'voucher') {
            cargando(b, true, 'Abriendo…');
            api('ver_voucher', { reserva_id: r.id }).then(function (v) {
              cargando(b, false);
              if (v.es_pdf) { window.open(v.url, '_blank', 'noopener'); return; }
              modal({ titulo: 'Comprobante · ' + r.codigo + ' · ' + R.soles(r.monto), html: '<img class="voucher-img" src="' + esc(v.url) + '" alt="Comprobante de pago"><p class="ayuda"><a href="' + esc(v.url) + '" target="_blank" rel="noopener">Abrir en otra pestaña</a> (el enlace dura 10 minutos)</p>' });
            }, falla(b));
          } else if (a === 'reasignar') {
            pedir('Reasignar asesor', [
              { id: 'asesor', label: 'Nuevo asesor', tipo: 'select', opciones: opciones(asesores().filter(function (x) { return x.id !== r.miembro_id; }).map(function (x) { return [x.id, x.nombre]; }), '', 'Elige') , requerido: true },
              { id: 'forzar', label: 'Ya lo coordinamos: asignar aunque ese horario no esté en su disponibilidad', tipo: 'check' }
            ], 'Reasignar').then(function (v) {
              if (!v) return;
              cargando(b, true);
              api('reasignar', { reserva_id: r.id, asesor_id: v.asesor, forzar: v.forzar }).then(hecho, falla(b));
            });
          } else if (a === 'meet') {
            cargando(b, true, 'Creando…');
            api('reintentar_meet', { reserva_id: r.id }).then(hecho, falla(b));
          } else if (a === 'reenviar') {
            cargando(b, true, 'Enviando…');
            api('reenviar_confirmacion', { reserva_id: r.id }).then(function (res) { R.toast(res.aviso); cargando(b, false); }, falla(b));
          } else if (a === 'cancelar') {
            pedir('Cancelar reserva ' + r.codigo, [
              { id: 'motivo', label: 'Motivo', tipo: 'textarea', ayuda: 'Se incluye en el correo al estudiante.' },
              { id: 'avisar', label: 'Avisar por correo al estudiante y al asesor', tipo: 'check', valor: true }
            ], 'Cancelar reserva', 'btn-rojo').then(function (v) {
              if (!v) return;
              cargando(b, true);
              api('cancelar_reserva', { reserva_id: r.id, motivo: v.motivo, avisar: v.avisar }).then(hecho, falla(b));
            });
          }
        });
      });

      $$('[data-mover]', m.el).forEach(function (b) {
        b.addEventListener('click', function () {
          var s = ses.find(function (x) { return x.id === b.dataset.mover; });
          pedir('Mover sesión ' + s.numero, [
            { id: 'fecha', label: 'Nueva fecha', tipo: 'date', valor: F.clave(s.inicio), min: F.hoy(), requerido: true },
            { id: 'hora', label: 'Hora de inicio (Lima)', tipo: 'select', opciones: horasOpciones(Number(F.hora24(s.inicio).slice(0, 2))) },
            { id: 'forzar', label: 'Ya lo coordinamos con el asesor: mover aunque esa hora no esté en su disponibilidad', tipo: 'check' }
          ], 'Mover y avisar').then(function (v) {
            if (!v) return;
            cargando(b, true, '');
            api('mover_sesion', { sesion_id: s.id, inicio: F.instante(v.fecha, Number(v.hora)).toISOString(), forzar: v.forzar }).then(hecho, falla(b));
          });
        });
      });
    }).catch(function (e) { $('.modal-body', m.el).innerHTML = '<div class="alert alert-r">' + esc(e.message) + '</div>'; });
  }

  function nuevaReserva(c) {
    var filasFecha = function (n) {
      var h = '';
      for (var i = 1; i <= n; i++) h += '<div class="form-grid" data-fila><div class="campo"><label class="form-label">Sesión ' + i + ' · fecha</label><input class="form-input" type="date" data-fecha min="' + F.hoy() + '"></div>' +
        '<div class="campo"><label class="form-label">Hora</label><select class="form-select" data-hora>' + horasOpciones(19) + '</select></div></div>';
      return h;
    };
    var m = modal({
      titulo: 'Reserva manual (WhatsApp / Instagram)',
      html: '<p class="p-sub">Para estudiantes que reservaron por otro canal. Usa la disponibilidad del asesor salvo que marques “forzar”.</p>' +
        '<div class="form-grid">' +
          '<div class="campo"><label class="form-label" for="nr-asesor">Asesor</label><select class="form-select" id="nr-asesor">' + opciones(asesores().map(function (x) { return [x.id, x.nombre]; }), '', 'Elige') + '</select></div>' +
          '<div class="campo"><label class="form-label" for="nr-tema">Tema</label><select class="form-select" id="nr-tema">' + opciones(S.temas.filter(function (t) { return t.activo; }).map(function (t) { return [t.id, t.nombre]; }), '', 'Elige') + '</select></div>' +
          '<div class="campo"><label class="form-label" for="nr-plan">Plan</label><select class="form-select" id="nr-plan"><option value="individual">Sesión individual</option><option value="pack">Pack de 3</option></select></div>' +
        '</div><div id="nr-fechas">' + filasFecha(1) + '</div>' +
        '<div class="form-grid">' +
          '<div class="campo"><label class="form-label" for="nr-nombre">Nombre del estudiante</label><input class="form-input" id="nr-nombre"></div>' +
          '<div class="campo"><label class="form-label" for="nr-email">Correo</label><input class="form-input" id="nr-email" type="email"></div>' +
          '<div class="campo"><label class="form-label" for="nr-wsp">WhatsApp</label><input class="form-input" id="nr-wsp" type="tel"></div>' +
          '<div class="campo"><label class="form-label" for="nr-ciudad">Ciudad</label><input class="form-input" id="nr-ciudad"></div>' +
          '<div class="campo"><label class="form-label" for="nr-grado">Grado</label><input class="form-input" id="nr-grado"></div>' +
          '<div class="campo"><label class="form-label" for="nr-cupon">Código (opcional)</label><input class="form-input" id="nr-cupon" style="text-transform:uppercase"></div>' +
          '<div class="campo"><label class="form-label" for="nr-origen">Origen</label><select class="form-select" id="nr-origen"><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="panel">Otro</option></select></div>' +
        '</div>' +
        '<label class="check mb"><input type="checkbox" id="nr-menor"> Es menor de edad</label>' +
        '<div class="form-grid" id="nr-apo" hidden><div class="campo"><label class="form-label" for="nr-apo-n">Apoderado</label><input class="form-input" id="nr-apo-n"></div><div class="campo"><label class="form-label" for="nr-apo-t">Celular apoderado</label><input class="form-input" id="nr-apo-t"></div><div class="campo"><label class="form-label" for="nr-apo-e">Correo apoderado</label><input class="form-input" id="nr-apo-e" type="email"></div></div>' +
        '<label class="check mb"><input type="checkbox" id="nr-pagado"> Ya pagó: confirmar ahora (crea el Meet y envía la confirmación)</label>' +
        '<div class="campo" id="nr-met" hidden><label class="form-label" for="nr-metodo">Método de pago</label><select class="form-select" id="nr-metodo"><option value="yape">Yape</option><option value="plin">Plin</option><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option></select></div>' +
        '<label class="check mb"><input type="checkbox" id="nr-forzar"> Forzar: el horario fue acordado aunque no esté en la disponibilidad publicada</label>' +
        '<div class="campo"><label class="form-label" for="nr-notas">Notas internas</label><textarea class="form-textarea" id="nr-notas"></textarea></div>',
      pie: '<button class="btn btn-line" type="button" data-x>Cancelar</button><button class="btn btn-primary" type="button" data-ok>Crear reserva</button>'
    });
    m.$('#nr-plan').addEventListener('change', function () { m.$('#nr-fechas').innerHTML = filasFecha(this.value === 'pack' ? 3 : 1); });
    m.$('#nr-menor').addEventListener('change', function () { m.$('#nr-apo').hidden = !this.checked; });
    m.$('#nr-pagado').addEventListener('change', function () { m.$('#nr-met').hidden = !this.checked; });
    m.$('[data-x]').addEventListener('click', m.cerrar);
    m.$('[data-ok]').addEventListener('click', function () {
      var b = this;
      var inicios = $$('[data-fila]', m.el).map(function (f) {
        var d = $('[data-fecha]', f).value;
        return d ? F.instante(d, Number($('[data-hora]', f).value)).toISOString() : null;
      });
      if (!m.$('#nr-asesor').value) { R.toast('Elige el asesor.', 'error'); return; }
      if (inicios.some(function (x) { return !x; })) { R.toast('Completa las fechas.', 'error'); return; }
      var datos = {
        plan: m.$('#nr-plan').value, asesor: m.$('#nr-asesor').value, tema: m.$('#nr-tema').value, inicios: inicios,
        nombre: m.$('#nr-nombre').value, email: m.$('#nr-email').value, whatsapp: m.$('#nr-wsp').value,
        ciudad: m.$('#nr-ciudad').value, grado: m.$('#nr-grado').value, cupon: m.$('#nr-cupon').value,
        es_menor: m.$('#nr-menor').checked, apoderado_nombre: m.$('#nr-apo-n').value, apoderado_telefono: m.$('#nr-apo-t').value,
        apoderado_email: m.$('#nr-apo-e').value, apoderado_autoriza: m.$('#nr-menor').checked,
        confirmar: m.$('#nr-pagado').checked, pago_metodo: m.$('#nr-metodo').value, forzar: m.$('#nr-forzar').checked,
        origen: m.$('#nr-origen').value, notas_internas: m.$('#nr-notas').value
      };
      cargando(b, true, 'Creando…');
      api('crear_reserva_panel', { reserva: datos }).then(function (res) { R.toast(res.aviso); m.cerrar(); vReservas(c); },
        function (e) { R.toast(traducir(e.message), 'error'); cargando(b, false); });
    });
  }

  /* =================================================================
     CUPONES Y BECAS
     ================================================================= */
  function vCupones(c) {
    var f = S.filtros.cup || (S.filtros.cup = { verTodos: false });
    c.innerHTML = '<h1 class="p-h1">Cupones y becas</h1><p class="p-sub">Crea códigos de descuento, genera códigos de beca para los ganadores de los sorteos y registra a los donantes.</p>' +
      '<div class="grid2">' +
        '<div class="bloque"><h3>Crear un código de descuento</h3>' +
          '<div class="form-grid">' +
            '<div class="campo"><label class="form-label" for="cu-cod">Código</label><div class="fila-codigo"><input class="form-input" id="cu-cod" style="text-transform:uppercase" maxlength="40"><button class="btn btn-line btn-sm" type="button" id="cu-gen">Generar</button></div></div>' +
            '<div class="campo"><label class="form-label" for="cu-tipo">Tipo</label><select class="form-select" id="cu-tipo"><option value="porcentaje">% de descuento</option><option value="monto">Monto fijo (S/)</option><option value="beca">Beca 100 %</option></select></div>' +
            '<div class="campo"><label class="form-label" for="cu-valor">Valor</label><input class="form-input" id="cu-valor" type="number" min="0" step="0.5" value="10"></div>' +
            '<div class="campo"><label class="form-label" for="cu-aplica">Aplica a</label><select class="form-select" id="cu-aplica"><option value="todos">Ambos planes</option><option value="individual">Solo individual</option><option value="pack">Solo pack</option></select></div>' +
            '<div class="campo"><label class="form-label" for="cu-usos">Usos máximos</label><input class="form-input" id="cu-usos" type="number" min="1" placeholder="Ilimitado"></div>' +
            '<div class="campo"><label class="form-label" for="cu-vence">Vence</label><input class="form-input" id="cu-vence" type="date"></div>' +
          '</div><div class="campo"><label class="form-label" for="cu-desc">Descripción</label><input class="form-input" id="cu-desc" placeholder="Ej.: Lanzamiento: primeras 5 asesorías a S/ 15"></div>' +
          '<button class="btn btn-primary btn-sm" type="button" id="cu-crear">Crear código</button></div>' +
        '<div class="bloque"><h3>Generar códigos de beca (Modalidad B)</h3>' +
          '<p class="ayuda" style="margin-bottom:10px">Cada código vale una asesoría gratis, se usa una sola vez y queda ligado al donante.</p>' +
          '<div class="form-grid">' +
            '<div class="campo"><label class="form-label" for="be-don">Donante</label><select class="form-select" id="be-don"><option value="">Cargando…</option></select></div>' +
            '<div class="campo"><label class="form-label" for="be-n">Cantidad</label><input class="form-input" id="be-n" type="number" min="1" max="50" value="1"></div>' +
            '<div class="campo"><label class="form-label" for="be-aplica">Para</label><select class="form-select" id="be-aplica"><option value="individual">Sesión individual</option><option value="pack">Pack de 3</option><option value="todos">Cualquiera</option></select></div>' +
          '</div><button class="btn btn-teal btn-sm" type="button" id="be-gen">Generar códigos</button><div id="be-res" style="margin-top:10px"></div></div>' +
      '</div>' +
      '<div class="p-sec"><div class="p-sec-t">Donantes<button class="btn btn-line btn-sm" type="button" id="btnDonante"><i class="ti ti-plus" aria-hidden="true"></i> Registrar donante</button></div><div id="listaDon"><div class="cargando"></div></div></div>' +
      '<div class="p-sec"><div class="p-sec-t">Códigos<label class="check" style="font-size:13px"><input type="checkbox" id="cu-todos"' + (f.verTodos ? ' checked' : '') + '> Mostrar también referidos y premios</label></div><div id="listaCup"><div class="cargando"></div></div></div>';

    $('#cu-gen').addEventListener('click', function () { $('#cu-cod').value = 'RUMBO-' + aleatorio(4); });
    $('#cu-tipo').addEventListener('change', function () { var beca = this.value === 'beca'; $('#cu-valor').disabled = beca; if (beca) $('#cu-valor').value = 100; });
    $('#cu-todos').addEventListener('change', function () { f.verTodos = this.checked; cargarCupones(); });
    $('#cu-crear').addEventListener('click', function () {
      var b = this, cod = $('#cu-cod').value.trim().toUpperCase();
      if (!/^[A-Z0-9-]{3,40}$/.test(cod)) { R.toast('El código solo puede tener letras, números y guiones (3 a 40).', 'error'); return; }
      cargando(b, true);
      q(db.from('cupones').insert({
        codigo: cod, tipo: $('#cu-tipo').value, valor: Number($('#cu-valor').value || 0), aplica_a: $('#cu-aplica').value,
        usos_max: $('#cu-usos').value ? Number($('#cu-usos').value) : null,
        vence_at: $('#cu-vence').value ? F.instante($('#cu-vence').value, 23, 59).toISOString() : null,
        descripcion: $('#cu-desc').value || null, creado_por: S.yo.id
      })).then(function () { R.toast('Código ' + cod + ' creado.'); $('#cu-cod').value = ''; $('#cu-desc').value = ''; cargarCupones(); })
        .catch(function (e) { R.toast(e.message, 'error'); }).then(function () { cargando(b, false); });
    });
    $('#be-gen').addEventListener('click', function () {
      var b = this, n = Math.min(50, Math.max(1, Number($('#be-n').value || 1))), don = $('#be-don').value;
      if (!don) { R.toast('Elige o registra primero al donante.', 'error'); return; }
      var filas = [];
      for (var i = 0; i < n; i++) filas.push({ codigo: 'BECA-' + aleatorio(4) + '-' + aleatorio(4), tipo: 'beca', valor: 100, usos_max: 1, aplica_a: $('#be-aplica').value, donante_id: don, creado_por: S.yo.id, descripcion: 'Beca financiada por donante' });
      cargando(b, true, 'Generando…');
      q(db.from('cupones').insert(filas)).then(function () {
        $('#be-res').innerHTML = '<div class="form-label">Códigos generados (cópialos para los ganadores)</div><div class="codigos-lista">' + filas.map(function (x) { return esc(x.codigo); }).join('\n') + '</div>';
        cargarCupones(); cargarDonantes();
      }).catch(function (e) { R.toast(e.message, 'error'); }).then(function () { cargando(b, false); });
    });
    $('#btnDonante').addEventListener('click', function () { editarDonante(null); });
    cargarDonantes();
    cargarCupones();

    function cargarDonantes() {
      Promise.all([q(db.from('donantes').select('*').order('fecha', { ascending: false })), q(db.from('cupones').select('donante_id, usos, codigo').not('donante_id', 'is', null))]).then(function (res) {
        var dons = res[0], uso = {};
        res[1].forEach(function (cu) { var u = uso[cu.donante_id] || (uso[cu.donante_id] = { codigos: 0, usados: 0 }); u.codigos++; u.usados += cu.usos; });
        $('#be-don').innerHTML = opciones(dons.map(function (d) { return [d.id, d.nombre + (d.monto ? ' (' + R.soles(d.monto) + ')' : '')]; }), '', dons.length ? 'Elige un donante' : 'Primero registra un donante');
        $('#listaDon').innerHTML = dons.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Donante</th><th>Nivel / monto</th><th>Fecha</th><th>Becas</th><th></th></tr></thead><tbody>' + dons.map(function (d) {
          var u = uso[d.id] || { codigos: 0, usados: 0 };
          return '<tr><td class="fuerte" data-l="Donante">' + esc(d.nombre) + '<div class="mini">' + esc(d.email || '') + ' ' + esc(d.telefono || '') + '</div></td><td data-l="Nivel">' + esc(d.nivel || '—') + ' · ' + esc(d.monto ? R.soles(d.monto) : '—') + '</td>' +
            '<td data-l="Fecha">' + esc(d.fecha) + '</td><td data-l="Becas">' + u.usados + ' usadas de ' + u.codigos + ' códigos</td><td><button class="btn btn-line btn-sm" type="button" data-don="' + d.id + '">Editar</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="bloque vacio-msg">Aún no hay donantes registrados.</div>';
        $$('[data-don]').forEach(function (b) { b.addEventListener('click', function () { editarDonante(dons.find(function (d) { return d.id === b.dataset.don; })); }); });
      }).catch(function (e) { errorVista($('#listaDon'), e); });
    }

    function editarDonante(d) {
      pedir(d ? 'Editar donante' : 'Registrar donante', [
        { id: 'nombre', label: 'Nombre o empresa', valor: d && d.nombre, requerido: true },
        { id: 'email', label: 'Correo', tipo: 'email', valor: d && d.email },
        { id: 'telefono', label: 'Teléfono', valor: d && d.telefono },
        { id: 'nivel', label: 'Nivel', tipo: 'select', opciones: opciones([['', '—'], ['Semilla', 'Semilla (S/ 20–25)'], ['Impulso', 'Impulso (S/ 50)'], ['Transformación', 'Transformación (S/ 150+)']], d && d.nivel) },
        { id: 'monto', label: 'Monto donado (S/)', tipo: 'number', valor: d && d.monto },
        { id: 'fecha', label: 'Fecha', tipo: 'date', valor: (d && d.fecha) || F.hoy() },
        { id: 'notas', label: 'Notas', tipo: 'textarea', valor: d && d.notas }
      ], 'Guardar').then(function (v) {
        if (!v) return;
        var fila = { nombre: v.nombre, email: v.email || null, telefono: v.telefono || null, nivel: v.nivel || null, monto: v.monto ? Number(v.monto) : null, fecha: v.fecha || F.hoy(), notas: v.notas || null };
        q(d ? db.from('donantes').update(fila).eq('id', d.id) : db.from('donantes').insert(fila)).then(function () { R.toast('Donante guardado.'); cargarDonantes(); }).catch(function (e) { R.toast(e.message, 'error'); });
      });
    }

    function cargarCupones() {
      var consulta = db.from('cupones').select('*, donantes(nombre)').order('created_at', { ascending: false }).limit(400);
      if (!f.verTodos) consulta = consulta.neq('tipo', 'referido').not('codigo', 'like', 'PREMIO-%');
      q(consulta).then(function (l) {
        $('#listaCup').innerHTML = l.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Código</th><th>Tipo</th><th>Usos</th><th>Vence</th><th>Estado</th><th></th></tr></thead><tbody>' + l.map(function (cu) {
          var tipo = { porcentaje: cu.valor + ' %', monto: R.soles(cu.valor), beca: 'Beca 100 %', amigos: 'Amigos ' + cu.valor + ' %', referido: 'Referido' }[cu.tipo];
          return '<tr><td class="fuerte" data-l="Código">' + esc(cu.codigo) + '<div class="mini">' + esc(cu.descripcion || '') + (cu.donantes ? ' · ' + esc(cu.donantes.nombre) : '') + (cu.solo_email ? ' · solo ' + esc(cu.solo_email) : '') + '</div></td>' +
            '<td data-l="Tipo">' + esc(tipo) + (cu.aplica_a !== 'todos' ? '<div class="mini">solo ' + esc(cu.aplica_a) + '</div>' : '') + '</td>' +
            '<td data-l="Usos">' + cu.usos + (cu.usos_max != null ? ' / ' + cu.usos_max : '') + '</td>' +
            '<td data-l="Vence">' + (cu.vence_at ? esc(F.corta(cu.vence_at)) : '—') + '</td>' +
            '<td data-l="Estado">' + (cu.activo ? '<span class="chip chip-verde">activo</span>' : '<span class="chip chip-gris">inactivo</span>') + '</td>' +
            '<td><button class="btn btn-line btn-sm" type="button" data-cup="' + esc(cu.codigo) + '" data-act="' + (cu.activo ? '0' : '1') + '">' + (cu.activo ? 'Desactivar' : 'Activar') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="bloque vacio-msg">No hay códigos.</div>';
        $$('[data-cup]').forEach(function (b) {
          b.addEventListener('click', function () {
            q(db.from('cupones').update({ activo: b.dataset.act === '1' }).eq('codigo', b.dataset.cup)).then(cargarCupones).catch(function (e) { R.toast(e.message, 'error'); });
          });
        });
      }).catch(function (e) { errorVista($('#listaCup'), e); });
    }
  }

  /* =================================================================
     EQUIPO
     ================================================================= */
  function vEquipo(c) {
    c.innerHTML = '<div class="p-sec-t" style="margin:0"><h1 class="p-h1">Equipo</h1>' + (esAdmin() ? '<button class="btn btn-primary btn-sm" type="button" id="btnAgregar"><i class="ti ti-user-plus" aria-hidden="true"></i> Agregar integrante</button>' : '') + '</div>' +
      '<p class="p-sub">' + (esAdmin() ? 'Como administrador puedes asignar roles (asesor, coordinador, administrador) y crear el acceso de cada persona.' : 'Coordinación puede ajustar cupos, temas y visibilidad. Los roles y accesos los gestiona un administrador.') + '</p>' +
      '<div id="listaEq"><div class="cargando"></div></div>';
    if (esAdmin()) $('#btnAgregar').addEventListener('click', function () { editarMiembro(null); });
    q(db.from('miembros').select('*').order('activo', { ascending: false }).order('orden').order('nombre')).then(function (l) {
      S.miembros = l;
      $('#listaEq').innerHTML = '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Integrante</th><th>Roles</th><th>Cupo/mes</th><th>Temas</th><th>Acceso</th><th></th></tr></thead><tbody>' + l.map(function (m) {
        var roles = (m.es_admin ? '<span class="chip chip-ambar">Admin</span> ' : '') + (m.es_coordinador ? '<span class="chip chip-azul">Coordinación</span> ' : '') + (m.es_asesor ? '<span class="chip chip-teal">Asesor</span>' : '');
        var temporal = /@cambiar\.rumbo$/i.test(m.email);
        return '<tr' + (m.activo ? '' : ' style="opacity:.55"') + '><td data-l="Integrante"><div class="miembro-card">' + (m.foto_url ? '<img src="' + esc(m.foto_url) + '" alt="">' : '<span class="ph"></span>') +
          '<div><div class="fuerte">' + esc(m.nombre) + (m.activo ? '' : ' (inactivo)') + '</div><div class="mini">' + (temporal ? '<span class="chip chip-rojo">correo pendiente</span>' : esc(m.email)) + '</div></div></div></td>' +
          '<td data-l="Roles">' + (roles || '—') + (m.es_asesor && !m.publicado ? '<div class="mini">oculto en la web</div>' : '') + '</td>' +
          '<td data-l="Cupo">' + (m.es_asesor ? (m.cupo_mensual == null ? 'Sin límite' : m.cupo_mensual) : '—') + '</td>' +
          '<td data-l="Temas" class="mini">' + (m.temas || []).map(tema).join(', ') + '</td>' +
          '<td data-l="Acceso">' + (m.user_id ? '<span class="chip chip-verde">✓ puede entrar</span>' : '<span class="chip chip-gris">sin acceso</span>') + '</td>' +
          '<td><button class="btn btn-line btn-sm" type="button" data-ed="' + m.id + '">Editar</button></td></tr>';
      }).join('') + '</tbody></table></div>';
      $$('[data-ed]').forEach(function (b) { b.addEventListener('click', function () { editarMiembro(miembro(b.dataset.ed)); }); });
    }).catch(function (e) { errorVista($('#listaEq'), e); });

    function editarMiembro(mi) {
      var nuevo = !mi;
      mi = mi || { es_asesor: true, publicado: true, activo: true, temas: [], etiquetas: [], cupo_mensual: 4, orden: S.miembros.length + 1 };
      var admin = esAdmin();
      var temasChecks = S.temas.map(function (t) {
        return '<label><input type="checkbox" name="tm" value="' + esc(t.id) + '"' + ((mi.temas || []).indexOf(t.id) >= 0 ? ' checked' : '') + '> ' + esc(t.nombre) + '</label>';
      }).join('');
      var m = modal({
        titulo: nuevo ? 'Agregar integrante' : mi.nombre,
        html: '<div class="form-grid">' +
            '<div class="campo"><label class="form-label" for="me-nombre">Nombre</label><input class="form-input" id="me-nombre" value="' + esc(mi.nombre || '') + '"></div>' +
            '<div class="campo"><label class="form-label" for="me-rol">Cargo (se muestra en la web)</label><input class="form-input" id="me-rol" value="' + esc(mi.rol_publico || '') + '"></div>' +
            '<div class="campo"><label class="form-label" for="me-form">Formación</label><input class="form-input" id="me-form" value="' + esc(mi.formacion || '') + '"></div>' +
            '<div class="campo"><label class="form-label" for="me-trab">Trabajo actual</label><input class="form-input" id="me-trab" value="' + esc(mi.trabajo || '') + '"></div>' +
            '<div class="campo"><label class="form-label" for="me-foto">Foto (ruta o URL)</label><input class="form-input" id="me-foto" value="' + esc(mi.foto_url || '') + '" placeholder="assets/team/nombre.jpg"></div>' +
            '<div class="campo"><label class="form-label" for="me-li">LinkedIn</label><input class="form-input" id="me-li" value="' + esc(mi.linkedin_url || '') + '"></div>' +
            '<div class="campo"><label class="form-label" for="me-wsp">WhatsApp</label><input class="form-input" id="me-wsp" value="' + esc(mi.whatsapp || '') + '"></div>' +
            '<div class="campo"><label class="form-label" for="me-sala">Sala fija de Meet/Zoom (opcional)</label><input class="form-input" id="me-sala" value="' + esc(mi.sala_fija_url || '') + '" placeholder="Si se llena, se usa en vez del Meet automático"></div>' +
          '</div>' +
          '<div class="campo"><label class="form-label" for="me-etq">Especialidades visibles (separadas por coma)</label><input class="form-input" id="me-etq" value="' + esc((mi.etiquetas || []).join(', ')) + '"></div>' +
          '<div class="campo"><span class="form-label">Temas que atiende (para recomendaciones y “RUMBO elige”)</span><div class="checks">' + temasChecks + '</div></div>' +
          '<div class="form-grid">' +
            '<div class="campo"><label class="form-label" for="me-cupo">Cupo mensual de sesiones</label><input class="form-input" id="me-cupo" type="number" min="0" value="' + (mi.cupo_mensual == null ? '' : mi.cupo_mensual) + '" placeholder="Vacío = sin límite"></div>' +
            '<div class="campo"><label class="form-label" for="me-orden">Orden en la web</label><input class="form-input" id="me-orden" type="number" value="' + (mi.orden || 0) + '"></div>' +
          '</div>' +
          '<label class="check mb"><input type="checkbox" id="me-pub"' + (mi.publicado ? ' checked' : '') + '> Aparece en la web y recibe reservas en línea</label>' +
          (admin ? '<div class="bloque" style="background:var(--bg)"><h3>Roles y cuenta (solo administrador)</h3>' +
            '<div class="checks mb"><label><input type="checkbox" id="me-ase"' + (mi.es_asesor ? ' checked' : '') + '> Asesor</label><label><input type="checkbox" id="me-coo"' + (mi.es_coordinador ? ' checked' : '') + '> Coordinador</label><label><input type="checkbox" id="me-adm"' + (mi.es_admin ? ' checked' : '') + '> Administrador</label><label><input type="checkbox" id="me-act"' + (mi.activo ? ' checked' : '') + '> Activo</label></div>' +
            '<div class="campo"><label class="form-label" for="me-email">Correo (para entrar y recibir avisos)</label><input class="form-input" id="me-email" type="email" value="' + esc(/@cambiar\.rumbo$/i.test(mi.email || '') ? '' : (mi.email || '')) + '"></div>' +
            (nuevo ? '' : '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-teal btn-sm" type="button" id="me-acceso"><i class="ti ti-key" aria-hidden="true"></i> ' + (mi.user_id ? 'Cambiar contraseña' : 'Crear acceso al panel') + '</button>' +
              (mi.user_id && mi.id !== S.yo.id ? '<button class="btn btn-line btn-sm" type="button" id="me-quitar">Quitar acceso</button>' : '') + '</div>') +
          '</div>' : ''),
        pie: '<button class="btn btn-line" type="button" data-x>Cerrar</button><button class="btn btn-primary" type="button" data-ok>Guardar</button>'
      });
      m.$('[data-x]').addEventListener('click', m.cerrar);
      m.$('[data-ok]').addEventListener('click', function () {
        var b = this;
        var fila = {
          nombre: m.$('#me-nombre').value.trim(), rol_publico: m.$('#me-rol').value.trim() || null,
          formacion: m.$('#me-form').value.trim() || null, trabajo: m.$('#me-trab').value.trim() || null,
          foto_url: m.$('#me-foto').value.trim() || null, linkedin_url: m.$('#me-li').value.trim() || null,
          whatsapp: m.$('#me-wsp').value.trim() || null, sala_fija_url: m.$('#me-sala').value.trim() || null,
          etiquetas: m.$('#me-etq').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean),
          temas: $$('input[name="tm"]:checked', m.el).map(function (x) { return x.value; }),
          cupo_mensual: m.$('#me-cupo').value === '' ? null : Number(m.$('#me-cupo').value),
          orden: Number(m.$('#me-orden').value || 0), publicado: m.$('#me-pub').checked
        };
        if (fila.nombre.length < 3) { R.toast('Escribe el nombre.', 'error'); return; }
        if (admin) {
          var email = m.$('#me-email').value.trim().toLowerCase();
          fila.es_asesor = m.$('#me-ase').checked; fila.es_coordinador = m.$('#me-coo').checked; fila.es_admin = m.$('#me-adm').checked; fila.activo = m.$('#me-act').checked;
          if (email) fila.email = email;
          else if (nuevo) fila.email = fila.nombre.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '@cambiar.rumbo';
        }
        if (nuevo) fila.slug = fila.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + aleatorio(3).toLowerCase();
        cargando(b, true);
        q(nuevo ? db.from('miembros').insert(fila) : db.from('miembros').update(fila).eq('id', mi.id)).then(function () {
          R.toast('Guardado.'); m.cerrar(); vEquipo(c);
          if (mi.id === S.yo.id) q(db.from('miembros').select('*').eq('id', S.yo.id).single()).then(function (yo) { S.yo = yo; pintarNav(); });
        }).catch(function (e) { R.toast(traducir(e.message), 'error'); cargando(b, false); });
      });
      var bAcc = m.$('#me-acceso');
      if (bAcc) bAcc.addEventListener('click', function () {
        var email = m.$('#me-email').value.trim();
        var sugerida = 'Rumbo-' + aleatorio(6);
        pedir(mi.user_id ? 'Nueva contraseña para ' + mi.nombre : 'Crear acceso para ' + mi.nombre, [
          { id: 'email', label: 'Correo con el que entrará', tipo: 'email', valor: email, requerido: true },
          { id: 'password', label: 'Contraseña (mínimo 8 caracteres)', valor: sugerida, requerido: true, ayuda: 'Compártela por WhatsApp privado y pídele que la cambie en “Mi cuenta”.' }
        ], mi.user_id ? 'Cambiar contraseña' : 'Crear acceso', 'btn-teal').then(function (v) {
          if (!v) return;
          var accion = mi.user_id && v.email.toLowerCase() === String(mi.email).toLowerCase() ? 'cambiar_password' : 'crear_acceso';
          api(accion, { miembro_id: mi.id, email: v.email, password: v.password }).then(function (r) {
            R.toast(r.aviso); m.cerrar(); vEquipo(c);
            modal({ titulo: 'Datos de acceso', chico: true, html: '<p class="p-sub">Envíale esto a ' + esc(R.primerNombre(mi.nombre)) + ' por un medio privado:</p><div class="codigos-lista">Panel: ' + esc((S.ajustes.url_sitio || location.origin) + '/panel.html') + '\nCorreo: ' + esc(v.email) + '\nContraseña: ' + esc(v.password) + '</div>' });
          }).catch(function (e) { R.toast(e.message, 'error'); });
        });
      });
      var bQ = m.$('#me-quitar');
      if (bQ) bQ.addEventListener('click', function () {
        if (!window.confirm('¿Quitar el acceso de ' + mi.nombre + ' al panel? Sus reservas e historial se conservan.')) return;
        api('quitar_acceso', { miembro_id: mi.id }).then(function (r) { R.toast(r.aviso); m.cerrar(); vEquipo(c); }).catch(function (e) { R.toast(e.message, 'error'); });
      });
    }
  }

  /* =================================================================
     AJUSTES
     ================================================================= */
  function vAjustes(c) {
    var a = S.ajustes;
    function campo(id, label, tipo, ayuda, extra) {
      var v = a[id];
      return '<div class="campo"><label class="form-label" for="aj-' + id + '">' + esc(label) + '</label><input class="form-input" id="aj-' + id + '" type="' + (tipo || 'text') + '" value="' + esc(v == null ? '' : v) + '"' + (extra || '') + '>' + (ayuda ? '<div class="ayuda">' + ayuda + '</div>' : '') + '</div>';
    }
    c.innerHTML = '<h1 class="p-h1">Ajustes</h1><p class="p-sub">Reglas, precios y datos de pago. Los cambios aplican de inmediato en la web.</p>' +
      '<div class="bloque"><h3>Reservas en línea</h3><label class="check mb"><input type="checkbox" id="aj-reservas_abiertas"' + (a.reservas_abiertas ? ' checked' : '') + '> Reservas abiertas en la web</label>' +
        '<div class="campo"><label class="form-label" for="aj-mensaje_cerrado">Mensaje cuando están cerradas</label><input class="form-input" id="aj-mensaje_cerrado" value="' + esc(a.mensaje_cerrado) + '"></div></div>' +
      '<div class="bloque"><h3>Precios</h3><div class="form-grid">' + campo('precio_individual', 'Sesión individual (S/)', 'number', '', ' step="0.5" min="0"') + campo('precio_pack', 'Pack de 3 (S/)', 'number', '', ' step="0.5" min="0"') +
        campo('descuento_referido_monto', 'Descuento para el referido (S/)', 'number', 'Lo recibe quien usa el código de un amigo.', ' step="0.5" min="0"') + campo('premio_referente_monto', 'Premio para quien refiere (S/)', 'number', 'Cupón de un uso que recibe quien recomendó.', ' step="0.5" min="0"') + '</div></div>' +
      '<div class="bloque"><h3>Reglas de reserva</h3><div class="form-grid">' +
        campo('anticipacion_horas', 'Anticipación mínima (horas)', 'number', 'Ej.: 48 = no se puede reservar con menos de 2 días.', ' min="0"') +
        campo('ventana_dias', 'Se puede reservar hasta (días)', 'number', '', ' min="1" max="180"') +
        campo('plazo_pago_horas', 'Plazo para subir el pago (horas)', 'number', 'Luego el horario se libera solo.', ' min="1"') +
        campo('limite_reprogramar_horas', 'Reprogramar hasta (horas antes)', 'number', '', ' min="0"') +
        campo('max_reprogramaciones', 'Reprogramaciones por sesión', 'number', '', ' min="0"') +
        campo('duracion_min', 'Duración del evento (min)', 'number', 'Los bloques empiezan cada hora.', ' min="15" max="180"') +
        campo('hora_min', 'Primera hora de la grilla', 'number', '', ' min="0" max="23"') + campo('hora_max', 'Última hora de inicio', 'number', '', ' min="0" max="23"') +
      '</div></div>' +
      '<div class="bloque"><h3>Pagos</h3><div class="form-grid">' + campo('yape_numero', 'Número de Yape') + campo('plin_numero', 'Número de Plin') + campo('pago_titular', 'Titular') + campo('cuenta_bancaria', 'Cuenta para transferencia (opcional)') +
        campo('qr_url', 'Imagen del QR', 'text', 'Ruta en tu web (ej.: assets/qr-donacion.jpg).') + '</div></div>' +
      '<div class="bloque"><h3>Contacto y avisos</h3><div class="form-grid">' + campo('whatsapp_numero', 'WhatsApp de RUMBO', 'text', 'Con código de país, sin + (ej.: 51987654321).') + campo('email_respuesta', 'Correo para respuestas') + campo('url_sitio', 'Dirección de la web') + '</div>' +
        '<div class="campo"><label class="form-label" for="aj-emails">Correos que reciben el aviso de “voucher por verificar”</label><textarea class="form-textarea" id="aj-emails" placeholder="Uno por línea. Si lo dejas vacío, se avisa a todos los coordinadores.">' + esc((a.emails_coordinacion || []).join('\n')) + '</textarea></div></div>' +
      '<button class="btn btn-primary btn-lg" type="button" id="btnAjustes">Guardar ajustes</button>' +
      '<div class="p-sec"><div class="p-sec-t">Temas de asesoría<button class="btn btn-line btn-sm" type="button" id="btnTema"><i class="ti ti-plus" aria-hidden="true"></i> Agregar tema</button></div><div id="listaTemas"></div></div>' +
      (esAdmin() ? '<div class="p-sec"><div class="p-sec-t">Conexión con Google (Meet y correos)</div><div class="bloque"><p class="p-sub">Comprueba que el sistema puede crear salas de Meet y enviar correos. Te llegará un correo de prueba.</p><button class="btn btn-teal btn-sm" type="button" id="btnGoogle"><i class="ti ti-plug-connected" aria-hidden="true"></i> Probar conexión</button><div id="resGoogle" style="margin-top:10px"></div></div></div>' : '');

    $('#btnAjustes').addEventListener('click', function () {
      var b = this, num = function (id) { return Number($('#aj-' + id).value); }, txt = function (id) { return $('#aj-' + id).value.trim(); };
      var fila = {
        reservas_abiertas: $('#aj-reservas_abiertas').checked, mensaje_cerrado: txt('mensaje_cerrado'),
        precio_individual: num('precio_individual'), precio_pack: num('precio_pack'), descuento_referido_monto: num('descuento_referido_monto'), premio_referente_monto: num('premio_referente_monto'),
        anticipacion_horas: num('anticipacion_horas'), ventana_dias: num('ventana_dias'), plazo_pago_horas: num('plazo_pago_horas'),
        limite_reprogramar_horas: num('limite_reprogramar_horas'), max_reprogramaciones: num('max_reprogramaciones'), duracion_min: num('duracion_min'),
        hora_min: num('hora_min'), hora_max: num('hora_max'),
        yape_numero: txt('yape_numero'), plin_numero: txt('plin_numero'), pago_titular: txt('pago_titular'), cuenta_bancaria: txt('cuenta_bancaria'), qr_url: txt('qr_url'),
        whatsapp_numero: txt('whatsapp_numero').replace(/[^0-9]/g, ''), email_respuesta: txt('email_respuesta'), url_sitio: txt('url_sitio'),
        emails_coordinacion: $('#aj-emails').value.split(/[\n,;]+/).map(function (x) { return x.trim(); }).filter(Boolean)
      };
      if (fila.hora_max < fila.hora_min) { R.toast('La última hora debe ser mayor que la primera.', 'error'); return; }
      cargando(b, true);
      q(db.from('ajustes').update(fila).eq('id', 1).select().single()).then(function (aj) { S.ajustes = aj; R.toast('Ajustes guardados.'); })
        .catch(function (e) { R.toast(traducir(e.message), 'error'); }).then(function () { cargando(b, false); });
    });
    $('#btnTema').addEventListener('click', function () {
      pedir('Agregar tema', [{ id: 'nombre', label: 'Nombre del tema', requerido: true }, { id: 'pilar', label: 'Pilar (opcional)' }], 'Agregar').then(function (v) {
        if (!v) return;
        var id = v.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
        q(db.from('temas').insert({ id: id, nombre: v.nombre, pilar: v.pilar || null, orden: S.temas.length + 1 })).then(recargarTemas).catch(function (e) { R.toast(traducir(e.message), 'error'); });
      });
    });
    var bg = $('#btnGoogle');
    if (bg) bg.addEventListener('click', function () {
      cargando(bg, true, 'Probando…');
      api('probar_google', {}).then(function (r) {
        $('#resGoogle').innerHTML = ['credenciales', 'meet', 'correo'].filter(function (k) { return r[k]; }).map(function (k) { return '<div class="small" style="margin:4px 0">' + esc(r[k]) + '</div>'; }).join('');
      }).catch(function (e) { $('#resGoogle').innerHTML = '<div class="alert alert-r">' + esc(e.message) + '</div>'; }).then(function () { cargando(bg, false); });
    });
    pintarTemasAj();

    function recargarTemas() { return q(db.from('temas').select('*').order('orden')).then(function (t) { S.temas = t; pintarTemasAj(); }); }
    function pintarTemasAj() {
      $('#listaTemas').innerHTML = '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Tema</th><th>Orden</th><th>Estado</th><th></th></tr></thead><tbody>' + S.temas.map(function (t) {
        return '<tr><td data-l="Tema"><input class="form-input" data-tn="' + esc(t.id) + '" value="' + esc(t.nombre) + '" style="padding:7px 10px;font-size:13.5px"></td>' +
          '<td data-l="Orden"><input class="form-input" data-to="' + esc(t.id) + '" type="number" value="' + t.orden + '" style="width:80px;padding:7px 10px;font-size:13.5px"></td>' +
          '<td data-l="Estado">' + (t.activo ? '<span class="chip chip-verde">visible</span>' : '<span class="chip chip-gris">oculto</span>') + '</td>' +
          '<td style="white-space:nowrap"><button class="btn btn-line btn-sm" type="button" data-tg="' + esc(t.id) + '">Guardar</button> <button class="btn btn-line btn-sm" type="button" data-tv="' + esc(t.id) + '" data-on="' + (t.activo ? '0' : '1') + '">' + (t.activo ? 'Ocultar' : 'Mostrar') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
      $$('[data-tg]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.dataset.tg;
          q(db.from('temas').update({ nombre: $('[data-tn="' + id + '"]').value.trim(), orden: Number($('[data-to="' + id + '"]').value || 0) }).eq('id', id)).then(function () { R.toast('Tema guardado.'); recargarTemas(); }).catch(function (e) { R.toast(traducir(e.message), 'error'); });
        });
      });
      $$('[data-tv]').forEach(function (b) {
        b.addEventListener('click', function () { q(db.from('temas').update({ activo: b.dataset.on === '1' }).eq('id', b.dataset.tv)).then(recargarTemas).catch(function (e) { R.toast(traducir(e.message), 'error'); }); });
      });
    }
  }

  /* =================================================================
     CORREOS (registro)
     ================================================================= */
  function vCorreos(c) {
    var f = S.filtros.cor || (S.filtros.cor = { errores: false });
    c.innerHTML = '<h1 class="p-h1">Correos enviados</h1><p class="p-sub">Registro de los correos e invitaciones que envió el sistema. Si algo falló, aquí verás el motivo.</p>' +
      '<label class="check mb"><input type="checkbox" id="soloErr"' + (f.errores ? ' checked' : '') + '> Mostrar solo errores</label><div id="listaCor"><div class="cargando"></div></div>';
    $('#soloErr').addEventListener('change', function () { f.errores = this.checked; vCorreos(c); });
    var consulta = db.from('notificaciones').select('*').order('created_at', { ascending: false }).limit(200);
    if (f.errores) consulta = consulta.eq('ok', false);
    q(consulta).then(function (l) {
      $('#listaCor').innerHTML = l.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Tipo</th><th>Para</th><th>Resultado</th></tr></thead><tbody>' + l.map(function (n) {
        return '<tr><td data-l="Fecha" class="mini">' + esc(F.fechaHora(n.created_at)) + '</td><td data-l="Tipo">' + esc(n.tipo.replace(/_/g, ' ')) + '</td><td data-l="Para" class="mini">' + esc(n.destinatario || '—') + '</td>' +
          '<td data-l="Resultado">' + (n.ok ? '<span class="chip chip-verde">enviado</span>' : '<span class="chip chip-rojo">error</span><div class="mini">' + esc(n.detalle || '') + '</div>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="bloque vacio-msg">Sin registros todavía.</div>';
    }).catch(function (e) { errorVista($('#listaCor'), e); });
  }

  /* =================================================================
     MI CUENTA
     ================================================================= */
  function vCuenta(c) {
    var yo = S.yo;
    c.innerHTML = '<h1 class="p-h1">Mi cuenta</h1><p class="p-sub">Tu perfil y tu contraseña.</p>' +
      '<div class="grid2"><div class="bloque"><h3>Mi perfil</h3>' +
        '<div class="campo"><label class="form-label" for="mc-wsp">Mi WhatsApp</label><input class="form-input" id="mc-wsp" value="' + esc(yo.whatsapp || '') + '"></div>' +
        '<div class="campo"><label class="form-label" for="mc-form">Formación</label><input class="form-input" id="mc-form" value="' + esc(yo.formacion || '') + '"></div>' +
        '<div class="campo"><label class="form-label" for="mc-trab">Trabajo actual</label><input class="form-input" id="mc-trab" value="' + esc(yo.trabajo || '') + '"></div>' +
        '<div class="campo"><label class="form-label" for="mc-li">LinkedIn</label><input class="form-input" id="mc-li" value="' + esc(yo.linkedin_url || '') + '"></div>' +
        '<div class="campo"><label class="form-label" for="mc-etq">Mis especialidades (separadas por coma)</label><input class="form-input" id="mc-etq" value="' + esc((yo.etiquetas || []).join(', ')) + '"></div>' +
        '<div class="campo"><label class="form-label" for="mc-sala">Sala fija de Meet o Zoom (opcional)</label><input class="form-input" id="mc-sala" value="' + esc(yo.sala_fija_url || '') + '" placeholder="https://meet.google.com/…"><div class="ayuda">Déjalo vacío para que el sistema cree un Meet nuevo por sesión (recomendado). Si lo llenas, todas tus sesiones usarán tu sala.</div></div>' +
        '<button class="btn btn-primary btn-sm" type="button" id="btnPerfil">Guardar perfil</button></div>' +
      '<div class="bloque"><h3>Cambiar contraseña</h3>' +
        '<div class="campo"><label class="form-label" for="mc-p1">Nueva contraseña</label><input class="form-input" id="mc-p1" type="password" autocomplete="new-password"></div>' +
        '<div class="campo"><label class="form-label" for="mc-p2">Repítela</label><input class="form-input" id="mc-p2" type="password" autocomplete="new-password"></div>' +
        '<button class="btn btn-primary btn-sm" type="button" id="btnPass">Cambiar contraseña</button>' +
        '<p class="ayuda" style="margin-top:12px">Correo de acceso: <strong>' + esc(yo.email) + '</strong></p></div></div>';
    $('#btnPerfil').addEventListener('click', function () {
      var b = this;
      cargando(b, true);
      q(db.from('miembros').update({
        whatsapp: $('#mc-wsp').value.trim() || null, formacion: $('#mc-form').value.trim() || null, trabajo: $('#mc-trab').value.trim() || null,
        linkedin_url: $('#mc-li').value.trim() || null, sala_fija_url: $('#mc-sala').value.trim() || null,
        etiquetas: $('#mc-etq').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean)
      }).eq('id', yo.id).select().single()).then(function (m) { S.yo = m; R.toast('Perfil guardado.'); })
        .catch(function (e) { R.toast(traducir(e.message), 'error'); }).then(function () { cargando(b, false); });
    });
    $('#btnPass').addEventListener('click', function () {
      var b = this, p1 = $('#mc-p1').value, p2 = $('#mc-p2').value;
      if (p1.length < 8) { R.toast('Usa al menos 8 caracteres.', 'error'); return; }
      if (p1 !== p2) { R.toast('Las contraseñas no coinciden.', 'error'); return; }
      cargando(b, true);
      db.auth.updateUser({ password: p1 }).then(function (r) {
        if (r.error) throw new Error(traducir(r.error.message));
        R.toast('Contraseña actualizada.'); $('#mc-p1').value = ''; $('#mc-p2').value = '';
      }).catch(function (e) { R.toast(e.message, 'error'); }).then(function () { cargando(b, false); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
