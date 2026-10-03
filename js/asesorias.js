/* =====================================================================
   RUMBO · Página de asesorías (asesorias.html)
   Flujo: tema y plan → asesor → fecha y hora → datos → confirmar → pago
   ===================================================================== */
(function () {
  'use strict';
  var R = window.RUMBO, F = R.F, esc = R.esc;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  var E = {
    paso: 1,
    tema: '',
    plan: 'individual',
    asesor: null,            // id del asesor o 'auto'
    slots: [],               // [{ miembro_id, inicio }]
    porDia: {},              // { 'YYYY-MM-DD': { isoInicio: [ids] } }
    elegidos: [],            // [{ inicio: iso, miembros: [ids] }]
    diaSel: null,
    mesVista: null,          // 'YYYY-MM'
    cupon: null,
    ajustes: {},
    asesores: [],
    temas: [],
    reserva: null,
    metodo: 'yape',
    archivo: null
  };

  /* ------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------ */
  function iniciar() {
    if (R.demo) $('#bannerDemo').hidden = false;
    enlazarNavegacion();
    enlazarPaso1();
    enlazarPaso4();
    $('#btnReservar').addEventListener('click', reservar);
    $$('[data-wsp]').forEach(function (a) { a.href = R.whatsappLink(); a.target = '_blank'; a.rel = 'noopener'; });

    if (location.hash === '#asesores' || location.hash === '#precios' || location.hash === '#como' || location.hash === '#preguntas') {
      mostrarTab(location.hash.slice(1), false);
    }

    if (!R.configurado) {
      cerrarReservas('Mientras terminamos de activar las reservas en línea, escríbenos por WhatsApp y coordinamos tu asesoría.');
      $('#gridEquipo').innerHTML = '<p class="muted">Muy pronto podrás ver aquí la disponibilidad del equipo.</p>';
      return;
    }

    Promise.all([
      R.rpc('ajustes_publicos'),
      cargarTemas(),
      R.rpc('asesores_publicos')
    ]).then(function (res) {
      E.ajustes = res[0] || {};
      E.temas = res[1] || [];
      E.asesores = res[2] || [];
      aplicarAjustes();
      pintarTemas();
      pintarEquipo();
      pintarSeleccionAsesores();
      if (!E.ajustes.reservas_abiertas) { cerrarReservas(E.ajustes.mensaje_cerrado); return; }
      preseleccionDesdeUrl();
      avisoReservaPrevia();
    }).catch(function (e) {
      console.error(e);
      cerrarReservas('No pudimos cargar los horarios en este momento. Escríbenos por WhatsApp y te ayudamos a reservar.');
    });
  }

  function cargarTemas() {
    if (R.demo) return Promise.resolve(R.DEMO.temas);
    return R.cliente.from('temas').select('id, nombre, orden').eq('activo', true).order('orden')
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }

  function cerrarReservas(msg) {
    $('#wizard').hidden = true;
    $('#cerrado').hidden = false;
    $('#cerradoMsg').textContent = msg || '';
    $('#cerradoWsp').href = R.whatsappLink(E.ajustes.whatsapp_numero, 'Hola RUMBO, quiero agendar una asesoría personalizada.');
  }

  function aplicarAjustes() {
    var a = E.ajustes;
    $$('[data-precio="individual"]').forEach(function (el) { el.textContent = R.soles(a.precio_individual); });
    $$('[data-precio="pack"]').forEach(function (el) { el.textContent = R.soles(a.precio_pack); });
    $$('[data-plazo]').forEach(function (el) { el.textContent = a.plazo_pago_horas + ' horas'; });
    $$('[data-referido]').forEach(function (el) { el.textContent = R.soles(a.descuento_referido_monto); });
  }

  function preseleccionDesdeUrl() {
    var slug = R.params.get('asesor');
    var tema = R.params.get('tema');
    if (tema && E.temas.some(function (t) { return t.id === tema; })) { $('#f-tema').value = tema; E.tema = tema; pintarSeleccionAsesores(); }
    if (slug) {
      var a = E.asesores.find(function (x) { return x.slug === slug; });
      if (a) preseleccionar(a.id);
    }
  }

  function avisoReservaPrevia() {
    var guardada = null;
    try { guardada = JSON.parse(localStorage.getItem('rumbo-ultima-reserva') || 'null'); } catch (e) { /* sin almacenamiento */ }
    if (!guardada || !guardada.token || Date.now() - guardada.t > 3 * 864e5) return;
    var div = document.createElement('div');
    div.className = 'alert alert-y';
    div.style.marginBottom = '16px';
    div.innerHTML = '<i class="ti ti-receipt" aria-hidden="true"></i><div>¿Vienes a subir tu comprobante o revisar tu reserva <strong>' +
      esc(guardada.codigo) + '</strong>? <a href="mi-reserva.html?t=' + encodeURIComponent(guardada.token) + '">Ver mi reserva</a></div>';
    $('#wizard').insertBefore(div, $('#wizard').firstChild);
  }

  /* ------------------------------------------------------------------
     Pestañas y pasos
     ------------------------------------------------------------------ */
  function enlazarNavegacion() {
    $$('.tab-btn').forEach(function (b) { b.addEventListener('click', function () { mostrarTab(b.dataset.tab, true); }); });
    $$('[data-ir]').forEach(function (b) {
      b.addEventListener('click', function (ev) { ev.preventDefault(); mostrarTab(b.dataset.ir, true); });
    });
    $$('[data-siguiente]').forEach(function (b) { b.addEventListener('click', function () { irPaso(Number(b.dataset.siguiente)); }); });
    $$('[data-anterior]').forEach(function (b) { b.addEventListener('click', function () { irPaso(Number(b.dataset.anterior), true); }); });
  }

  function mostrarTab(id, desplazar) {
    $$('.view').forEach(function (v) { v.classList.toggle('on', v.id === 'tab-' + id); });
    $$('.tab-btn').forEach(function (b) {
      var on = b.dataset.tab === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (desplazar) {
      var top = $('.tabs-wrap').getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  function irPaso(n, atras) {
    if (!atras && !validarPaso(E.paso, n)) return;
    if (n === 3 && (E.paso !== 3)) cargarHorarios();
    if (n === 5) pintarResumen();
    E.paso = n;
    $$('.paso').forEach(function (p) { p.hidden = Number(p.dataset.paso) !== n; });
    $$('[data-dot]').forEach(function (d) {
      var i = Number(d.dataset.dot);
      var lbl = d.parentElement.querySelector('.slbl');
      if (i < n) { d.className = 'sdot done'; d.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i>'; }
      else if (i === n) { d.className = 'sdot now'; d.textContent = i; }
      else { d.className = 'sdot wait'; d.textContent = i; }
      if (lbl) lbl.className = 'slbl' + (i === n ? ' now' : '');
    });
    $$('[data-line]').forEach(function (l) { l.className = 'sline' + (Number(l.dataset.line) < n ? ' done' : ''); });
    $('#stepbar').hidden = n === 6;
    var top = $('#agendar').getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function validarPaso(actual, destino) {
    if (destino <= actual) return true;
    if (actual === 1) {
      E.tema = $('#f-tema').value;
      if (!E.tema) { marcar('#f-tema'); R.toast('Elige el tema de tu consulta.', 'error'); return false; }
    }
    if (actual === 2 && !E.asesor) { R.toast('Elige un asesor o “RUMBO elige”.', 'error'); return false; }
    if (actual === 3 && E.elegidos.length !== necesarios()) {
      R.toast(E.plan === 'pack' ? 'Elige 3 horarios en días distintos.' : 'Elige un horario.', 'error'); return false;
    }
    if (actual === 4) return validarDatos();
    return true;
  }

  function marcar(sel) {
    var el = $(sel);
    if (!el) return;
    el.classList.add('invalido');
    el.focus();
    el.addEventListener('input', function f() { el.classList.remove('invalido'); el.removeEventListener('input', f); });
    el.addEventListener('change', function f() { el.classList.remove('invalido'); el.removeEventListener('change', f); });
  }

  function necesarios() { return E.plan === 'pack' ? 3 : 1; }

  /* ------------------------------------------------------------------
     Paso 1: tema y plan
     ------------------------------------------------------------------ */
  function enlazarPaso1() {
    $('#f-tema').addEventListener('change', function () {
      E.tema = this.value;
      pintarSeleccionAsesores();
    });
    $$('.plan').forEach(function (b) {
      b.addEventListener('click', function () {
        if (E.plan === b.dataset.plan) return;
        E.plan = b.dataset.plan;
        $$('.plan').forEach(function (x) {
          x.classList.toggle('sel', x === b);
          x.setAttribute('aria-checked', x === b ? 'true' : 'false');
        });
        E.elegidos = [];
        if (E.cupon) { E.cupon = null; $('#cuponMsg').textContent = 'Vuelve a aplicar tu código para el nuevo plan.'; }
      });
    });
  }

  function pintarTemas() {
    var sel = $('#f-tema');
    sel.innerHTML = '<option value="">Selecciona un tema</option>' + E.temas.map(function (t) {
      return '<option value="' + esc(t.id) + '">' + esc(t.nombre) + '</option>';
    }).join('');
    if (E.tema) sel.value = E.tema;
  }

  /* ------------------------------------------------------------------
     Asesores: pestaña "Asesores" y paso 2
     ------------------------------------------------------------------ */
  function barraCupo(a) {
    if (a.cupo_mensual == null) return '';
    var libres = Math.max(0, a.cupo_mensual - a.usadas_mes), html = '';
    for (var i = 0; i < a.cupo_mensual; i++) html += '<div class="avail-slot ' + (i < libres ? 'avail-free' : 'avail-used') + '"></div>';
    return '<div class="avail-bar" aria-hidden="true">' + html + '</div>';
  }

  function etiquetaProximo(a) {
    if (a.proximo) return '<span class="next-badge next-g">Desde ' + esc(F.corta(a.proximo)) + '</span>';
    if (a.cupo_mensual != null && a.usadas_mes >= a.cupo_mensual) return '<span class="next-badge next-y">Mes completo</span>';
    return '<span class="next-badge next-n">Sin horarios</span>';
  }

  function textoCupo(a) {
    if (a.cupo_mensual == null) return 'Cupos disponibles';
    var libres = Math.max(0, a.cupo_mensual - a.usadas_mes);
    return libres + ' de ' + a.cupo_mensual + ' cupos este mes';
  }

  function pintarEquipo() {
    var g = $('#gridEquipo');
    if (!E.asesores.length) { g.innerHTML = '<p class="muted">Pronto publicaremos al equipo.</p>'; return; }
    g.innerHTML = E.asesores.map(function (a) {
      return '<article class="tcard">' +
        '<div class="avatar">' + (a.foto_url ? '<img src="' + esc(a.foto_url) + '" alt="' + esc(a.nombre) + '" loading="lazy">' : '') + '</div>' +
        '<h3>' + esc(a.nombre) + '</h3>' +
        '<p class="role">' + esc(a.rol_publico || '') + '</p>' +
        '<p class="org">' + esc(a.formacion || '') + (a.trabajo ? '<br>' + esc(a.trabajo) : '') + '</p>' +
        '<div class="tag-row">' + (a.etiquetas || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="avail-wrap">' + barraCupo(a) +
          '<div class="avail-text"><span>' + esc(textoCupo(a)) + '</span>' + etiquetaProximo(a) + '</div>' +
          '<div class="tcard-actions">' +
            (a.linkedin_url ? '<a class="linkedin-btn" href="' + esc(a.linkedin_url) + '" target="_blank" rel="noopener" aria-label="LinkedIn de ' + esc(a.nombre) + '"><i class="ti ti-brand-linkedin" aria-hidden="true"></i> LinkedIn</a>' : '') +
            '<button class="btn btn-primary" type="button" data-agendar="' + esc(a.id) + '">Agendar con ' + esc(R.primerNombre(a.nombre)) + '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
    $$('[data-agendar]', g).forEach(function (b) {
      b.addEventListener('click', function () { preseleccionar(b.dataset.agendar); mostrarTab('agendar', true); });
    });
  }

  function preseleccionar(id) {
    var a = E.asesores.find(function (x) { return x.id === id; });
    if (!a) return;
    elegirAsesor(id);
    var aviso = $('#asesorPrevio');
    aviso.hidden = false;
    aviso.innerHTML = '<i class="ti ti-user-check" aria-hidden="true"></i><div>Agendarás con <strong>' + esc(a.nombre) +
      '</strong>. Elige tu tema y continúa (podrás cambiar de asesor en el siguiente paso).</div>';
    if (E.paso !== 1) irPaso(1, true);
  }

  function recomendado(a) { return E.tema && (a.temas || []).indexOf(E.tema) >= 0; }

  function pintarSeleccionAsesores() {
    var g = $('#gridAsesores');
    if (!g) return;
    var lista = E.asesores.slice().sort(function (x, y) {
      var rx = recomendado(x) ? 0 : 1, ry = recomendado(y) ? 0 : 1;
      if (rx !== ry) return rx - ry;
      var px = x.proximo ? 0 : 1, py = y.proximo ? 0 : 1;
      return px - py;
    });
    var html = '<button type="button" class="sel-card' + (E.asesor === 'auto' ? ' sel' : '') + '" data-asesor="auto" aria-pressed="' + (E.asesor === 'auto') + '">' +
      '<div class="sel-head"><div class="sel-av logo-av" aria-hidden="true">RUM<br>BO</div>' +
      '<div><div class="sel-name">RUMBO elige</div><div class="sel-role">Asignación automática</div></div></div>' +
      '<div class="tag-row"><span class="tag">Según tu tema</span><span class="tag">Más horarios</span></div>' +
      '<div class="small muted" style="line-height:1.5;margin-bottom:8px">Te mostramos los horarios de todo el equipo especializado y asignamos a quien esté libre.</div>' +
      '<div class="avail-text"><span></span><span class="next-badge next-g">Más rápido</span></div></button>';
    html += lista.map(function (a) {
      var sel = E.asesor === a.id;
      return '<button type="button" class="sel-card' + (sel ? ' sel' : '') + (a.proximo ? '' : ' sin') + '" data-asesor="' + esc(a.id) + '" aria-pressed="' + sel + '">' +
        '<div class="sel-head"><div class="sel-av">' + (a.foto_url ? '<img src="' + esc(a.foto_url) + '" alt="" loading="lazy">' : '') + '</div>' +
        '<div><div class="sel-name">' + esc(a.nombre) + '</div><div class="sel-role">' + esc(a.rol_publico || '') + '</div></div></div>' +
        (recomendado(a) ? '<span class="reco"><i class="ti ti-star-filled" aria-hidden="true"></i> Especialista en tu tema</span>' : '') +
        '<div class="tag-row">' + (a.etiquetas || []).slice(0, 3).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
        barraCupo(a) +
        '<div class="avail-text"><span>' + esc(a.cupo_mensual == null ? '' : Math.max(0, a.cupo_mensual - a.usadas_mes) + '/' + a.cupo_mensual + ' cupos') + '</span>' + etiquetaProximo(a) + '</div>' +
      '</button>';
    }).join('');
    g.innerHTML = html;
    $$('[data-asesor]', g).forEach(function (b) { b.addEventListener('click', function () { elegirAsesor(b.dataset.asesor); }); });
  }

  function elegirAsesor(id) {
    if (E.asesor !== id) { E.elegidos = []; E.diaSel = null; }
    E.asesor = id;
    $('#btnPaso3').disabled = false;
    pintarSeleccionAsesores();
  }

  function asesorPorId(id) { return E.asesores.find(function (a) { return a.id === id; }); }

  /* ------------------------------------------------------------------
     Paso 3: calendario
     ------------------------------------------------------------------ */
  function cargarHorarios() {
    var cont = $('#calCont');
    cont.innerHTML = '<div class="cargando">Buscando horarios libres…</div>';
    $('#btnPaso4').disabled = E.elegidos.length !== necesarios();
    var auto = E.asesor === 'auto';
    var a = auto ? null : asesorPorId(E.asesor);
    $('#tituloHorario').textContent = E.plan === 'pack' ? 'Elige 3 horarios (en días distintos)' : 'Elige día y hora';
    $('#subHorario').textContent = (auto ? 'Horarios de todo el equipo especialista en tu tema' : 'Horarios de ' + (a ? a.nombre : '')) +
      ' · hora de Lima · sesiones de 60 minutos.';

    R.rpc('slots_disponibles', { p_miembro: auto ? null : E.asesor, p_tema: auto ? (E.tema || null) : null })
      .then(function (slots) {
        E.slots = slots || [];
        E.porDia = {};
        E.slots.forEach(function (s) {
          var iso = new Date(s.inicio).toISOString(), dia = F.clave(iso);
          (E.porDia[dia] = E.porDia[dia] || {});
          (E.porDia[dia][iso] = E.porDia[dia][iso] || []).push(s.miembro_id);
        });
        // descartar elegidos que ya no existen
        E.elegidos = E.elegidos.filter(function (el) { var d = E.porDia[F.clave(el.inicio)]; return d && d[el.inicio]; });
        var dias = Object.keys(E.porDia).sort();
        if (!dias.length) return pintarSinHorarios();
        if (!E.diaSel || !E.porDia[E.diaSel]) E.diaSel = dias[0];
        E.mesVista = E.diaSel.slice(0, 7);
        pintarCalendario();
      })
      .catch(function (e) {
        cont.innerHTML = '<div class="alert alert-r"><i class="ti ti-alert-triangle" aria-hidden="true"></i><div>' + esc(e.message) + '</div></div>';
      });
  }

  function pintarSinHorarios() {
    var auto = E.asesor === 'auto';
    $('#calCont').innerHTML = '<div class="card center">' +
      '<i class="ti ti-calendar-off" style="font-size:34px;color:var(--ink-mute)" aria-hidden="true"></i>' +
      '<h3 class="paso-titulo" style="font-size:17px;margin-top:6px">' + (auto ? 'No hay horarios libres por ahora' : 'Este asesor no tiene horarios libres') + '</h3>' +
      '<p class="paso-sub">' + (auto ? 'El equipo está actualizando su disponibilidad.' : 'Prueba con otro asesor o deja que RUMBO elija por ti.') + ' También puedes escribirnos por WhatsApp.</p>' +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' +
        (auto ? '' : '<button class="btn btn-primary btn-sm" type="button" id="btnAuto">Probar con “RUMBO elige”</button>') +
        '<a class="btn btn-wsp btn-sm" target="_blank" rel="noopener" href="' + esc(R.whatsappLink(E.ajustes.whatsapp_numero, 'Hola RUMBO, quiero agendar una asesoría y no encuentro horarios.')) + '"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> WhatsApp</a>' +
      '</div></div>';
    var b = $('#btnAuto');
    if (b) b.addEventListener('click', function () { elegirAsesor('auto'); cargarHorarios(); });
  }

  // Asesores que tienen libres TODOS los horarios ya elegidos (para el pack con "RUMBO elige")
  function candidatos(excluirDia) {
    if (E.asesor !== 'auto') return [E.asesor];
    var set = null;
    E.elegidos.forEach(function (el) {
      if (excluirDia && F.clave(el.inicio) === excluirDia) return;
      set = set ? set.filter(function (id) { return el.miembros.indexOf(id) >= 0; }) : el.miembros.slice();
    });
    return set;
  }

  // ¿Se puede elegir este horario? (cupo del mes del asesor elegido, días distintos)
  function horaHabilitada(iso, miembros, reemplazaDia) {
    var cands = candidatos(reemplazaDia ? F.clave(iso) : null);
    var comunes = cands === null ? miembros : miembros.filter(function (id) { return cands.indexOf(id) >= 0; });
    if (E.plan === 'pack' && E.elegidos.length >= 3 && !reemplazaDia) return false;
    if (!comunes.length) return false;
    if (E.asesor !== 'auto' && E.plan === 'pack') {
      var a = asesorPorId(E.asesor);
      if (a && a.cupo_mensual != null) {
        var mesSlot = F.clave(iso).slice(0, 7);
        var mes = mesSlot === F.hoy().slice(0, 7) ? 'actual' : (mesSlot === F.sumarDias(F.hoy().slice(0, 7) + '-01', 32).slice(0, 7) ? 'siguiente' : null);
        var libres = mes === 'actual' ? a.libres_mes : mes === 'siguiente' ? a.libres_siguiente : null;
        if (libres != null) {
          var mismoMes = E.elegidos.filter(function (el) { return F.clave(el.inicio).slice(0, 7) === F.clave(iso).slice(0, 7) && F.clave(el.inicio) !== F.clave(iso); }).length;
          if (mismoMes + 1 > libres) return false;
        }
      }
    }
    return true;
  }

  function pintarCalendario() {
    var cont = $('#calCont');
    var hoy = F.hoy();
    var primerMes = hoy.slice(0, 7);
    var ultimoDia = F.sumarDias(hoy, Number(E.ajustes.ventana_dias || 30));
    var ultimoMes = ultimoDia.slice(0, 7);
    var mv = E.mesVista;
    var y = Number(mv.slice(0, 4)), m = Number(mv.slice(5, 7));
    var primero = mv + '-01';
    var diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var offset = F.diaSemana(primero) - 1;
    var elegidosDias = E.elegidos.map(function (el) { return F.clave(el.inicio); });

    var celdas = '';
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (d) { celdas += '<div class="cal-dow" aria-hidden="true">' + d + '</div>'; });
    for (var i = 0; i < offset; i++) celdas += '<div class="cal-dia vacio"></div>';
    for (var d = 1; d <= diasMes; d++) {
      var clave = mv + '-' + String(d).padStart(2, '0');
      var tiene = !!E.porDia[clave] && Object.keys(E.porDia[clave]).some(function (iso) {
        return horaHabilitada(iso, E.porDia[clave][iso], elegidosDias.indexOf(clave) >= 0);
      });
      var cls = 'cal-dia' + (tiene ? ' con' : '') + (clave === hoy ? ' hoy' : '') + (clave === E.diaSel ? ' sel' : '') + (elegidosDias.indexOf(clave) >= 0 ? ' elegido' : '');
      celdas += tiene
        ? '<button type="button" class="' + cls + '" data-dia="' + clave + '" aria-label="' + esc(F.larga(F.instante(clave, 12))) + '">' + d + '</button>'
        : '<div class="' + cls + '" aria-hidden="true">' + d + '</div>';
    }

    var horasHtml = '';
    if (E.diaSel && E.porDia[E.diaSel]) {
      var reemplaza = elegidosDias.indexOf(E.diaSel) >= 0;
      horasHtml = Object.keys(E.porDia[E.diaSel]).sort().map(function (iso) {
        var ok = horaHabilitada(iso, E.porDia[E.diaSel][iso], reemplaza);
        var sel = E.elegidos.some(function (el) { return el.inicio === iso; });
        return '<button type="button" class="hora' + (sel ? ' sel' : '') + '" data-hora="' + iso + '"' + (ok || sel ? '' : ' disabled') + '>' + esc(F.hora(iso)) + '</button>';
      }).join('');
    }

    var lista = '';
    if (E.plan === 'pack') {
      lista = '<div class="horas-titulo" style="margin-top:4px">Tus 3 sesiones</div><div class="elegidos">';
      for (var k = 0; k < 3; k++) {
        var el = E.elegidos[k];
        lista += el
          ? '<div class="elegido-item"><span class="num">' + (k + 1) + '</span><span>' + esc(F.corta(el.inicio)) + ' · ' + esc(F.hora(el.inicio)) + '</span><button type="button" class="quitar" data-quitar="' + el.inicio + '" aria-label="Quitar">×</button></div>'
          : '<div class="elegido-item vacio"><span class="num">' + (k + 1) + '</span><span>Elige un día y una hora</span></div>';
      }
      lista += '</div><p class="ayuda" style="margin-top:8px">Te recomendamos dejar al menos una semana entre sesiones.</p>';
    } else if (E.elegidos[0]) {
      lista = '<div class="alert alert-g" style="margin-top:4px"><i class="ti ti-circle-check" aria-hidden="true"></i><div>Elegiste el <strong>' + esc(F.completa(E.elegidos[0].inicio)) + '</strong></div></div>';
    }

    cont.innerHTML = '<div class="cal-layout">' +
      '<div class="cal">' +
        '<div class="cal-head"><div class="cal-mes">' + esc(F.mes(F.instante(primero, 12))) + '</div>' +
        '<div class="cal-nav"><button type="button" data-mes="-1" aria-label="Mes anterior"' + (mv <= primerMes ? ' disabled' : '') + '>‹</button>' +
        '<button type="button" data-mes="1" aria-label="Mes siguiente"' + (mv >= ultimoMes ? ' disabled' : '') + '>›</button></div></div>' +
        '<div class="cal-grid">' + celdas + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="horas-wrap" style="margin-top:0"><div class="horas-titulo">' + (E.diaSel ? esc(F.larga(F.instante(E.diaSel, 12))) : 'Elige un día') + '</div>' +
        '<div class="horas">' + (horasHtml || '<span class="small muted">Elige un día con punto verde.</span>') + '</div></div>' +
        '<div style="margin-top:16px">' + lista + '</div>' +
      '</div></div>';

    $$('[data-dia]', cont).forEach(function (b) { b.addEventListener('click', function () { E.diaSel = b.dataset.dia; pintarCalendario(); }); });
    $$('[data-mes]', cont).forEach(function (b) {
      b.addEventListener('click', function () {
        var nm = new Date(Date.UTC(y, m - 1 + Number(b.dataset.mes), 1));
        E.mesVista = nm.getUTCFullYear() + '-' + String(nm.getUTCMonth() + 1).padStart(2, '0');
        pintarCalendario();
      });
    });
    $$('[data-hora]', cont).forEach(function (b) { b.addEventListener('click', function () { elegirHora(b.dataset.hora); }); });
    $$('[data-quitar]', cont).forEach(function (b) {
      b.addEventListener('click', function () {
        E.elegidos = E.elegidos.filter(function (el) { return el.inicio !== b.dataset.quitar; });
        pintarCalendario();
      });
    });
    $('#btnPaso4').disabled = E.elegidos.length !== necesarios();
  }

  function elegirHora(iso) {
    var dia = F.clave(iso);
    var miembros = E.porDia[dia][iso];
    var ya = E.elegidos.findIndex(function (el) { return el.inicio === iso; });
    if (ya >= 0) { E.elegidos.splice(ya, 1); pintarCalendario(); return; }
    if (E.plan === 'pack') {
      var mismoDia = E.elegidos.findIndex(function (el) { return F.clave(el.inicio) === dia; });
      if (mismoDia >= 0) E.elegidos.splice(mismoDia, 1);
      else if (E.elegidos.length >= 3) { R.toast('Ya elegiste 3 horarios. Quita uno para cambiarlo.', 'error'); return; }
      E.elegidos.push({ inicio: iso, miembros: miembros.slice() });
      E.elegidos.sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; });
      if (E.elegidos.length < 3) R.toast('Sesión ' + E.elegidos.length + ' de 3 elegida. Elige otro día.');
    } else {
      E.elegidos = [{ inicio: iso, miembros: miembros.slice() }];
    }
    pintarCalendario();
  }

  /* ------------------------------------------------------------------
     Paso 4: datos
     ------------------------------------------------------------------ */
  function enlazarPaso4() {
    $('#f-menor').addEventListener('change', function () { $('#bloqueApoderado').hidden = !this.checked; });
    $('#btnCupon').addEventListener('click', aplicarCupon);
    $('#f-cupon').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); aplicarCupon(); } });
    $('#f-cupon').addEventListener('input', function () {
      if (E.cupon) { E.cupon = null; $('#cuponMsg').textContent = ''; $('#campoAmigo').hidden = true; }
    });
  }

  function aplicarCupon() {
    var codigo = $('#f-cupon').value.trim().toUpperCase();
    var msg = $('#cuponMsg');
    if (!codigo) { E.cupon = null; msg.textContent = ''; return Promise.resolve(); }
    msg.textContent = 'Verificando…';
    msg.style.color = '';
    return R.rpc('validar_cupon', { p_codigo: codigo, p_plan: E.plan, p_email: $('#f-email').value.trim() || null })
      .then(function (v) {
        if (v && v.valido) {
          E.cupon = Object.assign({ codigo: codigo }, v);
          msg.textContent = '✓ ' + v.mensaje + ' (−' + R.soles(v.descuento) + ')';
          msg.style.color = 'var(--green-d)';
          $('#campoAmigo').hidden = !v.requiere_amigo;
        } else {
          E.cupon = null;
          msg.textContent = (v && v.mensaje) || 'Código no válido.';
          msg.style.color = 'var(--red)';
          $('#campoAmigo').hidden = true;
        }
      })
      .catch(function (e) { msg.textContent = e.message; msg.style.color = 'var(--red)'; });
  }

  function valor(sel) { return ($(sel).value || '').trim(); }
  var reEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function validarDatos() {
    var errores = [];
    if (valor('#f-nombre').length < 3) errores.push(['#f-nombre', 'Escribe tu nombre completo.']);
    if (!reEmail.test(valor('#f-email'))) errores.push(['#f-email', 'Revisa tu correo.']);
    if (valor('#f-whatsapp').replace(/[^0-9]/g, '').length < 9) errores.push(['#f-whatsapp', 'Escribe tu número de WhatsApp (9 dígitos).']);
    if ($('#f-menor').checked) {
      if (valor('#f-apo-nombre').length < 3) errores.push(['#f-apo-nombre', 'Escribe el nombre de tu padre, madre o apoderado.']);
      if (!reEmail.test(valor('#f-apo-email')) && valor('#f-apo-tel').replace(/[^0-9]/g, '').length < 9) errores.push(['#f-apo-email', 'Escribe el correo o celular de tu apoderado.']);
      if (!$('#f-apo-autoriza').checked) errores.push(['#f-apo-autoriza', 'Necesitamos la autorización de tu apoderado.']);
    }
    if (valor('#f-cupon') && !E.cupon) errores.push(['#f-cupon', 'Aplica tu código con el botón “Aplicar” o bórralo.']);
    if (E.cupon && E.cupon.requiere_amigo && !reEmail.test(valor('#f-amigo'))) errores.push(['#f-amigo', 'Escribe el correo de tu amigo(a).']);
    if (!$('#f-privacidad').checked) errores.push(['#f-privacidad', 'Debes aceptar la política de privacidad.']);
    if (errores.length) { marcar(errores[0][0]); R.toast(errores[0][1], 'error'); return false; }
    return true;
  }

  /* ------------------------------------------------------------------
     Paso 5: resumen y reserva
     ------------------------------------------------------------------ */
  function precioLista() { return Number(E.plan === 'pack' ? E.ajustes.precio_pack : E.ajustes.precio_individual); }

  function pintarResumen() {
    var a = E.asesor === 'auto' ? null : asesorPorId(E.asesor);
    var tema = E.temas.find(function (t) { return t.id === E.tema; });
    var precio = precioLista();
    var desc = E.cupon ? Number(E.cupon.descuento) : 0;
    var total = Math.max(0, precio - desc);
    var filas = [
      ['Asesor(a)', a ? a.nombre : 'RUMBO elige (especialista disponible)'],
      ['Tema', tema ? tema.nombre : '—'],
      ['Plan', E.plan === 'pack' ? 'Pack de 3 sesiones' : 'Sesión individual (60 min)']
    ];
    var html = filas.map(function (f) { return '<div class="res-fila"><span>' + esc(f[0]) + '</span><span>' + esc(f[1]) + '</span></div>'; }).join('');
    html += '<div class="res-fila"><span>' + (E.elegidos.length > 1 ? 'Sesiones' : 'Fecha') + '</span><span>' +
      E.elegidos.map(function (el) { return esc(F.corta(el.inicio)) + ' · ' + esc(F.hora(el.inicio)); }).join('<br>') + '</span></div>';
    if (desc) html += '<div class="res-fila"><span>Descuento (' + esc(E.cupon.codigo) + ')</span><span style="color:var(--green-d)">−' + esc(R.soles(desc)) + '</span></div>';
    html += '<div class="res-fila res-total"><span>Total</span><span>' + (desc ? '<span class="tachado">' + esc(R.soles(precio)) + '</span>' : '') + esc(R.soles(total)) + '</span></div>';
    $('#resumen').innerHTML = html;
    $('#btnReservar').innerHTML = total === 0
      ? '<i class="ti ti-check" aria-hidden="true"></i> Confirmar mi asesoría'
      : '<i class="ti ti-lock" aria-hidden="true"></i> Apartar mi horario';
  }

  function cargandoBoton(btn, on, texto) {
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin" aria-hidden="true"></span> ' + (texto || 'Procesando…'); }
    else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
  }

  function reservar() {
    var btn = $('#btnReservar');
    cargandoBoton(btn, true, 'Apartando tu horario…');
    var datos = {
      plan: E.plan,
      asesor: E.asesor,
      tema: E.tema,
      inicios: E.elegidos.map(function (el) { return el.inicio; }),
      nombre: valor('#f-nombre'),
      email: valor('#f-email'),
      whatsapp: valor('#f-whatsapp'),
      ciudad: valor('#f-ciudad'),
      grado: valor('#f-grado'),
      detalle: valor('#f-detalle'),
      es_menor: $('#f-menor').checked,
      apoderado_nombre: valor('#f-apo-nombre'),
      apoderado_email: valor('#f-apo-email'),
      apoderado_telefono: valor('#f-apo-tel'),
      apoderado_autoriza: $('#f-apo-autoriza').checked,
      acepta_privacidad: $('#f-privacidad').checked,
      cupon: E.cupon ? E.cupon.codigo : '',
      amigo_email: valor('#f-amigo'),
      sitio_web: valor('#f-web')
    };
    R.api('reservar', datos).then(function (r) {
      E.reserva = r;
      try { localStorage.setItem('rumbo-ultima-reserva', JSON.stringify({ token: r.token, codigo: r.codigo, t: Date.now() })); } catch (e) { /* sin almacenamiento */ }
      pintarResultado();
      irPaso(6);
    }).catch(function (e) {
      R.toast(e.message, 'error');
      if (/horario|tomado|disponible|cupos/i.test(e.message)) {
        E.elegidos = [];
        R.rpc('asesores_publicos').then(function (l) { E.asesores = l || E.asesores; pintarSeleccionAsesores(); }).catch(function () {});
        irPaso(3, true);
        cargarHorarios();
      }
    }).then(function () { cargandoBoton(btn, false); });
  }

  /* ------------------------------------------------------------------
     Paso 6: pago o confirmación
     ------------------------------------------------------------------ */
  var temporizador = null;

  function pintarResultado() {
    var r = E.reserva, a = E.ajustes;
    var link = 'mi-reserva.html?t=' + encodeURIComponent(r.token);
    var cont = $('#resultado');
    if (r.estado === 'confirmada') {
      cont.innerHTML = '<div class="card center">' +
        '<div class="ok-check"><i class="ti ti-check" aria-hidden="true"></i></div>' +
        '<h2 class="ok-titulo">¡Tu asesoría está confirmada!</h2>' +
        '<p class="paso-sub">Código <strong>' + esc(r.codigo) + '</strong>. En unos minutos te llegará un correo con el link de Google Meet y la invitación al calendario.</p>' +
        '<a class="btn btn-primary" href="' + link + '#diagnostico">Completar mi diagnóstico <i class="ti ti-arrow-right" aria-hidden="true"></i></a>' +
      '</div>';
      return;
    }
    var datos = '';
    if (a.yape_numero) datos += '<div class="dato-pago"><span>Yape</span><strong>' + esc(a.yape_numero) + '</strong><button type="button" class="copiar" data-copiar="' + esc(a.yape_numero) + '">Copiar</button></div>';
    if (a.plin_numero) datos += '<div class="dato-pago"><span>Plin</span><strong>' + esc(a.plin_numero) + '</strong><button type="button" class="copiar" data-copiar="' + esc(a.plin_numero) + '">Copiar</button></div>';
    if (a.cuenta_bancaria) datos += '<div class="dato-pago"><span>Transferencia</span><strong style="font-size:12px">' + esc(a.cuenta_bancaria) + '</strong></div>';
    if (a.pago_titular) datos += '<p class="small muted" style="margin-top:4px">A nombre de: <strong>' + esc(a.pago_titular) + '</strong></p>';

    cont.innerHTML =
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:6px">' +
          '<div><div class="form-label" style="margin:0">Tu código</div><div class="codigo-grande">' + esc(r.codigo) + '</div></div>' +
          '<span class="estado-pill estado-pendiente_pago"><i class="ti ti-clock" aria-hidden="true"></i> Horario apartado</span>' +
        '</div>' +
        '<p class="paso-sub" style="margin-bottom:0">Paga <strong>' + esc(R.soles(r.monto)) + '</strong> y sube la captura antes del <strong>' + esc(F.completa(r.pago_vence_at)) +
        '</strong> (<span class="cuenta-regresiva" id="cuenta"></span>). Si no, el horario se libera.</p>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-title">1. Paga por Yape o Plin</div>' +
        '<div class="pago-grid">' +
          (a.qr_url ? '<img class="qr" src="' + esc(a.qr_url) + '" alt="Código QR para pagar a RUMBO">' : '<div></div>') +
          '<div>' + (datos || '<p class="small muted">Escanea el QR desde Yape o Plin.</p>') +
            '<div class="dato-pago" style="background:var(--amber-l);border-color:var(--rumbo-amber)"><span>Monto exacto</span><strong>' + esc(R.soles(r.monto)) + '</strong></div>' +
            '<p class="small muted">En el mensaje del pago escribe tu código <strong>' + esc(r.codigo) + '</strong>.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card" id="cardVoucher">' +
        '<div class="card-title">2. Sube la captura del pago</div>' +
        '<div class="campo"><span class="form-label">¿Cómo pagaste?</span><div class="metodos">' +
          ['yape', 'plin', 'transferencia'].map(function (m) {
            return '<button type="button" class="metodo' + (E.metodo === m ? ' sel' : '') + '" data-metodo="' + m + '">' + (m === 'yape' ? 'Yape' : m === 'plin' ? 'Plin' : 'Transferencia') + '</button>';
          }).join('') +
        '</div></div>' +
        '<label class="subida" id="zonaSubida"><input type="file" id="fileVoucher" accept="image/*,application/pdf">' +
          '<i class="ti ti-cloud-upload" aria-hidden="true"></i><div style="font-family:var(--font-display);font-weight:700;margin-top:6px" id="nombreArchivo">Toca para elegir la captura</div>' +
          '<div class="small muted">Imagen o PDF · máximo 5 MB</div><img class="vista" id="vistaVoucher" alt="" hidden></label>' +
        '<button class="btn btn-teal btn-lg btn-block" type="button" id="btnVoucher" style="margin-top:14px" disabled><i class="ti ti-send" aria-hidden="true"></i> Enviar comprobante</button>' +
      '</div>' +
      '<div class="grid2">' +
        '<a class="btn btn-line btn-block" href="' + link + '"><i class="ti ti-receipt" aria-hidden="true"></i> Lo subo después</a>' +
        '<a class="btn btn-wsp btn-block" target="_blank" rel="noopener" href="' + esc(R.whatsappLink(a.whatsapp_numero, 'Hola RUMBO, aparté mi asesoría con el código ' + r.codigo + '. Les envío mi comprobante.')) + '"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Enviar por WhatsApp</a>' +
      '</div>' +
      '<p class="small muted center" style="margin-top:12px">Te enviamos un correo con estos datos y el enlace para volver a esta página.</p>';

    $$('[data-copiar]', cont).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.copiar.replace(/\s/g, '');
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { R.toast('Número copiado'); }, function () { R.toast(t); });
      });
    });
    $$('[data-metodo]', cont).forEach(function (b) {
      b.addEventListener('click', function () {
        E.metodo = b.dataset.metodo;
        $$('[data-metodo]', cont).forEach(function (x) { x.classList.toggle('sel', x === b); });
      });
    });
    var input = $('#fileVoucher'), zona = $('#zonaSubida');
    input.addEventListener('change', function () { tomarArchivo(input.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('encima'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('encima'); }); });
    zona.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) tomarArchivo(e.dataTransfer.files[0]); });
    $('#btnVoucher').addEventListener('click', enviarVoucher);
    iniciarCuenta(r.pago_vence_at);
  }

  function iniciarCuenta(vence) {
    clearInterval(temporizador);
    function tick() {
      var el = document.getElementById('cuenta');
      if (!el) return clearInterval(temporizador);
      var ms = new Date(vence).getTime() - Date.now();
      if (ms <= 0) { el.textContent = 'plazo vencido'; return clearInterval(temporizador); }
      var h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
      el.textContent = 'quedan ' + h + ' h ' + String(m).padStart(2, '0') + ' min';
    }
    tick();
    temporizador = setInterval(tick, 30000);
  }

  function tomarArchivo(file) {
    R.prepararArchivo(file).then(function (a) {
      E.archivo = a;
      $('#nombreArchivo').textContent = file.name;
      var v = $('#vistaVoucher');
      if (a.vista) { v.src = a.vista; v.hidden = false; } else v.hidden = true;
      $('#btnVoucher').disabled = false;
    }).catch(function (e) { E.archivo = null; $('#btnVoucher').disabled = true; R.toast(e.message, 'error'); });
  }

  function enviarVoucher() {
    if (!E.archivo) return;
    var btn = $('#btnVoucher');
    cargandoBoton(btn, true, 'Enviando…');
    R.api('subir_voucher', { token: E.reserva.token, archivo_base64: E.archivo.base64, tipo: E.archivo.tipo, metodo: E.metodo })
      .then(function () {
        clearInterval(temporizador);
        $('#resultado').innerHTML = '<div class="card center">' +
          '<div class="ok-check"><i class="ti ti-check" aria-hidden="true"></i></div>' +
          '<h2 class="ok-titulo">¡Comprobante recibido!</h2>' +
          '<p class="paso-sub">Un coordinador verificará tu pago en las próximas horas. Te llegará un correo con la confirmación, el link de Google Meet y la invitación al calendario.</p>' +
          '<div class="card" style="text-align:left;margin:14px 0">' +
            '<div class="flow-step"><div class="flow-dot verde"><i class="ti ti-check" aria-hidden="true"></i></div><div class="flow-line"></div><div class="flow-body"><div class="flow-title">Horario apartado y comprobante enviado</div></div></div>' +
            '<div class="flow-step"><div class="flow-dot gris">2</div><div class="flow-line"></div><div class="flow-body"><div class="flow-title">Verificamos tu pago</div><div class="flow-desc">Te avisamos por correo.</div></div></div>' +
            '<div class="flow-step"><div class="flow-dot gris">3</div><div class="flow-line"></div><div class="flow-body"><div class="flow-title">Completa tu diagnóstico</div><div class="flow-desc">3 minutos para que tu asesor llegue preparado.</div></div></div>' +
            '<div class="flow-step"><div class="flow-dot gris">4</div><div class="flow-body"><div class="flow-title">Tu asesoría por Google Meet</div></div></div>' +
          '</div>' +
          '<a class="btn btn-primary" href="mi-reserva.html?t=' + encodeURIComponent(E.reserva.token) + '#diagnostico">Completar mi diagnóstico <i class="ti ti-arrow-right" aria-hidden="true"></i></a>' +
        '</div>';
      })
      .catch(function (e) { R.toast(e.message, 'error'); cargandoBoton(btn, false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
