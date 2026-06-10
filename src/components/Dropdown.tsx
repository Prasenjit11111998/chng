import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  options: string[];
  selected?: string;
  onselect?: (option: string) => void;
  disabled?: boolean;
  settingsStyle?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selected = options[0],
  onselect,
  disabled = false,
  settingsStyle = false,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!disabled) {
      setOpen(!open);
    }
  };

  const handleSelect = (option: string) => {
    onselect?.(option);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (target && !document.body.contains(target)) {
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div
      className={`relative w-full ${settingsStyle ? 'font-normal text-sm' : 'text-xs font-semibold'} text-center`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`font-display w-full ${
          settingsStyle 
            ? 'justify-between px-4 py-3.5 rounded-xl' 
            : 'justify-center h-10 px-3 rounded-full'
        } overflow-hidden relative bg-button ${
          disabled ? 'opacity-50 cursor-auto' : 'cursor-pointer'
        } flex items-center pixel-btn focus:outline-none`}
        onClick={toggle}
        disabled={disabled}
      >
        <span className={`${settingsStyle ? 'text-left font-normal' : 'text-center font-semibold'} font-body flex-grow`}>
          {selected}
        </span>
        <ChevronDown
          size={16}
          className={`ml-3 mt-0.5 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full shadow-xl bg-panel-alt absolute overflow-hidden top-full mt-1 left-0 z-50 rounded-xl max-h-[30vh] overflow-y-auto border border-separator"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="w-full p-2.5 px-4 text-left hover:bg-panel border-none bg-transparent cursor-pointer font-body text-sm text-foreground"
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default Dropdown;
