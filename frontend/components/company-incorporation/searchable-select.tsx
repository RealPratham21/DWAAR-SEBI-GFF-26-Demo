'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { fieldClassName } from '@/components/company-incorporation/form-primitives';
import { cn } from '@/lib/utils';

export type SearchableSelectOption = {
  value: string;
  label: string;
};

interface SearchableSelectProps {
  id?: string;
  options: readonly SearchableSelectOption[] | SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
}

export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Search or select…',
  disabled,
  'aria-invalid': ariaInvalid,
}: SearchableSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? '',
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery(selectedLabel);
    }
  }, [open, selectedLabel]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    const label = options.find((option) => option.value === optionValue)?.label ?? '';
    setQuery(label);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={ariaInvalid}
          disabled={disabled}
          value={open ? query : selectedLabel || query}
          placeholder={placeholder}
          className={cn(fieldClassName, 'pr-10')}
          onFocus={() => {
            setOpen(true);
            setQuery(selectedLabel);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setQuery(selectedLabel);
            }
            if (event.key === 'Enter' && filteredOptions.length === 1) {
              event.preventDefault();
              handleSelect(filteredOptions[0].value);
            }
          }}
        />
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>

      {open && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No matching options</li>
          ) : (
            filteredOptions.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors',
                    option.value === value && 'bg-muted font-medium',
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
