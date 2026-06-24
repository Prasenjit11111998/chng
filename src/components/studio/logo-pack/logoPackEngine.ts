// ── Logo Pack Engine ─────────────────────────────────────────────────────────
// All processing is client-side. No network calls. No uploads.
// Produces: PNGs (via Canvas), SVGs (via DOM manipulation), ICO, JSON, XML, ZIP.

import { downloadZip } from 'client-zip';
import type { LogoPackState, OutputSpec } from './types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Load an image from a src URL into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw a logo image centred + padded onto a canvas with the given bg color. */
function drawLogoOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  bgColor: string,
  paddingFactor = 0.15,
  borderRadius = 0,
) {
  // Background
  if (borderRadius > 0) {
    ctx.beginPath();
    ctx.moveTo(borderRadius, 0);
    ctx.lineTo(canvasW - borderRadius, 0);
    ctx.arcTo(canvasW, 0, canvasW, borderRadius, borderRadius);
    ctx.lineTo(canvasW, canvasH - borderRadius);
    ctx.arcTo(canvasW, canvasH, canvasW - borderRadius, canvasH, borderRadius);
    ctx.lineTo(borderRadius, canvasH);
    ctx.arcTo(0, canvasH, 0, canvasH - borderRadius, borderRadius);
    ctx.lineTo(0, borderRadius);
    ctx.arcTo(0, 0, borderRadius, 0, borderRadius);
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Logo
  const pad = Math.min(canvasW, canvasH) * paddingFactor;
  const maxW = canvasW - pad * 2;
  const maxH = canvasH - pad * 2;
  const ratio = img.naturalWidth / img.naturalHeight;
  let lw = maxW, lh = maxH;
  if (ratio > maxW / maxH) { lh = maxW / ratio; } else { lw = maxH * ratio; }
  const lx = (canvasW - lw) / 2;
  const ly = (canvasH - lh) / 2;
  ctx.drawImage(img, lx, ly, lw, lh);
}

/** Get a canvas PNG blob. */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas toBlob failed'));
      blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
    }, 'image/png');
  });
}

/** Make a canvas at exact size. */
function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

// ── SVG Colour Rewriting ─────────────────────────────────────────────────────

/**
 * Recolour all fill/stroke attributes in an SVG string.
 * Replaces any colour that is not 'none' or 'transparent' with `newColor`.
 */
export function recolorSvg(svgText: string, newColor: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const root = doc.documentElement;

  const walk = (el: Element) => {
    // Attribute-level fill/stroke
    ['fill', 'stroke'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && val !== 'none' && val !== 'transparent') {
        el.setAttribute(attr, newColor);
      }
    });

    // Inline style
    const style = el.getAttribute('style');
    if (style) {
      const updated = style
        .replace(/fill\s*:\s*([^;]+)/gi, (_, v) =>
          v.trim() === 'none' || v.trim() === 'transparent' ? `fill:${v}` : `fill:${newColor}`)
        .replace(/stroke\s*:\s*([^;]+)/gi, (_, v) =>
          v.trim() === 'none' || v.trim() === 'transparent' ? `stroke:${v}` : `stroke:${newColor}`);
      el.setAttribute('style', updated);
    }

    // Also handle <style> blocks (basic, handles class-level fills)
    if (el.tagName === 'style') {
      el.textContent = (el.textContent || '').replace(
        /fill\s*:\s*#[0-9a-fA-F]{3,6}|fill\s*:\s*rgba?\([^)]+\)/g,
        `fill:${newColor}`
      );
    }

    for (const child of Array.from(el.children)) walk(child);
  };
  walk(root);

  return new XMLSerializer().serializeToString(doc);
}

