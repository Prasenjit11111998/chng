import React, { useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectTypography, setTypography, setTypographyFontFile } from '../../../../store';
import { injectWebFont, injectCustomWebFont } from '../../../../lib/studio/googleFonts';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMS = '0123456789';
const SAMPLE = 'The quick brown fox jumps over the lazy dog. 01234 56789.';

const ACCEPTED_FONT_TYPES = ['.ttf', '.otf', '.woff', '.woff2'];

interface FontPreviewProps {
  fontName: string;
  role: 'Heading' | 'Body';
  isCustomFile?: boolean;
}

const FontPreview: React.FC<FontPreviewProps> = ({ fontName, role, isCustomFile }) => {
  const loaded = !!fontName.trim();
  const style = loaded ? { fontFamily: `'${fontName}', sans-serif` } : {};

  return (
    <div className="font-preview" aria-label={`${role} font preview: ${fontName || 'not set'}`}>
      <div className="font-preview__header">
        <span className="font-preview__role">{role} Font</span>
        {loaded && (
          <span className="font-preview__name">
            {fontName}
            {isCustomFile && <span className="font-preview__badge">Custom File</span>}
          </span>
        )}
      </div>
      {loaded ? (
        <div className="font-preview__content">
          <p className="font-preview__alpha" style={{ ...style, fontSize: role === 'Heading' ? '22px' : '18px', fontWeight: role === 'Heading' ? 700 : 400 }}>
            {ALPHA}
          </p>
          <p className="font-preview__nums" style={{ ...style, fontSize: '16px' }}>
            {NUMS}
          </p>
          <p className="font-preview__sample" style={{ ...style, fontSize: '14px', fontWeight: 400 }}>
            {SAMPLE}
          </p>
        </div>
      ) : (
        <p className="font-preview__placeholder">Enter a Google Font name or upload a font file above.</p>
      )}
    </div>
  );
};

// ─── Font Slot ────────────────────────────────────────────────────────────────

interface FontSlotProps {
  role: 'Heading' | 'Body';
  fontName: string;
  fontFile: string | null | undefined;
  inputId: string;
  fileInputId: string;
  placeholder: string;
  onFontNameChange: (name: string) => void;
  onFontNameBlur: (name: string) => void;
  onFontFileUpload: (dataUrl: string, fontName: string) => void;
  onClearFile: () => void;
}

const FontSlot: React.FC<FontSlotProps> = ({
  role,
  fontName,
  fontFile,
  inputId,
  fileInputId,
  placeholder,
  onFontNameChange,
  onFontNameBlur,
  onFontFileUpload,
  onClearFile,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localName, setLocalName] = React.useState(fontName);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Sync external name into local state when switching steps
  useEffect(() => {
    setLocalName(fontName);
  }, [fontName]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_FONT_TYPES.includes(ext)) {
      setFileError('Only .ttf, .otf, .woff, .woff2 files are supported.');
      return;
    }
    setFileError(null);
    setUploading(true);

    // Derive font name from filename (strip extension)
    const derivedName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      // Register for browser preview immediately
      await injectCustomWebFont(derivedName, dataUrl);
      onFontFileUpload(dataUrl, derivedName);
      setLocalName(derivedName);
      setUploading(false);
    };
    reader.onerror = () => {
      setFileError('Failed to read font file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be re-uploaded
    e.target.value = '';
  }, [onFontFileUpload]);

  const isUsingCustomFile = !!fontFile;

  return (
    <div className="wizard-field wizard-field--font-slot">
      <label className="wizard-label" htmlFor={inputId}>{role} Font</label>

      {/* Google Font name input — hidden if a custom file is loaded */}
      {!isUsingCustomFile && (
        <input
          id={inputId}
          className="wizard-input"
          type="text"
          value={localName}
          placeholder={placeholder}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => onFontNameBlur(localName)}
        />
      )}

      {/* Custom file info or upload button */}
      <div className="font-file-row">
        {isUsingCustomFile ? (
          <div className="font-file-loaded">
            <span className="font-file-loaded__icon" aria-hidden="true">◈</span>
            <span className="font-file-loaded__name">{fontName}</span>
            <span className="font-file-loaded__hint">Custom font file</span>
            <button
              className="font-file-clear"
              onClick={onClearFile}
              aria-label={`Remove custom ${role} font file`}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <>
            <button
              className="font-file-upload-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label={`Upload custom ${role} font file`}
            >
              {uploading ? 'Loading…' : '↑ Upload Font File'}
            </button>
            <span className="font-file-upload-formats" style={{ fontSize: '10px', color: 'var(--fg-muted, #8c8c99)' }}>
              Supports: .ttf, .otf, .woff, .woff2
            </span>
          </>
        )}

        <input
          ref={fileRef}
          id={fileInputId}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          className="sr-only"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {!isUsingCustomFile && (
        <p className="font-file-hint">
          Or{' '}
          <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="wizard-link">
            browse Google Fonts ↗
          </a>
          {' '}and type the name above.
        </p>
      )}

      {fileError && <p className="wizard-error" role="alert">{fileError}</p>}
    </div>
  );
};

