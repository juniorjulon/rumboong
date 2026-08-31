# RUMBO — Sistema de Diseño

> Referencia oficial de tokens, tipografía, colores y componentes de la página web de RUMBO.
> Todas las variables están definidas en `css/styles.css` dentro del bloque `:root`.

---

## Paleta de colores

### Marca principal

| Variable | Hex | Uso |
|---|---|---|
| `--rumbo-navy` | `#004F8C` | Azul institucional principal. Fondos de navbar (scrolled), botones primarios, links. |
| `--rumbo-navy-deep` | `#00345E` | Azul oscuro. Fondo de la sección Pilares, hover de botones. |
| `--rumbo-sky` | `#6BC5D2` | Celeste. Bordes hover de cards, gradientes decorativos. |
| `--rumbo-sky-soft` | `#D6EEF3` | Celeste claro. Fondo de la pill del Hero, backgrounds de íconos. |
| `--rumbo-sky-mist` | `#EDF7F9` | Celeste muy suave. Fondos de iconos de Únete, avatar del equipo. |
| `--rumbo-coral` | `#1D7874` | Verde petróleo. Roles del equipo, border-left de citas, eyebrow de "La realidad". |
| `--rumbo-amber` | `#F6C667` | Amarillo dorado. Acento cálido. CTA del navbar, métricas del hero, eyebrow de Pilares. |

### Fondos

| Variable | Hex | Sección |
|---|---|---|
| `--bg` | `#F9F9F4` | Fondo base de la página (Niveles, Únete, Contacto) |
| `--bg-cream` | `#F1F1EB` | Fondo cremoso (FAQ) |
| `--surface` | `#FFFFFF` | Cards, formularios |
| `--surface` `#FFFFFF` | — | Actividades (blanco limpio post-oscuro) |

### Texto

| Variable | Hex | Uso |
|---|---|---|
| `--ink` | `#0F1A2B` | Texto principal (títulos, párrafos) |
| `--ink-soft` | `#3A4658` | Texto secundario (párrafos de cards, citas) |
| `--ink-mute` | `#7A8494` | Texto terciario (metadatos, placeholders) |

### Bordes

| Variable | Hex |
|---|---|
| `--line` | `#E4E7EC` |
| `--line-soft` | `#EFF1F4` |

---

## Tipografía

### Fuentes

Las tres fuentes se cargan desde Google Fonts. El link está en el `<head>` de `index.html`.

| Variable | Fuente | Pesos | Uso |
|---|---|---|---|
| `--font-display` | Montserrat | 400, 500, 600, 700, 800 | Títulos (H1–H4), botones, navbar |
| `--font-body` | Open Sans | 300, 400, 500, 600 | Párrafos de cuerpo, formularios |
| `--font-mono` | JetBrains Mono | 400, 500 | Eyebrows, etiquetas, metadatos numéricos |

### Escala tipográfica

| Elemento | Fuente | Tamaño | Peso | Letter-spacing |
|---|---|---|---|---|
| H1 Hero | Montserrat | `clamp(40px, 7vw, 88px)` | 800 | -0.03em |
| H2 Sección | Montserrat | `clamp(32px, 5.2vw, 56px)` | 800 | -0.02em |
| H3 Card grande | Montserrat | `clamp(22px, 2.8vw, 30px)` | 600 | -0.01em |
| H3 Card normal | Montserrat | `clamp(18px, 2.2vw, 22px)` | 600 | -0.01em |
| Eyebrow | JetBrains Mono | 12px | 500 | 0.14em |
| Lede / Subtítulo | Open Sans | `clamp(15px, 1.5vw, 18px)` | 300 | — |
| Cuerpo card | Open Sans | 14.5px | 300–400 | — |
| Etiqueta act-tag | JetBrains Mono | 11.5px | 500 | 0.14em |
| Metadatos | JetBrains Mono | 13px | 400–500 | — |

### Eyebrow

El eyebrow es la etiqueta pequeña en mayúsculas que encabeza cada sección. Se usa con la clase `.eyebrow`:

```html
<span class="eyebrow">En acción</span>
```

Características: fuente mono, 12px, 0.14em letter-spacing, color `--rumbo-blue`, con una línea horizontal de 22px antes del texto (pseudo-elemento `::before`).

**Variante dorada** (solo en sección Pilares): clase `.pil-eyebrow`, mismos estilos pero `color: var(--rumbo-amber)`.

---

## Espaciado y layout

