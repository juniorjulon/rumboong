# Asesorías Personalizadas — Propuesta de gestión de reservas

> Documento de decisión para el equipo Rumbo. El prototipo visual vive en
> `Sección Asesorías Personalizadas.html`. Hoy la disponibilidad es de ejemplo
> (hardcodeada en el arreglo `ASESORES` del script); este documento propone cómo
> convertirla en un sistema real, robusto y sistemático usando un Excel como input.

---

## 1. El problema a resolver

El sitio es **estático** (GitHub Pages), no hay servidor ni base de datos. Necesitamos:

1. Que cada asesor registre sus fechas/horas disponibles en un lugar simple (Excel).
2. Que la web muestre esa disponibilidad actualizada sin re-publicar el sitio.
3. Que una reserva bloquee el cupo y notifique al asesor y al estudiante.
4. Que nada dependa de que una sola persona "actualice la página a mano".

## 2. Arquitectura recomendada: Google Sheets como backend

**Un solo Google Sheet compartido con el equipo**, con dos hojas:

### Hoja `Disponibilidad` (la llenan los asesores)

| asesor_id | fecha | hora_inicio | hora_fin | estado |
|---|---|---|---|---|
| junior-julon | 2026-07-18 | 18:00 | 19:00 | LIBRE |
| sheyla-campos | 2026-07-19 | 10:00 | 11:00 | RESERVADO |

- `asesor_id` usa los mismos ids del arreglo `ASESORES` del HTML (`junior-julon`, `sheyla-campos`, etc.) — ese es el contrato entre el Excel y la web.
- `estado`: `LIBRE` / `RESERVADO` / `BLOQUEADO`.
- Validación de datos en la columna `estado` (lista desplegable) para evitar errores de tipeo.

### Hoja `Reservas` (la escribe el sistema)

| timestamp | estudiante | email | tema | asesor_id | fecha | plan | estado_pago |
|---|---|---|---|---|---|---|---|

### Cómo lo lee la web

Publicar la hoja `Disponibilidad` como CSV (`Archivo → Compartir → Publicar en la web → CSV`) y en el HTML reemplazar los datos demo por un `fetch()` a esa URL al cargar la página. Con eso:

- La web **siempre muestra la disponibilidad vigente**, sin commits ni deploys.
- El equipo edita desde el celular; el Sheet es el "Excel" que pidieron como input.
- Si el fetch falla (sin internet, Sheet caído), la web degrada a "consulta disponibilidad por WhatsApp" — nunca se rompe.

### Cómo se registra una reserva

Dos niveles, de menor a mayor automatización:

- **Nivel 1 (hoy mismo):** el botón de WhatsApp ya manda un mensaje pre-redactado con nombre, tema, asesor y plan. Un coordinador marca el slot como `RESERVADO` en el Sheet y anota la fila en `Reservas`. Simple, pero manual.
- **Nivel 2 (recomendado):** un **Google Apps Script** desplegado como Web App recibe el formulario de la web (POST), valida que el slot siga `LIBRE`, lo marca `RESERVADO`, agrega la fila en `Reservas`, crea el evento de Google Calendar con link de Meet e invita a asesor + estudiante, y envía email de confirmación. Todo dentro del ecosistema Google gratuito, sin servidores propios.

### Reglas de robustez

- El cupo mensual (hoy 4 sesiones/asesor) se **calcula** contando filas `RESERVADO` del mes — no se edita a mano.
- El Apps Script revalida el estado del slot antes de confirmar (evita doble reserva).
- Pago (Yape/Plin): la reserva queda `PENDIENTE_PAGO` hasta que un coordinador verifica el voucher; si no llega en 24 h, el slot vuelve a `LIBRE`.
- Respaldo semanal: descargar el Sheet como `.xlsx` a Drive (automatizable con el mismo Apps Script).

## 3. Alternativa sin Google: Excel en el repositorio

Si prefieren un `.xlsx`/`.csv` versionado en Git (`assets/data/disponibilidad.csv`), la web lo lee con `fetch()`. Contra: **cada cambio de agenda requiere commit + push** y esperar el deploy de Pages (+ el problema de caché documentado en `DESIGN-SYSTEM.md`). Solo recomendable si la disponibilidad cambia poco (p. ej. se fija una vez al mes).

## 4. Pendientes antes de publicar la sección

- [ ] Reemplazar `WHATSAPP_NUMERO` (placeholder `51999999999`) en el HTML.
- [ ] Confirmar montos en `PRECIOS` (hoy tentativos: individual S/ 20–25, pack S/ 50) y el cupo `CUPO_MENSUAL = 4`.
- [ ] Validar con cada líder sus especialidades (`tags`/`temas` en el arreglo `ASESORES`).
- [ ] Decidir Google Sheets vs. Excel en repo y conectar el `fetch()`.
- [ ] Integrar la página al sitio (renombrar a `asesorias.html` sin espacios/tildes para URL limpia, y enlazarla desde el navbar de `index.html`).
