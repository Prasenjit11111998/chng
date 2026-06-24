import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../Logo';
import { ControlPanel } from './ControlPanel';
import { PreviewGrid } from './PreviewGrid';
import { DEFAULT_STATE, buildOutputSpecs } from './types';
import type { LogoPackState } from './types';
import { generateLogoPack, svgTextToDataUrl } from './logoPackEngine';
import '../../../lib/css/logo-grid.css';
import './logo-pack.css';

type ExportStatus = 'idle' | 'generating' | 'done' | 'error';

export const LogoPackTool: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<LogoPackState>(DEFAULT_STATE);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [progressLabel, setProgressLabel] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const abortRef = useRef(false);

  const handleChange = useCallback(<K extends keyof LogoPackState>(
    key: K, value: LogoPackState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleLogoLoad = useCallback((src: string, fileName: string, svgText: string | null) => {
    const mode = svgText ? 'svg' : 'raster';
    let finalSrc = src;
    if (svgText) {
      finalSrc = svgTextToDataUrl(svgText);
      // Clean up original temporary url to prevent leaks
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    }
    setState(prev => ({
      ...prev,
      logoSrc: finalSrc,
      logoFileName: fileName,
      logoSvgText: svgText,
      inputMode: mode,
    }));
  }, []);

  const handleLogoRemove = useCallback(() => {
    setState(prev => {
      if (prev.logoSrc) URL.revokeObjectURL(prev.logoSrc);
      return {
        ...prev,
        logoSrc: null,
        logoFileName: '',
        logoSvgText: null,
        inputMode: 'none',
      };
    });
  }, []);

  const specs = buildOutputSpecs(state);
  const enabledCount = specs.filter(s => s.enabled).length;

  const handleExport = async () => {
    if (!state.logoSrc || exportStatus === 'generating') return;
    abortRef.current = false;
    setExportStatus('generating');
    setProgressPct(0);
    setProgressLabel('Starting…');

    try {
      await generateLogoPack(state, specs, (label, pct) => {
        setProgressLabel(label);
        setProgressPct(pct);
      });
      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (err) {
      console.error('Logo Pack export failed:', err);
      setExportStatus('error');
      setProgressLabel('Export failed. Please try again.');
      setTimeout(() => setExportStatus('idle'), 4000);
    }
  };

  const isGenerating = exportStatus === 'generating';
  const isDone = exportStatus === 'done';

  return (
    <div className="lg-shell">
      {/* ── Topbar ── */}
      <div className="lg-topbar">
        <div className="lg-topbar__left">
          <button
            className="bg-accent text-on-accent border-none px-5 py-2 cursor-pointer flex items-center justify-center hover:opacity-90 pixel-btn flex-shrink-0"
            onClick={() => navigate('/')}
            aria-label="Go back to Chng home"
          >
            <Logo className="text-3xl lg:text-4xl font-black" />
          </button>
          <nav className="lg-breadcrumb" aria-label="Page location">
            <button className="lg-breadcrumb__link" onClick={() => navigate('/studio')}>
              Studio
            </button>
            <span className="lg-breadcrumb__sep" aria-hidden="true">/</span>
            <span className="lg-breadcrumb__current">Logo Pack</span>
          </nav>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="lg-body">
        {/* Left sidebar */}
        <aside className="lg-sidebar" aria-label="Logo Pack controls">
          <ControlPanel
            state={state}
            onChange={handleChange}
            onLogoLoad={handleLogoLoad}
            onLogoRemove={handleLogoRemove}
          />
        </aside>

        {/* Right main: preview grid + export bar */}
        <main className="lg-main" aria-label="Package preview">
          <div className="lp-preview-wrap">
            <PreviewGrid specs={specs} state={state} />
          </div>

          {/* ── Export bar ── */}
          <div className="lg-export-bar">
            {isGenerating ? (
              <div className="lp-progress">
                <div className="lp-progress__track">
                  <div
                    className="lp-progress__fill"
                    style={{ width: `${progressPct}%` }}
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="lp-progress__label">{progressLabel}</span>
              </div>
            ) : (
              <>
                <span className="lg-export-dims">
                  {state.inputMode === 'none'
                    ? 'Upload a logo to export'
                    : `${enabledCount} files · ZIP download`}
                </span>
                <div className="lg-export-actions">
                  <button
                    id="lp-export-btn"
                    className={`lg-export-btn${isDone ? ' lp-export-btn--done' : ' lg-export-btn--primary'}`}
                    onClick={handleExport}
                    disabled={state.inputMode === 'none' || isGenerating}
                    aria-label="Generate and download logo pack ZIP"
                  >
                    {isDone ? '✓ Downloaded!' : `↓ Export ZIP (${enabledCount} files)`}
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

export default LogoPackTool;
