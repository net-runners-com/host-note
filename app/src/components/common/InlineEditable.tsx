import { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { logError } from '../../utils/errorHandler';

interface InlineEditableProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  displayComponent?: React.ReactNode;
  inputType?: 'text' | 'textarea' | 'date' | 'datetime-local' | 'select';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  options?: { value: string; label: string }[];
}

export const InlineEditable: React.FC<InlineEditableProps> = ({
  value,
  onSave,
  displayComponent,
  inputType = 'text',
  placeholder,
  className = '',
  disabled = false,
  options = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ((inputType === 'text' || inputType === 'textarea') && 'select' in inputRef.current) {
        (inputRef.current as HTMLInputElement | HTMLTextAreaElement).select();
      }
    }
  }, [isEditing, inputType]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      logError(error, { component: 'InlineEditable', action: 'handleSave' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputType !== 'textarea' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex flex-col md:flex-row items-stretch md:items-start gap-2 ${className}`}>
        {inputType === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="flex-1 px-3 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
            placeholder={placeholder}
            disabled={isSaving}
          />
        ) : inputType === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
            disabled={isSaving}
          >
            <option value="">選択してください</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={inputType}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
            placeholder={placeholder}
            disabled={isSaving}
          />
        )}
        <div className="flex flex-row md:flex-col gap-2 md:gap-1">
          <Button
            type="button"
            onClick={handleSave}
            size="sm"
            disabled={isSaving}
            className="flex-1 md:flex-none md:min-w-[60px]"
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            size="sm"
            disabled={isSaving}
            className="flex-1 md:flex-none md:min-w-[60px]"
          >
            キャンセル
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      className={`cursor-pointer hover:bg-[var(--color-background)] rounded px-2 py-2 min-h-[44px] flex items-center transition-colors touch-manipulation ${className} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      title={disabled ? '' : 'クリックして編集'}
    >
      {displayComponent || (
        <span className={`text-base ${value ? '' : 'text-[var(--color-text-secondary)] italic'}`}>
          {value || placeholder || 'クリックして編集'}
        </span>
      )}
    </div>
  );
};

