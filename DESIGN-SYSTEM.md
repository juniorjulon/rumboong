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

`css/styles.css?v=2` · `js/main.js?v=2`

Actualiza este número cada vez que lo incrementes para tener registro.
