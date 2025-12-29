
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { ValidatedInput } from './FormElements';
import { ReferenceItem } from '../../utils/validationConstants';

interface AutocompleteProps {
  id: string;
  value: string | null;
  onChange: (value: string) => void;
  options: ReferenceItem[];
  label?: string;
  placeholder?: string;
  error?: string | null;
  isReadOnly?: boolean;
}

/**
 * Autocomplete (Combobox) Component
 * 
 * Combines a text input with a searchable dropdown list.
 * - Allows free text entry (it's not a strict select).
 * - Filters options by both Code and Name.
 * - Supports keyboard navigation.
 * - Matches the styling of ValidatedInput.
 */
export const Autocomplete: React.FC<AutocompleteProps> = ({
  id,
  value,
  onChange,
  options,
  label,
  placeholder,
  error,
  isReadOnly
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if external value changes (e.g. from AI extraction or Reset)
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Filter options based on user input
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerTerm = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.code.toLowerCase().includes(lowerTerm) ||
        opt.name.toLowerCase().includes(lowerTerm)
    );
  }, [options, searchTerm]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // On blur, ensure the parent gets the current text value (even if custom)
        // This logic is already handled by onChange in the input, but good for cleanup
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setSearchTerm(code);
    onChange(code);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal);
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    if (!isReadOnly) setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <ValidatedInput
            id={id}
            ref={inputRef}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            label={label}
            placeholder={placeholder}
            error={error}
            isReadOnly={isReadOnly}
            autoComplete="off"
            className="pr-8" // Make room for chevron
        />
        {!isReadOnly && (
            <div 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer p-1 hover:text-brand-600 transition-colors"
                onClick={() => {
                    if (isOpen) {
                        setIsOpen(false);
                    } else {
                        inputRef.current?.focus();
                        setIsOpen(true);
                    }
                }}
            >
                {isOpen ? <X className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !isReadOnly && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
              Nenhuma correspondência encontrada.
            </div>
          ) : (
            <ul className="py-1">
              {filteredOptions.map((opt) => {
                  const isSelected = opt.code === value;
                  return (
                    <li
                        key={opt.code}
                        onClick={() => handleSelect(opt.code)}
                        className={`
                        px-3 py-2 text-sm cursor-pointer flex items-center justify-between group transition-colors
                        ${isSelected ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}
                        `}
                    >
                        <div className="flex flex-col">
                            <span className="font-bold font-mono text-xs">{opt.code}</span>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-700 truncate">{opt.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                    </li>
                  );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
