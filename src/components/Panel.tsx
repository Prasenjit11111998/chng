import React from 'react';

interface PanelProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  role?: string;
}

export const Panel: React.FC<PanelProps> = ({ className = '', children, style, role }) => {
  return (
    <div 
      className={`bg-panel pixel-box ${className} rounded-none shadow-panel`}
      style={style}
      role={role}
    >
      {children}
    </div>
  );
};
export default Panel;
