import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  progress: number | null;
  min: number;
  max: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, min, max, label = 'Progress' }) => {
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    if (progress === 100) {
      setSimulatedProgress(100);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      const remaining = 92 - current;
      if (remaining > 1) {
        // Decelerate as we approach 92%
        const increment = Math.max(1, remaining * 0.12 + Math.random() * 1.5);
        current = Math.min(92, current + increment);
        setSimulatedProgress(Math.round(current));
      } else {
        clearInterval(interval);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [progress === 100]);

  // Use actual progress if it's higher than the simulated progress
  const displayProgress = progress !== null && progress > simulatedProgress ? progress : simulatedProgress;
  const percent = Math.min(100, Math.max(0, Math.round(((displayProgress - min) / (max - min)) * 100)));

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
      className="w-full h-4 bg-panel-highlight overflow-hidden relative pixel-btn"
    >
      <div
        className="h-full absolute left-0 top-0 transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `${percent}%`,
          background: 'repeating-linear-gradient(90deg, var(--accent), var(--accent) 6px, transparent 6px, transparent 8px)',
        }}
      />
    </div>
  );
};

export default ProgressBar;

