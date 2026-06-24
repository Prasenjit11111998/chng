import React from 'react';
import type { MockupState, BgFitMode, CanvasAspect } from './types';
import { DEVICES, PALETTES } from './mockupDrawing';

interface ControlPanelProps {
  state: MockupState;
  onChange: <K extends keyof MockupState>(k: K, v: MockupState[K]) => void;
}

const CANVAS_ASPECTS: { id: CanvasAspect; label: string }[] = [
  { id: '16:9',  label: '16:9'  },
  { id: '4:3',   label: '4:3'   },
  { id: '1:1',   label: '1:1'   },
  { id: '9:16',  label: '9:16'  },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, onChange }) => {
  // ── Screenshot ──────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange('screenshotSrc', url);
    onChange('screenshotFileName', file.name);
    e.target.value = '';
  };

  const handleRemoveScreenshot = () => {
    if (state.screenshotSrc) URL.revokeObjectURL(state.screenshotSrc);
    onChange('screenshotSrc', null);
    onChange('screenshotFileName', '');
  };

  // ── Custom Background ───────────────────────────────────────────────────────
  const handleCustomBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange('customBgSrc', url);
    onChange('customBgFileName', file.name);
    onChange('backgroundPaletteId', 'custom');
    e.target.value = '';
  };

  const handleRemoveCustomBg = () => {
    if (state.customBgSrc) URL.revokeObjectURL(state.customBgSrc);
    onChange('customBgSrc', null);
    onChange('customBgFileName', '');
    onChange('backgroundPaletteId', 'deep-space');
  };

  return (
    <div className="lg-control-panel">

      {/* ── 1. SCREENSHOT ── */}
      <section className="lg-section">
        <p className="lg-section__label">Your Screenshot</p>
        {!state.screenshotSrc ? (
          <label className="lg-dropzone" tabIndex={0} role="button" aria-label="Upload screenshot">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="lg-dropzone__icon">⬆</span>
            <p className="lg-dropzone__text">
              Drop or <span className="lg-dropzone__link">browse</span>
            </p>
            <p className="lg-dropzone__formats">PNG · JPG · WebP</p>
          </label>
        ) : (
          <div className="lg-upload-preview">
            <img
              src={state.screenshotSrc}
              alt="Screenshot preview"
              className="lg-upload-preview__img"
            />
            <div className="lg-upload-preview__meta">
              <span className="lg-upload-preview__name">{state.screenshotFileName}</span>
              <button className="lg-upload-preview__remove" onClick={handleRemoveScreenshot}>
                ✕ Remove
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. STYLE ── */}
      <section className="lg-section">
        <p className="lg-section__label">Style</p>
        <div className="lg-canvas-presets">
          {Object.values(DEVICES).map(device => (
            <button
              key={device.id}
              className={`lg-preset-btn${state.selectedDeviceId === device.id ? ' lg-preset-btn--active' : ''}`}
              onClick={() => onChange('selectedDeviceId', device.id)}
              aria-pressed={state.selectedDeviceId === device.id}
            >
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 500 }}>{device.name}</span>
              <span style={{ display: 'block', fontSize: '10px', opacity: 0.55, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{device.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. CANVAS ── */}
      <section className="lg-section">
        <p className="lg-section__label">Canvas Ratio</p>
        <div className="lg-grid-tabs">
          {CANVAS_ASPECTS.map(a => (
            <button
              key={a.id}
              className={`lg-grid-tab${state.canvasAspect === a.id ? ' lg-grid-tab--active' : ''}`}
              onClick={() => onChange('canvasAspect', a.id)}
              aria-pressed={state.canvasAspect === a.id}
            >
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. BACKGROUND ── */}
      <section className="lg-section">
        <p className="lg-section__label">Background</p>

        {/* Palette grid */}
        <div className="lg-filter-grid">
          {Object.keys(PALETTES).map(paletteId => {
            const p = PALETTES[paletteId];
            const isActive = state.backgroundPaletteId === paletteId && !state.customBgSrc;
            return (
              <button
                key={paletteId}
                className={`lg-filter-card${isActive ? ' lg-filter-card--active' : ''}`}
                onClick={() => {
                  onChange('backgroundPaletteId', paletteId);
                  if (state.customBgSrc) handleRemoveCustomBg();
                }}
                aria-pressed={isActive}
              >
                <div className="lg-filter-swatch">
                  <div
                    className="lg-filter-swatch__grid"
                    style={{
                      background: p.colors[0] === 'transparent'
                        ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0 / 8px 8px'
                        : `linear-gradient(135deg, ${p.colors[1]}, ${p.colors[0]}, ${p.colors[2]})`
                    }}
                  />
                </div>
                <span className="lg-filter-label">{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom image upload */}
        {!state.customBgSrc ? (
          <label className="lg-dropzone" style={{ marginTop: '8px' }} tabIndex={0} role="button" aria-label="Upload custom background image">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleCustomBgChange}
            />
            <span className="lg-dropzone__icon" style={{ fontSize: '13px' }}>🖼</span>
            <p className="lg-dropzone__text">Custom photo background</p>
            <p className="lg-dropzone__formats">JPG · PNG · WebP</p>
          </label>
        ) : (
          <div className="lg-upload-preview" style={{ marginTop: '8px' }}>
            <img src={state.customBgSrc} alt="Background preview" className="lg-upload-preview__img" />
            <div className="lg-upload-preview__meta">
              <span className="lg-upload-preview__name">{state.customBgFileName}</span>
              <button className="lg-upload-preview__remove" onClick={handleRemoveCustomBg}>
                ✕ Remove
              </button>
            </div>
          </div>
        )}

        {/* Fit mode — only when custom bg is loaded */}
        {state.customBgSrc && (
          <div className="lg-grid-tabs" style={{ marginTop: '8px' }}>
            {(['cover', 'contain', 'tile'] as BgFitMode[]).map(mode => (
              <button
                key={mode}
                className={`lg-grid-tab${state.customBgFitMode === mode ? ' lg-grid-tab--active' : ''}`}
                onClick={() => onChange('customBgFitMode', mode)}
                aria-pressed={state.customBgFitMode === mode}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── 5. EFFECTS ── */}
      <section className="lg-section">
        <p className="lg-section__label">Effects</p>

        <label className="lg-toggle-row" htmlFor="toggle-glare">
          <span className="lg-toggle-label">Screen Glare</span>
          <button
            id="toggle-glare"
            role="switch"
            aria-checked={state.showGlare}
            className={`lg-toggle${state.showGlare ? ' lg-toggle--on' : ''}`}
            onClick={() => onChange('showGlare', !state.showGlare)}
          >
            <span className="lg-toggle__thumb" />
          </button>
        </label>

        <label className="lg-toggle-row" htmlFor="toggle-shadows">
          <span className="lg-toggle-label">Ambient Shadows</span>
          <button
            id="toggle-shadows"
            role="switch"
            aria-checked={state.showShadows}
            className={`lg-toggle${state.showShadows ? ' lg-toggle--on' : ''}`}
            onClick={() => onChange('showShadows', !state.showShadows)}
          >
            <span className="lg-toggle__thumb" />
          </button>
        </label>

        {/* Corner Radius — only for Glass Card */}
        {state.selectedDeviceId === 'floating-glass' && (
          <div style={{ marginTop: '6px' }}>
            <div className="lg-slider-row">
              <span className="lg-inline-label">Corner Radius</span>
              <input
                type="range"
                min={0}
                max={80}
                step={2}
                value={state.glassCornerRadius}
                onChange={e => onChange('glassCornerRadius', Number(e.target.value))}
                className="lg-slider"
                aria-label="Glass card corner radius"
              />
              <span className="lg-slider-val">{state.glassCornerRadius}px</span>
            </div>
          </div>
        )}
      </section>

    </div>
  );
};

