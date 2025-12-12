import React from 'react';
import { Scale, X, ExternalLink, Copyright, ShieldCheck } from 'lucide-react';
import { APP_VERSION } from '../../version';

interface LegalModalProps {
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ onClose }) => {
  const libraries = [
    { name: "React", license: "MIT", url: "https://react.dev/" },
    { name: "Google GenAI SDK", license: "Apache 2.0", url: "https://github.com/google/google-genai-js" },
    { name: "Lucide React", license: "ISC", url: "https://lucide.dev/" },
    { name: "Tailwind CSS", license: "MIT", url: "https://tailwindcss.com/" },
    { name: "SheetJS (XLSX)", license: "Apache 2.0", url: "https://sheetjs.com/" },
    { name: "jsPDF", license: "MIT", url: "https://github.com/parallax/jsPDF" },
    { name: "jsPDF-AutoTable", license: "MIT", url: "https://github.com/simonbengtsson/jsPDF-AutoTable" },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-800">
                <div className="bg-slate-100 p-2 rounded-lg">
                    <Scale className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                    <h3 className="font-bold leading-tight">Legal & Licenciamento</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Leitor de Faturas AI v{APP_VERSION}</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* Proprietary Section */}
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                <div className="flex items-center gap-2 mb-2 text-brand-800 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <h4>Licença Proprietária</h4>
                </div>
                <p className="text-xs text-brand-700 leading-relaxed text-justify">
                    Este software ("Leitor de Faturas AI") e seu código-fonte são propriedade intelectual exclusiva da equipe de desenvolvimento. 
                    Todos os direitos são reservados. A reprodução, distribuição, engenharia reversa ou uso não autorizado deste código é estritamente proibida sem permissão expressa por escrito.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-brand-600 font-medium">
                    <Copyright className="w-3 h-3" /> 2024 Invoice Reader Team. All Rights Reserved.
                </div>
            </div>

            {/* OSS Attribution */}
            <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">
                    Atribuição de Software de Terceiros (OSS)
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                    Este projeto utiliza as seguintes bibliotecas de código aberto, respeitando suas respectivas licenças:
                </p>
                
                <div className="grid grid-cols-1 gap-2">
                    {libraries.map((lib) => (
                        <div key={lib.name} className="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-colors">
                            <span className="font-medium text-slate-700">{lib.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                                    {lib.license}
                                </span>
                                <a href={lib.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-brand-600">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-100">
                <p>O uso deste software implica na aceitação destes termos.</p>
                <p className="mt-1">Powered by Google Gemini API.</p>
            </div>
        </div>
      </div>
    </div>
  );
};