---
target: whole application
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-06-25T15-51-18Z
slug: whole-application
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | File conversion progress shown; compressor progress shown. Missing: no skeleton/loading state when WASM loads cold, no indicator that the first drop while WASM initialises may take time |
| 2 | Match System / Real World | 3 | Terminology is developer-friendly. "Go" as a convert action label is terse — power users get it, first-timers may not |
| 3 | User Control and Freedom | 2 | Remove per-file works. No undo for "Clear All" (destructive, no confirmation). No way to revert a format selection after hitting Go |
| 4 | Consistency and Standards | 2 | Main tool uses pixel/retro aesthetic; Studio uses a completely different visual grammar (rounded corners, Geist Mono in isolation, different header pattern, drop-shadow cards vs pixel borders). Two products, one domain |
| 5 | Error Prevention | 2 | No confirmation before "Clear All". No format validation warning when trying to convert a format to itself. No drag rejection for non-image files (they are silently accepted then fail) |
| 6 | Recognition Rather Than Recall | 3 | Format dropdown is visible. Badge counts on nav help. Settings have clear labels. "Go" button icon alone on mobile is icon-only without tooltip on touch |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts for Convert All or Download All. Batch format selection requires going to the panel. No drag reordering of file queue. Power users will miss these |
| 8 | Aesthetic and Minimalist Design | 3 | Main tool is clean and focused. Studio pages bring visual complexity that is inconsistent with the main tool's minimal aesthetic. Toast styling with colored fills + border-l-4 is heavy |
| 9 | Error Recovery | 2 | Error state shows a PixelCross icon — no actionable message. If a conversion fails there is no retry shortcut, user must remove and re-add. Error reason is not surfaced in the UI |
| 10 | Help and Documentation | 1 | "Docs" link in footer leads nowhere functional. No inline tooltip explaining WASM cold-start delay. No explanation of accepted file types on the dropzone. About page content is marketing copy, not a help resource |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

---

## Anti-Patterns Verdict

**LLM Assessment**: The main tool (converter/compressor) largely avoids the worst AI tells. The pixel/retro design is a strong deliberate choice that distinguishes the product. The token system is coherent and well-structured. However, several AI scaffolding patterns have crept into Studio and secondary surfaces:

- The Studio landing page has a tiny uppercase eyebrow (`<p className="font-mono text-xs uppercase tracking-[0.1em] text-muted mb-4">Chng</p>`) sitting above the hero heading. This is exactly the kicker/eyebrow the absolute ban describes.
- The About page features identical cards with icon + heading + text, repeated in a 2-column grid — the "identical card grid" anti-pattern.
- Toast notifications use `border-l-4` with colored fills — the side-stripe accent border ban.
- The mobile Sheet menu (`floating-header.tsx` line 128) also has `border-l-4`.
- Toasts use `rounded-lg` + `shadow-md` + `border-l-4` simultaneously — the ghost-card anti-pattern (border + shadow together, decoratively).

**Deterministic Scan (12 findings, exit code 2)**:
- `side-tab` (border-l-4): 2 hits — `Toasts.tsx:39`, `floating-header.tsx:128`
- `layout-transition` (animating width): 1 hit — `logo-pack.css:338`
- `broken-image` (empty img src in engine): 1 hit — `logoPackEngine.ts:557`
- `em-dash-overuse` (5 em-dashes): 1 hit — `logoPackEngine.ts`
- `overused-font` (Geist): 5 hits across `app.scss`, `studio.css`, `googleFonts.ts`
- `bounce-easing` (animate-bounce): 1 hit — `app.scss:719` (defined in reduced-motion block, but still declared)
- `single-font`: 1 hit — `googleFonts.ts` (brand guidelines wizard only offers one font at a time)

