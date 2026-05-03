# RUMBO · Sistema de Diseño

> Documento de referencia oficial para **rumbo.org.pe**
> Basado en la identidad visual oficial de la organización (paleta + tipografías).
> Conserva el hero original (con sus gradientes) e introduce un sistema visual coherente para todas las demás secciones.

---

## 🎯 Decisión estratégica

- **Conservar:** Hero page con sus colores y gradientes actuales — es el primer impacto visual y ya funciona.
- **Renovar:** Todas las demás secciones con el sistema descrito a continuación, basado en la identidad oficial de RUMBO.
- **Ritmo visual:** Alternar fondos claros y oscuros entre secciones para crear pausa y movimiento al hacer scroll.

---

## 🔤 Tipografías oficiales

Todas via Google Fonts. Tres familias con roles claros, alineadas a la identidad oficial.

| Familia | Pesos usados | Rol | Uso |
|---|---|---|---|
| **Montserrat** | 600 (SemiBold), 800 (ExtraBold) | Display | Títulos (ExtraBold), subtítulos (SemiBold) |
| **Open Sans** | 300 (Light), 400, 500, 600 | Body | Cuerpo de texto, descripciones, navegación |
| **JetBrains Mono** | 400, 500 | Monoespaciada (auxiliar) | Eyebrows, números pequeños, tags técnicos |

> **Nota:** Montserrat y Open Sans son las fuentes oficiales de RUMBO. JetBrains Mono se introduce solo como auxiliar para eyebrows y labels técnicos — no compite con la voz oficial, solo añade precisión a elementos pequeños.

### Variables CSS

```css
--font-display: 'Montserrat', -apple-system, system-ui, sans-serif;
--font-body: 'Open Sans', -apple-system, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Escala tipográfica

| Elemento | Tamaño | Peso | Tracking | Family |
|---|---|---|---|---|
| H1 hero | `clamp(40px, 7vw, 88px)` | **800** ExtraBold | -0.03em | Montserrat |
| H2 sección | `clamp(32px, 5.2vw, 56px)` | **800** ExtraBold | -0.02em | Montserrat |
| H3 card | `clamp(22px, 2.8vw, 30px)` | **600** SemiBold | -0.01em | Montserrat |
| Eyebrow | 12px | 500 | 0.14em uppercase | JetBrains Mono |
| Lede | `clamp(15px, 1.4vw, 17px)` | 300 Light | normal | Open Sans |
| Body | 14.5–15.5px | 300–400 | normal | Open Sans |
| Tag / chip | 11.5–12px | 500 | 0.18em uppercase | JetBrains Mono |

---

## 🎨 Paleta oficial de RUMBO

### Colores oficiales

| Color | Hex | Token | Rol |
|---|---|---|---|
| 🔵 Azul institucional | `#004F8C` | `--rumbo-navy` / `--rumbo-blue` | **Primario** — CTAs, headers, card destacada |
| 🌊 Celeste claro | `#6BC5D2` | `--rumbo-sky` | Acento secundario, hovers, bordes activos |
| 🟢 Verde petróleo | `#1D7874` | `--rumbo-coral` | Acento alternativo (texto enfatizado, dot animado) |
| 🟡 Amarillo dorado | `#F6C667` | `--rumbo-amber` | Acento cálido (eyebrow Pilares, hover íconos, highlights) |
| ⚪ Crema | `#F9F9F4` | `--bg` | Fondo principal |

### Variantes derivadas

| Token | Hex | Uso |
|---|---|---|
| `--rumbo-navy-deep` | `#00345E` | Fondo Pilares (oscuro) — versión más profunda del azul oficial |
| `--rumbo-sky-soft` | `#D6EEF3` | Pills, chips, fondos suaves derivados del celeste |
| `--rumbo-sky-mist` | `#EDF7F9` | Fondos muy suaves, glyphs |
| `--bg-cream` | `#F1F1EB` | Fondo Problema/Equipo/FAQ — variante del crema oficial |
| `--surface` | `#FFFFFF` | Cards, contenedores elevados |

### Neutros

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#0F1A2B` | Texto principal |
| `--ink-soft` | `#3A4658` | Texto secundario |
| `--ink-mute` | `#7A8494` | Texto terciario |
| `--line` | `#E4E7EC` | Bordes |
| `--line-soft` | `#EFF1F4` | Bordes muy sutiles |

### Reglas de uso

- **Azul `#004F8C`** es el ancla institucional — siempre presente, dominante en CTAs y card destacada.
- **Celeste `#6BC5D2`** es el complemento natural del azul — funciona perfecto para hovers, estados activos y elementos secundarios.
- **Verde petróleo `#1D7874`** se reserva para acentos alternativos cuando se quiere variar del azul (gradientes radiales, dot animado del hero).
- **Amarillo `#F6C667`** aparece muy puntualmente sobre fondos oscuros — eyebrow de Pilares, hover de íconos, íconos en tabs activos.
- **Crema `#F9F9F4`** es el fondo principal — más cálido y orgánico que un blanco puro.

---

## 📐 Espaciado y layout

### Border radius

