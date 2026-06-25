import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingHeader from '../../ui/floating-header';
import { ControlPanel } from './ControlPanel';
import MockupCanvas, { MockupCanvasHandle } from './MockupCanvas';
import { ExportBar } from './ExportBar';
import { MockupState, DEFAULT_MOCKUP_STATE } from './types';
import '../../../lib/css/logo-grid.css';

export const MockupTool: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<MockupState>(DEFAULT_MOCKUP_STATE);
  const canvasRef = useRef<MockupCanvasHandle>(null);

  const handleChange = useCallback(<K extends keyof MockupState>(
    key: K, value: MockupState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="lg-shell">
      {/* ── Shared Floating Header ── */}
      <div className="w-full px-4 pt-4 flex justify-center flex-shrink-0">
        <FloatingHeader />
      </div>

      {/* ── Breadcrumb strip ── */}
      <div className="lg-topbar lg-topbar--slim">
        <div className="lg-topbar__left">
          <div className="flex items-center text-sm font-mono px-3 py-1 bg-panel-highlight pixel-box">
            <button
              onClick={() => navigate('/studio')}
              className="text-muted hover:text-foreground cursor-pointer bg-transparent border-none p-0 font-mono transition-colors"
            >
              Studio
            </button>
            <span className="text-separator mx-2">/</span>
            <span className="text-foreground font-semibold">Mockup Generator</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="lg-body">
        {/* Left: Controls */}
        <aside className="lg-sidebar" aria-label="Mockup controls">
          <ControlPanel state={state} onChange={handleChange} />
        </aside>

        {/* Right: Canvas + export bar */}
        <main className="lg-main" aria-label="Canvas preview">
          <div className="lg-canvas-wrap">
            <MockupCanvas ref={canvasRef} state={state} />
          </div>
          <ExportBar canvasRef={canvasRef} disabled={!state.screenshotSrc} />
        </main>
      </div>
    </div>
  );
};

export default MockupTool;
