# Guía paso a paso: poner en marcha las asesorías en rumbo.org.pe

Esta guía está escrita para alguien **que no programa**. No vas a escribir código: solo vas a **copiar, pegar y hacer clic** siguiendo el orden. Cada paso termina con un **✅ Cómo saber que salió bien**. Si algo no coincide, ve a la sección [14. Solución de problemas](#14-solución-de-problemas).

> ⏱️ **Tiempo total:** 2 a 3 horas, de preferencia en computadora (no en celular).
> 💸 **Costo:** S/ 0. Ningún servicio te pedirá tarjeta.

---

## Índice

0. [Antes de empezar](#0-antes-de-empezar)
1. [Aceptar los cambios en GitHub](#paso-1-aceptar-los-cambios-en-github-10-min)
2. [Crear tu proyecto en Supabase](#paso-2-crear-tu-proyecto-en-supabase-10-min)
3. [Crear la base de datos](#paso-3-crear-la-base-de-datos-15-min)
4. [Conectar Google (Meet, Calendar y Gmail)](#paso-4-conectar-google-meet-calendar-y-gmail-3040-min)
5. [Publicar la función del servidor](#paso-5-publicar-la-función-del-servidor-15-min)
6. [Activar las tareas automáticas](#paso-6-activar-las-tareas-automáticas-5-min)
7. [Conectar la web con Supabase](#paso-7-conectar-la-web-con-supabase-10-min)
8. [Configurar el panel por primera vez](#paso-8-configurar-el-panel-por-primera-vez-20-min)
9. [Que cada integrante marque su disponibilidad](#paso-9-que-cada-integrante-marque-su-disponibilidad)
10. [Prueba general antes de anunciar](#paso-10-prueba-general-antes-de-anunciar-20-min)
11. [¡Lanzamiento!](#paso-11-lanzamiento)
12. [Mantenimiento](#12-mantenimiento)
13. [Nota legal sobre datos personales](#13-nota-legal-sobre-datos-personales)
14. [Solución de problemas](#14-solución-de-problemas)
15. [Glosario](#15-glosario)

---

## 0. Antes de empezar

### Qué vas a armar (en simple)

- **Tu web** (ya está en GitHub Pages) tendrá 3 páginas nuevas: la de **reservas**, la de **“Mi reserva”** para cada estudiante y el **panel** privado del equipo.
- **Supabase** es un servicio gratuito que guarda los datos (asesores, horarios, reservas) y ejecuta la lógica que no puede vivir en la web (por ejemplo, crear el link de Meet).
- **Google** pone el Meet, la invitación de calendario y los correos, usando el **Gmail de RUMBO**.

Si quieres entender todo el diseño, lee [01-arquitectura.md](01-arquitectura.md). No es necesario para instalar.

### Qué necesitas

| Cosa | Detalle |
|---|---|
| Tu cuenta de **GitHub** | La dueña del repositorio `juniorjulon/rumboong`. |
| El **Gmail de RUMBO** | `rumbo.transformatufuturo@gmail.com` con su contraseña (y su segundo factor, si lo tiene). Desde aquí saldrán los correos y los Meet. |
| Tu correo personal | Para tu usuario de administrador del panel. |
| Un gestor o bloc de notas | Para ir anotando las claves de la **hoja de datos** (abajo). |

> 💡 **Consejo:** abre una **ventana de incógnito** (o un perfil de navegador aparte) donde **solo** tengas iniciada la sesión del Gmail de RUMBO. Así evitas crear cosas con tu cuenta personal por error en el paso 4.

### Tu hoja de datos

Copia esta tabla en un documento privado y llénala a medida que avanzas. **No la compartas ni la subas a GitHub.**

| Dato | Dónde lo obtienes | Valor |
|---|---|---|
| Contraseña de la base de datos | Paso 2 | |
| Identificador del proyecto (`TU-PROYECTO`) | Paso 2 | |
| Project URL | Paso 7 | `https://TU-PROYECTO.supabase.co` |
| Publishable key (clave pública) | Paso 7 | `sb_publishable_…` |
| Google Client ID | Paso 4.4 | `…apps.googleusercontent.com` |
| Google Client secret | Paso 4.4 | `GOCSPX-…` |
| Google Refresh token | Paso 4.5 | `1//…` |
| CRON_SECRET (la inventas tú) | Paso 5.3 | |

### Cómo copiar un archivo desde GitHub (lo usarás varias veces)

1. Entra a <https://github.com/juniorjulon/rumboong>.
2. Navega hasta el archivo (por ejemplo `supabase` → `sql` → `01_estructura.sql`).
3. Arriba a la derecha del contenido verás un ícono de **dos cuadraditos** (*Copy raw file*). Haz clic: todo el archivo queda copiado.
4. Pégalo donde te indique la guía con `Ctrl + V` (en Mac, `Cmd + V`).

---

## Paso 1. Aceptar los cambios en GitHub (10 min)

Todo el sistema llegó a tu repositorio como un **Pull Request** (una propuesta de cambios que tú apruebas).

1. Entra a <https://github.com/juniorjulon/rumboong> → pestaña **Pull requests**.
2. Abre el que se llama **“Asesorías personalizadas: sistema de reservas…”**.
3. (Opcional) En la pestaña **Files changed** puedes ver cada archivo nuevo.
4. Baja y presiona **Merge pull request** → **Confirm merge**.
5. Espera 1 a 3 minutos a que GitHub Pages publique. Puedes verlo en la pestaña **Actions**: aparecerá *pages build and deployment* con un ✅ verde.

> ¿Es seguro aceptarlo antes de terminar? **Sí.** Mientras no completes el paso 7, la página de asesorías mostrará “Reservas en línea muy pronto” con un botón de WhatsApp. El resto de tu web sigue igual.

**✅ Cómo saber que salió bien:**
- En <https://rumbo.org.pe> aparece **“Asesorías”** en el menú y un bloque nuevo antes de “Únete a la causa”.
- <https://rumbo.org.pe/asesorias.html> abre y dice “Reservas en línea muy pronto”.
- 👀 Para ver cómo funcionará, abre <https://rumbo.org.pe/asesorias.html?demo=1> (modo demostración con datos de ejemplo; no guarda nada).

> Si ves la versión antigua de tu web, recarga sin caché: `Ctrl + F5` (en Mac, `Cmd + Shift + R`).

---

## Paso 2. Crear tu proyecto en Supabase (10 min)

1. Entra a <https://supabase.com> → **Start your project** → **Continue with GitHub** (usa tu cuenta de GitHub) y autoriza.
2. Si te pide crear una **organización**: nombre `RUMBO`, plan **Free** → **Create organization**.
3. **New project**:
   - **Project name:** `rumbo-asesorias`
   - **Database password:** presiona **Generate a password**, cópiala y guárdala en tu hoja de datos.
   - **Region:** **South America (São Paulo)**, la más cercana a Lima.
   - Deja las demás opciones como vienen.
4. **Create new project** y espera 1 a 2 minutos mientras se prepara.

**✅ Cómo saber que salió bien:** ves el panel del proyecto. Mira la barra de direcciones del navegador: `supabase.com/dashboard/project/`**`abcdxyz123`**. Ese código final es tu **identificador del proyecto** (`TU-PROYECTO`). Anótalo.

---

## Paso 3. Crear la base de datos (15 min)

### 3.1 Estructura (archivo 1)

1. En Supabase, menú izquierdo → **SQL Editor** → botón **+ New query** (o *New SQL snippet*).
2. Copia **todo** el archivo `supabase/sql/01_estructura.sql` desde GitHub (ver “Cómo copiar un archivo”) y pégalo en el editor.
3. Presiona **Run** (o `Ctrl + Enter`).
4. Si aparece un aviso de “operaciones destructivas” o *Potential issue detected*, es normal (el archivo reemplaza versiones anteriores de funciones; **no borra datos**): elige **Run this query**.

**✅** Abajo dice **Success. No rows returned**.

### 3.2 Datos iniciales (archivo 2)

1. **+ New query** otra vez.
2. Copia y pega `supabase/sql/02_datos_iniciales.sql` → **Run**.

**✅** Dice **Success**. En el menú **Table Editor** → tabla `miembros` verás a los 8 integrantes (con correos temporales `@cambiar.rumbo`; se corrigen solos en el paso 8).

> Este archivo se ejecuta **una sola vez**. Si lo corres de nuevo no duplica nada, pero no hace falta.

### 3.3 Cerrar el registro público

Nadie debe poder crearse una cuenta en el panel por su cuenta: solo tú darás accesos.

1. Menú izquierdo → **Authentication** → **Sign In / Providers** (en algunas versiones, **Providers** o **Settings**).
2. Desactiva **Allow new users to sign up** → **Save**.
3. Verifica que el proveedor **Email** siga **activado** (es el que permite entrar con correo y contraseña).

### 3.4 Crear tu usuario de administrador

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe **tu correo** y una **contraseña** segura (mínimo 8 caracteres).
3. Marca **Auto Confirm User** → **Create user**.

### 3.5 Vincular tu usuario con tu perfil de administrador

1. **SQL Editor** → **+ New query**.
2. Pega esto, **cambiando las dos veces** `TU-CORREO@gmail.com` por el correo que usaste en 3.4:

```sql
update public.miembros
   set email   = 'TU-CORREO@gmail.com',
       user_id = (select id from auth.users where email = 'TU-CORREO@gmail.com')
 where slug = 'junior-julon';

select nombre, email, user_id is not null as vinculado, es_admin
  from public.miembros where slug = 'junior-julon';
```

3. **Run**.

**✅** El resultado muestra una fila: `Junior Julón | tu correo | true | true`.

> Si `vinculado` sale `false`, el correo no coincide exactamente con el del usuario creado (revisa mayúsculas o espacios).

### 3.6 Revisar el espacio para los comprobantes

Menú **Storage**: debe existir un *bucket* llamado **`vouchers`** con el candado de **privado**. Si no aparece, créalo con **New bucket** → nombre `vouchers` → **sin** marcar *Public bucket* → **Create**.

---

## Paso 4. Conectar Google (Meet, Calendar y Gmail) (30–40 min)

Aquí le das permiso al sistema para crear salas de Meet, invitaciones de calendario y enviar correos **en nombre del Gmail de RUMBO**. Es el paso más largo. Hazlo con calma.

> ⚠️ Todo este paso se hace con la cuenta **rumbo.transformatufuturo@gmail.com**. Usa la ventana de incógnito donde solo esté esa cuenta.

### 4.1 Crear un proyecto en Google Cloud

1. Entra a <https://console.cloud.google.com> y acepta los términos si es la primera vez. **No** necesitas activar la prueba gratuita ni poner tarjeta.
2. Arriba a la izquierda, junto al logo, abre el **selector de proyectos** → **Proyecto nuevo** (*New project*).
3. Nombre: `rumbo-asesorias` → **Crear**.
4. Cuando termine, vuelve al selector y **elige** `rumbo-asesorias` (verifica que su nombre aparezca arriba).

### 4.2 Activar las 3 APIs

1. Menú ☰ → **APIs y servicios** → **Biblioteca** (*Library*).
2. Busca y abre cada una, y presiona **Habilitar** (*Enable*):
   - **Google Calendar API**
   - **Gmail API**
   - **Google Meet REST API**

**✅** En **APIs y servicios → APIs y servicios habilitados** aparecen las tres.

### 4.3 Configurar la pantalla de permisos y publicarla

1. Menú ☰ → **APIs y servicios** → **Pantalla de consentimiento de OAuth** (*OAuth consent screen*). Se abrirá **Google Auth Platform**.
2. Presiona **Comenzar** (*Get started*) y completa:
   - **Nombre de la app:** `RUMBO Reservas`
   - **Correo de asistencia:** el Gmail de RUMBO → **Siguiente**
   - **Público** (*Audience*): **Externo** (*External*) → **Siguiente**
   - **Información de contacto:** el Gmail de RUMBO → **Siguiente**
   - Acepta la política → **Continuar** → **Crear**.
3. En el menú de la izquierda entra a **Público** (*Audience*). Verás **Estado de publicación: Prueba** (*Testing*).
4. Presiona **Publicar app** (*Publish app*) → **Confirmar**. El estado debe cambiar a **En producción** (*In production*).

> ❓ **¿Por qué publicarla?** Si la dejas en “Prueba”, Google corta el permiso cada 7 días y los correos dejarían de salir. En “Producción” el permiso dura indefinidamente. **No necesitas** enviar la app a verificación: solo la usará la cuenta de RUMBO.

### 4.4 Crear las credenciales (Client ID y Client secret)

1. En el menú de la izquierda de Google Auth Platform → **Clientes** (*Clients*) → **+ Crear cliente** (*Create client*).
2. **Tipo de aplicación:** **Aplicación web** (*Web application*).
3. **Nombre:** `RUMBO servidor`.
4. En **URIs de redireccionamiento autorizados** → **+ Agregar URI** → pega exactamente:
   ```
   https://developers.google.com/oauthplayground
   ```
5. **Crear**.
6. Aparece una ventana con el **ID de cliente** y el **Secreto del cliente**. **Cópialos los dos a tu hoja de datos y presiona “Descargar JSON”** como respaldo.

> ⚠️ Google **solo muestra el secreto una vez**. Si cierras la ventana sin copiarlo, tendrás que crear otro secreto (en **Clientes** → tu cliente → **Agregar secreto**).

### 4.5 Obtener el *Refresh token* (el permiso permanente)

1. Abre <https://developers.google.com/oauthplayground> en la **misma ventana de incógnito**.
2. Arriba a la derecha, presiona el **engranaje ⚙️**:
   - Marca **Use your own OAuth credentials**.
   - Pega tu **OAuth Client ID** y tu **OAuth Client secret**.
   - Deja *Access type: Offline* y *Force prompt: Consent Screen*.
   - Cierra el cuadro.
3. A la izquierda, en **Step 1**, abajo de la lista, hay un cuadro **“Input your own scopes”**. Pega **esta línea completa** (son 3 permisos separados por espacios):
   ```
   https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/meetings.space.created
   ```
4. Presiona **Authorize APIs**.
5. Elige la cuenta **rumbo.transformatufuturo@gmail.com**.
6. Verás **“Google no verificó esta app”** (*Google hasn't verified this app*). Es normal porque la app es tuya: presiona **Configuración avanzada** (*Advanced*) → **Ir a RUMBO Reservas (no seguro)**.
7. **Marca todas las casillas** de permisos (enviar correos, ver y editar eventos, crear salas de Meet) → **Continuar**.
8. Vuelves al Playground, en **Step 2**. Presiona **Exchange authorization code for tokens**.
9. Copia el valor de **Refresh token** (empieza con `1//`) a tu hoja de datos.

**✅ Cómo saber que salió bien:** tienes en tu hoja de datos el **Client ID**, el **Client secret** y el **Refresh token**.

> Si no aparece *Refresh token*, repite desde el punto 2 verificando *Access type: Offline*. Si dice `redirect_uri_mismatch`, revisa que el URI del punto 4.4 esté escrito exactamente igual, sin espacios ni barra final.

---

## Paso 5. Publicar la función del servidor (15 min)

### 5.1 Crear la función

1. En Supabase, menú izquierdo → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Borra todo el código de ejemplo que aparece.
3. Copia **todo** el archivo `supabase/functions/rumbo-api/index.ts` desde GitHub y pégalo.
4. Abajo, en el nombre de la función, escribe exactamente: **`rumbo-api`** (en minúsculas, con guion).
5. **Deploy function** y espera unos segundos.

### 5.2 Desactivar la verificación JWT (importante)

Esta función recibe llamadas de la web pública (estudiantes sin cuenta) y del reloj interno. Ella misma revisa quién llama, así que hay que desactivar el filtro automático de Supabase:

1. Abre la función `rumbo-api` → pestaña **Details** (*Detalles*).
2. Busca el interruptor **Verify JWT** (puede decir *Enforce JWT verification* o *Verify JWT with legacy secret*) y **apágalo**.
3. **Save changes**.

### 5.3 Guardar las claves secretas

1. Menú **Edge Functions** → **Secrets** (*Edge Function Secrets*).
2. Agrega estas 5 (botón **Add another** para cada una) y al final **Save**:

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | tu Client ID (paso 4.4) |
| `GOOGLE_CLIENT_SECRET` | tu Client secret (paso 4.4) |
| `GOOGLE_REFRESH_TOKEN` | tu Refresh token (paso 4.5) |
| `GOOGLE_EMAIL` | `rumbo.transformatufuturo@gmail.com` |
| `CRON_SECRET` | una clave larga que **inventes tú**: 30 o más letras y números, **sin espacios ni comillas** (puedes usar un generador de contraseñas). Anótala: la usarás en el paso 6. |

### 5.4 Probar que responde

Abre en tu navegador (cambia `TU-PROYECTO`):

```
https://TU-PROYECTO.supabase.co/functions/v1/rumbo-api
```

**✅** Debe mostrar algo como `{"ok":true,"servicio":"rumbo-api","hora":"…"}`.

> Si dice *Missing authorization header* o *Invalid JWT*, el interruptor del 5.2 sigue encendido.

---

## Paso 6. Activar las tareas automáticas (5 min)

Esto programa al “reloj interno” para que cada 10 minutos venza las reservas no pagadas y envíe los recordatorios.

1. Copia `supabase/sql/03_automatizaciones.sql` desde GitHub y pégalo en un **+ New query** del SQL Editor.
2. **Antes de ejecutar**, reemplaza en el texto:
   - `TU-PROYECTO` → tu identificador del proyecto (paso 2);
   - `TU-CLAVE-SECRETA` → el mismo `CRON_SECRET` del paso 5.3.
3. **Run**.

**✅ Cómo saber que salió bien:** en un **New query** ejecuta:

```sql
select jobname, schedule, active from cron.job;
```

Debe listar `rumbo-tareas | */10 * * * * | true` (y `rumbo-limpieza`). Espera 10 minutos y ejecuta:

```sql
select status_code, content, created from net._http_response order by created desc limit 5;
```

Debe mostrar `200` y un texto como `{"ok":true,"expiradas":0,"r24":0,…}`: eso confirma que el reloj llegó a la función y la clave coincide.

> Si al ejecutar el archivo aparece un error sobre `pg_cron` o `pg_net`, actívalos desde **Integrations** → **Cron** (*Enable*) y vuelve a ejecutar el archivo.

---

## Paso 7. Conectar la web con Supabase (10 min)

### 7.1 Copiar la URL y la clave pública

1. En Supabase → **Project Settings** (engranaje, abajo a la izquierda) → **API Keys**.
2. Copia la **Publishable key** (empieza con `sb_publishable_`).
   - Si no la ves, en la pestaña **Legacy API keys** copia la **anon public** (empieza con `eyJ`).
   - ⚠️ **Nunca** copies la *secret* ni la *service_role*.
3. Tu **Project URL** es `https://TU-PROYECTO.supabase.co` (también la ves en **Project Settings → Data API**).

### 7.2 Pegarlas en tu web

1. En GitHub, abre el archivo **`js/rumbo-config.js`**.
2. Presiona el **lápiz ✏️** (*Edit this file*).
3. Completa las comillas vacías así (con tus datos):

```js
window.RUMBO_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseKey: 'sb_publishable_xxxxxxxxxxxxxxxxxxxx',
  whatsapp: '51987654321'
};
```

   - `whatsapp`: el número de RUMBO con **51** adelante, sin `+` ni espacios.
4. **Commit changes…** → deja marcada *Commit directly to the main branch* → **Commit changes**.
5. Espera 1 a 3 minutos (pestaña **Actions** con ✅).

> Es seguro que estas dos claves estén en GitHub: son públicas por diseño. La seguridad la ponen los permisos de la base de datos.

### 7.3 Dirección del sitio en Supabase

**Authentication** → **URL Configuration** → **Site URL**: `https://rumbo.org.pe` → **Save**.

**✅ Cómo saber que salió bien:** abre <https://rumbo.org.pe/asesorias.html> (con `Ctrl + F5`). Ya no dice “muy pronto”: aparecen los temas y, en el paso 2 del formulario, los 8 asesores (con “Sin horarios” hasta que marquen su disponibilidad).

---

## Paso 8. Configurar el panel por primera vez (20 min)

Entra a <https://rumbo.org.pe/panel.html> con el correo y la contraseña del paso 3.4.

### 8.1 Ajustes

Menú **Ajustes** y completa:

- **Pagos:** número de **Yape**, de **Plin**, **titular** y la imagen del **QR**. Por defecto usa `assets/qr-donacion.jpg`; si tienes otro QR, súbelo a la carpeta `assets` en GitHub y escribe su ruta.
- **Contacto y avisos:** WhatsApp de RUMBO y los **correos que reciben el aviso de “voucher por verificar”** (por ejemplo, quien verifique pagos). Si lo dejas vacío, se avisa a todos los coordinadores.
- Revisa **Precios** (S/ 20 y S/ 50) y **Reglas** (48 h, 30 días, 24 h para pagar, 1 reprogramación).
- **Guardar ajustes**.

### 8.2 Probar la conexión con Google

Al final de **Ajustes** → **Probar conexión**. Debes ver:

- ✅ Conectado a Google
- ✅ Salas de Meet abiertas disponibles
- ✅ Correo de prueba enviado a tu correo

Revisa tu bandeja (y **Spam**; si cayó ahí, márcalo como “No es spam” para que los siguientes lleguen bien).

> Si alguna línea sale con ❌ o ⚠️, mira la sección 14.

### 8.3 Dar acceso a cada integrante

Menú **Equipo**. Para cada persona:

1. **Editar** → en *Roles y cuenta*, escribe su **correo real** (el que usa a diario; ahí recibirá las invitaciones de Calendar).
2. Revisa sus **roles**. Por defecto: Junior = administrador + coordinador; Sheyla, Breinner y María = coordinadores; todos son asesores. Cámbialos si quieren otra distribución.
3. Revisa sus **temas** (para las recomendaciones y “RUMBO elige”) y su **cupo mensual** (2 en el Mes 1).
4. **Guardar**.
5. Vuelve a **Editar** → **Crear acceso al panel** → confirma el correo y la contraseña sugerida → **Crear acceso**.
6. Aparece un cuadro con el enlace, correo y contraseña: **envíaselo por WhatsApp privado**. Pídele que la cambie en **Mi cuenta**.

**✅** En la lista de Equipo, cada persona muestra **“✓ puede entrar”** y su correo real.

---

## Paso 9. Que cada integrante marque su disponibilidad

Cada asesor entra a <https://rumbo.org.pe/panel.html> y:

1. **Mi cuenta** → cambia su contraseña.
2. **Disponibilidad** → en **1 · Horario fijo semanal** toca las horas en que puede atender (se ponen verdes ✓). Se guarda solo.
3. Si una semana no puede, usa **2 · Cambios para una semana específica**. Para viajes o exámenes, **3 · Bloquear varios días**.

Comparte con ellos el [manual del equipo](03-manual-del-equipo.md).

**✅** En **Inicio** del panel (como coordinador), la tabla “Cupos y disponibilidad del equipo” ya no dice “sin horario”. En la web, cada asesor muestra “Desde [fecha]”.

---

## Paso 10. Prueba general antes de anunciar (20 min)

Hazla desde tu celular, como si fueras estudiante, con un **correo personal distinto** al de tu usuario del panel.

1. <https://rumbo.org.pe/asesorias.html> → elige tema, plan, asesor y un horario → completa tus datos → **Apartar mi horario**.
   - ✅ Te llega el correo “Tu reserva … está apartada — falta el pago”.
2. Sube **cualquier captura** como comprobante.
   - ✅ Te llega “Recibimos tu comprobante” y a coordinación “💸 Voucher por verificar”.
3. En el panel → **Reservas y pagos** → **Por verificar** → abre la reserva → **Ver comprobante** → **Pago verificado**.
   - ✅ Te llegan la confirmación y la **invitación de Google Calendar**. Al asesor, “📅 Nueva asesoría”.
   - ✅ El link de Meet abre la sala **sin pedir que te admitan**.
4. Abre **“Ver mi reserva”** desde el correo → completa el **diagnóstico** → prueba **Reprogramar**.
   - ✅ Llega el correo de reprogramación y el evento del calendario cambia de hora.
5. Prueba una **beca**: panel → **Cupones y becas** → **Registrar donante** (“Prueba”) → **Generar códigos de beca** (1) → reserva con ese código.
   - ✅ La reserva queda confirmada al instante, sin pago.
6. **Limpia las pruebas:** en el panel abre cada reserva de prueba → **Cancelar reserva** (desmarca “Avisar por correo” si quieres). Los horarios se liberan. Desactiva el código de beca de prueba.

---

## Paso 11. ¡Lanzamiento!

- Comparte el enlace **<https://rumbo.org.pe/asesorias.html>** en la bio de Instagram y TikTok, y en la comunidad de WhatsApp.
- Puedes enlazar directo a un asesor: `https://rumbo.org.pe/asesorias.html?asesor=junior-julon` (usa el *slug* de cada persona) o a un tema: `?tema=becas`.
- Para promociones crea cupones en **Cupones y becas** (por ejemplo `LANZAMIENTO`, S/ 5 de descuento, 5 usos).

> Si cambias el precio en **Ajustes**, recuerda actualizar también el texto fijo “Desde S/ 20” del bloque de la página de inicio (`index.html`, sección `id="asesorias"`).

---

## 12. Mantenimiento

### Rutina

| Quién | Cada cuánto | Qué |
|---|---|---|
| Coordinación de pagos | Diario | **Reservas y pagos → Por verificar** (también llega un correo por cada voucher). |
| Cada asesor | Después de cada sesión | **Mis sesiones**: “Realizada” y, al enviar el informe, “Informe enviado”. |
| Cada asesor | Cuando cambie su agenda | **Disponibilidad**. |
| Coordinación general | Mensual | **Inicio**: ingresos, sesiones, satisfacción. **Exportar CSV** de reservas como respaldo. Revisar **Correos** por errores. Ajustar **cupos** (por ejemplo, de 2 a 4 desde el Mes 2). |

### Si el proyecto de Supabase se pausa

El plan gratuito pausa proyectos que pasan 7 días sin actividad. El sistema lo evita solo (tareas cada 10 min y el “despertador” de GitHub cada 2 días), pero si alguna vez pasara: entra a Supabase → tu proyecto → **Restore project**. **No se pierde ningún dato.**

GitHub desactiva los flujos programados si el repositorio pasa 60 días sin cambios. Si recibes ese aviso: pestaña **Actions** → **Mantener Supabase activo** → **Enable workflow**.

### Si cambias la contraseña del Gmail de RUMBO

Google anula el permiso del paso 4.5 y **dejarán de salir correos y Meet** (en **Correos** verás el error `invalid_grant`). Solución: repite el **paso 4.5** para obtener un nuevo *Refresh token* y reemplázalo en **Edge Functions → Secrets → `GOOGLE_REFRESH_TOKEN`**. Después, en **Ajustes**, usa **Probar conexión**.

### Actualizar el sistema en el futuro

- **Función:** abre `rumbo-api` en Supabase → pega el código nuevo → **Deploy**. La configuración del 5.2 y los Secrets se mantienen.
- **Base de datos:** vuelve a ejecutar la versión nueva de `01_estructura.sql`. Es seguro: no borra datos.
- **Páginas:** se actualizan solas al aceptar cambios en GitHub. Si cambias `css/styles.css` o `js/main.js`, sube el número `?v=` en `index.html` (ver `DESIGN-SYSTEM.md`).

### Respaldos

Supabase Free no incluye copias descargables automáticas. Una vez al mes, exporta **Reservas y pagos → Exportar CSV** (pestaña “Todas”) y, en Supabase → **Table Editor**, exporta como CSV las tablas `reservas`, `sesiones`, `miembros` y `cupones`. Guárdalo en el Drive de RUMBO.

---

## 13. Nota legal sobre datos personales

> No soy abogado; esto es información para que tomen una decisión informada.

- El sistema pide **consentimiento explícito** (casilla obligatoria) y, para menores de 18, **los datos y la autorización del apoderado**. La política está en `privacidad.html`: revísenla y ajústenla si hace falta (contacto, plazos de conservación).
- La **Ley N.° 29733** exige, entre otras cosas, inscribir los bancos de datos personales ante la **Autoridad Nacional de Protección de Datos Personales**. Como RUMBO está en proceso de formalización, consulten con un abogado o con la propia Autoridad cuándo y cómo inscribir el banco “Estudiantes de asesorías”.
- Atiendan los pedidos de **acceso, rectificación, cancelación u oposición** que lleguen al correo de RUMBO. Para borrar a alguien, coordinación puede cancelar sus reservas y luego eliminar la fila en Supabase → **Table Editor → reservas**.

---

## 14. Solución de problemas

| Qué ves | Causa probable | Qué hacer |
|---|---|---|
| La web sigue diciendo “Reservas en línea muy pronto” | `js/rumbo-config.js` vacío, con un error de comillas o caché del navegador | Revisa el paso 7.2 (comillas simples `'…'` y comas). Recarga con `Ctrl + F5`. |
| “No pudimos cargar los horarios” | URL o clave mal copiadas, o el proyecto está pausado | Revisa el 7.1. En Supabase, mira si el proyecto dice *Paused* → **Restore**. |
| Los asesores dicen “Sin horarios” | No marcaron disponibilidad, llenaron su cupo o los horarios están a menos de 48 h | Paso 9. Revisa los cupos en **Equipo**. |
| Al reservar: “Ese horario acaba de ser tomado” | Otra persona lo reservó segundos antes | Es el sistema evitando dobles reservas. Elegir otro horario. |
| La función responde *Missing authorization header* o *Invalid JWT* | La verificación JWT sigue activa | Paso 5.2. |
| La reserva se crea, pero no llegan correos | Faltan los Secrets de Google o el token caducó | **Ajustes → Probar conexión** y **Correos** (verás el motivo). Revisa el 5.3. Si dice `invalid_grant`: repite el 4.5. |
| `invalid_grant` en Correos | Cambiaste la contraseña del Gmail, revocaste el acceso o la app quedó en “Prueba” | Verifica que la app esté **En producción** (4.3) y repite el 4.5. |
| `access_not_configured` o “API has not been used” | Falta activar una API | Paso 4.2 (las tres APIs). |
| Prueba de conexión: “⚠️ La API de Meet no está disponible” | No activaste **Google Meet REST API** o falta el permiso `meetings.space.created` | Actívala (4.2) y repite el 4.5 con los 3 permisos. Mientras tanto se usa el Meet del calendario. |
| Al confirmar el pago: “no se pudo crear el Meet” | Fallo temporal de Google | En la reserva → **Reintentar Meet**. |
| Los correos caen en Spam | Gmail nuevo o pocas interacciones | Pide a los primeros estudiantes marcarlos como “No es spam”. Agrega el correo de RUMBO a contactos. |
| Un integrante no puede entrar al panel | Contraseña errónea o acceso no creado | Administrador → **Equipo → Editar → Cambiar contraseña / Crear acceso**. |
| “Tu usuario no está vinculado…” | El usuario existe pero no está unido al perfil | Administrador → **Equipo → Editar → Crear acceso** con ese mismo correo. Para tu propio usuario: paso 3.5. |
| No llegan recordatorios | La tarea automática no corre o no llega a la función | Paso 6: ejecuta la consulta de `net._http_response`. Si muestra `401`, la clave `TU-CLAVE-SECRETA` del archivo 3 no coincide con `CRON_SECRET`: corrige el archivo y vuelve a ejecutarlo. Si muestra `404`, revisa `TU-PROYECTO` y que la función se llame `rumbo-api`. |
| El estudiante no encuentra el correo con su enlace | Spam o correo mal escrito | Coordinación abre la reserva → **Abrir “Mi reserva”** y le envía ese enlace por WhatsApp, o **Reenviar confirmación**. |

Si nada de esto lo resuelve, revisa **Supabase → Edge Functions → rumbo-api → Logs**: allí aparece el detalle técnico de cada error.

---

## 15. Glosario

- **Supabase:** servicio en internet que guarda la base de datos y ejecuta la función del servidor. Plan gratuito.
- **Base de datos:** donde se guardan, ordenados en tablas, los asesores, horarios, reservas, etc.
- **SQL / SQL Editor:** el lenguaje y la pantalla de Supabase donde pegas los archivos `.sql` para crear la base de datos.
- **Función del servidor (Edge Function):** un programa que vive en Supabase y hace lo que la web no puede hacer sola (crear el Meet, enviar correos, validar pagos).
- **Secrets:** claves privadas guardadas en Supabase que la web nunca ve.
- **Publishable key / anon key:** clave **pública** que permite a la web leer lo que los permisos autorizan. Puede estar en GitHub.
- **RLS (Row Level Security):** reglas de la base de datos que deciden qué filas puede ver o cambiar cada persona según su rol.
- **OAuth / Refresh token:** el permiso que el Gmail de RUMBO le da al sistema para crear Meet y enviar correos sin compartir la contraseña.
- **Cron:** reloj que ejecuta tareas automáticamente (aquí, cada 10 minutos).
- **Pull Request:** propuesta de cambios en GitHub que se acepta con **Merge**.
- **Slug:** identificador sin espacios ni tildes (por ejemplo, `junior-julon`) que se usa en enlaces.
