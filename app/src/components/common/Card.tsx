import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  action,
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`bg-[var(--color-surface)] rounded-lg p-4 md:p-6 border border-[var(--color-border)] ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 md:mb-4">
          {title && (
            <div className="flex items-center gap-2 flex-1">
              {collapsible && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors touch-manipulation"
                  aria-label={isCollapsed ? '展開' : '折りたたみ'}
                >
                  {isCollapsed ? (
                    <FaChevronDown className="text-sm" />
                  ) : (
                    <FaChevronUp className="text-sm" />
                  )}
                </button>
              )}
              <h2 
                className={`text-lg md:text-xl font-bold text-[var(--color-text)] ${collapsible ? 'cursor-pointer' : ''}`}
                onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
              >
                {title}
              </h2>
            </div>
          )}
          {action && !isCollapsed && (
            <div className="w-full sm:w-auto">{action}</div>
          )}
        </div>
      )}
      {!isCollapsed && children}
    </div>
  );
};


