// ─── Logo Grid Designer — Types ───────────────────────────────────────────────

export type GridType =
  | 'thirds'
  | 'golden'
  | 'golden-spiral'
  | 'fibonacci'
  | 'radii'
  | 'baseline'
  | 'custom';

export type CanvasFilter =
  | 'light'
  | 'dark'
  | 'blueprint'
  | 'amber'
  | 'mono'
  | 'transparent';

export type CanvasPreset = 'square' | 'landscape' | 'a4';

export interface GridColor {
  label: string;
  value: string;
}

export interface CanvasSize {
  w: number;
  h: number;
  label: string;
}

export interface LogoGridState {
  logoSrc: string | null;
  logoFileName: string;
  gridType: GridType;
  gridOpacity: number;        // 0–1
  gridColor: string;          // hex
  showClearspace: boolean;
  clearspaceMultiplier: number; // e.g. 1.5
  showLabels: boolean;
  canvasFilter: CanvasFilter;
  canvasSize: CanvasPreset;
  logoScale: number;          // 0.2–2.0
  logoX: number | null;       // null = centred
  logoY: number | null;
  logoRotation: number;       // degrees
  customCols: number;
  customRows: number;
}

export const CANVAS_SIZES: Record<CanvasPreset, CanvasSize> = {
  square:    { w: 1080, h: 1080, label: 'Square (1:1)' },
  landscape: { w: 1920, h: 1080, label: 'Landscape (16:9)' },
  a4:        { w: 794,  h: 1123, label: 'A4 Portrait' },
};

export const FILTER_BACKGROUNDS: Record<CanvasFilter, string> = {
  light:       '#ffffff',
  dark:        '#0d0d0f',
  blueprint:   '#0a1628',
  amber:       '#fdf6e3',
  mono:        '#f2f2f0',
  transparent: 'transparent',
};

export const FILTER_GRID_COLORS: Record<CanvasFilter, string> = {
  light:       '#000000',
  dark:        '#e8342b',
  blueprint:   '#00bcd4',
  amber:       '#c8860a',
  mono:        '#888888',
  transparent: '#e8342b',
};

export const FILTER_LABELS: Record<CanvasFilter, string> = {
  light:       'Light',
  dark:        'Dark',
  blueprint:   'Blueprint',
  amber:       'Amber',
  mono:        'Monochrome',
  transparent: 'Transparent',
};

export const GRID_LABELS: Record<GridType, string> = {
  thirds:         'Rule of Thirds',
  golden:         'Golden Ratio',
  'golden-spiral': 'Golden Spiral',
  fibonacci:      'Fibonacci',
  radii:          'Radii',
  baseline:       'Baseline',
  custom:         'Custom',
};

export const GRID_COLOR_PRESETS: GridColor[] = [
  { label: 'Red',   value: '#e8342b' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Cyan',  value: '#00bcd4' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Green', value: '#2ea87a' },
];