/** Upscale SVG width/height dimensions for crisp canvas rendering */
export function upscaleSvgText(svgText: string, targetSize = 2000): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const root = doc.documentElement;

    let viewBox = root.getAttribute('viewBox');
    if (!viewBox) {
      const wAttr = root.getAttribute('width');
      const hAttr = root.getAttribute('height');
      if (wAttr && hAttr) {
        const wVal = parseFloat(wAttr);
        const hVal = parseFloat(hAttr);
        if (!isNaN(wVal) && !isNaN(hVal)) {
          viewBox = `0 0 ${wVal} ${hVal}`;
          root.setAttribute('viewBox', viewBox);
        }
      }
    }

    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
        const vbW = parts[2];
        const vbH = parts[3];
        const ratio = vbW / vbH;
        if (ratio > 1) {
          root.setAttribute('width', String(targetSize));
          root.setAttribute('height', String(Math.round(targetSize / ratio)));
        } else {
          root.setAttribute('height', String(targetSize));
          root.setAttribute('width', String(Math.round(targetSize * ratio)));
        }
        return new XMLSerializer().serializeToString(doc);
      }
    }

    // Fallback if no viewBox and no width/height
    root.setAttribute('width', String(targetSize));
    root.setAttribute('height', String(targetSize));
    return new XMLSerializer().serializeToString(doc);
  } catch (e) {
    console.warn('Failed to upscale SVG text', e);
    return svgText;
  }
}

