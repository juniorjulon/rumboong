/* =====================================================================
   RUMBO · Mi reserva (mi-reserva.html?t=ENLACE-SECRETO)
   El estudiante ve su estado, sube el comprobante, reprograma (1 vez),
   completa el diagnóstico y responde la encuesta.
   ===================================================================== */
(function () {
  'use strict';
  var R = window.RUMBO, F = R.F, esc = R.esc;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Preguntas del diagnóstico previo. Puedes cambiarlas aquí:
     tipo: 'texto' (párrafo), 'linea' (una línea) o 'opciones'. */
  var PREGUNTAS = [
    { id: 'objetivo', tipo: 'texto', requerida: true, texto: '¿Qué te gustaría lograr al terminar la asesoría?', ayuda: 'Ej.: tener claro a qué becas postular y qué documentos preparar.' },
    { id: 'situacion', tipo: 'opciones', requerida: true, texto: '¿En qué punto estás?', opciones: ['Recién empiezo a explorar', 'Tengo algunas opciones en mente', 'Ya decidí y necesito ayuda con el proceso'] },
    { id: 'avance', tipo: 'texto', texto: '¿Qué has hecho hasta ahora sobre este tema?', ayuda: 'Investigaciones, postulaciones, conversaciones, test vocacionales…' },
    { id: 'opciones', tipo: 'linea', texto: '¿Qué carreras, universidades o becas estás considerando?' },
    { id: 'duda', tipo: 'texto', requerida: true, texto: '¿Cuál es tu mayor duda o preocupación ahora mismo?' },
    { id: 'seguimiento', tipo: 'opciones', texto: '¿Cómo prefieres recibir el seguimiento?', opciones: ['WhatsApp', 'Correo'] },
    { id: 'extra', tipo: 'texto', texto: '¿Algo más que tu asesor(a) deba saber?' }
  ];

  var token = R.params.get('t') || '';
  var datos = null;
  var archivo = null;
  var metodo = 'yape';
  var temporizador = null;

  function iniciar() {
    if (R.demo) $('#bannerDemo').hidden = false;
    $('#topWsp').href = R.whatsappLink(null, 'Hola RUMBO, tengo una consulta sobre mi reserva.');
    if (!R.configurado) return error('El sistema de reservas aún no está activo. Escríbenos por WhatsApp.');
    if (!token && !R.demo) return pintarBusqueda();
    if (!R.demo && !/^[0-9a-f-]{36}$/i.test(token)) return pintarBusqueda('El enlace no está completo. Entra con tu código y tu correo.');
    cargar();
  }

  function cargar() {
    return R.rpc('reserva_por_token', { p_token: R.demo ? '00000000-0000-4000-8000-000000000000' : token }).then(function (d) {
      if (!d) return pintarBusqueda('No encontramos esa reserva. Entra con tu código y tu correo.');
      datos = d;
      pintar();
    }).catch(function (e) { error(e.message); });
  }

  function error(msg) {
    $('#app').innerHTML = '<div class="card center"><i class="ti ti-alert-circle" style="font-size:34px;color:var(--ink-mute)" aria-hidden="true"></i>' +
      '<h1 class="paso-titulo" style="margin-top:6px">No pudimos abrir tu reserva</h1><p class="paso-sub">' + esc(msg) + '</p>' +
      '<a class="btn btn-wsp" target="_blank" rel="noopener" href="' + esc(R.whatsappLink()) + '"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Escribir por WhatsApp</a></div>';
  }

  function irAReserva(t) {
    location.href = 'mi-reserva.html?t=' + encodeURIComponent(t) + (R.demo ? '&demo=1' : '');
  }

  /* ------------------------------------------------------------------
     Sin enlace: entrar con código + correo, o pedir que se reenvíen
     ------------------------------------------------------------------ */
  function pintarBusqueda(aviso) {
    var guardada = null;
    try { guardada = JSON.parse(localStorage.getItem('rumbo-ultima-reserva') || 'null'); } catch (e) { /* sin almacenamiento */ }
    $('#app').innerHTML =
      '<h1 class="paso-titulo">Consulta tu reserva</h1>' +
      '<p class="paso-sub">Revisa el estado, sube tu comprobante, reprograma o completa tu diagnóstico.</p>' +
      (aviso ? '<div class="alert alert-y mb"><i class="ti ti-info-circle" aria-hidden="true"></i><div>' + esc(aviso) + '</div></div>' : '') +
      (guardada && guardada.token ? '<div class="alert alert-b mb"><i class="ti ti-history" aria-hidden="true"></i><div>En este navegador tienes la reserva <strong style="white-space:nowrap">' + esc(guardada.codigo) +
        '</strong>. <a href="#" id="lnkUltima">Abrirla</a></div></div>' : '') +
      '<form class="card" id="formBuscar" novalidate>' +
        '<div class="card-title">Entra con tu código</div>' +
        '<div class="grid2">' +
          '<div class="campo"><label class="form-label" for="bq-codigo">Código de reserva</label><input class="form-input" id="bq-codigo" placeholder="RB-XXXXX" maxlength="20" autocomplete="off" style="text-transform:uppercase"><div class="ayuda">Está en el correo de tu reserva y en la pantalla final.</div></div>' +
          '<div class="campo"><label class="form-label" for="bq-email">Correo con el que reservaste</label><input class="form-input" id="bq-email" type="email" autocomplete="email" maxlength="160"></div>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" type="submit" id="btnBuscar">Ver mi reserva <i class="ti ti-arrow-right" aria-hidden="true"></i></button>' +
      '</form>' +
      '<form class="card" id="formRecuperar" novalidate>' +
        '<div class="card-title">¿No tienes tu código?</div>' +
        '<p class="paso-sub" style="margin-bottom:12px">Escribe tu correo y te reenviamos los enlaces de tus reservas activas.</p>' +
        '<div class="fila-codigo fila-recuperar"><input class="form-input" id="rc-email" type="email" autocomplete="email" maxlength="160" placeholder="tu@correo.com" aria-label="Correo para reenviar enlaces">' +
        '<button class="btn btn-line" type="submit" id="btnRecuperar">Reenviarme mis enlaces</button></div>' +
        '<div class="honeypot" aria-hidden="true"><label for="rc-web">Tu sitio web</label><input id="rc-web" tabindex="-1" autocomplete="off"></div>' +
        '<div id="rcMsg" class="ayuda"></div>' +
      '</form>' +
      '<p class="small muted center" style="margin-top:18px">¿Aún no reservas? <a href="asesorias.html">Agenda tu asesoría</a></p>';

    var lnk = $('#lnkUltima');
    if (lnk) lnk.addEventListener('click', function (e) { e.preventDefault(); irAReserva(guardada.token); });

    $('#formBuscar').addEventListener('submit', function (e) {
      e.preventDefault();
      var codigo = $('#bq-codigo').value.trim(), email = $('#bq-email').value.trim();
      if (codigo.replace(/[^a-z0-9]/gi, '').length < 5) { $('#bq-codigo').focus(); R.toast('Escribe tu código de reserva (por ejemplo RB-7K2QM).', 'error'); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('#bq-email').focus(); R.toast('Escribe el correo con el que reservaste.', 'error'); return; }
      var btn = $('#btnBuscar');
      cargando(btn, true, 'Buscando…');
      R.rpc('buscar_reserva', { p_codigo: codigo, p_email: email }).then(function (t) {
        if (t) { irAReserva(t); return; }
        R.toast('No encontramos una reserva con ese código y ese correo. Revisa que estén bien escritos.', 'error');
        cargando(btn, false);
      }).catch(function (err) { R.toast(err.message, 'error'); cargando(btn, false); });
    });

    $('#formRecuperar').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#rc-email').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('#rc-email').focus(); R.toast('Escribe tu correo.', 'error'); return; }
      var btn = $('#btnRecuperar');
      cargando(btn, true, 'Enviando…');
      R.api('recuperar_reservas', { email: email, sitio_web: $('#rc-web').value }).then(function (r) {
        $('#rcMsg').textContent = '✓ ' + r.aviso;
        $('#rcMsg').style.color = 'var(--green-d)';
      }).catch(function (err) { R.toast(err.message, 'error'); })
        .then(function () { cargando(btn, false); });
    });
  }

  var ESTADOS = {
    pendiente_pago: ['Falta tu pago', 'ti-clock'],
    en_revision: ['Verificando tu pago', 'ti-hourglass'],
    confirmada: ['Confirmada', 'ti-circle-check'],
    cancelada: ['Cancelada', 'ti-circle-x'],
    expirada: ['Vencida', 'ti-clock-x']
  };

  function pintar() {
    var d = datos, a = d.ajustes || {};
    var est = ESTADOS[d.estado] || [d.estado, 'ti-info-circle'];
    $('#topWsp').href = R.whatsappLink(a.whatsapp_numero, 'Hola RUMBO, mi código de reserva es ' + d.codigo + '.');
    var html = '';

    html += '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">' +
        '<div><div class="form-label" style="margin:0">Reserva</div><div class="codigo-grande">' + esc(d.codigo) + '</div></div>' +
        '<span class="estado-pill estado-' + esc(d.estado) + '"><i class="ti ' + est[1] + '" aria-hidden="true"></i> ' + esc(est[0]) + '</span>' +
      '</div>' +
      '<div class="sel-head" style="margin:16px 0 4px">' +
        '<div class="sel-av">' + (d.asesor && d.asesor.foto_url ? '<img src="' + esc(d.asesor.foto_url) + '" alt="">' : '') + '</div>' +
        '<div><div class="sel-name">' + esc(d.asesor ? d.asesor.nombre : '') + '</div><div class="sel-role">' + esc(d.asesor ? d.asesor.rol || '' : '') + '</div></div>' +
      '</div>' +
      '<div class="resumen" style="margin-top:12px">' +
        '<div class="res-fila"><span>Estudiante</span><span>' + esc(d.nombre) + '</span></div>' +
        '<div class="res-fila"><span>Tema</span><span>' + esc(d.tema || '—') + '</span></div>' +
        '<div class="res-fila"><span>Plan</span><span>' + (d.plan === 'pack' ? 'Pack de 3 sesiones' : 'Sesión individual') + '</span></div>' +
        '<div class="res-fila res-total"><span>Total</span><span>' + (Number(d.descuento) ? '<span class="tachado">' + esc(R.soles(d.precio_lista)) + '</span>' : '') + esc(R.soles(d.monto)) + '</span></div>' +
      '</div>' +
    '</div>';

    html += bloqueEstado(d, a);
    html += bloqueSesiones(d);
    if (['pendiente_pago', 'en_revision', 'confirmada'].indexOf(d.estado) >= 0) html += bloqueDiagnostico(d);
    html += bloqueEncuestas(d);
    if (d.estado === 'confirmada' && d.codigo_referido) html += bloqueReferido(d, a);
    html += '<p class="small muted center" style="margin-top:18px">¿Necesitas ayuda? <a target="_blank" rel="noopener" href="' +
      esc(R.whatsappLink(a.whatsapp_numero, 'Hola RUMBO, mi código de reserva es ' + d.codigo + '.')) + '">Escríbenos por WhatsApp</a> con tu código.</p>';

    $('#app').innerHTML = html;
    enlazar();
    if (location.hash) {
      var dest = document.getElementById(location.hash.slice(1));
      if (dest) setTimeout(function () { dest.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);
    }
  }

  function datosPago(a, monto, codigo) {
    var h = '';
    if (a.yape_numero) h += '<div class="dato-pago"><span>Yape</span><strong>' + esc(a.yape_numero) + '</strong><button type="button" class="copiar" data-copiar="' + esc(a.yape_numero) + '">Copiar</button></div>';
    if (a.plin_numero) h += '<div class="dato-pago"><span>Plin</span><strong>' + esc(a.plin_numero) + '</strong><button type="button" class="copiar" data-copiar="' + esc(a.plin_numero) + '">Copiar</button></div>';
    if (a.cuenta_bancaria) h += '<div class="dato-pago"><span>Transferencia</span><strong style="font-size:12px">' + esc(a.cuenta_bancaria) + '</strong></div>';
    h += '<div class="dato-pago" style="background:var(--amber-l);border-color:var(--rumbo-amber)"><span>Monto exacto</span><strong>' + esc(R.soles(monto)) + '</strong></div>';
    if (a.pago_titular) h += '<p class="small muted">A nombre de <strong>' + esc(a.pago_titular) + '</strong>. En el mensaje escribe tu código <strong>' + esc(codigo) + '</strong>.</p>';
    return '<div class="pago-grid" style="margin-bottom:14px">' + (a.qr_url ? '<img class="qr" src="' + esc(a.qr_url) + '" alt="Código QR para pagar a RUMBO">' : '<div></div>') + '<div>' + h + '</div></div>';
  }

  function formularioVoucher(texto) {
    return '<div class="campo"><span class="form-label">¿Cómo pagaste?</span><div class="metodos">' +
      ['yape', 'plin', 'transferencia'].map(function (m) {
        return '<button type="button" class="metodo' + (metodo === m ? ' sel' : '') + '" data-metodo="' + m + '">' + (m === 'yape' ? 'Yape' : m === 'plin' ? 'Plin' : 'Transferencia') + '</button>';
      }).join('') + '</div></div>' +
      '<label class="subida" id="zonaSubida"><input type="file" id="fileVoucher" accept="image/*,application/pdf">' +
      '<i class="ti ti-cloud-upload" aria-hidden="true"></i><div style="font-family:var(--font-display);font-weight:700;margin-top:6px" id="nombreArchivo">' + esc(texto) + '</div>' +
      '<div class="small muted">Imagen o PDF · máximo 5 MB</div><img class="vista" id="vistaVoucher" alt="" hidden></label>' +
      '<button class="btn btn-teal btn-lg btn-block" type="button" id="btnVoucher" style="margin-top:14px" disabled><i class="ti ti-send" aria-hidden="true"></i> Enviar comprobante</button>';
  }

  function bloqueEstado(d, a) {
    if (d.estado === 'pendiente_pago') {
      return '<div class="card" id="pago">' +
        (d.pago_rechazo_motivo ? '<div class="alert alert-r mb"><i class="ti ti-alert-triangle" aria-hidden="true"></i><div><strong>No pudimos verificar tu pago:</strong> ' + esc(d.pago_rechazo_motivo) + '</div></div>' : '') +
        '<div class="card-title">Completa tu pago</div>' +
        '<p class="paso-sub">Sube la captura antes del <strong>' + esc(F.completa(d.pago_vence_at)) + '</strong> (<span class="cuenta-regresiva" id="cuenta"></span>). Si no, el horario se libera automáticamente.</p>' +
        datosPago(a, d.monto, d.codigo) + formularioVoucher('Toca para elegir la captura del pago') + '</div>';
    }
    if (d.estado === 'en_revision') {
      return '<div class="card" id="pago"><div class="alert alert-b"><i class="ti ti-hourglass" aria-hidden="true"></i><div><strong>Recibimos tu comprobante</strong> el ' + esc(F.completa(d.voucher_subido_at)) +
        '. Un coordinador lo está verificando; te llegará la confirmación por correo.</div></div>' +
        '<details style="margin-top:12px"><summary class="small" style="cursor:pointer;color:var(--rumbo-navy);font-weight:600">¿Subiste el archivo equivocado? Envía otro</summary><div style="margin-top:12px">' +
        formularioVoucher('Elegir otro comprobante') + '</div></details></div>';
    }
    if (d.estado === 'confirmada') {
      return '<div class="alert alert-g mb"><i class="ti ti-circle-check" aria-hidden="true"></i><div><strong>¡Todo listo!</strong> ' +
        (d.modalidad === 'B' ? 'Tu asesoría es gratuita gracias a un donante de RUMBO. ' : '') +
        'Recibiste la invitación de Google Calendar en <strong>' + esc(d.email) + '</strong>. Entra con ese correo 2 minutos antes.</div></div>';
    }
    if (d.estado === 'expirada') {
      return '<div class="card center"><p class="paso-sub">Esta reserva venció porque no recibimos el pago a tiempo y el horario se liberó. Si ya pagaste, escríbenos por WhatsApp con tu captura.</p>' +
        '<a class="btn btn-primary" href="asesorias.html">Reservar de nuevo</a></div>';
    }
    if (d.estado === 'cancelada') {
      return '<div class="card center"><p class="paso-sub">Esta reserva fue cancelada' + (d.cancelada_motivo ? ': ' + esc(d.cancelada_motivo) : '.') + '</p>' +
        '<a class="btn btn-primary" href="asesorias.html">Reservar una nueva asesoría</a></div>';
    }
    return '';
  }

  function bloqueSesiones(d) {
    if (['cancelada', 'expirada'].indexOf(d.estado) >= 0) return '';
    var a = d.ajustes || {};
    var filas = (d.sesiones || []).map(function (s) {
      var dt = new Date(s.inicio);
      var acciones = '';
      var pasada = new Date(s.fin).getTime() < Date.now();
      if (d.estado === 'confirmada' && s.meet_url && s.estado === 'activa' && !pasada) {
        acciones += '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="' + esc(s.meet_url) + '"><i class="ti ti-video" aria-hidden="true"></i> Entrar a la videollamada</a>';
      }
      if (s.puede_reprogramar) {
        acciones += '<button class="btn btn-line btn-sm" type="button" data-reprogramar="' + esc(s.id) + '"><i class="ti ti-calendar-repeat" aria-hidden="true"></i> Reprogramar</button>';
      } else if (s.estado === 'activa' && !pasada && s.reprogramaciones >= (a.max_reprogramaciones || 1)) {
        acciones += '<span class="small muted">Ya usaste tu reprogramación.</span>';
      }
      var etiqueta = s.estado === 'realizada' ? ' · ✅ realizada' : s.estado === 'no_asistio' ? ' · no asististe' : s.estado === 'cancelada' ? ' · cancelada' : '';
      return '<div class="sesion-card">' +
        '<div class="sesion-num"><div class="d">' + Number(F.clave(dt).slice(8, 10)) + '</div><div class="m">' + esc(F.corta(dt).split(' ').pop()) + '</div></div>' +
        '<div class="sesion-info"><div class="t">' + (d.sesiones.length > 1 ? 'Sesión ' + s.numero + ' · ' : '') + esc(F.larga(dt)) + '</div>' +
        '<div class="s">' + esc(F.hora(dt)) + ' – ' + esc(F.hora(s.fin)) + ' (hora de Lima)' + etiqueta + '</div>' +
        (acciones ? '<div class="sesion-acciones">' + acciones + '</div>' : '') +
        '<div data-picker="' + esc(s.id) + '"></div></div></div>';
    }).join('');
    return '<div class="card"><div class="card-title">' + ((d.sesiones || []).length > 1 ? 'Tus sesiones' : 'Tu sesión') + '</div>' + filas +
      '<p class="ayuda" style="margin-top:10px">Puedes reprogramar ' + (a.max_reprogramaciones === 1 ? '1 vez' : (a.max_reprogramaciones || 1) + ' veces') + ' cada sesión hasta ' + (a.limite_reprogramar_horas || 24) + ' h antes.</p></div>';
  }

  function bloqueDiagnostico(d) {
    var r = d.diagnostico || {};
    var campos = PREGUNTAS.map(function (q) {
      var id = 'dg-' + q.id, v = r[q.id] || '';
      var label = '<label class="form-label" for="' + id + '" style="text-transform:none;letter-spacing:0;font-family:var(--font-display);font-size:13.5px;font-weight:600;color:var(--ink)">' + esc(q.texto) + (q.requerida ? ' *' : '') + '</label>';
      var input;
      if (q.tipo === 'texto') input = '<textarea class="form-textarea" id="' + id + '" maxlength="1500">' + esc(v) + '</textarea>';
      else if (q.tipo === 'linea') input = '<input class="form-input" id="' + id + '" maxlength="300" value="' + esc(v) + '">';
      else input = '<select class="form-select" id="' + id + '"><option value="">Selecciona</option>' + q.opciones.map(function (o) {
        return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select>';
      return '<div class="campo">' + label + input + (q.ayuda ? '<div class="ayuda">' + esc(q.ayuda) + '</div>' : '') + '</div>';
    }).join('');
    return '<div class="card" id="diagnostico">' +
      '<div class="card-title">' + (d.diagnostico ? '✅ Diagnóstico enviado' : '📝 Diagnóstico previo (3 minutos)') + '</div>' +
      '<p class="paso-sub">' + (d.diagnostico ? 'Puedes actualizar tus respuestas hasta el día de tu sesión.' : 'Ayuda a que tu asesor(a) llegue con recursos pensados para ti.') + '</p>' +
      campos + '<button class="btn btn-primary btn-block" type="button" id="btnDiag">' + (d.diagnostico ? 'Actualizar respuestas' : 'Enviar diagnóstico') + '</button></div>';
  }

  function bloqueEncuestas(d) {
    if (d.estado !== 'confirmada') return '';
    var pendientes = (d.sesiones || []).filter(function (s) {
      return new Date(s.inicio).getTime() < Date.now() && !s.encuesta_hecha && s.estado !== 'cancelada' && s.estado !== 'no_asistio';
    });
    var hechas = (d.sesiones || []).filter(function (s) { return s.encuesta_hecha; });
    if (!pendientes.length) {
      return hechas.length ? '<div class="alert alert-g mb" id="encuesta"><i class="ti ti-heart" aria-hidden="true"></i><div>¡Gracias por responder la encuesta! Tu opinión nos ayuda a mejorar.</div></div>' : '';
    }
    var s = pendientes.find(function (x) { return x.id === R.params.get('encuesta'); }) || pendientes[0];
    function escala(nombre, desde, hasta) {
      var b = '';
      for (var i = desde; i <= hasta; i++) b += '<button type="button" data-escala="' + nombre + '" data-valor="' + i + '">' + (nombre === 'cal' ? '★' : i) + '</button>';
      return '<div class="escala' + (nombre === 'cal' ? ' estrellas' : '') + '" data-grupo="' + nombre + '">' + b + '</div>';
    }
    return '<div class="card" id="encuesta" data-sesion="' + esc(s.id) + '">' +
      '<div class="card-title">⭐ ¿Cómo te fue en tu sesión' + (d.sesiones.length > 1 ? ' ' + s.numero : '') + '?</div>' +
      '<div class="campo"><span class="form-label">Calificación general *</span>' + escala('cal', 1, 5) + '</div>' +
      '<div class="campo"><span class="form-label">¿Qué tan probable es que nos recomiendes? (0 a 10)</span>' + escala('rec', 0, 10) + '</div>' +
      '<div class="campo"><label class="form-label" for="en-mejor">¿Qué fue lo más útil?</label><textarea class="form-textarea" id="en-mejor" maxlength="2000"></textarea></div>' +
      '<div class="campo"><label class="form-label" for="en-mejorar">¿Qué podríamos mejorar?</label><textarea class="form-textarea" id="en-mejorar" maxlength="2000"></textarea></div>' +
      '<div class="campo"><label class="form-label" for="en-test">Si quieres, déjanos un testimonio</label><textarea class="form-textarea" id="en-test" maxlength="2000" placeholder="Ej.: Gracias a la asesoría ya sé a qué becas postular…"></textarea></div>' +
      '<label class="check mb"><input type="checkbox" id="en-autoriza"> Autorizo a RUMBO a publicar mi testimonio con mi primer nombre.</label>' +
      '<button class="btn btn-primary btn-block" type="button" id="btnEncuesta">Enviar encuesta</button></div>';
  }

  function bloqueReferido(d, a) {
    var texto = '¡Hola! Yo tuve una asesoría con RUMBO y me ayudó mucho. Usa mi código ' + d.codigo_referido + ' y obtén ' + R.soles(a.descuento_referido_monto) + ' de descuento: https://rumbo.org.pe/asesorias.html';
    return '<div class="card" style="background:var(--amber-l);border-color:var(--rumbo-amber)">' +
      '<div class="card-title">🎁 Recomienda y gana</div>' +
      '<p class="small" style="margin-bottom:10px;color:var(--amber-d)">Tu amigo obtiene ' + esc(R.soles(a.descuento_referido_monto)) + ' de descuento con tu código y, cuando confirme su asesoría, tú recibes un premio por correo para tu próxima sesión.</p>' +
      '<div class="dato-pago" style="background:#fff"><strong>' + esc(d.codigo_referido) + '</strong><button type="button" class="copiar" data-copiar="' + esc(d.codigo_referido) + '">Copiar</button></div>' +
      '<a class="btn btn-wsp btn-block" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(texto) + '"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Compartir por WhatsApp</a></div>';
  }

  /* ------------------------------------------------------------------ */
  function enlazar() {
    $$('[data-copiar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.dataset.copiar.replace(/\s/g, '');
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { R.toast('Copiado'); }, function () { R.toast(t); });
      });
    });
    $$('[data-metodo]').forEach(function (b) {
      b.addEventListener('click', function () { metodo = b.dataset.metodo; $$('[data-metodo]').forEach(function (x) { x.classList.toggle('sel', x === b); }); });
    });
    var input = $('#fileVoucher');
    if (input) {
      input.addEventListener('change', function () { tomarArchivo(input.files[0]); });
      $('#btnVoucher').addEventListener('click', enviarVoucher);
    }
    if (datos.estado === 'pendiente_pago') iniciarCuenta(datos.pago_vence_at);
    $$('[data-reprogramar]').forEach(function (b) { b.addEventListener('click', function () { abrirReprogramacion(b.dataset.reprogramar, b); }); });
    var bd = $('#btnDiag');
    if (bd) bd.addEventListener('click', guardarDiagnostico);
    $$('[data-escala]').forEach(function (b) {
      b.addEventListener('click', function () {
        var grupo = b.dataset.escala, val = Number(b.dataset.valor);
        $$('[data-escala="' + grupo + '"]').forEach(function (x) {
          var v = Number(x.dataset.valor);
          x.classList.toggle('sel', grupo === 'cal' ? v <= val : v === val);
        });
        $('[data-grupo="' + grupo + '"]').dataset.valor = val;
      });
    });
    var be = $('#btnEncuesta');
    if (be) be.addEventListener('click', guardarEncuesta);
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
      archivo = a;
      $('#nombreArchivo').textContent = file.name;
      var v = $('#vistaVoucher');
      if (a.vista) { v.src = a.vista; v.hidden = false; } else v.hidden = true;
      $('#btnVoucher').disabled = false;
    }).catch(function (e) { archivo = null; $('#btnVoucher').disabled = true; R.toast(e.message, 'error'); });
  }

  function cargando(btn, on, txt) {
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin" aria-hidden="true"></span> ' + (txt || 'Enviando…'); }
    else { btn.disabled = false; btn.innerHTML = btn.dataset.html || btn.innerHTML; }
  }

  function enviarVoucher() {
    if (!archivo) return;
    var btn = $('#btnVoucher');
    cargando(btn, true);
    R.api('subir_voucher', { token: token, archivo_base64: archivo.base64, tipo: archivo.tipo, metodo: metodo })
      .then(function () { R.toast('¡Comprobante recibido! Te avisaremos por correo.'); archivo = null; if (R.demo) { datos.estado = 'en_revision'; datos.voucher_subido_at = new Date().toISOString(); pintar(); } else cargar(); })
      .catch(function (e) { R.toast(e.message, 'error'); cargando(btn, false); });
  }

  /* --- Reprogramación --- */
  function abrirReprogramacion(sesionId, boton) {
    var cont = $('[data-picker="' + sesionId + '"]');
    if (cont.innerHTML) { cont.innerHTML = ''; return; }
    cont.innerHTML = '<div class="cargando">Buscando horarios libres de tu asesor…</div>';
    boton.disabled = true;
    var otras = (datos.sesiones || []).filter(function (s) { return s.id !== sesionId && s.estado !== 'cancelada'; })
      .map(function (s) { return F.clave(s.inicio); });
    R.rpc('slots_disponibles', { p_miembro: datos.asesor.id, p_excluir_sesion: R.demo ? null : sesionId }).then(function (slots) {
      boton.disabled = false;
      var actual = (datos.sesiones.find(function (s) { return s.id === sesionId; }) || {}).inicio;
      var porDia = {};
      (slots || []).forEach(function (s) {
        var iso = new Date(s.inicio).toISOString();
        if (actual && new Date(actual).toISOString() === iso) return;
        var dia = F.clave(iso);
        if (otras.indexOf(dia) >= 0) return;
        (porDia[dia] = porDia[dia] || []).push(iso);
      });
      var dias = Object.keys(porDia).sort();
      if (!dias.length) {
        cont.innerHTML = '<div class="alert alert-y" style="margin-top:10px"><i class="ti ti-calendar-off" aria-hidden="true"></i><div>Tu asesor no tiene otros horarios libres por ahora. Escríbenos por WhatsApp y lo coordinamos.</div></div>';
        return;
      }
      cont.innerHTML = '<div class="cal" style="margin-top:12px"><div class="horas-titulo">Elige el nuevo horario</div>' +
        dias.slice(0, 14).map(function (dia) {
          return '<div style="margin-bottom:10px"><div class="small" style="font-weight:600;margin-bottom:6px">' + esc(F.larga(F.instante(dia, 12))) + '</div><div class="horas">' +
            porDia[dia].map(function (iso) { return '<button type="button" class="hora" data-nuevo="' + iso + '">' + esc(F.hora(iso)) + '</button>'; }).join('') + '</div></div>';
        }).join('') +
        '<p class="ayuda">Solo puedes reprogramar una vez. El link de la videollamada se mantiene.</p></div>';
      $$('[data-nuevo]', cont).forEach(function (b) {
        b.addEventListener('click', function () {
          if (!window.confirm('¿Cambiar tu sesión al ' + F.completa(b.dataset.nuevo) + '? Solo puedes reprogramar una vez.')) return;
          $$('[data-nuevo]', cont).forEach(function (x) { x.disabled = true; });
          b.innerHTML = '<span class="spin" aria-hidden="true"></span>';
          R.api('reprogramar', { token: token, sesion_id: sesionId, inicio: b.dataset.nuevo })
            .then(function () {
              R.toast('¡Listo! Tu sesión quedó para el ' + F.completa(b.dataset.nuevo) + '. Te enviamos un correo.');
              if (R.demo) { cont.innerHTML = ''; } else cargar();
            })
            .catch(function (e) { R.toast(e.message, 'error'); cont.innerHTML = ''; });
        });
      });
    }).catch(function (e) { boton.disabled = false; cont.innerHTML = ''; R.toast(e.message, 'error'); });
  }

  /* --- Diagnóstico --- */
  function guardarDiagnostico() {
    var resp = {}, falta = null;
    PREGUNTAS.forEach(function (q) {
      var v = ($('#dg-' + q.id).value || '').trim();
      if (v) resp[q.id] = v;
      if (q.requerida && !v && !falta) falta = q;
    });
    if (falta) { $('#dg-' + falta.id).focus(); R.toast('Responde: ' + falta.texto, 'error'); return; }
    var btn = $('#btnDiag');
    cargando(btn, true, 'Guardando…');
    R.rpc('guardar_diagnostico', { p_token: token, p_respuestas: resp })
      .then(function () { R.toast('¡Gracias! Tu asesor(a) verá tus respuestas.'); datos.diagnostico = resp; pintar(); })
      .catch(function (e) { R.toast(e.message, 'error'); cargando(btn, false); });
  }

  /* --- Encuesta --- */
  function guardarEncuesta() {
    var card = $('#encuesta');
    var cal = Number(($('[data-grupo="cal"]').dataset.valor) || 0);
    var rec = $('[data-grupo="rec"]').dataset.valor;
    if (!cal) { R.toast('Elige una calificación de 1 a 5 estrellas.', 'error'); return; }
    var btn = $('#btnEncuesta');
    cargando(btn, true);
    R.rpc('guardar_encuesta', {
      p_token: token, p_sesion: card.dataset.sesion, p_calificacion: cal,
      p_recomendaria: rec === undefined ? null : Number(rec),
      p_lo_mejor: $('#en-mejor').value.trim(), p_mejorar: $('#en-mejorar').value.trim(),
      p_testimonio: $('#en-test').value.trim(), p_autoriza: $('#en-autoriza').checked
    }).then(function () {
      R.toast('¡Gracias por tu opinión! 💙');
      (datos.sesiones.find(function (s) { return s.id === card.dataset.sesion; }) || {}).encuesta_hecha = true;
      pintar();
    }).catch(function (e) { R.toast(e.message, 'error'); cargando(btn, false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
