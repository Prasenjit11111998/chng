import React, { useCallback, useId } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectColors, addColor, updateColor, removeColor } from '../../../../store';
import { deriveColorStrings, normalizeHex } from '../../../../lib/studio/colorUtils';
import type { BrandColor } from '../../../../lib/studio/types';

const generateId = () => Math.random().toString(36).slice(2, 9);

interface ColorRowProps {
  color: BrandColor;
  onUpdate: (id: string, changes: Partial<BrandColor>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const ColorRow: React.FC<ColorRowProps> = ({ color, onUpdate, onRemove, canRemove }) => {
  const id = useId();
  const derived = deriveColorStrings(color.hex);

  const handleHexInput = (raw: string) => {
    // Allow typing in progress — only normalize on valid 6-char hex
    onUpdate(color.id, { hex: raw.startsWith('#') ? raw : '#' + raw });
  };

  const handleHexBlur = (raw: string) => {
    const normalized = normalizeHex(raw);
    onUpdate(color.id, { hex: normalized });
  };

  const handlePickerChange = (value: string) => {
    onUpdate(color.id, { hex: value });
  };

  return (
    <div className="color-row" role="group" aria-label={`Color: ${color.name || color.hex}`}>
      {/* Swatch + picker */}
      <div className="color-row__swatch-wrap">
        <div
          className="color-row__swatch"
          style={{ background: color.hex }}
          aria-hidden="true"
        />
        <input
          type="color"
          className="color-row__picker"
          value={normalizeHex(color.hex)}
          onChange={(e) => handlePickerChange(e.target.value)}
          aria-label={`Color picker for ${color.name || 'color'}`}
          title="Open color picker"
        />
      </div>

      {/* Fields */}
      <div className="color-row__fields">
        <div className="color-row__inputs">
          <input
            id={`${id}-name`}
            className="wizard-input wizard-input--sm"
            type="text"
            value={color.name}
            placeholder="Name (e.g. Brand Red)"
            onChange={(e) => onUpdate(color.id, { name: e.target.value })}
            aria-label="Color name"
          />
          <input
            id={`${id}-hex`}
            className="wizard-input wizard-input--sm wizard-input--mono"
            type="text"
            value={color.hex}
            placeholder="#000000"
            maxLength={7}
            onChange={(e) => handleHexInput(e.target.value)}
            onBlur={(e) => handleHexBlur(e.target.value)}
            aria-label="HEX value"
          />
        </div>

        {/* Auto-computed values */}
        <div className="color-row__derived" aria-live="polite">
          {derived.rgb && (
            <span className="color-derived-val">
              <span className="color-derived-label">RGB</span>
              {derived.rgb}
            </span>
          )}
          {derived.hsl && (
            <span className="color-derived-val">
              <span className="color-derived-label">HSL</span>
              {derived.hsl}
            </span>
          )}
          {derived.cmyk && (
            <span className="color-derived-val">
              <span className="color-derived-label">CMYK</span>
              {derived.cmyk}
            </span>
          )}
        </div>
      </div>

      {/* Remove */}
      {canRemove && (
        <button
          className="color-row__remove"
          onClick={() => onRemove(color.id)}
          aria-label={`Remove ${color.name || color.hex} color`}
        >
          ✕
        </button>
      )}
    </div>
  );
};

const Step3Colors: React.FC = () => {
  const dispatch = useDispatch();
  const colors = useSelector(selectColors);

  const handleAdd = () => {
    dispatch(addColor({ id: generateId(), name: '', hex: '#e8342b' }));
  };

  const handleUpdate = useCallback((id: string, changes: Partial<BrandColor>) => {
    dispatch(updateColor({ id, changes }));
  }, [dispatch]);

  const handleRemove = useCallback((id: string) => {
    dispatch(removeColor(id));
  }, [dispatch]);

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <h2 className="wizard-step__name">Brand Colors</h2>
        <p className="wizard-step__hint">Add your brand palette. RGB, HSL, and CMYK are generated automatically.</p>
      </div>

      <div className="color-list">
        {colors.length === 0 && (
          <p className="color-list__empty">No colors yet. Add your first brand color below.</p>
        )}
        {colors.map((color) => (
          <ColorRow
            key={color.id}
            color={color}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            canRemove={colors.length > 1}
          />
        ))}
      </div>

      <button className="wizard-add-btn" onClick={handleAdd}>
        + Add Color
      </button>

      {/* Swatch grid preview */}
      {colors.length > 0 && (
        <div className="color-swatch-grid" aria-label="Color palette preview">
          {colors.map((c) => (
            <div key={c.id} className="color-swatch-preview">
              <div
                className="color-swatch-preview__block"
                style={{ background: c.hex }}
                aria-label={`${c.name || c.hex} swatch`}
              />
              <p className="color-swatch-preview__name">{c.name || c.hex}</p>
              <p className="color-swatch-preview__hex">{c.hex.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Step3Colors;
