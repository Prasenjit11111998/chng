import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { blinkService } from '../lib/util/blinkService';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  const [dotVisible, setDotVisible] = useState(true);

  useEffect(() => {
    return blinkService.subscribe((visible) => {
      setDotVisible(visible);
    });
  }, []);

  return (
    <span
      className={cn(
        "font-bold tracking-tight select-none inline-flex items-baseline",
        "font-['Geist_Pixel_Circle']",
        className
      )}
    >
      Chng
      <svg
        className={cn(
          "w-[8px] h-[8px] inline-block ml-0.5",
          dotVisible ? "opacity-100" : "opacity-0"
        )}
        viewBox="0 0 8 8"
        fill="none"
      >
        <rect width="8" height="8" fill="#ff0000" />
      </svg>
    </span>
  );
};

export default Logo;
