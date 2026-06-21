import React from 'react';
import type { CanvasFilter } from './types';
import { FILTER_LABELS, FILTER_BACKGROUNDS } from './types';

interface FilterSelectorProps {
  value: CanvasFilter;
  onChange: (f: CanvasFilter) => void;
}

const ALL_FILTERS: CanvasFilter[] = ['light', 'dark', 'blueprint', 'amber', 'mono', 'transparent'];

// Small inline preview swatch for each filter
const FilterSwatch: React.FC<{ filter: CanvasFilter }> = ({ filter }) => {
  const bg = FILTER_BACKGROUNDS[filter];

  const gridColor: Record<CanvasFilter, string> = {
    light:       '#00000033',
    dark:        '#e8342b66',
    blueprint:   '#00bcd466',
    amber:       '#c8860a66',
    mono:        '#88888866',
    transparent: '#e8342b44',
  };

  const lines = filter === 'transparent'
    ? 'repeating-linear-gradient(45deg,#e8342b22 0px,#e8342b22 1px,transparent 1px,transparent 8px)'
    : undefined;

  return (
    <div
      className="lg-filter-swatch"
      style={{
        background: bg !== 'transparent' ? bg : undefined,
        backgroundImage: lines,
        border: bg === 'transparent' ? '1px dashed #3e3e47' : undefined,
      }}
    >
      {/* Mini grid lines */}
      {filter !== 'transparent' && (
        <div className="lg-filter-swatch__grid" style={{
          backgroundImage: `linear-gradient(${gridColor[filter]} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor[filter]} 1px, transparent 1px)`,
          backgroundSize: '12px 12px',
        }} />
      )}
    </div>
  );
};

export const FilterSelector: React.FC<FilterSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="lg-filter-grid">
      {ALL_FILTERS.map(f => (
        <button
          key={f}
          id={`filter-${f}`}
          className={`lg-filter-card ${f === value ? 'lg-filter-card--active' : ''}`}
          onClick={() => onChange(f)}
          aria-pressed={f === value}
          aria-label={`Filter: ${FILTER_LABELS[f]}`}
        >
          <FilterSwatch filter={f} />
          <span className="lg-filter-label">{FILTER_LABELS[f]}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterSelector;
