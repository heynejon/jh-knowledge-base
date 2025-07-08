import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'error';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'block w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400';
  
  const variantClasses = {
    default: error 
      ? 'border-error-300 focus:border-error-500 focus:ring-error-500 focus:shadow-lg focus:shadow-error-500/10' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:shadow-lg focus:shadow-primary-500/10',
    error: 'border-error-300 focus:border-error-500 focus:ring-error-500 focus:shadow-lg focus:shadow-error-500/10',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };
  
  const iconClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };
  
  const inputClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
    leftIcon ? 'pl-10' : ''
  } ${rightIcon ? 'pr-10' : ''} ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span className={iconClasses[size]}>{leftIcon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span className={iconClasses[size]}>{rightIcon}</span>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`mt-2 text-sm ${error ? 'text-error-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// Textarea component with similar styling
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  helperText,
  error,
  resize = 'vertical',
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'block w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400';
  
  const borderClasses = error 
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500 focus:shadow-lg focus:shadow-error-500/10' 
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:shadow-lg focus:shadow-primary-500/10';
    
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };
  
  const textareaClasses = `${baseClasses} ${borderClasses} ${resizeClasses[resize]} ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId} 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        className={textareaClasses}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={`mt-2 text-sm ${error ? 'text-error-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;