```css
--r-sm: 10px;   /* botones pequeños, chips */
--r-md: 16px;   /* cards medianas, glyphs */
--r-lg: 24px;   /* secciones, cards grandes */
```

### Sombras

```css
--shadow-sm: 0 1px 2px rgba(15,26,43,.04), 0 2px 6px rgba(15,26,43,.04);
--shadow-md: 0 4px 12px rgba(15,26,43,.06), 0 12px 32px rgba(15,26,43,.06);
```

### Padding de secciones

- **Vertical:** `clamp(60px, 9vw, 120px)`
- **Horizontal:** `clamp(20px, 5vw, 80px)`
- **Max-width contenedor:** 1240–1320px

### Breakpoints

| Nombre | Min-width | Comportamiento |
|---|---|---|
| Mobile | 0 | Stack vertical, carrusel snap horizontal en niveles |
| Tablet | 720px | Grid 2 columnas |
| Desktop | 880px | Grid 3 columnas |
| Wide | 1100px | Grid 5 columnas (lista problema) |

---

## 🎭 Componentes

### Eyebrow (etiqueta de sección)

```css
.eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--rumbo-blue);  /* #004F8C */
  font-weight: 500;
}
```

### Botones

- **Primary:** fondo `#004F8C`, texto blanco, radio 999px, hover → más oscuro
- **Ghost:** transparente, borde `--line`, hover → borde navy

### Cards

- Fondo `surface` blanco, borde `--line`, radio `--r-lg`
- Hover: `translateY(-6px)` + borde celeste `#6BC5D2` + sombra md
- Card destacada (Nivel 02): fondo `#004F8C`, texto blanco, gradiente verde petróleo radial

### Iconos

- **Estilo:** Line-art SVG, stroke `1.4–1.6`, `currentColor`
- **Tamaños:** 18px (tabs), 22–26px (cards), 14px (flechas)
- **Color base:** azul `#004F8C` · activo/hover: amarillo `#F6C667`
- Nunca emojis para íconos funcionales

---

## ✨ Animaciones e interacción

### Reveal on scroll

IntersectionObserver con `threshold: 0.15`. Al entrar en viewport activa fade + slide.

```css
transition: opacity .6s ease, transform .6s ease;
```

Cards en grid usan `transition-delay` escalonado (`0ms, 90–120ms, 180–240ms`).

### Hover (solo en `(hover: hover)`)

- Cards: lift `-6px` + cambio de borde + sombra
- Iconos en pilares: rotación `-6deg` + scale `1.05` + cambio celeste → amarillo
- Flechas: rotación `-45deg`
- Underline animado: barra que crece de 0 a 100%

### Tiempos estándar

| Tipo | Duración | Easing |
|---|---|---|
| Hover state | 200–300ms | `ease` |
| Card lift | 400ms | `cubic-bezier(.2,.8,.2,1)` |
| Reveal | 600ms | `ease` |
| Underline grow | 500ms | `cubic-bezier(.2,.8,.2,1)` |

---

## 🌊 Ritmo visual de la página

Secuencia estratégica de fondos para generar pausa y movimiento:

1. **Hero** — *Conservado, gradientes originales*
2. **Problema** — `bg-cream` `#F1F1EB` (calidez neutral)
3. **Niveles** — `bg` `#F9F9F4` (claridad, foco)
4. **Pilares** — `navy-deep` `#00345E` (pausa, contraste fuerte)
5. **Actividades** — `bg` `#F9F9F4`
6. **Equipo** — `bg-cream` `#F1F1EB`
7. **Únete** — `bg` `#F9F9F4`
8. **FAQ** — `bg-cream` `#F1F1EB`
9. **CTA final** — `navy` `#004F8C` (cierre fuerte)
10. **Footer** — `navy-deep` `#00345E`

---

## ♿ Accesibilidad

- Contraste mínimo AA cumplido en todos los pares texto/fondo
- Focus visible en todos los interactivos
- `text-wrap: balance` en titulares, `text-wrap: pretty` en párrafos
- Hover effects condicionados con `@media (hover: hover)` para no romper experiencia táctil
- `viewport-fit=cover` para soporte de notch en iOS
- Áreas táctiles ≥44px en mobile
- Iconos decorativos con `aria-hidden="true"`

---

## 📦 Carga de assets

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

`display=swap` para evitar FOIT (flash of invisible text).

---

## 🎨 Resumen rápido — Cheatsheet

```
COLORES OFICIALES
━━━━━━━━━━━━━━━━━
Azul        #004F8C  →  Primario, CTAs, navy
Celeste     #6BC5D2  →  Hovers, acento secundario
Verde       #1D7874  →  Acento alternativo
Amarillo    #F6C667  →  Acento cálido, highlights
Crema       #F9F9F4  →  Fondo principal

TIPOGRAFÍAS OFICIALES
━━━━━━━━━━━━━━━━━━━━━
Títulos     Montserrat ExtraBold  (800)
Subtítulos  Montserrat SemiBold   (600)
Cuerpo      Open Sans Light       (300)
Labels      JetBrains Mono        (500)  [auxiliar]
```

---

*Documento vivo — actualizar cuando se introduzcan nuevos componentes o se refinen tokens.*
