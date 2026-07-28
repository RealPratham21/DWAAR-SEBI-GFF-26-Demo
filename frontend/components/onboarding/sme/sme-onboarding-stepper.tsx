'use client';

import { CheckCircle2 } from 'lucide-react';
import {
  SME_ONBOARDING_STEPS,
  TOTAL_SME_ONBOARDING_STEPS,
} from '@/lib/onboarding/sme/constants';
import { cn } from '@/lib/utils';

interface SmeOnboardingStepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  isStepUnlocked: (step: number) => boolean;
  isStepCompleted: (step: number) => boolean;
}

export function SmeOnboardingStepper({
  currentStep,
  onStepClick,
  isStepUnlocked,
  isStepCompleted,
}: SmeOnboardingStepperProps) {
  const progressPercent = Math.round((currentStep / TOTAL_SME_ONBOARDING_STEPS) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          Step {currentStep} of {TOTAL_SME_ONBOARDING_STEPS}
        </p>
        <p className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-md">
          {progressPercent}% complete
        </p>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-sm text-muted-foreground md:hidden">
        {SME_ONBOARDING_STEPS.find((step) => step.id === currentStep)?.title}
      </p>

      <div className="hidden md:flex items-center justify-between">
        {SME_ONBOARDING_STEPS.map((step, index) => {
          const unlocked = isStepUnlocked(step.id);
          const completed = isStepCompleted(step.id);
          const current = step.id === currentStep;
          const clickable = unlocked && (completed || current);

          return (
            <div key={step.id} className={cn('flex items-center', index < SME_ONBOARDING_STEPS.length - 1 && 'flex-1')}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(step.id)}
                aria-current={current ? 'step' : undefined}
                aria-label={`${step.title}${completed ? ', completed' : ''}${!unlocked ? ', locked' : ''}`}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  completed && !current && 'bg-success text-white',
                  current && 'bg-accent text-white',
                  !completed && !current && unlocked && 'bg-muted text-muted-foreground',
                  !unlocked && 'bg-muted/60 text-muted-foreground/50 cursor-not-allowed',
                  clickable && !current && 'hover:ring-2 hover:ring-accent/40',
                )}
              >
                {completed && !current ? <CheckCircle2 size={18} /> : step.id}
              </button>
              {index < SME_ONBOARDING_STEPS.length - 1 ? (
                <div
                  className={cn(
                    'h-1 flex-1 mx-2 transition-all',
                    completed ? 'bg-success' : 'bg-muted',
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="hidden lg:grid grid-cols-7 gap-2 text-xs text-center">
        {SME_ONBOARDING_STEPS.map((step) => (
          <span
            key={step.id}
            className={cn(
              'truncate',
              step.id === currentStep ? 'text-accent font-semibold' : 'text-muted-foreground',
            )}
          >
            {step.shortTitle}
          </span>
        ))}
      </div>
    </div>
  );
}
