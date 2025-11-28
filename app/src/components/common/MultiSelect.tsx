import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectOption {
  value: number;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  required?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = '選択してください',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOption = (value: number) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeOption = (value: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer flex items-center flex-wrap gap-2 ${
          isOpen ? 'ring-2 ring-[var(--color-primary)]' : ''
        }`}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-[var(--color-text-secondary)]">{placeholder}</span>
        ) : (
          selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-primary)] text-[var(--color-background)] rounded text-sm"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => removeOption(opt.value, e)}
                className="hover:opacity-70 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))
        )}
        <span className="ml-auto text-[var(--color-text-secondary)]">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={`px-4 py-2 cursor-pointer hover:bg-[var(--color-background)] ${
                selectedValues.includes(option.value)
                  ? 'bg-[var(--color-background)] text-[var(--color-primary)]'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => {}}
                  className="cursor-pointer"
                />
                <span>{option.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

