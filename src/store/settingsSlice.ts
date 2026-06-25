import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const SHOW_RETRO_THEMES = false; // Set to true to show Game Boy and Matrix themes in standard UI selection

export interface DefaultFormats {
  image: string;
  video: string;
  audio: string;
  document: string;
}

export interface ISettings {
  filenameFormat: string;
  defaultFormat: DefaultFormats;
  useDefaultFormat: boolean;
  metadata: boolean;
  plausible: boolean;
  chngdURL: string;
  chngdSpeed: string; // 'very_slow' | 'slower' | 'slow' | 'medium' | 'fast' | 'ultra_fast'
  magickQuality: number;
  ffmpegQuality: string;
  ffmpegSampleRate: string;
  ffmpegCustomSampleRate: number;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'gameboy' | 'matrix';
  effects: boolean;
  locale: string;
  chngdLoaded: boolean;
  settings: ISettings;
}

const defaultSettings: ISettings = {
  filenameFormat: "CHNG_%name%",
  defaultFormat: {
    image: ".png",
    video: ".mp4",
    audio: ".mp3",
    document: ".docx",
  },
  useDefaultFormat: false,
  metadata: true,
  plausible: true,
  chngdURL: import.meta.env.VITE_ChngD_URL || "https://chngd.chng.sh",
  chngdSpeed: "slow",
  magickQuality: 82,
  ffmpegQuality: "auto",
  ffmpegSampleRate: "auto",
  ffmpegCustomSampleRate: 44100,
};

const getInitialState = (): SettingsState => {
  const localTheme = localStorage.getItem("theme") as 'light' | 'dark' | 'gameboy' | 'matrix' | null;
  const localEffects = localStorage.getItem("effects") !== "false";
  const localLocale = localStorage.getItem("locale") || "en";
  
  let settings = defaultSettings;
  try {
    const saved = localStorage.getItem("settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old quality values that could cause lossless encoding (85 or 100 → 82)
      if (parsed && (parsed.magickQuality === 100 || parsed.magickQuality === 85)) {
        parsed.magickQuality = 82;
        localStorage.setItem("settings", JSON.stringify({ ...defaultSettings, ...parsed }));
      }
      settings = { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error("Error parsing settings:", e);
  }

  return {
    theme: localTheme || 'light',
    effects: localEffects,
    locale: localLocale,
    chngdLoaded: false,
    settings,
  };
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: getInitialState(),
  reducers: {
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'gameboy' | 'matrix'>) {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
      document.documentElement.classList.remove('light', 'dark', 'gameboy', 'matrix');
      document.documentElement.classList.add(action.payload);
    },
    setEffects(state, action: PayloadAction<boolean>) {
      state.effects = action.payload;
      localStorage.setItem("effects", String(action.payload));
    },
    setLocale(state, action: PayloadAction<string>) {
      state.locale = action.payload;
      localStorage.setItem("locale", action.payload);
    },
    setChngdLoaded(state, action: PayloadAction<boolean>) {
      state.chngdLoaded = action.payload;
    },
    updateSettings(state, action: PayloadAction<Partial<ISettings>>) {
      state.settings = { ...state.settings, ...action.payload };
      localStorage.setItem("settings", JSON.stringify(state.settings));
    },
    resetSettings(state) {
      state.settings = defaultSettings;
      state.theme = 'light';
      state.effects = true;
      state.locale = 'en';
      state.chngdLoaded = false;
      localStorage.removeItem("settings");
      localStorage.setItem("theme", "light");
      localStorage.setItem("effects", "true");
      localStorage.setItem("locale", "en");
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }
});

export const { setTheme, setEffects, setLocale, setChngdLoaded, updateSettings, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
