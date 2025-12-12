
import React from 'react';
import { PenTool, Sparkles } from 'lucide-react';

interface VersionBarProps {
  showOriginal: boolean;
  onToggle: (showOriginal: boolean) => void;
}

export const VersionBar: React.FC<VersionBarProps> = ({ showOriginal, onToggle }) => {
  return (
    <div className="bg-slate-100 p-1 rounded-lg flex items-center shadow-inner">
      <button
        onClick={() => onToggle(false)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all
          ${!showOriginal 
            ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' 
            : 'text-slate-500 hover:text-slate-700'
          }
        `}
      >
        <PenTool className="w-3 h-3" />
        Editor
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all
          ${showOriginal 
            ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
            : 'text-slate-500 hover:text-slate-700'
          }
        `}
      >
        <Sparkles className="w-3 h-3" />
        Original AI
      </button>
    </div>
  );
};
