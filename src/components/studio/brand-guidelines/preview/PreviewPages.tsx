import React from 'react';
import type { BrandData } from '../../../../lib/studio/types';
import { deriveColorStrings, normalizeHex } from '../../../../lib/studio/colorUtils';

// ─── Preview Page Components ──────────────────────────────────────────────────
// These render the brand guideline pages as HTML/CSS for the live preview.
// They mirror the PDF structure but use regular CSS instead of react-pdf styles.

interface PreviewPageProps {
  data: BrandData;
  theme?: 'minimal' | 'modern' | 'bold';
}

// ── Cover ─────────────────────────────────────────────────────────────────────
export const PreviewCover: React.FC<PreviewPageProps> = ({ data }) => (
  <div className="bp-page bp-cover">
    {data.logos.primary && (
      <img src={data.logos.primary} alt="Primary logo" className="bp-cover__logo" />
    )}
    <h1 className="bp-cover__name">{data.brandName || 'Brand Name'}</h1>
    {data.tagline && <p className="bp-cover__tagline">{data.tagline}</p>}
    <p className="bp-cover__label">Brand Guidelines</p>
  </div>
);

// ── About ─────────────────────────────────────────────────────────────────────
export const PreviewAbout: React.FC<PreviewPageProps> = ({ data }) => (
  <div className="bp-page bp-about">
    <h2 className="bp-section-title">About the Brand</h2>
    <div className="bp-rule" />
    <p className="bp-body">
      {data.description || 'Brand description not provided.'}
    </p>
    {data.website && (
      <p className="bp-meta">{data.website}</p>
    )}
  </div>
);

