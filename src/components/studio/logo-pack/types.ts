// ── Logo Pack Generator: Types ────────────────────────────────────────────────

/** Whether the user uploaded an SVG (full feature set) or raster (limited). */
export type InputMode = 'svg' | 'raster' | 'none';

/** Fit mode for the OG image logo placement */
export type OgFit = 'centered' | 'padded';

export interface LogoPackState {
  // ── Input ──
  inputMode: InputMode;
  logoSrc: string | null;          // Object URL
  logoFileName: string;
  logoSvgText: string | null;      // Raw SVG string (only when inputMode === 'svg')

  // ── Brand ──
  projectName: string;
  primaryColor: string;            // Used for maskable icon bg, OG bg
  backgroundColor: string;         // Used for light-variant backgrounds

  // ── Variant colours (SVG recolouring) ──
  darkFillColor: string;           // Logo fill on dark backgrounds
  lightFillColor: string;          // Logo fill on light backgrounds
  monoBlackColor: string;          // '#000000'
  monoWhiteColor: string;          // '#ffffff'

  // ── Package options ──
  includeOgImage: boolean;
  includeMaskableIcon: boolean;
  includeMonoSvgs: boolean;
  includeManifest: boolean;
  includeIco: boolean;

  // ── OG Image options ──
  ogFit: OgFit;
  ogTagline: string;               // Optional tagline shown in OG image
}

/** One output file in the manifest */
export interface OutputSpec {
  id: string;
  filename: string;
  category: 'favicon' | 'apple-pwa' | 'social' | 'logo-svg' | 'logo-png' | 'meta';
  label: string;
  width: number | null;
  height: number | null;
  format: 'SVG' | 'PNG' | 'ICO' | 'JSON' | 'XML';
  /** Whether this file is skipped for raster inputs */
  svgOnly: boolean;
  /** Enabled state based on current LogoPackState toggles */
  enabled: boolean;
}

export const DEFAULT_STATE: LogoPackState = {
  inputMode: 'none',
  logoSrc: null,
  logoFileName: '',
  logoSvgText: null,

  projectName: 'My Project',
  primaryColor: '#e8342b',
  backgroundColor: '#ffffff',

  darkFillColor: '#ffffff',
  lightFillColor: '#0d0d0f',
  monoBlackColor: '#000000',
  monoWhiteColor: '#ffffff',

  includeOgImage: true,
  includeMaskableIcon: true,
  includeMonoSvgs: true,
  includeManifest: true,
  includeIco: true,

  ogFit: 'padded',
  ogTagline: '',
};

