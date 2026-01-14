import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Language, translations } from "../i18n/translations";

type TranslationContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["pt-BR"];
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("pt-BR");

  // Optional: Persist language pref
  useEffect(() => {
    const saved = localStorage.getItem("app_language") as Language;
    if (saved && (saved === "pt-BR" || saved === "en-GB")) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app_language", lang);
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t: translations[language],
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useLanguage must be used within a TranslationProvider");
  }
  return context;
};
