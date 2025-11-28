import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px] md:min-h-[32px]',
    md: 'px-4 py-2.5 min-h-[44px] md:min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };
  
  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-background)] hover:opacity-90',
    secondary: 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)]',
    danger: 'bg-[var(--color-error)] text-white hover:opacity-90',
    ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

