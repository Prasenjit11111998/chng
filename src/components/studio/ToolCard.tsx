import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type ToolStatus = 'available' | 'coming-soon';

interface ToolCardProps {
  name: string;
  description: string;
  status: ToolStatus;
  route?: string;
  icon?: React.ReactNode;
}

export const ToolCard: React.FC<ToolCardProps> = ({ name, description, status, route, icon }) => {
  const navigate = useNavigate();
  const isAvailable = status === 'available';

  return (
    <div
      className={cn(
        'studio-tool-card',
        isAvailable ? 'studio-tool-card--available' : 'studio-tool-card--soon',
      )}
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
      {/* Status pill — top-right */}
      <div className="studio-tool-card__status">
        <span className={cn(
          'studio-status-pill',
          isAvailable ? 'studio-status-pill--available' : 'studio-status-pill--soon',
        )}>
          {isAvailable ? 'Available' : 'Coming Soon'}
        </span>
      </div>

      {/* Icon (optional) */}
      {icon && (
        <div className="studio-tool-card__icon">
          {icon}
        </div>
      )}

      {/* Name + description */}
      <div className="studio-tool-card__body">
        <h3 className="studio-tool-card__name">{name}</h3>
        <p className="studio-tool-card__description">{description}</p>
      </div>

      {/* CTA — bottom-right, available only */}
      {isAvailable && route && (
        <div className="studio-tool-card__footer">
          <button
            className="studio-cta-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(route);
            }}
            tabIndex={-1}
            aria-hidden="true"
          >
            Open Tool →
          </button>
        </div>
      )}
    </div>
  );
};

export default ToolCard;
