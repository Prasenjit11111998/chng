import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectBrandData } from '../../../store';
import WizardShell from './WizardShell';
import Step1BrandInfo from './steps/Step1BrandInfo';
import Step2LogoUpload from './steps/Step2LogoUpload';
import Step3Colors from './steps/Step3Colors';
import Step4Typography from './steps/Step4Typography';
import Step5LogoRules from './steps/Step5LogoRules';
import Step6Preview from './steps/Step6Preview';
import Step7Export from './steps/Step7Export';
import LivePreviewPanel from './preview/LivePreviewPanel';

const STEPS = [
  { id: 1, label: 'Brand Info' },
  { id: 2, label: 'Logo Upload' },
  { id: 3, label: 'Colors' },
  { id: 4, label: 'Typography' },
  { id: 5, label: 'Logo Rules' },
  { id: 6, label: 'Preview' },
  { id: 7, label: 'Export' },
];

const BrandGuidelinesWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Valid, setStep1Valid] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const data = useSelector(selectBrandData);

  // Show draft-saved badge briefly after any update
  React.useEffect(() => {
    if (data.brandName) {
      setDraftSaved(true);
      const t = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [data]);

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStepClick = useCallback((stepId: number) => {
    if (stepId < currentStep) setCurrentStep(stepId);
  }, [currentStep]);

  const isStep6 = currentStep === 6;
  const isStep7 = currentStep === 7;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BrandInfo onValidChange={setStep1Valid} />;
      case 2: return <Step2LogoUpload />;
      case 3: return <Step3Colors />;
      case 4: return <Step4Typography />;
      case 5: return <Step5LogoRules />;
      case 6: return <Step6Preview />;
      case 7: return <Step7Export />;
      default: return null;
    }
  };

  const canProceed = (): boolean => {
    if (currentStep === 1) return step1Valid;
    if (currentStep === 2) return !!data.logos.primary; // Primary logo required
    return true;
  };

  return (
    <WizardShell
      steps={STEPS}
      currentStep={currentStep}
      onStepClick={handleStepClick}
      onBack={currentStep > 1 ? handleBack : undefined}
      onNext={currentStep < STEPS.length ? handleNext : undefined}
      nextDisabled={!canProceed()}
      nextLabel={currentStep === 5 ? 'Preview' : 'Continue'}
      isLastStep={isStep7}
      fullWidth={isStep6 || isStep7}
      draftSaved={draftSaved}
      rightPanel={
        !isStep6 && !isStep7 ? (
          <LivePreviewPanel compact={true} currentStep={currentStep} />
        ) : undefined
      }
    >
      {renderStep()}
    </WizardShell>
  );
};

export default BrandGuidelinesWizard;
