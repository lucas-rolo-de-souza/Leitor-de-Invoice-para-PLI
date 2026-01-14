import React from "react";
import { AlertCircle } from "lucide-react";

export const ErrorTooltip: React.FC<{ message: string }> = ({ message }) => (
  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 group">
    <AlertCircle className="w-5 h-5 text-red-500 cursor-help" />
    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      <div className="font-bold mb-1 text-red-200">Atenção:</div>
      {message}
      <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string | null;
  isReadOnly?: boolean;
  label?: string;
  minimal?: boolean; // For table cells
};

export const ValidatedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, isReadOnly, className, label, minimal, ...props }, ref) => {
    // Aura Style:
    // Default: bg-surface, border-transparent (shadow-inner optionally).
    // Hover: bg-white.
    // Focus: White bg, Aura Blue ring (thick), no border.

    const baseClass = `w-full ${
      minimal ? "h-8 text-xs px-2" : "h-14 text-base"
    } px-4 rounded-m3-xs transition-all duration-200 outline-none font-sans border`;

    const stateClass = isReadOnly
      ? "bg-transparent text-on-surface-variant font-medium cursor-default border-transparent placeholder-transparent"
      : error
      ? "bg-error-container border-error text-on-surface placeholder-error/50 hover:bg-error-container/20 focus:border-error focus:ring-1 focus:ring-error"
      : "bg-surface-container-high border-outline-variant/50 text-on-surface placeholder-on-surface-variant/50 hover:border-on-surface focus:border-primary focus:ring-1 focus:ring-primary";

    return (
      <div className="relative w-full group mb-1">
        {/* Floating Label (M3 Style logic would go here, simplified for now to Standard Label) */}
        {label && !minimal && (
          <label className="absolute -top-2 left-3 bg-surface-container-low px-1 text-[11px] text-on-surface-variant group-focus-within:text-primary z-10 transition-colors">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            disabled={isReadOnly}
            className={`${baseClass} ${stateClass} ${className || ""}`}
            {...props}
          />
          {error && !isReadOnly && !minimal && <ErrorTooltip message={error} />}
        </div>
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string | null;
  isReadOnly?: boolean;
  label?: string;
};

export const ValidatedTextArea: React.FC<TextAreaProps> = ({
  error,
  isReadOnly,
  className,
  label,
  ...props
}) => {
  const baseClass = `w-full px-4 py-3 rounded-m3-xs text-base transition-all duration-200 outline-none resize-none min-h-[100px] font-sans border`;
  const stateClass = isReadOnly
    ? "bg-transparent text-on-surface-variant font-medium cursor-default border-transparent placeholder-transparent"
    : error
    ? "bg-error-container/10 border-error text-on-surface placeholder-error/50 hover:bg-error-container/20 focus:border-error focus:ring-1 focus:ring-error"
    : "bg-transparent border-outline text-on-surface placeholder-on-surface-variant/50 hover:border-on-surface focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="relative w-full group pt-2">
      {label && (
        <label className="absolute -top-0 left-3 bg-surface px-1 text-[11px] text-on-surface-variant group-focus-within:text-primary z-10 transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          disabled={isReadOnly}
          className={`${baseClass} ${stateClass} ${className || ""}`}
          {...props}
        />
        {error && !isReadOnly && (
          <div className="absolute right-3 top-3" title={error}>
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
        )}
      </div>
    </div>
  );
};