/** Build the full manifest of output specs based on current state. */
export function buildOutputSpecs(state: LogoPackState): OutputSpec[] {
  const isSvg = state.inputMode === 'svg';

  const specs: Omit<OutputSpec, 'enabled'>[] = [
    // ── Favicons ──
    ...(state.includeIco ? [{
      id: 'favicon-ico', filename: 'favicon.ico', category: 'favicon' as const,
      label: 'Favicon ICO', width: 48, height: 48, format: 'ICO' as const, svgOnly: false,
    }] : []),
    { id: 'favicon-svg', filename: 'favicon.svg', category: 'favicon', label: 'Favicon SVG', width: null, height: null, format: 'SVG', svgOnly: true },
    { id: 'favicon-16', filename: 'favicon-16x16.png', category: 'favicon', label: 'Favicon 16×16', width: 16, height: 16, format: 'PNG', svgOnly: false },
    { id: 'favicon-32', filename: 'favicon-32x32.png', category: 'favicon', label: 'Favicon 32×32', width: 32, height: 32, format: 'PNG', svgOnly: false },
    { id: 'favicon-48', filename: 'favicon-48x48.png', category: 'favicon', label: 'Favicon 48×48', width: 48, height: 48, format: 'PNG', svgOnly: false },

    // ── Apple / PWA ──
    { id: 'apple-touch', filename: 'apple-touch-icon.png', category: 'apple-pwa', label: 'Apple Touch Icon', width: 180, height: 180, format: 'PNG', svgOnly: false },
    { id: 'pwa-192', filename: 'icon-192.png', category: 'apple-pwa', label: 'PWA Icon 192', width: 192, height: 192, format: 'PNG', svgOnly: false },
    { id: 'pwa-512', filename: 'icon-512.png', category: 'apple-pwa', label: 'PWA Icon 512', width: 512, height: 512, format: 'PNG', svgOnly: false },
    ...(state.includeMaskableIcon ? [{
      id: 'pwa-maskable', filename: 'icon-maskable-512.png', category: 'apple-pwa' as const,
      label: 'Maskable Icon 512', width: 512, height: 512, format: 'PNG' as const, svgOnly: false,
    }] : []),

    // ── Social ──
    ...(state.includeOgImage ? [
      { id: 'og-image', filename: 'og-image.png', category: 'social' as const, label: 'Open Graph Image', width: 1200, height: 630, format: 'PNG' as const, svgOnly: false },
      { id: 'twitter-card', filename: 'twitter-card.png', category: 'social' as const, label: 'Twitter Card', width: 1200, height: 628, format: 'PNG' as const, svgOnly: false },
    ] : []),

    // ── SVG Variants ──
    { id: 'logo-dark-svg', filename: 'logo-dark.svg', category: 'logo-svg', label: 'Logo — Dark bg', width: null, height: null, format: 'SVG', svgOnly: true },
    { id: 'logo-light-svg', filename: 'logo-light.svg', category: 'logo-svg', label: 'Logo — Light bg', width: null, height: null, format: 'SVG', svgOnly: true },
    ...(state.includeMonoSvgs ? [
      { id: 'logo-mono-black-svg', filename: 'logo-mono-black.svg', category: 'logo-svg' as const, label: 'Logo — Mono Black', width: null, height: null, format: 'SVG' as const, svgOnly: true },
      { id: 'logo-mono-white-svg', filename: 'logo-mono-white.svg', category: 'logo-svg' as const, label: 'Logo — Mono White', width: null, height: null, format: 'SVG' as const, svgOnly: true },
    ] : []),

    // ── PNG Variants ──
    { id: 'logo-dark-1x', filename: 'logo-dark@1x.png', category: 'logo-png', label: 'Logo Dark @1x', width: 400, height: null, format: 'PNG', svgOnly: false },
    { id: 'logo-dark-2x', filename: 'logo-dark@2x.png', category: 'logo-png', label: 'Logo Dark @2x', width: 800, height: null, format: 'PNG', svgOnly: false },
    { id: 'logo-light-1x', filename: 'logo-light@1x.png', category: 'logo-png', label: 'Logo Light @1x', width: 400, height: null, format: 'PNG', svgOnly: false },
    { id: 'logo-light-2x', filename: 'logo-light@2x.png', category: 'logo-png', label: 'Logo Light @2x', width: 800, height: null, format: 'PNG', svgOnly: false },

    // ── Meta files ──
    ...(state.includeManifest ? [
      { id: 'webmanifest', filename: 'site.webmanifest', category: 'meta' as const, label: 'Web Manifest', width: null, height: null, format: 'JSON' as const, svgOnly: false },
      { id: 'browserconfig', filename: 'browserconfig.xml', category: 'meta' as const, label: 'Browser Config', width: null, height: null, format: 'XML' as const, svgOnly: false },
    ] : []),
  ];

  return specs.map(s => ({
    ...s,
    enabled: s.svgOnly ? isSvg : true,
  }));
}

export const CATEGORY_LABELS: Record<OutputSpec['category'], string> = {
  'favicon': 'Favicons',
  'apple-pwa': 'Apple & PWA',
  'social': 'Open Graph & Social',
  'logo-svg': 'Logo SVG Variants',
  'logo-png': 'Logo PNG Variants',
  'meta': 'Manifest & Config',
};