// ── Logo System ───────────────────────────────────────────────────────────────
export const PreviewLogoSystem: React.FC<PreviewPageProps> = ({ data }) => {
  const slots = [
    { key: 'primary' as const, label: 'Primary Logo', bg: '#1c1c1f' },
    { key: 'dark' as const,    label: 'Dark Logo',    bg: '#f5f5f5' },
    { key: 'light' as const,   label: 'Light Logo',   bg: '#1c1c1f' },
    { key: 'icon' as const,    label: 'Brand Icon',   bg: '#1c1c1f' },
  ];

  return (
    <div className="bp-page bp-logo-system">
      <h2 className="bp-section-title">Logo System</h2>
      <div className="bp-rule" />
      <div className="bp-logo-grid">
        {slots.map((slot) =>
          data.logos[slot.key] ? (
            <div key={slot.key} className="bp-logo-cell" style={{ background: slot.bg }}>
              <img src={data.logos[slot.key]!} alt={slot.label} className="bp-logo-img" />
              <p className="bp-logo-label">{slot.label}</p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

// ── Clearspace ────────────────────────────────────────────────────────────────
export const PreviewClearspace: React.FC<PreviewPageProps> = ({ data }) => {
  const gap = 48;
  const logoSize = 96;
  const svgSize = logoSize + gap * 2 + 20;

  return (
    <div className="bp-page bp-clearspace">
      <h2 className="bp-section-title">Clearspace</h2>
      <div className="bp-rule" />
      <p className="bp-body" style={{ marginBottom: 24 }}>
        Always maintain a minimum clearspace of{' '}
        <strong>{data.logoRules.clearspace || '[clearspace value]'}</strong> around the logo on all sides.
      </p>
      <div className="bp-clearspace-diagram">
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} width={svgSize} height={svgSize}>
          <rect x={10} y={10} width={svgSize - 20} height={svgSize - 20}
            fill="none" stroke="#e8342b" strokeWidth={1} strokeDasharray="5 3" />
          {data.logos.primary ? (
            <image href={data.logos.primary}
              x={(svgSize - logoSize) / 2} y={(svgSize - logoSize) / 2}
              width={logoSize} height={logoSize} preserveAspectRatio="xMidYMid meet" />
          ) : (
            <>
              <rect x={(svgSize - logoSize) / 2} y={(svgSize - logoSize) / 2}
                width={logoSize} height={logoSize} fill="#1c1c1f" stroke="#252529" />
              <text x={svgSize / 2} y={svgSize / 2 + 5} textAnchor="middle"
                fill="#55555f" fontSize={10} fontFamily="monospace">LOGO</text>
            </>
          )}
          {data.logoRules.clearspace && (
            <text x={10 + (svgSize - logoSize) / 4} y={svgSize / 2 - 6}
              textAnchor="middle" fill="#e8342b" fontSize={8} fontFamily="monospace">
              {data.logoRules.clearspace}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

// ── Color Palette ─────────────────────────────────────────────────────────────
export const PreviewColors: React.FC<PreviewPageProps> = ({ data }) => (
  <div className="bp-page bp-colors">
    <h2 className="bp-section-title">Color Palette</h2>
    <div className="bp-rule" />
    <div className="bp-color-grid">
      {data.colors.length === 0 && (
        <p className="bp-body" style={{ color: '#55555f' }}>No colors defined yet.</p>
      )}
      {data.colors.map((color) => {
        const derived = deriveColorStrings(color.hex);
        return (
          <div key={color.id} className="bp-color-card">
            <div className="bp-color-swatch" style={{ background: color.hex }} />
            <div className="bp-color-info">
              <p className="bp-color-name">{color.name || 'Unnamed'}</p>
              <p className="bp-color-val"><span>HEX</span> {normalizeHex(color.hex).toUpperCase()}</p>
              {derived.rgb && <p className="bp-color-val"><span>RGB</span> {derived.rgb}</p>}
              {derived.hsl && <p className="bp-color-val"><span>HSL</span> {derived.hsl}</p>}
              {derived.cmyk && <p className="bp-color-val"><span>CMYK</span> {derived.cmyk}</p>}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Typography ────────────────────────────────────────────────────────────────
export const PreviewTypography: React.FC<PreviewPageProps> = ({ data }) => {
  const { headingFont, bodyFont } = data.typography;
  const headingStyle = headingFont ? { fontFamily: `'${headingFont}', sans-serif` } : {};
  const bodyStyle = bodyFont ? { fontFamily: `'${bodyFont}', sans-serif` } : {};

  return (
    <div className="bp-page bp-typography">
      <h2 className="bp-section-title">Typography</h2>
      <div className="bp-rule" />

      {headingFont ? (
        <div className="bp-font-block">
          <p className="bp-font-role">Heading — {headingFont}</p>
          <p className="bp-font-alpha" style={{ ...headingStyle, fontWeight: 700 }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </p>
          <p className="bp-font-alpha" style={headingStyle}>abcdefghijklmnopqrstuvwxyz</p>
          <p className="bp-font-nums" style={headingStyle}>0123456789</p>
        </div>
      ) : (
        <p className="bp-body" style={{ color: '#55555f', marginBottom: 24 }}>Heading font not set.</p>
      )}

      {bodyFont ? (
        <div className="bp-font-block">
          <p className="bp-font-role">Body — {bodyFont}</p>
          <p className="bp-font-alpha" style={bodyStyle}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </p>
          <p className="bp-font-alpha" style={bodyStyle}>abcdefghijklmnopqrstuvwxyz</p>
          <p className="bp-font-sample" style={bodyStyle}>
            The quick brown fox jumps over the lazy dog. Typography shapes how your brand communicates — choose with intention.
          </p>
        </div>
      ) : (
        <p className="bp-body" style={{ color: '#55555f' }}>Body font not set.</p>
      )}
    </div>
  );
};

// ── Brand Applications ────────────────────────────────────────────────────────
export const PreviewApplications: React.FC<PreviewPageProps> = ({ data }) => {
  const primaryColor = data.colors[0]?.hex ?? '#e8342b';
  const secondaryColor = data.colors[1]?.hex ?? '#0d0d0f';
  const headingStyle = data.typography.headingFont
    ? { fontFamily: `'${data.typography.headingFont}', sans-serif` }
    : {};
  const bodyStyle = data.typography.bodyFont
    ? { fontFamily: `'${data.typography.bodyFont}', sans-serif` }
    : {};

  return (
    <div className="bp-page bp-applications">
      <h2 className="bp-section-title">Brand Applications</h2>
      <div className="bp-rule" />

      {/* Website Header mockup */}
      <div className="bp-app-block">
        <p className="bp-app-label">Website Header</p>
        <div className="bp-mockup-website" style={{ background: secondaryColor }}>
          <div className="bp-mockup-website__nav" style={{ borderColor: `${primaryColor}33` }}>
            {data.logos.primary ? (
              <img src={data.logos.primary} alt="Logo" style={{ height: 28, objectFit: 'contain' }} />
            ) : (
              <span style={{ ...headingStyle, color: '#ececee', fontWeight: 700, fontSize: 16 }}>
                {data.brandName || 'Brand'}
              </span>
            )}
            <div className="bp-mockup-website__links">
              {['About', 'Work', 'Contact'].map((l) => (
                <span key={l} style={{ ...bodyStyle, color: '#8c8c99', fontSize: 11 }}>{l}</span>
              ))}
            </div>
          </div>
          <div className="bp-mockup-website__hero">
            <p style={{ ...headingStyle, color: '#ececee', fontWeight: 700, fontSize: 20, margin: 0 }}>
              {data.tagline || `${data.brandName || 'Your Brand'}.`}
            </p>
            <div className="bp-mockup-cta" style={{ background: primaryColor }} />
          </div>
        </div>
      </div>

      {/* Social Header mockup */}
      <div className="bp-app-block">
        <p className="bp-app-label">Social Media Header</p>
        <div className="bp-mockup-social" style={{ background: primaryColor }}>
          {/* Light logo on brand-color social bg; fall back to primary logo */}
          {data.logos.light || data.logos.primary ? (
            <img
              src={data.logos.light ?? data.logos.primary!}
              alt="Logo"
              style={{ height: 40, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ ...headingStyle, color: '#fff', fontWeight: 900, fontSize: 24 }}>
              {data.brandName || 'Brand'}
            </span>
          )}
          {data.tagline && (
            <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '8px 0 0' }}>
              {data.tagline}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Logo Usage Rules ──────────────────────────────────────────────────────────
export const PreviewLogoRules: React.FC<PreviewPageProps> = ({ data }) => {
  const dos = [
    'Maintain required clearspace around the logo',
    'Use only approved color variants',
    `Respect the minimum size (${data.logoRules.minSize || '[see spec]'})`,
    'Use the logo file provided — do not recreate it',
  ];
  const donts = [
    'Stretch or distort the logo',
    'Rotate or flip the logo',
    'Add drop shadows or effects',
    'Change the logo colors',
    'Place on busy or low-contrast backgrounds',
  ];

  return (
    <div className="bp-page bp-logo-rules">
      <h2 className="bp-section-title">Logo Usage Rules</h2>
      <div className="bp-rule" />
      <div className="bp-rules-grid">
        <div className="bp-rules-col bp-rules-col--do">
          <p className="bp-rules-heading bp-rules-heading--do">Do</p>
          <ul className="bp-rules-list">
            {dos.map((item) => (
              <li key={item} className="bp-rules-item bp-rules-item--do">
                <span className="bp-rules-icon">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bp-rules-col bp-rules-col--dont">
          <p className="bp-rules-heading bp-rules-heading--dont">Don't</p>
          <ul className="bp-rules-list">
            {donts.map((item) => (
              <li key={item} className="bp-rules-item bp-rules-item--dont">
                <span className="bp-rules-icon">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
