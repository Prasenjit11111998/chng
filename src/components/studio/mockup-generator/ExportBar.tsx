import React from 'react';
import type { MockupCanvasHandle } from './MockupCanvas';

interface ExportBarProps {
  canvasRef: React.RefObject<MockupCanvasHandle | null>;
  disabled: boolean;
}

export const ExportBar: React.FC<ExportBarProps> = ({ canvasRef, disabled }) => {
  if (disabled) return null;

  return (
    <div className="lg-export-bar">
      <span className="lg-export-dims">Ready to export</span>
      <div className="lg-export-actions">
        <button
          className="lg-export-btn lg-export-btn--ghost"
          onClick={() => canvasRef.current?.copyToClipboard()}
          title="Copy image to clipboard"
          aria-label="Copy to clipboard"
        >
          ⎘ Copy
        </button>

        <button
          className="lg-export-btn lg-export-btn--ghost"
          onClick={() => canvasRef.current?.downloadPNG(true)}
          title="Download mockup without background (Transparent PNG)"
          aria-label="Download transparent mockup"
        >
          ↓ Transparent
        </button>

        <button
          id="mockup-download-png"
          className="lg-export-btn lg-export-btn--primary"
          onClick={() => canvasRef.current?.downloadPNG(false)}
          title="Download full mockup with background"
          aria-label="Download mockup"
        >
          ↓ Download PNG
        </button>
      </div>
    </div>
  );
};
