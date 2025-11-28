import React from 'react';
import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  const avatar = createAvatar(initials, {
    seed: name,
    size: size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 64 : 96,
  });

  const avatarUrl = avatar.toDataUri();

  return (
    <img
      src={avatarUrl}
      alt={name}
      className={`${sizeClasses[size]} rounded-full ${className}`}
    />
  );
};

