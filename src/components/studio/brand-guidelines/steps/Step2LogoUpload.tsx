import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectLogos, setLogo } from '../../../../store';
import type { BrandLogos } from '../../../../lib/studio/types';

type LogoKey = keyof BrandLogos;

const LOGO_SLOTS: { key: LogoKey; label: string; required: boolean; bg: string; description: string }[] = [
  {
    key: 'primary',
    label: 'Primary Logo',
    required: true,
    bg: '#1c1c1f',
    description: 'Main logo, shown on dark backgrounds',
  },
  {
    key: 'dark',
    label: 'Dark Logo',
    required: false,
    bg: '#f5f5f5',
    description: 'Dark version for use on light backgrounds',
  },
  {
    key: 'light',
    label: 'Light Logo',
    required: false,
    bg: '#1c1c1f',
    description: 'Light version for use on dark backgrounds',
  },
  {
    key: 'icon',
    label: 'Brand Icon',
    required: false,
    bg: '#1c1c1f',
    description: 'Square icon / favicon variant',
  },
];

const ACCEPTED = ['image/svg+xml', 'image/png'];

interface DropZoneProps {
  slot: typeof LOGO_SLOTS[0];
  value: string | null;
  onFile: (key: LogoKey, dataUrl: string | null) => void;
}

const LogoDropZone: React.FC<DropZoneProps> = ({ slot, value, onFile }) => {
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Only SVG and PNG files are supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onFile(slot.key, result);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    };
    reader.readAsDataURL(file);
  }, [slot.key, onFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="logo-dropzone-wrapper">
      <div className="logo-dropzone-label">
        <span className="wizard-label">{slot.label}</span>
        {slot.required && <span className="wizard-required" aria-hidden="true"> *</span>}
        {!slot.required && <span className="wizard-optional"> (optional)</span>}
      </div>
      <p className="logo-dropzone-desc">{slot.description}</p>

      <div
        className={`logo-dropzone ${dragging ? 'logo-dropzone--dragging' : ''} ${value ? 'logo-dropzone--filled' : ''}`}
        style={{ background: slot.bg }}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${slot.label}`}
      >
        {value ? (
          <div className="logo-preview-wrap">
            <img src={value} alt={`${slot.label} preview`} className="logo-preview" />
            {/* Checkmark draw animation on success */}
            {success && (
              <div className="logo-success-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" className="logo-check-line" />
                </svg>
              </div>
            )}
            <button
              className="logo-remove-btn"
              onClick={(e) => { e.stopPropagation(); onFile(slot.key, null); }}
              aria-label={`Remove ${slot.label}`}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="logo-dropzone__empty">
            <div className="logo-dropzone__icon" aria-hidden="true">↑</div>
            <p className="logo-dropzone__text">
              Drop file here or <span className="logo-dropzone__link">browse</span>
            </p>
            <p className="logo-dropzone__formats">SVG, PNG</p>
          </div>
        )}
      </div>

      {error && <p className="wizard-error" role="alert">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".svg,.png,image/svg+xml,image/png"
        className="sr-only"
        onChange={handleInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

const Step2LogoUpload: React.FC = () => {
  const dispatch = useDispatch();
  const logos = useSelector(selectLogos);

  const handleFile = useCallback((key: LogoKey, value: string | null) => {
    dispatch(setLogo({ key, value }));
  }, [dispatch]);

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <h2 className="wizard-step__name">Logo Upload</h2>
        <p className="wizard-step__hint">Upload your logo files. SVG is preferred for crisp PDF output.</p>
      </div>

      <div className="logo-upload-grid">
        {LOGO_SLOTS.map((slot) => (
          <LogoDropZone
            key={slot.key}
            slot={slot}
            value={logos[slot.key]}
            onFile={handleFile}
          />
        ))}
      </div>
    </div>
  );
};

export default Step2LogoUpload;
