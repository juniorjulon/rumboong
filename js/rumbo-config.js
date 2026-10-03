/* =====================================================================
   RUMBO · Configuración del sistema de asesorías
   ---------------------------------------------------------------------
   Es el ÚNICO archivo que debes editar para conectar la web con tu
   base de datos de Supabase (guía, paso 6).

   • supabaseUrl  → Supabase → Project Settings → API → "Project URL"
   • supabaseKey  → Supabase → Project Settings → API Keys →
                    "Publishable key" (empieza con sb_publishable_)
                    o, si no la ves, la "anon public" (empieza con eyJ).
     Estas dos claves son PÚBLICAS: es seguro que estén en GitHub.
     ⚠️ NUNCA pongas aquí la "secret" ni la "service_role".

   • whatsapp     → número de RUMBO con código de país, sin + ni espacios.
                    Se usa como respaldo si la base de datos no responde.
   ===================================================================== */
window.RUMBO_CONFIG = {
  supabaseUrl: 'https://uzjulvhjnklzcpbovdit.supabase.co/rest/v1/',
  supabaseKey: 'sb_publishable_EUKy00oOxhZ4BAhh22DvIw_cwfsL28W',
  whatsapp: '51933285212'
};
