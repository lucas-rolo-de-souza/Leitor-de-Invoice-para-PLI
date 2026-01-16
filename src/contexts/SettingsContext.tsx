import React, { createContext, useContext, useState, useEffect } from "react";

interface SettingsContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [apiKey, setApiKeyState] = useState<string>("");

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("gemini_api_key");
    if (stored) {
      setApiKeyState(stored);
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (key.trim()) {
      localStorage.setItem("gemini_api_key", key);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  };

  const value = {
    apiKey,
    setApiKey,
    isConfigured: !!apiKey && apiKey.length > 20, // Basic length check
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
