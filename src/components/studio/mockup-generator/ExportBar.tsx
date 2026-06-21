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
      <div className="lg-export-bar__inner">
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
          onClick={() => canvasRef.current?.downloadPNG(false)}
          title="Download full mockup with background"
          aria-label="Download mockup"
        >
          ↓ PNG
        </button>

        <button
          id="mockup-download-transparent"
          className="lg-export-btn lg-export-btn--ghost"
          onClick={() => canvasRef.current?.downloadPNG(true)}
          title="Download Mockup without background (Transparent PNG)"
          aria-label="Download transparent mockup"
        >
          ↓ Mockup Only
        </button>
      </div>
    </div>
  );
};
