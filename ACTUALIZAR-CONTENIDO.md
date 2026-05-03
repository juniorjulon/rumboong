# Guía para actualizar el contenido del sitio RUMBO

> **Nivel requerido:** conocimientos muy básicos de HTML.
> Solo necesitas editar el archivo `index.html` (y subir las fotos a la carpeta correcta).
> Después de cada cambio, guarda el archivo y abre la página en tu navegador para verificar.

---

## Índice

1. [Actividades](#1-actividades)
2. [Equipo](#2-equipo)
3. [FAQ (Preguntas frecuentes)](#3-faq-preguntas-frecuentes)
4. [Botón de WhatsApp (Navbar)](#4-botón-de-whatsapp-navbar)
5. [Formulario de contacto](#5-formulario-de-contacto)

---

## 1. Actividades

### 1a. Agregar una nueva actividad

**Paso 1 — Sube las fotos**
Copia las fotos de la nueva actividad a la carpeta:
```
assets/actividades/
```
Usa nombres sin espacios ni tildes, por ejemplo:
- `colegio-san-martin-1.jpg`
- `colegio-san-martin-2.jpg`

---

**Paso 2 — Abre `index.html`**
Busca (Ctrl + F) el siguiente texto:
```
PLANTILLA para más actividades
```

---

**Paso 3 — Copia y pega el bloque**
Verás un bloque de código comentado (entre `<!--` y `-->`). Cópialo completo y pégalo **justo antes** del `<!--` que lo inicia, es decir, fuera del comentario.

El bloque que debes copiar y pegar es este (después de quitarle los comentarios internos):

```html
<div class="activity-slide">
  <div class="activity-card">
    <div class="mini-photos">
      <img src="assets/actividades/nombre-colegio-1.jpg" alt="Taller en Nombre del Colegio">
      <img src="assets/actividades/nombre-colegio-2.jpg" alt="Taller en Nombre del Colegio">
    </div>
    <div class="activity-body">
      <h3>Nombre del colegio</h3>
      <p class="workshop">Nombre del taller</p>
      <div class="activity-meta">
        <span>📅 Mes 2025</span>
        <span>👥 XX estudiantes</span>
      </div>
      <div class="activity-quote">"Testimonio del estudiante o docente."</div>
    </div>
  </div>
</div>
```

---

**Paso 4 — Rellena los datos**
Reemplaza cada campo con la información real:

| Lo que ves en el código | Qué debes poner |
|---|---|
| `nombre-colegio-1.jpg` | Nombre real del archivo de foto |
| `Nombre del Colegio` | Nombre real del colegio (en el `alt=`) |
| `Nombre del colegio` | Nombre real del colegio (en el `<h3>`) |
| `Nombre del taller` | Ej: `Orientación vocacional` |
| `Mes 2025` | Ej: `Abril 2025` |
| `XX estudiantes` | Ej: `45 estudiantes` |
| `Testimonio...` | Frase real de un estudiante o docente |

---

**¿Cuántas fotos puedo poner?**
Tantas como quieras. Cada `<img>` dentro de `<div class="mini-photos">` es una foto del mini-carrusel. Si solo pones una, no aparecerán los puntos de navegación.

```html
<div class="mini-photos">
  <img src="assets/actividades/foto1.jpg" alt="...">
  <img src="assets/actividades/foto2.jpg" alt="...">
  <img src="assets/actividades/foto3.jpg" alt="...">
  <!-- puedes seguir agregando -->
</div>
```

---

### 1b. Editar una actividad existente

Busca (Ctrl + F) el nombre del colegio que quieres editar. Modifica solo el campo que necesitas cambiar.

---

### 1c. Eliminar una actividad

Elimina todo el bloque que empieza con `<div class="activity-slide">` y termina con el `</div>` correspondiente (son 4 niveles de cierre al final).

---

### 1d. Switch de auto-avance

El switch que aparece sobre el carrusel de actividades enciende o apaga el avance automático de fotos dentro de cada tarjeta. No necesitas editar código para usarlo — simplemente haz clic en él en la página.

- **Apagado por defecto** (el slider está a la izquierda).
- Si quieres que esté **encendido por defecto**, busca esta línea en `index.html`:
  ```html
  <input type="checkbox" id="autoplay-toggle">
  ```
  Y cámbiala por:
  ```html
  <input type="checkbox" id="autoplay-toggle" checked>
  ```

---

## 2. Equipo

### 2a. Agregar un nuevo miembro

**Paso 1 — Sube la foto**
Copia la foto a:
```
assets/team/
```
Nombra el archivo como `nombre-apellido.jpg`, ej: `ana-garcia.jpg`.
La foto debe ser cuadrada o casi cuadrada (funciona mejor a 400×400 px o más).

---

**Paso 2 — Busca en `index.html`**
Busca el texto:
```
EQUIPO — Carrusel
```

---

**Paso 3 — Copia un bloque existente**
Copia uno de los bloques de miembro existentes. Tiene este aspecto:

```html
<div class="team-slide"><div class="team-card">
  <div class="team-avatar"><img draggable="false" oncontextmenu="return false" src="assets/team/nombre-apellido.jpg" alt="Nombre Apellido"></div>
  <h3>Nombre Apellido</h3>
  <p class="role">Cargo en RUMBO</p>
  <p class="org">Carrera (Universidad)<br>Puesto en Empresa</p>
  <a href="https://www.linkedin.com/in/perfil" class="linkedin-link" target="_blank" rel="noopener noreferrer">🔗 LinkedIn</a>
</div></div>
```

Pégalo dentro del `<div class="carousel-track" id="team-track">`, antes del `</div>` que lo cierra.

---

**Paso 4 — Rellena los datos**

| Campo | Qué poner |
|---|---|
| `nombre-apellido.jpg` | Nombre real del archivo de foto |
| `alt="Nombre Apellido"` | Nombre completo de la persona |
| `<h3>Nombre Apellido</h3>` | Nombre completo |
| `Cargo en RUMBO` | Ej: `Líder de Comunicaciones` |
| `Carrera (Universidad)` | Ej: `Ingeniera Empresarial (UP)` |
| `Puesto en Empresa` | Ej: `Analista en Banco BCP` |
| `href="https://..."` | URL real del perfil de LinkedIn |

Si la persona no tiene LinkedIn, elimina toda la línea `<a href=...>`.

---

### 2b. Editar un miembro existente

Busca (Ctrl + F) el nombre de la persona. Modifica solo el campo necesario.

---

### 2c. Eliminar un miembro

Elimina el bloque completo desde `<div class="team-slide">` hasta su `</div></div>` de cierre.

---

## 3. FAQ (Preguntas frecuentes)

El FAQ está dividido en 3 grupos:
- `colegios` → "Colegios y padres"
- `aliados` → "Aliados y donantes"
- `estudiantes` → "Estudiantes"

### 3a. Agregar una pregunta

Busca (Ctrl + F) el nombre del grupo al que quieres agregar la pregunta, por ejemplo:
```
GRUPO: Colegios y padres
```

Dentro de ese bloque, copia una pregunta existente:

```html
<div class="faq-item">
  <button class="faq-btn" onclick="toggleFAQ(this)">
    ¿La pregunta va aquí?<span class="arrow">▾</span>
  </button>
  <div class="faq-answer">
    <p>La respuesta va aquí.</p>
  </div>
</div>
```

Pégala antes del `</div>` que cierra el grupo y rellena la pregunta y respuesta.

---

### 3b. Editar una pregunta o respuesta existente

Busca (Ctrl + F) una palabra clave de la pregunta. Localiza el texto y edítalo directamente.

---

### 3c. Eliminar una pregunta

Elimina el bloque completo desde `<div class="faq-item">` hasta su `</div>` de cierre.

---

### 3d. Cambiar el nombre de un grupo (la etiqueta del botón)

Busca:
```
faqFilter('colegios',this)
```
El texto que verás al lado es el nombre del botón, por ejemplo `🏫 Colegios y padres`. Cámbialo directamente.

---

## 4. Botón de WhatsApp (Navbar)

Busca (Ctrl + F):
```
Únete a la comunidad
```

Encontrarás esta línea (aparece dos veces: una en el menú de escritorio y otra en el menú móvil):
```html
<a href="https://chat.whatsapp.com/KsVmqItYyRJ4pqZ1NrZdtC"
```

Reemplaza la URL con el nuevo link de WhatsApp.

---

## 5. Formulario de contacto

El formulario envía mensajes al correo `rumbo.transformatufuturo@gmail.com`.

Para activarlo completamente (sin que abra el cliente de correo del visitante):

1. Ve a [formspree.io](https://formspree.io) y crea una cuenta gratuita.
2. Crea un nuevo formulario y usa `rumbo.transformatufuturo@gmail.com` como destino.
3. Copia el ID que te dan (tiene este aspecto: `xpzgkwrj`).
4. En `index.html`, busca:
   ```
   action="https://formspree.io/f/XXXXXXXX"
   ```
   Y reemplaza `XXXXXXXX` con tu ID real.

---

## Consejos generales

- **Guarda siempre antes de verificar** — Ctrl + S en el editor, luego recarga la página (Ctrl + Shift + R) en el navegador.
- **Si algo se rompe**, usa Ctrl + Z en el editor para deshacer los últimos cambios.
- **Nombres de archivos**: usa solo letras minúsculas, números y guiones. Sin espacios, sin tildes, sin ñ. Ejemplo: `colegio-san-jose-1.jpg` ✔ — `Colegio San José (1).JPG` ✗
- **Tamaño de fotos**: para las actividades, recorta las fotos a proporción 16:9 (landscape). Para el equipo, usa fotos cuadradas.
