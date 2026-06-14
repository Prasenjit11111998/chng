import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './filesSlice';
import settingsReducer from './settingsSlice';
import toastsReducer from './toastsSlice';
import dialogsReducer from './dialogsSlice';
import compressorReducer from './compressorSlice';
import studioReducer from './studioSlice';

export const store = configureStore({
  reducer: {
    files: filesReducer,
    compressor: compressorReducer,
    settings: settingsReducer,
    toasts: toastsReducer,
    dialogs: dialogsReducer,
    studio: studioReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // We disable serializableCheck to easily pass callback objects inside thunks
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export * from './settingsSlice';
export * from './toastsSlice';
export * from './dialogsSlice';

export {
  selectFiles,
  selectFilesReady,
  selectFilesResults,
  uploadAndAddFiles,
  convertSingleFile,
  convertAll,
  downloadAll,
  vertFileRegistry,
  clearAll,
  updateFileTo
} from './filesSlice';

export {
  selectCompressorFiles,
  selectCompressorReady,
  selectCompressorResults,
  uploadCompressorFiles,
  compressSingleFile,
  compressAllFiles,
  downloadAllCompressed,
  compressorRegistry,
  updateFileMode,
  updateFileTargetSize,
  updateFileStartQuality,
  removeFile,
  clearAll as clearAllCompressor
} from './compressorSlice';

export {
  selectBrandData,
  selectBrandName,
  selectColors,
  selectTypography,
  selectLogos,
  selectExportSettings,
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
} from './studioSlice';
