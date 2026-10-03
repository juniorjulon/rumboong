-- =====================================================================
--  RUMBO · Sistema de reservas de asesorías personalizadas
--  ARCHIVO 1 DE 3 — ESTRUCTURA (tablas, reglas, funciones y seguridad)
--
--  Cómo usarlo:
--    Supabase → SQL Editor → "New query" → pega TODO este archivo → "Run".
--    Debe terminar con "Success. No rows returned".
--
--  Es seguro volver a ejecutarlo: no borra datos (usa "if not exists" y
--  "create or replace"). Si actualizas el sistema en el futuro, basta con
--  pegar la nueva versión de este archivo y ejecutarla otra vez.
-- =====================================================================

create extension if not exists pgcrypto   with schema extensions;
create extension if not exists btree_gist with schema extensions;

set search_path = public, extensions;


-- =====================================================================
-- 1. TABLAS
-- =====================================================================

-- 1.1 Ajustes generales (una sola fila). Se editan desde el panel → Ajustes.
create table if not exists public.ajustes (
  id                        int primary key default 1 check (id = 1),
  precio_individual         numeric(8,2) not null default 20,
  precio_pack               numeric(8,2) not null default 50,
  duracion_min              int  not null default 60  check (duracion_min between 15 and 180),
  anticipacion_horas        int  not null default 48  check (anticipacion_horas >= 0),
  ventana_dias              int  not null default 30  check (ventana_dias between 1 and 180),
  plazo_pago_horas          int  not null default 24  check (plazo_pago_horas between 1 and 168),
  limite_reprogramar_horas  int  not null default 24  check (limite_reprogramar_horas >= 0),
  max_reprogramaciones      int  not null default 1   check (max_reprogramaciones >= 0),
  hora_min                  smallint not null default 7  check (hora_min between 0 and 23),
  hora_max                  smallint not null default 21 check (hora_max between 0 and 23),
  descuento_referido_monto  numeric(8,2) not null default 5,
  premio_referente_monto    numeric(8,2) not null default 5,
  whatsapp_numero           text not null default '51999999999',
  yape_numero               text not null default '',
  plin_numero               text not null default '',
  pago_titular              text not null default 'RUMBO',
  cuenta_bancaria           text not null default '',
  qr_url                    text not null default 'assets/qr-donacion.jpg',
  emails_coordinacion       text[] not null default '{}',
  email_respuesta           text not null default 'rumbo.transformatufuturo@gmail.com',
  url_sitio                 text not null default 'https://rumbo.org.pe',
  reservas_abiertas         boolean not null default true,
  mensaje_cerrado           text not null default 'Estamos preparando nuevas fechas. Escríbenos por WhatsApp y te avisamos.',
  updated_at                timestamptz not null default now()
);
insert into public.ajustes (id) values (1) on conflict (id) do nothing;

-- 1.2 Temas de asesoría
create table if not exists public.temas (
  id      text primary key check (id ~ '^[a-z0-9-]+$'),
  nombre  text not null,
  pilar   text,
  orden   int  not null default 0,
  activo  boolean not null default true
);

-- 1.3 Miembros del equipo (asesores, coordinadores y administradores)
create table if not exists public.miembros (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references auth.users(id) on delete set null,
  slug            text unique not null check (slug ~ '^[a-z0-9-]+$'),
  nombre          text not null,
  email           text unique not null,
  whatsapp        text,
  rol_publico     text,
  formacion       text,
  trabajo         text,
  foto_url        text,
  linkedin_url    text,
  etiquetas       text[] not null default '{}',
  temas           text[] not null default '{}',
  es_asesor       boolean not null default true,
  es_coordinador  boolean not null default false,
  es_admin        boolean not null default false,
  cupo_mensual    int check (cupo_mensual is null or cupo_mensual >= 0),
  sala_fija_url   text,
  publicado       boolean not null default true,
  activo          boolean not null default true,
  orden           int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 1.4 Disponibilidad: horario fijo semanal (1 = lunes … 7 = domingo)
create table if not exists public.disponibilidad_semanal (
  miembro_id  uuid not null references public.miembros(id) on delete cascade,
  dia         smallint not null check (dia between 1 and 7),
  hora        smallint not null check (hora between 0 and 23),
  primary key (miembro_id, dia, hora)
);

-- 1.5 Disponibilidad: cambios puntuales por fecha (horario extra o bloqueo)
create table if not exists public.disponibilidad_fecha (
  miembro_id  uuid not null references public.miembros(id) on delete cascade,
  fecha       date not null,
  hora        smallint not null check (hora between 0 and 23),
  tipo        text not null check (tipo in ('extra', 'bloqueo')),
  primary key (miembro_id, fecha, hora)
);

-- 1.6 Días completos bloqueados (viajes, exámenes, vacaciones)
create table if not exists public.dias_bloqueados (
  miembro_id  uuid not null references public.miembros(id) on delete cascade,
  fecha       date not null,
  motivo      text,
  primary key (miembro_id, fecha)
);

-- 1.7 Donantes (Modalidad B)
create table if not exists public.donantes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  email       text,
  telefono    text,
  nivel       text,
  monto       numeric(8,2),
  fecha       date not null default current_date,
  notas       text,
  created_at  timestamptz not null default now()
);

-- 1.8 Cupones y códigos (beca, amigos, referido, porcentaje, monto)
create table if not exists public.cupones (
  codigo                text primary key check (codigo = upper(codigo) and codigo ~ '^[A-Z0-9-]{3,40}$'),
  tipo                  text not null check (tipo in ('porcentaje', 'monto', 'beca', 'amigos', 'referido')),
  valor                 numeric(8,2) not null default 0 check (valor >= 0),
  aplica_a              text not null default 'todos' check (aplica_a in ('todos', 'individual', 'pack')),
  usos_max              int check (usos_max is null or usos_max >= 0),
  usos                  int not null default 0,
  vence_at              timestamptz,
  activo                boolean not null default true,
  solo_email            text,
  donante_id            uuid references public.donantes(id) on delete set null,
  referente_reserva_id  uuid,
  descripcion           text,
  creado_por            uuid references public.miembros(id) on delete set null,
  created_at            timestamptz not null default now()
);

-- 1.9 Reservas (lo que compra el estudiante: 1 sesión o pack de 3)
create table if not exists public.reservas (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text unique not null,
  token                 uuid unique not null default gen_random_uuid(),
  plan                  text not null check (plan in ('individual', 'pack')),
  modalidad             text not null default 'A' check (modalidad in ('A', 'B')),
  estado                text not null default 'pendiente_pago'
                        check (estado in ('pendiente_pago', 'en_revision', 'confirmada', 'cancelada', 'expirada')),
  miembro_id            uuid not null references public.miembros(id),
  asignado_por_rumbo    boolean not null default false,
  tema_id               text references public.temas(id) on delete set null,
  detalle               text,
  -- estudiante
  nombre                text not null,
  email                 text not null,
  whatsapp              text not null,
  ciudad                text,
  grado                 text,
  es_menor              boolean not null default false,
  apoderado_nombre      text,
  apoderado_email       text,
  apoderado_telefono    text,
  apoderado_autoriza    boolean not null default false,
  acepta_privacidad_at  timestamptz,
  -- dinero
  precio_lista          numeric(8,2) not null,
  descuento             numeric(8,2) not null default 0,
  monto                 numeric(8,2) not null,
  cupon_codigo          text references public.cupones(codigo) on update cascade on delete set null,
  amigo_email           text,
  -- pago
  pago_metodo           text,
  pago_vence_at         timestamptz,
  voucher_path          text,
  voucher_subido_at     timestamptz,
  pago_verificado_por   uuid references public.miembros(id) on delete set null,
  pago_verificado_at    timestamptz,
  pago_rechazo_motivo   text,
  -- control
  origen                text not null default 'web',
  notas_internas        text,
  cancelada_motivo      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists reservas_estado_idx on public.reservas (estado);
create index if not exists reservas_email_idx  on public.reservas (lower(email));
create index if not exists reservas_miembro_idx on public.reservas (miembro_id);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cupones_referente_fk') then
    alter table public.cupones
      add constraint cupones_referente_fk foreign key (referente_reserva_id)
      references public.reservas(id) on delete set null;
  end if;
end $$;

-- 1.10 Sesiones (cada encuentro de 60 min). Un pack crea 3.
create table if not exists public.sesiones (
  id                    uuid primary key default gen_random_uuid(),
  reserva_id            uuid not null references public.reservas(id) on delete cascade,
  numero                smallint not null default 1,
  miembro_id            uuid not null references public.miembros(id),
  inicio                timestamptz not null,
  fin                   timestamptz not null,
  estado                text not null default 'activa'
                        check (estado in ('activa', 'realizada', 'no_asistio', 'cancelada')),
  meet_url              text,
  meet_metodo           text,
  google_event_id       text,
  reprogramaciones      smallint not null default 0,
  recordatorio_24h_at   timestamptz,
  recordatorio_2h_at    timestamptz,
  encuesta_enviada_at   timestamptz,
  informe_recordado_at  timestamptz,
  informe_enviado_at    timestamptz,
  notas_asesor          text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (fin > inicio),
  unique (reserva_id, numero)
);
create index if not exists sesiones_miembro_inicio_idx on public.sesiones (miembro_id, inicio);
create index if not exists sesiones_inicio_idx on public.sesiones (inicio);

-- ★ REGLA ANTI-DOBLE RESERVA: la base de datos rechaza dos sesiones del mismo
--   asesor que se crucen en el tiempo (aunque lleguen en el mismo milisegundo).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'sesiones_sin_choques') then
    alter table public.sesiones add constraint sesiones_sin_choques
      exclude using gist (miembro_id with =, tstzrange(inicio, fin, '[)') with &&)
      where (estado <> 'cancelada');
  end if;
