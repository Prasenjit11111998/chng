// PDF export orchestrator — lazy-loads @react-pdf/renderer only when called.
// This module is NOT imported at app startup.

import React from 'react';
import type { BrandData, BrandLogos, ExportSettings } from './types';
import { registerPDFFonts, registerCustomFontFile, registeredFonts } from './googleFonts';

// ─── SVG → PNG Conversion ─────────────────────────────────────────────────────

/**
 * Helper to parse width/height or viewBox from SVG data URL to preserve correct aspect ratio.
 */
function getSvgDimensionsFromDataUrl(dataUrl: string): { width: number; height: number } | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;

    const isBase64 = parts[0].includes('base64');
    let svgContent = '';
    if (isBase64) {
      svgContent = atob(parts[1]);
    } else {
      svgContent = decodeURIComponent(parts[1]);
    }

    const svgTagMatch = svgContent.match(/<svg[^>]*>/i);
    if (!svgTagMatch) return null;
    const svgTag = svgTagMatch[0];

    const widthMatch = svgTag.match(/width=["']([^"']+)["']/i);
    const heightMatch = svgTag.match(/height=["']([^"']+)["']/i);

    let width = widthMatch ? parseFloat(widthMatch[1]) : NaN;
    let height = heightMatch ? parseFloat(heightMatch[1]) : NaN;

    if (!isNaN(width) && !isNaN(height)) return { width, height };

    const viewBoxMatch = svgTag.match(/viewBox=["']([^"']+)["']/i);
    if (viewBoxMatch) {
      const coords = viewBoxMatch[1].trim().split(/\s+/);
      if (coords.length === 4) {
        const vbWidth = parseFloat(coords[2]);
        const vbHeight = parseFloat(coords[3]);
        if (!isNaN(vbWidth) && !isNaN(vbHeight)) return { width: vbWidth, height: vbHeight };
      }
    }
  } catch (err) {
    console.error('[Studio] Failed to parse SVG dimensions:', err);
  }
  return null;
}

/**
 * Converts an SVG Data URL to a PNG Data URL using HTML5 Canvas.
 * Returns the original string if it is not an SVG Data URL.
 */
async function svgDataUrlToPng(dataUrl: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/svg+xml')) return dataUrl;

  return new Promise((resolve) => {
    const img = new window.Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }

        let width = img.naturalWidth || img.width || 0;
        let height = img.naturalHeight || img.height || 0;

        if (width === 0 || height === 0) {
          const parsed = getSvgDimensionsFromDataUrl(dataUrl);
          if (parsed) { width = parsed.width; height = parsed.height; }
          else { width = 400; height = 400; }
        }

        const maxDimension = 1200;
        const aspectRatio = width / height;
        if (width > maxDimension || height > maxDimension) {
          if (aspectRatio > 1) { width = maxDimension; height = maxDimension / aspectRatio; }
          else { height = maxDimension; width = maxDimension * aspectRatio; }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('[Studio] SVG to PNG conversion failed:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = (err) => {
      console.error('[Studio] SVG image loading failed for conversion:', err);
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Convert any SVG logos in BrandData to PNGs so that @react-pdf/renderer can draw them.
 */
async function processLogos(logos: BrandLogos): Promise<BrandLogos> {
  const processed: BrandLogos = { ...logos };
  const keys: (keyof BrandLogos)[] = ['primary', 'dark', 'light', 'icon'];

  await Promise.all(
    keys.map(async (key) => {
      const val = logos[key];
      if (val) processed[key] = await svgDataUrlToPng(val);
    })
  );

  return processed;
}

// ─── Font Resolution ──────────────────────────────────────────────────────────

/**
 * Resolves the final font family name to use in the PDF.
 * Returns the user's chosen font if registered, else falls back to 'Helvetica'.
 */
function resolveFontFamily(fontName: string): string {
  if (!fontName) return 'Helvetica';
  const match = Array.from(registeredFonts).find(
    (f) => f.toLowerCase() === fontName.toLowerCase()
  );
  return match || 'Helvetica';
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Generate a brand guidelines PDF and trigger browser download.
 * Lazily imports @react-pdf/renderer so it doesn't affect the initial bundle.
 */
export async function generatePDF(data: BrandData, settings: ExportSettings): Promise<void> {
  // 1. Register fonts — custom uploaded files take priority over Google Fonts
  const { headingFont, bodyFont, headingFontFile, bodyFontFile } = data.typography;

  await Promise.all([
    headingFont
      ? headingFontFile
        ? registerCustomFontFile(headingFont, headingFontFile)
        : registerPDFFonts([headingFont])
      : Promise.resolve(),
    bodyFont
      ? bodyFontFile
        ? registerCustomFontFile(bodyFont, bodyFontFile)
        : registerPDFFonts([bodyFont])
      : Promise.resolve(),
  ]);

  // 2. Resolve final font families (post-registration — eliminates the race condition)
  const resolvedFonts = {
    heading: resolveFontFamily(headingFont),
    body: resolveFontFamily(bodyFont),
  };

  // 3. Preprocess SVG logos to PNG
  const processedLogos = await processLogos(data.logos);
  const processedData = { ...data, logos: processedLogos };

  // 4. Lazy-import renderer + document
  const [{ pdf }, { BrandPDFDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../../components/studio/brand-guidelines/pdf/PDFDocument'),
  ]);

  // 5. Render to blob
  const element = React.createElement(BrandPDFDocument, {
    data: processedData,
    themeName: settings.theme,
    sectionOrder: settings.sectionOrder,
    resolvedFonts,
  }) as unknown as Parameters<typeof pdf>[0];
  const blob = await pdf(element).toBlob();

  // 6. Trigger download
  const filename = `${(data.brandName || 'brand').toLowerCase().replace(/\s+/g, '-')}-brand-guidelines.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
