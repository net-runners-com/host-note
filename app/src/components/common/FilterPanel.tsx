import React from 'react';

interface FilterOption {
  label: string;
  value: string | number | null;
}

interface FilterPanelProps {
  filters: {
    label: string;
    key: string;
    type: 'select' | 'text';
    options?: FilterOption[];
    value: string | number | null;
    onChange: (value: string | number | null) => void;
  }[];
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onReset }) => {
  const hasActiveFilters = filters.some((f) => f.value !== null && f.value !== '');

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {filters.map((filter) => (
        <div key={filter.key}>
          <label className="block text-sm font-medium mb-2">
            {filter.label}
          </label>
          {filter.type === 'select' ? (
            <select
              value={filter.value || ''}
              onChange={(e) =>
                filter.onChange(
                  e.target.value === '' ? null : e.target.value
                )
              }
              className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
            >
              <option value="">すべて</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value || ''}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={filter.value || ''}
              onChange={(e) => filter.onChange(e.target.value || null)}
              className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
              placeholder={`${filter.label}で検索...`}
            />
          )}
        </div>
      ))}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="w-full px-4 py-2.5 min-h-[44px] text-base bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors touch-manipulation"
        >
          フィルターをリセット
        </button>
      )}
    </div>
  );
};

