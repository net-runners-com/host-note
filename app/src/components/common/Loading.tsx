import React from 'react';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

const sizeClassMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const Loading: React.FC<LoadingProps> = ({
  className = '',
  size = 'lg',
  inline = false,
}) => {
  const sizeClass = sizeClassMap[size];

  return (
    <div
      className={`${inline ? 'inline-flex items-center justify-center' : 'flex items-center justify-center py-12'} ${className}`.trim()}
    >
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-[var(--color-primary)] ${sizeClass}`}></div>
    </div>
  );
};
