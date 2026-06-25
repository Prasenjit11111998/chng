import React from 'react';
import { useNavigate } from 'react-router-dom';

export type ToolStatus = 'available' | 'coming-soon';

interface ToolCardProps {
  name: string;
  description: string;
  status: ToolStatus;
  route?: string;
  icon?: React.ReactNode;
}

export const ToolCard: React.FC<ToolCardProps> = ({ name, description, status, route }) => {
  const navigate = useNavigate();
  const isAvailable = status === 'available';

  return (
    <div
      className={`bg-panel border p-6 flex flex-col gap-0 min-h-[160px] pixel-box relative group transition-colors duration-150 ${
        isAvailable
          ? 'border-separator cursor-pointer hover:border-foreground/30'
          : 'border-separator opacity-50 cursor-default'
      }`}
      onClick={() => isAvailable && route && navigate(route)}
      role={isAvailable ? 'button' : undefined}
      tabIndex={isAvailable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isAvailable && route && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          navigate(route);
        }
      }}
      aria-label={isAvailable ? `Open ${name}` : `${name} — coming soon`}
    >
      {/* Status pill */}
      <div className="absolute top-5 right-5">
        <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 ${
          isAvailable ? 'text-accent' : 'text-muted'
        }`}>
          {isAvailable ? 'Available' : 'Coming Soon'}
        </span>
      </div>

      <div className="flex-1 mt-2 pr-20">
        <h3 className="text-base font-bold text-foreground mb-2 font-display">{name}</h3>
        <p className="text-sm text-muted leading-relaxed font-normal">{description}</p>
      </div>

      {isAvailable && route && (
        <div className="mt-4 flex justify-end overflow-hidden">
          <span className="text-sm font-bold text-muted group-hover:text-accent font-mono transition-colors duration-150">
            Open →
          </span>
        </div>
      )}
    </div>
  );
};

export default ToolCard;
