
import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { ValidatedInput } from '../../ui/FormElements';
import { SectionProps } from './types';

export const HeaderSection: React.FC<SectionProps> = ({ data, handleChange, errors, isReadOnly }) => {
    const dateInputRef = useRef<HTMLInputElement>(null);
    const dueDateInputRef = useRef<HTMLInputElement>(null);

    // Helper to programmatically open date picker on icon click
    const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
        if (!isReadOnly && ref.current && 'showPicker' in ref.current) {
            try {
                // @ts-ignore - showPicker is standard in modern browsers but TS might flag it
                ref.current.showPicker();
            } catch (e) {
                // Fallback: Focus triggers picker on mobile, but not always on desktop
                ref.current.focus();
            }
        }
    };

    return (
        <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Identificação do Documento</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                <ValidatedInput 
                    label="Fatura Comercial" 
                    id="invoiceNumber" 
                    value={data.invoiceNumber || ''} 
                    onChange={e => handleChange('invoiceNumber', e.target.value)} 
                    error={errors.invoiceNumber} 
                    isReadOnly={isReadOnly} 
                    placeholder="INV-0000" 
                    className="font-bold text-lg"
                />
                <ValidatedInput 
                    label="Packing List" 
                    id="packingListNumber" 
                    value={data.packingListNumber || ''} 
                    onChange={e => handleChange('packingListNumber', e.target.value)} 
                    error={errors.packingListNumber} 
                    isReadOnly={isReadOnly} 
                    placeholder="PL-0000" 
                />
                
                <div className="relative group">
                    <ValidatedInput 
                        label="Data Emissão"
                        id="date" 
                        ref={dateInputRef} 
                        type="date" 
                        value={data.date || ''} 
                        onChange={e => handleChange('date', e.target.value)} 
                        error={errors.date} 
                        isReadOnly={isReadOnly} 
                        className="pr-10" 
                    />
                    <div 
                        onClick={() => openDatePicker(dateInputRef)}
                        className={`absolute right-3 top-[34px] text-slate-400 transition-colors ${!isReadOnly ? 'cursor-pointer hover:text-brand-500' : 'pointer-events-none'}`}
                    >
                        <Calendar className="w-4 h-4" />
                    </div>
                </div>

                <div className="relative group">
                    <ValidatedInput 
                        label="Data Vencimento"
                        id="dueDate" 
                        ref={dueDateInputRef} 
                        type="date" 
                        value={data.dueDate || ''} 
                        onChange={e => handleChange('dueDate', e.target.value)} 
                        error={errors.dueDate} 
                        isReadOnly={isReadOnly} 
                        className="pr-10" 
                    />
                    <div 
                        onClick={() => openDatePicker(dueDateInputRef)}
                        className={`absolute right-3 top-[34px] text-slate-400 transition-colors ${!isReadOnly ? 'cursor-pointer hover:text-brand-500' : 'pointer-events-none'}`}
                    >
                        <Calendar className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </section>
    );
};
