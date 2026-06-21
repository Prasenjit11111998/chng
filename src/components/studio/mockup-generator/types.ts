export interface MockupDevice {
  id: string;
  name: string;
  frameW: number;
  frameH: number;
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
  screenRadius: number; // For clipping the screenshot corners
}

export type BgFitMode = 'cover' | 'contain' | 'tile';

export interface MockupState {
  screenshotSrc: string | null;
  screenshotFileName: string;
  selectedDeviceId: string;
  
  // Background Options
  backgroundPaletteId: string; // The ID of the editorial color palette to use
  customBgSrc: string | null;
  customBgFileName: string;
  customBgFitMode: BgFitMode;

  // Effects
  showGlare: boolean; // Toggle for the glass reflection
  showShadows: boolean; // Toggle for the premium drop shadows
}

export const DEFAULT_MOCKUP_STATE: MockupState = {
  screenshotSrc: null,
  screenshotFileName: '',
  selectedDeviceId: 'floating-glass',
  backgroundPaletteId: 'studio-sand',
  customBgSrc: null,
  customBgFileName: '',
  customBgFitMode: 'cover',
  showGlare: true,
  showShadows: true,
};
