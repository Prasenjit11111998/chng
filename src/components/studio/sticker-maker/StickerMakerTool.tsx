import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeBackground, Config } from '@imgly/background-removal';
import { downloadZip } from 'client-zip';
import FloatingHeader from '../../ui/floating-header';
import ProgressBar from '../../ProgressBar';
import { Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ToastManager } from '../../../lib/util/toast';
import '../../../lib/css/logo-grid.css';
import './sticker-maker.css';

interface Sticker {
  id: string;
  originalSrc: string;
  processedSrc: string | null;
  selected: boolean;
  status: 'pending' | 'processing' | 'done' | 'error';
}

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
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

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const removeBackgroundMagicWand = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const visited = new Uint8Array(width * height);
    const queue: [number, number][] = [];

    const isBackground = (x: number, y: number) => {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a < 50) return true; // Transparent is background
      return r > 210 && g > 210 && b > 210; // Near-white is background
    };

    // Add all border pixels that are background to the queue
    for (let x = 0; x < width; x++) {
      if (isBackground(x, 0)) {
        const idx = 0 * width + x;
        if (!visited[idx]) { visited[idx] = 1; queue.push([x, 0]); }
      }
      if (isBackground(x, height - 1)) {
        const idx = (height - 1) * width + x;
        if (!visited[idx]) { visited[idx] = 1; queue.push([x, height - 1]); }
      }
    }
    for (let y = 0; y < height; y++) {
      if (isBackground(0, y)) {
        const idx = y * width + 0;
        if (!visited[idx]) { visited[idx] = 1; queue.push([0, y]); }
      }
      if (isBackground(width - 1, y)) {
        const idx = y * width + (width - 1);
        if (!visited[idx]) { visited[idx] = 1; queue.push([width - 1, y]); }
      }
    }

    let head = 0;
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      
      const idx = (cy * width + cx) * 4;
      data[idx + 3] = 0; // Turn alpha to 0 (fully transparent)

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          if (!visited[nidx] && isBackground(nx, ny)) {
            visited[nidx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const addWhiteOutline = (srcCanvas: HTMLCanvasElement, thickness: number): HTMLCanvasElement => {
    const width = srcCanvas.width;
    const height = srcCanvas.height;
    
    const outCanvas = document.createElement('canvas');
    outCanvas.width = width + thickness * 2;
    outCanvas.height = height + thickness * 2;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return srcCanvas;

    // 1. Create a mask canvas of the original image filled with solid white
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.drawImage(srcCanvas, 0, 0);
      maskCtx.globalCompositeOperation = 'source-in';
      maskCtx.fillStyle = '#ffffff';
      maskCtx.fillRect(0, 0, width, height);
    }

    // 2. Draw the white mask multiple times in a circle to create the outline
    for (let angle = 0; angle < 360; angle += 15) {
      const rad = (angle * Math.PI) / 180;
      const dx = Math.round(Math.cos(rad) * thickness);
      const dy = Math.round(Math.sin(rad) * thickness);
      ctx.drawImage(maskCanvas, thickness + dx, thickness + dy);
    }

    // 3. Draw the original image on top
    ctx.drawImage(srcCanvas, thickness, thickness);

    return outCanvas;
  };

  const segmentStickers = (img: HTMLImageElement): Promise<string[]> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0);

      // Pre-process: Turn white/light background transparent using Magic Wand
      removeBackgroundMagicWand(canvas);

      const width = img.width;
      const height = img.height;
      
      const scale = Math.min(1.0, 250 / Math.max(width, height));
      const sw = Math.round(width * scale);
      const sh = Math.round(height * scale);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sw;
      tempCanvas.height = sh;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return resolve([canvas.toDataURL('image/png')]);
      tempCtx.drawImage(canvas, 0, 0, sw, sh);

      const imgData = tempCtx.getImageData(0, 0, sw, sh);
      const data = imgData.data;

      const grid = new Uint8Array(sw * sh);
      for (let i = 0; i < sw * sh; i++) {
        grid[i] = data[i * 4 + 3] > 15 ? 1 : 0;
      }

      const dilated = new Uint8Array(sw * sh);
      const targetDilationPixels = 2; // Precise grouping
      const radius = Math.max(0, Math.round(targetDilationPixels * scale));
      
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          if (grid[y * sw + x] === 1) {
            if (radius === 0) {
              dilated[y * sw + x] = 1;
              continue;
            }
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
                  if (dx * dx + dy * dy <= radius * radius) {
                    dilated[ny * sw + nx] = 1;
                  }
                }
              }
            }
          }
        }
      }

      const visited = new Uint8Array(sw * sh);
      const bboxes: BBox[] = [];

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const idx = y * sw + x;
          if (dilated[idx] === 1 && !visited[idx]) {
            const queue: [number, number][] = [[x, y]];
            visited[idx] = 1;
            let minX = x, maxX = x, minY = y, maxY = y;

            let head = 0;
            while (head < queue.length) {
              const [cx, cy] = queue[head++];
              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              const neighbors = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1]
              ];
              for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
                  const nidx = ny * sw + nx;
                  if (dilated[nidx] === 1 && !visited[nidx]) {
                    visited[nidx] = 1;
                    queue.push([nx, ny]);
                  }
                }
              }
            }

            const pad = 4;
            const origMinX = Math.max(0, Math.floor(minX / scale) - pad);
            const origMinY = Math.max(0, Math.floor(minY / scale) - pad);
            const origMaxX = Math.min(width - 1, Math.ceil(maxX / scale) + pad);
            const origMaxY = Math.min(height - 1, Math.ceil(maxY / scale) + pad);

            const origW = origMaxX - origMinX + 1;
            const origH = origMaxY - origMinY + 1;

            if (origW >= 20 && origH >= 20) {
              bboxes.push({ minX: origMinX, minY: origMinY, maxX: origMaxX, maxY: origMaxY });
            }
          }
        }
      }

      const stickerUrls: string[] = [];
      bboxes.forEach(box => {
        const w = box.maxX - box.minX + 1;
        const h = box.maxY - box.minY + 1;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = w;
        cropCanvas.height = h;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          cropCtx.drawImage(
            canvas,
            box.minX, box.minY, w, h,
            0, 0, w, h
          );

          // Add clean white outline (die-cut look) if selected
          let finalCanvas = cropCanvas;
          if (addBorder) {
            finalCanvas = addWhiteOutline(cropCanvas, borderSize);
          }
          
          stickerUrls.push(finalCanvas.toDataURL('image/png'));
        }
      });

      resolve(stickerUrls.length > 0 ? stickerUrls : [canvas.toDataURL('image/png')]);
    });
  };

  const resolvePinterestUrl = async (url: string): Promise<string> => {
    // If it's already a direct image URL, return it
    if (/\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(url)) {
      return url;
    }

    // If it's a pinterest page or short link, fetch the page to extract the image
    if (url.includes('pinterest.com') || url.includes('pin.it') || url.includes('pinimg.com')) {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const html = await response.text();
      
      // Extract og:image meta tag
      const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      if (ogMatch && ogMatch[1]) {
        return ogMatch[1];
      }
    }
    
    return url;
  };

  const handleFiles = (files: FileList | File[]) => {
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
    ToastManager.add({ type: 'info', message: 'Resolving Pinterest link...' });

    try {
      const resolvedUrl = await resolvePinterestUrl(url);
      const finalUrl = `https://corsproxy.io/?${encodeURIComponent(resolvedUrl)}`;
      
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
      ToastManager.add({ type: 'success', message: 'Image loaded from Pinterest!' });
    } catch(err) {
      console.error(err);
      ToastManager.add({ type: 'error', message: 'Failed to resolve Pinterest image.' });
    } finally {
      setIsFetchingLink(false);
    }
  };

  const executeStickerCreation = async () => {
    const pendingStickers = stickers.filter(s => s.status === 'pending');
    if (pendingStickers.length === 0) return;

    setIsProcessing(true);
    setProgressPct(0);
    setProgressLabel('Initializing AI Models...');

    let completedCount = 0;
    const processedItems: Sticker[] = [];

    try {
      for (const sticker of stickers) {
        if (sticker.status !== 'pending') {
          processedItems.push(sticker);
          continue;
        }

        setProgressLabel(`Removing background...`);
        const config: Config = {
          progress: (key, current, total) => {
            setProgressLabel(`Loading Model: ${key}`);
            setProgressPct(Math.round((current / total) * 100));
          }
        };

        const blob = await removeBackground(sticker.originalSrc, config);
        
        setProgressLabel(`Segmenting elements...`);
        const imgUrl = URL.createObjectURL(blob);
        const img = await loadImage(imgUrl);
        const segmentedUrls = await segmentStickers(img);
        URL.revokeObjectURL(imgUrl);

        const newElements: Sticker[] = segmentedUrls.map((url, idx) => ({
          id: `${sticker.id}-${idx}`,
          originalSrc: sticker.originalSrc,
          processedSrc: url,
          selected: true,
          status: 'done'
        }));

        processedItems.push(...newElements);
        completedCount++;
        setProgressPct(Math.round((completedCount / pendingStickers.length) * 100));
      }

      setStickers(processedItems);
      ToastManager.add({ type: 'success', message: 'Stickers generated successfully!' });
    } catch (error) {
      console.error('Sticker generation failed:', error);
      ToastManager.add({ type: 'error', message: 'Failed to generate stickers' });
    } finally {
      setIsProcessing(false);
      setProgressLabel('');
      setProgressPct(0);
    }
  };

  const toggleSelect = (id: string) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
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

  const convertToWebP = (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no context'));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('blob conversion failed'));
        }, 'image/webp', 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  };

  const hasProcessed = stickers.some(s => s.status === 'done');
  const selectedCount = stickers.filter(s => s.selected && s.status === 'done').length;
  const pendingCount = stickers.filter(s => s.status === 'pending').length;

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
            {pendingCount > 0 && (
              <section className="lg-section">
                <p className="lg-section__label">Sticker Creation</p>
                <button
                  type="button"
                  onClick={executeStickerCreation}
                  disabled={isProcessing}
                  className="w-full bg-accent text-on-accent border-none py-2.5 font-bold cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 pixel-btn"
                  style={{ borderRadius: '6px', fontSize: '12px' }}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Stickers ({pendingCount})
                </button>
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
                  <span className="lp-stats__hint">
                    {hasProcessed ? 'Click cards to toggle inclusion' : 'Click "Generate Stickers" in the sidebar'}
                  </span>
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
