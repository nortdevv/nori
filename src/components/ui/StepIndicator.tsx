import { Check } from "lucide-react";
import "../../pages/Chat.css";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div key={step} className="step-item">
            <div className="step-item__inner">
              <div
                className={`step-circle ${isActive ? "step-circle--active" : ""} ${isDone ? "step-circle--done" : ""}`}
              >
                {isDone ? <Check size={16} /> : stepNum}
              </div>
              <span
                className={`step-label ${isActive ? "step-label--active" : ""} ${isDone ? "step-label--done" : ""}`}
              >
                {step}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className={`step-connector ${isDone ? "step-connector--done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
