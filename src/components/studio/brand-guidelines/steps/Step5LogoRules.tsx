import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrandData, setLogoRules } from '../../../../store';

// ─── Clearspace SVG Diagram ───────────────────────────────────────────────────

interface ClearspaceDiagramProps {
  logoUrl: string | null;
  clearspace: string;
}

const ClearspaceDiagram: React.FC<ClearspaceDiagramProps> = ({ logoUrl, clearspace }) => {
  const gap = 40; // px of visual clearspace in SVG
  const logoSize = 80;
  const svgSize = logoSize + gap * 2 + 20;

  return (
    <div className="clearspace-diagram" aria-label="Clearspace diagram">
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={svgSize}
        height={svgSize}
        role="img"
        aria-label={`Clearspace: ${clearspace || 'not set'}`}
      >
        {/* Outer clearspace box */}
        <rect
          x={10}
          y={10}
          width={svgSize - 20}
          height={svgSize - 20}
          fill="none"
          stroke="var(--fg-muted, #55555f)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Logo area */}
        {logoUrl ? (
          <image
            href={logoUrl}
            x={(svgSize - logoSize) / 2}
            y={(svgSize - logoSize) / 2}
            width={logoSize}
            height={logoSize}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <>
            <rect
              x={(svgSize - logoSize) / 2}
              y={(svgSize - logoSize) / 2}
              width={logoSize}
              height={logoSize}
              fill="var(--bg-panel-highlight, #1c1c1f)"
              stroke="var(--bg-separator, #252529)"
              strokeWidth={1}
            />
            <text
              x={svgSize / 2}
              y={svgSize / 2 + 4}
              textAnchor="middle"
              fill="var(--fg-muted, #55555f)"
              fontSize={9}
              fontFamily="monospace"
            >
              LOGO
            </text>
          </>
        )}

        {/* Dimension annotation — top */}
        <line
          x1={10}
          y1={svgSize / 2}
          x2={(svgSize - logoSize) / 2}
          y2={svgSize / 2}
          stroke="var(--fg-accent, #e8342b)"
          strokeWidth={0.8}
          markerEnd="url(#arrow)"
        />
        {clearspace && (
          <text
            x={(10 + (svgSize - logoSize) / 2) / 2}
            y={svgSize / 2 - 5}
            textAnchor="middle"
            fill="var(--fg-accent, #e8342b)"
            fontSize={7}
            fontFamily="monospace"
          >
            {clearspace}
          </text>
        )}
      </svg>
    </div>
  );
};

// ─── Step 5 ────────────────────────────────────────────────────────────────────

const Step5LogoRules: React.FC = () => {
  const dispatch = useDispatch();
  const data = useSelector(selectBrandData);

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <h2 className="wizard-step__name">Logo Rules</h2>
        <p className="wizard-step__hint">
          Define minimum size and clearspace. The diagram is generated automatically.
        </p>
      </div>

      <div className="wizard-fields">
        <div className="wizard-field">
          <label className="wizard-label" htmlFor="min-size">Minimum Logo Size</label>
          <input
            id="min-size"
            className="wizard-input"
            type="text"
            value={data.logoRules.minSize}
            placeholder="e.g. 120px or 30mm"
            onChange={(e) => dispatch(setLogoRules({ minSize: e.target.value }))}
          />
          <p className="wizard-hint-text">Smallest size at which the logo is legible.</p>
        </div>

        <div className="wizard-field">
          <label className="wizard-label" htmlFor="clearspace">Clearspace Value</label>
          <input
            id="clearspace"
            className="wizard-input"
            type="text"
            value={data.logoRules.clearspace}
            placeholder="e.g. 1x icon width"
            onChange={(e) => dispatch(setLogoRules({ clearspace: e.target.value }))}
          />
          <p className="wizard-hint-text">
            Minimum breathing room around the logo on all sides.
          </p>
        </div>
      </div>

      {/* Clearspace visual */}
      <div className="clearspace-preview">
        <p className="wizard-label" style={{ marginBottom: 12 }}>Clearspace Diagram</p>
        <ClearspaceDiagram
          logoUrl={data.logos.primary}
          clearspace={data.logoRules.clearspace}
        />
      </div>
    </div>
  );
};

export default Step5LogoRules;
