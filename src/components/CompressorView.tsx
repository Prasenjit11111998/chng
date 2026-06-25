import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCompressorFiles,
  selectCompressorReady,
  selectCompressorResults,
  uploadCompressorFiles,
  compressSingleFile,
  compressAllFiles,
  downloadAllCompressed,
  updateFileMode,
  removeFile,
  clearAllCompressor,
  updateFileTargetSize,
  updateFileStartQuality,
} from '../store';
import Panel from './Panel';
import Uploader from './Uploader';
import ProgressBar from './ProgressBar';
import { Button } from './ui/button';
import { m } from '../lib/paraglide/messages';
import { ToastManager } from '../lib/util/toast';
import { X as XIcon, Minimize2, Download as DownloadIcon, RefreshCw, Trash2 } from 'lucide-react';
import { converters } from '../lib/converters';

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getMaxUnit = (bytes: number): 'B' | 'KB' | 'MB' => {
  if (bytes < 1024) return 'B';
  if (bytes < 1024 * 1024) return 'KB';
  return 'MB';
};

const getInitialUnit = (targetSize: number): 'B' | 'KB' | 'MB' => {
  if (targetSize >= 1024 * 1024) return 'MB';
  if (targetSize >= 1024) return 'KB';
  return 'B';
};

interface UnitDropdownProps {
  value: 'B' | 'KB' | 'MB';
  maxUnit: 'B' | 'KB' | 'MB';
  onChange: (val: 'B' | 'KB' | 'MB') => void;
}

