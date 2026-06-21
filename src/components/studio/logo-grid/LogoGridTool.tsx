import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../Logo';
import { ControlPanel } from './ControlPanel';
import GridCanvas, { type GridCanvasHandle } from './GridCanvas';
import { ExportBar } from './ExportBar';
import type { LogoGridState } from './types';
import { CANVAS_SIZES } from './types';
import '../../../lib/css/logo-grid.css';

// ── Default state ─────────────────────────────────────────────────────────────

const defaultState: LogoGridState = {
  logoSrc: null,
  logoFileName: '',
  gridType: 'thirds',
  gridOpacity: 0.7,
  gridColor: '#e8342b',
  showClearspace: false,
  clearspaceMultiplier: 1,
  showLabels: true,
  canvasFilter: 'dark',
  canvasSize: 'square',
  logoScale: 1,
  logoX: null,
  logoY: null,
  logoRotation: 0,
  customCols: 6,
  customRows: 6,
};

// ── Component ─────────────────────────────────────────────────────────────────

export const LogoGridTool: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<LogoGridState>(defaultState);
  const canvasRef = useRef<GridCanvasHandle>(null);

  // Typed updater — keeps state updates minimal
  const handleChange = useCallback(<K extends keyof LogoGridState>(
    key: K, value: LogoGridState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // When canvas size changes, reset logo position to centre
  const handleChange2 = useCallback(<K extends keyof LogoGridState>(
    key: K, value: LogoGridState[K]
  ) => {
    setState(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'canvasSize') {
        next.logoX = null;
        next.logoY = null;
      }
      return next;
    });
  }, []);

  const snapCenter = useCallback(() => {
    setState(prev => ({ ...prev, logoX: null, logoY: null }));
  }, []);

  const { w, h } = CANVAS_SIZES[state.canvasSize];
  const aspect = w / h;

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
          <nav className="lg-breadcrumb" aria-label="Breadcrumb">
            <button
              className="lg-breadcrumb__link"
              onClick={() => navigate('/studio')}
              aria-label="Navigate to Studio"
            >
              Studio
            </button>
            <span className="lg-breadcrumb__sep" aria-hidden="true">/</span>
            <span className="lg-breadcrumb__current">Logo Grid Designer</span>
          </nav>
        </div>

        <div className="lg-topbar__right">
          <span className="lg-topbar__hint">Drag to reposition · Scroll to zoom</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="lg-body">
        {/* Left: Controls */}
        <aside className="lg-sidebar" aria-label="Grid controls">
          <ControlPanel
            state={state}
            onChange={handleChange2}
            onSnapCenter={snapCenter}
          />
        </aside>

        {/* Right: Canvas + export bar */}
        <main className="lg-main" aria-label="Canvas preview">
          <div className="lg-canvas-wrap">
            {/* Checkerboard pattern behind transparent canvases */}
            <div
              className={`lg-canvas-container ${
                state.canvasSize === 'landscape' ? 'lg-canvas-container--landscape' :
                state.canvasSize === 'a4' ? 'lg-canvas-container--a4' : ''
              }`}
              style={{ aspectRatio: `${aspect}` }}
            >
              <GridCanvas
                ref={canvasRef}
                state={state}
                onLogoPosChange={(x, y) => {
                  setState(prev => ({ ...prev, logoX: x, logoY: y }));
                }}
                onLogoScaleChange={(scale) => handleChange('logoScale', scale)}
              />

              {/* Empty state overlay */}
              {!state.logoSrc && (
                <div className="lg-canvas-empty" aria-hidden="true">
                  <div className="lg-canvas-empty__icon">⊞</div>
                  <p className="lg-canvas-empty__text">Upload a logo to begin</p>
                  <p className="lg-canvas-empty__hint">SVG · PNG · JPG · WebP</p>
                </div>
              )}
            </div>
          </div>

          {/* Export bar */}
          <ExportBar
            canvasRef={canvasRef}
            canvasSize={state.canvasSize}
            hasLogo={!!state.logoSrc}
          />
        </main>
      </div>
    </div>
  );
};

export default LogoGridTool;
