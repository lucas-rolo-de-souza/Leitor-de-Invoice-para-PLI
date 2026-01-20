import React from "react";
import { Scale, X, ExternalLink, Copyright, ShieldCheck } from "lucide-react";
import { APP_VERSION } from "../../version";
import { useTranslation } from "../../hooks/useTranslation";

type LegalModalProps = {
  onClose: () => void;
};

type Library = {
  name: string;
  license: string;
  url: string;
};

/**
 * LegalModal Component
 *
 * Displays legal information required for compliance and transparency.
 */
export const LegalModal: React.FC<LegalModalProps> = ({ onClose }) => {
  const t = useTranslation();

  const libraries: Library[] = [
    {
      name: "React",
      license: "MIT",
      url: "https://react.dev",
    },
    {
      name: "Lucide React",
      license: "ISC",
      url: "https://lucide.dev",
    },
    {
      name: "Google Generative AI",
      license: "Apache 2.0",
      url: "https://github.com/google/google-api-nodejs-client",
    },
    {
      name: "Tailwind CSS",
      license: "MIT",
      url: "https://tailwindcss.com",
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-high rounded-m3-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/50">
        {/* Header */}
        <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
          <div className="flex items-center gap-2 text-on-surface">
            <div className="bg-surface-container p-2 rounded-lg">
              <Scale className="w-5 h-5 text-on-surface-variant" />
            </div>
            <div>
              <h3 className="font-bold leading-tight">
                {t.modals.legal.title}
              </h3>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                Leitor de Faturas AI v{APP_VERSION}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.app.history.close}
            title={t.app.history.close}
            className="text-on-surface-variant hover:text-on-surface p-1 hover:bg-surface-container-highest rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Proprietary Section */}
          <div className="bg-primary-container/30 rounded-xl p-4 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-2 text-primary font-bold">
              <ShieldCheck className="w-4 h-4" />
              <h4>{t.modals.legal.license}</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed text-justify">
              Este software (&quot;Leitor de Faturas AI&quot;) e seu
              código-fonte são propriedade intelectual exclusiva da equipe de
              desenvolvimento. Todos os direitos são reservados. A reprodução,
              distribuição, engenharia reversa ou uso não autorizado deste
              código é estritamente proibida sem permissão expressa por escrito.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[10px] text-primary/80 font-medium">
              <Copyright className="w-3 h-3" /> 2024 Invoice Reader Team. All
              Rights Reserved.
            </div>
          </div>

          {/* OSS Attribution */}
          <div>
            <h4 className="text-sm font-bold text-on-surface mb-3 border-b border-outline-variant/30 pb-2">
              {t.modals.legal.oss}
            </h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Este projeto utiliza as seguintes bibliotecas de código aberto,
              respeitando suas respectivas licenças:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {libraries.map((lib) => (
                <div
                  key={lib.name}
                  className="flex items-center justify-between text-xs p-2 rounded hover:bg-surface-container-highest border border-transparent hover:border-outline-variant/30 group transition-colors"
                >
                  <span className="font-medium text-on-surface">
                    {lib.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded text-[10px] font-mono border border-outline-variant/30">
                      {lib.license}
                    </span>
                    <a
                      href={lib.url}
                      title="Link Externo"
                      aria-label="Link Externo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-on-surface-variant hover:text-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-on-surface-variant/50 text-center pt-4 border-t border-outline-variant/30">
            <p>O uso deste software implica na aceitação destes termos.</p>
            <p className="mt-1">Powered by Google Gemini API.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
