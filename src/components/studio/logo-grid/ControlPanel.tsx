import React, { useRef, useCallback } from 'react';
import type { LogoGridState, GridType, CanvasFilter, CanvasPreset } from './types';
import {
  GRID_LABELS, GRID_COLOR_PRESETS,
  CANVAS_SIZES,
} from './types';
import { FilterSelector } from './FilterSelector';

// ── Types ────────────────────────────────────────────────────────────────────

interface ControlPanelProps {
  state: LogoGridState;
  onChange: <K extends keyof LogoGridState>(key: K, value: LogoGridState[K]) => void;
  onSnapCenter: () => void;
}

// ── Grid type tabs ───────────────────────────────────────────────────────────

const GRID_TYPES: GridType[] = ['thirds', 'golden', 'golden-spiral', 'fibonacci', 'radii', 'baseline', 'custom'];

// ── Logo drop zone ───────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];

const LogoUploadZone: React.FC<{
  src: string | null;
  fileName: string;
  onFile: (src: string, name: string) => void;
  onRemove: () => void;
}> = ({ src, fileName, onFile, onRemove }) => {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onFile(result, file.name);
    };
    reader.readAsDataURL(file);
  }, [onFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  if (src) {
    return (
      <div className="lg-upload-preview">
        <img
          src={src}
          alt="Uploaded logo"
          className="lg-upload-preview__img"
        />
        <div className="lg-upload-preview__meta">
          <span className="lg-upload-preview__name">{fileName}</span>
          <button
            className="lg-upload-preview__remove"
            onClick={onRemove}
            aria-label="Remove logo"
          >
            ✕ Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="logo-grid-upload-zone"
      className={`lg-dropzone ${dragging ? 'lg-dropzone--active' : ''}`}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload logo"
    >
      <div className="lg-dropzone__icon">↑</div>
      <p className="lg-dropzone__text">
        Drop logo here or <span className="lg-dropzone__link">browse</span>
      </p>
      <p className="lg-dropzone__formats">SVG · PNG · JPG · WebP</p>
      <input
        ref={inputRef}
        type="file"
        accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

// ── Section wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="lg-section">
    <p className="lg-section__label">{title}</p>
    {children}
  </div>
);

// ── Control Panel ────────────────────────────────────────────────────────────

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, onChange, onSnapCenter }) => {
  return (
    <div className="lg-control-panel">
      {/* ── Upload ── */}
      <Section title="Logo">
        <LogoUploadZone
          src={state.logoSrc}
          fileName={state.logoFileName}
          onFile={(src, name) => {
            onChange('logoSrc', src);
            onChange('logoFileName', name);
          }}
          onRemove={() => {
            onChange('logoSrc', null);
            onChange('logoFileName', '');
          }}
        />
      </Section>

      {/* ── Grid System ── */}
      <Section title="Grid System">
        <div className="lg-grid-tabs">
          {GRID_TYPES.map(g => (
            <button
              key={g}
              id={`grid-tab-${g}`}
              className={`lg-grid-tab ${state.gridType === g ? 'lg-grid-tab--active' : ''}`}
              onClick={() => onChange('gridType', g)}
              aria-pressed={state.gridType === g}
            >
              {GRID_LABELS[g]}
            </button>
          ))}
        </div>

        {/* Custom grid controls */}
        {state.gridType === 'custom' && (
          <div className="lg-custom-grid-controls">
            <div className="lg-inline-field">
              <label className="lg-inline-label">Cols</label>
              <input
                type="number"
                min={2} max={24}
                value={state.customCols}
                onChange={e => onChange('customCols', Number(e.target.value))}
                className="lg-num-input"
                aria-label="Grid columns"
              />
            </div>
            <div className="lg-inline-field">
              <label className="lg-inline-label">Rows</label>
              <input
                type="number"
                min={2} max={24}
                value={state.customRows}
                onChange={e => onChange('customRows', Number(e.target.value))}
                className="lg-num-input"
                aria-label="Grid rows"
              />
            </div>
          </div>
        )}
      </Section>

      {/* ── Grid Style ── */}
      <Section title="Grid Style">
        <div className="lg-slider-row">
          <label className="lg-inline-label">Opacity</label>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={state.gridOpacity}
            onChange={e => onChange('gridOpacity', Number(e.target.value))}
            className="lg-slider"
            aria-label="Grid opacity"
            id="grid-opacity-slider"
          />
          <span className="lg-slider-val">{Math.round(state.gridOpacity * 100)}%</span>
        </div>

        <div className="lg-color-row">
          <label className="lg-inline-label">Color</label>
          <div className="lg-color-presets">
            {GRID_COLOR_PRESETS.map(c => (
              <button
                key={c.value}
                className={`lg-color-dot ${state.gridColor === c.value ? 'lg-color-dot--active' : ''}`}
                style={{ background: c.value, border: c.value === '#ffffff' ? '1px solid #3e3e47' : undefined }}
                onClick={() => onChange('gridColor', c.value)}
                title={c.label}
                aria-label={`Grid color: ${c.label}`}
                aria-pressed={state.gridColor === c.value}
              />
            ))}
            {/* Custom color picker */}
            <label className="lg-color-custom" title="Custom color" aria-label="Custom grid color">
              <input
                type="color"
                value={state.gridColor || '#e8342b'}
                onChange={e => onChange('gridColor', e.target.value)}
                className="lg-color-input"
                aria-label="Pick custom grid color"
              />
              <span className="lg-color-custom__icon">+</span>
            </label>
          </div>
        </div>
      </Section>

      {/* ── Clearspace ── */}
      <Section title="Clearspace">
        <div className="lg-toggle-row">
          <label className="lg-toggle-label" htmlFor="clearspace-toggle">
            Show exclusion zone
          </label>
          <button
            id="clearspace-toggle"
            role="switch"
            aria-checked={state.showClearspace}
            className={`lg-toggle ${state.showClearspace ? 'lg-toggle--on' : ''}`}
            onClick={() => onChange('showClearspace', !state.showClearspace)}
          >
            <span className="lg-toggle__thumb" />
          </button>
        </div>

        {state.showClearspace && (
          <div className="lg-clearspace-mults">
            {[0.5, 1, 1.5, 2].map(m => (
              <button
                key={m}
                className={`lg-mult-btn ${state.clearspaceMultiplier === m ? 'lg-mult-btn--active' : ''}`}
                onClick={() => onChange('clearspaceMultiplier', m)}
                aria-pressed={state.clearspaceMultiplier === m}
              >
                {m}x
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* ── Canvas ── */}
      <Section title="Canvas Size">
        <div className="lg-canvas-presets">
          {(Object.keys(CANVAS_SIZES) as CanvasPreset[]).map(k => (
            <button
              key={k}
              id={`canvas-size-${k}`}
              className={`lg-preset-btn ${state.canvasSize === k ? 'lg-preset-btn--active' : ''}`}
              onClick={() => onChange('canvasSize', k)}
              aria-pressed={state.canvasSize === k}
            >
              {CANVAS_SIZES[k].label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Filter ── */}
      <Section title="Canvas Filter">
        <FilterSelector
          value={state.canvasFilter}
          onChange={f => onChange('canvasFilter', f as CanvasFilter)}
        />
      </Section>

      {/* ── Logo controls ── */}
      {state.logoSrc && (
        <Section title="Logo Position">
          <div className="lg-slider-row">
            <label className="lg-inline-label">Scale</label>
            <input
              type="range"
              min={0.1} max={2.5} step={0.01}
              value={state.logoScale}
              onChange={e => onChange('logoScale', Number(e.target.value))}
              className="lg-slider"
              aria-label="Logo scale"
              id="logo-scale-slider"
            />
            <span className="lg-slider-val">{state.logoScale.toFixed(2)}×</span>
          </div>

          <div className="lg-slider-row">
            <label className="lg-inline-label">Rotate</label>
            <input
              type="range"
              min={-180} max={180} step={1}
              value={state.logoRotation}
              onChange={e => onChange('logoRotation', Number(e.target.value))}
              className="lg-slider"
              aria-label="Logo rotation"
              id="logo-rotation-slider"
            />
            <span className="lg-slider-val">{state.logoRotation}°</span>
          </div>

          <button
            id="logo-grid-snap-center"
            className="lg-snap-btn"
            onClick={onSnapCenter}
            aria-label="Snap logo to center"
          >
            ⊕ Snap to center
          </button>
        </Section>
      )}

      {/* ── Labels ── */}
      <Section title="Labels">
        <div className="lg-toggle-row">
          <label className="lg-toggle-label" htmlFor="labels-toggle">
            Show axis labels
          </label>
          <button
            id="labels-toggle"
            role="switch"
            aria-checked={state.showLabels}
            className={`lg-toggle ${state.showLabels ? 'lg-toggle--on' : ''}`}
            onClick={() => onChange('showLabels', !state.showLabels)}
          >
            <span className="lg-toggle__thumb" />
          </button>
        </div>
      </Section>
    </div>
  );
};

export default ControlPanel;