| Token | Valor | Uso |
|---|---|---|
| Padding vertical de sección | `clamp(60px, 9vw, 120px)` | Todas las secciones |
| Padding horizontal de sección | `clamp(20px, 5vw, 60px)` | Contenedores internos |
| Max-width contenedor | `1240px` (general), `1320px` (carruseles), `920px` (FAQ) | `.container`, `.niv-inner`, `.faq-inner` |
| Gap entre cards | `16px` – `24px` | Grids de cards |

### Breakpoints

| Nombre | Ancho | Comportamiento |
|---|---|---|
| Mobile | < 600px | 1 columna, carrusel swipe |
| Tablet | 600px – 760px | 2 columnas en grids de 3 |
| Desktop | > 760px | 3 columnas (niveles), 2 columnas (pilares, actividades) |
| Wide | > 992px | 4 columnas (equipo) |

---

## Border-radius y sombras

| Token | Valor | Uso |
|---|---|---|
| `--r-sm` | `10px` | Inputs, QR, chips pequeños |
| `--r-md` | `16px` | Cards del FAQ (details) |
| `--r-lg` | `24px` | Cards de Niveles, Pilares, Actividades, Únete |
| `--shadow-sm` | `0 1px 2px … + 0 2px 6px …` | Hover suave (Únete), botones navbar |
| `--shadow-md` | `0 4px 12px … + 0 12px 32px …` | Hover de cards de actividades y niveles |

---

## Componentes

### Botones

| Clase | Descripción | Fondo | Texto |
|---|---|---|---|
| `.btn-primary` | Botón principal pill | `--rumbo-navy` | Blanco |
| `.btn-ghost` | Botón transparente sobre fondo oscuro (hero) | `rgba(255,255,255,0.15)` | Blanco |
| `.btn-ghost-dark` | Botón transparente sobre fondo claro | Transparente | `--ink` |

Todos los botones tienen `border-radius: 999px` y font `Montserrat 500`.

### Cards de Niveles (`.niv-card`)

- Fondo blanco, borde `--line`, radius `--r-lg`
- Animación de entrada: `opacity 0 → 1` + `translateY(28px → 0)` al aparecer en viewport (clase `.in` en el padre `.niv-section`)
- Hover: `translateY(-6px)` + borde celeste + sombra + línea de gradiente en la base
- Variante destacada: `.niv-card.featured` → fondo `--rumbo-navy`, texto blanco

### Cards de Pilares (`.pil-card`)

- Fondo `--rumbo-navy-deep`, texto blanco
- Animación de entrada idéntica a Niveles (clase `.in` en `.pil-section`)
- Hover: fondo `#0a1f3d` + línea de gradiente azul→dorado en el top
- Ícono SVG en un recuadro de 52×52px, se rota en hover

### Cards de Actividades (`.act-card`)

- Imagen con `aspect-ratio: 16/10`
- Mini-carrusel de fotos integrado: agregar `<img>` dentro de `.mini-photos`, el JS construye los dots automáticamente
- Hover: `translateY(-4px)` + borde celeste + sombra

### Cards de Únete (`.unete-card`)

- Fondo blanco, borde `--line`, radius `--r-lg`
- Ícono SVG en recuadro azul claro (48×48px)
- Hover: borde celeste + sombra suave

### FAQ

- Tabs: pills con borde → activo con fondo `--rumbo-navy`
- Acordeón: elemento HTML nativo `<details>` / `<summary>`
- Indicador: `+` que rota 45° al abrir → forma una ×

### Eyebrow

Ver sección Tipografía.

### Pantalla de carga (`.rumbo-loader`)

Cubre la pantalla mientras carga `index.html`. Cohete vectorial en blanco translúcido
sobre el degradado de marca (navy → navy-deep → coral), con estelas de fondo, el
wordmark RUMBO y una barra de progreso indeterminada.

**Cómo se retira** — `RUMBO_CARGA` en `js/main.js`:

| Constante | Valor | Rol |
|---|---|---|
| `MIN_MS` | 900 ms | Tiempo mínimo en pantalla, para que no parpadee en cargas rápidas |
| `MAX_MS` | 3500 ms | Tope absoluto: se retira aunque algún recurso siga cargando |

Se retira en `window.load` respetando `MIN_MS`. `RUMBO_CARGA.listo(cb)` encadena lo que
deba ocurrir después (lo usa el pop-up).

**Tres redes de seguridad**, porque una pantalla de carga atascada bloquea el sitio entero:

1. `MAX_MS` en `main.js`.
2. Un `setTimeout` de 6 s en un `<script>` en línea dentro del `<head>` — se registra antes
   de que `main.js` se descargue, así que sobrevive a cualquier error en ese archivo.
