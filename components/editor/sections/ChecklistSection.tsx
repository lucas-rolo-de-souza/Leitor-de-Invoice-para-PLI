
import React from 'react';
import { ScrollText, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

export interface ChecklistItem {
    id: string;
    title: string;
    status: string;
    msg: string;
    expected: string;
    details: string;
}

interface ChecklistSectionProps {
    checklist: ChecklistItem[];
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({ checklist }) => {
  const handleScrollToField = (id: string) => {
    // Map checklist IDs to DOM element IDs
    const fieldMap: Record<string, string> = {
        'exporter': 'exporterName',
        'importer': 'importerName',
        'spec': 'items-section', // Wrapper div in InvoiceEditor
        'ncm': 'items-section',
        'volumes': 'totalVolumes',
        'gross_weight': 'totalGrossWeight',
        'net_weight': 'totalNetWeight',
        'origin': 'countryOfOrigin',
        'acquis': 'countryOfAcquisition',
        'prov': 'countryOfProvenance',
        'currency': 'currency',
        'totals': 'grandTotal',
        'payment': 'paymentTerms',
        'incoterm': 'incoterm'
    };

    const targetId = fieldMap[id];
    if (targetId) {
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Try to focus if it's an input
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                element.focus();
            }
            // Highlight animation
            element.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2');
            setTimeout(() => element.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2'), 2000);
        }
    }
  };

  return (
    <section className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                <ScrollText className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Relatório de Conformidade
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                    Validação Art. 557 Regulamento Aduaneiro
                </p>
            </div>
        </div>

        <div className="divide-y divide-slate-100">
             {checklist.map((item) => (
                <div key={item.id} className="p-4 sm:px-6 flex flex-col sm:flex-row gap-4 hover:bg-white transition-colors group">
                   {/* Status Icon */}
                   <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                       item.status === 'ok' ? 'bg-green-100 border-green-200 text-green-600' : 
                       item.status === 'missing' ? 'bg-red-100 border-red-200 text-red-600' : 'bg-amber-100 border-amber-200 text-amber-600'
                   }`}>
                      {item.status === 'ok' ? <Check className="w-4 h-4" /> : item.status === 'missing' ? <X className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                   </div>

                   {/* Content */}
                   <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                            <h4 className={`text-sm font-bold ${item.status === 'ok' ? 'text-slate-700' : 'text-slate-900'}`}>{item.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{item.msg}</p>
                        </div>
                        
                        {item.status !== 'ok' && (
                            <button 
                                onClick={() => handleScrollToField(item.id)}
                                className="self-start sm:self-center text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border transition-all bg-white border-slate-200 text-brand-600 hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                                Corrigir <ArrowRight className="w-3 h-3" />
                            </button>
                        )}
                      </div>

                      {/* Diagnostic Details */}
                      {item.status !== 'ok' && (
                          <div className="mt-3 bg-white border border-slate-100 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Esperado</span>
                                <span className="text-xs text-slate-700 font-medium">{item.expected}</span>
                             </div>
                             <div>
                                <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Status Atual</span>
                                <span className="text-xs text-slate-600 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 inline-block">{item.details}</span>
                             </div>
                          </div>
                      )}
                   </div>
                </div>
             ))}
        </div>
    </section>
  );
};
