import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChngFile } from '../lib/types/ChngFile';
import { converters } from '../lib/converters';
import { ToastManager } from '../lib/util/toast';
import { m } from '../lib/paraglide/messages';
import PQueue from 'p-queue';

// Registry map of ChngFile instances for the compressor tool
export const compressorRegistry = new Map<string, ChngFile>();

// Individual file state inside Redux
export interface CompressorFileState {
  id: string;
  name: string;
  size: number;
  from: string;
  progress: number;
  processing: boolean;
  cancelled: boolean;
  targetSize: number; // in bytes
  startQuality: number; // quality percentage (10-100)
  compressedSize: number | null; // final size in bytes
  blobUrl?: string; // thumbnail preview
  resultBlobUrl?: string; // compressed file URL
  error: string | null;
  mode?: 'size' | 'quality';
}

export interface CompressorState {
  files: CompressorFileState[];
  ready: boolean;
  results: boolean;
}

const initialState: CompressorState = {
  files: [],
  ready: false,
  results: false,
};

import { generateThumbnailFromMedia } from '../lib/util/thumbnail';

// Queue for generating image thumbnails in background
const thumbnailQueue = new PQueue({ concurrency: 2 });

const generateThumbnail = async (file: File): Promise<string | undefined> => {
  try {
    return await generateThumbnailFromMedia(file, false);
  } catch (e) {
    console.error("Failed to generate thumbnail:", e);
    return undefined;
  }
};

const triggerThumbnailGen = (id: string, file: File, dispatch: any) => {
  thumbnailQueue.add(async () => {
    const url = await generateThumbnail(file);
    if (url) {
      dispatch(updateFileBlobUrl({ id, blobUrl: url }));
    }
  });
};

// Setup status & progress callbacks on the ChngFile model instance
const setupCompressorFileCallbacks = (vf: ChngFile, dispatch: any) => {
  vf.onProgress = (id, progress) => {
    setTimeout(() => {
      dispatch(updateProgress({ id, progress }));
    }, 0);
  };
  vf.onProcessingChange = (id, processing) => {
    setTimeout(() => {
      dispatch(updateProcessing({ id, processing }));
    }, 0);
  };
  vf.onError = (id, error) => {
    setTimeout(() => {
      dispatch(setError({ id, error }));
    }, 0);
  };
};

// ==========================================
// Async Thunks
// ==========================================

export const uploadCompressorFiles = createAsyncThunk(
  'compressor/uploadCompressorFiles',
  async (rawFiles: File[] | FileList, { dispatch }) => {
    const filesArray = Array.from(rawFiles);

    for (const file of filesArray) {
      const format = "." + file.name.split(".").pop()?.toLowerCase();
      if (!format) continue;

      const converter = converters.find((c) => c.name === "imagemagick");
      const isSupported = converter?.formatStrings().includes(format);

      // Enforce image files only
      if (!isSupported) {
        ToastManager.add({
          type: "error",
          message: `Unsupported file format: ${format}. Only images can be compressed in this version.`,
        });
        continue;
      }

      // Default target size: 150 KB (or 50% of file size, whichever is smaller)
      const defaultTarget = Math.min(150 * 1024, Math.round(file.size * 0.5));
      const vf = new ChngFile(file, format);
      setupCompressorFileCallbacks(vf, dispatch);
      compressorRegistry.set(vf.id, vf);
      triggerThumbnailGen(vf.id, file, dispatch);

      dispatch(addFileToState({
        id: vf.id,
        name: vf.name,
        size: file.size,
        from: vf.from,
        progress: 0,
        processing: false,
        cancelled: false,
        targetSize: defaultTarget,
        startQuality: 85,
        compressedSize: null,
        blobUrl: undefined,
        resultBlobUrl: undefined,
        error: null,
        mode: 'size',
      }));
    }
  }
);

export const compressSingleFile = createAsyncThunk(
  'compressor/compressSingleFile',
  async (id: string, { dispatch, getState }) => {
    const vf = compressorRegistry.get(id);
    const fileState = (getState() as any).compressor.files.find((f: any) => f.id === id);
    if (!vf || !fileState) return;

    try {
      dispatch(updateProcessing({ id, processing: true }));
      const magick = converters.find((c) => c.name === "imagemagick") as any;
      if (!magick) throw new Error("ImageMagick wasm engine not loaded");

      // Run iterative WASM compression loop
      const targetSize = fileState.mode === 'quality' ? Number.MAX_SAFE_INTEGER : fileState.targetSize;
      const resultFile = await magick.compress(vf, targetSize, fileState.startQuality);
      
      const blobUrl = URL.createObjectURL(
        new Blob([await resultFile.file.arrayBuffer()], { type: "application/octet-stream" })
      );

      // Cache result locally inside the Registry
      vf.result = resultFile;

      dispatch(setResult({
        id,
        compressedSize: resultFile.file.size,
        resultBlobUrl: blobUrl,
      }));
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      dispatch(setError({ id, error: errMsg }));
      ToastManager.add({
        type: "error",
        message: `Compression failed for ${vf.name}: ${errMsg}`,
      });
    }
  }
);

