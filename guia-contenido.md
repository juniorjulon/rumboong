# guía de contenido — rumbo

> cómo actualizar las secciones del sitio web sin romper nada.
> solo necesitas editar `index.html` y subir fotos a la carpeta correcta.

---

## índice

1. [actividades](#1-actividades)
2. [equipo](#2-equipo)
3. [faq](#3-faq)
4. [link de whatsapp](#4-link-de-whatsapp)
5. [formulario de contacto](#5-formulario-de-contacto)
6. [auto-avance de fotos](#6-auto-avance-de-fotos)

---

## 1. actividades

### agregar una nueva actividad

**paso 1 — sube las fotos**

copia las fotos a `assets/actividades/`. usa el formato:
```
actividad3-nombre-del-evento-1.jpg
actividad3-nombre-del-evento-2.jpg
```
reglas: solo minúsculas, guiones en vez de espacios, sin tildes ni ñ.

**paso 2 — abre `index.html` y busca** (ctrl + f):
```
activity-slide
```
copia un bloque completo — desde `<div class="activity-slide">` hasta su `</div>` de cierre — y pégalo justo después del último.

**paso 3 — rellena el bloque copiado:**

```html
<div class="activity-slide">
  <div class="act-card">
    <div class="mini-photos">
      <img src="assets/actividades/actividad3-nombre-1.jpg" alt="Descripción del evento">
      <img src="assets/actividades/actividad3-nombre-2.jpg" alt="Descripción del evento">
    </div>
    <div class="act-body">
      <span class="act-tag">Nombre del taller</span>
      <h3>Nombre del colegio o evento</h3>
      <div class="act-meta">
        <span>📅 Mes 2025</span>
        <span>👥 XX estudiantes</span>
      </div>
      <p class="act-quote">"Testimonio real de un estudiante o docente."</p>
    </div>
  </div>
</div>
```

| campo | qué poner |
|---|---|
| `actividad3-nombre-1.jpg` | nombre real del archivo de foto |
| `alt="..."` | descripción breve del evento |
| `act-tag` | nombre del taller, ej: `Orientación vocacional` |
| `<h3>` | nombre del colegio o evento |
| `📅 Mes 2025` | fecha real, ej: `Marzo 2026` |
| `👥 XX estudiantes` | número real |
| `act-quote` | testimonio entre comillas |

**fotos:** puedes poner tantas `<img>` como quieras dentro de `.mini-photos`. si hay más de una, aparecen los puntos de navegación automáticamente.

### editar una actividad existente

busca (ctrl + f) el nombre del colegio. edita el campo que necesitas.

### eliminar una actividad

elimina el bloque completo desde `<div class="activity-slide">` hasta su `</div>` de cierre.

---

## 2. equipo

### agregar un miembro

**paso 1 — sube la foto** a `assets/team/nombre-apellido.jpg`. debe ser cuadrada (400×400 px o más).

**paso 2 — busca** `team-track` en `index.html`. copia un bloque de miembro existente y pégalo antes del `</div>` que cierra el carrusel:

```html
<div class="team-slide"><div class="team-card">
  <div class="team-avatar"><img draggable="false" oncontextmenu="return false" src="assets/team/nombre-apellido.jpg" alt="Nombre Apellido"></div>
  <h3>Nombre Apellido</h3>
  <p class="role">Cargo en RUMBO</p>
  <p class="org">Carrera (Universidad)<br>Puesto en Empresa</p>
  <a href="https://www.linkedin.com/in/perfil" class="linkedin-link" target="_blank" rel="noopener noreferrer">🔗 LinkedIn</a>
</div></div>
```

si la persona no tiene linkedin, elimina la línea `<a href=...>`.

### editar un miembro existente

busca el nombre de la persona y modifica el campo necesario.

### eliminar un miembro

elimina el bloque desde `<div class="team-slide">` hasta su `</div></div>` de cierre.

---

## 3. faq

el faq tiene 3 grupos: `colegios`, `aliados`, `estudiantes`.

### agregar una pregunta

busca el grupo donde quieres agregarla, ej: `data-group="colegios"`. dentro de ese bloque, copia cualquier pregunta existente y pégala antes del `</div>` de cierre del grupo:

```html
<details class="faq-item">
  <summary>¿La pregunta va aquí?</summary>
  <div class="faq-item-body"><p>La respuesta va aquí.</p></div>
</details>
```

### editar una pregunta o respuesta

busca el texto de la pregunta y edítalo directamente.

### eliminar una pregunta

elimina el bloque `<details class="faq-item">...</details>` completo.

---

## 4. link de whatsapp

busca `chat.whatsapp.com` en `index.html`. aparece en el navbar. reemplaza la url completa con el nuevo enlace.

---

## 5. formulario de contacto

el formulario ya está configurado con formspree (`xaqlrnae`). si necesitas cambiarlo:

1. ve a [formspree.io](https://formspree.io) y crea un nuevo formulario con `rumbo.transformatufuturo@gmail.com`
2. copia el id que te dan (ej: `xyzabc12`)
3. busca `formspree.io/f/` en `index.html` y reemplaza el id

---

## 6. auto-avance de fotos

controla si las fotos del mini-carrusel avanzan solas en la sección de actividades.

busca `data-autoplay` en `index.html`:
```html
data-autoplay="true" data-autoplay-ms="3000"
```

| valor | efecto |
|---|---|
| `data-autoplay="true"` | avance automático activado |
| `data-autoplay="false"` | desactivado |
| `data-autoplay-ms="3000"` | velocidad en milisegundos (3000 = 3 segundos) |

---

## consejos generales

- **guardar y verificar:** ctrl + s en el editor, luego ctrl + shift + r en el navegador
- **si algo se rompe:** ctrl + z para deshacer
- **nombres de archivos:** solo minúsculas, guiones, sin espacios ni tildes — `colegio-san-jose-1.jpg` ✔ — `Colegio San José (1).JPG` ✗
- **fotos de actividades:** proporción 16:9 (landscape)
- **fotos de equipo:** cuadradas
- **cambios que no se ven en producción:** revisa la sección de despliegue en `design-system.md`
