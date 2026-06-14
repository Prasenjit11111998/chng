// ─── Colour Conversion Utilities ─────────────────────────────────────────────
// Pure functions, zero external dependencies.

export interface RGB { r: number; g: number; b: number; }
export interface HSL { h: number; s: number; l: number; }
export interface CMYK { c: number; m: number; y: number; k: number; }

/** Parse "#RRGGBB" or "#RGB" → RGB object (0-255). Returns null on invalid. */
export function parseHex(hex: string): RGB | null {
  const cleaned = hex.replace('#', '').trim();
  let full = cleaned;
  if (cleaned.length === 3) {
    full = cleaned.split('').map((c) => c + c).join('');
  }
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Ensure hex is always "#RRGGBB" (7 chars). */
export function normalizeHex(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return (
    '#' +
    [rgb.r, rgb.g, rgb.b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function hexToRgb(hex: string): RGB | null {
  return parseHex(hex);
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Standard approximate hex → CMYK conversion. */
export function hexToCmyk(hex: string): CMYK | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

/** Format RGB as display string "232, 52, 43" */
export function formatRgb(rgb: RGB): string {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/** Format HSL as display string "2°, 80%, 54%" */
export function formatHsl(hsl: HSL): string {
  return `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
}

/** Format CMYK as display string "0%, 78%, 81%, 9%" */
export function formatCmyk(cmyk: CMYK): string {
  return `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
}

/** Get derived color strings for a hex value. Returns nulls on invalid hex. */
export function deriveColorStrings(hex: string): {
  rgb: string | null;
  hsl: string | null;
  cmyk: string | null;
} {
  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);
  const cmyk = hexToCmyk(hex);
  return {
    rgb: rgb ? formatRgb(rgb) : null,
    hsl: hsl ? formatHsl(hsl) : null,
    cmyk: cmyk ? formatCmyk(cmyk) : null,
  };
}

/** Returns true if the hex color is visually light (relative luminance > 0.6) */
export function isLightColor(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6;
}