// ─── Step 4 ───────────────────────────────────────────────────────────────────

const Step4Typography: React.FC = () => {
  const dispatch = useDispatch();
  const typography = useSelector(selectTypography);

  const handleHeadingNameBlur = useCallback((name: string) => {
    const trimmed = name.trim();
    dispatch(setTypography({ headingFont: trimmed }));
    if (trimmed && !typography.headingFontFile) injectWebFont(trimmed);
  }, [dispatch, typography.headingFontFile]);

  const handleBodyNameBlur = useCallback((name: string) => {
    const trimmed = name.trim();
    dispatch(setTypography({ bodyFont: trimmed }));
    if (trimmed && !typography.bodyFontFile) injectWebFont(trimmed);
  }, [dispatch, typography.bodyFontFile]);

  const handleHeadingFileUpload = useCallback((dataUrl: string, fontName: string) => {
    dispatch(setTypography({ headingFont: fontName }));
    dispatch(setTypographyFontFile({ key: 'headingFontFile', value: dataUrl }));
  }, [dispatch]);

  const handleBodyFileUpload = useCallback((dataUrl: string, fontName: string) => {
    dispatch(setTypography({ bodyFont: fontName }));
    dispatch(setTypographyFontFile({ key: 'bodyFontFile', value: dataUrl }));
  }, [dispatch]);

  const handleClearHeadingFile = useCallback(() => {
    dispatch(setTypographyFontFile({ key: 'headingFontFile', value: null }));
    dispatch(setTypography({ headingFont: '' }));
  }, [dispatch]);

  const handleClearBodyFile = useCallback(() => {
    dispatch(setTypographyFontFile({ key: 'bodyFontFile', value: null }));
    dispatch(setTypography({ bodyFont: '' }));
  }, [dispatch]);

  // Inject saved fonts on mount (draft restore)
  useEffect(() => {
    if (typography.headingFontFile) {
      injectCustomWebFont(typography.headingFont, typography.headingFontFile);
    } else if (typography.headingFont) {
      injectWebFont(typography.headingFont);
    }
    if (typography.bodyFontFile) {
      injectCustomWebFont(typography.bodyFont, typography.bodyFontFile);
    } else if (typography.bodyFont) {
      injectWebFont(typography.bodyFont);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <h2 className="wizard-step__name">Typography</h2>
        <p className="wizard-step__hint">
          Set your brand fonts. Type a Google Font name or upload your own .ttf / .otf / .woff file.
        </p>
      </div>

      <div className="wizard-fields">
        <FontSlot
          role="Heading"
          fontName={typography.headingFont}
          fontFile={typography.headingFontFile}
          inputId="heading-font"
          fileInputId="heading-font-file"
          placeholder="e.g. Playfair Display"
          onFontNameChange={() => {}}
          onFontNameBlur={handleHeadingNameBlur}
          onFontFileUpload={handleHeadingFileUpload}
          onClearFile={handleClearHeadingFile}
        />

        <FontSlot
          role="Body"
          fontName={typography.bodyFont}
          fontFile={typography.bodyFontFile}
          inputId="body-font"
          fileInputId="body-font-file"
          placeholder="e.g. Inter"
          onFontNameChange={() => {}}
          onFontNameBlur={handleBodyNameBlur}
          onFontFileUpload={handleBodyFileUpload}
          onClearFile={handleClearBodyFile}
        />
      </div>

      {/* Font Previews */}
      <div className="font-preview-section">
        <FontPreview fontName={typography.headingFont} role="Heading" isCustomFile={!!typography.headingFontFile} />
        <FontPreview fontName={typography.bodyFont} role="Body" isCustomFile={!!typography.bodyFontFile} />
      </div>
    </div>
  );
};

export default Step4Typography;