end $$;

-- 1.11 Diagnóstico previo (uno por reserva)
create table if not exists public.diagnosticos (
  reserva_id  uuid primary key references public.reservas(id) on delete cascade,
  respuestas  jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1.12 Encuesta de satisfacción (una por sesión)
create table if not exists public.encuestas (
  sesion_id            uuid primary key references public.sesiones(id) on delete cascade,
  calificacion         smallint check (calificacion between 1 and 5),
  recomendaria         smallint check (recomendaria between 0 and 10),
  lo_mejor             text,
  mejorar              text,
  testimonio           text,
  autoriza_testimonio  boolean not null default false,
  created_at           timestamptz not null default now()
);

-- 1.13 Historial de cada reserva (quién hizo qué y cuándo)
create table if not exists public.historial (
  id          bigserial primary key,
  reserva_id  uuid references public.reservas(id) on delete cascade,
  accion      text not null,
  detalle     jsonb,
  actor       text not null default 'sistema',
  created_at  timestamptz not null default now()
);
create index if not exists historial_reserva_idx on public.historial (reserva_id, created_at);

-- 1.14 Registro de correos enviados (para revisar si algo falló)
create table if not exists public.notificaciones (
  id            bigserial primary key,
  tipo          text not null,
  reserva_id    uuid references public.reservas(id) on delete cascade,
  sesion_id     uuid references public.sesiones(id) on delete cascade,
  destinatario  text,
  ok            boolean not null,
  detalle       text,
  created_at    timestamptz not null default now()
);
create index if not exists notificaciones_fecha_idx on public.notificaciones (created_at desc);


-- =====================================================================
-- 2. FUNCIONES DE APOYO
-- =====================================================================

create or replace function public.tocar_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['ajustes', 'miembros', 'reservas', 'sesiones', 'diagnosticos'] loop
    execute format('drop trigger if exists %I_updated on public.%I', t, t);
    execute format('create trigger %I_updated before update on public.%I for each row execute function public.tocar_updated_at()', t, t);
  end loop;
end $$;

-- Lanza un error con un mensaje que se puede mostrar tal cual al usuario.
create or replace function public.rumbo_error(p_mensaje text) returns void
language plpgsql as $$
begin
  raise exception using message = p_mensaje, hint = 'rumbo';
end $$;

-- Código aleatorio legible (sin O/0/I/1), criptográficamente seguro.
create or replace function public.codigo_aleatorio(n int) returns text
language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(b.bytes, i) % 31), 1), '')
  from (select gen_random_bytes(n) as bytes) b, generate_series(0, n - 1) i
$$;

-- Mes (en hora de Lima) de un instante.
create or replace function public.mes_lima(p timestamptz) returns timestamp
language sql immutable as $$
  select date_trunc('month', p at time zone 'America/Lima')
$$;

-- Quién soy (según la sesión iniciada en el panel)
create or replace function public.mi_miembro() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.miembros where user_id = auth.uid() and activo limit 1
$$;

create or replace function public.es_coordinador() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select es_coordinador or es_admin from public.miembros
                   where user_id = auth.uid() and activo limit 1), false)
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select es_admin from public.miembros
                   where user_id = auth.uid() and activo limit 1), false)
$$;

create or replace function public.ping() returns text
language sql stable as $$ select 'ok' $$;


-- =====================================================================
-- 3. HORARIOS DISPONIBLES
--    Horario semanal + extras por fecha − bloqueos − días bloqueados
--    − sesiones ya tomadas − meses con el cupo lleno
--    respetando anticipación mínima y ventana máxima.
-- =====================================================================

drop function if exists public.slots_disponibles(uuid, text, date, date, boolean);
create or replace function public.slots_disponibles(
  p_miembro               uuid    default null,
  p_tema                  text    default null,
  p_desde                 date    default null,
  p_hasta                 date    default null,
  p_ignorar_anticipacion  boolean default false,
  p_excluir_sesion        uuid    default null
) returns table (miembro_id uuid, inicio timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  with aj as (
    select * from public.ajustes where id = 1
  ),
  rango as (
    select greatest(coalesce(p_desde, h.hoy), h.hoy)                                   as d1,
           least(coalesce(p_hasta, h.hoy + aj.ventana_dias), h.hoy + aj.ventana_dias)  as d2
    from aj, (select (now() at time zone 'America/Lima')::date as hoy) h
  ),
  hay_tema as (
    select exists (
      select 1 from public.miembros m
      where m.activo and m.es_asesor and m.publicado and p_tema = any (m.temas)
    ) as si
  ),
  asesores as (
    select m.id, m.cupo_mensual
    from public.miembros m, hay_tema ht
    where m.activo and m.es_asesor
      and case when p_miembro is not null then m.id = p_miembro
               else m.publicado and (p_tema is null or not ht.si or p_tema = any (m.temas)) end
  ),
  dias as (
    select g::date as fecha from rango r, generate_series(r.d1, r.d2, interval '1 day') g
  ),
  candidatos as (
    select ds.miembro_id, d.fecha, ds.hora
    from asesores a
    join public.disponibilidad_semanal ds on ds.miembro_id = a.id
    join dias d on extract(isodow from d.fecha)::int = ds.dia
    union
    select df.miembro_id, df.fecha, df.hora
    from asesores a
    join public.disponibilidad_fecha df on df.miembro_id = a.id and df.tipo = 'extra'
    join dias d on d.fecha = df.fecha
  ),
  libres as (
    select c.miembro_id, ((c.fecha + make_time(c.hora, 0, 0)) at time zone 'America/Lima') as inicio
    from candidatos c
    where not exists (select 1 from public.disponibilidad_fecha b
                      where b.miembro_id = c.miembro_id and b.fecha = c.fecha
                        and b.hora = c.hora and b.tipo = 'bloqueo')
      and not exists (select 1 from public.dias_bloqueados x
                      where x.miembro_id = c.miembro_id and x.fecha = c.fecha)
  )
  select l.miembro_id, l.inicio
  from libres l
  join asesores a on a.id = l.miembro_id
  cross join aj
  where l.inicio > now()
    and (p_ignorar_anticipacion or l.inicio >= now() + make_interval(hours => aj.anticipacion_horas))
    and l.inicio <= now() + make_interval(days => aj.ventana_dias)
    and not exists (
      select 1 from public.sesiones s
      where s.miembro_id = l.miembro_id
        and s.estado <> 'cancelada'
        and (p_excluir_sesion is null or s.id <> p_excluir_sesion)
        and tstzrange(s.inicio, s.fin, '[)')
            && tstzrange(l.inicio, l.inicio + make_interval(mins => aj.duracion_min), '[)'))
    and (a.cupo_mensual is null or (
      select count(*) from public.sesiones s
      where s.miembro_id = l.miembro_id
        and s.estado <> 'cancelada'
        and (p_excluir_sesion is null or s.id <> p_excluir_sesion)
        and public.mes_lima(s.inicio) = public.mes_lima(l.inicio)
    ) < a.cupo_mensual)
  order by l.inicio, l.miembro_id
$$;

-- ¿Los horarios pedidos siguen libres para este asesor? (incluye el cupo del mes)
create or replace function public.rumbo_horarios_ok(
  p_miembro uuid, p_inicios timestamptz[], p_ignorar_anticipacion boolean, p_excluir_sesion uuid default null
) returns boolean
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_cupo  int;
  v_d1    date;
  v_d2    date;
  v_mes   record;
  v_slots timestamptz[];
begin
  select cupo_mensual into v_cupo from public.miembros where id = p_miembro;
  select min((t at time zone 'America/Lima')::date), max((t at time zone 'America/Lima')::date)
    into v_d1, v_d2 from unnest(p_inicios) t;

  select array_agg(s.inicio) into v_slots
  from public.slots_disponibles(p_miembro, null, v_d1, v_d2, p_ignorar_anticipacion, p_excluir_sesion) s;

  if v_slots is null or not (p_inicios <@ v_slots) then
    return false;
  end if;

  if v_cupo is not null then
    for v_mes in
      select public.mes_lima(t) as mes, count(*) as n from unnest(p_inicios) t group by 1
    loop
      if (select count(*) from public.sesiones s
          where s.miembro_id = p_miembro and s.estado <> 'cancelada'
            and (p_excluir_sesion is null or s.id <> p_excluir_sesion)
            and public.mes_lima(s.inicio) = v_mes.mes) + v_mes.n > v_cupo then
        return false;
      end if;
    end loop;
  end if;
  return true;
end $$;


-- =====================================================================
-- 4. DATOS PÚBLICOS PARA LA WEB (sin datos personales)
-- =====================================================================

-- Sesiones ocupadas de un asesor en un mes (hora de Lima)
create or replace function public.rumbo_usadas_mes(p_miembro uuid, p_mes timestamp) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.sesiones s
  where s.miembro_id = p_miembro and s.estado <> 'cancelada' and public.mes_lima(s.inicio) = p_mes
$$;

drop function if exists public.asesores_publicos();
create or replace function public.asesores_publicos()
returns table (
  id uuid, slug text, nombre text, rol_publico text, formacion text, trabajo text,
  foto_url text, linkedin_url text, etiquetas text[], temas text[],
  cupo_mensual int, usadas_mes int, libres_mes int, libres_siguiente int, proximo timestamptz
)
language sql stable security definer set search_path = public, extensions as $$
  select m.id, m.slug, m.nombre, m.rol_publico, m.formacion, m.trabajo,
         m.foto_url, m.linkedin_url, m.etiquetas, m.temas, m.cupo_mensual,
         public.rumbo_usadas_mes(m.id, public.mes_lima(now())),
         case when m.cupo_mensual is null then null
              else greatest(m.cupo_mensual - public.rumbo_usadas_mes(m.id, public.mes_lima(now())), 0) end,
         case when m.cupo_mensual is null then null
              else greatest(m.cupo_mensual - public.rumbo_usadas_mes(m.id, public.mes_lima(now()) + interval '1 month'), 0) end,
         (select min(x.inicio) from public.slots_disponibles(m.id) x)
  from public.miembros m
  where m.activo and m.es_asesor and m.publicado
  order by m.orden, m.nombre
$$;

create or replace function public.ajustes_publicos() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'precio_individual', precio_individual, 'precio_pack', precio_pack,
    'duracion_min', duracion_min, 'anticipacion_horas', anticipacion_horas,
    'ventana_dias', ventana_dias, 'plazo_pago_horas', plazo_pago_horas,
    'limite_reprogramar_horas', limite_reprogramar_horas,
    'max_reprogramaciones', max_reprogramaciones,
    'descuento_referido_monto', descuento_referido_monto,
    'whatsapp_numero', whatsapp_numero, 'yape_numero', yape_numero,
    'plin_numero', plin_numero, 'pago_titular', pago_titular,
    'cuenta_bancaria', cuenta_bancaria, 'qr_url', qr_url,
    'reservas_abiertas', reservas_abiertas, 'mensaje_cerrado', mensaje_cerrado
  ) from public.ajustes where id = 1
