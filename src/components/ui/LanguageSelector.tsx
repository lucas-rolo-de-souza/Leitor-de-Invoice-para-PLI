import React from "react";
import { Globe, Check } from "lucide-react";

export type Language = "pt-BR" | "en-GB";

type LanguageSelectorProps = {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  placement?: "top" | "bottom";
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLang,
  onLanguageChange,
  placement = "bottom",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "pt-BR", label: "Português", flag: "🇧🇷" },
    { code: "en-GB", label: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary"
        title="Select Language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-xs font-medium uppercase hidden sm:block">
          {currentLang.split("-")[0]}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 w-48 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-surface-container-highest transition-colors ${
                  currentLang === lang.code
                    ? "text-primary font-bold bg-primary/5"
                    : "text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {currentLang === lang.code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
