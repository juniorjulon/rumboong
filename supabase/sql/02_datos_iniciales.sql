-- =====================================================================
--  RUMBO · Sistema de reservas de asesorías personalizadas
--  ARCHIVO 2 DE 3 — DATOS INICIALES (temas, equipo, códigos base)
--
--  Ejecútalo UNA vez, después del archivo 1.
--  Todo lo que carga aquí se puede cambiar luego desde el panel.
-- =====================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- Temas de asesoría (alineados a los 4 pilares de RUMBO)
-- ---------------------------------------------------------------------
insert into public.temas (id, nombre, pilar, orden) values
  ('becas',       'Becas y financiamiento educativo',                'Acceso a Oportunidades',     1),
  ('cv',          'Armado de CV / Perfil profesional',               'Habilidades para el Futuro', 2),
  ('vocacional',  'Orientación vocacional (¿qué carrera estudiar?)', 'Identidad y Propósito',      3),
  ('universidad', 'Elección de universidad / instituto',             'Identidad y Propósito',      4),
  ('entrevistas', 'Preparación para entrevistas',                    'Habilidades para el Futuro', 5),
  ('bienestar',   'Bienestar y gestión del estrés académico',        'Bienestar y Equilibrio',     6),
  ('habilidades', 'Habilidades digitales / productividad',           'Habilidades para el Futuro', 7),
  ('otro',        'Otro tema',                                       null,                         99)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Equipo inicial (8 asesores).
--  • Los correos "@cambiar.rumbo" son temporales: se reemplazan solos por el
--    correo real cuando el administrador le crea la cuenta a cada persona
--    desde el panel (Equipo → Crear acceso).
--  • Cupo del Mes 1 = 2 sesiones (línea base del plan). Súbelo a 4 desde el
--    panel cuando arranque el Mes 2.
--  • Roles: Junior = administrador + coordinador. Sheyla, Breinner y María =
--    coordinadores. Todos son asesores. El administrador puede cambiarlo.
-- ---------------------------------------------------------------------
insert into public.miembros
  (slug, nombre, email, rol_publico, formacion, trabajo, foto_url, linkedin_url,
   etiquetas, temas, es_asesor, es_coordinador, es_admin, cupo_mensual, orden)
values
  ('sheyla-campos', 'Sheyla Campos', 'sheyla-campos@cambiar.rumbo',
   'Coordinadora General', 'Ingeniera Empresarial (UP)', 'Strategy Analyst en Rappi',
   'assets/team/sheyla-campos.jpg', 'https://www.linkedin.com/in/sheyla-campos-gonzales',
   array['Vocacional', 'Liderazgo', 'Estrategia'], array['vocacional', 'universidad'],
   true, true, false, 2, 1),

  ('junior-julon', 'Junior Julón', 'junior-julon@cambiar.rumbo',
   'Coordinador General · Líder de Finanzas', 'Financista (UP)', 'Analista de Estrategia de Inversiones en Rimac Seguros',
   'assets/team/junior-julon.jpg', 'https://www.linkedin.com/in/juniorjulon/',
   array['Becas', 'Finanzas', 'Estrategia educativa'], array['becas'],
   true, true, true, 2, 2),

  ('mariana-martinez', 'Mariana Martínez', 'mariana-martinez@cambiar.rumbo',
   'Líder de Comunicaciones y Marketing', 'Ingeniera Empresarial (UP)', 'Business & Strategy Consultant en Minsait',
   'assets/team/mariana-martinez.jpg', 'https://www.linkedin.com/in/marianamartinezd/',
   array['CV', 'Entrevistas', 'Marca personal'], array['cv', 'entrevistas'],
   true, false, false, 2, 3),

  ('lucerito-malpartida', 'Lucerito Malpartida', 'lucerito-malpartida@cambiar.rumbo',
   'Líder de Comunicaciones y Marketing', 'Ingeniera de la Información (UP)', 'B2B Process & Transformation Lead en Pepsico',
   'assets/team/lucerito-malpartida.jpg', 'https://www.linkedin.com/in/luceritomj/',
   array['Becas internacionales', 'Habilidades digitales'], array['becas', 'habilidades'],
   true, false, false, 2, 4),

  ('breinner-ramos', 'Breinner Ramos', 'breinner-ramos@cambiar.rumbo',
   'Líder de Operaciones y Proyectos', 'Ingeniero Empresarial (UP)', 'Consultor & Account Executive en Tuxpas',
   'assets/team/breinner-ramos.jpg', 'https://www.linkedin.com/in/breinner-ramos-rodriguez/',
   array['Networking', 'Productividad', 'Orientación'], array['habilidades', 'universidad', 'vocacional'],
   true, true, false, 2, 5),

  ('maria-arias', 'María Arias', 'maria-arias@cambiar.rumbo',
   'Líder de Operaciones y Proyectos', 'Ingeniera de la Información (UP)', 'Consultora de Analítica en Pacífico Seguros',
   'assets/team/maria-arias.jpg', 'https://www.linkedin.com/in/maria-emilia-arias-condori/',
   array['Analítica', 'Organización', 'Vida universitaria'], array['universidad'],
   true, true, false, 2, 6),

  ('blanca-mondalgo', 'Blanca Mondalgo', 'blanca-mondalgo@cambiar.rumbo',
   'Líder de Gestión de Aprendizaje', 'Administradora (UP)', 'Analista de Riesgo Crediticio en BCP',
   'assets/team/blanca-mondalgo.jpeg', 'https://www.linkedin.com/in/blanca-mondalgo-murga-125747201/',
   array['Hábitos de estudio', 'Finanzas', 'Planificación'], array['becas', 'bienestar'],
   true, false, false, 2, 7),

  ('carla-valderrama', 'Carla Valderrama', 'carla-valderrama@cambiar.rumbo',
   'Líder de Gestión de Aprendizaje', 'Ingeniera Empresarial (UP)', 'Líder de Proyectos en BPL',
   'assets/team/carla-valderrama.jpeg', 'https://www.linkedin.com/in/carlasofiavalderrama/',
   array['Gestión del tiempo', 'Bienestar', 'Proyectos'], array['bienestar'],
   true, false, false, 2, 8)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Códigos base
--   AMIGOS  → 10 % para quien se inscribe con un amigo (pide el correo del amigo)
--   Los códigos de beca y de referido se generan desde el panel / automáticamente.
-- ---------------------------------------------------------------------
insert into public.cupones (codigo, tipo, valor, descripcion)
values ('AMIGOS', 'amigos', 10, 'Descuento grupal: 10 % para quienes se inscriben con un amigo')
on conflict (codigo) do nothing;

-- Fin del archivo 2. ✔
--
-- ─────────────────────────────────────────────────────────────────────
-- PASO SIGUIENTE (lo explica la guía, paso 3.4): vincular tu usuario de
-- administrador. Después de crear tu usuario en Authentication → Users,
-- cambia el correo de abajo por el tuyo y ejecuta SOLO estas líneas:
--
--   update public.miembros
--      set email   = 'TU-CORREO@gmail.com',
--          user_id = (select id from auth.users where email = 'TU-CORREO@gmail.com')
--    where slug = 'junior-julon';
--
-- Debe decir "Success. 1 rows affected" (o "UPDATE 1").
-- ─────────────────────────────────────────────────────────────────────
