// ─── Brand Data Model ────────────────────────────────────────────────────────

export interface BrandColor {
  id: string;
  name: string;
  hex: string; // always 7-char "#RRGGBB"
}

export interface BrandLogos {
  primary: string | null;   // base64 Data URL
  dark: string | null;
  light: string | null;
  icon: string | null;
}

export interface BrandTypography {
  headingFont: string;
  bodyFont: string;
  headingFontFile?: string | null; // base64 data URL of a custom uploaded font file
  bodyFontFile?: string | null;    // base64 data URL of a custom uploaded font file
}

export interface BrandLogoRules {
  minSize: string;      // e.g. "120px" or "30mm"
  clearspace: string;   // e.g. "1x icon width"
}

export interface ExportSettings {
  pageSize: 'A4' | 'US_LETTER';
  theme: 'light' | 'dark';
  sectionOrder: PDFSection[];
}

// All PDF sections — used for drag-and-drop reordering
export type PDFSection =
  | 'cover'
  | 'about'
  | 'logo-system'
  | 'clearspace'
  | 'min-size'
  | 'color-palette'
  | 'typography'
  | 'brand-applications'
  | 'logo-rules';

export const DEFAULT_SECTION_ORDER: PDFSection[] = [
  'cover',
  'about',
  'logo-system',
  'clearspace',
  'min-size',
  'color-palette',
  'typography',
  'brand-applications',
  'logo-rules',
];

export interface BrandData {
  // Step 1
  brandName: string;
  tagline: string;
  website: string;
  description: string;
  // Step 2
  logos: BrandLogos;
  // Step 3
  colors: BrandColor[];
  // Step 4
  typography: BrandTypography;
  // Step 5
  logoRules: BrandLogoRules;
  // Export (Step 7)
  exportSettings: ExportSettings;
}

export type PDFThemeName = 'light' | 'dark';

export interface PDFTheme {
  name: PDFThemeName;
  // Page
  pageBackground: string;
  pageText: string;
  pageMuted: string;
  // Accent
  accent: string;
  // Cover
  coverBackground: string;
  coverText: string;
  // Section headings
  sectionHeadingColor: string;
  ruleColor: string;
}
