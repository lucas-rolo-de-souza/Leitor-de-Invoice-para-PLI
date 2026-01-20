import React, { useState } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, X } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

interface SettingsModalProps {
  onClose: () => void;
  canClose: boolean; // If false, force user to set key (First run)
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  canClose,
}) => {
  const { apiKey, setApiKey } = useSettings();
  const [inputKey, setInputKey] = useState(apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState("");
  const t = useTranslation();

  const handleSave = () => {
    if (inputKey.length < 20) {
      setMsg("Invalid API Key length");
      return;
    }
    setApiKey(inputKey);
    setMsg("Saved!");
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-m3-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-outline-variant">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-on-surface flex items-center gap-3">
              <Key className="w-6 h-6 text-primary" />
              API Configuration
            </h3>
            {canClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
                title={t.app.history.close}
                aria-label={t.app.history.close}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              This application requires your own Google Gemini API Key to
              process invoices. Your key is stored locally in your browser and
              is never sent to our servers.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-on-surface-variant space-y-2">
              <p>
                <strong>Privacy Notice:</strong> By using this tool, you
                acknowledge that your documents and data will be processed by
                Google Gemini AI. Refer to{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google&apos;s Privacy Policy
                </a>{" "}
                for more details.
              </p>
              <p>
                <strong>Pricing:</strong> We recommend using{" "}
                <span className="font-bold text-primary">Gemini 2.5 Flash</span>
                . It is currently free of charge (Free Tier) within reasonable
                specific limits (up to ~15 RPM).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-surface-container-high border-b-2 border-outline-variant focus:border-primary px-4 py-3 text-on-surface outline-none transition-colors font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Get a key from Google AI Studio
                </a>
                {msg && (
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      msg === "Saved!" ? "text-green-600" : "text-error"
                    }`}
                  >
                    {msg === "Saved!" ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {msg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-container flex justify-end">
          <button
            onClick={handleSave}
            disabled={!inputKey}
            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
