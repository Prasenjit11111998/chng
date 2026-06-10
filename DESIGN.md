# Chng — Design System

**Version:** 0.2  
**Theme:** Dark · Monochrome · Accent Red · Centred Logo Navigation  
**Inspiration:** Vercel, Linear, Raycast  

---

## 1. Design Philosophy

Chng is a tool, not a product. The UI should feel like a well-made piece of equipment — purposeful, quiet, immediately comprehensible. Every element earns its presence. Nothing decorates.

The navigation is intentionally unconventional: no navbar bar, no sidebar. The brand name sits centred at the top with a single arrow. Clicking reveals tools. The rest of the screen is entirely devoted to the active tool workspace.

**References:**
- **Vercel** — negative space, sharp typographic hierarchy, confident mono details
- **Linear** — tight density, precise spacing, keyboard-first mental model
- **Raycast** — command-bar interactions, instant feedback, zero loading theatre

---

## 2. Colour Palette

### 2.1 Background Scale (zinc-tinted dark)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0d0d0f` | Page background |
| `--bg2` | `#141416` | Card / surface background |
| `--bg3` | `#1c1c1f` | Elevated surface, inputs, icon containers |
| `--bg4` | `#242428` | Deep hover, badge backgrounds |
| `--bg5` | `#2e2e33` | Active hover states |

The background family uses a zinc tint (very slight blue-grey cast) rather than pure black. This gives depth to the dark surfaces and makes the red accent read more distinctly.

### 2.2 Border Scale

| Token | Hex | Usage |
|---|---|---|
| `--border` | `#252529` | Default border |
| `--border2` | `#33333a` | Hover border / emphasis |
| `--border3` | `#3e3e47` | Active / focus border |

### 2.3 Text Scale

| Token | Hex | Usage |
|---|---|---|
| `--text` | `#ececee` | Primary text — slightly warm white, not pure |
| `--text2` | `#8c8c99` | Secondary text, descriptions, labels |
| `--text3` | `#55555f` | Muted text, placeholders, eyebrow labels |

### 2.4 Accent

| Token | Hex | Usage |
|---|---|---|
| `--red` | `#e8342b` | Primary accent |
| `--red2` | `#ff5047` | Hover state |
| `--red-dim` | `#1f1210` | Red tint background |
| `--green` | `#2ea87a` | Savings / success indicators only |

### 2.5 Colour Rules

- Red is used for: logo dot, active states, selected format tags, progress bars, primary buttons, error text.
- Green is used exclusively for: compression savings percentage, completion checkmarks.
- No other hues. Pure monochrome with two semantic accents.
- No gradients. No shadows. No blur. Flat surfaces only.

---

## 3. Typography

**Geist** — all UI text.  
**Geist Mono** — file sizes, format names, badges, version strings, progress labels, all numeric data.

```
https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;900&family=Geist+Mono:wght@400;500;600&display=swap
```

### Type Scale

| Role | Size | Weight | Font | Colour |
|---|---|---|---|---|
| Logo | 26px | 900 | Geist | `--text` + `--red` dot |
| Hero heading | 42px | 900 | Geist | `--text` |
| Tool name (dropdown) | 13px | 500 | Geist | `--text` |
| Body / description | 13–14px | 400 | Geist | `--text2` |
| Eyebrow label | 10px | 600 | Geist Mono | `--text3` |
| Badge | 9–10px | 600–700 | Geist Mono | contextual |
| File metadata | 10–11px | 400 | Geist Mono | `--text3` |
| Button | 12px | 600 | Geist | contextual |

### Rules

- Hero: `letter-spacing: -2px`, `line-height: 1.05`
- Logo: `letter-spacing: -1.5px`, `line-height: 1`
- Eyebrows always: uppercase, letter-spaced 0.1em, Geist Mono, `--text3`
- Numbers always: Geist Mono
- File names: truncate with ellipsis, never wrap

---

## 4. Navigation — Centred Logo + Dropdown

This is the core navigation paradigm of Chng. There is no navbar.

### Structure

```
[Chng.]
  [↓]        ← 12px arrow icon, muted, rotates 180° when open
  ┌─────────────────────────────┐
  │ TOOLS                       │
  │ [⇄] Format Converter        │
  │      JPG · PNG · WebP...    │
  │ [◈] Image Compressor        │
  │      Target KB · MB...      │
  ├─────────────────────────────┤
  │ v0.1 · 2 tools · browser    │
  └─────────────────────────────┘
```

### Specs

- Logo centred at `padding-top: 28px`
- Arrow: 12×12px SVG chevron, `--text3`, transitions `color` and `transform: rotate(180deg)` on open
- Dropdown: background `--bg2`, border `1px solid --border2`, border-radius 14px, `min-width: 220px`
- Positioned `top: calc(100% + 8px)`, centred via `left: 50%; transform: translateX(-50%)`
- Dropdown items: 10px 16px padding, 13px font, hover background `--bg3`
- Active item: background `--red-dim`
- Active item icon container: background `--red-dim`, border `--red`, colour `--red`
- Footer row in dropdown: Geist Mono 11px, `--text3`, version + tool count + "browser-only"
- Close on: click outside, Escape key, selecting a tool

