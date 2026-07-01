import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeBackground, Config } from '@imgly/background-removal';
import { downloadZip } from 'client-zip';
import FloatingHeader from '../../ui/floating-header';
import ProgressBar from '../../ProgressBar';
import { Image as ImageIcon, Sparkles, XCircle } from 'lucide-react';
import { ToastManager } from '../../../lib/util/toast';
import { loadImage, segmentStickers, convertToWebP } from './sticker-maker-utils';
import '../../../lib/css/logo-grid.css';
import './sticker-maker.css';

interface Sticker {
  id: string;
  originalSrc: string;
  processedSrc: string | null;
  selected: boolean;
  status: 'pending' | 'processing' | 'done' | 'error';
}

const PixelTick: React.FC<{ className?: string; color?: string }> = ({ className, color = '#2ea87a' }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      imageRendering: 'pixelated',
      shapeRendering: 'crispEdges',
      color: color
    }}
    aria-hidden="true"
  >
    <rect x="0" y="4" width="2" height="2" fill="currentColor" />
    <rect x="2" y="6" width="2" height="2" fill="currentColor" />
    <rect x="4" y="4" width="2" height="2" fill="currentColor" />
    <rect x="6" y="2" width="2" height="2" fill="currentColor" />
  </svg>
);

export const StickerMakerTool: React.FC = () => {
  const navigate = useNavigate();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [format, setFormat] = useState<'png' | 'webp'>('png');
  const [addBorder, setAddBorder] = useState<boolean>(true);
  const [borderSize, setBorderSize] = useState<number>(5);
  const [progressLabel, setProgressLabel] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);
  const CONCURRENCY = 2;
  const MAX_IMAGE_SIZE = 2000;

  const getResizedBlob = async (src: string): Promise<Blob | string> => {
    const img = await loadImage(src);
    if (img.width <= MAX_IMAGE_SIZE && img.height <= MAX_IMAGE_SIZE) {
      return src;
    }
    const canvas = document.createElement('canvas');
    const scale = Math.min(MAX_IMAGE_SIZE / img.width, MAX_IMAGE_SIZE / img.height);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(b => resolve(b || new Blob())));
  };

  const CORS_PROXY = 'https://corsproxy.io/?';

  const resolvePinterestUrl = async (url: string): Promise<string | null> => {
    if (/\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url)) {
      return url;
    }

    if (url.includes('pinterest.com') || url.includes('pin.it') || url.includes('pinimg.com')) {
      try {
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const html = await response.text();
        const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
        if (ogMatch && ogMatch[1]) {
          return ogMatch[1];
        }
        return null;
      } catch {
        return null;
      }
    }

    return url;
  };

  const handleFiles = (files: FileList | File[]) => {
    const maxSize = 20 * 1024 * 1024;
    const warnSize = 10 * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxSize) {
        ToastManager.add({ type: 'error', message: `"${file.name}" is too large (max 20MB).` });
        return;
      }
      if (file.size > warnSize) {
        ToastManager.add({ type: 'info', message: `"${file.name}" is large — processing may be slow.` });
      }
    }
    const newStickers: Sticker[] = Array.from(files).map(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const src = URL.createObjectURL(file);
      return { id, originalSrc: src, processedSrc: null, selected: true, status: 'pending' };
    });

    setStickers(prev => [...prev, ...newStickers]);
    ToastManager.add({ type: 'info', message: `${newStickers.length} image(s) added to queue` });
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim() || isFetchingLink) return;
    
    const url = linkInput.trim();
    setIsFetchingLink(true);
    ToastManager.add({ type: 'info', message: 'Fetching image from URL...' });

    try {
      const resolvedUrl = await resolvePinterestUrl(url);
      if (!resolvedUrl) {
        ToastManager.add({ type: 'error', message: 'Could not fetch image from this URL. Try uploading the file directly.' });
        return;
      }

      const finalUrl = `${CORS_PROXY}${encodeURIComponent(resolvedUrl)}`;
      
      const id = Math.random().toString(36).substr(2, 9);
      const newSticker: Sticker = { 
        id, 
        originalSrc: finalUrl, 
        processedSrc: null, 
        selected: true, 
        status: 'pending' 
      };
      
      setStickers(prev => [...prev, newSticker]);
      setLinkInput('');
      ToastManager.add({ type: 'success', message: 'Image loaded!' });
    } catch {
      ToastManager.add({ type: 'error', message: 'Failed to load image. Try uploading the file directly.' });
    } finally {
      setIsFetchingLink(false);
    }
  };

  const processWithConcurrency = async <T,>(
    items: T[],
    processor: (item: T) => Promise<void>,
    concurrency: number
  ): Promise<void> => {
    const iter = items[Symbol.iterator]();
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      for (;;) {
        const { value, done } = iter.next();
        if (done || !isProcessingRef.current) break;
        await processor(value);
      }
    });
    await Promise.all(workers);
  };

  const executeStickerCreation = async () => {
    const pendingStickers = stickers.filter(s => s.status === 'pending');
    if (pendingStickers.length === 0) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setProgressPct(0);
    setProgressLabel('Generating stickers...');

    setStickers(prev => prev.map(s =>
      s.status === 'pending' ? { ...s, status: 'processing' } : s
    ));

    let completedCount = 0;
    const totalPending = pendingStickers.length;

    await processWithConcurrency(
      pendingStickers,
      async (sticker) => {
        if (!isProcessingRef.current) return;

        try {
          const config: Config = {
            progress: (key, _current, _total) => {
              setProgressLabel(`Loading Model: ${key}`);
            }
          };

          const input = await getResizedBlob(sticker.originalSrc);
          const blob = await removeBackground(input, config);
          if (!isProcessingRef.current) return;

          const imgUrl = URL.createObjectURL(blob);
          const img = await loadImage(imgUrl);
          const segmentedUrls = await segmentStickers(img, addBorder, borderSize);
          URL.revokeObjectURL(imgUrl);

          const results: Sticker[] = segmentedUrls.map((url, idx) => ({
            id: `${sticker.id}-${idx}`,
            originalSrc: sticker.originalSrc,
            processedSrc: url,
            selected: true,
            status: 'done' as const
          }));

          setStickers(prev => {
            const next = prev.filter(s => s.id !== sticker.id);
            return [...next, ...results];
          });
        } catch (error) {
          console.error(`Sticker ${sticker.id} failed:`, error);
          setStickers(prev => prev.map(s =>
            s.id === sticker.id ? { ...s, status: 'error' } : s
          ));
        } finally {
          completedCount++;
          setProgressPct(Math.round((completedCount / totalPending) * 100));
        }
      },
      CONCURRENCY
    );

    if (!isProcessingRef.current) {
      setStickers(prev => prev.map(s =>
        s.status === 'processing' ? { ...s, status: 'error' } : s
      ));
    }

    isProcessingRef.current = false;
    setIsProcessing(false);
    setProgressLabel('');
    setProgressPct(0);
    ToastManager.add({ type: 'success', message: 'Stickers generated!' });
  };

  const toggleSelect = (id: string) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const selectAll = () => {
    setStickers(prev => prev.map(s => s.status === 'done' ? { ...s, selected: true } : s));
  };

  const deselectAll = () => {
    setStickers(prev => prev.map(s => s.status === 'done' ? { ...s, selected: false } : s));
  };

  const removeSticker = (id: string) => {
    setStickers(prev => {
      const st = prev.find(s => s.id === id);
      if (st?.originalSrc && st.originalSrc.startsWith('blob:')) URL.revokeObjectURL(st.originalSrc);
      if (st?.processedSrc && st.processedSrc.startsWith('blob:')) URL.revokeObjectURL(st.processedSrc);
      return prev.filter(s => s.id !== id);
    });
  };

  const resetWorkspace = () => {
    stickers.forEach(s => {
      if (s.originalSrc.startsWith('blob:')) URL.revokeObjectURL(s.originalSrc);
      if (s.processedSrc && s.processedSrc.startsWith('blob:')) URL.revokeObjectURL(s.processedSrc);
    });
    setStickers([]);
    setLinkInput('');
    setIsDone(false);
    ToastManager.add({ type: 'info', message: 'Workspace reset' });
  };

  const downloadStickers = async () => {
    const toDownload = stickers.filter(s => s.selected && s.status === 'done' && s.processedSrc);
    if (toDownload.length === 0) return;

    try {
      setProgressLabel('Generating ZIP...');
      setIsProcessing(true);
      
      const files = await Promise.all(toDownload.map(async (s, i) => {
        const res = await fetch(s.processedSrc!);
        const blob = await res.blob();
        
        let finalBlob = blob;
        if (format === 'webp') {
          finalBlob = await convertToWebP(blob);
        }
        
        return {
          name: `sticker-${i + 1}.${format}`,
          lastModified: new Date(),
          input: finalBlob
        };
      }));

      const zipBlob = await downloadZip(files).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = "stickers.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch(err) {
      console.error(err);
      ToastManager.add({ type: 'error', message: 'Failed to create ZIP package' });
    } finally {
      setIsProcessing(false);
      setProgressLabel('');
    }
  };



  const hasProcessed = useMemo(() => stickers.some(s => s.status === 'done'), [stickers]);
  const selectedCount = useMemo(() => stickers.filter(s => s.selected && s.status === 'done').length, [stickers]);
  const pendingCount = useMemo(() => stickers.filter(s => s.status === 'pending').length, [stickers]);

  return (
    <div className="lg-shell">
      <div className="w-full px-4 pt-4 flex justify-center flex-shrink-0">
        <FloatingHeader />
      </div>

      <div className="lg-topbar lg-topbar--slim">
        <div className="lg-topbar__left">
          <div className="flex items-center text-sm font-mono px-3 py-1 bg-panel-highlight pixel-box">
            <button onClick={() => navigate('/studio')} className="text-muted hover:text-foreground cursor-pointer bg-transparent border-none p-0 font-mono transition-colors">
              Studio
            </button>
            <span className="text-separator mx-2">/</span>
            <span className="text-foreground">Sticker Maker</span>
          </div>
        </div>
      </div>

      <div className="lg-body">
        <aside className="lg-sidebar" aria-label="Sticker Maker controls">
          <div className="lg-control-panel">
            {/* ── 1. UPLOAD IMAGE ── */}
            <section className="lg-section">
              <p className="lg-section__label">Source Images</p>
              <label 
                className="lg-dropzone" 
                tabIndex={0}
                role="button"
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="sr-only" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                  }} 
                />
                <span className="lg-dropzone__icon">⊕</span>
                <p className="lg-dropzone__text">Drop or <span className="lg-dropzone__link">browse</span></p>
                <p className="lg-dropzone__formats">PNG · JPG · WEBP</p>
              </label>
            </section>

            {/* ── 2. PINTEREST / WEB LINK ── */}
            <section className="lg-section">
              <p className="lg-section__label">From URL / Pinterest</p>
              <form onSubmit={handleLinkSubmit} className="lp-input-row">
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <input 
                    type="text" 
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Paste image or Pinterest URL..." 
                    className="lp-text-input"
                    style={{ flex: 1 }}
                    disabled={isFetchingLink}
                  />
                  <button 
                    type="submit" 
                    disabled={!linkInput || isProcessing || isFetchingLink}
                    className="bg-accent text-on-accent border-none px-3 py-1 cursor-pointer hover:opacity-90 pixel-btn"
                    style={{ fontSize: '10px', borderRadius: '4px' }}
                  >
                    {isFetchingLink ? '...' : 'Fetch'}
                  </button>
                </div>
              </form>
            </section>

            {/* ── 3. STICKER STYLE (DIE-CUT) ── */}
            <section className="lg-section">
              <p className="lg-section__label">Sticker Style</p>
              <div className="sm-style-options">
                <label className="lp-toggle-row">
                  <span className="lp-toggle-label">Add White Border Outline</span>
                  <button
                    role="switch"
                    aria-checked={addBorder}
                    className={`lp-toggle${addBorder ? ' lp-toggle--on' : ''}`}
                    onClick={() => setAddBorder(!addBorder)}
                  >
                    <span className="lp-toggle__thumb" />
                  </button>
                </label>
                {addBorder && (
                  <div className="lg-inline-field mt-2">
                    <span className="lg-inline-label">Border size:</span>
                    <input 
                      type="number" 
                      min="2" 
                      max="15" 
                      value={borderSize} 
                      onChange={e => setBorderSize(parseInt(e.target.value) || 5)}
                      className="lg-num-input" 
                    />
                    <span className="lg-inline-label">px</span>
                  </div>
                )}
              </div>
            </section>

            {/* ── 4. ACTIONS ── */}
            {(pendingCount > 0 || isProcessing) && (
              <section className="lg-section">
                <p className="lg-section__label">Sticker Creation</p>
                {isProcessing ? (
                  <button
                    type="button"
                    onClick={() => { isProcessingRef.current = false; }}
                    className="w-full bg-red-600 text-white border-none py-2.5 font-bold cursor-pointer flex items-center justify-center gap-2 pixel-btn"
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Processing
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={executeStickerCreation}
                    disabled={pendingCount === 0}
                    className="w-full bg-accent text-on-accent border-none py-2.5 font-bold cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 pixel-btn"
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Stickers ({pendingCount})
                  </button>
                )}
              </section>
            )}

            {/* ── 5. EXPORT OPTIONS ── */}
            <section className="lg-section">
              <p className="lg-section__label">Export Format</p>
              <div className="lp-grid-tabs">
                <button 
                  className={`lp-grid-tab${format === 'png' ? ' lp-grid-tab--active' : ''}`}
                  onClick={() => setFormat('png')}
                >
                  PNG
                </button>
                <button 
                  className={`lp-grid-tab${format === 'webp' ? ' lp-grid-tab--active' : ''}`}
                  onClick={() => setFormat('webp')}
                >
                  WEBP
                </button>
              </div>
            </section>
          </div>
        </aside>

        <main className="lg-main" aria-label="Sticker preview">
          <div className="lp-preview-wrap">
            {stickers.length === 0 ? (
              <div className="lp-empty">
                <ImageIcon className="w-12 h-12 lp-empty__icon" />
                <h3 className="lp-empty__heading">Create Transparent Stickers</h3>
                <p className="lp-empty__sub">
                  Upload images or paste Pinterest links. The tool automatically runs a local WASM model in your browser to remove backgrounds and isolate elements.
                </p>
              </div>
            ) : (
              <div className="lp-grid-wrap">
                <div className="lp-stats-strip">
                  <span className="lp-stats__count">
                    {hasProcessed ? (
                      <>
                        <strong>{selectedCount}</strong> / {stickers.length} stickers selected
                      </>
                    ) : (
                      <>
                        <strong>{pendingCount}</strong> images queued (pending generation)
                      </>
                    )}
                  </span>
                  {hasProcessed ? (
                    <div className="flex items-center gap-2">
                      <button onClick={selectAll} className="lp-stats__action">Select All</button>
                      <button onClick={deselectAll} className="lp-stats__action">Deselect All</button>
                    </div>
                  ) : (
                    <span className="lp-stats__hint">Click "Generate Stickers" in the sidebar</span>
                  )}
                </div>
                
                <div className="lp-cards">
                  {stickers.map((sticker) => (
                    <div 
                      key={sticker.id} 
                      className={`lp-card ${sticker.selected && sticker.status === 'done' ? 'lp-card--selected' : ''}`}
                      onClick={() => {
                        if (sticker.status === 'done') toggleSelect(sticker.id);
                      }}
                    >
                      <div className="lp-card__thumb sm-sticker-thumb">
                        {sticker.status === 'processing' ? (
                          <div className="lp-card__placeholder">
                            <div className="sm-spinner"></div>
                          </div>
                        ) : sticker.status === 'error' ? (
                          <div className="lp-card__placeholder lp-card__placeholder--disabled text-red-500 font-mono text-xs">
                            Error
                          </div>
                        ) : sticker.status === 'pending' ? (
                          <>
                            <div className="absolute top-2 left-2 bg-[#ffaa00] text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm z-10">
                              QUEUED
                            </div>
                            <img src={sticker.originalSrc} alt="Queued source" className="lp-card__img object-contain p-2 opacity-50" />
                          </>
                        ) : (
                          <>
                            {sticker.selected && (
                              <div className="sm-sticker-badge bg-accent text-on-accent">
                                <PixelTick color="#ffffff" />
                              </div>
                            )}
                            <img src={sticker.processedSrc!} alt="Sticker" className="lp-card__img object-contain p-2" />
                          </>
                        )}
                        <button 
                          className="sm-sticker-remove-btn"
                          onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="lp-card__meta">
                        <span className="lp-card__name">
                          {sticker.status === 'done' ? 'Extracted Item' : sticker.status.toUpperCase()}
                        </span>
                        <div className="lp-card__badges">
                          <span className={`lp-badge-format ${sticker.selected && sticker.status === 'done' ? 'text-accent' : 'text-muted'}`}>
                            {sticker.status === 'done' ? format.toUpperCase() : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg-export-bar">
            {isProcessing ? (
              <div className="lp-progress flex flex-col items-start gap-1.5 w-full">
                <span className="lp-progress__label font-mono text-xs">{progressLabel}</span>
                <ProgressBar
                  progress={progressPct}
                  min={0}
                  max={100}
                  label={progressLabel}
                />
              </div>
            ) : (
              <>
                <span className="lg-export-dims">
                  {hasProcessed 
                    ? `${selectedCount} stickers selected` 
                    : `${pendingCount} images pending generation`}
                </span>
                <div className="lg-export-actions">
                  {stickers.length > 0 && (
                    <button
                      className="lg-export-btn lg-export-btn--ghost"
                      onClick={resetWorkspace}
                      disabled={isProcessing}
                    >
                      Reset
                    </button>
                  )}
                  <button
                    className={`lg-export-btn ${isDone ? 'lp-export-btn--done' : 'lg-export-btn--primary'}`}
                    onClick={downloadStickers}
                    disabled={selectedCount === 0 || isProcessing}
                  >
                    {isDone ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <PixelTick color="#2ea87a" />
                        Downloaded!
                      </span>
                    ) : (
                      `↓ Download ZIP (${selectedCount} stickers)`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StickerMakerTool;
