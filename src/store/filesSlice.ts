import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ChngFile } from '../lib/types/ChngFile';
import { converters, categories, byNative } from '../lib/converters';
import PQueue from 'p-queue';
import { downloadZip } from 'client-zip';
import { parseBlob, selectCover } from 'music-metadata';
import { GB } from '../lib/util/consts';
import { m } from '../lib/paraglide/messages';
import { ToastManager } from '../lib/util/toast';
import { showDialog } from './dialogsSlice';


export interface ChngFileState {
  id: string;
  name: string;
  size: number;
  from: string;
  to: string;
  progress: number;
  processing: boolean;
  cancelled: boolean;
  blobUrl?: string;
  result?: {
    name: string;
    to: string;
    blobUrl: string;
  } | null;
  error?: string | null;
}

interface FilesState {
  files: ChngFileState[];
  ready: boolean;
  results: boolean;
}

const initialState: FilesState = {
  files: [],
  ready: false,
  results: false,
};

// Global non-serializable registry of ChngFile instances
export const vertFileRegistry = new Map<string, ChngFile>();

// Concurrency queue for thumbnails
const thumbnailQueue = new PQueue({ concurrency: 4 });

// Helper to determine max ArrayBuffer size
function findFirstPositive(f: (x: bigint) => number, b = 1n, d = (e: bigint, g: bigint, c?: bigint): bigint =>
	g < e ? -1n : 0 < f((c = (e + g) >> 1n)) ? (c == e || 0 >= f(c - 1n) ? c : d(e, c - 1n)) : d(c + 1n, g)
): bigint {
	for (; 0 >= f(b); b <<= 1n);
	return d(b >> 1n, b) - 1n;
}

export const getMaxArrayBufferSize = (): number => {
	if (typeof window === "undefined") return 2 * GB;
	const cached = localStorage.getItem("maxArrayBufferSize");
	if (cached) {
		const parsed = Number(cached);
		if (!isNaN(parsed) && parsed > 0) return parsed;
	}
	const maxSize = findFirstPositive((x) => {
		try {
			new ArrayBuffer(Number(x));
			return 0;
		} catch {
			return 1;
		}
	});
	const result = Number(maxSize);
	localStorage.setItem("maxArrayBufferSize", result.toString());
	return result;
};

export const MAX_ARRAY_BUFFER_SIZE = getMaxArrayBufferSize();

// Callbacks setup
function setupChngFileCallbacks(vf: ChngFile, dispatch: any) {
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
  vf.onResult = (id, result) => {
    if (result) {
      const blobUrl = URL.createObjectURL(result.file);
      setTimeout(() => {
        dispatch(setResult({
          id,
          result: {
            name: result.name,
            to: result.to,
            blobUrl
          }
        }));
      }, 0);
    } else {
      setTimeout(() => {
        dispatch(setResult({ id, result: null }));
      }, 0);
    }
  };
  vf.onError = (id, error) => {
    setTimeout(() => {
      dispatch(setError({ id, error }));
    }, 0);
  };
}

import { generateThumbnailFromMedia } from '../lib/util/thumbnail';

const triggerThumbnailGen = (vf: ChngFile, dispatch: any) => {
  thumbnailQueue.add(async () => {
    try {
      const url = await generateThumbnailFromMedia(vf.file, false);
      if (url) {
        vf.blobUrl = url;
        dispatch(updateFileBlobUrl({ id: vf.id, blobUrl: url }));
      }
    } catch (e) {
      console.error("Error generating thumbnail:", e);
    }
  });
};

// Async Thunks
export const uploadAndAddFiles = createAsyncThunk(
  'files/uploadAndAddFiles',
  async (rawFiles: File[] | FileList, { dispatch, getState }) => {
    const filesArray = Array.from(rawFiles);
    const settings = (getState() as any).settings.settings;

    for (const file of filesArray) {
      const isZip = file.name.toLowerCase().endsWith(".zip") ||
                    file.type === "application/zip" ||
                    file.type === "application/x-zip-compressed";

      if (isZip) {
        try {
          ToastManager.add({
            type: "info",
            message: m["convert.archive_file.extracting"]({
              filename: file.name,
            }),
          });

          const { extractZip } = await import('../lib/util/zip');
          const entries = await extractZip(file);

          const convertersUsed = new Set<string>();
          let incompatibleFiles = false;

          for (const { filename } of entries) {
            const format = "." + filename.split(".").pop()?.toLowerCase();
            if (!format || format === ".zip") {
              incompatibleFiles = true;
              continue;
            }

            const converter = converters
              .sort(byNative(format))
              .find((c) => c.formatStrings().includes(format));

            // Only allow ImageMagick converter for ZIP files
            if (converter && converter.name === "imagemagick") {
              convertersUsed.add(converter.name);
            } else {
              incompatibleFiles = true;
            }
          }

          const canConvertAsOne = convertersUsed.size === 1 && !incompatibleFiles;

          if (canConvertAsOne) {
            const vf = new ChngFile(file, ".zip");
            const converterName = Array.from(convertersUsed)[0];
            vf.converters = converters.filter(c => c.name === converterName);
            setupChngFileCallbacks(vf, dispatch);
            vertFileRegistry.set(vf.id, vf);
            triggerThumbnailGen(vf, dispatch);

            dispatch(addFileToState({
              id: vf.id,
              name: vf.name,
              size: file.size,
              from: vf.from,
              to: vf.to,
              progress: 0,
              processing: false,
              cancelled: false,
              result: null,
              error: null,
            }));

            ToastManager.add({
              type: "success",
              message: m["convert.archive_file.detected"]({
                type: m["convert.archive_file.image"](),
                filename: file.name,
              }),
            });
          } else {
            for (const entry of entries) {
              const entryFile = new File([entry.data as any], entry.filename, {
                type: "application/octet-stream",
              });
              dispatch(uploadAndAddFiles([entryFile]));
            }

            ToastManager.add({
              type: "success",
              message: m["convert.archive_file.extracted"]({
                filename: file.name,
                extract_count: entries.length,
                ignore_count: 0,
              }),
            });
          }
        } catch (err) {
          console.error("Zip extraction error:", err);
          ToastManager.add({
            type: "error",
            message: m["convert.archive_file.extract_error"]({
              filename: file.name,
              error: String(err),
            }),
          });
        }
        continue;
      }

      const format = "." + file.name.split(".").pop()?.toLowerCase();
      if (!format) continue;

      const converter = converters
        .sort(byNative(format))
        .find((c) => c.formatStrings().includes(format));

      // Strictly enforce image files only
      if (!converter || converter.name !== "imagemagick") {
        ToastManager.add({
          type: "error",
          message: `Unsupported file format: ${format}. Only image conversion is supported in this version.`,
        });
        continue;
      }

      let to = converter.formatStrings().find((f) => f !== format) || "";
      
      if (settings.useDefaultFormat) {
        const df = settings.defaultFormat?.["image"];
        if (df && df !== format) {
          to = df;
        }
      }

      const vf = new ChngFile(file, to);
      setupChngFileCallbacks(vf, dispatch);
      vertFileRegistry.set(vf.id, vf);
      triggerThumbnailGen(vf, dispatch);

      dispatch(addFileToState({
        id: vf.id,
        name: vf.name,
        size: file.size,
        from: vf.from,
        to: vf.to,
        progress: 0,
        processing: false,
        cancelled: false,
        blobUrl: undefined,
        result: null,
        error: null,
      }));
    }
  }
);