$$;

-- Calcula el descuento de un código sin usarlo todavía.
create or replace function public.validar_cupon(p_codigo text, p_plan text, p_email text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  c        public.cupones%rowtype;
  aj       public.ajustes%rowtype;
  v_precio numeric;
  v_desc   numeric;
  v_ref    text;
begin
  select * into aj from public.ajustes where id = 1;
  select * into c from public.cupones where codigo = upper(trim(p_codigo));
  if not found or not c.activo then
    return jsonb_build_object('valido', false, 'mensaje', 'Ese código no existe o ya no está activo.');
  end if;
  if c.vence_at is not null and c.vence_at < now() then
    return jsonb_build_object('valido', false, 'mensaje', 'Ese código ya venció.');
  end if;
  if c.usos_max is not null and c.usos >= c.usos_max then
    return jsonb_build_object('valido', false, 'mensaje', 'Ese código ya fue utilizado.');
  end if;
  if c.aplica_a <> 'todos' and c.aplica_a <> p_plan then
    return jsonb_build_object('valido', false, 'mensaje',
      'Ese código solo aplica para ' || case c.aplica_a when 'pack' then 'el Pack de 3 sesiones.' else 'la sesión individual.' end);
  end if;
  if c.solo_email is not null and p_email is not null and lower(c.solo_email) <> lower(trim(p_email)) then
    return jsonb_build_object('valido', false, 'mensaje', 'Ese código es personal y está asociado a otro correo.');
  end if;
  if c.tipo = 'referido' and p_email is not null then
    select lower(email) into v_ref from public.reservas where id = c.referente_reserva_id;
    if v_ref = lower(trim(p_email)) then
      return jsonb_build_object('valido', false, 'mensaje', 'No puedes usar tu propio código de referido.');
    end if;
  end if;

  v_precio := case when p_plan = 'pack' then aj.precio_pack else aj.precio_individual end;
  v_desc := case c.tipo
    when 'porcentaje' then round(v_precio * c.valor / 100, 2)
    when 'amigos'     then round(v_precio * c.valor / 100, 2)
    when 'monto'      then c.valor
    when 'referido'   then aj.descuento_referido_monto
    when 'beca'       then v_precio
  end;
  v_desc := least(v_desc, v_precio);

  return jsonb_build_object(
    'valido', true,
    'tipo', c.tipo,
    'descuento', v_desc,
    'total', v_precio - v_desc,
    'requiere_amigo', c.tipo = 'amigos',
    'mensaje', case c.tipo
      when 'beca'     then '¡Código de beca válido! Tu asesoría es gratuita.'
      when 'amigos'   then 'Descuento de amigos aplicado. Escribe el correo de tu amigo.'
      when 'referido' then 'Código de referido aplicado.'
      else 'Código aplicado.' end
  );
end $$;


-- =====================================================================
-- 5. CREAR UNA RESERVA (la usa la función del servidor, nunca el navegador)
-- =====================================================================

create or replace function public.crear_reserva(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  aj            public.ajustes%rowtype;
  v_panel       boolean := coalesce((p->>'desde_panel')::boolean, false);
  v_forzar      boolean := coalesce((p->>'desde_panel')::boolean, false) and coalesce((p->>'forzar')::boolean, false);
  v_plan        text    := p->>'plan';
  v_tema        text    := nullif(trim(coalesce(p->>'tema', '')), '');
  v_email       text    := lower(trim(coalesce(p->>'email', '')));
  v_nombre      text    := trim(coalesce(p->>'nombre', ''));
  v_whatsapp    text    := regexp_replace(coalesce(p->>'whatsapp', ''), '[^0-9+]', '', 'g');
  v_menor       boolean := coalesce((p->>'es_menor')::boolean, false);
  v_amigo       text    := lower(nullif(trim(coalesce(p->>'amigo_email', '')), ''));
  v_cod_cupon   text    := upper(nullif(trim(coalesce(p->>'cupon', '')), ''));
  v_asesor_txt  text    := coalesce(nullif(p->>'asesor', ''), 'auto');
  v_auto        boolean;
  v_asesor      uuid;
  v_inicios     timestamptz[];
  v_n           int;
  v_cand        record;
  v_cupon       public.cupones%rowtype;
  v_precio      numeric;
  v_desc        numeric := 0;
  v_monto       numeric;
  v_modalidad   text := 'A';
  v_estado      text;
  v_metodo      text;
  v_codigo      text;
  v_ref_email   text;
  v_hay_tema    boolean;
  r             public.reservas%rowtype;
  v_conf        jsonb := null;
  i             int;
begin
  select * into aj from public.ajustes where id = 1;
  v_auto := v_asesor_txt = 'auto';

  -- 5.1 Validaciones de datos
  if not v_panel and not aj.reservas_abiertas then
    perform public.rumbo_error(aj.mensaje_cerrado);
  end if;
  if v_plan is null or v_plan not in ('individual', 'pack') then
    perform public.rumbo_error('Elige un plan válido.');
  end if;
  if length(v_nombre) < 3 or length(v_nombre) > 120 then
    perform public.rumbo_error('Escribe tu nombre completo.');
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 160 then
    perform public.rumbo_error('Revisa tu correo electrónico.');
  end if;
  if length(regexp_replace(v_whatsapp, '[^0-9]', '', 'g')) < 9 then
    perform public.rumbo_error('Escribe un número de WhatsApp válido (9 dígitos).');
  end if;
  if not v_panel and not coalesce((p->>'acepta_privacidad')::boolean, false) then
    perform public.rumbo_error('Debes aceptar la política de privacidad para continuar.');
  end if;
  if v_menor and not v_panel then
    if length(trim(coalesce(p->>'apoderado_nombre', ''))) < 3 then
      perform public.rumbo_error('Como eres menor de edad, escribe el nombre de tu padre, madre o apoderado.');
    end if;
    if nullif(trim(coalesce(p->>'apoderado_email', '')), '') is null
       and length(regexp_replace(coalesce(p->>'apoderado_telefono', ''), '[^0-9]', '', 'g')) < 9 then
      perform public.rumbo_error('Escribe el correo o el celular de tu padre, madre o apoderado.');
    end if;
    if not coalesce((p->>'apoderado_autoriza')::boolean, false) then
      perform public.rumbo_error('Necesitamos la autorización de tu padre, madre o apoderado.');
    end if;
  end if;
  if v_tema is not null and not exists (select 1 from public.temas where id = v_tema) then
    perform public.rumbo_error('Elige un tema válido.');
  end if;
  if length(coalesce(p->>'detalle', '')) > 1500 then
    perform public.rumbo_error('El detalle es muy largo (máximo 1500 caracteres).');
  end if;
  if not v_panel and (select count(*) from public.reservas
                      where lower(email) = v_email and estado = 'pendiente_pago') >= 2 then
    perform public.rumbo_error('Ya tienes reservas pendientes de pago. Completa el pago o espera a que venzan antes de crear otra.');
  end if;

  -- 5.2 Horarios elegidos
  begin
    select array_agg(distinct x::timestamptz order by x::timestamptz) into v_inicios
    from jsonb_array_elements_text(coalesce(p->'inicios', '[]'::jsonb)) x;
  exception when others then
    perform public.rumbo_error('Los horarios enviados no son válidos.');
  end;
  v_n := coalesce(array_length(v_inicios, 1), 0);
  if v_plan = 'individual' and v_n <> 1 then
    perform public.rumbo_error('Elige un horario para tu sesión.');
  end if;
  if v_plan = 'pack' and v_n <> 3 then
    perform public.rumbo_error('Elige 3 horarios distintos para tu pack.');
  end if;
  if v_plan = 'pack' and (select count(distinct (t at time zone 'America/Lima')::date) from unnest(v_inicios) t) < 3 then
    perform public.rumbo_error('Las 3 sesiones del pack deben ser en días distintos.');
  end if;

  -- 5.3 Asesor (elegido o "Rumbo elige"). Se bloquea su fila para que dos
  --     reservas simultáneas no superen su cupo.
  if v_auto then
    select exists (select 1 from public.miembros m
                   where m.activo and m.es_asesor and m.publicado and v_tema = any (m.temas))
      into v_hay_tema;
    for v_cand in
      select m.id
      from public.miembros m
      where m.activo and m.es_asesor and m.publicado
        and (v_tema is null or not v_hay_tema or v_tema = any (m.temas))
      order by (select count(*) from public.sesiones s
                where s.miembro_id = m.id and s.estado <> 'cancelada'
                  and public.mes_lima(s.inicio) = public.mes_lima(now())), random()
    loop
      perform 1 from public.miembros where id = v_cand.id for update;
      if public.rumbo_horarios_ok(v_cand.id, v_inicios, v_panel) then
        v_asesor := v_cand.id;
        exit;
      end if;
    end loop;
    if v_asesor is null then
      perform public.rumbo_error('Ese horario acaba de ser tomado. Elige otro, por favor.');
    end if;
  else
    begin
      v_asesor := v_asesor_txt::uuid;
    exception when others then
      perform public.rumbo_error('Asesor inválido.');
    end;
    perform 1 from public.miembros where id = v_asesor and activo and es_asesor and (publicado or v_panel) for update;
    if not found then
      perform public.rumbo_error('Ese asesor no está disponible.');
    end if;
    -- "forzar" (solo coordinación desde el panel) permite un horario acordado
    -- fuera de la disponibilidad publicada; la regla anti-choques sigue activa.
    if not v_forzar and not public.rumbo_horarios_ok(v_asesor, v_inicios, v_panel) then
      -- ¿Fue por el cupo del mes? (mensaje más claro para el pack)
      if exists (
        select 1 from public.miembros mm,
             (select public.mes_lima(t) as mes, count(*) as n from unnest(v_inicios) t group by 1) x
        where mm.id = v_asesor and mm.cupo_mensual is not null
          and public.rumbo_usadas_mes(v_asesor, x.mes) + x.n > mm.cupo_mensual
          and public.rumbo_usadas_mes(v_asesor, x.mes) < mm.cupo_mensual
      ) then
        perform public.rumbo_error('Este asesor no tiene cupos suficientes en ese mes para todas tus sesiones. Elige fechas de otro mes, otro asesor o "RUMBO elige".');
      end if;
      perform public.rumbo_error('Uno de los horarios elegidos acaba de ser tomado o ya no está disponible. Elige otro, por favor.');
    end if;
  end if;

  -- 5.4 Precio y código de descuento
  v_precio := case when v_plan = 'pack' then aj.precio_pack else aj.precio_individual end;

  if v_cod_cupon is not null then
    select * into v_cupon from public.cupones where codigo = v_cod_cupon for update;
    if not found or not v_cupon.activo then
      perform public.rumbo_error('El código de descuento no existe o ya no está activo.');
    end if;
    if v_cupon.vence_at is not null and v_cupon.vence_at < now() then
      perform public.rumbo_error('El código de descuento ya venció.');
    end if;
    if v_cupon.usos_max is not null and v_cupon.usos >= v_cupon.usos_max then
      perform public.rumbo_error('El código de descuento ya fue utilizado.');
    end if;
    if v_cupon.aplica_a <> 'todos' and v_cupon.aplica_a <> v_plan then
      perform public.rumbo_error('El código de descuento no aplica para este plan.');
    end if;
    if v_cupon.solo_email is not null and lower(v_cupon.solo_email) <> v_email then
      perform public.rumbo_error('Ese código es personal y está asociado a otro correo.');
    end if;
    if v_cupon.tipo = 'amigos' then
      if v_amigo is null or v_amigo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or v_amigo = v_email then
        perform public.rumbo_error('Para el descuento de amigos escribe el correo de tu amigo (distinto al tuyo).');
      end if;
    end if;
    if v_cupon.tipo = 'referido' then
      select lower(email) into v_ref_email from public.reservas where id = v_cupon.referente_reserva_id;
      if v_ref_email = v_email then
        perform public.rumbo_error('No puedes usar tu propio código de referido.');
      end if;
    end if;

    v_desc := case v_cupon.tipo
      when 'porcentaje' then round(v_precio * v_cupon.valor / 100, 2)
      when 'amigos'     then round(v_precio * v_cupon.valor / 100, 2)
      when 'monto'      then v_cupon.valor
      when 'referido'   then aj.descuento_referido_monto
      when 'beca'       then v_precio
    end;
    v_desc := least(v_desc, v_precio);
    if v_cupon.tipo = 'beca' then v_modalidad := 'B'; end if;
    update public.cupones set usos = usos + 1 where codigo = v_cod_cupon;
  end if;

  v_monto := greatest(round(v_precio - v_desc, 2), 0);

  -- 5.5 Estado inicial
  if v_monto = 0 then
    v_estado := 'confirmada';
    v_metodo := case when v_modalidad = 'B' then 'beca' else 'gratis' end;
  elsif v_panel and coalesce((p->>'confirmar')::boolean, false) then
    v_estado := 'confirmada';
    v_metodo := coalesce(nullif(p->>'pago_metodo', ''), 'yape');
  else
    v_estado := 'pendiente_pago';
    v_metodo := null;
  end if;

  -- 5.6 Código de reserva único
  loop
    v_codigo := 'RB-' || public.codigo_aleatorio(5);
    exit when not exists (select 1 from public.reservas where codigo = v_codigo);
  end loop;

  -- 5.7 Guardar (la regla anti-doble reserva actúa aquí como última barrera)
  begin
    insert into public.reservas (
      codigo, plan, modalidad, estado, miembro_id, asignado_por_rumbo, tema_id, detalle,
      nombre, email, whatsapp, ciudad, grado, es_menor,
      apoderado_nombre, apoderado_email, apoderado_telefono, apoderado_autoriza, acepta_privacidad_at,
      precio_lista, descuento, monto, cupon_codigo, amigo_email,
      pago_metodo, pago_vence_at, pago_verificado_at, origen, notas_internas
    ) values (
      v_codigo, v_plan, v_modalidad, v_estado, v_asesor, v_auto, v_tema, nullif(trim(coalesce(p->>'detalle', '')), ''),
      v_nombre, v_email, v_whatsapp, nullif(trim(coalesce(p->>'ciudad', '')), ''), nullif(trim(coalesce(p->>'grado', '')), ''), v_menor,
      nullif(trim(coalesce(p->>'apoderado_nombre', '')), ''), lower(nullif(trim(coalesce(p->>'apoderado_email', '')), '')),
      nullif(trim(coalesce(p->>'apoderado_telefono', '')), ''), coalesce((p->>'apoderado_autoriza')::boolean, false),
      case when coalesce((p->>'acepta_privacidad')::boolean, false) then now() end,
      v_precio, v_desc, v_monto, v_cod_cupon, v_amigo,
      v_metodo,
      case when v_estado = 'pendiente_pago'
           then least(now() + make_interval(hours => aj.plazo_pago_horas), v_inicios[1] - interval '6 hours') end,
      case when v_estado = 'confirmada' then now() end,
      coalesce(nullif(p->>'origen', ''), case when v_panel then 'panel' else 'web' end),
      nullif(p->>'notas_internas', '')
    ) returning * into r;

    for i in 1 .. v_n loop
      insert into public.sesiones (reserva_id, numero, miembro_id, inicio, fin)
      values (r.id, i, v_asesor, v_inicios[i], v_inicios[i] + make_interval(mins => aj.duracion_min));
    end loop;
  exception when exclusion_violation then
    perform public.rumbo_error('Uno de los horarios acaba de ser tomado por otra persona. Elige otro, por favor.');
  end;

  -- Si la reserva nace pagada (beca / gratis / confirmada por coordinación)
  -- y el pago de verdad ya pasó, dejamos marcados los recordatorios cercanos.
  if v_estado = 'confirmada' then
    update public.sesiones
       set recordatorio_24h_at = case when inicio < now() + interval '26 hours' then now() end,
           recordatorio_2h_at  = case when inicio < now() + interval '3 hours'  then now() end
     where reserva_id = r.id;
    v_conf := public.rumbo_post_confirmacion(r.id);
  end if;

  insert into public.historial (reserva_id, accion, detalle, actor)
  values (r.id, 'creada', jsonb_build_object('estado', v_estado, 'monto', v_monto, 'cupon', v_cod_cupon,
                                             'origen', r.origen, 'inicios', to_jsonb(v_inicios)),
          coalesce(nullif(p->>'actor', ''), case when v_panel then 'panel' else 'estudiante' end));

  return jsonb_build_object(
    'id', r.id, 'codigo', r.codigo, 'token', r.token, 'estado', r.estado,
    'monto', r.monto, 'descuento', r.descuento, 'precio_lista', r.precio_lista,
    'pago_vence_at', r.pago_vence_at, 'miembro_id', r.miembro_id, 'confirmacion', v_conf
  );
end $$;


-- =====================================================================
-- 6. CICLO DE VIDA DE UNA RESERVA
-- =====================================================================

-- Al confirmarse: crea el código de referido del estudiante y, si llegó
-- referido por alguien, genera el premio para quien lo refirió.
create or replace function public.rumbo_post_confirmacion(p_reserva uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  r         public.reservas%rowtype;
  aj        public.ajustes%rowtype;
  v_ref     text;
  v_base    text;
  v_premio  text := null;
  v_refer   public.reservas%rowtype;
  c         public.cupones%rowtype;
begin
  select * into r from public.reservas where id = p_reserva;
  select * into aj from public.ajustes where id = 1;

  -- Código personal de referido (uno por correo)
  select cu.codigo into v_ref
  from public.cupones cu join public.reservas rr on rr.id = cu.referente_reserva_id
  where cu.tipo = 'referido' and lower(rr.email) = lower(r.email)
  limit 1;
  if v_ref is null then
    v_base := upper(regexp_replace(translate(split_part(r.nombre, ' ', 1), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'), '[^A-Za-z]', '', 'g'));
    v_base := left(coalesce(nullif(v_base, ''), 'AMIGO'), 6);
    loop
      v_ref := 'REF-' || v_base || '-' || public.codigo_aleatorio(3);
      exit when not exists (select 1 from public.cupones where codigo = v_ref);
    end loop;
    insert into public.cupones (codigo, tipo, valor, referente_reserva_id, descripcion)
    values (v_ref, 'referido', aj.descuento_referido_monto, r.id, 'Código de referido de ' || r.nombre);
  end if;

  -- Premio para quien refirió
  if r.cupon_codigo is not null then
    select * into c from public.cupones where codigo = r.cupon_codigo;
    if c.tipo = 'referido' and c.referente_reserva_id is not null then
      select * into v_refer from public.reservas where id = c.referente_reserva_id;
      loop
        v_premio := 'PREMIO-' || public.codigo_aleatorio(6);
        exit when not exists (select 1 from public.cupones where codigo = v_premio);
      end loop;
      insert into public.cupones (codigo, tipo, valor, usos_max, solo_email, vence_at, descripcion)
      values (v_premio, 'monto', aj.premio_referente_monto, 1, lower(v_refer.email), now() + interval '6 months',
              'Premio por referir a ' || r.nombre);
    end if;
  end if;

  return jsonb_build_object(
    'codigo_referido', v_ref,
    'premio', case when v_premio is null then null else jsonb_build_object(
      'codigo', v_premio, 'monto', aj.premio_referente_monto,
      'email', v_refer.email, 'nombre', v_refer.nombre, 'referido', r.nombre) end
  );
end $$;

-- Coordinación verifica el voucher → reserva confirmada
create or replace function public.confirmar_reserva(p_reserva uuid, p_actor uuid, p_metodo text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r public.reservas%rowtype;
begin
  update public.reservas
     set estado = 'confirmada',
         pago_verificado_por = p_actor,
         pago_verificado_at = now(),
         pago_metodo = coalesce(nullif(p_metodo, ''), pago_metodo, 'yape'),
         pago_rechazo_motivo = null
   where id = p_reserva and estado in ('pendiente_pago', 'en_revision')
   returning * into r;
  if not found then
    perform public.rumbo_error('Esta reserva ya no está pendiente de pago (quizá otro coordinador ya la procesó).');
  end if;

  update public.sesiones
     set recordatorio_24h_at = coalesce(recordatorio_24h_at, case when inicio < now() + interval '26 hours' then now() end),
         recordatorio_2h_at  = coalesce(recordatorio_2h_at,  case when inicio < now() + interval '3 hours'  then now() end)
   where reserva_id = r.id and estado = 'activa';

  insert into public.historial (reserva_id, accion, detalle, actor)
  values (r.id, 'pago_verificado', jsonb_build_object('metodo', r.pago_metodo, 'monto', r.monto),
          coalesce((select nombre from public.miembros where id = p_actor), 'coordinación'));

  return jsonb_build_object('reserva_id', r.id) || public.rumbo_post_confirmacion(r.id);
end $$;

create or replace function public.rechazar_pago(p_reserva uuid, p_motivo text, p_actor uuid)
returns public.reservas
language plpgsql security definer set search_path = public as $$
declare r public.reservas%rowtype; aj public.ajustes%rowtype;
begin
  select * into aj from public.ajustes where id = 1;
  update public.reservas
     set estado = 'pendiente_pago',
         pago_rechazo_motivo = nullif(trim(p_motivo), ''),
         pago_vence_at = greatest(coalesce(pago_vence_at, now()), now() + make_interval(hours => aj.plazo_pago_horas))
   where id = p_reserva and estado in ('en_revision', 'pendiente_pago')
   returning * into r;
  if not found then
    perform public.rumbo_error('Esta reserva no tiene un pago por revisar.');
  end if;
  insert into public.historial (reserva_id, accion, detalle, actor)
  values (r.id, 'pago_rechazado', jsonb_build_object('motivo', p_motivo),
          coalesce((select nombre from public.miembros where id = p_actor), 'coordinación'));
  return r;
end $$;

-- El estudiante sube su voucher
create or replace function public.registrar_voucher(p_token uuid, p_path text, p_metodo text)
returns public.reservas
language plpgsql security definer set search_path = public as $$
declare r public.reservas%rowtype;
begin
  update public.reservas
     set estado = 'en_revision', voucher_path = p_path, voucher_subido_at = now(),
         pago_metodo = coalesce(nullif(p_metodo, ''), 'yape'), pago_rechazo_motivo = null
   where token = p_token and estado in ('pendiente_pago', 'en_revision')
   returning * into r;
  if not found then
    perform public.rumbo_error('Esta reserva ya no acepta comprobantes (puede haber vencido o estar confirmada).');
  end if;
  insert into public.historial (reserva_id, accion, detalle, actor)
  values (r.id, 'voucher_subido', jsonb_build_object('metodo', r.pago_metodo), 'estudiante');
  return r;
end $$;

-- Cancela una reserva (coordinación). Libera los horarios y el código usado.
create or replace function public.cancelar_reserva(p_reserva uuid, p_motivo text, p_actor text)
returns public.reservas
language plpgsql security definer set search_path = public as $$
declare r public.reservas%rowtype;
begin
  update public.reservas
     set estado = 'cancelada', cancelada_motivo = nullif(trim(p_motivo), '')
   where id = p_reserva and estado not in ('cancelada', 'expirada')
   returning * into r;
  if not found then
    perform public.rumbo_error('La reserva ya estaba cancelada o vencida.');
  end if;
  update public.sesiones set estado = 'cancelada' where reserva_id = r.id and estado = 'activa';
  if r.cupon_codigo is not null then
    update public.cupones set usos = greatest(usos - 1, 0) where codigo = r.cupon_codigo;
  end if;
  insert into public.historial (reserva_id, accion, detalle, actor)
  values (r.id, 'cancelada', jsonb_build_object('motivo', p_motivo), coalesce(p_actor, 'coordinación'));
  return r;
end $$;

-- Vence las reservas no pagadas a tiempo (la llama la tarea automática).
create or replace function public.expirar_reservas() returns setof public.reservas
language plpgsql security definer set search_path = public as $$
declare r public.reservas%rowtype;
begin
  for r in
    update public.reservas set estado = 'expirada'
     where estado = 'pendiente_pago' and pago_vence_at < now()
     returning *
  loop
    update public.sesiones set estado = 'cancelada' where reserva_id = r.id and estado = 'activa';
    if r.cupon_codigo is not null then
      update public.cupones set usos = greatest(usos - 1, 0) where codigo = r.cupon_codigo;
    end if;
    insert into public.historial (reserva_id, accion, actor) values (r.id, 'expirada', 'sistema');
    return next r;
  end loop;
end $$;

-- Mueve una sesión a otro horario (estudiante: 1 vez y con anticipación;
-- coordinación: cuando sea necesario).
drop function if exists public.reprogramar_sesion(uuid, timestamptz, boolean, uuid, text);
create or replace function public.reprogramar_sesion(
  p_sesion uuid, p_inicio timestamptz, p_por_estudiante boolean, p_token uuid default null,
  p_actor text default null, p_forzar boolean default false
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  aj      public.ajustes%rowtype;
  s       public.sesiones%rowtype;
  r       public.reservas%rowtype;
  v_ant   timestamptz;
begin
  select * into aj from public.ajustes where id = 1;
  select * into s from public.sesiones where id = p_sesion for update;
  if not found then perform public.rumbo_error('Sesión no encontrada.'); end if;
  select * into r from public.reservas where id = s.reserva_id;

  if p_por_estudiante then
    if p_token is null or r.token <> p_token then perform public.rumbo_error('Enlace inválido.'); end if;
    if s.inicio <= now() + make_interval(hours => aj.limite_reprogramar_horas) then
      perform public.rumbo_error('Solo puedes reprogramar hasta ' || aj.limite_reprogramar_horas
                                 || ' horas antes de tu sesión. Escríbenos por WhatsApp.');
    end if;
    if s.reprogramaciones >= aj.max_reprogramaciones then
      perform public.rumbo_error('Ya usaste tu reprogramación para esta sesión. Escríbenos por WhatsApp.');
    end if;
  end if;
  if r.estado not in ('pendiente_pago', 'en_revision', 'confirmada') then
    perform public.rumbo_error('Esta reserva no está activa.');
  end if;
  if s.estado <> 'activa' then
    perform public.rumbo_error('Esta sesión ya no se puede mover.');
  end if;
  if exists (select 1 from public.sesiones o
             where o.reserva_id = s.reserva_id and o.id <> s.id and o.estado <> 'cancelada'
               and (o.inicio at time zone 'America/Lima')::date = (p_inicio at time zone 'America/Lima')::date) then
    perform public.rumbo_error('Ya tienes otra sesión de tu pack ese día. Elige otro día.');
  end if;

  perform 1 from public.miembros where id = s.miembro_id for update;
  if p_inicio <= now() then
    perform public.rumbo_error('Elige un horario futuro.');
  end if;
  if not (p_forzar and not p_por_estudiante)
     and not public.rumbo_horarios_ok(s.miembro_id, array[p_inicio], not p_por_estudiante, s.id) then
    perform public.rumbo_error('Ese horario ya no está disponible. Elige otro, por favor.');
  end if;

  v_ant := s.inicio;
  begin
    update public.sesiones
       set inicio = p_inicio,
           fin = p_inicio + make_interval(mins => aj.duracion_min),
           reprogramaciones = reprogramaciones + case when p_por_estudiante then 1 else 0 end,
           recordatorio_24h_at = case when p_inicio < now() + interval '26 hours' then now() end,
           recordatorio_2h_at  = case when p_inicio < now() + interval '3 hours'  then now() end
     where id = s.id;
  exception when exclusion_violation then
    perform public.rumbo_error('Ese horario acaba de ser tomado. Elige otro, por favor.');
  end;

  -- si la reserva aún no está pagada, el plazo de pago no puede pasar de la nueva fecha
  if r.estado = 'pendiente_pago' then
    update public.reservas
       set pago_vence_at = least(pago_vence_at,
             (select min(inicio) from public.sesiones where reserva_id = r.id and estado = 'activa') - interval '6 hours')
     where id = r.id;
  end if;

  insert into public.historial (reserva_id, accion, detalle, actor)
  values (r.id, 'reprogramada', jsonb_build_object('sesion', s.numero, 'antes', v_ant, 'ahora', p_inicio),
          coalesce(p_actor, case when p_por_estudiante then 'estudiante' else 'coordinación' end));

  return jsonb_build_object('sesion_id', s.id, 'reserva_id', r.id, 'numero', s.numero,
                            'inicio_anterior', v_ant, 'inicio_nuevo', p_inicio,
                            'google_event_id', s.google_event_id, 'estado_reserva', r.estado);
end $$;

-- Cambia el asesor de toda una reserva (p. ej. si alguien se enferma).
create or replace function public.reasignar_reserva(p_reserva uuid, p_asesor uuid, p_forzar boolean, p_actor text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  r        public.reservas%rowtype;
  v_ant    uuid;
  v_inis   timestamptz[];
  v_ids    uuid[];
begin
  select * into r from public.reservas where id = p_reserva for update;
  if not found or r.estado not in ('pendiente_pago', 'en_revision', 'confirmada') then
    perform public.rumbo_error('Solo se pueden reasignar reservas activas.');
  end if;
  if r.miembro_id = p_asesor then
    perform public.rumbo_error('La reserva ya está asignada a esa persona.');
  end if;
  perform 1 from public.miembros where id = p_asesor and activo and es_asesor for update;
  if not found then perform public.rumbo_error('Esa persona no está activa como asesor.'); end if;

  select array_agg(inicio order by inicio), array_agg(id order by inicio) into v_inis, v_ids
  from public.sesiones where reserva_id = r.id and estado = 'activa' and inicio > now();

  if v_inis is not null and not p_forzar and not public.rumbo_horarios_ok(p_asesor, v_inis, true) then
    perform public.rumbo_error('La nueva persona no tiene libres esos mismos horarios. Usa "forzar" si ya lo coordinaron.');
  end if;

  v_ant := r.miembro_id;
  begin
    update public.sesiones set miembro_id = p_asesor
     where reserva_id = r.id and estado = 'activa' and inicio > now();
  exception when exclusion_violation then
    perform public.rumbo_error('La nueva persona ya tiene otra sesión en alguno de esos horarios.');
  end;
  update public.reservas set miembro_id = p_asesor, asignado_por_rumbo = false where id = r.id;

  insert into public.historial (reserva_id, accion, detalle, actor)
  values (r.id, 'reasignada', jsonb_build_object('antes', (select nombre from public.miembros where id = v_ant),
                                                 'ahora', (select nombre from public.miembros where id = p_asesor)),
          coalesce(p_actor, 'coordinación'));

  return jsonb_build_object('reserva_id', r.id, 'asesor_anterior', v_ant, 'asesor_nuevo', p_asesor,
                            'sesiones', to_jsonb(coalesce(v_ids, '{}')));
end $$;

-- El asesor (o coordinación) marca cómo fue la sesión y si envió el informe.
create or replace function public.marcar_sesion(
  p_sesion uuid, p_estado text default null, p_informe_enviado boolean default null, p_notas text default null
) returns public.sesiones
language plpgsql security definer set search_path = public as $$
declare s public.sesiones%rowtype; v_mi uuid := public.mi_miembro();
begin
  select * into s from public.sesiones where id = p_sesion for update;
  if not found then perform public.rumbo_error('Sesión no encontrada.'); end if;
  if v_mi is null or not (public.es_coordinador() or s.miembro_id = v_mi) then
    perform public.rumbo_error('No autorizado.');
  end if;
  if s.estado = 'cancelada' then perform public.rumbo_error('La sesión está cancelada.'); end if;
  if p_estado is not null then
    if p_estado not in ('activa', 'realizada', 'no_asistio') then
      perform public.rumbo_error('Estado inválido.');
    end if;
    if p_estado in ('realizada', 'no_asistio') and s.inicio > now() + interval '15 minutes' then
      perform public.rumbo_error('Podrás marcarla cuando llegue la hora de la sesión.');
    end if;
    s.estado := p_estado;
  end if;
  if p_informe_enviado is not null then
    s.informe_enviado_at := case when p_informe_enviado then coalesce(s.informe_enviado_at, now()) end;
  end if;
  if p_notas is not null then s.notas_asesor := left(p_notas, 4000); end if;

  update public.sesiones
     set estado = s.estado, informe_enviado_at = s.informe_enviado_at, notas_asesor = s.notas_asesor
   where id = s.id returning * into s;

  insert into public.historial (reserva_id, accion, detalle, actor)
  values (s.reserva_id, 'sesion_marcada',
          jsonb_build_object('sesion', s.numero, 'estado', s.estado, 'informe', s.informe_enviado_at is not null),
          coalesce((select nombre from public.miembros where id = v_mi), 'equipo'));
  return s;
end $$;

-- Reserva vista por el estudiante (con su enlace secreto)
create or replace function public.reserva_por_token(p_token uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  r   public.reservas%rowtype;
  aj  public.ajustes%rowtype;
  m   public.miembros%rowtype;
begin
  select * into r from public.reservas where token = p_token;
  if not found then return null; end if;
  select * into aj from public.ajustes where id = 1;
  select * into m from public.miembros where id = r.miembro_id;
  return jsonb_build_object(
    'codigo', r.codigo, 'estado', r.estado, 'plan', r.plan, 'modalidad', r.modalidad,
    'nombre', r.nombre, 'email', r.email, 'es_menor', r.es_menor,
    'tema', (select nombre from public.temas where id = r.tema_id),
    'precio_lista', r.precio_lista, 'descuento', r.descuento, 'monto', r.monto,
    'pago_vence_at', r.pago_vence_at, 'voucher_subido_at', r.voucher_subido_at,
    'pago_rechazo_motivo', r.pago_rechazo_motivo, 'cancelada_motivo', r.cancelada_motivo,
    'created_at', r.created_at,
    'asesor', jsonb_build_object('id', m.id, 'nombre', m.nombre, 'rol', m.rol_publico,
                                 'foto_url', m.foto_url, 'trabajo', m.trabajo),
    'diagnostico', (select respuestas from public.diagnosticos where reserva_id = r.id),
    'codigo_referido', (select cu.codigo from public.cupones cu
                        where cu.tipo = 'referido' and cu.referente_reserva_id = r.id limit 1),
    'sesiones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'numero', s.numero, 'inicio', s.inicio, 'fin', s.fin, 'estado', s.estado,
        'meet_url', case when r.estado = 'confirmada' then s.meet_url end,
        'reprogramaciones', s.reprogramaciones,
        'puede_reprogramar', s.estado = 'activa' and r.estado in ('pendiente_pago', 'en_revision', 'confirmada')
                             and s.reprogramaciones < aj.max_reprogramaciones
                             and s.inicio > now() + make_interval(hours => aj.limite_reprogramar_horas),
        'encuesta_hecha', exists (select 1 from public.encuestas e where e.sesion_id = s.id)
      ) order by s.numero)
      from public.sesiones s where s.reserva_id = r.id), '[]'::jsonb),
    'ajustes', public.ajustes_publicos()
  );
end $$;

-- El estudiante recupera su enlace secreto con su código de reserva y su correo.
create or replace function public.buscar_reserva(p_codigo text, p_email text) returns uuid
language plpgsql volatile security definer set search_path = public as $$
declare
  v_cod   text := upper(regexp_replace(coalesce(p_codigo, ''), '\s', '', 'g'));
  v_token uuid;
begin
  perform pg_sleep(0.4);  -- frena intentos masivos de adivinar códigos
  if v_cod = '' or coalesce(trim(p_email), '') = '' then return null; end if;
  if v_cod !~ '^RB-' then v_cod := 'RB-' || v_cod; end if;
  select token into v_token from public.reservas
   where codigo = v_cod and lower(email) = lower(trim(p_email))
   limit 1;
  return v_token;
end $$;

create or replace function public.guardar_diagnostico(p_token uuid, p_respuestas jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare r public.reservas%rowtype;
begin
  select * into r from public.reservas where token = p_token;
  if not found or r.estado not in ('pendiente_pago', 'en_revision', 'confirmada') then
    perform public.rumbo_error('Esta reserva no está activa.');
  end if;
  if jsonb_typeof(p_respuestas) <> 'object' or length(p_respuestas::text) > 12000 then
    perform public.rumbo_error('Respuestas inválidas o demasiado largas.');
  end if;
  insert into public.diagnosticos (reserva_id, respuestas) values (r.id, p_respuestas)
  on conflict (reserva_id) do update set respuestas = excluded.respuestas;
  insert into public.historial (reserva_id, accion, actor) values (r.id, 'diagnostico', 'estudiante');
  return true;
end $$;

create or replace function public.guardar_encuesta(
  p_token uuid, p_sesion uuid, p_calificacion int, p_recomendaria int,
  p_lo_mejor text, p_mejorar text, p_testimonio text, p_autoriza boolean
) returns boolean
language plpgsql security definer set search_path = public as $$
declare s public.sesiones%rowtype;
begin
  select s2.* into s from public.sesiones s2 join public.reservas r on r.id = s2.reserva_id
  where s2.id = p_sesion and r.token = p_token;
  if not found then perform public.rumbo_error('Enlace inválido.'); end if;
  if s.inicio > now() then perform public.rumbo_error('Podrás responder la encuesta después de tu sesión.'); end if;
  if p_calificacion is null or p_calificacion not between 1 and 5 then
    perform public.rumbo_error('Elige una calificación de 1 a 5.');
  end if;
  insert into public.encuestas (sesion_id, calificacion, recomendaria, lo_mejor, mejorar, testimonio, autoriza_testimonio)
  values (p_sesion, p_calificacion, p_recomendaria, left(p_lo_mejor, 2000), left(p_mejorar, 2000),
          left(p_testimonio, 2000), coalesce(p_autoriza, false))
  on conflict (sesion_id) do update set
    calificacion = excluded.calificacion, recomendaria = excluded.recomendaria,
    lo_mejor = excluded.lo_mejor, mejorar = excluded.mejorar,
    testimonio = excluded.testimonio, autoriza_testimonio = excluded.autoriza_testimonio;
  return true;
end $$;


-- =====================================================================
-- 7. TAREAS AUTOMÁTICAS: "reclama" las sesiones que necesitan un aviso
--    (marca primero y devuelve los ids, así nunca se envía dos veces).
-- =====================================================================

create or replace function public.reclamar_envios(p_tipo text) returns setof uuid
language plpgsql security definer set search_path = public as $$
begin
  if p_tipo = '24h' then
    return query
      with u as (
        update public.sesiones s set recordatorio_24h_at = now()
          from public.reservas r
         where r.id = s.reserva_id and r.estado = 'confirmada' and s.estado = 'activa'
           and s.recordatorio_24h_at is null
           and s.inicio <= now() + interval '24 hours' and s.inicio > now() + interval '2 hours'
        returning s.id)
      select u.id from u;
  elsif p_tipo = '2h' then
    return query
      with u as (
        update public.sesiones s set recordatorio_2h_at = now()
          from public.reservas r
         where r.id = s.reserva_id and r.estado = 'confirmada' and s.estado = 'activa'
           and s.recordatorio_2h_at is null
           and s.inicio <= now() + interval '2 hours' and s.inicio > now()
        returning s.id)
      select u.id from u;
  elsif p_tipo = 'encuesta' then
    return query
      with u as (
        update public.sesiones s set encuesta_enviada_at = now()
          from public.reservas r
         where r.id = s.reserva_id and r.estado = 'confirmada' and s.estado in ('activa', 'realizada')
           and s.encuesta_enviada_at is null
           and s.fin + interval '30 minutes' <= now() and s.fin > now() - interval '3 days'
        returning s.id)
      select u.id from u;
  elsif p_tipo = 'informe' then
    return query
      with u as (
        update public.sesiones s set informe_recordado_at = now()
          from public.reservas r
         where r.id = s.reserva_id and r.estado = 'confirmada' and s.estado in ('activa', 'realizada')
           and s.informe_recordado_at is null and s.informe_enviado_at is null
           and s.fin + interval '24 hours' <= now() and s.fin > now() - interval '5 days'
        returning s.id)
      select u.id from u;
  end if;
end $$;

-- Todo lo necesario para escribir un correo sobre una sesión
drop view if exists public.v_sesiones_detalle;
create view public.v_sesiones_detalle with (security_invoker = true) as
select s.*,
       r.codigo, r.token, r.plan, r.estado as reserva_estado, r.modalidad, r.monto,
       r.nombre as estudiante_nombre, r.email as estudiante_email, r.whatsapp as estudiante_whatsapp,
       r.es_menor, r.apoderado_nombre, r.apoderado_email, r.detalle, r.tema_id,
       t.nombre as tema_nombre,
       m.nombre as asesor_nombre, m.email as asesor_email, m.sala_fija_url,
       (select count(*) from public.sesiones s2 where s2.reserva_id = r.id and s2.estado <> 'cancelada') as total_sesiones,
       exists (select 1 from public.diagnosticos d where d.reserva_id = r.id) as tiene_diagnostico
from public.sesiones s
join public.reservas r on r.id = s.reserva_id
join public.miembros m on m.id = s.miembro_id
left join public.temas t on t.id = r.tema_id;


-- =====================================================================
-- 8. RESUMEN PARA EL PANEL
-- =====================================================================

create or replace function public.resumen_panel(p_mes date default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_mi     uuid    := public.mi_miembro();
  v_coord  boolean := public.es_coordinador();
  v_base   date    := date_trunc('month', coalesce(p_mes, (now() at time zone 'America/Lima')::date))::date;
  v_ini    timestamptz := v_base::timestamp at time zone 'America/Lima';
  v_fin    timestamptz := (v_base + interval '1 month')::timestamp at time zone 'America/Lima';
begin
  if v_mi is null then perform public.rumbo_error('No autorizado.'); end if;
  return jsonb_build_object(
    'mes', v_base,
    'sesiones', (select count(*) from public.sesiones s join public.reservas r on r.id = s.reserva_id
                 where s.inicio >= v_ini and s.inicio < v_fin and s.estado <> 'cancelada'
                   and r.estado = 'confirmada' and (v_coord or s.miembro_id = v_mi)),
    'realizadas', (select count(*) from public.sesiones s
                   where s.inicio >= v_ini and s.inicio < v_fin and s.estado = 'realizada'
                     and (v_coord or s.miembro_id = v_mi)),
    'no_asistio', (select count(*) from public.sesiones s
                   where s.inicio >= v_ini and s.inicio < v_fin and s.estado = 'no_asistio'
                     and (v_coord or s.miembro_id = v_mi)),
    'informes_pendientes', (select count(*) from public.sesiones s join public.reservas r on r.id = s.reserva_id
                            where r.estado = 'confirmada' and s.estado in ('activa', 'realizada')
                              and s.fin < now() and s.informe_enviado_at is null
                              and (v_coord or s.miembro_id = v_mi)),
    'satisfaccion', (select round(avg(e.calificacion)::numeric, 2) from public.encuestas e
                     join public.sesiones s on s.id = e.sesion_id
                     where s.inicio >= v_ini and s.inicio < v_fin and (v_coord or s.miembro_id = v_mi)),
    'encuestas', (select count(*) from public.encuestas e join public.sesiones s on s.id = e.sesion_id
                  where s.inicio >= v_ini and s.inicio < v_fin and (v_coord or s.miembro_id = v_mi)),
    'ingresos', case when v_coord then (select coalesce(sum(monto), 0) from public.reservas
                 where estado = 'confirmada' and pago_verificado_at >= v_ini and pago_verificado_at < v_fin) end,
    'reservas_confirmadas', case when v_coord then (select count(*) from public.reservas
                 where estado = 'confirmada' and pago_verificado_at >= v_ini and pago_verificado_at < v_fin) end,
    'becas', case when v_coord then (select count(*) from public.reservas
                 where modalidad = 'B' and estado = 'confirmada' and created_at >= v_ini and created_at < v_fin) end,
    'por_verificar', case when v_coord then (select count(*) from public.reservas where estado = 'en_revision') end,
    'pendientes_pago', case when v_coord then (select count(*) from public.reservas where estado = 'pendiente_pago') end,
    'por_asesor', case when v_coord then (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id, 'nombre', m.nombre, 'cupo', m.cupo_mensual,
        'usadas', (select count(*) from public.sesiones s where s.miembro_id = m.id and s.estado <> 'cancelada'
                   and s.inicio >= v_ini and s.inicio < v_fin),
        'horas_semanales', (select count(*) from public.disponibilidad_semanal d where d.miembro_id = m.id)
      ) order by m.orden, m.nombre), '[]'::jsonb)
      from public.miembros m where m.es_asesor and m.activo) end
  );
end $$;


-- =====================================================================
-- 9. PROTECCIÓN DE ROLES: solo un administrador cambia roles y cuentas;
--    coordinación cambia cupos y visibilidad; cada asesor, su perfil.
-- =====================================================================

-- Importante: esta función NO es "security definer", para que current_user
-- sea el rol real de quien hace el cambio.
create or replace function public.miembros_proteger() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user <> 'authenticated' then
    return new;  -- SQL Editor, tareas del sistema o función del servidor
  end if;
  if tg_op = 'UPDATE' and not public.es_admin() then
    if new.es_admin is distinct from old.es_admin
       or new.es_coordinador is distinct from old.es_coordinador
       or new.es_asesor is distinct from old.es_asesor
       or new.activo is distinct from old.activo
       or new.user_id is distinct from old.user_id
       or new.email is distinct from old.email
       or new.slug is distinct from old.slug then
      perform public.rumbo_error('Solo un administrador puede cambiar roles, correos o cuentas.');
    end if;
    if not public.es_coordinador() and (
          new.cupo_mensual is distinct from old.cupo_mensual
       or new.publicado is distinct from old.publicado
       or new.temas is distinct from old.temas
       or new.orden is distinct from old.orden) then
      perform public.rumbo_error('Solo coordinación puede cambiar cupos, temas o visibilidad.');
    end if;
  end if;
  return new;
end $$;

create or replace function public.miembros_un_admin_minimo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.miembros where es_admin and activo) then
    perform public.rumbo_error('Debe quedar al menos un administrador activo.');
  end if;
  return null;
end $$;

drop trigger if exists miembros_proteger on public.miembros;
create trigger miembros_proteger before update on public.miembros
  for each row execute function public.miembros_proteger();

drop trigger if exists miembros_un_admin on public.miembros;
create constraint trigger miembros_un_admin after update or delete on public.miembros
  deferrable initially deferred
  for each row execute function public.miembros_un_admin_minimo();


-- =====================================================================
-- 10. SEGURIDAD (Row Level Security): quién puede leer/escribir qué
-- =====================================================================

alter table public.ajustes                enable row level security;
alter table public.temas                  enable row level security;
alter table public.miembros               enable row level security;
alter table public.disponibilidad_semanal enable row level security;
alter table public.disponibilidad_fecha   enable row level security;
alter table public.dias_bloqueados        enable row level security;
alter table public.donantes               enable row level security;
alter table public.cupones                enable row level security;
alter table public.reservas               enable row level security;
alter table public.sesiones               enable row level security;
alter table public.diagnosticos           enable row level security;
alter table public.encuestas              enable row level security;
alter table public.historial              enable row level security;
alter table public.notificaciones         enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and policyname like 'rumbo_%'
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Ajustes: el equipo los lee; coordinación los edita
create policy rumbo_ajustes_leer   on public.ajustes for select to authenticated using (public.mi_miembro() is not null);
create policy rumbo_ajustes_editar on public.ajustes for update to authenticated using (public.es_coordinador()) with check (public.es_coordinador());

-- Temas: públicos para leer; coordinación los administra
create policy rumbo_temas_leer   on public.temas for select to anon, authenticated using (true);
create policy rumbo_temas_editar on public.temas for all to authenticated using (public.es_coordinador()) with check (public.es_coordinador());

-- Miembros: el equipo ve al equipo; admin crea/borra; coordinación o uno mismo edita (con candado de roles)
create policy rumbo_miembros_leer    on public.miembros for select to authenticated using (public.mi_miembro() is not null);
create policy rumbo_miembros_crear   on public.miembros for insert to authenticated with check (public.es_admin());
create policy rumbo_miembros_borrar  on public.miembros for delete to authenticated using (public.es_admin());
create policy rumbo_miembros_editar  on public.miembros for update to authenticated
  using (public.es_coordinador() or id = public.mi_miembro())
  with check (public.es_coordinador() or id = public.mi_miembro());

-- Disponibilidad: cada uno la suya; coordinación la de todos
create policy rumbo_dsem_todo on public.disponibilidad_semanal for all to authenticated
  using (miembro_id = public.mi_miembro() or public.es_coordinador())
  with check (miembro_id = public.mi_miembro() or public.es_coordinador());
create policy rumbo_dfec_todo on public.disponibilidad_fecha for all to authenticated
  using (miembro_id = public.mi_miembro() or public.es_coordinador())
  with check (miembro_id = public.mi_miembro() or public.es_coordinador());
create policy rumbo_dblo_todo on public.dias_bloqueados for all to authenticated
  using (miembro_id = public.mi_miembro() or public.es_coordinador())
  with check (miembro_id = public.mi_miembro() or public.es_coordinador());

-- Donantes y cupones: solo coordinación
create policy rumbo_donantes_todo on public.donantes for all to authenticated
  using (public.es_coordinador()) with check (public.es_coordinador());
create policy rumbo_cupones_todo on public.cupones for all to authenticated
  using (public.es_coordinador()) with check (public.es_coordinador());

-- Reservas y sesiones: coordinación ve todo; el asesor ve solo lo suyo.
-- Los cambios importantes (pagos, cancelaciones, horarios) pasan por la función del servidor.
create policy rumbo_reservas_leer on public.reservas for select to authenticated
  using (public.es_coordinador() or miembro_id = public.mi_miembro());
create policy rumbo_reservas_notas on public.reservas for update to authenticated
  using (public.es_coordinador()) with check (public.es_coordinador());
create policy rumbo_sesiones_leer on public.sesiones for select to authenticated
  using (public.es_coordinador() or miembro_id = public.mi_miembro());

create policy rumbo_diag_leer on public.diagnosticos for select to authenticated
  using (public.es_coordinador() or exists (select 1 from public.reservas r
         where r.id = reserva_id and r.miembro_id = public.mi_miembro()));
create policy rumbo_enc_leer on public.encuestas for select to authenticated
  using (public.es_coordinador() or exists (select 1 from public.sesiones s
         where s.id = sesion_id and s.miembro_id = public.mi_miembro()));
create policy rumbo_hist_leer on public.historial for select to authenticated
  using (public.es_coordinador() or exists (select 1 from public.reservas r
         where r.id = reserva_id and r.miembro_id = public.mi_miembro()));
create policy rumbo_notif_leer on public.notificaciones for select to authenticated
  using (public.es_coordinador());

-- Permisos de ejecución de funciones
do $$
declare f text;
begin
  -- Solo el servidor (service_role)
  foreach f in array array[
    'public.crear_reserva(jsonb)',
    'public.rumbo_post_confirmacion(uuid)',
    'public.confirmar_reserva(uuid, uuid, text)',
    'public.rechazar_pago(uuid, text, uuid)',
    'public.registrar_voucher(uuid, text, text)',
    'public.cancelar_reserva(uuid, text, text)',
    'public.expirar_reservas()',
    'public.reprogramar_sesion(uuid, timestamptz, boolean, uuid, text, boolean)',
    'public.reasignar_reserva(uuid, uuid, boolean, text)',
    'public.reclamar_envios(text)',
    'public.rumbo_horarios_ok(uuid, timestamptz[], boolean, uuid)',
    'public.codigo_aleatorio(int)',
    'public.rumbo_usadas_mes(uuid, timestamp)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;

  -- Público (la web, sin iniciar sesión)
  foreach f in array array[
    'public.slots_disponibles(uuid, text, date, date, boolean, uuid)',
    'public.asesores_publicos()',
    'public.ajustes_publicos()',
    'public.validar_cupon(text, text, text)',
    'public.reserva_por_token(uuid)',
    'public.buscar_reserva(text, text)',
    'public.guardar_diagnostico(uuid, jsonb)',
    'public.guardar_encuesta(uuid, uuid, int, int, text, text, text, boolean)',
    'public.ping()'
  ] loop
    execute format('grant execute on function %s to anon, authenticated, service_role', f);
  end loop;

  -- Equipo con sesión iniciada
  foreach f in array array[
    'public.resumen_panel(date)', 'public.mi_miembro()', 'public.es_coordinador()', 'public.es_admin()',
    'public.marcar_sesion(uuid, text, boolean, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

revoke all on public.v_sesiones_detalle from public, anon, authenticated;
grant select on public.v_sesiones_detalle to service_role;

-- Bucket privado para los vouchers (solo lo usa la función del servidor)
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('vouchers', 'vouchers', false)
    on conflict (id) do nothing;
  end if;
end $$;

-- Fin del archivo 1. ✔
