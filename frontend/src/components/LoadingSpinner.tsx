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

// Enhanced loading skeleton components for better UX
export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`} />
);

export const ArticleCardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

export const ArticleGridSkeleton: React.FC = () => (
  <div className="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
    <div className="space-y-3">
      <div className="h-5 bg-gray-200 rounded w-full"></div>
      <div className="h-5 bg-gray-200 rounded w-2/3"></div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

export const ArticleContentSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export const SettingsPageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-center gap-3 mb-8">
      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      <div className="h-8 bg-gray-200 rounded w-48"></div>
    </div>
    
    {/* Cards skeleton */}
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSpinner;