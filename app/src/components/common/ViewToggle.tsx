import React from 'react';
import { FaTh, FaList, FaChevronDown } from 'react-icons/fa';

export type ViewMode = 'grid' | 'list' | 'accordion';

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onChange }) => {
  return (
    <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
      <button
        onClick={() => onChange('grid')}
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors touch-manipulation ${
          viewMode === 'grid'
            ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
        }`}
        aria-label="グリッド表示"
      >
        <FaTh />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors touch-manipulation ${
          viewMode === 'list'
            ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
        }`}
        aria-label="リスト表示"
      >
        <FaList />
      </button>
      <button
        onClick={() => onChange('accordion')}
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors touch-manipulation ${
          viewMode === 'accordion'
            ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
        }`}
        aria-label="アコーディオン表示"
      >
        <FaChevronDown />
      </button>
    </div>
  );
};


