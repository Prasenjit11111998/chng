# Retro Pixel Theme System Documentation

This document describes the design system, color palettes, custom selectors, active theme effects, and integration with Tailwind CSS and Redux in **Chng**.

---

## 🎨 Design Swatches & CSS Custom Properties

Chng utilizes a fully reactive, variable-driven CSS custom properties system. All components, borders, and text values adapt dynamically to theme changes.

| CSS Variable | Light Theme (Default) | Dark Theme | Game Boy (DMG-01) | Matrix Hacker |
| :--- | :--- | :--- | :--- | :--- |
| `--bg` | `#e4e4db` | `#000000` | `#8bac0f` | `#000000` |
| `--fg` | `#000000` | `#e4e4db` | `#0f380f` | `#00ff00` |
| `--accent` | `#000000` | `#e4e4db` | `#306230` | `#00ff00` |
| `--bg-panel` | `#e4e4db` | `#000000` | `#8bac0f` | `#000000` |
| `--bg-button` | `#e4e4db` | `#000000` | `#8bac0f` | `#000000` |
| `--bg-separator`| `#000000` | `#e4e4db` | `#0f380f` | `#00ff00` |
| `--shadow-panel`| `None` | `4px 4px 0px 0px #e4e4db` | `4px 4px 0px 0px #0f380f` | `4px 4px 0px 0px #00ff00` |
| `--border-pixel`| Hex Black SVG Grid | Hex White SVG Grid | Hex DMG Green SVG Grid | Hex Neon Green SVG Grid |

---

## 🛠 SCSS Mixin System

All swatches are declared inside `@mixin` blocks in [app.scss](file:///Users/sulagnachoudhury/Desktop/Projects/Chng/Chng/src/lib/css/app.scss).

```scss
@mixin light {
  --bg: var(--color-white);
  --fg: var(--color-black);
  --accent: var(--color-black);
  --bg-panel: var(--color-white);
  --bg-button: var(--color-white);
  --bg-separator: var(--color-black);
  --shadow-panel: none;
  --accent-transparent: rgba(0, 0, 0, 0.1);
  color-scheme: light;
}

@mixin dark {
  --bg: var(--color-black);
  --fg: var(--color-white);
  --accent: var(--color-white);
  --bg-panel: var(--color-black);
  --bg-button: var(--color-black);
  --bg-separator: var(--color-white);
  --shadow-panel: 4px 4px 0px 0px var(--color-white);
  --accent-transparent: rgba(228, 228, 219, 0.1);
  color-scheme: dark;
}

@mixin gameboy {
  --bg: #8bac0f;
  --fg: #0f380f;
  --accent: #306230;
  --bg-panel: #8bac0f;
  --bg-button: #8bac0f;
  --bg-separator: #0f380f;
  --shadow-panel: 4px 4px 0px 0px #0f380f;
  --accent-transparent: rgba(48, 98, 48, 0.15);
  color-scheme: light;
}

@mixin matrix {
  --bg: #000000;
  --fg: #00ff00;
  --accent: #00ff00;
  --bg-panel: #000000;
  --bg-button: #000000;
  --bg-separator: #00ff00;
  --shadow-panel: 4px 4px 0px 0px #00ff00;
  --accent-transparent: rgba(0, 255, 0, 0.15);
  color-scheme: dark;
}
```

---

## ⚓ Theme Selectors & Specificity Hierarchy

To prevent browser user-agent stylesheets or OS dark/light mode preferences (`@media (prefers-color-scheme)`) from overriding theme colors, the system defines:

1. **Fallback Media Queries**: Active *only* if no explicit theme class is applied on the root element.
   ```scss
   :root:not(.light):not(.dark):not(.gameboy):not(.matrix) {
     @media (prefers-color-scheme: dark) { @include dark; }
     @media (prefers-color-scheme: light) { @include light; }
   }
   ```
2. **Explicit Class Rules**: Set with higher specificity (such as `:root.gameboy` or `html.gameboy`) and compiled using `!important` color forcing for `html` (setting the solid color) while making `body` background `transparent` to allow negative z-index canvas backdrops (like Matrix rain and gradients) to render correctly.
   ```scss
   :root.gameboy, html.gameboy {
     @include gameboy;
     background-color: var(--bg) !important;
     color: var(--fg) !important;
     
     body {
       background-color: transparent !important;
       color: var(--fg) !important;
     }
   }
   ```

---

## ⚡ Tailwind CSS Integration

Tailwind CSS matches utility classes to the SCSS custom property variables via [tailwind.config.js](file:///Users/sulagnachoudhury/Desktop/Projects/Chng/Chng/tailwind.config.js):

- `bg-panel` $\rightarrow$ `var(--bg-panel)`
- `bg-button` $\rightarrow$ `var(--bg-button)`
- `text-foreground` $\rightarrow$ `var(--fg)`
- `text-muted` $\rightarrow$ `var(--fg-muted)`
- `border-separator` $\rightarrow$ `var(--bg-separator)`
- `shadow-panel` $\rightarrow$ `var(--shadow-panel)`

### Tailwind Dark Mode Strategy
To ensure `dark:` utilities are correctly applied for the **Matrix** theme (which is a dark theme) and the standard **Dark** theme, Tailwind is configured with custom selectors:
```javascript
export default {
  darkMode: ["class", ".dark, .matrix"],
  // ...
}
```

---

## 📺 Active Theme Visual Effects

### 1. Game Boy DMG-01 Physical Emulation
When the Game Boy theme is active, the interface applies multiple retro console emulation details:
- **LCD Pixel Grid Matrix**: The body renders a repeating subpixel grid line overlay at `12%` opacity and `4px` intervals simulating a physical screen matrix.
- **Screen Bezel Frame**: Panel cards (`.pixel-box`) utilize a bezel background color (`#9bbc0f`) and render the iconic diagonal Game Boy grey, blue, and maroon border strip at the top.
- **Maroon A/B Action Buttons**: Primary buttons (`.btn.highlight`) change to the physical Game Boy console's dark maroon action button color (`#8c1e1e`) with dark green hover states.

### 2. Matrix Hacking Terminal Aesthetics
The Matrix theme transforms the app into a glowing, retro hacking terminal:
- **Rolling CRT Scanline Filter**: A CSS linear-gradient filter runs on top of the entire body, generating a subtle vertical rolling scanline grid and minor screen flicker.
- **Neon Glow**: All headers (`h1`, `h2`, etc.) receive a pulsing green `text-shadow`, while panels and buttons glow with a vibrant neon green border blur (`box-shadow`).
- **Chunkier Code Rain**: A full-screen canvas backdrop renders cascading digital rain with letters scaled up to a chunky `16`px grid at `45%` opacity for high readability and visibility.
- **Performance**: Render loop runs at 30 FPS and respects `prefers-reduced-motion: reduce`.

---

## 🎮 Easter Egg Trigger (Konami Code)

Typing the Konami code triggers the cycling theme sequence:
`↑` `↑` `↓` `↓` `←` `→` `←` `→` `B` `A`

This sequence cycles the active theme (`light` $\rightarrow$ `dark` $\rightarrow$ `gameboy` $\rightarrow$ `matrix`) and flashes a retro console alert.
