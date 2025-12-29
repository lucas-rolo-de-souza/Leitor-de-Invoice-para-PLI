
import React, { useState } from 'react';
import { Layers, Package, ChevronRight, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { InvoiceData } from '../../../types';
import { isValidNCM } from '../../../utils/validators';
import { ncmService } from '../../../services/ncmService';

interface NcmSummaryProps {
    data: InvoiceData;
}

export const NcmSummarySection: React.FC<NcmSummaryProps> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Extract Unique and VALID NCMs
    const uniqueNcms: string[] = Array.from(new Set(
        (data.lineItems || [])
            .map(item => item.ncm)
            .filter((ncm): ncm is string => typeof ncm === 'string' && isValidNCM(ncm))
    ));

    if (uniqueNcms.length === 0) return null;

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full transition-all duration-200">
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
            >
                <div className="bg-white p-1.5 rounded-md border border-slate-200 shadow-sm group-hover:border-brand-200 transition-colors">
                    <Layers className="w-4 h-4 text-brand-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex-1">
                    Classificação Fiscal (NCMs)
                </h3>
                
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">
                        {uniqueNcms.length} Códigos Únicos
                    </span>
                    <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    {uniqueNcms.map((ncmCode, idx) => {
                        const hierarchy = ncmService.getHierarchy(ncmCode);
                        // Handle 9999.99.99 format manually if needed, or rely on service clean logic
                        const clean = ncmCode.replace(/\D/g, '');
                        const formattedCode = `${clean.slice(0,4)}.${clean.slice(4,6)}.${clean.slice(6,8)}`;
                        
                        return (
                            <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="bg-brand-50 text-brand-700 font-mono font-bold text-lg px-3 py-1 rounded border border-brand-100">
                                            {formattedCode}
                                        </div>
                                        <div className="bg-slate-100 p-1.5 rounded-full"><Package className="w-4 h-4 text-slate-400" /></div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {hierarchy.length > 0 ? (
                                            hierarchy.map((item, hIdx) => (
                                                <div key={hIdx} className="flex items-start gap-2 text-sm">
                                                    <ChevronRight className={`w-3.5 h-3.5 text-slate-300 mt-1 shrink-0 ${hIdx === hierarchy.length - 1 ? 'text-brand-500' : ''}`} />
                                                    <div className="leading-tight">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">{item.level}:</span>
                                                        <span className={`text-slate-700 text-xs ${hIdx === hierarchy.length - 1 ? 'font-bold' : ''}`}>
                                                            {item.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                <AlertTriangle className="w-5 h-5" />
                                                <span className="text-sm font-medium">Descrição não encontrada.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