3. Un `<noscript>` que la oculta del todo si no hay JavaScript.

El bloqueo de scroll vive en `html.is-loading`; las tres redes lo liberan.

### Pop-up de actividades (`.pop-modal`)

Modal de bienvenida para anunciar la próxima actividad. Afiche a un lado y datos + CTA
al otro. **Prefijo `pop-`, no `act-`**: `.act-card` y `.act-body` ya son las tarjetas de
la sección Actividades y colisionarían.

**Configuración** — atributos `data-*` en `#popActividad` (`index.html`):

| Atributo | Efecto |
|---|---|
| `data-pop-id` | Identifica la actividad. Solo se usa en modo `sesion`. |
| `data-pop-hasta` | Fecha ISO tras la cual deja de mostrarse solo. Se respeta en los dos modos. |
| `data-pop-frecuencia` | `siempre` (actual) o `sesion`. |
| `data-pop-delay` | Milisegundos de espera tras la pantalla de carga (700 por defecto). |

**Cuándo se muestra** — lo decide `data-pop-frecuencia`:

- **`siempre`** (el modo configurado): en **cada carga de la página**, incluidas las
  recargas. No escribe nada en el navegador.
- **`sesion`**: una sola vez por visita (`sessionStorage`). Si además la persona pulsa
  «Inscríbete gratis», se anota en `localStorage` y no se le vuelve a mostrar **esa**
  actividad en ese navegador.

En modo `siempre` no se guarda nada a propósito: si más adelante se cambia a `sesion`,
no habrá datos viejos que lo silencien de entrada.

**Cierre**: botón ×, «Ahora no», clic en el fondo o `Escape`. El foco entra en la tarjeta
(con `preventScroll`, para no desplazar el diálogo y esconder el título), queda atrapado
dentro mientras está abierta y vuelve a su origen al cerrar.

**Layout responsive**:

**El afiche se muestra siempre completo** (`object-fit: contain`), nunca recortado: es
la pieza que la gente vino a ver y ya lleva impresos fecha, hora, lugar, público y el QR.
Lo que cede altura es el texto, por niveles, porque **repite lo que el afiche ya dice**:

| Disposición | Condición | Qué se ve |
|---|---|---|
| Fila | ancho ≥ 880px | Afiche `flex: 0 0 44%` + todo el texto. Alto `min(88dvh, 640px)`. |
| Fila | apaisado, alto ≤ 460px | Afiche al 32% + todo el texto. |
| Columna | ancho < 880px | Afiche arriba, `max-height: 54dvh`. |
| Columna | alto ≤ 1000px | Se oculta `.pop-lede`. |
| Columna | alto ≤ 780px | Se oculta también `.pop-facts`. |
| Columna | alto ≤ 580px | El afiche baja a `46dvh` y el H2 a 19px. |

Los niveles de columna usan `min-height: 461px` para dejar fuera el móvil apaisado, que
vuelve a disposición en fila y sí tiene sitio para el texto.

Lo que se oculta **no se pierde**: va en el `alt` de la imagen del afiche, así que los
lectores de pantalla siguen anunciando fecha, hora, lugar y público.

El pie (`.pop-footer`) es `position: sticky` en todos los casos: **el botón de inscripción
nunca queda bajo la línea de flotación**, por corta que sea la pantalla. El sangrado del
pie se sincroniza con el padding del cuerpo mediante `--pop-pad`.

**Verificado sin scroll ni desbordamiento** en: 320×520, 360×568, 375×553, 375×629,
390×664, 412×730, 430×745, 844×390 (apaisado), 744×954, 768×954, 820×1080, 860×700,
1366×641 y 1920×874.

El afiche va en `object-fit: contain` sobre una copia desenfocada de sí mismo
(`.pop-poster-blur`), que rellena el letterbox sin descarga extra — es la misma URL, así
que el navegador la reutiliza de caché.

**Para cambiar de actividad**: reemplaza la imagen, actualiza los textos y pon un
`data-pop-id` y un `data-pop-hasta` nuevos.

### Imagen del afiche

`assets/popup-charla-rumbo-hacia-tu-beca.webp` (105 KB) con respaldo `.jpg` (238 KB),
ambos de 1080×1350, servidos con `<picture>`.

Salen del SVG original (`assets/Pop up - …svg`, 11,6 MB): ese archivo son 49 imágenes
rasterizadas incrustadas en base64, así que **no debe enlazarse desde la web** — se queda
como fuente editable. Para regenerar los derivados tras un cambio de afiche:

