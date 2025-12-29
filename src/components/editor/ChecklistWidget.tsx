import React, { useState } from 'react';
import { ScrollText, ChevronUp, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface ChecklistItem {
    id: string;
    title: string;
    status: string;
    msg: string;
    expected: string;
    details: string;
}

interface ChecklistWidgetProps {
    checklist: ChecklistItem[];
    compliancePercentage: number;
}

export const ChecklistWidget: React.FC<ChecklistWidgetProps> = ({ checklist, compliancePercentage }) => {
  const [showChecklist, setShowChecklist] = useState(false);

  // Scroll to the specific input field based on the checklist ID
  const handleScrollToField = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent toggling the checklist
    
    // Map checklist IDs to DOM element IDs
    const fieldMap: Record<string, string> = {
        'exporter': 'exporterName',
        'importer': 'importerName',
        'spec': 'lineItems', // Just scroll to table
        'ncm': 'lineItems',
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
            element.focus();
            // Optional: Highlight effect
            element.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2');
            setTimeout(() => element.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2'), 2000);
        }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowChecklist(!showChecklist)}
          className="w-full bg-slate-50/50 hover:bg-slate-50 transition-colors px-5 py-4 flex items-center justify-between group"
        >
           <div className="flex-1 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                 <div className={`p-2 rounded-lg ${compliancePercentage === 100 ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-600'}`}>
                    <ScrollText className="w-5 h-5" />
                 </div>
                 <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-800">Checklist de Conformidade (Art. 557 do Regulamento Aduaneiro)</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                       <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className={`h-full rounded-full transition-all duration-700 ease-out ${compliancePercentage === 100 ? 'bg-green-500' : 'bg-brand-500'}`} style={{ width: `${compliancePercentage}%` }}></div>
                       </div>
                       <span className="text-xs text-slate-500 font-medium">{compliancePercentage}% Conforme</span>
                    </div>
                 </div>
              </div>
              <ChevronUp className={`w-5 h-5 text-slate-400 transition-transform duration-300 mr-4 ${showChecklist ? '' : 'rotate-180'}`} />
           </div>
        </button>
        
        {/* Detailed Checklist View */}
        {showChecklist && (
          <div className="p-0 divide-y divide-slate-100 bg-white border-t border-slate-100 animate-in slide-in-from-top-2">
             {checklist.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors group/item">
                   <div className={`mt-1 rounded-full p-1.5 border flex-shrink-0 ${
                       item.status === 'ok' ? 'bg-green-100 border-green-200 text-green-600' : 
                       item.status === 'missing' ? 'bg-red-100 border-red-200 text-red-600' : 'bg-amber-100 border-amber-200 text-amber-600'
                   }`}>
                      {item.status === 'ok' ? <Check className="w-4 h-4" /> : item.status === 'missing' ? <X className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                   </div>
                   <div className="flex-1 w-full">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-bold ${item.status === 'ok' ? 'text-slate-700' : 'text-slate-800'}`}>{item.title}</h4>
                        <div className="flex items-center gap-2">
                            {item.status !== 'ok' && (
                                <button 
                                    onClick={(e) => handleScrollToField(e, item.id)}
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity bg-slate-100 hover:bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-slate-200 hover:border-brand-200"
                                >
                                    Corrigir <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.status === 'ok' ? 'bg-green-50 text-green-600 border border-green-100' : 
                            item.status === 'missing' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                                {item.status === 'ok' ? 'Conforme' : item.status === 'missing' ? 'Ausente' : 'Atenção'}
                            </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mt-1">{item.msg}</p>
                      
                      {item.status !== 'ok' && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                             <div>
                                <span className="font-bold text-slate-500 block mb-0.5">O que falta/correção:</span>
                                <span className="text-slate-700">{item.expected}</span>
                             </div>
                             <div>
                                <span className="font-bold text-slate-500 block mb-0.5">Detalhes Atuais:</span>
                                <span className="font-mono text-slate-600">{item.details}</span>
                             </div>
                          </div>
                      )}
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
  );
};