export interface MockupDevice {
  id: string;
  name: string;
  description: string;
  frameW: number;
  frameH: number;
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
  screenRadius: number;
}

export type BgFitMode = 'cover' | 'contain' | 'tile';
export type CanvasAspect = '16:9' | '4:3' | '1:1' | '9:16';

export interface MockupState {
  screenshotSrc: string | null;
  screenshotFileName: string;
  selectedDeviceId: string;
  
  // Canvas
  canvasAspect: CanvasAspect;

  // Background Options
  backgroundPaletteId: string;
  customBgSrc: string | null;
  customBgFileName: string;
  customBgFitMode: BgFitMode;

  // Effects
  showGlare: boolean;
  showShadows: boolean;
  glassCornerRadius: number; // 0–80, only used by floating-glass
}

export const CANVAS_ASPECT_DIMS: Record<CanvasAspect, { w: number; h: number }> = {
  '16:9': { w: 3840, h: 2160 },
  '4:3':  { w: 2560, h: 1920 },
  '1:1':  { w: 2400, h: 2400 },
  '9:16': { w: 1200, h: 2133 },
};

export const DEFAULT_MOCKUP_STATE: MockupState = {
  screenshotSrc: null,
  screenshotFileName: '',
  selectedDeviceId: 'floating-glass',
  canvasAspect: '16:9',
  backgroundPaletteId: 'deep-space',
  customBgSrc: null,
  customBgFileName: '',
  customBgFitMode: 'cover',
  showGlare: true,
  showShadows: true,
  glassCornerRadius: 40,
};

