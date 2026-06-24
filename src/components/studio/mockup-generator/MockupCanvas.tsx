import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { MockupState } from './types';
import { CANVAS_ASPECT_DIMS } from './types';
import { drawPremiumBackground, drawImpeccableDevice, DEVICES } from './mockupDrawing';

export interface MockupCanvasHandle {
  downloadPNG(transparent?: boolean): void;
  copyToClipboard(): void;
}

interface MockupCanvasProps {
  state: MockupState;
}

export const MockupCanvas = forwardRef<MockupCanvasHandle, MockupCanvasProps>(
  ({ state }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const userImgRef = useRef<HTMLImageElement | null>(null);
    const customBgImgRef = useRef<HTMLImageElement | null>(null);
    
    const dims = CANVAS_ASPECT_DIMS[state.canvasAspect] ?? CANVAS_ASPECT_DIMS['16:9'];
    const W = dims.w;
    const H = dims.h;

    const drawOptions = { glassCornerRadius: state.glassCornerRadius };

    const render = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas size may have changed with aspect ratio
      canvas.width = W;
      canvas.height = H;

      // 1. Draw Impeccable Background
      drawPremiumBackground(
        ctx, W, H, 
        state.backgroundPaletteId, 
        customBgImgRef.current, 
        state.customBgFitMode
      );

      // 2. Determine Device Scale to fit nicely in canvas
      const device = DEVICES[state.selectedDeviceId];
      if (!device) return;

      // Fit device into 75% of canvas height/width for generous premium padding
      const scaleX = (W * 0.75) / device.frameW;
      const scaleY = (H * 0.75) / device.frameH;
      const deviceScale = Math.min(scaleX, scaleY);

      const fw = device.frameW * deviceScale;
      const fh = device.frameH * deviceScale;

      // Center the device
      const dx = (W - fw) / 2;
      const dy = (H - fh) / 2;

      // 3. Draw Device + Image + Glare + Shadows
      drawImpeccableDevice(
        ctx, 
        device, 
        dx, dy, 
        deviceScale, 
        userImgRef.current, 
        state.showShadows, 
        state.showGlare,
        drawOptions
      );

    }, [state, W, H, drawOptions]);

    // Load User Screenshot
    useEffect(() => {
      if (!state.screenshotSrc) {
        userImgRef.current = null;
        render();
        return;
      }
      const img = new Image();
      img.onload = () => {
        userImgRef.current = img;
        render();
      };
      img.src = state.screenshotSrc;
    }, [state.screenshotSrc, render]);

    // Load Custom Background
    useEffect(() => {
      if (!state.customBgSrc) {
        customBgImgRef.current = null;
        render();
        return;
      }
      const img = new Image();
      img.onload = () => {
        customBgImgRef.current = img;
        render();
      };
      img.src = state.customBgSrc;
    }, [state.customBgSrc, render]);

    // Re-render on any state change
    useEffect(() => { render(); }, [render]);

    // Export Handlers
    useImperativeHandle(ref, () => ({
      downloadPNG(transparent = false) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (transparent) {
          const off = document.createElement('canvas');
          off.width = W; off.height = H;
          const ctx2 = off.getContext('2d')!;
          
          const device = DEVICES[state.selectedDeviceId];
          if (device) {
             const scaleX = (W * 0.75) / device.frameW;
             const scaleY = (H * 0.75) / device.frameH;
             const deviceScale = Math.min(scaleX, scaleY);
             const dx = (W - device.frameW * deviceScale) / 2;
             const dy = (H - device.frameH * deviceScale) / 2;
             drawImpeccableDevice(ctx2, device, dx, dy, deviceScale, userImgRef.current, state.showShadows, state.showGlare, drawOptions);
          }

          off.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'mockup-transparent.png'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }, 'image/png');
        } else {
          canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'chng-mockup.png'; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }, 'image/png');
        }
      },
      copyToClipboard() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(async blob => {
          if (!blob) return;
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          } catch { /* silently fail */ }
        }, 'image/png');
      }
    }), [state, W, H, drawOptions]);

    // Compute CSS aspect ratio string
    const [aw, ah] = state.canvasAspect.split(':').map(Number);

    return (
      <div 
        className="w-full h-full flex items-center justify-center p-8 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full max-w-full max-h-full object-contain shadow-2xl"
          style={{ aspectRatio: `${aw} / ${ah}` }}
          aria-label="Mockup canvas preview"
          role="img"
        />
      </div>
    );
  }
);

MockupCanvas.displayName = 'MockupCanvas';
export default MockupCanvas;
