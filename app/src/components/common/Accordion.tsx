import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--color-surface)] hover:bg-[var(--color-background)] transition-colors touch-manipulation"
      >
        <div className="flex-1 text-left">{title}</div>
        {isOpen ? (
          <FaChevronUp className="text-[var(--color-text-secondary)] flex-shrink-0 ml-2" />
        ) : (
          <FaChevronDown className="text-[var(--color-text-secondary)] flex-shrink-0 ml-2" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-[var(--color-background)] border-t border-[var(--color-border)]">
          {children}
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return <div className="space-y-2">{children}</div>;
};