const UnitDropdown: React.FC<UnitDropdownProps> = ({ value, maxUnit, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const units: ('B' | 'KB' | 'MB')[] = ['B', 'KB', 'MB'];

  const isEnabled = (unit: 'B' | 'KB' | 'MB') => {
    if (maxUnit === 'B') return unit === 'B';
    if (maxUnit === 'KB') return unit === 'B' || unit === 'KB';
    return true;
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  return (
    <div className="relative font-mono" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Unit: ${value}. Change unit`}
        aria-expanded={isOpen}
        className="bg-button px-2 h-8 border border-separator text-foreground text-xs font-bold flex items-center gap-1 cursor-pointer pixel-btn"
      >
        <span>{value}</span>
        <span className="text-[8px] mt-0.5" aria-hidden="true">▼</span>
      </button>
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select unit"
          className="absolute right-0 top-full mt-1 bg-panel border border-separator z-50 flex flex-col min-w-[60px] pixel-box p-1 shadow-lg"
        >
          {units.map((u) => {
            const enabled = isEnabled(u);
            return (
              <button
                key={u}
                type="button"
                role="option"
                aria-selected={u === value}
                disabled={!enabled}
                onClick={() => {
                  onChange(u);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 text-[10px] font-semibold border-none bg-transparent cursor-pointer ${
                  u === value ? 'text-accent font-bold bg-panel-highlight' : enabled ? 'text-foreground hover:bg-panel-highlight' : 'text-muted opacity-40 cursor-not-allowed'
                }`}
              >
                {u}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CompressorView: React.FC = () => {
  const files = useSelector(selectCompressorFiles);
  const ready = useSelector(selectCompressorReady);
  const results = useSelector(selectCompressorResults);
  const dispatch = useDispatch();

  const magick = converters.find((c) => c.name === "imagemagick");
  const [isEngineReady, setIsEngineReady] = useState(magick?.status === 'ready');

  useEffect(() => {
    if (!magick) return;
    const updateStatus = (_name: string, status: any) => {
      setIsEngineReady(status === 'ready');
    };
    magick.addStatusListener(updateStatus);
    return () => {
      magick.removeStatusListener(updateStatus);
    };
  }, [magick]);

  const [unitMap, setUnitMap] = useState<Record<string, 'B' | 'KB' | 'MB'>>({});

  // aria-live announcement ref
  const announcerRef = useRef<HTMLDivElement>(null);
  const announce = (msg: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (announcerRef.current) announcerRef.current.textContent = msg;
      });
    }
  };

  const handleUpload = (uploadedFiles: FileList | File[]) => {
    dispatch(uploadCompressorFiles(uploadedFiles) as any);
  };

  const handleTargetSizeChange = (id: string, valStr: string, unit: 'B' | 'KB' | 'MB', fileSize: number) => {
    if (valStr === '') {
      dispatch(updateFileTargetSize({ id, targetSize: 0 }));
      return;
    }
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      const multiplier = unit === 'MB' ? 1024 * 1024 : unit === 'KB' ? 1024 : 1;
      let targetBytes = Math.round(val * multiplier);

      if (targetBytes > 0 && targetBytes >= fileSize) {
        targetBytes = fileSize - 1;
        ToastManager.add({
          type: 'info',
          message: 'Target size cannot exceed original file size. Clamped to maximum allowed.',
        });
      }

      dispatch(updateFileTargetSize({
        id,
        targetSize: targetBytes
      }));
    }
  };

  const isProcessingAny = files.some((f) => f.processing);

  return (
    <div className="flex flex-col justify-center items-center gap-6 px-4 md:p-0 max-w-[778px] mx-auto w-full pb-6 md:pb-20">
      {/* Screen reader live region for status announcements */}
      <div
        ref={announcerRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {files.length > 0 && (
        <Panel className="w-full">
          {/* Header bar — responsive: stacks on mobile */}
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <Minimize2 className="text-accent flex-shrink-0" size={20} aria-hidden="true" />
              <span className="font-bold text-base sm:text-lg text-foreground font-display tracking-tight">
                Image Compressor
              </span>
              {isProcessingAny && (
                <span className="text-xxs text-muted font-mono animate-pulse ml-1">
                  compressing...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button
                onClick={() => dispatch(clearAllCompressor())}
                variant="outline"
                className="h-9 text-xs text-muted"
                aria-label="Clear all files"
                title="Clear all files"
              >
                <Trash2 size={14} className="mr-1" aria-hidden="true" />
                Clear
              </Button>

              <Button
                onClick={() => dispatch(compressAllFiles() as any)}
                disabled={!ready}
                variant="default"
                className="h-9 text-xs text-on-accent"
                aria-label={isProcessingAny ? 'Compressing all files…' : 'Compress all files'}
              >
                <RefreshCw
                  size={14}
                  className={`mr-1.5 ${isProcessingAny ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Compress All
              </Button>

              <Button
                onClick={() => dispatch(downloadAllCompressed() as any)}
                disabled={!ready || !results}
                variant="outline"
                className="h-9 text-xs text-foreground"
                aria-label="Download all compressed files as ZIP"
                title="Download all compressed files as a ZIP"
              >
                <DownloadIcon size={14} className="mr-1.5" aria-hidden="true" />
                <span className="max-[360px]:hidden">Download All</span>
                <span className="hidden max-[360px]:inline">ZIP</span>
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Add more images uploader */}
      {files.length > 0 && (
        <div className="w-full h-28 flex-shrink-0">
          <Uploader
            className="w-full h-full"
            onViewChange={() => {}}
            onUpload={handleUpload}
            buttonText="Add more images..."
          />
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="w-full flex flex-col gap-3" role="list" aria-label="Files to compress">
          {files.map((file) => {
            const maxUnit = getMaxUnit(file.size);
            const initialUnit = getInitialUnit(file.targetSize);
            let unit = unitMap[file.id] || initialUnit;

            // Enforce unit constraints (can't select MB if file is in KB, etc.)
            if (maxUnit === 'B' && unit !== 'B') unit = 'B';
            else if (maxUnit === 'KB' && unit === 'MB') unit = 'KB';

            const multiplier = unit === 'MB' ? 1024 * 1024 : unit === 'KB' ? 1024 : 1;
            const sizeVal = Math.round(file.targetSize / multiplier);
            const savings = file.compressedSize
              ? Math.round(((file.size - file.compressedSize) / file.size) * 100)
              : 0;

            const mode = file.mode || 'size';

            return (
              <Panel key={file.id} className="w-full p-3 relative" role="listitem">
                {/* Main row — always visible */}
                <div className="flex items-center gap-3 w-full">
                  {/* Left side: Thumbnail + Name/Size + Status Tick/Cross */}
                  <div className="flex items-center justify-between gap-3 overflow-hidden min-w-0 flex-grow mr-2 sm:mr-4">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-grow">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 overflow-hidden bg-panel-highlight flex items-center justify-center pixel-btn">
                        {file.blobUrl ? (
                          <img
                            src={file.blobUrl}
                            alt={`Thumbnail of ${file.name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-panel-highlight flex items-center justify-center text-muted font-bold text-xs pixel-btn border-none font-mono">
                            IMG
                          </div>
                        )}
                      </div>

                      {/* Name + Size */}
                      <div className="overflow-hidden flex flex-col justify-center min-w-0 max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-[280px]">
                        <p className="font-semibold text-foreground text-sm truncate font-mono" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted font-mono">
                            {formatSize(file.size)}
                          </span>
                          {file.resultBlobUrl && (
                            <span className="text-xs text-accent font-semibold font-mono">
                              → {formatSize(file.compressedSize || 0)}
                              {savings > 0 && <span className="ml-1 text-[10px]">(-{savings}%)</span>}
                            </span>
                          )}
                          {file.error && (
                            <span className="text-xs text-failure font-mono" aria-live="polite">
                              Failed: {file.error}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                    {/* Success/Error status indicator moved to the right of the name box */}
                    <div className="flex-shrink-0 mr-1 sm:mr-3">
                      {file.resultBlobUrl && <PixelTick className="text-success" />}
                      {file.error && <PixelCross className="text-failure" />}
                    </div>
                  </div>

                  {/* Processing indicator */}
                  {file.processing && (
                    <div className="flex flex-col gap-1.5 w-24 sm:w-36 flex-shrink-0">
                      <span className="text-xxs text-muted animate-pulse font-mono">
                        {isEngineReady ? 'compressing...' : 'Initialising engine...'}
                      </span>
                      <ProgressBar
                        progress={file.progress}
                        min={0}
                        max={100}
                        label={isEngineReady ? `Compressing ${file.name}` : `Initialising engine for ${file.name}`}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {file.resultBlobUrl ? (
                      <Button
                        onClick={() => {
                          if (file.resultBlobUrl) {
                            const a = document.createElement('a');
                            a.href = file.resultBlobUrl;
                            const ext = file.name.split('.').pop();
                            a.download = `${file.name.replace(/\.[^/.]+$/, '')}_cmp.${ext}`;
                            a.click();
                            a.remove();
                            announce(`${file.name} downloaded`);
                          }
                        }}
                        variant="default"
                        className="h-9 px-2.5 text-xs text-on-accent"
                        aria-label={`Download compressed ${file.name}`}
                      >
                        <DownloadIcon size={14} aria-hidden="true" />
                        <span className="ml-1 max-sm:hidden">Save</span>
                      </Button>
                    ) : !file.processing ? (
                      <Button
                        onClick={() => dispatch(compressSingleFile(file.id) as any)}
                        disabled={mode === 'size' && file.targetSize <= 0}
                        variant="default"
                        className="h-9 px-2.5 text-xs text-on-accent"
                        aria-label={`Compress ${file.name}`}
                      >
                        <RefreshCw size={14} aria-hidden="true" />
                        <span className="ml-1 max-sm:hidden">Go</span>
                      </Button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => dispatch(removeFile(file.id))}
                      disabled={file.processing}
                      className="w-9 h-9 flex items-center justify-center hover:bg-panel-highlight text-muted border-none cursor-pointer duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Remove ${file.name}`}
                    >
                      <XIcon size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Controls row — shown below main row when not processing */}
                {!file.processing && (
                  <div className="mt-3 pt-3 border-t border-separator/40 flex flex-wrap items-center gap-3">
                    {/* Mode Toggle */}
                    <div
                      className="flex items-center bg-panel-highlight h-8 border border-separator pixel-box"
                      role="group"
                      aria-label="Compression mode"
                    >
                      <button
                        type="button"
                        onClick={() => dispatch(updateFileMode({ id: file.id, mode: 'size' }))}
                        aria-pressed={mode === 'size'}
                        className={`px-3 h-full text-[10px] font-semibold font-mono cursor-pointer duration-100 border-none ${
                          mode === 'size' ? 'bg-accent text-on-accent' : 'text-muted hover:text-foreground bg-transparent'
                        }`}
                      >
                        Size
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch(updateFileMode({ id: file.id, mode: 'quality' }))}
                        aria-pressed={mode === 'quality'}
                        className={`px-3 h-full text-[10px] font-semibold font-mono cursor-pointer duration-100 border-none ${
                          mode === 'quality' ? 'bg-accent text-on-accent' : 'text-muted hover:text-foreground bg-transparent'
                        }`}
                      >
                        Quality
                      </button>
                    </div>

                    {/* Size Mode Controls */}
                    {mode === 'size' && (
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`target-${file.id}`}
                          className="text-xs text-muted font-mono whitespace-nowrap"
                        >
                          Target:
                        </label>
                        <div className="flex items-center bg-panel-highlight h-8 border border-separator pixel-box">
                          <input
                            id={`target-${file.id}`}
                            type="number"
                            value={sizeVal || ''}
                            onChange={(e) => handleTargetSizeChange(file.id, e.target.value, unit, file.size)}
                            className="bg-transparent border-none text-foreground text-xs font-semibold outline-none w-16 px-2 font-mono"
                            aria-label={`Target file size in ${unit}`}
                          />
                        </div>
                        <UnitDropdown
                          value={unit}
                          maxUnit={maxUnit}
                          onChange={(newUnit) => {
                            setUnitMap({ ...unitMap, [file.id]: newUnit });
                            handleTargetSizeChange(file.id, String(sizeVal), newUnit, file.size);
                          }}
                        />
                      </div>
                    )}

                    {/* Quality Mode Controls */}
                    {mode === 'quality' && (
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`quality-${file.id}`}
                          className="text-xs text-muted font-mono whitespace-nowrap"
                        >
                          Quality:
                        </label>
                        <input
                          id={`quality-${file.id}`}
                          type="range"
                          min="10"
                          max="95"
                          value={file.startQuality}
                          onChange={(e) => dispatch(updateFileStartQuality({ id: file.id, startQuality: parseInt(e.target.value) }))}
                          className="w-20 sm:w-28 cursor-pointer h-2"
                          aria-label={`Compression quality: ${file.startQuality}%`}
                        />
                        <span className="text-xxs text-muted w-8 text-right font-mono font-bold">
                          {file.startQuality}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div className="w-full flex flex-col items-center gap-10 mt-8">
          <div className="text-center max-w-xl">
            <h1 className="text-4xl md:text-6xl tracking-tight leading-tight mb-4 text-foreground font-display font-bold">
              Image Compressor
            </h1>
            <p className="font-normal text-lg text-muted leading-relaxed max-w-[60ch] mx-auto">
              Compress JPG, PNG, and WebP images to your target size — completely client-side via WebAssembly.
            </p>
          </div>
          <div className="w-full h-56">
            <Uploader
              className="w-full h-full"
              onViewChange={() => {}}
              onUpload={handleUpload}
              buttonText="Drag & drop images here to compress..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

const PixelTick: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      imageRendering: 'pixelated',
      shapeRendering: 'crispEdges',
      color: 'var(--fg-success, #00aa25)'
    }}
    aria-hidden="true"
  >
    <rect x="0" y="4" width="2" height="2" fill="currentColor" />
    <rect x="2" y="6" width="2" height="2" fill="currentColor" />
    <rect x="4" y="4" width="2" height="2" fill="currentColor" />
    <rect x="6" y="2" width="2" height="2" fill="currentColor" />
  </svg>
);

const PixelCross: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      imageRendering: 'pixelated',
      shapeRendering: 'crispEdges',
      color: 'var(--fg-failure, #ff0000)'
    }}
    aria-hidden="true"
  >
    <rect x="0" y="0" width="2" height="2" fill="currentColor" />
    <rect x="2" y="2" width="2" height="2" fill="currentColor" />
    <rect x="4" y="4" width="2" height="2" fill="currentColor" />
    <rect x="6" y="6" width="2" height="2" fill="currentColor" />
    <rect x="6" y="0" width="2" height="2" fill="currentColor" />
    <rect x="4" y="2" width="2" height="2" fill="currentColor" />
    <rect x="2" y="4" width="2" height="2" fill="currentColor" />
    <rect x="0" y="6" width="2" height="2" fill="currentColor" />
  </svg>
);

export default CompressorView;