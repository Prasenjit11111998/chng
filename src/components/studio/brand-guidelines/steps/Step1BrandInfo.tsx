import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrandData, setBrandName, setTagline, setWebsite, setDescription } from '../../../../store';

interface Step1Props {
  onValidChange?: (valid: boolean) => void;
}

const Step1BrandInfo: React.FC<Step1Props> = ({ onValidChange }) => {
  const dispatch = useDispatch();
  const data = useSelector(selectBrandData);
  const [touched, setTouched] = React.useState({ brandName: false });

  const nameError = touched.brandName && !data.brandName.trim();

  React.useEffect(() => {
    onValidChange?.(!!data.brandName.trim());
  }, [data.brandName, onValidChange]);

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <h2 className="wizard-step__name">Brand Information</h2>
        <p className="wizard-step__hint">Start with the essentials — we'll build the rest from here.</p>
      </div>

      <div className="wizard-fields">
        {/* Brand Name */}
        <div className="wizard-field">
          <label className="wizard-label" htmlFor="brand-name">
            Brand Name <span className="wizard-required" aria-hidden="true">*</span>
          </label>
          <input
            id="brand-name"
            className={`wizard-input ${nameError ? 'wizard-input--error' : ''}`}
            type="text"
            value={data.brandName}
            placeholder="e.g. Acme Corp"
            autoFocus
            onChange={(e) => dispatch(setBrandName(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, brandName: true }))}
            aria-invalid={nameError}
            aria-describedby={nameError ? 'brand-name-error' : undefined}
          />
          {nameError && (
            <p id="brand-name-error" className="wizard-error" role="alert">
              Brand name is required to continue.
            </p>
          )}
        </div>

        {/* Tagline */}
        <div className="wizard-field">
          <label className="wizard-label" htmlFor="tagline">
            Tagline <span className="wizard-optional">(optional)</span>
          </label>
          <input
            id="tagline"
            className="wizard-input"
            type="text"
            value={data.tagline}
            placeholder="e.g. Built for the future"
            onChange={(e) => dispatch(setTagline(e.target.value))}
          />
        </div>

        {/* Website */}
        <div className="wizard-field">
          <label className="wizard-label" htmlFor="website">
            Website <span className="wizard-optional">(optional)</span>
          </label>
          <input
            id="website"
            className="wizard-input"
            type="url"
            value={data.website}
            placeholder="https://acme.com"
            onChange={(e) => dispatch(setWebsite(e.target.value))}
          />
        </div>

        {/* Brand Description */}
        <div className="wizard-field">
          <label className="wizard-label" htmlFor="description">
            Brand Description <span className="wizard-optional">(optional)</span>
          </label>
          <textarea
            id="description"
            className="wizard-textarea"
            value={data.description}
            placeholder="Describe your brand's mission, audience, and character..."
            rows={4}
            onChange={(e) => dispatch(setDescription(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

export default Step1BrandInfo;
