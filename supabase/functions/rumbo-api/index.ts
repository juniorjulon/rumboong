// =====================================================================
//  RUMBO · Función del servidor "rumbo-api"  (Supabase Edge Function)
//
//  Un solo archivo con toda la lógica que NO puede vivir en el navegador:
//    • crear reservas y recibir vouchers (web pública)
//    • reprogramar desde el enlace del estudiante
//    • acciones del panel: verificar/rechazar pagos, cancelar, mover,
//      reasignar, crear accesos del equipo…
//    • Google: crea la sala de Meet + el evento de Calendar y envía los
//      correos desde el Gmail de RUMBO
//    • tareas automáticas cada 10 min (vencimientos y recordatorios)
//
//  Cómo publicarla: ver docs/asesorias/02-guia-paso-a-paso.md (paso 4).
//  Secrets necesarios (Edge Functions → Secrets):
//    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
//    GOOGLE_EMAIL (el Gmail de RUMBO), CRON_SECRET
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------
const ZONA = "America/Lima";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = obtenerServiceKey();
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const TIPOS_VOUCHER: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function obtenerServiceKey(): string {
  const legado = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legado) return legado;
  try {
    const claves = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return claves.default ?? Object.values(claves)[0] ?? "";
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------
// Errores y respuestas
// ---------------------------------------------------------------------
class ErrorRumbo extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.status = status;
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function errorDb(e: any): Error {
  if (e?.hint === "rumbo") return new ErrorRumbo(e.message, 400);
  return new Error(e?.message ?? String(e));
}

async function rpc(nombre: string, params: Record<string, unknown> = {}): Promise<any> {
  const { data, error } = await db.rpc(nombre, params);
  if (error) throw errorDb(error);
  return data;
}

// Ejecuta en segundo plano (si la plataforma lo permite) sin bloquear la respuesta.
async function enSegundoPlano(tarea: Promise<unknown>): Promise<void> {
  const protegida = tarea.catch((e) => console.error("[segundo plano]", e));
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(protegida);
  else await protegida;
}

// ---------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") return json({ ok: true, servicio: "rumbo-api", hora: new Date().toISOString() });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400);
  }

  try {
    switch (body?.accion) {
      // --- Web pública -------------------------------------------------
      case "reservar":
        return json(await accionReservar(body));
      case "subir_voucher":
        return json(await accionSubirVoucher(body));
      case "reprogramar":
        return json(await accionReprogramarEstudiante(body));
      case "recuperar_reservas":
        return json(await accionRecuperarReservas(body));

      // --- Panel del equipo -------------------------------------------
      case "verificar_pago":
        return json(await accionVerificarPago(await coordinador(req), body));
      case "rechazar_pago":
        return json(await accionRechazarPago(await coordinador(req), body));
      case "cancelar_reserva":
        return json(await accionCancelar(await coordinador(req), body));
      case "mover_sesion":
        return json(await accionMoverSesion(await coordinador(req), body));
      case "reasignar":
        return json(await accionReasignar(await coordinador(req), body));
      case "crear_reserva_panel":
        return json(await accionReservaPanel(await coordinador(req), body));
      case "reintentar_meet":
        return json(await accionReintentarMeet(await coordinador(req), body));
      case "reenviar_confirmacion":
        return json(await accionReenviar(await coordinador(req), body));
      case "ver_voucher":
        return json(await accionVerVoucher(await coordinador(req), body));
      case "crear_acceso":
        return json(await accionCrearAcceso(await administrador(req), body));
      case "cambiar_password":
        return json(await accionCambiarPassword(await administrador(req), body));
      case "quitar_acceso":
        return json(await accionQuitarAcceso(await administrador(req), body));
      case "probar_google":
        return json(await accionProbarGoogle(await administrador(req), body));

      // --- Tareas automáticas -----------------------------------------
      case "cron":
        validarCron(req);
        return json(await tareasProgramadas());

      default:
        return json({ error: "Acción desconocida." }, 400);
    }
  } catch (e) {
    if (e instanceof ErrorRumbo) return json({ error: e.message }, e.status);
    console.error("[rumbo-api]", body?.accion, e);
    return json({
      error: "Ocurrió un error inesperado. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.",
      detalle: String((e as Error)?.message ?? e).slice(0, 300),
    }, 500);
  }
});

// ---------------------------------------------------------------------
// Identidad del equipo (panel)
// ---------------------------------------------------------------------
async function miembroActual(req: Request): Promise<any> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new ErrorRumbo("Inicia sesión en el panel.", 401);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) throw new ErrorRumbo("Tu sesión venció. Vuelve a iniciar sesión.", 401);
  const { data: m } = await db.from("miembros").select("*")
    .eq("user_id", data.user.id).eq("activo", true).maybeSingle();
  if (!m) throw new ErrorRumbo("Tu usuario no está vinculado a ningún miembro activo del equipo.", 403);
  return m;
}

async function coordinador(req: Request): Promise<any> {
  const m = await miembroActual(req);
  if (!m.es_coordinador && !m.es_admin) throw new ErrorRumbo("Esta acción es solo para coordinación.", 403);
  return m;
}

async function administrador(req: Request): Promise<any> {
  const m = await miembroActual(req);
  if (!m.es_admin) throw new ErrorRumbo("Esta acción es solo para administradores.", 403);
  return m;
}

function validarCron(req: Request) {
  const esperado = secreto("CRON_SECRET", false);
  if (!esperado || req.headers.get("x-cron-secret") !== esperado) {
    throw new ErrorRumbo("No autorizado.", 401);
  }
}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function exigirUuid(v: unknown, campo: string): string {
  if (typeof v !== "string" || !UUID_RE.test(v)) throw new ErrorRumbo(`Falta o es inválido: ${campo}.`);
  return v;
}

function correoValido(e: unknown): e is string {
  return typeof e === "string" && EMAIL_RE.test(e) && !e.toLowerCase().endsWith("@cambiar.rumbo");
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function primerNombre(n: string): string {
  return String(n ?? "").trim().split(/\s+/)[0] ?? "";
}

const fmtFecha = new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long" });
const fmtHora = new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, hour: "numeric", minute: "2-digit", hour12: true });

function cuando(iso: string): string {
  const d = new Date(iso);
  const f = fmtFecha.format(d);
  return `${f.charAt(0).toUpperCase()}${f.slice(1)} · ${fmtHora.format(d)}`;
}

function soles(n: unknown): string {
  return `S/ ${Number(n ?? 0).toFixed(2).replace(/\.00$/, "")}`;
}

async function ajustes(): Promise<any> {
  const { data, error } = await db.from("ajustes").select("*").eq("id", 1).single();
  if (error) throw errorDb(error);
  return data;
}

function urlSitio(aj: any): string {
  return String(aj?.url_sitio || Deno.env.get("SITE_URL") || "https://rumbo.org.pe").replace(/\/+$/, "");
}

function linkMiReserva(aj: any, token: string, extra = ""): string {
  return `${urlSitio(aj)}/mi-reserva.html?t=${token}${extra}`;
}

