// ─── Google Fonts Utilities ───────────────────────────────────────────────────
// Handles both browser font injection (for live preview) and
// @react-pdf/renderer font registration (for PDF generation).

/** Injected font names — avoid duplicate style tags */
const injectedWebFonts = new Set<string>();

/** Set of successfully registered fonts for PDF rendering */
export const registeredFonts = new Set<string>([
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
  'Symbol',
  'ZapfDingbats'
]);

/**
 * Checks if a font is registered or is a standard PDF built-in font.
 */
export function isFontRegistered(fontName: string): boolean {
  if (!fontName) return false;
  const standardFonts = [
    'helvetica',
    'helvetica-bold',
    'helvetica-oblique',
    'helvetica-boldoblique',
    'times-roman',
    'times-bold',
    'times-italic',
    'times-bolditalic',
    'courier',
    'courier-bold',
    'courier-oblique',
    'courier-boldoblique',
    'symbol',
    'zapfdingbats'
  ];
  if (standardFonts.includes(fontName.toLowerCase())) return true;
  return Array.from(registeredFonts).some((f) => f.toLowerCase() === fontName.toLowerCase());
}

/**
 * Injects a Google Font into the document <head> for browser preview.
 * No-ops if the font has already been injected.
 */
export function injectWebFont(fontName: string): void {
  if (!fontName.trim() || injectedWebFonts.has(fontName)) return;
  injectedWebFonts.add(fontName);

  const id = `gf-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;

  const encoded = encodeURIComponent(fontName);
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

/**
 * Fetches a Google Font's CSS, extracts the TTF URL for each weight,
 * and registers it with @react-pdf/renderer's Font API.
 * Should be called before PDF generation.
 */
export async function registerPDFFont(fontName: string): Promise<void> {
  // Dynamic import — only loaded when PDF generation is triggered
  const { Font } = await import('@react-pdf/renderer');

  // 1. Try google-webfonts-helper API first to get direct TTF links (CORS-friendly, returns TTF)
  const fontId = fontName.trim().toLowerCase().replace(/\s+/g, '-');
  if (fontId) {
    try {
      const apiRes = await fetch(`https://gwfh.mranftl.com/api/fonts/${fontId}`);
      if (apiRes.ok) {
        const fontData = await apiRes.json();
        const variants = fontData.variants || [];
        const sources: { weight: string; url: string }[] = [];

        // Try to find regular weight (400)
        const regularVariant = variants.find(
          (v: any) => v.fontStyle === 'normal' && (v.fontWeight === '400' || v.id === 'regular')
        ) || variants.find((v: any) => v.fontStyle === 'normal');

        // Try to find bold weight (700)
        const boldVariant = variants.find(
          (v: any) => v.fontStyle === 'normal' && (v.fontWeight === '700' || v.id === '700')
        );

        if (regularVariant && regularVariant.ttf) {
          sources.push({ weight: '400', url: regularVariant.ttf });
        }
        if (boldVariant && boldVariant.ttf) {
          sources.push({ weight: '700', url: boldVariant.ttf });
        }

        if (sources.length > 0) {
          Font.register({
            family: fontName,
            fonts: sources.map(({ weight, url }) => ({
              src: url,
              fontWeight: parseInt(weight, 10) as 400 | 700,
            })),
          });
          registeredFonts.add(fontName);
          console.log(`[Studio] Registered PDF font "${fontName}" via google-webfonts-helper API`);
          return;
        }
      }
    } catch (err) {
      console.warn(`[Studio] gwfh API lookup failed for "${fontName}", trying fallback CSS method:`, err);
    }
  }

  // 2. Fallback: Parse Google Fonts CSS API stylesheet (supports ttf and woff, excludes woff2)
  const encoded = encodeURIComponent(fontName);
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;

  try {
    const res = await fetch(cssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
      },
    });
    const css = await res.text();

    const fontFaceBlocks = css.split('@font-face').slice(1);
    const sources: { weight: string; url: string }[] = [];

    for (const block of fontFaceBlocks) {
      if (block.includes('unicode-range') && !block.includes('U+0000-00FF')) continue;
      const weightMatch = block.match(/font-weight:\s*(\d+)/);
      const urlMatch = block.match(/url\(([^)]+\.(?:ttf|woff)(?!2)[^)]*)\)/);
      if (weightMatch && urlMatch) {
        sources.push({ weight: weightMatch[1], url: urlMatch[1].replace(/['"]/g, '') });
      }
    }

    if (sources.length === 0) {
      console.warn(`[Studio] Fallback CSS search found 0 compatible TTF/WOFF urls for "${fontName}"`);
      return;
    }

    Font.register({
      family: fontName,
      fonts: sources.map(({ weight, url }) => ({
        src: url,
        fontWeight: parseInt(weight, 10) as 400 | 700,
      })),
    });
    
    registeredFonts.add(fontName);
    console.log(`[Studio] Registered PDF font "${fontName}" via Fallback CSS method`);
  } catch (err) {
    console.warn(`[Studio] Failed to register PDF font: ${fontName}`, err);
  }
}

/**
 * Registers multiple fonts for PDF generation.
 * Call with both heading and body fonts before generating the PDF.
 */
export async function registerPDFFonts(fontNames: string[]): Promise<void> {
  const unique = [...new Set(fontNames.filter(Boolean))];
  await Promise.all(unique.map(registerPDFFont));
}

/**
 * Registers a custom uploaded font file (base64 data URL) with @react-pdf/renderer.
 * Use this when the user uploads their own .ttf/.otf/.woff font file instead of a Google Font.
 */
export async function registerCustomFontFile(fontName: string, dataUrl: string): Promise<void> {
  try {
    const { Font } = await import('@react-pdf/renderer');
    Font.register({
      family: fontName,
      src: dataUrl,
    });
    registeredFonts.add(fontName);
  } catch (err) {
    console.warn(`[Studio] Failed to register custom font file "${fontName}":`, err);
  }
}

/** Set of custom-injected browser fonts to avoid duplicate FontFace insertion */
const injectedCustomFonts = new Set<string>();

/**
 * Injects a custom uploaded font into the browser for live preview using the FontFace API.
 */
export async function injectCustomWebFont(fontName: string, dataUrl: string): Promise<void> {
  if (!fontName || !dataUrl || injectedCustomFonts.has(fontName)) return;
  injectedCustomFonts.add(fontName);
  try {
    const face = new FontFace(fontName, `url(${dataUrl})`);
    await face.load();
    document.fonts.add(face);
  } catch (err) {
    console.warn(`[Studio] Failed to inject custom web font "${fontName}":`, err);
  }
}
