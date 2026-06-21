---
target: Studio Landing Page
total_score: 27
p0_count: 1
p1_count: 1
timestamp: 2026-06-14T08-31-15Z
slug: src-components-studio-studiolanding-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Status badges are clear |
| 2 | Match System / Real World | 2 | Tonal mismatch: Pixelated "retro" font vs premium brand goal |
| 3 | User Control and Freedom | 4 | Easy exit via back button |
| 4 | Consistency and Standards | 1 | Complete disconnect from the "Studio Hornbill" Vercel-like aesthetic |
| 5 | Error Prevention | 3 | Inactive cards are correctly disabled |
| 6 | Recognition Rather Than Recall | 3 | Tools are clearly labeled |
| 7 | Flexibility and Efficiency | 3 | Straightforward landing, no deep navigation required |
| 8 | Aesthetic and Minimalist Design | 1 | Brutalist, sparse, unanchored elements instead of intentional minimalism |
| 9 | Error Recovery | 4 | Simple routing |
| 10 | Help and Documentation | 3 | Self-explanatory cards |
| **Total** | | **27/40** | **Needs Refinement** |

#### Anti-Patterns Verdict

**LLM assessment**: The landing page suffers from severe conceptual drift. It looks like a brutalist Web3 template (pixelated headers, harsh borders, floating black buttons) rather than the "Vercel, Linear, Raycast" premium aesthetic the PDF generator was just modeled after. The layout feels sparse and unanchored rather than minimal.

**Deterministic scan**: No programmatic or DOM-level defects were found by the automated scanner (`detect.mjs` returned 0 findings). This confirms the issues are entirely design, layout, and tonal execution.

**Visual overlays**: N/A (no programmatic defects to highlight).

#### Overall Impression
The page functions correctly, but it completely misses the mark tonally. It feels like a rough prototype rather than the gateway to a premium "Studio" product. The single biggest opportunity is bringing the typography, spacing, and card layouts in line with the high-end, polished aesthetic of the PDF generator itself.

#### What's Working
- **Clear Statuses**: It's immediately obvious which tool is available and which are coming soon.
- **Simple Navigation**: The escape hatch (back button) is clear.

#### Priority Issues

- **[P0] Tonal Disconnect**: The pixelated "Studio." font and harsh layout clash with the intended premium, clean, Linear-inspired aesthetic.
  - *Why it matters*: Users expecting a high-end brand tool will bounce if the lobby looks like a retro toy.
  - *Fix*: Replace the pixelated font with Geist, tighten the hero typography, and adopt the sleek dark/light minimal tokens used in the generator.
  - *Suggested command*: `/impeccable shape` or `/impeccable polish`

- **[P1] Broken Card Layout & Hierarchy**: "Brand Guidelines Generator" wraps awkwardly, and the heavy black "Open Tool ->" button overpowers the card content.
  - *Why it matters*: It makes the cards hard to scan and feels unpolished.
  - *Fix*: Lock the card layout to a strict grid, use subtle glass/border effects for the card container, and make the entire card clickable (or use a subtler CTA) instead of a massive button block.
  - *Suggested command*: `/impeccable layout`

- **[P2] Confusing Badge Styling**: The "AVAILABLE" and "COMING SOON" badges look like interactive buttons.
  - *Why it matters*: Users might click them expecting an action, leading to minor friction.
  - *Fix*: Remove the heavy borders from badges. Use pure typographic hierarchy (e.g., uppercase, smaller font, muted color) or subtle background tints.
  - *Suggested command*: `/impeccable distill`

#### Persona Red Flags

**Alex (Power User)**: Expects a high-performance, polished dashboard like Vercel. Will see the retro font and assume this is a toy, immediately degrading trust in the quality of the generated PDFs.

**Taylor (Design System Manager)**: Looks for rigorous alignment and typographic perfection. The awkward text wrapping on the first card and floating, unanchored badges will make them doubt the tool's ability to enforce rigorous brand guidelines.

#### Minor Observations
- The "Chng Studio · Client-side. No uploads. No accounts." footer feels like an afterthought. It should be anchored properly.
- The eyebrow "Chng" above "Studio." is tiny and floating too far away.

#### Questions to Consider
- If the PDF export is a premium, print-ready "Studio Hornbill" brand book, shouldn't the lobby look like the agency that printed it?
- Does the "Open Tool" button need to be that loud, or can the whole card act as a sleek interactive surface?