False positives: The `overused-font` flags on Geist are contextual — Chng explicitly uses Geist Pixel, a distinctive variant that is not the same as standard Geist. The `single-font` finding in the brand guidelines wizard is by design (that's what the tool does). The `broken-image` in `logoPackEngine.ts` appears to be a canvas operation, not a literal broken image tag — likely a false positive.

Real hits to act on: `side-tab` in Toasts and floating-header, `layout-transition` in logo-pack, `em-dash-overuse` in logoPackEngine, `bounce-easing` reference.

---

## Overall Impression

The main image tool (converter + compressor) is genuinely well-made. The pixel-retro aesthetic is confident and committed — it has a real identity. The 60/30/10 token system is clean, the flat monochrome with red accent reads sharply, and the drop-to-convert workflow is frictionless. The DESIGN.md is thorough and the team clearly cares.

The biggest opportunity: Studio is a parallel product that's aesthetically unrelated to the main tool, and the seams show hard. Studio pages have their own header, different card styles, no pixel borders, and a completely different typographic cadence. The single biggest value unlock is unifying Studio under the same visual grammar — or making the split intentional and communicated (a proper "product within a product" moment at the navigation level).

---

## What's Working

1. **Pixel-retro token system is genuine and consistent inside the main tool.** The `pixel-box`, `pixel-btn`, SVG border-image approach is a real craft choice that most toolkits don't attempt. The dark/light/gameboy/matrix theming infrastructure is impressive.

2. **Privacy-first positioning is correctly baked into the UI.** "Operating locally" appears in the footer. The settings panel surfaces cache size. The WASM-first approach has no loading spinners for network calls. The product follows its own design principles.

3. **Accessibility groundwork is solid.** 44px touch targets on buttons, `aria-label` on all icon-only buttons, `aria-live="polite"` for conversion results, keyboard-dismissable sheet menu, focus-visible states wired throughout. Above average for a side-project tool.

---

## Priority Issues

**[P1] Design system fracture between main tool and Studio**
- **What**: The main tool uses pixel borders, monochrome surfaces, no shadows, sharp corners, and `Geist Pixel Square`. Studio uses `rounded-lg`, soft `shadow-md`, `border-l-4`, and different layout cadence. It looks like two different teams built two different products.
- **Why it matters**: Users navigating between Converter and Studio experience a jarring context switch. Trust in product coherence drops. The brand identity that the main tool worked hard to establish is diluted the moment Studio loads.
- **Fix**: Either (a) extend the pixel system into Studio — all cards get pixel borders, no round corners, same token vocabulary — or (b) frame Studio as a deliberate mode switch with a visual treatment that connects it back (same header chrome, same font, same accent color). The current Studio header is a bespoke one-off; the main FloatingHeader should work on Studio routes too.
- **Suggested command**: `$impeccable shape Studio visual unification`

**[P1] "Clear All" is destructive with no undo or confirmation**
- **What**: The "Clear All" button in ConversionPanel immediately wipes the entire file queue with no confirmation dialog. `window.confirm()` is used for "Clear Site Data" but not for clearing files.
- **Why it matters**: A user mid-workflow who accidentally clicks Clear All loses all their work and conversion state with no recovery path. This will happen.
- **Fix**: Add a confirmation dialog (the Dialog component is already wired) or implement a 3-second undo toast pattern: toast that says "Cleared 8 files — Undo" with a countdown, re-adding the files if clicked.
- **Suggested command**: `$impeccable harden`

**[P1] Error states are opaque — no actionable message**
- **What**: When a file conversion fails, the UI shows a PixelCross icon with no tooltip, no error text in the file row, and no retry action. The error reason (stored in `file.error`) is never surfaced.
- **Why it matters**: User cannot self-diagnose. "Is this a format issue? A file size issue? Did it crash?" — no way to tell. Users will abandon rather than debug.
- **Fix**: Show `file.error` text below the file name (truncated), change the convert button to a "Retry" icon-text button on error state, and add a tooltip on the PixelCross with the error reason.
- **Suggested command**: `$impeccable harden`

**[P2] Toast anti-pattern — side-stripe border + colored fill is heavy**
- **What**: Toasts use `border-l-4` + colored background fill + `rounded-lg` + `shadow-md` simultaneously. This is the exact ghost-card anti-pattern: paired decoration that competes with itself.
- **Why it matters**: The main tool commits to flat surfaces with no shadows. Toasts contradict this with rounded corners, soft shadows, and loud colored fills. They feel grafted from a different design system.
- **Fix**: Restyle toasts to match the main tool's language: `pixel-box` border treatment, flat solid background matching the semantic color (`--accent-red` for error, etc.), `text-on-accent` for text, no `rounded-lg`, no `shadow-md`. Use the existing pixel shadow variable (`--shadow-panel`) instead.
- **Suggested command**: `$impeccable polish`

**[P2] No WASM cold-start status communicated**
- **What**: When the page loads cold and a user immediately drops a file, there's a period where WASM is still initialising. The `selectFilesReady` and `selectCompressorReady` state exists in the store but the UI just shows "Converting..." with an animated progress bar that stalls at 0% without explaining why.
- **Why it matters**: Users will think the tool is broken or their file is corrupted. The cognitive contract "I dropped my file, something is happening" is broken.
- **Fix**: When `!ready` and files exist, show a specific status line: "Initialising engine..." alongside the progress bar, distinguishable from the "Converting..." state.
- **Suggested command**: `$impeccable harden`

**[P3] Studio hero eyebrow is the banned kicker pattern**
- **What**: `StudioLanding.tsx:63` — `<p className="font-mono text-xs uppercase tracking-[0.1em] text-muted mb-4">Chng</p>` sits above the "Studio." h1. This is the exact eyebrow-above-every-section tell.
- **Why it matters**: It reads as AI scaffolding, not a brand decision. The word "Chng" provides no information the user doesn't already know.
- **Fix**: Remove it. The logo in the header already establishes Chng. "Studio." is strong enough to stand alone.
- **Suggested command**: `$impeccable quieter Studio`

---

## Persona Red Flags

**Alex (Power User — Impatient)**: Alex navigates to Converter, drops 20 files, wants to batch-convert all to WebP and download in one click. Finds "Convert All" → "Download All" which works. But then tries to re-convert a subset after realising two files need different formats — no way to select a subset of files. Also looks for a keyboard shortcut to trigger Convert All (⌘↩ or similar) — nothing exists. When one file fails silently, Alex has no retry shortcut. High friction for multi-format batch workflows.

**Jordan (First-Timer — Confused)**: Jordan lands on the page, sees the pixel logo and "Your toolkit." heading, is confused by what "Chng" means before reading anything. Clicks the logo — doesn't know it opens a dropdown, discovers it by accident. Drops a JPG, sees the file appear with a format dropdown showing "PNG" — doesn't know if that's what they selected or a default. Clicks the unmarked "↻ Go" button. The icon with "Go" text is not clear enough to a first-timer (Is this "convert"? "refresh"? "go where?"). After conversion, the PixelTick appears but Jordan doesn't see the Download button has lit up (the opacity change from 0.3 to full is subtle on the small icon button). Nearly abandons without downloading.

**Riley (Stress Tester — Edge Cases)**: Drops a 50MB TIFF. The file enters the queue, Riley clicks Go. The conversion takes 8 seconds with a progress bar stuck at a number — then completes. No issue. Then Riley drops a .exe file. It enters the queue as if accepted, shows the ImageOff icon. Riley hits Go — the conversion fails with a PixelCross and no error message. The UI offers no way to tell the file type isn't supported before trying. Riley then hits "Clear All" accidentally and the queue vanishes instantly — no way to recover. Documents it as a bug.

---

## Minor Observations

- The footer is `hidden md:block` — it's completely invisible on mobile. But the fixed footer creates a 56px dead zone at the bottom of the screen. Mobile users get the dead zone but not the footer content.
- `window.confirm()` in `SettingsView.tsx:58` for "Clear All Data" will be blocked by some browser policies in certain contexts, silently failing. Use the existing `<Dialogs>` component instead.
- The `<Gradients>` component renders ambient gradients in dark mode but nothing in light mode (`--bg-gradient-*` tokens are all `transparent` in the light theme). The light mode feels flat by comparison — which may be intentional, but it creates an inconsistency in how vivid each theme feels.
- `animate-spin-slow` is used on the RefreshCw icon in Settings panel section headers decoratively — spinning icons on non-loading state elements is motion without meaning.
- The `Geist Pixel Circle` vs `Geist Pixel Square` fonts are used inconsistently: Studio Landing h1 uses `font-['Geist_Pixel_Circle']` as an inline class while the rest of the app uses `Geist Pixel Square`. This may be intentional for differentiation but should be explicit in the design system.
- The `tailwind.config.js` token `--color-white: #e4e4db` is named "white" but it's a warm off-white. The naming creates confusion when debugging. Rename to `--color-cream` or `--color-off-white` to match what it actually is.
- `App.css` appears to contain leftover scaffolding from the Vite/React template (`.hero`, `#next-steps`, `#docs`, `#spacer` classes). None of these appear in actual components. Dead CSS adds confusion.

---

## Questions to Consider

- "The main tool is a pixel/retro tool. Studio is a professional brand asset generator. Are these serving the same user — or is Chng trying to be two different products that happen to share a domain?"
- "What happens between 'file processing fails' and 'user knows why'? Is there a real error path or just a red icon?"
- "The mobile footer is hidden entirely. What does a mobile user need at the bottom of the screen that the desktop user gets?"