export const convertSingleFile = createAsyncThunk(
  'files/convertSingleFile',
  async (id: string) => {
    const vf = vertFileRegistry.get(id);
    if (vf) {
      await vf.convert();
    }
  }
);

export const convertAll = createAsyncThunk(
  'files/convertAll',
  async (_, { dispatch }) => {
    const activeFiles = Array.from(vertFileRegistry.values());
    const promiseFns = activeFiles.map((f) => () => f.convert());
    const coreCount = navigator.hardwareConcurrency || 4;
    const queue = new PQueue({ concurrency: coreCount });
    await Promise.all(promiseFns.map((fn) => queue.add(fn)));
  }
);

export const downloadAll = createAsyncThunk(
  'files/downloadAll',
  async () => {
    const activeFiles = Array.from(vertFileRegistry.values());
    if (activeFiles.length === 0) return;

    const dlFiles: any[] = [];
    for (const file of activeFiles) {
      if (!file.result) continue;
      let to = file.result.to;
      if (!to.startsWith(".")) to = `.${to}`;
      dlFiles.push(file);
    }

    if (dlFiles.length === 1) {
      await dlFiles[0].download();
      return;
    }

    if (dlFiles.length > 1) {
      const { createZip } = await import('../lib/util/zip');
      const filesToZip: File[] = [];

      for (const file of dlFiles) {
        if (file.result) {
          filesToZip.push(new File([await file.result.file.arrayBuffer()], file.result.name));
        }
      }

      const zipData = await createZip(filesToZip);
      const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chng-converter-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
);

// ==========================================
// Files Redux Slice
// ==========================================
export const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFileToState(state, action: PayloadAction<ChngFileState>) {
      state.files.push(action.payload);
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing);
      state.results = false;
    },
    removeFile(state, action: PayloadAction<string>) {
      state.files = state.files.filter(f => f.id !== action.payload);
      const vf = vertFileRegistry.get(action.payload);
      if (vf) {
        vf.cancel();
        vertFileRegistry.delete(action.payload);
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing);
      state.results = state.files.length > 0 && state.files.every(f => !!f.result);
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
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing);
    },
    setResult(state, action: PayloadAction<{ id: string; result: any }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.result = action.payload.result;
        file.progress = 100;
        file.processing = false;
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing);
      state.results = state.files.length > 0 && state.files.every(f => !!f.result);
    },
    setError(state, action: PayloadAction<{ id: string; error: string }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.error = action.payload.error;
        file.processing = false;
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing);
    },
    updateFileTo(state, action: PayloadAction<{ id: string; to: string }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.to = action.payload.to;
        file.result = null;
        const vf = vertFileRegistry.get(action.payload.id);
        if (vf) {
          vf.to = action.payload.to;
          vf.result = null;
        }
      }
      state.ready = state.files.length > 0 && state.files.every(f => !f.processing);
      state.results = state.files.length > 0 && state.files.every(f => !!f.result);
    },
    updateFileBlobUrl(state, action: PayloadAction<{ id: string; blobUrl: string }>) {
      const file = state.files.find(f => f.id === action.payload.id);
      if (file) {
        file.blobUrl = action.payload.blobUrl;
      }
    },
    clearAll(state) {
      Array.from(vertFileRegistry.values()).forEach(vf => vf.cancel());
      vertFileRegistry.clear();
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
  updateFileTo,
  updateFileBlobUrl,
  clearAll,
} = filesSlice.actions;

export default filesSlice.reducer;
export const selectFiles = (state: { files: FilesState }) => state.files.files;
export const selectFilesReady = (state: { files: FilesState }) => state.files.ready;
export const selectFilesResults = (state: { files: FilesState }) => state.files.results;
