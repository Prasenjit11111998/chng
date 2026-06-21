import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../Logo';
import { ControlPanel } from './ControlPanel';
import MockupCanvas, { MockupCanvasHandle } from './MockupCanvas';
import { ExportBar } from './ExportBar';
import { MockupState, DEFAULT_MOCKUP_STATE } from './types';
import '../../../lib/css/mockup-generator.css';
import '../../../lib/css/logo-grid.css'; // Reuse sidebar/control styling

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
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col font-body">
      {/* ── Shell Header ── */}
      <div className="mg-topbar">
        <div className="mg-topbar__left">
          <button
            className="bg-accent text-on-accent border-none px-4 py-1.5 cursor-pointer flex flex-shrink-0 items-center justify-center gap-2 hover:opacity-90 pixel-btn"
            onClick={() => navigate('/studio')}
            aria-label="Back to Studio"
          >
            <Logo className="text-xl font-black" />
          </button>
          
          <div className="mg-breadcrumb">
            <button className="mg-breadcrumb__link" onClick={() => navigate('/studio')}>
              Studio
            </button>
            <span className="mg-breadcrumb__sep">/</span>
            <span className="mg-breadcrumb__current">Mockup Generator</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mg-body">
        {/* Left: Controls */}
        <aside className="mg-sidebar" aria-label="Mockup controls">
           <ControlPanel state={state} onChange={handleChange} />
        </aside>

        {/* Right: Canvas + export bar */}
        <main className="mg-main" aria-label="Canvas preview">
          <div className="mg-canvas-wrap">
             <MockupCanvas ref={canvasRef} state={state} />
          </div>
          <ExportBar canvasRef={canvasRef} disabled={!state.screenshotSrc} />
        </main>
      </div>
    </div>
  );
};

export default MockupTool;
