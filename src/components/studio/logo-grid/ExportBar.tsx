import React from 'react';
import type { GridCanvasHandle } from './GridCanvas';
import type { CanvasPreset } from './types';
import { CANVAS_SIZES } from './types';

interface ExportBarProps {
  canvasRef: React.RefObject<GridCanvasHandle | null>;
  canvasSize: CanvasPreset;
  hasLogo: boolean;
}

export const ExportBar: React.FC<ExportBarProps> = ({ canvasRef, canvasSize, hasLogo }) => {
  const { w, h } = CANVAS_SIZES[canvasSize];

  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    canvasRef.current?.copyToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lg-export-bar">
      <span className="lg-export-dims">
        {w} × {h}px
      </span>

      <div className="lg-export-actions">
        <button
          id="logo-grid-copy"
          className="lg-export-btn lg-export-btn--ghost"
          onClick={handleCopy}
          title="Copy flat PNG to clipboard"
          aria-label="Copy to clipboard"
        >
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>

        <button
          id="logo-grid-download-png"
          className="lg-export-btn lg-export-btn--ghost"
          onClick={() => canvasRef.current?.downloadPNG(false)}
          title="Download flat PNG"
          aria-label="Download PNG"
        >
          ↓ PNG
        </button>

        <button
          id="logo-grid-download-transparent"
          className="lg-export-btn lg-export-btn--ghost"
          onClick={() => canvasRef.current?.downloadPNG(true)}
          title="Download grid overlay only — transparent background, no logo. Paste over your design in Figma / Photoshop."
          aria-label="Download grid overlay with transparent background"
        >
          ↓ Grid only
        </button>

        <button
          id="logo-grid-download-svg"
          className="lg-export-btn lg-export-btn--primary"
          onClick={() => canvasRef.current?.downloadSVG()}
          title="Download vector SVG"
          aria-label="Download SVG"
        >
          ↓ SVG
        </button>
      </div>

      {!hasLogo && (
        <span className="lg-export-hint">Upload a logo to export</span>
      )}
    </div>
  );
};

export default ExportBar;