/** Convert recoloured SVG text to a data URL for loading as an image. */
export function svgTextToDataUrl(svgText: string): string {
  const upscaled = upscaleSvgText(svgText, 2000);
  const blob = new Blob([upscaled], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

// ── ICO Generation ───────────────────────────────────────────────────────────

/**
 * Build a multi-size ICO file from an array of [size, PNGBytes] pairs.
 * Uses the simpler PNG-embedded ICO format (supported since Windows Vista+).
 */
function buildIco(entries: Array<{ size: number; pngBytes: Uint8Array }>): Uint8Array {
  const count = entries.length;
  // ICO header: 6 bytes
  // Directory entries: 16 bytes each
  const headerSize = 6 + 16 * count;
  let dataOffset = headerSize;

  // Write header
  const header = new DataView(new ArrayBuffer(headerSize));
  header.setUint16(0, 0, true);   // Reserved
  header.setUint16(2, 1, true);   // Type: ICO
  header.setUint16(4, count, true);

  for (let i = 0; i < count; i++) {
    const { size, pngBytes } = entries[i];
    const dirOffset = 6 + i * 16;
    header.setUint8(dirOffset + 0, size === 256 ? 0 : size);  // width
    header.setUint8(dirOffset + 1, size === 256 ? 0 : size);  // height
    header.setUint8(dirOffset + 2, 0);   // colour count
    header.setUint8(dirOffset + 3, 0);   // reserved
    header.setUint16(dirOffset + 4, 1, true);  // colour planes
    header.setUint16(dirOffset + 6, 32, true); // bits per pixel
    header.setUint32(dirOffset + 8, pngBytes.length, true);
    header.setUint32(dirOffset + 12, dataOffset, true);
    dataOffset += pngBytes.length;
  }

  const totalSize = dataOffset;
  const out = new Uint8Array(totalSize);
  out.set(new Uint8Array(header.buffer), 0);
  let offset = headerSize;
  for (const { pngBytes } of entries) {
    out.set(pngBytes, offset);
    offset += pngBytes.length;
  }
  return out;
}

// ── OG Image Drawing ─────────────────────────────────────────────────────────

async function drawOgImage(
  img: HTMLImageElement,
  w: number, h: number,
  state: LogoPackState,
): Promise<Uint8Array> {
  const [canvas, ctx] = makeCanvas(w, h);

  // Background
  ctx.fillStyle = state.primaryColor;
  ctx.fillRect(0, 0, w, h);

  if (state.ogFit === 'centered') {
    // Centered layout: center logo horizontally and vertically, no text
    const padX = w * 0.2;
    const padY = h * 0.2;
    const maxW = w - padX * 2;
    const maxH = h - padY * 2;
    const ratio = img.naturalWidth / img.naturalHeight;
    let lw = maxW, lh = maxH;
    if (ratio > maxW / maxH) {
      lh = maxW / ratio;
    } else {
      lw = maxH * ratio;
    }
    const lx = (w - lw) / 2;
    const ly = (h - lh) / 2;
    ctx.drawImage(img, lx, ly, lw, lh);
  } else {
    // Padded layout: logo on top, text at bottom
    const padX = w * 0.1;
    const padY = h * 0.15;
    const maxW = w - padX * 2;
    const maxH = h * 0.55;
    const ratio = img.naturalWidth / img.naturalHeight;
    let lw = maxW, lh = maxH;
    if (ratio > maxW / maxH) {
      lh = maxW / ratio;
    } else {
      lw = maxH * ratio;
    }
    const lx = (w - lw) / 2;
    const ly = padY + (maxH - lh) / 2;
    ctx.drawImage(img, lx, ly, lw, lh);

    // Project name & Tagline
    const nameY = h * 0.73;
    if (state.projectName && state.ogTagline) {
      // Both project name and tagline
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `bold ${Math.round(h * 0.075)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.projectName, w / 2, nameY);

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `normal ${Math.round(h * 0.048)}px sans-serif`;
      ctx.fillText(state.ogTagline, w / 2, nameY + h * 0.11);
    } else if (state.projectName) {
      // Only project name
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `bold ${Math.round(h * 0.075)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.projectName, w / 2, nameY);
    } else if (state.ogTagline) {
      // Only tagline
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `normal ${Math.round(h * 0.056)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.ogTagline, w / 2, nameY);
    }

    // URL hint
    if (state.projectName) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = `${Math.round(h * 0.028)}px monospace`;
      ctx.fillText(state.projectName.toLowerCase().replace(/\s+/g, '') + '.com', w / 2, h * 0.92);
    }
  }

  return canvasToBlob(canvas);
}

// ── Manifest Generators ───────────────────────────────────────────────────────

function buildWebManifest(state: LogoPackState): string {
  const manifest = {
    name: state.projectName,
    short_name: state.projectName.split(' ')[0],
    description: `${state.projectName} web application`,
    start_url: '/',
    display: 'standalone',
    background_color: state.backgroundColor,
    theme_color: state.primaryColor,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ...(state.includeMaskableIcon
        ? [{ src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
        : []),
    ],
  };
  return JSON.stringify(manifest, null, 2);
}

function buildBrowserConfig(state: LogoPackState): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icon-192.png"/>
      <TileColor>${state.primaryColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
}

// ── Progress Callback ─────────────────────────────────────────────────────────

export type ProgressCallback = (step: string, pct: number) => void;

// ── Main Export Engine ────────────────────────────────────────────────────────

export async function generateLogoPack(
  state: LogoPackState,
  specs: OutputSpec[],
  onProgress: ProgressCallback,
): Promise<void> {
  if (!state.logoSrc) throw new Error('No logo uploaded');

  const isSvg = state.inputMode === 'svg';
  const svgText = state.logoSvgText;

  // fileEntries accumulates { name, input } for client-zip
  const fileEntries: Array<{ name: string; input: Uint8Array | string }> = [];
  const enc = new TextEncoder();

  // ── Prepare recoloured SVG variants (if SVG input) ──
  let darkSvgUrl: string | null = null;
  let lightSvgUrl: string | null = null;

  if (isSvg && svgText) {
    const darkSvg = recolorSvg(svgText, state.darkFillColor);
    const lightSvg = recolorSvg(svgText, state.lightFillColor);
    darkSvgUrl = svgTextToDataUrl(darkSvg);
    lightSvgUrl = svgTextToDataUrl(lightSvg);
  }

  const enabledSpecs = specs.filter(s => s.enabled);
  const total = enabledSpecs.length + 3; // +3 for prepare/zip/done
  let done = 0;

  const step = (label: string) => {
    done++;
    onProgress(label, Math.round((done / total) * 100));
  };

  step('Preparing logo assets…');

  // Load base image (original for raster outputs)
  const baseImg = await loadImage(state.logoSrc);
  // Load dark/light variants for recoloured PNG outputs
  const darkImg = darkSvgUrl ? await loadImage(darkSvgUrl) : baseImg;
  const lightImg = lightSvgUrl ? await loadImage(lightSvgUrl) : baseImg;

  // ── Generate each file ──
  for (const spec of enabledSpecs) {
    step(`Generating ${spec.label}…`);

    // ── SVG outputs ──
    if (spec.format === 'SVG' && isSvg && svgText) {
      let svgOut = svgText;
      if (spec.id === 'favicon-svg') {
        // Favicon SVG: use dark variant (renders on light browser tabs)
        svgOut = recolorSvg(svgText, state.darkFillColor);
      } else if (spec.id === 'logo-dark-svg') {
        svgOut = recolorSvg(svgText, state.darkFillColor);
      } else if (spec.id === 'logo-light-svg') {
        svgOut = recolorSvg(svgText, state.lightFillColor);
      } else if (spec.id === 'logo-mono-black-svg') {
        svgOut = recolorSvg(svgText, state.monoBlackColor);
      } else if (spec.id === 'logo-mono-white-svg') {
        svgOut = recolorSvg(svgText, state.monoWhiteColor);
      }
      fileEntries.push({ name: `logo-pack/${spec.filename}`, input: svgOut });
      continue;
    }

    // ── ICO output ──
    if (spec.id === 'favicon-ico') {
      const icoSizes = [16, 32, 48];
      const entries = await Promise.all(icoSizes.map(async sz => {
        const [c, ctx] = makeCanvas(sz, sz);
        ctx.drawImage(darkImg, 0, 0, sz, sz);
        const png = await canvasToBlob(c);
        return { size: sz, pngBytes: png };
      }));
      fileEntries.push({ name: `logo-pack/${spec.filename}`, input: buildIco(entries) });
      continue;
    }

    // ── JSON / XML meta files ──
    if (spec.id === 'webmanifest') {
      fileEntries.push({ name: `logo-pack/${spec.filename}`, input: enc.encode(buildWebManifest(state)) });
      continue;
    }
    if (spec.id === 'browserconfig') {
      fileEntries.push({ name: `logo-pack/${spec.filename}`, input: enc.encode(buildBrowserConfig(state)) });
      continue;
    }

    // ── PNG outputs ──
    if (spec.format === 'PNG') {
      const w = spec.width ?? 512;
      const h = spec.height ?? spec.width ?? 512;

      // OG / Social images
      if (spec.id === 'og-image' || spec.id === 'twitter-card') {
        const bytes = await drawOgImage(baseImg, w, h, state);
        fileEntries.push({ name: `logo-pack/${spec.filename}`, input: bytes });
        continue;
      }

      // Maskable icon (logo centred in safe zone with primary bg)
      if (spec.id === 'pwa-maskable') {
        const [canvas, ctx] = makeCanvas(w, h);
        const r = Math.round(w * 0.1875); // 20% rounded corners
        drawLogoOnCanvas(ctx, darkImg, w, h, state.primaryColor, 0.25, r);
        fileEntries.push({ name: `logo-pack/${spec.filename}`, input: await canvasToBlob(canvas) });
        continue;
      }

      // Apple touch icon (rounded, white bg)
      if (spec.id === 'apple-touch') {
        const [canvas, ctx] = makeCanvas(w, h);
        const r = Math.round(w * 0.2);
        drawLogoOnCanvas(ctx, darkImg, w, h, state.primaryColor, 0.18, r);
        fileEntries.push({ name: `logo-pack/${spec.filename}`, input: await canvasToBlob(canvas) });
        continue;
      }

      // Small favicons (transparent or primary bg)
      if (spec.category === 'favicon') {
        const [canvas, ctx] = makeCanvas(w, h);
        drawLogoOnCanvas(ctx, darkImg, w, h, state.primaryColor, 0.1);
        fileEntries.push({ name: `logo-pack/${spec.filename}`, input: await canvasToBlob(canvas) });
        continue;
      }

      // PWA icons (primary bg, logo centred)
      if (spec.category === 'apple-pwa') {
        const [canvas, ctx] = makeCanvas(w, h);
        drawLogoOnCanvas(ctx, darkImg, w, h, state.primaryColor, 0.15);
        fileEntries.push({ name: `logo-pack/${spec.filename}`, input: await canvasToBlob(canvas) });
        continue;
      }

      // Logo PNG variants
      if (spec.category === 'logo-png') {
        const isLight = spec.id.includes('light');
        const srcImg = isLight ? lightImg : darkImg;
        const bgColor = isLight ? state.backgroundColor : '#0d0d0f';
        const nativeRatio = srcImg.naturalWidth / srcImg.naturalHeight;
        const pngH = Math.round(w / nativeRatio);
        const [canvas, ctx] = makeCanvas(w, pngH);
        drawLogoOnCanvas(ctx, srcImg, w, pngH, bgColor, 0.08);
        fileEntries.push({ name: `logo-pack/${spec.filename}`, input: await canvasToBlob(canvas) });
        continue;
      }
    }
  }

  // ── Add README.md ──
  step('Packing ZIP…');
  const readme = `# Logo Pack — ${state.projectName}

Generated by Chng Studio · https://chng.sh/studio
All files are client-side generated. No data was uploaded.

## Favicons
Place in your public/ or static/ root:
- favicon.ico       — Legacy browsers (16/32/48px multi-size)
- favicon.svg       — Modern browsers
- favicon-16x16.png — Fallback
- favicon-32x32.png — Fallback

## HTML <head> snippet
\`\`\`html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${state.primaryColor}">

<!-- Open Graph -->
<meta property="og:image" content="/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="/twitter-card.png">
\`\`\`
`;
  fileEntries.push({ name: 'logo-pack/README.md', input: new TextEncoder().encode(readme) });

  // ── Zip everything ──
  const safeName = (state.projectName || 'logo-pack').toLowerCase().replace(/\s+/g, '-');
  const zipBlob = await downloadZip(
    fileEntries.map(e => new File(
      [e.input instanceof Uint8Array ? new Blob([e.input.buffer as ArrayBuffer]) : e.input],
      e.name,
    ))
  ).blob();
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-logo-pack.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  // Cleanup blob URLs
  if (darkSvgUrl) URL.revokeObjectURL(darkSvgUrl);
  if (lightSvgUrl) URL.revokeObjectURL(lightSvgUrl);

  step('Done!');
  onProgress('Done!', 100);
}

// ── Preview thumbnail generator ──────────────────────────────────────────────

/**
 * Render a preview thumbnail (small canvas) for a given output spec.
 * Returns a data URL for use as <img src>.
 */
export async function renderPreviewThumbnail(
  spec: OutputSpec,
  state: LogoPackState,
  baseImg: HTMLImageElement | null,
  overrideBg?: 'light' | 'dark',
): Promise<string> {
  if (!baseImg || !spec.enabled) return '';

  const isSocial = spec.category === 'social';
  const PREVIEW_SIZE = isSocial ? 800 : 400;

  // Load the correct variant image if SVG input is available (don't recolour social cards)
  let activeImg = baseImg;
  if (state.inputMode === 'svg' && state.logoSvgText && !isSocial) {
    let fillColor = state.darkFillColor; // Default
    if (spec.id.includes('light')) {
      fillColor = state.lightFillColor;
    } else if (spec.id.includes('mono-black')) {
      fillColor = state.monoBlackColor;
    } else if (spec.id.includes('mono-white')) {
      fillColor = state.monoWhiteColor;
    } else if (spec.id.includes('dark')) {
      fillColor = state.darkFillColor;
    }
    
    try {
      const recoloredSvg = recolorSvg(state.logoSvgText, fillColor);
      const dataUrl = svgTextToDataUrl(recoloredSvg);
      activeImg = await loadImage(dataUrl);
      // Revoke later to avoid leaks
      setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
    } catch (e) {
      console.warn('Failed to load recolored SVG for preview', e);
      activeImg = baseImg;
    }
  }

  // Determine card background color (ensure high contrast default)
  const getDefaultBg = () => {
    if (spec.id.includes('light') || spec.id.includes('mono-black')) {
      return state.backgroundColor;
    }
    return '#0d0d0f';
  };
  const bgColor = overrideBg === 'light' ? state.backgroundColor : overrideBg === 'dark' ? '#0d0d0f' : getDefaultBg();

  if (spec.format === 'SVG' || spec.category === 'logo-svg') {
    const [canvas, ctx] = makeCanvas(PREVIEW_SIZE, PREVIEW_SIZE);
    drawLogoOnCanvas(ctx, activeImg, PREVIEW_SIZE, PREVIEW_SIZE, bgColor, 0.12);
    return canvas.toDataURL('image/png');
  }

  if (isSocial) {
    const w = spec.width ?? 1200;
    const h = spec.height ?? 630;
    const [canvas, ctx] = makeCanvas(w, h);

    // Background
    ctx.fillStyle = state.primaryColor;
    ctx.fillRect(0, 0, w, h);

    if (state.ogFit === 'centered') {
      // Centered layout: center logo horizontally and vertically, no text
      const padX = w * 0.2;
      const padY = h * 0.2;
      const maxW = w - padX * 2;
      const maxH = h - padY * 2;
      const ratio = activeImg.naturalWidth / activeImg.naturalHeight;
      let lw = maxW, lh = maxH;
      if (ratio > maxW / maxH) {
        lh = maxW / ratio;
      } else {
        lw = maxH * ratio;
      }
      const lx = (w - lw) / 2;
      const ly = (h - lh) / 2;
      ctx.drawImage(activeImg, lx, ly, lw, lh);
    } else {
      // Padded layout: logo on top, text at bottom
      const padX = w * 0.1;
      const padY = h * 0.15;
      const maxW = w - padX * 2;
      const maxH = h * 0.55;
      const ratio = activeImg.naturalWidth / activeImg.naturalHeight;
      let lw = maxW, lh = maxH;
      if (ratio > maxW / maxH) {
        lh = maxW / ratio;
      } else {
        lw = maxH * ratio;
      }
      const lx = (w - lw) / 2;
      const ly = padY + (maxH - lh) / 2;
      ctx.drawImage(activeImg, lx, ly, lw, lh);

      // Project name & Tagline
      const nameY = h * 0.73;
      if (state.projectName && state.ogTagline) {
        // Both project name and tagline
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = `bold ${Math.round(h * 0.075)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.projectName, w / 2, nameY);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `normal ${Math.round(h * 0.048)}px sans-serif`;
        ctx.fillText(state.ogTagline, w / 2, nameY + h * 0.11);
      } else if (state.projectName) {
        // Only project name
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = `bold ${Math.round(h * 0.075)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.projectName, w / 2, nameY);
      } else if (state.ogTagline) {
        // Only tagline
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = `normal ${Math.round(h * 0.056)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.ogTagline, w / 2, nameY);
      }

      // URL hint
      if (state.projectName) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = `${Math.round(h * 0.028)}px monospace`;
        ctx.fillText(state.projectName.toLowerCase().replace(/\s+/g, '') + '.com', w / 2, h * 0.92);
      }
    }

    return canvas.toDataURL('image/png');
  }

  if (spec.id === 'pwa-maskable') {
    const [canvas, ctx] = makeCanvas(PREVIEW_SIZE, PREVIEW_SIZE);
    const r = Math.round(PREVIEW_SIZE * 0.1875);
    drawLogoOnCanvas(ctx, activeImg, PREVIEW_SIZE, PREVIEW_SIZE, state.primaryColor, 0.25, r);
    return canvas.toDataURL('image/png');
  }

  if (spec.id === 'apple-touch') {
    const [canvas, ctx] = makeCanvas(PREVIEW_SIZE, PREVIEW_SIZE);
    const r = Math.round(PREVIEW_SIZE * 0.2);
    drawLogoOnCanvas(ctx, activeImg, PREVIEW_SIZE, PREVIEW_SIZE, state.primaryColor, 0.18, r);
    return canvas.toDataURL('image/png');
  }

  if (spec.category === 'favicon') {
    const [canvas, ctx] = makeCanvas(PREVIEW_SIZE, PREVIEW_SIZE);
    drawLogoOnCanvas(ctx, activeImg, PREVIEW_SIZE, PREVIEW_SIZE, state.primaryColor, 0.1);
    return canvas.toDataURL('image/png');
  }

  if (spec.category === 'logo-png') {
    const [canvas, ctx] = makeCanvas(PREVIEW_SIZE, PREVIEW_SIZE);
    drawLogoOnCanvas(ctx, activeImg, PREVIEW_SIZE, PREVIEW_SIZE, bgColor, 0.08);
    return canvas.toDataURL('image/png');
  }

  // Default: primary bg
  const [canvas, ctx] = makeCanvas(PREVIEW_SIZE, PREVIEW_SIZE);
  drawLogoOnCanvas(ctx, activeImg, PREVIEW_SIZE, PREVIEW_SIZE, state.primaryColor, 0.15);
  return canvas.toDataURL('image/png');
}
