import React from 'react';
import { useSelector } from 'react-redux';
import { selectBrandData, selectExportSettings } from '../../../../store';
import { LivePreviewPanel } from '../preview/LivePreviewPanel';

const Step6Preview: React.FC = () => {
  const data = useSelector(selectBrandData);
  const exportSettings = useSelector(selectExportSettings);

  return (
    <div className="wizard-step wizard-step--preview">
      <div className="wizard-step__header wizard-step__header--centered">
        <h2 className="wizard-step__name">Preview</h2>
        <p className="wizard-step__hint">
          Review your brand guidelines. Navigate through all pages using the dots below.
        </p>
        <p className="wizard-step__subhint">
          Looks good? Continue to export settings.
        </p>
      </div>

      <div className="step6-preview-wrap">
        <LivePreviewPanel
          sectionOrder={exportSettings.sectionOrder}
          compact={false}
        />
      </div>
    </div>
  );
};

export default Step6Preview;
