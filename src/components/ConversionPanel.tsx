import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectFiles,
  selectFilesReady,
  selectFilesResults,
  convertAll,
  downloadAll,
  clearAll,
  updateFileTo
} from '../store';
import Panel from './Panel';
import { Button } from './ui/button';
import { categories } from '../lib/converters';
import { m } from '../lib/paraglide/messages';
import FormatDropdown from './FormatDropdown';
import Dropdown from './Dropdown';
import { RefreshCw, FolderArchive, Trash2, Undo2 } from 'lucide-react';

// Duration of the undo window in ms
const UNDO_WINDOW_MS = 4000;

export const ConversionPanel: React.FC = () => {
  const files = useSelector(selectFiles);
  const ready = useSelector(selectFilesReady);
  const results = useSelector(selectFilesResults);
  const dispatch = useDispatch();

  // ── Undo-Clear state ─────────────────────────────────────────────────────────
  const [undoPending, setUndoPending] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(UNDO_WINDOW_MS / 1000);
  const [undoFileCount, setUndoFileCount] = useState(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancelPendingTimers = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    clearTimerRef.current = null;
    tickTimerRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cancelPendingTimers(), [cancelPendingTimers]);

  const handleClearAll = () => {
    if (files.length === 0) return;

    // If another undo was pending, commit it immediately before starting a new one
    if (undoPending) {
      cancelPendingTimers();
      dispatch(clearAll());
    }

    const count = files.length;
    setUndoFileCount(count);
    setUndoPending(true);
    setUndoCountdown(UNDO_WINDOW_MS / 1000);

    // Tick down every second
    tickTimerRef.current = setInterval(() => {
      setUndoCountdown(prev => {
        const next = prev - 1;
        return next;
      });
    }, 1000);

    // Commit the clear after the undo window expires
    clearTimerRef.current = setTimeout(() => {
      cancelPendingTimers();
      setUndoPending(false);
      dispatch(clearAll());
    }, UNDO_WINDOW_MS);
  };

  const handleUndo = () => {
    cancelPendingTimers();
    setUndoPending(false);
    // Files are still in Redux state — nothing has been cleared yet
  };

  const handleConvertAll = () => {
    dispatch(convertAll() as any);
  };

  const handleDownloadAll = () => {
    dispatch(downloadAll() as any);
  };

  const sameCategory = useMemo(() => {
    if (files.length === 0) return false;
    const getCategory = (ext: string) => {
      if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) return 'image';
      if (['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext)) return 'audio';
      if (['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(ext)) return 'video';
      return 'doc';
    };
    const firstCat = getCategory(files[0].from);
    return files.every(f => getCategory(f.from) === firstCat);
  }, [files]);

  const commonTarget = useMemo(() => {
    if (files.length === 0) return '';
    const firstTo = files[0].to;
    const allSame = files.every(f => f.to === firstTo);
    return allSame ? firstTo : '';
  }, [files]);

  const isProcessingAny = useMemo(() => files.some(f => f.processing), [files]);

  return (
    <Panel className="w-full">
      <div className="p-1 md:p-2 flex flex-col gap-4 w-full">

        {/* ── Undo-Clear Banner ── */}
        {undoPending && (
          <div
            className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-panel-highlight pixel-box border border-separator animate-fade-in"
            role="status"
            aria-live="polite"
          >
            <span className="font-mono text-xs text-muted">
              <span className="text-foreground font-semibold">{undoFileCount}</span> file{undoFileCount !== 1 ? 's' : ''} will be cleared in{' '}
              <span className="text-accent font-bold tabular-nums">{undoCountdown}s</span>
            </span>
            <button
              type="button"
              onClick={handleUndo}
              className="btn highlight px-3 h-8 flex items-center gap-1.5 text-on-accent text-xs font-bold font-mono"
              aria-label="Undo clear all"
            >
              <Undo2 size={13} />
              Undo
            </button>
          </div>
        )}

        <div className="w-full h-auto flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap md:flex-nowrap">
          <div className="flex items-center flex-col sm:flex-row gap-2 max-sm:w-full">
            <Button
              type="button"
              onClick={handleConvertAll}
              variant="default"
              className="flex gap-3 max-sm:w-full sm:max-w-[10.5rem] text-on-accent"
              disabled={!ready}
            >
              <RefreshCw
                size={20}
                className={!ready ? 'animate-spin' : ''}
              />
              <span className="font-semibold">
                {m['convert.panel.convert_all']()}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex gap-3 max-sm:w-full sm:max-w-[10.5rem] text-foreground"
              disabled={!ready || !results}
              onClick={handleDownloadAll}
            >
              <FolderArchive size={20} />
              <span className="font-semibold">
                {m['convert.panel.download_all']()}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="p-4 flex gap-3 max-sm:w-full text-foreground"
              disabled={files.length === 0 || undoPending}
              onClick={handleClearAll}
              aria-label={m['convert.panel.remove_all']()}
              title={m['convert.panel.remove_all']()}
            >
              <Trash2 size={20} />
              <span className="inline sm:hidden font-semibold">
                {m['convert.panel.remove_all']()}
              </span>
            </Button>
          </div>

          <div className="w-full bg-separator h-0.5 flex md:hidden" />

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-xxs uppercase tracking-wider text-muted">
              {m['convert.panel.set_all_to']()}
            </span>
            <div className="w-32">
              {sameCategory ? (
                <FormatDropdown
                  selected={commonTarget}
                  onselect={(targetFormat) => {
                    files.forEach(file => {
                      dispatch(updateFileTo({ id: file.id, to: targetFormat }));
                    });
                  }}
                  categories={categories}
                  dropdownSize="large"
                  from={files[0].from}
                />
              ) : (
                <Dropdown
                  options={[m['convert.panel.na']()]}
                  disabled={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ConversionPanel;