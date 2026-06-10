import React from 'react';

interface FancyInputProps {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  extension?: string;
  prefix?: string;
  type?: string;
  min?: number;
  max?: number;
}

export const FancyInput: React.FC<FancyInputProps> = ({
  className = '',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  extension,
  prefix,
  type = 'text',
  min = 0,
  max = 100,
}) => {
  return (
    <div className={`relative flex w-full ${className}`}>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-3 rounded-lg bg-panel border-2 border-button text-foreground
          ${prefix ? 'pl-[3rem]' : 'pl-3'} 
          ${extension ? 'pr-[4rem]' : 'pr-3'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:outline-accent focus:outline-2`}
      />
      {prefix && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center px-2">
          <span className="text-sm text-gray-400 px-2 py-1 rounded">{prefix}</span>
        </div>
      )}
      {extension && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center px-4">
          <span className="text-sm bg-button text-foreground px-2 py-1 rounded">
            {extension}
          </span>
        </div>
      )}
    </div>
  );
};
export default FancyInput;