```bash
# 1. Rasterizar el SVG a 1080×1350 con Chrome sin interfaz
chrome --headless --screenshot=poster.png --window-size=1080,1350 file:///ruta/render.html
# 2. Derivar los formatos web
ffmpeg -i poster.png -c:v libwebp -quality 80 assets/popup-....webp
ffmpeg -i poster.png -q:v 4 assets/popup-....jpg
```

Comprueba que el QR quede nítido antes de publicar.

---

## Animaciones

| Tipo | Duración | Easing | Clase |
|---|---|---|---|
| Fade-up general | 600ms | ease | `.fade-up` → `.fade-up.visible` |
| Reveal de sección (Niveles/Pilares) | 600ms | ease | `.niv-section/.pil-section` → agrega `.in` |
| Stagger de cards | delay 0 / 90 / 120 / 180 / 240 / 270ms | — | nth-child en `.niv-card`, `.pil-card` |
| Hover de card | 300–400ms | `cubic-bezier(.2,.8,.2,1)` | Todas las cards |
| Pulse del hero-dot | 2s infinite | ease | `.hero-dot` via `@keyframes rumbo-pulse` |
| Tabs FAQ | 250ms | ease | `.faq-tab` |
| Flotación del cohete | 2.6s infinite | ease-in-out | `.loader-rocket` |
| Llama del cohete | 0.42s / 0.28s alternate | ease-in-out | `.loader-flame`, `.loader-flame-inner` |
| Desvanecido del loader | 550ms | ease | `.rumbo-loader.is-done` |
| Entrada del pop-up | 420ms | `cubic-bezier(.2,.8,.2,1)` | `.pop-modal.is-open .pop-card` |

---

## Estructura de secciones (orden en la página y fondo)

| # | Sección | Fondo | Tono |
|---|---|---|---|
| 1 | Navbar | transparente → blanco al scroll | — |
| 2 | Hero | gradiente navy → coral → sky | OSCURO |
| 3 | Problema | `--rumbo-navy` #004F8C | OSCURO |
| 4 | Niveles | `--bg` #F9F9F4 | claro |
| 5 | Pilares | `--rumbo-navy-deep` #00345E | OSCURO |
| 6 | Actividades | `--surface` #FFFFFF | claro (blanco limpio tras oscuro) |
| 7 | Equipo | `--bg-cream` #F1F1EB | claro (crema cálido) |
| 8 | Únete | `--rumbo-navy` #004F8C | OSCURO |
| 9 | FAQ | `--bg` #F9F9F4 | claro (tras oscuro) |
| 10 | Contacto | `--bg-cream` #F1F1EB | claro (crema cálido) |
| 11 | Footer | `--rumbo-navy` #004F8C | OSCURO |

**Patrón**: oscuro → claro → oscuro → blanco → crema → oscuro → crema → crema → oscuro

---

## Despliegue y caché (GitHub Pages)

### El problema del caché

El sitio vive en **GitHub Pages** con dominio personalizado `rumbo.org.pe`. Cuando se hacen cambios en `css/styles.css` o `js/main.js`, el CDN y los navegadores pueden seguir sirviendo versiones antiguas de esos archivos durante horas o días, haciendo que los cambios no se vean en producción aunque sí se vean localmente.

**Síntomas:**
- El sitio local funciona correctamente
- El sitio en `rumbo.org.pe` muestra el comportamiento antiguo
- `git status` está limpio (los cambios ya están pusheados)

### La solución: versionado de archivos

En `index.html`, los links a CSS y JS llevan un parámetro de versión `?v=N`:

```html
<link rel="stylesheet" href="css/styles.css?v=2">
<script src="js/main.js?v=2"></script>
```

El parámetro `?v=N` no afecta el archivo real — es ignorado por el servidor. Pero para el navegador y el CDN es una URL **distinta**, por lo que descargan el archivo fresco.

### Cuándo incrementar la versión

Cada vez que hagas cambios importantes en `styles.css` o `main.js` y notes que el sitio desplegado no los refleja:

1. Abre `index.html`
2. Busca `?v=` en las dos líneas del `<head>`
3. Incrementa el número: `?v=2` → `?v=3`
4. Haz commit y push

```bash
git add index.html
git commit -m "Bump CSS/JS version to force cache refresh"
git push
```

5. Espera **2-3 minutos** para que GitHub Pages redespliegue
6. Abre el sitio y haz **Ctrl + Shift + R** (recarga forzada)

### Versión actual

`css/styles.css?v=12` · `js/main.js?v=12`

Actualiza este número cada vez que lo incrementes para tener registro.
