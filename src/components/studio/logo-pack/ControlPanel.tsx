import React, { useRef, useState, useEffect } from 'react';
import type { LogoPackState, OgFit } from './types';

interface ControlPanelProps {
  state: LogoPackState;
  onChange: <K extends keyof LogoPackState>(k: K, v: LogoPackState[K]) => void;
  onLogoLoad: (src: string, fileName: string, svgText: string | null) => void;
  onLogoRemove: () => void;
}

// ── Small UI atoms ────────────────────────────────────────────────────────────

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}
const ToggleRow: React.FC<ToggleRowProps> = ({ id, label, checked, onChange }) => (
  <label className="lp-toggle-row" htmlFor={id}>
    <span className="lp-toggle-label">{label}</span>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      className={`lp-toggle${checked ? ' lp-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="lp-toggle__thumb" />
    </button>
  </label>
);

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}
const ColorRow: React.FC<ColorRowProps> = ({ label, value, onChange, id }) => (
  <div className="lp-color-row">
    <label className="lp-inline-label" htmlFor={id}>{label}</label>
    <div className="lp-color-input-wrap">
      <input
        id={id}
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="lp-color-native"
        aria-label={label}
      />
      <span className="lp-color-hex">{value.toUpperCase()}</span>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, onChange, onLogoLoad, onLogoRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for text inputs to prevent canvas redraw lag on every keystroke
  const [localProjectName, setLocalProjectName] = useState(state.projectName);
  const [localOgTagline, setLocalOgTagline] = useState(state.ogTagline);

  // Keep local state in sync if parent state changes externally (e.g. default resets)
  useEffect(() => {
    setLocalProjectName(state.projectName);
  }, [state.projectName]);

  useEffect(() => {
    setLocalOgTagline(state.ogTagline);
  }, [state.ogTagline]);

  // Force immediate update on blur
  const handleProjectNameBlur = () => {
    if (localProjectName !== state.projectName) {
      onChange('projectName', localProjectName);
    }
  };

  const handleOgTaglineBlur = () => {
    if (localOgTagline !== state.ogTagline) {
      onChange('ogTagline', localOgTagline);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
    const url = URL.createObjectURL(file);
    let svgText: string | null = null;

    if (isSvg) {
      svgText = await file.text();
    }
    onLogoLoad(url, file.name, svgText);
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
    const url = URL.createObjectURL(file);
    let svgText: string | null = null;
    if (isSvg) svgText = await file.text();
    onLogoLoad(url, file.name, svgText);
  };

  const isRaster = state.inputMode === 'raster';
  const hasLogo = state.inputMode !== 'none';

  return (
    <div className="lg-control-panel">

      {/* ── 1. LOGO UPLOAD ── */}
      <section className="lg-section">
        <p className="lg-section__label">Your Logo</p>

        {!hasLogo ? (
          <label
            className="lg-dropzone"
            tabIndex={0}
            role="button"
            aria-label="Upload your logo"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
            <span className="lg-dropzone__icon">⊕</span>
            <p className="lg-dropzone__text">Drop or <span className="lg-dropzone__link">browse</span></p>
            <p className="lg-dropzone__formats">SVG · PNG · JPG · WebP</p>
          </label>
        ) : (
          <>
            <div className="lg-upload-preview">
              <img
                src={state.logoSrc!}
                alt="Logo preview"
                className="lg-upload-preview__img"
                style={{ background: '#fff', padding: '4px' }}
              />
              <div className="lg-upload-preview__meta">
                <span className="lg-upload-preview__name">{state.logoFileName}</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                  <span className={`lp-badge${state.inputMode === 'svg' ? ' lp-badge--green' : ' lp-badge--yellow'}`}>
                    {state.inputMode === 'svg' ? 'SVG' : 'Raster'}
                  </span>
                  <button className="lg-upload-preview__remove" onClick={onLogoRemove}>✕ Remove</button>
                </div>
              </div>
            </div>
            {isRaster && (
              <p className="lp-section__hint" style={{ marginTop: '6px' }}>
                ⚠ SVG outputs are skipped for raster input. Upload an SVG for full export.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── 2. BRAND ── */}
      <section className="lg-section">
        <p className="lg-section__label">Brand</p>

        <div className="lp-input-row">
          <label className="lp-inline-label" htmlFor="lp-project-name">Project Name</label>
          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
            <input
              id="lp-project-name"
              type="text"
              value={localProjectName}
              onChange={e => setLocalProjectName(e.target.value)}
              onBlur={handleProjectNameBlur}
              onKeyDown={handleKeyDown}
              className="lp-text-input"
              placeholder="My Project"
              maxLength={48}
              style={{ flex: 1 }}
            />
            {localProjectName !== state.projectName && (
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  handleProjectNameBlur();
                }}
                className="bg-accent text-on-accent border-none px-3 py-1 cursor-pointer hover:opacity-90 pixel-btn"
                style={{ fontSize: '10px', borderRadius: '4px' }}
              >
                Apply
              </button>
            )}
          </div>
        </div>

        <ColorRow
          id="lp-primary-color"
          label="Primary Color"
          value={state.primaryColor}
          onChange={v => onChange('primaryColor', v)}
        />
        <ColorRow
          id="lp-bg-color"
          label="Background Color"
          value={state.backgroundColor}
          onChange={v => onChange('backgroundColor', v)}
        />
      </section>

      {/* ── 3. LOGO VARIANTS ── */}
      <section className="lg-section">
        <p className="lg-section__label">Logo Variants</p>
        <p className="lp-section__hint">
          {state.inputMode === 'svg'
            ? 'Fills in your SVG will be recoloured for each variant.'
            : 'Variant recolouring requires SVG input.'}
        </p>

        <ColorRow
          id="lp-dark-fill"
          label="Dark bg fill"
          value={state.darkFillColor}
          onChange={v => onChange('darkFillColor', v)}
        />
        <ColorRow
          id="lp-light-fill"
          label="Light bg fill"
          value={state.lightFillColor}
          onChange={v => onChange('lightFillColor', v)}
        />
        <ColorRow
          id="lp-mono-black"
          label="Mono black"
          value={state.monoBlackColor}
          onChange={v => onChange('monoBlackColor', v)}
        />
        <ColorRow
          id="lp-mono-white"
          label="Mono white"
          value={state.monoWhiteColor}
          onChange={v => onChange('monoWhiteColor', v)}
        />
      </section>

      {/* ── 4. OG IMAGE ── */}
      {state.includeOgImage && (
        <section className="lg-section">
          <p className="lg-section__label">Open Graph Image</p>
          <div className="lp-input-row">
            <label className="lp-inline-label" htmlFor="lp-og-tagline">Tagline</label>
            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
              <input
                id="lp-og-tagline"
                type="text"
                value={localOgTagline}
                onChange={e => setLocalOgTagline(e.target.value)}
                onBlur={handleOgTaglineBlur}
                onKeyDown={handleKeyDown}
                className="lp-text-input"
                placeholder="Optional tagline"
                maxLength={80}
                style={{ flex: 1 }}
              />
              {localOgTagline !== state.ogTagline && (
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleOgTaglineBlur();
                  }}
                  className="bg-accent text-on-accent border-none px-3 py-1 cursor-pointer hover:opacity-90 pixel-btn"
                  style={{ fontSize: '10px', borderRadius: '4px' }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>
          <p className="lg-section__label" style={{ marginTop: '10px' }}>Layout</p>
          <div className="lp-grid-tabs">
            {(['centered', 'padded'] as OgFit[]).map(fit => (
              <button
                key={fit}
                className={`lp-grid-tab${state.ogFit === fit ? ' lp-grid-tab--active' : ''}`}
                onClick={() => onChange('ogFit', fit)}
                aria-pressed={state.ogFit === fit}
              >
                {fit}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. PACKAGE OPTIONS ── */}
      <section className="lg-section">
        <p className="lg-section__label">Package</p>
        <ToggleRow id="lp-ico" label="ICO Favicon" checked={state.includeIco} onChange={v => onChange('includeIco', v)} />
        <ToggleRow id="lp-og" label="OG + Twitter Images" checked={state.includeOgImage} onChange={v => onChange('includeOgImage', v)} />
        <ToggleRow id="lp-maskable" label="Maskable PWA Icon" checked={state.includeMaskableIcon} onChange={v => onChange('includeMaskableIcon', v)} />
        <ToggleRow id="lp-mono" label="Mono SVG Variants" checked={state.includeMonoSvgs} onChange={v => onChange('includeMonoSvgs', v)} />
        <ToggleRow id="lp-manifest" label="Web Manifest + Config" checked={state.includeManifest} onChange={v => onChange('includeManifest', v)} />
      </section>

    </div>
  );
};
