import React from 'react';
import { useDispatch } from 'react-redux';
import {
  removeFile,
  convertSingleFile,
  updateFileTo,
  setError,
  ChngFileState,
} from '../store/filesSlice';
import Panel from './Panel';
import ProgressBar from './ProgressBar';
import FormatDropdown from './FormatDropdown';
import { categories } from '../lib/converters';
import { vertFileRegistry } from '../store/filesSlice';
import { m } from '../lib/paraglide/messages';
import {
  BookText as BookTextIcon,
  Download as DownloadIcon,
  Music as MusicIcon,
  ImageOff as ImageOffIcon,
  FileVideo as FileVideoIcon,
  RotateCw as RotateCwIcon,
  X as XIcon,
} from 'lucide-react';

interface FileItemProps {
  file: ChngFileState;
  index: number;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileItem: React.FC<FileItemProps> = ({ file, index }) => {
  const dispatch = useDispatch();

  // Determine media category
  const ext = file.from.toLowerCase();
  const isAudio = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext);
  const isVideo = ['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(ext);
  const isDocument = ['.docx', '.doc', '.pdf', '.md', '.txt'].includes(ext);

  const handleConvert = () => {
    // Clear any previous error so the button re-enables cleanly
    if (file.error) {
      dispatch(setError({ id: file.id, error: '' }));
    }
    // @ts-expect-error thunk action
    dispatch(convertSingleFile(file.id));
  };

  const handleDownload = () => {
    const vf = vertFileRegistry.get(file.id);
    if (vf) {
      vf.download();
    }
  };

  const handleCancel = () => {
    dispatch(removeFile(file.id));
  };

  const handleSelectFormat = (option: string) => {
    dispatch(updateFileTo({ id: file.id, to: option }));
  };

  // Result state label for aria-live
  const resultLabel = file.result
    ? `${file.name} converted to ${file.result.to} successfully`
    : file.error
    ? `${file.name} conversion failed: ${file.error}`
    : undefined;

  return (
    <Panel className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
      {/* Left side: Thumbnail + Name/Size + Status Tick/Cross */}
      <div className="flex items-center justify-between gap-3 overflow-hidden min-w-0 w-full sm:w-auto flex-grow">
        <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-grow">
          {/* Square box thumbnail */}
          <div className="w-14 h-14 flex-shrink-0 overflow-hidden bg-panel-highlight flex items-center justify-center pixel-btn">
            {file.blobUrl ? (
              <img
                className="object-cover w-full h-full"
                src={file.blobUrl}
                alt={`Thumbnail of ${file.name}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground/40">
                {isAudio ? (
                  <MusicIcon size={22} />
                ) : isVideo ? (
                  <FileVideoIcon size={22} />
                ) : isDocument ? (
                  <BookTextIcon size={22} />
                ) : (
                  <ImageOffIcon size={22} />
                )}
              </div>
            )}
          </div>

          {/* File Name & Info */}
          <div className="overflow-hidden flex flex-col justify-center min-w-0 max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-[280px]">
            <p
              className="text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap text-foreground font-mono"
              title={file.name}
            >
              {file.name}
            </p>
            {file.error ? (
              <span
                className="text-xs text-failure font-mono mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
                title={file.error}
              >
                {file.error.length > 48 ? file.error.slice(0, 48) + '…' : file.error}
              </span>
            ) : (
              <span className="text-xs text-muted font-mono mt-0.5">
                {formatSize(file.size)}
              </span>
            )}
          </div>
        </div>

        {/* Success/Error status indicator moved to the right of the name box */}
        <div className="flex-shrink-0 mr-1 sm:mr-3">
          {file.result && <PixelTick className="text-success" />}
          {file.error && (
            <span title={file.error} aria-label={`Conversion failed: ${file.error}`}>
              <PixelCross className="text-failure" />
            </span>
          )}
        </div>
      </div>

      {/* Right side: Actions in sequence */}
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
        {file.processing ? (
          <div className="flex-grow sm:flex-grow-0 w-28 sm:w-36 flex flex-col gap-1.5 justify-center">
            <span className="text-xxs text-muted font-normal animate-pulse font-mono">
              Converting...
            </span>
            <ProgressBar
              progress={file.progress}
              min={0}
              max={100}
              label={`Converting ${file.name}`}
            />
          </div>
        ) : (
          <div className="flex-grow sm:flex-grow-0 w-28">
            <FormatDropdown
              categories={categories}
              from={file.from}
              selected={file.to}
              onselect={handleSelectFormat}
              file={file}
            />
          </div>
        )}
        {/* Convert / Retry button — 44px touch target */}
        <button
          type="button"
          className={`btn px-2.5 h-11 flex items-center justify-center gap-1.5 border-none min-w-[44px] transition-all duration-200 ${
            file.processing
              ? 'opacity-30 cursor-not-allowed bg-transparent text-muted'
              : file.result
              ? 'opacity-30 cursor-not-allowed bg-transparent text-muted'
              : file.error
              ? 'highlight text-on-accent cursor-pointer'
              : 'highlight text-on-accent cursor-pointer'
          }`}
          onClick={handleConvert}
          disabled={file.processing || !!file.result}
          aria-label={file.error ? `Retry converting ${file.name}` : `Convert ${file.name}`}
          title={file.error ? 'Retry conversion' : m["convert.tooltips.convert_file"]()}
        >
          <RotateCwIcon size={16} className={file.processing ? 'animate-spin' : ''} />
          {!file.processing && (
            <span className="text-xs font-bold font-mono max-sm:hidden">
              {file.error ? 'Retry' : 'Go'}
            </span>
          )}
        </button>

        {/* Download button — 44px touch target */}
        <button
          type="button"
          className={`btn p-0 h-11 w-11 flex items-center justify-center border-none transition-all duration-200 ${
            file.result
              ? 'highlight text-on-accent cursor-pointer shadow-md'
              : 'opacity-30 cursor-not-allowed bg-transparent text-muted'
          }`}
          onClick={handleDownload}
          disabled={!file.result}
          aria-label={`Download ${file.name}`}
          title={m["convert.tooltips.download_file"]()}
        >
          <DownloadIcon size={16} />
        </button>

        {/* Remove button — 44px touch target */}
        <button
          type="button"
          className="w-11 h-11 hover:bg-panel-highlight flex items-center justify-center border-none bg-transparent cursor-pointer"
          onClick={handleCancel}
          aria-label={`Remove ${file.name}`}
        >
          <XIcon size={18} className="text-muted" />
        </button>
      </div>
      {/* Success/error status for screen readers */}
      {resultLabel && (
        <span className="sr-only" aria-live="polite">
          {resultLabel}
        </span>
      )}
    </Panel>
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

export default FileItem;
