import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { LogoGridState } from './types';
import { CANVAS_SIZES, FILTER_GRID_COLORS } from './types';
import {
  drawBackground, drawLogoImage, drawGrid,
  drawClearspace, drawLabels, generateSVG,
} from './gridDrawing';

// ── Public handle (for export) ───────────────────────────────────────────────

export interface GridCanvasHandle {
  downloadPNG(transparent?: boolean): void;
  downloadSVG(): void;
  copyToClipboard(): void;
  getLogoMetrics(): { cx: number; cy: number; drawW: number; drawH: number };
}

// ── Props ────────────────────────────────────────────────────────────────────

interface GridCanvasProps {
  state: LogoGridState;
  onLogoPosChange?: (x: number, y: number) => void;
  onLogoScaleChange?: (scale: number) => void;
}

// ── Internal render state ────────────────────────────────────────────────────

interface RenderMetrics {
  logoCx: number;
  logoCy: number;
  logoDrawW: number;
  logoDrawH: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export const GridCanvas = forwardRef<GridCanvasHandle, GridCanvasProps>(
  ({ state, onLogoPosChange, onLogoScaleChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef    = useRef<HTMLImageElement | null>(null);
    const metricsRef = useRef<RenderMetrics>({ logoCx: 0, logoCy: 0, logoDrawW: 0, logoDrawH: 0 });

    // Track drag state
    const dragRef = useRef<{ active: boolean; startX: number; startY: number; originX: number; originY: number }>({
      active: false, startX: 0, startY: 0, originX: 0, originY: 0,
    });

    const { w, h } = CANVAS_SIZES[state.canvasSize];

    // Resolve grid color (auto from filter if no explicit override chosen)
    const effectiveGridColor = state.gridColor || FILTER_GRID_COLORS[state.canvasFilter];

    // ── Core render function ─────────────────────────────────────────────────

    const render = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const logoCx = state.logoX ?? w / 2;
      const logoCy = state.logoY ?? h / 2;

      // 1. Background
      drawBackground(ctx, w, h, state.canvasFilter);

      // 2. Logo
      let drawW = 0, drawH = 0;
      if (imgRef.current && state.logoSrc) {
        const result = drawLogoImage(ctx, {
          img: imgRef.current,
          scale: state.logoScale,
          cx: logoCx,
          cy: logoCy,
          rotation: state.logoRotation,
          canvasW: w,
          canvasH: h,
          filter: state.canvasFilter,
        });
        drawW = result.drawW;
        drawH = result.drawH;
      }

      metricsRef.current = { logoCx, logoCy, logoDrawW: drawW, logoDrawH: drawH };

      // 3. Grid overlay — isolated try/catch so a drawing bug never blanks the screen
      try {
        drawGrid(ctx, {
          type: state.gridType,
          color: effectiveGridColor,
          opacity: state.gridOpacity,
          canvasW: w,
          canvasH: h,
          logoCx,
          logoCy,
          customCols: state.customCols,
          customRows: state.customRows,
        });
      } catch (err) {
        // Restore any half-applied ctx state so the canvas is still readable
        ctx.restore();
        console.error('[GridCanvas] drawGrid error:', err);
      }

      // 4. Clearspace
      if (state.showClearspace && drawW > 0) {
        drawClearspace(ctx, logoCx, logoCy, drawW, drawH,
          state.clearspaceMultiplier, effectiveGridColor, state.gridOpacity);
      }

      // 5. Labels
      if (state.showLabels) {
        drawLabels(ctx, w, h, state.gridType, effectiveGridColor, state.gridOpacity);
      }
    }, [state, w, h, effectiveGridColor]);

    // ── Load image & re-render on logoSrc change ─────────────────────────────

    useEffect(() => {
      if (!state.logoSrc) {
        imgRef.current = null;
        render();
        return;
      }
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        render();
      };
      img.src = state.logoSrc;
    }, [state.logoSrc]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Re-render on any other state change ──────────────────────────────────

    useEffect(() => { render(); }, [render]);

    // ── Mouse/touch drag ─────────────────────────────────────────────────────

    const toCanvasCoords = (e: React.MouseEvent | MouseEvent) => {
      const canvas = canvasRef.current!;
      const rect   = canvas.getBoundingClientRect();
      const scaleX = w / rect.width;
      const scaleY = h / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top)  * scaleY,
      };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      const { x, y } = toCanvasCoords(e);
      dragRef.current = {
        active: true,
        startX: x,
        startY: y,
        originX: state.logoX ?? w / 2,
        originY: state.logoY ?? h / 2,
      };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = w / rect.width;
      const scaleY = h / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top)  * scaleY;
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      const nx = dragRef.current.originX + dx;
      const ny = dragRef.current.originY + dy;
      onLogoPosChange?.(nx, ny);
    }, [w, h, onLogoPosChange]);

    const handleMouseUp = useCallback(() => { dragRef.current.active = false; }, []);

    // ── Scroll to zoom ───────────────────────────────────────────────────────

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.min(3, Math.max(0.1, state.logoScale + delta));
      onLogoScaleChange?.(newScale);
    };

    useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    // ── Imperative handle (export actions) ───────────────────────────────────

    useImperativeHandle(ref, () => ({
      getLogoMetrics: () => metricsRef.current,

      downloadPNG(transparent = false) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (transparent) {
          // Re-render without background to an offscreen canvas
          const off = document.createElement('canvas');
          off.width = w; off.height = h;
          const ctx2 = off.getContext('2d')!;
          const m = metricsRef.current;

          // Grid only (transparent bg)
          drawGrid(ctx2, {
            type: state.gridType, color: effectiveGridColor,
            opacity: state.gridOpacity, canvasW: w, canvasH: h,
            logoCx: m.logoCx, logoCy: m.logoCy,
            customCols: state.customCols, customRows: state.customRows,
          });

          if (state.showClearspace && m.logoDrawW > 0) {
            drawClearspace(ctx2, m.logoCx, m.logoCy, m.logoDrawW, m.logoDrawH,
              state.clearspaceMultiplier, effectiveGridColor, state.gridOpacity);
          }

          off.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'logo-grid-overlay.png'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }, 'image/png');
        } else {
          canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'logo-grid.png'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }, 'image/png');
        }
      },

      downloadSVG() {
        const m = metricsRef.current;
        const svg = generateSVG({
          w, h,
          filter: state.canvasFilter,
          gridType: state.gridType,
          gridColor: effectiveGridColor,
          gridOpacity: state.gridOpacity,
          logoSrc: state.logoSrc,
          logoCx: m.logoCx, logoCy: m.logoCy,
          logoDrawW: m.logoDrawW, logoDrawH: m.logoDrawH,
          logoRotation: state.logoRotation,
          showClearspace: state.showClearspace,
          clearspaceMultiplier: state.clearspaceMultiplier,
          customCols: state.customCols, customRows: state.customRows,
        });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'logo-grid.svg'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },

      copyToClipboard() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(async blob => {
          if (!blob) return;
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          } catch { /* silently fail — browser may not support */ }
        }, 'image/png');
      },
    }), [state, w, h, effectiveGridColor]);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        className="logo-grid-canvas"
        style={{ cursor: state.logoSrc ? 'grab' : 'default' }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        aria-label="Logo grid canvas preview"
        role="img"
      />
    );
  }
);

GridCanvas.displayName = 'GridCanvas';
export default GridCanvas;
