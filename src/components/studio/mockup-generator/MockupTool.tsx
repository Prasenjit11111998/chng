import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../Logo';
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
      {/* ── Top nav bar ── */}
      <div className="lg-topbar">
        <div className="lg-topbar__left">
          <button
            className="bg-accent text-on-accent border-none px-5 py-2 cursor-pointer flex items-center justify-center hover:opacity-90 pixel-btn flex-shrink-0"
            onClick={() => navigate('/')}
            aria-label="Go back to Chng home"
          >
            <Logo className="text-3xl lg:text-4xl font-black" />
          </button>

          {/* Breadcrumb */}
          <nav className="lg-breadcrumb" aria-label="Page location">
            <button
              className="lg-breadcrumb__link"
              onClick={() => navigate('/studio')}
            >
              Studio
            </button>
            <span className="lg-breadcrumb__sep" aria-hidden="true">/</span>
            <span className="lg-breadcrumb__current">Mockup Generator</span>
          </nav>
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
