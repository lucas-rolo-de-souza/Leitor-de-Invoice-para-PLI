
import React from 'react';
import { AlertCircle } from 'lucide-react';

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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
  isReadOnly?: boolean;
  label?: string;
  minimal?: boolean; // For table cells
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, InputProps>(({ error, isReadOnly, className, label, minimal, ...props }, ref) => {
  // Minimalist Style:
  // Default: bg-slate-50, no border.
  // Hover: slightly darker gray.
  // Focus: White bg, Brand ring, no border.
  // Error: Red ring, Red bg tint.
  
  const baseClass = `w-full ${minimal ? 'h-8 text-xs' : 'h-10 sm:h-11 text-base sm:text-sm'} px-3 rounded-lg transition-all duration-200 outline-none`;
  
  const stateClass = isReadOnly
    ? 'bg-transparent text-slate-500 font-medium cursor-default placeholder-transparent' // Read-only is very clean, almost like text
    : error
      ? 'bg-red-50 text-red-900 placeholder-red-300 ring-1 ring-inset ring-red-200 focus:ring-2 focus:ring-red-400'
      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:shadow-sm placeholder-slate-400';

  return (
    <div className="relative w-full group">
      {label && <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 ml-1">{label}</label>}
      <div className="relative">
        <input 
          ref={ref}
          disabled={isReadOnly}
          className={`${baseClass} ${stateClass} ${className || ''}`} 
          {...props} 
        />
        {error && !isReadOnly && !minimal && <ErrorTooltip message={error} />}
        {/* Visual cue for editable fields on hover */}
        {!isReadOnly && !error && <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-slate-900/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
  isReadOnly?: boolean;
  label?: string;
}

export const ValidatedTextArea: React.FC<TextAreaProps> = ({ error, isReadOnly, className, label, ...props }) => {
    const baseClass = `w-full px-3 py-2 rounded-lg text-base sm:text-sm transition-all duration-200 outline-none resize-none min-h-[80px]`;
    const stateClass = isReadOnly
      ? 'bg-transparent text-slate-500 font-medium cursor-default placeholder-transparent'
      : error
        ? 'bg-red-50 text-red-900 placeholder-red-300 ring-1 ring-inset ring-red-200 focus:ring-2 focus:ring-red-400'
        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:shadow-sm placeholder-slate-400';
  
    return (
      <div className="relative w-full group">
        {label && <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 ml-1">{label}</label>}
        <div className="relative">
            <textarea 
            disabled={isReadOnly}
            className={`${baseClass} ${stateClass} ${className || ''}`} 
            {...props} 
            />
            {!isReadOnly && !error && <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-slate-900/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />}
             {error && !isReadOnly && (
                <div className="absolute right-3 top-3" title={error}>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
            )}
        </div>
      </div>
    );
};
