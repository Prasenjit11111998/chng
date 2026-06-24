import React, { useEffect, useRef, useState } from 'react';
import type { OutputSpec, LogoPackState } from './types';
import { CATEGORY_LABELS } from './types';
import { renderPreviewThumbnail } from './logoPackEngine';

interface PreviewGridProps {
  specs: OutputSpec[];
  state: LogoPackState;
}

// Format badge colours
const FORMAT_COLORS: Record<string, string> = {
  SVG: 'var(--accent, #e8342b)',
  PNG: '#2ea87a',
  ICO: '#8b6cf6',
  JSON: '#f0a030',
  XML: '#5b9bd5',
};

// Category order
const CATEGORY_ORDER: OutputSpec['category'][] = [
  'favicon', 'apple-pwa', 'social', 'logo-svg', 'logo-png', 'meta',
];

interface ThumbnailCardProps {
  spec: OutputSpec;
  state: LogoPackState;
  baseImg: HTMLImageElement | null;
  overrideBg: 'auto' | 'light' | 'dark';
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ spec, state, baseImg, overrideBg }) => {
  const [thumbSrc, setThumbSrc] = useState<string>('');
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    if (!spec.enabled || !baseImg) { setThumbSrc(''); return; }
    // Build a cache key from state properties that affect this thumbnail
    const key = [
      spec.id, state.primaryColor, state.backgroundColor,
      state.darkFillColor, state.lightFillColor, state.monoBlackColor, state.monoWhiteColor,
      state.projectName, state.ogTagline, state.ogFit, overrideBg,
    ].join('|');
    
    console.log('[ThumbnailCard] key:', key, 'prevKey:', prevKeyRef.current);
    
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    let cancelled = false;
    renderPreviewThumbnail(spec, state, baseImg, overrideBg === 'auto' ? undefined : overrideBg).then(src => {
      if (!cancelled) {
        console.log('[ThumbnailCard] Updated src for:', spec.id);
        setThumbSrc(src);
      }
    }).catch(err => {
      console.error('[ThumbnailCard] Error rendering:', spec.id, err);
    });
    return () => { cancelled = true; };
  }, [
    spec.id,
    spec.enabled,
    state.primaryColor,
    state.backgroundColor,
    state.darkFillColor,
    state.lightFillColor,
    state.monoBlackColor,
    state.monoWhiteColor,
    state.projectName,
    state.ogTagline,
    state.ogFit,
    baseImg,
    overrideBg
  ]);

  const w = spec.width;
  const h = spec.height;
  const dimLabel = w && h ? `${w}×${h}` : w ? `${w}w` : 'Vector';

  const isSocial = spec.category === 'social';

  return (
    <div
      className={`lp-card${spec.enabled ? '' : ' lp-card--disabled'}${isSocial ? ' lp-card--social' : ''}`}
      title={`${spec.filename}${w ? ` · ${dimLabel}` : ''}`}
    >
      <div className={`lp-card__thumb ${isSocial ? 'lp-card__thumb--social' : ''}`}>
        {thumbSrc ? (
          <img src={thumbSrc} alt={spec.label} className="lp-card__img" />
        ) : spec.enabled ? (
          <div className="lp-card__placeholder">
            <span className="lp-card__placeholder-icon">⧖</span>
          </div>
        ) : (
          <div className="lp-card__placeholder lp-card__placeholder--disabled">
            <span className="lp-card__placeholder-icon">—</span>
          </div>
        )}
      </div>

      <div className="lp-card__meta">
        <span className="lp-card__name">{spec.filename}</span>
        <div className="lp-card__badges">
          <span className="lp-badge-format" style={{ '--badge-color': FORMAT_COLORS[spec.format] ?? '#888' } as React.CSSProperties}>
            {spec.format}
          </span>
          <span className="lp-badge-dim">
            {spec.format === 'JSON' || spec.format === 'XML' ? 'Config' : dimLabel}
          </span>
          {spec.svgOnly && !spec.enabled && (
            <span className="lp-badge-skip">SVG only</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewGrid: React.FC<PreviewGridProps> = ({ specs, state }) => {
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [previewBg, setPreviewBg] = useState<'auto' | 'light' | 'dark'>('auto');

  // Load base image whenever logoSrc changes
  useEffect(() => {
    if (!state.logoSrc) { setBaseImg(null); return; }
    const img = new Image();
    img.onload = () => setBaseImg(img);
    img.onerror = () => setBaseImg(null);
    img.src = state.logoSrc;
  }, [state.logoSrc]);

  const totalEnabled = specs.filter(s => s.enabled).length;
  const totalFiles = specs.length;

  if (state.inputMode === 'none') {
    return (
      <div className="lp-empty">
        <div className="lp-empty__icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="48" height="48" rx="12" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4"/>
            <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="lp-empty__heading">Drop your logo to begin</h2>
        <p className="lp-empty__sub">
          Upload an SVG for the full pack — {totalFiles} files across favicons, icons, Open Graph images, and manifest configs.
        </p>
        <div className="lp-empty__formats">
          <span>SVG</span><span>PNG</span><span>ICO</span><span>JSON</span><span>XML</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-grid-wrap">
      {/* ── Stats strip ── */}
      <div className="lp-stats-strip">
        <span className="lp-stats__count">
          <strong>{totalEnabled}</strong> files ready
          {totalEnabled < totalFiles && <span className="lp-stats__skipped"> · {totalFiles - totalEnabled} skipped (SVG required)</span>}
        </span>
        <div className="lp-preview-bg-picker">
          <span className="lp-preview-bg-picker__label">Preview background:</span>
          <div className="lp-segment-control">
            {(['auto', 'light', 'dark'] as const).map(mode => (
              <button
                key={mode}
                className={`lp-segment-btn${previewBg === mode ? ' lp-segment-btn--active' : ''}`}
                onClick={() => setPreviewBg(mode)}
              >
                {mode === 'auto' ? 'Auto' : mode === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grouped by category ── */}
      {CATEGORY_ORDER.map(cat => {
        const catSpecs = specs.filter(s => s.category === cat);
        if (catSpecs.length === 0) return null;
        return (
          <div key={cat} className="lp-category">
            <h3 className="lp-category__heading">
              <span>{CATEGORY_LABELS[cat]}</span>
              <span className="lp-category__count">{catSpecs.filter(s => s.enabled).length}/{catSpecs.length}</span>
            </h3>
            <div className="lp-cards">
              {catSpecs.map(spec => (
                <ThumbnailCard
                  key={spec.id}
                  spec={spec}
                  state={state}
                  baseImg={baseImg}
                  overrideBg={previewBg}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