function linkWhatsApp(aj: any, texto = ""): string {
  const n = String(aj?.whatsapp_numero ?? "").replace(/[^0-9]/g, "");
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

async function sesionesDe(reservaId: string, soloActivas = true): Promise<any[]> {
  let q = db.from("v_sesiones_detalle").select("*").eq("reserva_id", reservaId).order("numero");
  if (soloActivas) q = q.neq("estado", "cancelada");
  const { data, error } = await q;
  if (error) throw errorDb(error);
  return data ?? [];
}

async function reservaPorId(id: string): Promise<any> {
  const { data, error } = await db.from("reservas").select("*, temas(nombre), miembros!reservas_miembro_id_fkey(nombre, email, whatsapp, sala_fija_url)")
    .eq("id", id).single();
  if (error) throw errorDb(error);
  return data;
}

async function historial(reservaId: string, accion: string, detalle: unknown, actor: string) {
  await db.from("historial").insert({ reserva_id: reservaId, accion, detalle, actor });
}

// =====================================================================
// GOOGLE: token, Meet, Calendar y Gmail
// =====================================================================
let cacheToken: { token: string; vence: number } | null = null;

// Lee un Secret tolerando errores comunes al copiar y pegar: espacios o saltos
// de línea, comillas alrededor y el nombre pegado delante ("GOOGLE_CLIENT_ID=...").
function secreto(nombre: string, quitarEspacios = true): string {
  const comillas = (x: string) => x.trim().replace(/^["'`\u201C\u201D\u2018\u2019]+|["'`\u201C\u201D\u2018\u2019]+$/g, "").trim();
  let v = comillas(Deno.env.get(nombre) ?? "");
  v = comillas(v.replace(new RegExp(`^${nombre}\\s*[:=]\\s*`, "i"), ""));
  // Los IDs, secretos y tokens de Google nunca llevan espacios ni saltos de línea.
  return quitarEspacios ? v.replace(/\s+/g, "") : v;
}

const RE_CLIENT_ID = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;

// Revisa el formato de los 3 Secrets de Google antes de llamar a Google.
function credencialesGoogle(): { client_id: string; client_secret: string; refresh_token: string } {
  const client_id = secreto("GOOGLE_CLIENT_ID");
  const client_secret = secreto("GOOGLE_CLIENT_SECRET");
  const refresh_token = secreto("GOOGLE_REFRESH_TOKEN");
  const faltan = [
    !client_id && "GOOGLE_CLIENT_ID", !client_secret && "GOOGLE_CLIENT_SECRET", !refresh_token && "GOOGLE_REFRESH_TOKEN",
  ].filter(Boolean);
  if (faltan.length) throw new Error(`Faltan estos Secrets de Google en Supabase: ${faltan.join(", ")} (paso 5.3 de la guía).`);
  if (client_secret.includes(".apps.googleusercontent.com") || client_id.startsWith("GOCSPX-")) {
    throw new Error("Parece que GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET están intercambiados: el ID termina en .apps.googleusercontent.com y el secreto empieza con GOCSPX- (paso 5.3).");
  }
  if (!RE_CLIENT_ID.test(client_id)) {
    throw new Error(`GOOGLE_CLIENT_ID no tiene el formato de un ID de cliente: debe verse como 123456789012-abc123.apps.googleusercontent.com y lo guardado es “${recortar(client_id)}”. Cópialo de nuevo desde Google Cloud → Google Auth Platform → Clientes (paso 4.4).`);
  }
  if (/^ya29\./.test(refresh_token)) {
    throw new Error("GOOGLE_REFRESH_TOKEN tiene el “Access token” (empieza con ya29.), que dura 1 hora. Copia el “Refresh token” (empieza con 1//) del paso 4.5.");
  }
  if (/^4\//.test(refresh_token)) {
    throw new Error("GOOGLE_REFRESH_TOKEN tiene el “Authorization code” (empieza con 4/). Copia el “Refresh token” (empieza con 1//) del paso 4.5.");
  }
  return { client_id, client_secret, refresh_token };
}

function recortar(v: string): string {
  return v.length > 60 ? v.slice(0, 28) + "…" + v.slice(-24) : v;
}

// Traduce la respuesta de Google a qué revisar en la guía.
function explicarErrorGoogle(error: string, detalle: string, client_id: string): string {
  const d = detalle.toLowerCase();
  let que: string;
  if (error === "invalid_client" && d.includes("not found")) {
    que = `Google no encuentra un cliente OAuth con el ID guardado en GOOGLE_CLIENT_ID (${recortar(client_id)}). ` +
      "Suele ser un carácter de más o de menos al copiarlo, un cliente que se borró, o uno de otro proyecto o de otra cuenta de Google. " +
      "Copia de nuevo el “ID de cliente” desde Google Cloud (con el Gmail de RUMBO) → Google Auth Platform → Clientes, pégalo en Supabase → Edge Functions → Secrets → GOOGLE_CLIENT_ID y vuelve a probar. " +
      "Si creaste un cliente nuevo, también tienes que actualizar GOOGLE_CLIENT_SECRET y repetir el paso 4.5 para un nuevo GOOGLE_REFRESH_TOKEN.";
  } else if (error === "invalid_client") {
    que = "El ID de cliente existe, pero GOOGLE_CLIENT_SECRET no le corresponde. Copia de nuevo el “Secreto del cliente” (empieza con GOCSPX-) del mismo cliente OAuth (paso 4.4) y pégalo en Secrets.";
  } else if (error === "deleted_client") {
    que = "Ese cliente OAuth fue eliminado en Google Cloud. Crea uno nuevo (paso 4.4), actualiza GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET, y repite el paso 4.5.";
  } else if (error === "unauthorized_client") {
    que = "El Refresh token se generó con otro cliente OAuth. Repite el paso 4.5 marcando “Use your own OAuth credentials” con el MISMO ID y secreto que están en Secrets.";
  } else if (error === "invalid_grant") {
    que = "El Refresh token ya no sirve: se cambió la contraseña del Gmail, se quitó el acceso, la app quedó en modo “Prueba” (vence a los 7 días) o se copió mal. Revisa que la app esté “En producción” (paso 4.3) y repite el paso 4.5.";
  } else {
    que = "Revisa los Secrets de Google (paso 5.3).";
  }
  return `Google rechazó las credenciales (${error}: ${detalle || "sin detalle"}). ${que}`;
}

async function googleToken(): Promise<string> {
  if (cacheToken && cacheToken.vence > Date.now() + 60_000) return cacheToken.token;
  const { client_id, client_secret, refresh_token } = credencialesGoogle();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id, client_secret, refresh_token, grant_type: "refresh_token" }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(explicarErrorGoogle(String(j.error ?? res.status), String(j.error_description ?? ""), client_id));
  cacheToken = { token: j.access_token, vence: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function google(metodo: string, url: string, cuerpo?: unknown): Promise<any> {
  const token = await googleToken();
  const res = await fetch(url, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (res.status === 204) return null;
  const texto = await res.text();
  if (!res.ok) throw new Error(`Google ${res.status}: ${texto.slice(0, 400)}`);
  return texto ? JSON.parse(texto) : null;
}

// Sala de Meet "abierta": cualquiera con el link entra sin esperar a que lo admitan.
async function crearSalaMeet(): Promise<{ url: string; metodo: string } | null> {
  try {
    const s = await google("POST", "https://meet.googleapis.com/v2/spaces", { config: { accessType: "OPEN" } });
    if (s?.meetingUri) return { url: s.meetingUri, metodo: "meet_abierta" };
  } catch (e) {
    console.warn("[meet] La API de Meet no respondió; uso el Meet del calendario.", (e as Error).message);
  }
  return null;
}

function invitados(s: any): any[] {
  const lista: any[] = [];
  if (correoValido(s.estudiante_email)) lista.push({ email: s.estudiante_email, displayName: s.estudiante_nombre });
  if (correoValido(s.asesor_email)) lista.push({ email: s.asesor_email, displayName: s.asesor_nombre });
  if (correoValido(s.apoderado_email)) lista.push({ email: s.apoderado_email, displayName: s.apoderado_nombre ?? "Apoderado" });
  return lista;
}

function textoEvento(s: any, meet: string | null): string {
  return [
    `Asesoría personalizada RUMBO — sesión ${s.numero} de ${s.total_sesiones}`,
    `Tema: ${s.tema_nombre ?? "Orientación"}`,
    `Estudiante: ${s.estudiante_nombre}`,
    `Asesor(a): ${s.asesor_nombre}`,
    meet ? `Videollamada: ${meet}` : "",
    "",
    `Código de reserva: ${s.codigo}`,
    "Si necesitas reprogramar, usa el enlace de tu correo de confirmación.",
  ].filter((l) => l !== null).join("\n");
}

async function crearEventoSesion(s: any): Promise<{ meet_url: string | null; google_event_id: string | null; meet_metodo: string | null }> {
  let meet: string | null = s.sala_fija_url || null;
  let metodo: string | null = meet ? "sala_fija" : null;
  if (!meet) {
    const sala = await crearSalaMeet();
    if (sala) {
      meet = sala.url;
      metodo = sala.metodo;
    }
  }
  const evento: any = {
    summary: `Asesoría RUMBO · ${s.tema_nombre ?? "Orientación"} (${s.numero}/${s.total_sesiones})`,
    description: textoEvento(s, meet),
    start: { dateTime: s.inicio, timeZone: ZONA },
    end: { dateTime: s.fin, timeZone: ZONA },
    attendees: invitados(s),
    guestsCanSeeOtherGuests: false,
    guestsCanInviteOthers: false,
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
  };
  if (meet) evento.location = meet;
  else {
    evento.conferenceData = {
      createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
    };
  }
  const creado = await google(
    "POST",
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    evento,
  );
  if (!meet) {
    meet = creado?.hangoutLink ??
      creado?.conferenceData?.entryPoints?.find((p: any) => p.entryPointType === "video")?.uri ?? null;
    metodo = "calendario";
  }
  return { meet_url: meet, google_event_id: creado?.id ?? null, meet_metodo: metodo };
}

async function actualizarHoraEvento(eventId: string, inicio: string, fin: string) {
  await google(
    "PATCH",
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { start: { dateTime: inicio, timeZone: ZONA }, end: { dateTime: fin, timeZone: ZONA } },
  );
}

async function borrarEvento(eventId: string) {
  try {
    await google(
      "DELETE",
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    );
  } catch (e) {
    console.warn("[calendar] no se pudo borrar el evento", eventId, (e as Error).message);
  }
}

// Si todas las sesiones fallaron por lo mismo (p. ej. credenciales), lo dice una sola vez.
function unirErrores(errores: string[]): string {
  const sinPrefijo = errores.map((e) => e.replace(/^Sesión \d+: /, ""));
  return new Set(sinPrefijo).size === 1 ? sinPrefijo[0] : errores.join(" | ");
}

// Crea Meet + evento para cada sesión que aún no lo tenga.
async function asegurarEventos(reservaId: string): Promise<{ creados: number; errores: string[] }> {
  const sesiones = await sesionesDe(reservaId);
  let creados = 0;
  const errores: string[] = [];
  for (const s of sesiones) {
    if (s.estado !== "activa" || s.google_event_id) continue;
    try {
      const r = await crearEventoSesion(s);
      await db.from("sesiones").update(r).eq("id", s.id);
      creados++;
    } catch (e) {
      const msg = (e as Error).message;
      errores.push(`Sesión ${s.numero}: ${msg}`);
      if (s.sala_fija_url && !s.meet_url) {
        await db.from("sesiones").update({ meet_url: s.sala_fija_url, meet_metodo: "sala_fija" }).eq("id", s.id);
      }
      await db.from("notificaciones").insert({
        tipo: "google_calendar", reserva_id: reservaId, sesion_id: s.id, ok: false, detalle: msg.slice(0, 1000),
      });
    }
  }
  return { creados, errores };
}

// ----- Gmail ----------------------------------------------------------
function base64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64url(texto: string): string {
  return base64(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encabezado(t: string): string {
  return /^[\x20-\x7e]*$/.test(t) ? t : `=?UTF-8?B?${base64(t)}?=`;
}

function partir76(b64: string): string {
  return b64.replace(/(.{76})/g, "$1\r\n");
}

function mensajeMime(o: { para: string[]; cc: string[]; asunto: string; html: string; texto: string; responderA?: string }): string {
  const limite = `rumbo_${crypto.randomUUID()}`;
  const remitente = secreto("GOOGLE_EMAIL");
  const cabeceras = [
    remitente ? `From: ${encabezado("RUMBO Asesorías")} <${remitente}>` : null,
    `To: ${o.para.join(", ")}`,
    o.cc.length ? `Cc: ${o.cc.join(", ")}` : null,
    o.responderA ? `Reply-To: ${o.responderA}` : null,
    `Subject: ${encabezado(o.asunto)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${limite}"`,
  ].filter(Boolean).join("\r\n");
  return [
    cabeceras,
    "",
    `--${limite}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    partir76(base64(o.texto)),
    `--${limite}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    partir76(base64(o.html)),
    `--${limite}--`,
    "",
  ].join("\r\n");
}

function htmlATexto(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|tr|li)>/gi, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function enviarCorreo(o: {
  tipo: string;
  para: (string | null | undefined)[];
  cc?: (string | null | undefined)[];
  asunto: string;
  html: string;
  reserva_id?: string | null;
  sesion_id?: string | null;
  responderA?: string;
}): Promise<boolean> {
  const para = [...new Set(o.para.filter(correoValido).map((e) => e.toLowerCase()))];
  const cc = [...new Set((o.cc ?? []).filter(correoValido).map((e) => e.toLowerCase()))].filter((e) => !para.includes(e));
  if (!para.length) return false;
  try {
    const raw = base64url(mensajeMime({ para, cc, asunto: o.asunto, html: o.html, texto: htmlATexto(o.html), responderA: o.responderA }));
    await google("POST", "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { raw });
    await db.from("notificaciones").insert({
      tipo: o.tipo, reserva_id: o.reserva_id ?? null, sesion_id: o.sesion_id ?? null,
      destinatario: [...para, ...cc].join(", "), ok: true,
    });
    return true;
  } catch (e) {
    console.error("[gmail]", o.tipo, (e as Error).message);
    await db.from("notificaciones").insert({
      tipo: o.tipo, reserva_id: o.reserva_id ?? null, sesion_id: o.sesion_id ?? null,
      destinatario: [...para, ...cc].join(", "), ok: false, detalle: (e as Error).message.slice(0, 1000),
    });
    return false;
  }
}

// =====================================================================
// PLANTILLAS DE CORREO
// =====================================================================
function plantilla(o: { titulo: string; saludo?: string; bloques: string[]; boton?: { texto: string; url: string }; aj: any }): string {
  const boton = o.boton
    ? `<p style="margin:26px 0 8px"><a href="${esc(o.boton.url)}" style="background:#004F8C;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;display:inline-block;font-family:Montserrat,Arial,sans-serif;font-size:14px">${esc(o.boton.texto)}</a></p>`
    : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F1EB">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F1EB;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E4E7EC">
<tr><td style="background:#004F8C;padding:22px 28px">
<span style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">RUMBO</span>
<span style="font-family:Arial,sans-serif;font-size:12px;color:#F6C667;margin-left:8px">Asesorías personalizadas</span>
</td></tr>
<tr><td style="padding:28px 28px 8px;font-family:'Open Sans',Arial,sans-serif;font-size:15px;line-height:1.6;color:#0F1A2B">
<h1 style="font-family:Montserrat,Arial,sans-serif;font-size:21px;line-height:1.3;margin:0 0 14px;color:#0F1A2B">${esc(o.titulo)}</h1>
${o.saludo ? `<p style="margin:0 0 12px">${esc(o.saludo)}</p>` : ""}
${o.bloques.join("\n")}
${boton}
</td></tr>
<tr><td style="padding:18px 28px 26px;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#7A8494;border-top:1px solid #EFF1F4">
¿Dudas? Escríbenos por <a href="${esc(linkWhatsApp(o.aj))}" style="color:#1D7874">WhatsApp</a> o responde este correo.<br>
RUMBO · Transformando decisiones en oportunidades · <a href="${esc(urlSitio(o.aj))}" style="color:#1D7874">rumbo.org.pe</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function p(html: string): string {
  return `<p style="margin:0 0 12px">${html}</p>`;
}

function caja(html: string, color = "#EDF7F9", borde = "#D6EEF3"): string {
  return `<div style="background:${color};border:1px solid ${borde};border-radius:12px;padding:14px 16px;margin:14px 0">${html}</div>`;
}

function listaSesiones(sesiones: any[], conLink: boolean): string {
  const filas = sesiones.filter((s) => s.estado !== "cancelada").map((s) => {
    const link = conLink && s.meet_url
      ? `<br><a href="${esc(s.meet_url)}" style="color:#004F8C;font-weight:700">Entrar a la videollamada</a>`
      : "";
    const etiqueta = sesiones.length > 1 ? `Sesión ${s.numero}: ` : "";
    return `<div style="margin:6px 0"><strong>${etiqueta}${esc(cuando(s.inicio))}</strong>${link}</div>`;
  }).join("");
  return caja(filas);
}

function datosPago(aj: any, monto: unknown): string {
  const lineas = [
    `<strong>Monto a pagar: ${esc(soles(monto))}</strong>`,
    aj.yape_numero ? `Yape: <strong>${esc(aj.yape_numero)}</strong>` : "",
    aj.plin_numero ? `Plin: <strong>${esc(aj.plin_numero)}</strong>` : "",
    aj.cuenta_bancaria ? `Transferencia: ${esc(aj.cuenta_bancaria)}` : "",
    aj.pago_titular ? `A nombre de: ${esc(aj.pago_titular)}` : "",
  ].filter(Boolean).join("<br>");
  return caja(lineas, "#FDF3D7", "#F6C667");
}

// =====================================================================
// FLUJOS DE CORREO
// =====================================================================
async function correoReservaRecibida(reservaId: string) {
  const aj = await ajustes();
  const r = await reservaPorId(reservaId);
  const sesiones = await sesionesDe(reservaId);
  const html = plantilla({
    aj,
    titulo: "Recibimos tu reserva 🙌",
    saludo: `Hola ${primerNombre(r.nombre)},`,
    bloques: [
      p(`Apartamos tu${sesiones.length > 1 ? "s" : ""} horario${sesiones.length > 1 ? "s" : ""} con <strong>${esc(r.miembros?.nombre)}</strong> (código <strong>${esc(r.codigo)}</strong>):`),
      listaSesiones(sesiones, false),
      p(`Para confirmar, paga por Yape o Plin y <strong>sube la captura del pago antes del ${esc(cuando(r.pago_vence_at))}</strong>. Si no la recibimos a tiempo, el horario se libera automáticamente.`),
      datosPago(aj, r.monto),
    ],
    boton: { texto: "Subir mi comprobante", url: linkMiReserva(aj, r.token) },
  });
  await enviarCorreo({
    tipo: "reserva_recibida", reserva_id: r.id, para: [r.email], cc: [r.apoderado_email],
    asunto: `Tu reserva ${r.codigo} está apartada — falta el pago`, html, responderA: aj.email_respuesta,
  });
}

async function correosVoucherRecibido(reservaId: string) {
  const aj = await ajustes();
  const r = await reservaPorId(reservaId);
  const sesiones = await sesionesDe(reservaId);

  await enviarCorreo({
    tipo: "voucher_recibido", reserva_id: r.id, para: [r.email], cc: [r.apoderado_email],
    asunto: `Recibimos tu comprobante — reserva ${r.codigo}`, responderA: aj.email_respuesta,
    html: plantilla({
      aj,
      titulo: "Estamos verificando tu pago",
      saludo: `Hola ${primerNombre(r.nombre)},`,
      bloques: [
        p("Recibimos tu comprobante. Un coordinador lo revisará en las próximas horas; en cuanto quede verificado te llegará la confirmación con el link de la videollamada."),
        listaSesiones(sesiones, false),
      ],
      boton: { texto: "Ver mi reserva", url: linkMiReserva(aj, r.token) },
    }),
  });

  let destinos: string[] = (aj.emails_coordinacion ?? []).filter(correoValido);
  if (!destinos.length) {
    const { data } = await db.from("miembros").select("email").eq("activo", true).or("es_coordinador.eq.true,es_admin.eq.true");
    destinos = (data ?? []).map((x: any) => x.email).filter(correoValido);
  }
  await enviarCorreo({
    tipo: "aviso_coordinacion", reserva_id: r.id, para: destinos,
    asunto: `💸 Voucher por verificar: ${r.codigo} · ${soles(r.monto)} · ${r.nombre}`,
    html: plantilla({
      aj,
      titulo: "Nuevo comprobante por verificar",
      bloques: [
        caja([
          `<strong>${esc(r.nombre)}</strong> · ${esc(r.email)} · WhatsApp ${esc(r.whatsapp)}`,
          `Plan: ${r.plan === "pack" ? "Pack de 3 sesiones" : "Sesión individual"} · Monto: <strong>${esc(soles(r.monto))}</strong> (${esc(r.pago_metodo ?? "")})`,
          `Asesor(a): ${esc(r.miembros?.nombre)} · Tema: ${esc(r.temas?.nombre ?? "—")}`,
        ].join("<br>")),
        listaSesiones(sesiones, false),
        p("Revisa el comprobante en el panel y marca <strong>Pago verificado</strong>. El sistema enviará la confirmación y el link de Meet automáticamente."),
      ],
      boton: { texto: "Abrir el panel", url: `${urlSitio(aj)}/panel.html#reservas` },
    }),
  });
}

async function correosConfirmacion(reservaId: string, conf?: any) {
  const aj = await ajustes();
  const r = await reservaPorId(reservaId);
  const sesiones = await sesionesDe(reservaId);
  const codigoRef = conf?.codigo_referido ??
    (await db.from("cupones").select("codigo").eq("tipo", "referido").eq("referente_reserva_id", r.id).maybeSingle()).data?.codigo;
  const sinLink = sesiones.some((s) => !s.meet_url);

  // Estudiante
  await enviarCorreo({
    tipo: "confirmacion", reserva_id: r.id, para: [r.email], cc: [r.apoderado_email],
    asunto: `✅ Asesoría confirmada con ${primerNombre(r.miembros?.nombre)} — ${r.codigo}`, responderA: aj.email_respuesta,
    html: plantilla({
      aj,
      titulo: "¡Tu asesoría está confirmada!",
      saludo: `Hola ${primerNombre(r.nombre)},`,
      bloques: [
        p(r.modalidad === "B"
          ? "Tu asesoría es <strong>gratuita</strong> gracias a un donante de RUMBO. 💙"
          : "Verificamos tu pago. ¡Gracias por confiar en RUMBO!"),
        p(`Te acompañará <strong>${esc(r.miembros?.nombre)}</strong>. Tema: ${esc(r.temas?.nombre ?? "Orientación")}.`),
        listaSesiones(sesiones, true),
        sinLink ? p("El link de la videollamada te llegará en un correo aparte (invitación de Google Calendar).") : "",
        p("También te llegará una invitación de Google Calendar. Entra 2 minutos antes desde tu computadora o celular."),
        caja(`<strong>Antes de tu sesión:</strong> completa el diagnóstico (3 minutos) para que tu asesor(a) llegue con recursos pensados para ti.<br><a href="${esc(linkMiReserva(aj, r.token, "#diagnostico"))}" style="color:#004F8C;font-weight:700">Completar diagnóstico</a>`, "#FDF3D7", "#F6C667"),
        codigoRef
          ? p(`🎁 <strong>Tu código para invitar amigos: ${esc(codigoRef)}</strong>. Tu amigo obtiene ${esc(soles(aj.descuento_referido_monto))} de descuento y, cuando confirme, tú recibes ${esc(soles(aj.premio_referente_monto))} para tu próxima sesión.`)
          : "",
        p(`¿Necesitas cambiar la fecha? Puedes reprogramar ${aj.max_reprogramaciones === 1 ? "una vez" : `${aj.max_reprogramaciones} veces`} hasta ${aj.limite_reprogramar_horas} horas antes desde tu enlace.`),
      ],
      boton: { texto: "Ver mi reserva", url: linkMiReserva(aj, r.token) },
    }),
  });

  // Asesor
  await enviarCorreo({
    tipo: "nueva_sesion_asesor", reserva_id: r.id, para: [r.miembros?.email],
    asunto: `📅 Nueva asesoría confirmada: ${r.nombre} (${r.temas?.nombre ?? "Orientación"})`,
    html: plantilla({
      aj,
      titulo: "Tienes una nueva asesoría",
      saludo: `Hola ${primerNombre(r.miembros?.nombre)},`,
      bloques: [
        caja([
          `<strong>${esc(r.nombre)}</strong>${r.es_menor ? " (menor de edad)" : ""}`,
          `Tema: ${esc(r.temas?.nombre ?? "—")} · ${r.grado ? esc(r.grado) + " · " : ""}${esc(r.ciudad ?? "")}`,
          `WhatsApp: ${esc(r.whatsapp)} · ${esc(r.email)}`,
          r.detalle ? `<em>“${esc(r.detalle)}”</em>` : "",
        ].filter(Boolean).join("<br>")),
        listaSesiones(sesiones, true),
        p("La invitación ya está en tu Google Calendar. 24 horas antes podrás ver su diagnóstico en el panel."),
      ],
      boton: { texto: "Ver en el panel", url: `${urlSitio(aj)}/panel.html#sesiones` },
    }),
  });

  // Premio para quien refirió
  const premio = conf?.premio;
  if (premio?.codigo) {
    await enviarCorreo({
      tipo: "premio_referido", reserva_id: r.id, para: [premio.email],
      asunto: `🎁 Ganaste ${soles(premio.monto)} para tu próxima asesoría`,
      html: plantilla({
        aj,
        titulo: "¡Gracias por recomendarnos!",
        saludo: `Hola ${primerNombre(premio.nombre)},`,
        bloques: [
          p(`${esc(primerNombre(premio.referido))} reservó su asesoría con tu código. Como agradecimiento, aquí tienes tu premio:`),
          caja(`<strong style="font-size:18px">${esc(premio.codigo)}</strong><br>${esc(soles(premio.monto))} de descuento · un solo uso · válido 6 meses`, "#FDF3D7", "#F6C667"),
        ],
        boton: { texto: "Reservar otra asesoría", url: `${urlSitio(aj)}/asesorias.html` },
      }),
    });
  }
}

async function confirmarYNotificar(reservaId: string, conf?: any): Promise<{ errores: string[] }> {
  const { errores } = await asegurarEventos(reservaId);
  await correosConfirmacion(reservaId, conf);
  return { errores };
}

// =====================================================================
// ACCIONES PÚBLICAS
// =====================================================================
async function accionReservar(b: any) {
  if (b.sitio_web) throw new ErrorRumbo("No pudimos procesar tu solicitud.");  // trampa para bots
  const campos = [
    "plan", "asesor", "tema", "inicios", "nombre", "email", "whatsapp", "ciudad", "grado", "detalle",
    "es_menor", "apoderado_nombre", "apoderado_email", "apoderado_telefono", "apoderado_autoriza",
    "acepta_privacidad", "cupon", "amigo_email",
  ];
  const payload: Record<string, unknown> = { origen: "web" };
  for (const c of campos) if (b[c] !== undefined) payload[c] = b[c];

  const r = await rpc("crear_reserva", { p: payload });

  if (r.estado === "confirmada") {
    await enSegundoPlano(confirmarYNotificar(r.id, r.confirmacion));
  } else {
    await enSegundoPlano(correoReservaRecibida(r.id));
  }
  return {
    codigo: r.codigo, token: r.token, estado: r.estado, monto: r.monto,
    descuento: r.descuento, precio_lista: r.precio_lista, pago_vence_at: r.pago_vence_at,
  };
}

async function accionSubirVoucher(b: any) {
  const token = exigirUuid(b.token, "enlace de reserva");
  const tipo = String(b.tipo ?? "");
  const ext = TIPOS_VOUCHER[tipo];
  if (!ext) throw new ErrorRumbo("Sube una imagen (JPG, PNG o WEBP) o un PDF.");
  const datos = String(b.archivo_base64 ?? "").replace(/^data:[^,]+,/, "");
  if (!datos) throw new ErrorRumbo("No recibimos el archivo.");
  if (datos.length > 7_000_000) throw new ErrorRumbo("El archivo es muy pesado (máximo 5 MB).");

  const { data: r } = await db.from("reservas").select("id, estado").eq("token", token).maybeSingle();
  if (!r) throw new ErrorRumbo("Enlace de reserva inválido.", 404);
  if (!["pendiente_pago", "en_revision"].includes(r.estado)) {
    throw new ErrorRumbo("Esta reserva ya no acepta comprobantes (puede haber vencido o estar confirmada).");
  }

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(datos), (c) => c.charCodeAt(0));
  } catch {
    throw new ErrorRumbo("El archivo llegó dañado. Intenta de nuevo.");
  }
  const ruta = `${r.id}/${Date.now()}.${ext}`;
  const { error: errSubida } = await db.storage.from("vouchers").upload(ruta, bytes, { contentType: tipo, upsert: false });
  if (errSubida) throw new Error(`No se pudo guardar el comprobante: ${errSubida.message}`);

  const metodo = ["yape", "plin", "transferencia"].includes(b.metodo) ? b.metodo : "yape";
  await rpc("registrar_voucher", { p_token: token, p_path: ruta, p_metodo: metodo });
  await enSegundoPlano(correosVoucherRecibido(r.id));
  return { ok: true, estado: "en_revision" };
}

async function avisarReprogramacion(res: any, actor: string) {
  const aj = await ajustes();
  const r = await reservaPorId(res.reserva_id);
  const { data: s } = await db.from("v_sesiones_detalle").select("*").eq("id", res.sesion_id).single();
  if (r.estado === "confirmada" && s?.google_event_id) {
    try {
      await actualizarHoraEvento(s.google_event_id, s.inicio, s.fin);
    } catch (e) {
      await db.from("notificaciones").insert({
        tipo: "google_calendar", reserva_id: r.id, sesion_id: s.id, ok: false, detalle: (e as Error).message.slice(0, 1000),
      });
    }
  }
  const bloque = caja(`Antes: <s>${esc(cuando(res.inicio_anterior))}</s><br><strong>Ahora: ${esc(cuando(res.inicio_nuevo))}</strong>${
    r.estado === "confirmada" && s?.meet_url ? `<br><a href="${esc(s.meet_url)}" style="color:#004F8C;font-weight:700">Link de la videollamada (el mismo)</a>` : ""
  }`);
  await enviarCorreo({
    tipo: "reprogramada", reserva_id: r.id, sesion_id: res.sesion_id, para: [r.email], cc: [r.apoderado_email],
    asunto: `🔁 Sesión reprogramada — ${r.codigo}`, responderA: aj.email_respuesta,
    html: plantilla({
      aj, titulo: "Tu sesión cambió de horario", saludo: `Hola ${primerNombre(r.nombre)},`,
      bloques: [p(`Tu sesión ${res.numero > 1 || r.plan === "pack" ? res.numero + " " : ""}con ${esc(r.miembros?.nombre)} quedó así:`), bloque],
      boton: { texto: "Ver mi reserva", url: linkMiReserva(aj, r.token) },
    }),
  });
  if (r.estado === "confirmada") {
    await enviarCorreo({
      tipo: "reprogramada_asesor", reserva_id: r.id, sesion_id: res.sesion_id, para: [r.miembros?.email],
      asunto: `🔁 ${r.nombre} reprogramó su sesión`,
      html: plantilla({
        aj, titulo: "Una sesión cambió de horario", saludo: `Hola ${primerNombre(r.miembros?.nombre)},`,
        bloques: [p(`${esc(r.nombre)} (${esc(r.temas?.nombre ?? "—")}) — cambio hecho por ${esc(actor)}:`), bloque],
        boton: { texto: "Ver en el panel", url: `${urlSitio(aj)}/panel.html#sesiones` },
      }),
    });
  }
}

// El estudiante perdió su código o su correo: le reenviamos sus enlaces.
// Siempre responde lo mismo, para no revelar si un correo tiene reservas.
async function accionRecuperarReservas(b: any) {
  if (b.sitio_web) throw new ErrorRumbo("No pudimos procesar tu solicitud.");
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ErrorRumbo("Escribe un correo válido.");
  const respuesta = {
    ok: true,
    aviso: "Si hay reservas activas con ese correo, te acabamos de enviar sus enlaces. Revisa también la carpeta de Spam.",
  };

  // Máximo 3 reenvíos por hora para el mismo correo
  const haceUnaHora = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("notificaciones").select("id", { count: "exact", head: true })
    .eq("tipo", "recuperar_reservas").eq("destinatario", email).gte("created_at", haceUnaHora);
  if ((count ?? 0) >= 3) return respuesta;

  const hace180 = new Date(Date.now() - 180 * 864e5).toISOString();
  const { data: reservas } = await db.from("reservas")
    .select("id, codigo, token, estado, plan, apoderado_email, miembros!reservas_miembro_id_fkey(nombre), sesiones(inicio, estado, numero)")
    .eq("email", email).in("estado", ["pendiente_pago", "en_revision", "confirmada"])
    .gte("created_at", hace180).order("created_at", { ascending: false }).limit(10);
  if (!reservas?.length) return respuesta;

  const aj = await ajustes();
  const etiqueta: Record<string, string> = {
    pendiente_pago: "Falta tu pago", en_revision: "Verificando tu pago", confirmada: "Confirmada",
  };
  const filas = reservas.map((r: any) => {
    const ses = (r.sesiones ?? []).filter((s: any) => s.estado !== "cancelada")
      .sort((x: any, y: any) => x.numero - y.numero);
    const fechas = ses.map((s: any) => esc(cuando(s.inicio))).join("<br>");
    return caja(
      `<strong>${esc(r.codigo)}</strong> · ${esc(etiqueta[r.estado] ?? r.estado)} · con ${esc(r.miembros?.nombre ?? "RUMBO")}<br>` +
      `${fechas}<br><a href="${esc(linkMiReserva(aj, r.token))}" style="color:#004F8C;font-weight:700">Ver esta reserva</a>`,
    );
  });
  await enviarCorreo({
    tipo: "recuperar_reservas", para: [email], asunto: "Tus enlaces de reserva — RUMBO", responderA: aj.email_respuesta,
    reserva_id: reservas[0].id,
    html: plantilla({
      aj, titulo: "Aquí están tus reservas",
      bloques: [p("Pediste que te reenviáramos los enlaces de tus asesorías. Cada enlace es personal: no lo compartas."), ...filas],
    }),
  });
  return respuesta;
}

async function accionReprogramarEstudiante(b: any) {
  const token = exigirUuid(b.token, "enlace de reserva");
  const sesion = exigirUuid(b.sesion_id, "sesión");
  if (!b.inicio || isNaN(Date.parse(b.inicio))) throw new ErrorRumbo("Elige un nuevo horario.");
  const res = await rpc("reprogramar_sesion", { p_sesion: sesion, p_inicio: b.inicio, p_por_estudiante: true, p_token: token });
  await enSegundoPlano(avisarReprogramacion(res, "el estudiante"));
  return { ok: true, inicio: res.inicio_nuevo };
}

// =====================================================================
// ACCIONES DEL PANEL (coordinación)
// =====================================================================
async function accionVerificarPago(m: any, b: any) {
  const id = exigirUuid(b.reserva_id, "reserva");
  const conf = await rpc("confirmar_reserva", { p_reserva: id, p_actor: m.id, p_metodo: b.metodo ?? null });
  const { errores } = await confirmarYNotificar(id, conf);
  return {
    ok: true,
    aviso: errores.length
      ? `Pago verificado y correos enviados, pero no se pudo crear el Meet. ${unirErrores(errores)} Luego usa "Reintentar Meet".`
      : "Pago verificado. Se enviaron la confirmación, la invitación y el link de Meet.",
  };
}

async function accionRechazarPago(m: any, b: any) {
  const id = exigirUuid(b.reserva_id, "reserva");
  const motivo = String(b.motivo ?? "").trim();
  if (motivo.length < 4) throw new ErrorRumbo("Escribe el motivo para que el estudiante sepa qué corregir.");
  const r = await rpc("rechazar_pago", { p_reserva: id, p_motivo: motivo, p_actor: m.id });
  const aj = await ajustes();
  await enviarCorreo({
    tipo: "pago_rechazado", reserva_id: id, para: [r.email], cc: [r.apoderado_email],
    asunto: `Necesitamos revisar tu pago — reserva ${r.codigo}`, responderA: aj.email_respuesta,
    html: plantilla({
      aj, titulo: "No pudimos verificar tu pago", saludo: `Hola ${primerNombre(r.nombre)},`,
      bloques: [
        caja(`<strong>Motivo:</strong> ${esc(motivo)}`, "#FCEBEB", "#F2B8B5"),
        p(`Tu horario sigue apartado hasta el <strong>${esc(cuando(r.pago_vence_at))}</strong>. Sube un nuevo comprobante desde tu enlace o escríbenos por WhatsApp.`),
        datosPago(aj, r.monto),
      ],
      boton: { texto: "Subir nuevo comprobante", url: linkMiReserva(aj, r.token) },
    }),
  });
  return { ok: true, aviso: "Se avisó al estudiante con el motivo." };
}

async function accionCancelar(m: any, b: any) {
  const id = exigirUuid(b.reserva_id, "reserva");
  const motivo = String(b.motivo ?? "").trim();
  const antes = await sesionesDe(id);
  const r = await rpc("cancelar_reserva", { p_reserva: id, p_motivo: motivo, p_actor: m.nombre });
  for (const s of antes) if (s.google_event_id && s.estado === "activa") await borrarEvento(s.google_event_id);
  if (b.avisar !== false) {
    const aj = await ajustes();
    const full = await reservaPorId(id);
    await enviarCorreo({
      tipo: "cancelada", reserva_id: id, para: [r.email], cc: [r.apoderado_email],
      asunto: `Reserva ${r.codigo} cancelada`, responderA: aj.email_respuesta,
      html: plantilla({
        aj, titulo: "Tu reserva fue cancelada", saludo: `Hola ${primerNombre(r.nombre)},`,
        bloques: [
          motivo ? caja(`<strong>Motivo:</strong> ${esc(motivo)}`) : "",
          p("Si ya habías pagado, coordinaremos contigo la devolución o una nueva fecha por WhatsApp."),
        ],
        boton: { texto: "Escribir por WhatsApp", url: linkWhatsApp(aj, `Hola RUMBO, sobre mi reserva ${r.codigo}`) },
      }),
    });
    if (full.miembros?.email && antes.some((s) => s.reserva_estado === "confirmada")) {
      await enviarCorreo({
        tipo: "cancelada_asesor", reserva_id: id, para: [full.miembros.email],
        asunto: `Se canceló la asesoría de ${r.nombre}`,
        html: plantilla({
          aj, titulo: "Asesoría cancelada", saludo: `Hola ${primerNombre(full.miembros.nombre)},`,
          bloques: [p(`La reserva ${esc(r.codigo)} de ${esc(r.nombre)} fue cancelada por ${esc(m.nombre)}.`), motivo ? caja(esc(motivo)) : "", listaSesiones(antes, false)],
        }),
      });
    }
  }
  return { ok: true, aviso: "Reserva cancelada y horarios liberados." };
}

async function accionMoverSesion(m: any, b: any) {
  const sesion = exigirUuid(b.sesion_id, "sesión");
  if (!b.inicio || isNaN(Date.parse(b.inicio))) throw new ErrorRumbo("Elige el nuevo horario.");
  const res = await rpc("reprogramar_sesion", {
    p_sesion: sesion, p_inicio: b.inicio, p_por_estudiante: false, p_token: null,
    p_actor: m.nombre, p_forzar: !!b.forzar,
  });
  await avisarReprogramacion(res, m.nombre);
  return { ok: true, aviso: "Sesión movida y avisos enviados." };
}

async function accionReasignar(m: any, b: any) {
  const id = exigirUuid(b.reserva_id, "reserva");
  const asesor = exigirUuid(b.asesor_id, "asesor");
  const antes = await sesionesDe(id);
  const emailAnterior = antes[0]?.asesor_email;
  const res = await rpc("reasignar_reserva", { p_reserva: id, p_asesor: asesor, p_forzar: !!b.forzar, p_actor: m.nombre });
  const r = await reservaPorId(id);
  const despues = await sesionesDe(id);
  const aj = await ajustes();

  for (const s of despues) {
    if (!s.google_event_id || !(res.sesiones ?? []).includes(s.id)) continue;
    try {
      const ev = await google("GET", `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(s.google_event_id)}`);
      const lista = (ev.attendees ?? []).filter((a: any) => (a.email ?? "").toLowerCase() !== String(emailAnterior ?? "").toLowerCase());
      if (correoValido(s.asesor_email)) lista.push({ email: s.asesor_email, displayName: s.asesor_nombre });
      const cambio: any = { attendees: lista, description: textoEvento(s, s.meet_url) };
      if (s.sala_fija_url) {
        cambio.location = s.sala_fija_url;
        await db.from("sesiones").update({ meet_url: s.sala_fija_url, meet_metodo: "sala_fija" }).eq("id", s.id);
      }
      await google("PATCH", `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(s.google_event_id)}?sendUpdates=all`, cambio);
    } catch (e) {
      await db.from("notificaciones").insert({ tipo: "google_calendar", reserva_id: id, sesion_id: s.id, ok: false, detalle: (e as Error).message.slice(0, 1000) });
    }
  }

  if (r.estado === "confirmada") {
    const final = await sesionesDe(id);
    await enviarCorreo({
      tipo: "reasignada", reserva_id: id, para: [r.email], cc: [r.apoderado_email],
      asunto: `Cambio de asesor(a) en tu reserva ${r.codigo}`, responderA: aj.email_respuesta,
      html: plantilla({
        aj, titulo: "Tienes un nuevo asesor(a)", saludo: `Hola ${primerNombre(r.nombre)},`,
        bloques: [p(`Por motivos de agenda, tu asesoría será con <strong>${esc(r.miembros?.nombre)}</strong>. El horario se mantiene:`), listaSesiones(final, true)],
        boton: { texto: "Ver mi reserva", url: linkMiReserva(aj, r.token) },
      }),
    });
    await correosConfirmacionSoloAsesor(id);
  }
  return { ok: true, aviso: "Reserva reasignada." };
}

async function correosConfirmacionSoloAsesor(reservaId: string) {
  const aj = await ajustes();
  const r = await reservaPorId(reservaId);
  const sesiones = await sesionesDe(reservaId);
  await enviarCorreo({
    tipo: "nueva_sesion_asesor", reserva_id: r.id, para: [r.miembros?.email],
    asunto: `📅 Te asignaron una asesoría: ${r.nombre}`,
    html: plantilla({
      aj, titulo: "Te asignaron una asesoría", saludo: `Hola ${primerNombre(r.miembros?.nombre)},`,
      bloques: [
        caja([`<strong>${esc(r.nombre)}</strong>`, `Tema: ${esc(r.temas?.nombre ?? "—")}`, `WhatsApp: ${esc(r.whatsapp)} · ${esc(r.email)}`,
          r.detalle ? `<em>“${esc(r.detalle)}”</em>` : ""].filter(Boolean).join("<br>")),
        listaSesiones(sesiones, true),
      ],
      boton: { texto: "Ver en el panel", url: `${urlSitio(aj)}/panel.html#sesiones` },
    }),
  });
}

async function accionReservaPanel(m: any, b: any) {
  const p = { ...(b.reserva ?? {}), desde_panel: true, actor: m.nombre, origen: b.reserva?.origen ?? "whatsapp" };
  const r = await rpc("crear_reserva", { p });
  if (r.estado === "confirmada") await confirmarYNotificar(r.id, r.confirmacion);
  else await correoReservaRecibida(r.id);
  return { ok: true, codigo: r.codigo, estado: r.estado, aviso: `Reserva ${r.codigo} creada (${r.estado.replace("_", " ")}).` };
}

async function accionReintentarMeet(_m: any, b: any) {
  const id = exigirUuid(b.reserva_id, "reserva");
  const { creados, errores } = await asegurarEventos(id);
  if (errores.length) throw new ErrorRumbo(`No se pudo crear el Meet. ${unirErrores(errores)}`);
  if (creados && b.reenviar !== false) await correosConfirmacion(id);
  return { ok: true, aviso: creados ? `Se crearon ${creados} evento(s) con Meet y se reenviaron los correos.` : "Todas las sesiones ya tenían su evento." };
}

async function accionReenviar(_m: any, b: any) {
  const id = exigirUuid(b.reserva_id, "reserva");
  const r = await reservaPorId(id);
  if (r.estado === "confirmada") await correosConfirmacion(id);
  else if (r.estado === "pendiente_pago") await correoReservaRecibida(id);
  else throw new ErrorRumbo("No hay correo que reenviar para este estado.");
  return { ok: true, aviso: "Correo reenviado." };
}

async function accionVerVoucher(_m: any, b: any) {
  const id = exigirUuid(b.reserva_id, "reserva");
  const { data: r } = await db.from("reservas").select("voucher_path").eq("id", id).single();
  if (!r?.voucher_path) throw new ErrorRumbo("Esta reserva no tiene comprobante.");
  const { data, error } = await db.storage.from("vouchers").createSignedUrl(r.voucher_path, 600);
  if (error) throw new Error(error.message);
  return { url: data.signedUrl, es_pdf: r.voucher_path.endsWith(".pdf") };
}

// =====================================================================
// ACCIONES DEL PANEL (administración)
// =====================================================================
async function buscarUsuarioPorEmail(email: string): Promise<any | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const u = data.users.find((x: any) => (x.email ?? "").toLowerCase() === email);
    if (u) return u;
    if (data.users.length < 200) break;
  }
  return null;
}

async function accionCrearAcceso(_admin: any, b: any) {
  const miembroId = exigirUuid(b.miembro_id, "miembro");
  const email = String(b.email ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  if (!EMAIL_RE.test(email)) throw new ErrorRumbo("Escribe un correo válido.");
  if (password.length < 8) throw new ErrorRumbo("La contraseña debe tener al menos 8 caracteres.");

  const { data: otro } = await db.from("miembros").select("id, nombre").eq("email", email).neq("id", miembroId).maybeSingle();
  if (otro) throw new ErrorRumbo(`Ese correo ya pertenece a ${otro.nombre}.`);

  let usuario = await buscarUsuarioPorEmail(email);
  if (usuario) {
    const { error } = await db.auth.admin.updateUserById(usuario.id, { password, email_confirm: true });
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(error.message);
    usuario = data.user;
  }
  const { error: e2 } = await db.from("miembros").update({ user_id: usuario.id, email }).eq("id", miembroId);
  if (e2) throw errorDb(e2);
  return { ok: true, aviso: `Acceso listo para ${email}. Compártele la contraseña por un medio privado.` };
}

async function accionCambiarPassword(_admin: any, b: any) {
  const miembroId = exigirUuid(b.miembro_id, "miembro");
  const password = String(b.password ?? "");
  if (password.length < 8) throw new ErrorRumbo("La contraseña debe tener al menos 8 caracteres.");
  const { data: mm } = await db.from("miembros").select("user_id").eq("id", miembroId).single();
  if (!mm?.user_id) throw new ErrorRumbo("Esta persona aún no tiene acceso. Usa “Crear acceso”.");
  const { error } = await db.auth.admin.updateUserById(mm.user_id, { password });
  if (error) throw new Error(error.message);
  return { ok: true, aviso: "Contraseña actualizada." };
}

async function accionQuitarAcceso(admin: any, b: any) {
  const miembroId = exigirUuid(b.miembro_id, "miembro");
  if (miembroId === admin.id) throw new ErrorRumbo("No puedes quitarte el acceso a ti mismo.");
  const { data: mm } = await db.from("miembros").select("user_id").eq("id", miembroId).single();
  if (mm?.user_id) {
    await db.from("miembros").update({ user_id: null }).eq("id", miembroId);
    const { error } = await db.auth.admin.deleteUser(mm.user_id);
    if (error) console.warn("[auth] deleteUser", error.message);
  }
  return { ok: true, aviso: "Acceso eliminado. Sus reservas e historial se conservan." };
}

async function accionProbarGoogle(admin: any, _b: any) {
  const resultado: Record<string, string> = {};
  try {
    await googleToken();
    resultado.credenciales = "✅ Conectado a Google";
  } catch (e) {
    const msg = (e as Error).message;
    const id = secreto("GOOGLE_CLIENT_ID");
    const delCliente = id && /GOOGLE_CLIENT_ID|invalid_client|deleted_client|unauthorized_client/.test(msg);
    return {
      ok: false,
      credenciales: `❌ ${msg}`,
      cliente: delCliente ? `ID de cliente guardado en Supabase: ${id} (${id.length} caracteres). Compáralo letra por letra con el de Google Cloud.` : "",
    };
  }
  const sala = await crearSalaMeet();
  resultado.meet = sala
    ? `✅ Salas de Meet abiertas disponibles (${sala.url})`
    : "⚠️ La API de Meet no está disponible: se usará el Meet del calendario (los invitados con otro correo podrían tener que esperar a ser admitidos). Revisa que activaste “Google Meet REST API”.";
  const aj = await ajustes();
  const ok = await enviarCorreo({
    tipo: "prueba", para: [admin.email], asunto: "✅ Prueba de correo del sistema de asesorías RUMBO",
    html: plantilla({ aj, titulo: "¡Funciona!", saludo: `Hola ${primerNombre(admin.nombre)},`, bloques: [p("Este correo confirma que el sistema puede enviar correos desde el Gmail de RUMBO.")] }),
  });
  resultado.correo = ok ? `✅ Correo de prueba enviado a ${admin.email}` : "❌ No se pudo enviar el correo (revisa la pestaña Correos del panel).";
  return { ok: true, ...resultado };
}

// =====================================================================
// TAREAS PROGRAMADAS (cada 10 minutos)
// =====================================================================
async function tareasProgramadas() {
  const aj = await ajustes();
  const resumen: Record<string, number> = { expiradas: 0, r24: 0, r2: 0, encuestas: 0, informes: 0 };

  // 1) Vencer reservas sin pago
  const expiradas: any[] = (await rpc("expirar_reservas")) ?? [];
  for (const r of expiradas) {
    resumen.expiradas++;
    await enviarCorreo({
      tipo: "expirada", reserva_id: r.id, para: [r.email], cc: [r.apoderado_email],
      asunto: `Tu reserva ${r.codigo} venció`, responderA: aj.email_respuesta,
      html: plantilla({
        aj, titulo: "Tu reserva venció", saludo: `Hola ${primerNombre(r.nombre)},`,
        bloques: [p("No recibimos tu comprobante a tiempo, así que liberamos el horario para otro estudiante. ¡Puedes volver a reservar cuando quieras!"),
          p("Si ya pagaste, escríbenos por WhatsApp con tu captura y lo solucionamos.")],
        boton: { texto: "Reservar de nuevo", url: `${urlSitio(aj)}/asesorias.html` },
      }),
    });
  }

  const detalles = async (tipo: string) => {
    const ids: string[] = ((await rpc("reclamar_envios", { p_tipo: tipo })) ?? []).map((x: any) => (typeof x === "string" ? x : x.reclamar_envios ?? x.id));
    if (!ids.length) return [];
    const { data } = await db.from("v_sesiones_detalle").select("*").in("id", ids);
    return data ?? [];
  };

  // 2) Recordatorio 24 h
  for (const s of await detalles("24h")) {
    resumen.r24++;
    const diag = s.tiene_diagnostico
      ? ""
      : caja(`📝 <strong>Aún no completas tu diagnóstico.</strong> Toma 3 minutos y ayuda a que tu asesor(a) prepare tu sesión.<br><a href="${esc(linkMiReserva(aj, s.token, "#diagnostico"))}" style="color:#004F8C;font-weight:700">Completar diagnóstico</a>`, "#FDF3D7", "#F6C667");
    await enviarCorreo({
      tipo: "recordatorio_24h", reserva_id: s.reserva_id, sesion_id: s.id, para: [s.estudiante_email], cc: [s.apoderado_email],
      asunto: `⏰ Mañana es tu asesoría con ${primerNombre(s.asesor_nombre)}`, responderA: aj.email_respuesta,
      html: plantilla({
        aj, titulo: "Tu asesoría es en 24 horas", saludo: `Hola ${primerNombre(s.estudiante_nombre)},`,
        bloques: [listaSesiones([s], true), diag, p("Ten a la mano tus dudas, tus notas y, si aplica, tu CV o documentos.")],
        boton: { texto: "Ver mi reserva", url: linkMiReserva(aj, s.token) },
      }),
    });
    await enviarCorreo({
      tipo: "recordatorio_24h_asesor", reserva_id: s.reserva_id, sesion_id: s.id, para: [s.asesor_email],
      asunto: `⏰ Mañana: asesoría con ${s.estudiante_nombre}`,
      html: plantilla({
        aj, titulo: "Tu asesoría es en 24 horas", saludo: `Hola ${primerNombre(s.asesor_nombre)},`,
        bloques: [
          caja(`<strong>${esc(s.estudiante_nombre)}</strong> · ${esc(s.tema_nombre ?? "—")} · sesión ${s.numero}/${s.total_sesiones}`),
          listaSesiones([s], true),
          p(s.tiene_diagnostico ? "✅ Ya completó su diagnóstico: revísalo en el panel." : "⚠️ Aún no completa su diagnóstico; le enviamos un recordatorio."),
        ],
        boton: { texto: "Ver diagnóstico en el panel", url: `${urlSitio(aj)}/panel.html#sesiones` },
      }),
    });
  }

  // 3) Recordatorio 2 h
  for (const s of await detalles("2h")) {
    resumen.r2++;
    for (const [para, cc, nombre] of [[s.estudiante_email, s.apoderado_email, s.estudiante_nombre], [s.asesor_email, null, s.asesor_nombre]]) {
      await enviarCorreo({
        tipo: para === s.asesor_email ? "recordatorio_2h_asesor" : "recordatorio_2h",
        reserva_id: s.reserva_id, sesion_id: s.id, para: [para], cc: [cc],
        asunto: `🚀 En 2 horas: asesoría RUMBO (${fmtHora.format(new Date(s.inicio))})`,
        html: plantilla({
          aj, titulo: "¡Nos vemos en 2 horas!", saludo: `Hola ${primerNombre(nombre)},`,
          bloques: [listaSesiones([s], true), p("Entra 2 minutos antes. Si tienes algún problema para conectarte, escríbenos por WhatsApp.")],
          boton: s.meet_url ? { texto: "Entrar a la videollamada", url: s.meet_url } : undefined,
        }),
      });
    }
  }

  // 4) Encuesta de satisfacción
  for (const s of await detalles("encuesta")) {
    resumen.encuestas++;
    await enviarCorreo({
      tipo: "encuesta", reserva_id: s.reserva_id, sesion_id: s.id, para: [s.estudiante_email],
      asunto: `¿Cómo te fue con ${primerNombre(s.asesor_nombre)}? (1 minuto)`, responderA: aj.email_respuesta,
      html: plantilla({
        aj, titulo: "Cuéntanos cómo te fue", saludo: `Hola ${primerNombre(s.estudiante_nombre)},`,
        bloques: [p("Gracias por tu sesión. Tu opinión nos ayuda a mejorar y a llegar a más jóvenes. Son 4 preguntas."),
          p(`En las próximas 48 horas ${esc(primerNombre(s.asesor_nombre))} te enviará tu informe con el plan de acción.`)],
        boton: { texto: "Responder la encuesta", url: linkMiReserva(aj, s.token, `&encuesta=${s.id}#encuesta`) },
      }),
    });
  }

  // 5) Recordatorio de informe al asesor
  for (const s of await detalles("informe")) {
    resumen.informes++;
    await enviarCorreo({
      tipo: "informe_pendiente", reserva_id: s.reserva_id, sesion_id: s.id, para: [s.asesor_email],
      asunto: `📄 Recuerda enviar el informe a ${s.estudiante_nombre}`,
      html: plantilla({
        aj, titulo: "Informe post-sesión pendiente", saludo: `Hola ${primerNombre(s.asesor_nombre)},`,
        bloques: [
          p(`Tu sesión con <strong>${esc(s.estudiante_nombre)}</strong> fue el ${esc(cuando(s.inicio))}. El compromiso es enviarle el informe con su plan de acción dentro de las 48 horas.`),
          caja(`Correo: ${esc(s.estudiante_email)}<br>WhatsApp: ${esc(s.estudiante_whatsapp)}`),
          p("Cuando lo envíes, márcalo en el panel (Mis sesiones → “Informe enviado”)."),
        ],
        boton: { texto: "Abrir el panel", url: `${urlSitio(aj)}/panel.html#sesiones` },
      }),
    });
  }

  return { ok: true, ...resumen };
}
