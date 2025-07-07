import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    primary: 'border-gray-200 border-t-primary-600',
    white: 'border-white border-opacity-20 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  return (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Loading skeleton components for better UX
export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const ArticleCardSkeleton: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-card p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <LoadingSkeleton className="h-6 w-3/4" />
      <LoadingSkeleton className="h-8 w-16" />
    </div>
    <LoadingSkeleton className="h-4 w-1/2 mb-2" />
    <LoadingSkeleton className="h-4 w-full mb-1" />
    <LoadingSkeleton className="h-4 w-5/6 mb-4" />
    <div className="flex space-x-3">
      <LoadingSkeleton className="h-9 w-24" />
      <LoadingSkeleton className="h-9 w-20" />
    </div>
  </div>
);

export default LoadingSpinner;