export const compressAllFiles = createAsyncThunk(
  'compressor/compressAllFiles',
  async (_, { dispatch, getState }) => {
    const files = (getState() as any).compressor.files;
    const coreCount = navigator.hardwareConcurrency || 4;
    const queue = new PQueue({ concurrency: coreCount });
    
    const promiseFns = files
      .filter((f: any) => !f.resultBlobUrl && !f.processing)
      .map((f: any) => () => dispatch(compressSingleFile(f.id)));

    await Promise.all(promiseFns.map((fn: any) => queue.add(fn)));
  }
);

export const downloadAllCompressed = createAsyncThunk(
  'compressor/downloadAllCompressed',
  async () => {
    const activeFiles = Array.from(compressorRegistry.values());
    const filesToDownload = activeFiles.filter((f) => f.result);
    if (filesToDownload.length === 0) return;

    if (filesToDownload.length === 1) {
      const result = filesToDownload[0].result;
      if (result) {
        const url = URL.createObjectURL(
          new Blob([await result.file.arrayBuffer()], { type: 'application/octet-stream' })
        );
        const a = document.createElement('a');
        a.href = url;
        a.download = result.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      return;
    }

    const { createZip } = await import('../lib/util/zip');
    const filesToZip: File[] = [];

    for (const file of filesToDownload) {
      if (file.result) {
        filesToZip.push(new File([await file.result.file.arrayBuffer()], file.result.name));
      }
    }

    const zipData = await createZip(filesToZip);
    const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chng-compressed-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }
);

// ==========================================
// Compressor Slice Definition
// ==========================================
export const compressorSlice = createSlice({
  name: 'compressor',
  initialState,
  reducers: {
    addFileToState(state, action: PayloadAction<CompressorFileState>) {
      state.files.push(action.payload);
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
      state.results = false;
    },
    removeFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter(f => f.id !== action.payload);
      const vf = compressorRegistry.get(action.payload);
      if (vf) {
        vf.cancel();
        compressorRegistry.delete(action.payload);
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
      state.results = state.files.length > 0 && state.files.every(f => !!f.resultBlobUrl);
    },
    updateProgress(state, action: PayloadAction<{ id: string; progress: number }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.progress = action.payload.progress;
      }
    },
    updateProcessing(state, action: PayloadAction<{ id: string; processing: boolean }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.processing = action.payload.processing;
        if (action.payload.processing) {
          file.error = null;
        }
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
    },
    setResult(state, action: PayloadAction<{ id: string; compressedSize: number; resultBlobUrl: string }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.compressedSize = action.payload.compressedSize;
        file.resultBlobUrl = action.payload.resultBlobUrl;
        file.progress = 100;
        file.processing = false;
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
      state.results = state.files.length > 0 && state.files.every(f => !!f.resultBlobUrl);
    },
    setError(state, action: PayloadAction<{ id: string; error: string }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.error = action.payload.error;
        file.processing = false;
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
    },
    updateFileTargetSize(state, action: PayloadAction<{ id: string; targetSize: number }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.targetSize = action.payload.targetSize;
        file.compressedSize = null;
        file.resultBlobUrl = undefined;
        const vf = compressorRegistry.get(action.payload.id);
        if (vf) vf.result = null;
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
      state.results = state.files.length > 0 && state.files.every(f => !!f.resultBlobUrl);
    },
    updateFileStartQuality(state, action: PayloadAction<{ id: string; startQuality: number }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.startQuality = action.payload.startQuality;
        file.compressedSize = null;
        file.resultBlobUrl = undefined;
        const vf = compressorRegistry.get(action.payload.id);
        if (vf) vf.result = null;
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
      state.results = state.files.length > 0 && state.files.every(f => !!f.resultBlobUrl);
    },
    updateFileBlobUrl(state, action: PayloadAction<{ id: string; blobUrl: string }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.blobUrl = action.payload.blobUrl;
      }
    },
    updateFileMode(state, action: PayloadAction<{ id: string; mode: 'size' | 'quality' }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.mode = action.payload.mode;
        file.compressedSize = null;
        file.resultBlobUrl = undefined;
        const vf = compressorRegistry.get(action.payload.id);
        if (vf) vf.result = null;
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing && (f.mode === 'quality' || f.targetSize > 0));
      state.results = state.files.length > 0 && state.files.every(f => !!f.resultBlobUrl);
    },
    clearAll(state) {
      Array.from(compressorRegistry.values()).forEach(vf => vf.cancel());
      compressorRegistry.clear();
      state.files = [];
      state.ready = false;
      state.results = false;
    }
  }
});

export const {
  addFileToState,
  removeFile,
  updateProgress,
  updateProcessing,
  setResult,
  setError,
  updateFileTargetSize,
  updateFileStartQuality,
  updateFileBlobUrl,
  clearAll,
  updateFileMode,
} = compressorSlice.actions;

export default compressorSlice.reducer;
export const selectCompressorFiles = (state: { compressor: CompressorState }) => state.compressor.files;
export const selectCompressorReady = (state: { compressor: CompressorState }) => state.compressor.ready;
export const selectCompressorResults = (state: { compressor: CompressorState }) => state.compressor.results;
