import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from '../../Logo';

interface WizardStep {
  id: number;
  label: string;
}

interface WizardShellProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLastStep?: boolean;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  fullWidth?: boolean;
  draftSaved?: boolean;
}

export const WizardShell: React.FC<WizardShellProps> = ({
  steps,
  currentStep,
  onStepClick,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isLastStep = false,
  children,
  rightPanel,
  fullWidth = false,
  draftSaved = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="wizard-shell">
      {/* ── Top nav bar ── */}
      <div className="wizard-topbar">
        <button
          className="wizard-topbar__back"
          onClick={() => navigate('/studio')}
          aria-label="Back to Studio"
        >
          <Logo className="text-on-accent text-xl font-black" />
          <span className="wizard-topbar__breadcrumb">
            <span className="wizard-topbar__sep">›</span>
            Brand Guidelines
          </span>
        </button>

        <div className="wizard-topbar__right">
          {draftSaved && (
            <span className="wizard-draft-badge" aria-live="polite">
              Draft saved
            </span>
          )}
        </div>
      </div>

      {/* ── Step progress indicator ── */}
      <div className="wizard-progress" role="navigation" aria-label="Wizard steps">
        <div className="wizard-progress__track">
          {steps.map((step, idx) => {
            const state =
              idx + 1 < currentStep ? 'done' : idx + 1 === currentStep ? 'active' : 'upcoming';
            return (
              <React.Fragment key={step.id}>
                <button
                  className={cn('wizard-step-dot', `wizard-step-dot--${state}`)}
                  onClick={() => state === 'done' && onStepClick?.(step.id)}
                  disabled={state !== 'done'}
                  aria-label={`Step ${step.id}: ${step.label}${state === 'done' ? ' (completed)' : state === 'active' ? ' (current)' : ''}`}
                  aria-current={state === 'active' ? 'step' : undefined}
                >
                  <span className="wizard-step-dot__num">
                    {state === 'done' ? '✓' : step.id}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={cn('wizard-step-line', idx + 1 < currentStep && 'wizard-step-line--done')} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <p className="wizard-step-label">
          Step {currentStep} of {steps.length} — <strong>{steps[currentStep - 1]?.label}</strong>
        </p>
      </div>

      {/* ── Content area ── */}
      <div className={cn('wizard-content', fullWidth && 'wizard-content--full')}>
        {/* Left: Form */}
        <div className="wizard-form">
          <div className="wizard-form__inner">
            {children}
          </div>

          {/* Step navigation buttons */}
          <div className="wizard-nav-btns">
            {onBack && (
              <button className="wizard-btn wizard-btn--ghost" onClick={onBack}>
                ← Back
              </button>
            )}
            {onNext && (
              <button
                className={cn('wizard-btn wizard-btn--primary', nextDisabled && 'wizard-btn--disabled')}
                onClick={onNext}
                disabled={nextDisabled}
              >
                {isLastStep ? 'Generate PDF →' : `${nextLabel} →`}
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview */}
        {rightPanel && !fullWidth && (
          <div className="wizard-preview">
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
};

export default WizardShell;
