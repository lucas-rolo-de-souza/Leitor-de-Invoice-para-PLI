import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, X, Anchor, Plane } from "lucide-react";
import { ValidatedInput } from "./FormElements";
import { ReferenceItem } from "../../utils/validationConstants";

export interface AutocompleteItem extends ReferenceItem {
  city?: string;
  type?: "port" | "airport" | "other"; // 'other' for legacy/basic items
  country?: string; // ISO3
  keywords?: string[]; // Aliases for searching (e.g. Country Name)
}

type AutocompleteProps = {
  id: string;
  value: string | null;
  onChange: (value: string) => void;
  options: AutocompleteItem[];
  label?: string;
  placeholder?: string;
  error?: string | null;
  isReadOnly?: boolean;
  displayMode?: "default" | "code";
};

/**
 * Autocomplete (Combobox) Component
 *
 * Modified to support Logistics Data (Ports/Airports)
 */
export const Autocomplete: React.FC<AutocompleteProps> = ({
  id,
  value,
  onChange,
  options,
  label,
  placeholder,
  error,
  isReadOnly,
  displayMode = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If we have a value, try to find the full display name or just use the value?
    // User requested "Name, Country" display.
    // However, the `value` prop is usually the CODE (which is what we save).
    // If `value` matches an option code, we should probably set search term to that item's display name?
    // OR, we just show the code?
    // Plan: "Returns the code ... but input displays Name, Country".
    // If value matches, we find it.
    if (value) {
      if (displayMode === "code") {
        setSearchTerm(value);
      } else {
        const found = options.find((o) => o.code === value);
        if (found && found.country) {
          setSearchTerm(`${found.name}, ${found.country}`);
        } else if (found) {
          setSearchTerm(found.name);
        } else {
          setSearchTerm(value);
        }
      }
    } else {
      setSearchTerm("");
    }
  }, [value, options, displayMode]); // Careful with options dependency if it changes reference often

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options.slice(0, 50); // Limit initial view
    const terms = searchTerm
      .toLowerCase()
      .split(/[ ,]+/)
      .filter((t) => t.length > 0);

    // Performance optimization: limit results
    const results: AutocompleteItem[] = [];
    for (const opt of options) {
      if (!opt) continue; // Defensive check
      const code = opt.code?.toLowerCase() || "";
      const name = opt.name?.toLowerCase() || "";
      const city = opt.city?.toLowerCase() || "";
      const keywords = opt.keywords?.map((k) => k.toLowerCase()) || [];
      const country = opt.country?.toLowerCase() || "";

      // Check if ALL terms match at least one field
      const matchesAll = terms.every((term) => {
        return (
          code.includes(term) ||
          name.includes(term) ||
          city.includes(term) ||
          country.includes(term) ||
          keywords.some((k) => k.includes(term))
        );
      });

      if (matchesAll) {
        results.push(opt);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [options, searchTerm]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // On blur: If standard text input can't resolve to a Code, what do we do?
        // Current logic just leaves it. The parent `onChange` was called on every keystroke?
        // Wait, `handleInputChange` calls `onChange` with the TEXT?
        // NO. `Autocomplete` usually expects `onChange` to be called on SELECTION or strict match?
        // Current impl calls onChange(newVal) on typing.
        // If displayMode is 'code' and user types code, it works naturally.
        // If displayMode is 'default' (Name), user types Name, but onChange gets Name (not Code).
        // This relies on parent/validation to handle or user to select from dropdown.
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: AutocompleteItem) => {
    const display =
      displayMode === "code"
        ? item.code
        : item.country
          ? `${item.name}, ${item.country}`
          : item.name;
    setSearchTerm(display);
    onChange(item.code); // Return CODE to parent
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    // When typing, we don't necessarily update the Parent Code immediately if it breaks validation?
    // But standard input behavior implies it does.
    // If we want to strictly enforce codes, we might pass null?
    // Let's pass the text. The parent validator will fail if it expects a 5-digit code or UN/LOCODE.
    // Actually, avoiding passing partial text as specific ID is better, but consistency first.
    onChange(newVal);
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    if (!isReadOnly) setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
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
        className="pr-8"
      />
      {!isReadOnly && (
        <div
          className="absolute right-2 top-[34px] text-slate-400 cursor-pointer p-1 hover:text-brand-600 transition-colors"
          onClick={() => {
            inputRef.current?.focus();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <X className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
      )}

      {isOpen && !isReadOnly && (
        <div className="absolute z-50 w-full mt-1 bg-surface-container-high border border-outline-variant/50 rounded-m3-md shadow-elevation-2 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 left-0">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-on-surface-variant italic text-center">
              Nenhuma correspondência encontrada.
            </div>
          ) : (
            <ul className="py-1">
              {filteredOptions.map((opt) => {
                const isSelected = opt.code === value;
                return (
                  <li
                    key={`${opt.code}-${opt.type || "gen"}`}
                    onClick={() => handleSelect(opt)}
                    className={`
                        px-3 py-2 text-sm cursor-pointer flex items-center justify-between group transition-colors border-b border-outline-variant/10 last:border-0
                        ${isSelected ? "bg-primary-container text-on-primary-container" : "text-on-surface hover:bg-surface-container-highest"}
                        `}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Icon */}
                      <div
                        className={`shrink-0 ${isSelected ? "text-primary" : "text-on-surface-variant/50"}`}
                      >
                        {opt.type === "port" && <Anchor size={14} />}
                        {opt.type === "airport" && <Plane size={14} />}
                        {!opt.type && <div className="w-[14px]" />}{" "}
                        {/* Spacer if no type */}
                      </div>

                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium truncate text-sm">
                            {opt.name}
                            {opt.country && (
                              <span className="text-xs text-on-surface-variant/70 font-normal ml-1">
                                ({opt.country})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70">
                          <span className="font-mono bg-on-surface/5 px-1 rounded text-on-surface-variant font-bold">
                            {opt.code}
                          </span>
                          {opt.city && (
                            <span className="truncate">• {opt.city}</span>
                          )}
                        </div>
                      </div>
                    </div>
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
