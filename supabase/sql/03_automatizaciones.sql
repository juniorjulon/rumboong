-- =====================================================================
--  RUMBO · Sistema de reservas de asesorías personalizadas
--  ARCHIVO 3 DE 3 — TAREAS AUTOMÁTICAS (cada 10 minutos)
--
--  Qué hace: cada 10 minutos le pide a la función del servidor que:
--    • venza las reservas que no pagaron a tiempo y libere el horario,
--    • envíe recordatorios 24 h y 2 h antes (estudiante y asesor),
--    • envíe la encuesta al terminar la sesión,
--    • recuerde al asesor enviar su informe.
--
--  ANTES DE EJECUTAR reemplaza estas 2 cosas (ver guía, paso 5):
--    1) TU-PROYECTO      → el identificador de tu proyecto de Supabase
--                          (lo ves en la dirección: https://TU-PROYECTO.supabase.co)
--    2) TU-CLAVE-SECRETA → la misma clave que guardaste como CRON_SECRET
--                          en los "Secrets" de la función.
-- =====================================================================

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net  with schema extensions;

-- Si ya existía una versión anterior de la tarea, la quitamos.
select cron.unschedule(jobid) from cron.job where jobname = 'rumbo-tareas';

select cron.schedule(
  'rumbo-tareas',
  '*/10 * * * *',
  $$
  select net.http_post(
    url     := 'https://TU-PROYECTO.supabase.co/functions/v1/rumbo-api',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', 'TU-CLAVE-SECRETA'),
    body    := jsonb_build_object('accion', 'cron'),
    timeout_milliseconds := 55000
  );
  $$
);

-- Limpieza mensual del registro técnico de llamadas (no borra reservas).
select cron.unschedule(jobid) from cron.job where jobname = 'rumbo-limpieza';
select cron.schedule(
  'rumbo-limpieza',
  '30 4 1 * *',
  $$ delete from public.notificaciones where created_at < now() - interval '180 days'; $$
);

-- Para comprobar que quedó programado, ejecuta:
--   select jobname, schedule, active from cron.job;
-- Y para ver si el reloj llegó a la función (debe decir 200 y {"ok":true,...}):
--   select status_code, content, created from net._http_response order by created desc limit 5;
