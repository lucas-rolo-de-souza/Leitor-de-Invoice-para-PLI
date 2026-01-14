import React from "react";
import { PenTool, Sparkles } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

type VersionBarProps = {
  showOriginal: boolean;
  onToggle: (showOriginal: boolean) => void;
};

/**
 * VersionBar Component
 *
 * A segmented control toggle that switches the application view between:
 * 1. **Editor**: The current, editable working draft of the invoice.
 * 2. **Original AI**: A read-only view of the raw data as initially extracted by the AI.
 *
 * used to allow users to verify AI accuracy against their edits without losing work.
 */
export const VersionBar: React.FC<VersionBarProps> = ({
  showOriginal,
  onToggle,
}) => {
  const t = useTranslation();

  return (
    <div className="bg-surface-container-high p-1 rounded-full flex items-center relative border border-outline-variant/30 shadow-inner">
      {/* Sliding Background Indicator (Simulated with absolute positioning or just conditional classes for simplicity first) */}
      {/* For a true sliding effect without extra libs, we can simply switch styles. The user requested "modern and seamless". 
          Let's stick to a clean conditional class approach for reliability. */}

      <button
        onClick={() => onToggle(false)}
        className={`
          relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300
          ${
            !showOriginal
              ? "bg-primary-container text-on-primary-container shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50"
          }
        `}
      >
        <PenTool className="w-3.5 h-3.5" />
        <span>{t.app.versionBar.editor}</span>
      </button>

      <button
        onClick={() => onToggle(true)}
        className={`
          relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300
          ${
            showOriginal
              ? "bg-secondary-container text-on-secondary-container shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50"
          }
        `}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{t.app.versionBar.original}</span>
      </button>
    </div>
  );
};
