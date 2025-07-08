import React from 'react';

interface ToggleProps {
  leftLabel: string;
  rightLabel: string;
  isRight: boolean;
  onChange: (isRight: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  leftLabel,
  rightLabel,
  isRight,
  onChange,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const sizeClasses = {
    sm: {
      container: 'h-9 px-1',
      slider: 'h-7',
      text: 'text-xs font-medium',
      padding: 'px-4',
    },
    md: {
      container: 'h-10 px-1',
      slider: 'h-8',
      text: 'text-sm font-medium',
      padding: 'px-6',
    },
    lg: {
      container: 'h-12 px-1',
      slider: 'h-10',
      text: 'text-base font-medium',
      padding: 'px-8',
    },
  };

  const sizes = sizeClasses[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!isRight);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex items-center ${sizes.container} bg-gray-200 rounded-lg transition-all duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`}
    >
      {/* Sliding background */}
      <div
        className={`absolute top-1 ${sizes.slider} bg-white rounded-md shadow-md transition-all duration-300 ease-out transform ${
          isRight ? 'translate-x-[100%]' : 'translate-x-0'
        }`}
        style={{
          width: 'calc(50% - 0.125rem)',
        }}
      />
      
      {/* Left label */}
      <div className={`relative z-10 flex-1 ${sizes.text} ${sizes.padding} transition-colors duration-200 text-center ${
        !isRight ? 'text-gray-900' : 'text-gray-500'
      }`}>
        {leftLabel}
      </div>
      
      {/* Right label */}
      <div className={`relative z-10 flex-1 ${sizes.text} ${sizes.padding} transition-colors duration-200 text-center ${
        isRight ? 'text-gray-900' : 'text-gray-500'
      }`}>
        {rightLabel}
      </div>
    </button>
  );
};

export default Toggle;