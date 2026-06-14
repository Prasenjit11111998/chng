import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BrandColor, BrandData, BrandLogos, BrandTypography, BrandLogoRules, ExportSettings, PDFSection } from '../lib/studio/types';
import { DEFAULT_SECTION_ORDER } from '../lib/studio/types';
import type { RootState } from './index';

// ─── LocalStorage Persistence ────────────────────────────────────────────────

const STORAGE_KEY = 'chng-studio-brand-draft';

function loadDraft(): Partial<BrandData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<BrandData>;
  } catch {
    return {};
  }
}

function saveDraft(data: BrandData): void {
  try {
    // Estimate size before saving
    const json = JSON.stringify(data);
    const sizeBytes = new TextEncoder().encode(json).length;
    if (sizeBytes > 4 * 1024 * 1024) {
      // 4MB cap — store without logos
      const compact = { ...data, logos: { primary: null, dark: null, light: null, icon: null } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } else {
      localStorage.setItem(STORAGE_KEY, json);
    }
  } catch {
    // Storage full — fail silently
  }
}

// ─── Initial State ────────────────────────────────────────────────────────────

const draft = loadDraft();

const defaultState: BrandData = {
  brandName: '',
  tagline: '',
  website: '',
  description: '',
  logos: {
    primary: null,
    dark: null,
    light: null,
    icon: null,
  },
  colors: [],
  typography: {
    headingFont: '',
    bodyFont: '',
    headingFontFile: null,
    bodyFontFile: null,
  },
  logoRules: {
    minSize: '',
    clearspace: '',
  },
  exportSettings: {
    pageSize: 'A4',
    theme: 'light',
    sectionOrder: DEFAULT_SECTION_ORDER,
  },
};

const initialState: BrandData = {
  ...defaultState,
  ...draft,
  logos: { ...defaultState.logos, ...(draft.logos ?? {}) },
  typography: { ...defaultState.typography, ...(draft.typography ?? {}) },
  logoRules: { ...defaultState.logoRules, ...(draft.logoRules ?? {}) },
  exportSettings: {
    ...defaultState.exportSettings,
    ...(draft.exportSettings ?? {}),
    theme: ((draft.exportSettings?.theme as any) === 'modern' || (draft.exportSettings?.theme as any) === 'dark') ? 'dark' : 'light',
  },
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
    setBrandName(state, action: PayloadAction<string>) {
      state.brandName = action.payload;
      saveDraft(state);
    },
    setTagline(state, action: PayloadAction<string>) {
      state.tagline = action.payload;
      saveDraft(state);
    },
    setWebsite(state, action: PayloadAction<string>) {
      state.website = action.payload;
      saveDraft(state);
    },
    setDescription(state, action: PayloadAction<string>) {
      state.description = action.payload;
      saveDraft(state);
    },
    setLogo(state, action: PayloadAction<{ key: keyof BrandLogos; value: string | null }>) {
      state.logos[action.payload.key] = action.payload.value;
      saveDraft(state);
    },
    addColor(state, action: PayloadAction<BrandColor>) {
      state.colors.push(action.payload);
      saveDraft(state);
    },
    updateColor(state, action: PayloadAction<{ id: string; changes: Partial<BrandColor> }>) {
      const idx = state.colors.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.colors[idx] = { ...state.colors[idx], ...action.payload.changes };
        saveDraft(state);
      }
    },
    removeColor(state, action: PayloadAction<string>) {
      state.colors = state.colors.filter((c) => c.id !== action.payload);
      saveDraft(state);
    },
    setTypography(state, action: PayloadAction<Partial<BrandTypography>>) {
      state.typography = { ...state.typography, ...action.payload };
      saveDraft(state);
    },
    setTypographyFontFile(
      state,
      action: PayloadAction<{ key: 'headingFontFile' | 'bodyFontFile'; value: string | null }>
    ) {
      (state.typography as any)[action.payload.key] = action.payload.value;
      saveDraft(state);
    },
    setLogoRules(state, action: PayloadAction<Partial<BrandLogoRules>>) {
      state.logoRules = { ...state.logoRules, ...action.payload };
      saveDraft(state);
    },
    setExportSettings(state, action: PayloadAction<Partial<ExportSettings>>) {
      state.exportSettings = { ...state.exportSettings, ...action.payload };
      saveDraft(state);
    },
    setSectionOrder(state, action: PayloadAction<PDFSection[]>) {
      state.exportSettings.sectionOrder = action.payload;
      saveDraft(state);
    },
    clearDraft(state) {
      Object.assign(state, defaultState);
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const {
  setBrandName,
  setTagline,
  setWebsite,
  setDescription,
  setLogo,
  addColor,
  updateColor,
  removeColor,
  setTypography,
  setTypographyFontFile,
  setLogoRules,
  setExportSettings,
  setSectionOrder,
  clearDraft,
} = studioSlice.actions;

export default studioSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectBrandData = (state: RootState): BrandData => state.studio;
export const selectBrandName = (state: RootState) => state.studio.brandName;
export const selectColors = (state: RootState) => state.studio.colors;
export const selectTypography = (state: RootState) => state.studio.typography;
export const selectLogos = (state: RootState) => state.studio.logos;
export const selectExportSettings = (state: RootState) => state.studio.exportSettings;