---

## 5. Layout

### Page Structure

```
[centred logo + dropdown]
[hero: "Your toolkit."]
[workspace — max-width 680px, centred]
[footer]
```

- Max workspace width: 680px
- Page horizontal padding: 20px
- Hero: `padding: 52px 24px 40px`, text-align centre
- No sidebars. No persistent chrome. Full attention on the active tool.

### Hero

- "Your toolkit." — 42px weight 900, red dot on the period
- Subtext: 14px `--text2`, max-width 380px, centred
- Empty state (no tool open): small hint text "Click Chng ↓ above to pick a tool"

---

## 6. Component Specifications

### Workspace Card

- Background: `--bg2`, border: `1px solid --border`, border-radius: 14px
- Header: 14px 18px padding, `border-bottom: 1px solid --border`
- Header contains: red dot + tool name (13px 600) + badge pill, close button right
- Body: 18px padding all sides
- Only one workspace visible at a time

### Dropzone

- Border: `2px dashed --border2`, border-radius: 10px, background: `--bg`
- Padding: 40px vertical, 20px horizontal, centred content
- Hover / drag-over: border `--red`, background `--red-dim`
- Icon: 22px `--text3`, centred above text
- Text: `--text2` with "click to browse" in `--red`

### Format Tags

- Default: background `--bg3`, border `--border2`, colour `--text2`, 7px border-radius
- Selected: background `--red-dim`, border `--red`, colour `--red`
- Font: Geist Mono 11px 600 uppercase, letter-spacing 0.06em
- Padding: 5px 12px

### File Item

- Background: `--bg`, border `1px solid --border`, border-radius: 9px
- Padding: 10px 12px
- Layout: 36×36px thumbnail | info flex-1 | badge | status/action | remove
- Thumbnail: 6px radius, object-fit cover
- Name: 12px 500, truncate with ellipsis
- Meta: Geist Mono 10px `--text3`
- Badge: Geist Mono 9px 700 uppercase, background `--bg4`, `--text3`
- Status: Geist Mono 10px 600, green for success

### Buttons

**Primary:** background `--red`, white text, border `--red` → hover `--red2`  
**Ghost:** background `--bg3`, `--text2`, border `--border` → hover `--text`, border `--border2`  
Padding: 9px 18px, border-radius: 8px, font 12px 600 Geist

### Progress

- Wrap: background `--bg`, border `--border`, border-radius 8px, 10px 14px padding
- Track: 2px, `--border`
- Fill: `--red`
- Label: Geist Mono 10px `--text2`

### Footer

- Border-top: `1px solid --border`, padding 20px 24px
- Max-width: 680px, centred with the workspace
- Three columns: logo, links (Docs · GitHub · Privacy), "Operating locally · Encrypted session"
- All: Geist Mono 11px `--text3`

---

## 7. Motion

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Dropdown open | `display: block` + height/opacity | instant (JS class toggle) | — |
| Arrow rotation | `transform: rotate(180deg)` | 200ms | ease |
| File item enter | fade + 6px translate up | 180ms | ease-out |
| Dropzone drag | border + bg colour change | 150ms | ease |
| Progress fill | width | 200ms | ease |
| Button colour | background/border | 120ms | ease |

No bounce. No spring. No entrance animations on workspace card open.

---

## 8. Iconography

Expressed as Unicode characters or minimal inline SVG:

| Element | Symbol |
|---|---|
| Converter | ⇄ |
| Compressor | ◈ |
| Download | ⤓ |
| Close | ✕ |
| Success | ✓ |
| Action | ⚡ |
| Dropdown arrow | SVG chevron 12×12 |

No icon library loaded. Zero extra bytes.

---

## 9. Accessibility

- Focus ring: `outline: 2px solid --red`, `outline-offset: 2px`
- Focus visible on keyboard only (`focus-visible` selector)
- Dropzone keyboard accessible (Enter / Space triggers file picker)
- All icon-only buttons have `aria-label`
- Progress announced via `aria-live="polite"`
- WCAG AA contrast on all text/background combinations
- Status never conveyed by colour alone

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| Use centred logo + dropdown as the only nav | Add a traditional navbar or sidebar |
| Keep Geist for all text, Geist Mono for all data | Mix in system fonts or other typefaces |
| Use `--text` (warm near-white) as primary text | Use pure `#ffffff` — too harsh on zinc-dark |
| Use zinc-tinted dark backgrounds | Use pure `#000000` or `#111111` — loses depth |
| Show one workspace at a time | Stack both workspaces simultaneously |
| Use green only for savings/completion | Use green for general success states |
| Truncate filenames with ellipsis | Let file names wrap to multiple lines |
| Animate presence only (open/close) | Animate hover states with scale or translate |

---

*The logo is the only nav. The workspace is the entire product.*
