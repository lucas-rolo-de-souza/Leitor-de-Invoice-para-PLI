
import React, { useState } from 'react';
import { Plus, Trash2, Database, Edit3, X, FileText, Settings, ShieldCheck, AlertTriangle, Package, Scale, DollarSign } from 'lucide-react';
import { InvoiceData, LineItem } from '../../../types';
import { ValidatedInput, ValidatedTextArea } from '../../ui/FormElements';
import { isFieldInvalid, isValidNCM } from '../../../utils/validators';
import { ncmService } from '../../../services/ncmService';
import { CalculatedTotals } from './types';

interface ItemsTableProps {
  data: InvoiceData;
  onLineItemChange: (index: number, field: keyof LineItem, value: string | number) => void;
  onNCMChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isReadOnly: boolean;
  calculatedTotals: CalculatedTotals;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({ data, onLineItemChange, onNCMChange, onAdd, onRemove, isReadOnly }) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleEdit = (index: number) => {
        setEditingIndex(index);
    };

    const handleCloseModal = () => {
        setEditingIndex(null);
    };

    const isNumeric = (v: any) => {
       if (v === null || v === undefined || v === '') return false;
       const n = Number(v.toString().replace(',', '.'));
       return !isNaN(n);
    };

    return (
        <section className="flex flex-col relative" id="items-section">
            <div className="flex justify-between items-center mb-6">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Itens da Fatura</h4>
                 <button 
                    onClick={onAdd} 
                    disabled={isReadOnly} 
                    className={`text-[10px] uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${isReadOnly ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                    <Plus className="w-3 h-3" /> Adicionar
                </button>
            </div>
            
            {/* --- DESKTOP TABLE --- */}
            <div className="hidden lg:block overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left min-w-[1500px]">
                <thead className="text-slate-500 font-bold bg-slate-50 border-b border-slate-200 sticky top-0 z-10 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">#</th>
                    <th className="px-3 py-3 w-28">Part Number *</th>
                    <th className="px-3 py-3 w-28">Cód. Prod. *</th>
                    <th className="px-3 py-3 min-w-[200px]">Descrição Técnica *</th>
                    <th className="px-3 py-3 w-32">NCM *</th>
                    <th className="px-3 py-3 w-28">Detalhe *</th>
                    <th className="px-3 py-3 w-20 text-right">Qtd *</th>
                    <th className="px-3 py-3 w-16 text-center">Und *</th>
                    <th className="px-3 py-3 w-24 text-right">Unit ($) *</th>
                    <th className="px-3 py-3 w-28 text-right">Total ($)</th>
                    <th className="px-3 py-3 w-24 text-right">Peso Unit. Líq.</th>
                    <th className="px-3 py-3 w-24 text-right">Peso Líq. Total *</th>
                    <th className="px-3 py-3 w-20 text-center">Ações</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(data.lineItems || []).map((item, index) => {
                     const isNCMValid = isValidNCM(item.ncm);
                     const ncmDesc = ncmService.getDescription(item.ncm);
                     
                     // Comprehensive Check for SCUD Mandatory Fields & Constraints
                     const missingMandatory = 
                        isFieldInvalid(item.partNumber) || 
                        isFieldInvalid(item.productCode) || 
                        isFieldInvalid(item.description) || 
                        !isNCMValid || 
                        
                        // Strict SCUD Checks
                        !item.productDetail || item.productDetail.length > 4 ||
                        !item.manufacturerCode || !isNumeric(item.manufacturerCode) ||
                        !item.manufacturerRef || 
                        // Removed Manufacturer Country Check as it's now cleared
                        
                        !isNumeric(item.netWeight) ||
                        !isNumeric(item.quantity) ||
                        !isNumeric(item.unitPrice) ||
                        isFieldInvalid(item.unitMeasure);

                     return (
                        <tr key={index} className={`group transition-colors ${missingMandatory && !isReadOnly ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-3 py-2 text-center text-slate-300 font-mono">{index + 1}</td>
                          <td className="px-2 py-2"><ValidatedInput minimal value={item.partNumber || ''} onChange={e => onLineItemChange(index, 'partNumber', e.target.value)} error={isFieldInvalid(item.partNumber) ? '!' : null} isReadOnly={isReadOnly} placeholder="PN..." /></td>
                          <td className="px-2 py-2"><ValidatedInput minimal value={item.productCode || ''} onChange={e => onLineItemChange(index, 'productCode', e.target.value)} error={isFieldInvalid(item.productCode) ? '!' : null} isReadOnly={isReadOnly} placeholder="Código..." /></td>
                          <td className="px-2 py-2"><ValidatedInput minimal value={item.description} onChange={e => onLineItemChange(index, 'description', e.target.value)} error={isFieldInvalid(item.description) || (item.description?.length || 0) > 254 ? '!' : null} isReadOnly={isReadOnly} placeholder="Descrição..." /></td>
                          
                          {/* NCM Cell */}
                          <td className="px-2 py-2">
                             <div className="relative">
                                <ValidatedInput minimal value={item.ncm || ''} onChange={e => onNCMChange(index, e.target.value)} error={!isNCMValid ? '!' : null} isReadOnly={isReadOnly} placeholder="0000.00.00" className={`font-mono ${ncmDesc ? 'text-green-600 font-medium' : ''}`} />
                                {ncmDesc && isNCMValid && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none"><Database className="w-3 h-3" /></div>}
                             </div>
                          </td>

                          <td className="px-2 py-2"><ValidatedInput minimal value={item.productDetail || ''} onChange={e => onLineItemChange(index, 'productDetail', e.target.value)} error={!item.productDetail || item.productDetail.length > 4 ? '!' : null} isReadOnly={isReadOnly} placeholder="Detalhe..." /></td>
                          
                          <td className="px-2 py-2"><ValidatedInput minimal type="number" step="any" value={item.quantity || ''} onChange={e => onLineItemChange(index, 'quantity', e.target.value)} error={!isNumeric(item.quantity) ? '!' : null} isReadOnly={isReadOnly} placeholder="0" className="text-right" /></td>
                          <td className="px-2 py-2"><ValidatedInput minimal value={item.unitMeasure || ''} onChange={e => onLineItemChange(index, 'unitMeasure', e.target.value)} error={isFieldInvalid(item.unitMeasure) ? '!' : null} isReadOnly={isReadOnly} placeholder="UN" className="text-center uppercase" /></td>
                          <td className="px-2 py-2"><ValidatedInput minimal type="number" step="any" value={item.unitPrice || ''} onChange={e => onLineItemChange(index, 'unitPrice', e.target.value)} error={!isNumeric(item.unitPrice) ? '!' : null} isReadOnly={isReadOnly} placeholder="0.00" className="text-right" /></td>
                          
                          {/* Total (Calculated) */}
                          <td className="px-3 py-2 text-right">
                             <span className={`font-mono font-medium ${!item.total ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.total ? Number(item.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                             </span>
                          </td>

                          {/* Unit Net Weight */}
                          <td className="px-2 py-2"><ValidatedInput minimal type="number" step="any" value={item.unitNetWeight || ''} onChange={e => onLineItemChange(index, 'unitNetWeight', e.target.value)} isReadOnly={isReadOnly} placeholder="0.0000" className="text-right" /></td>

                          {/* Total Net Weight (Calculated) */}
                          <td className="px-2 py-2"><ValidatedInput minimal type="number" step="any" value={item.netWeight || ''} onChange={e => onLineItemChange(index, 'netWeight', e.target.value)} error={!isNumeric(item.netWeight) ? '!' : null} isReadOnly={isReadOnly} placeholder="0.0000" className="text-right font-medium text-slate-800" /></td>
                          
                          {/* Detail Button */}
                          <td className="px-2 py-2 text-center">
                              <button 
                                onClick={() => handleEdit(index)}
                                className={`p-1.5 rounded-md transition-all relative ${missingMandatory && !isReadOnly ? 'text-red-600 bg-red-100 hover:bg-red-200 ring-2 ring-red-200 ring-offset-1' : 'text-brand-600 bg-brand-50 hover:bg-brand-100'}`}
                                title={missingMandatory ? "Existem campos obrigatórios ou erros de formato. Clique para editar." : "Editar Detalhes"}
                              >
                                  {missingMandatory && !isReadOnly ? <AlertTriangle className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                              </button>
                          </td>

                          <td className="px-2 py-2 text-center">
                            <button onClick={() => onRemove(index)} disabled={isReadOnly} className={`p-1.5 rounded-md transition-all ${isReadOnly ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                     );
                  })}
                  {(!data.lineItems || data.lineItems.length === 0) && (
                    <tr><td colSpan={14} className="px-4 py-16 text-center text-slate-400"><p className="italic">Lista vazia</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- MOBILE CARD VIEW --- */}
            <div className="lg:hidden space-y-4">
                 {(data.lineItems || []).map((item, index) => {
                     const isNCMValid = isValidNCM(item.ncm);
                     const missingMandatory = 
                        isFieldInvalid(item.partNumber) || 
                        isFieldInvalid(item.productCode) || 
                        isFieldInvalid(item.description) || 
                        !isNCMValid || 
                        !item.productDetail || item.productDetail.length > 4 ||
                        !item.manufacturerCode || !isNumeric(item.manufacturerCode) ||
                        !item.manufacturerRef || 
                        !isNumeric(item.netWeight);
                     
                     return (
                         <div key={index} className={`rounded-xl border p-4 relative transition-colors ${missingMandatory ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                             <div className="flex justify-between items-start mb-3">
                                 <div className="flex-1 pr-4">
                                     <div className="font-bold text-sm text-slate-800 mb-1 line-clamp-2">{item.description || 'Sem Descrição'}</div>
                                     <div className="flex flex-wrap gap-2 text-xs text-slate-500 font-mono">
                                         <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">PN: {item.partNumber || '-'}</span>
                                         <span className={`bg-white px-1.5 py-0.5 rounded border ${isNCMValid ? 'border-green-200 text-green-700' : 'border-red-200 text-red-600'}`}>NCM: {item.ncm || '-'}</span>
                                     </div>
                                     <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                         <div>
                                            <span className="text-slate-400 text-[10px] uppercase font-bold">Peso Unit. Líq.</span>
                                            <ValidatedInput minimal type="number" value={item.unitNetWeight || ''} onChange={e => onLineItemChange(index, 'unitNetWeight', e.target.value)} isReadOnly={isReadOnly} placeholder="0.00" className="text-right" />
                                         </div>
                                         <div>
                                            <span className="text-slate-400 text-[10px] uppercase font-bold">Total Líquido</span>
                                            <ValidatedInput minimal type="number" value={item.netWeight || ''} onChange={e => onLineItemChange(index, 'netWeight', e.target.value)} isReadOnly={isReadOnly} placeholder="0.00" className="text-right" />
                                         </div>
                                     </div>
                                     {missingMandatory && (
                                         <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-600">
                                             <AlertTriangle className="w-3 h-3" /> Erros de Conformidade
                                         </div>
                                     )}
                                 </div>
                                 <div className="flex flex-col gap-2">
                                    <button onClick={() => onRemove(index)} disabled={isReadOnly} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleEdit(index)} className={`p-1.5 rounded transition-colors ${missingMandatory ? 'text-red-500 bg-red-100 ring-1 ring-red-200' : 'text-brand-400 hover:text-brand-600 bg-white shadow-sm'}`}>
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                 </div>
                             </div>
                         </div>
                     );
                 })}
            </div>

            {/* --- DETAILS MODAL --- */}
            {editingIndex !== null && data.lineItems && data.lineItems[editingIndex] && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-brand-600" /> 
                                    Editor de Item #{editingIndex + 1}
                                </h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{data.lineItems[editingIndex].partNumber}</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-8">
                                
                                {/* 0. General Data (Added to ensure completeness in Modal View) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                        <Package className="w-3.5 h-3.5" /> Dados Principais
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <ValidatedInput label="Part Number *" value={data.lineItems[editingIndex].partNumber || ''} onChange={e => onLineItemChange(editingIndex, 'partNumber', e.target.value)} error={isFieldInvalid(data.lineItems[editingIndex].partNumber) ? 'Obrigatório' : null} isReadOnly={isReadOnly} />
                                        <ValidatedInput label="Cód. Produto *" value={data.lineItems[editingIndex].productCode || ''} onChange={e => onLineItemChange(editingIndex, 'productCode', e.target.value)} error={!data.lineItems[editingIndex].productCode ? 'Texto Obrigatório' : null} isReadOnly={isReadOnly} />
                                        <ValidatedInput label="NCM *" value={data.lineItems[editingIndex].ncm || ''} onChange={e => onNCMChange(editingIndex, e.target.value)} error={!isValidNCM(data.lineItems[editingIndex].ncm) ? 'Inválido' : null} isReadOnly={isReadOnly} />
                                        <div className="col-span-full">
                                            <ValidatedInput label="Descrição Técnica *" value={data.lineItems[editingIndex].description || ''} onChange={e => onLineItemChange(editingIndex, 'description', e.target.value)} error={isFieldInvalid(data.lineItems[editingIndex].description) || (data.lineItems[editingIndex].description?.length || 0) > 254 ? 'Max 254 chars' : null} isReadOnly={isReadOnly} />
                                        </div>
                                        <ValidatedInput label="Detalhe Produto *" value={data.lineItems[editingIndex].productDetail || ''} onChange={e => onLineItemChange(editingIndex, 'productDetail', e.target.value)} error={!data.lineItems[editingIndex].productDetail || data.lineItems[editingIndex].productDetail.length > 4 ? 'Max 4 chars' : null} isReadOnly={isReadOnly} />
                                    </div>
                                </div>

                                {/* 0.1 Quantitatives */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                        <Scale className="w-3.5 h-3.5" /> Quantitativos e Valores
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <ValidatedInput label="Quantidade *" type="number" step="any" value={data.lineItems[editingIndex].quantity || ''} onChange={e => onLineItemChange(editingIndex, 'quantity', e.target.value)} error={!isNumeric(data.lineItems[editingIndex].quantity) ? 'Numérico' : null} isReadOnly={isReadOnly} className="text-right" />
                                        <ValidatedInput label="Unidade *" value={data.lineItems[editingIndex].unitMeasure || ''} onChange={e => onLineItemChange(editingIndex, 'unitMeasure', e.target.value)} error={isFieldInvalid(data.lineItems[editingIndex].unitMeasure) ? 'Erro' : null} isReadOnly={isReadOnly} className="text-center uppercase" />
                                        <ValidatedInput label="Valor Unit. *" type="number" step="any" value={data.lineItems[editingIndex].unitPrice || ''} onChange={e => onLineItemChange(editingIndex, 'unitPrice', e.target.value)} error={!isNumeric(data.lineItems[editingIndex].unitPrice) ? 'Numérico' : null} isReadOnly={isReadOnly} className="text-right" />
                                        <ValidatedInput label="Peso Unit. Líq." type="number" step="any" value={data.lineItems[editingIndex].unitNetWeight || ''} onChange={e => onLineItemChange(editingIndex, 'unitNetWeight', e.target.value)} isReadOnly={isReadOnly} className="text-right" />
                                        <ValidatedInput label="Peso Líq. Total *" type="number" step="any" value={data.lineItems[editingIndex].netWeight || ''} onChange={e => onLineItemChange(editingIndex, 'netWeight', e.target.value)} error={!isNumeric(data.lineItems[editingIndex].netWeight) ? 'Numérico' : null} isReadOnly={isReadOnly} className="text-right" />
                                    </div>
                                </div>

                                {/* 1. Manufacturer Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                        <Settings className="w-3.5 h-3.5" /> Dados do Fabricante (Mandatório)
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <ValidatedInput label="Código Fabricante *" value={data.lineItems[editingIndex].manufacturerCode || ''} onChange={e => onLineItemChange(editingIndex, 'manufacturerCode', e.target.value)} error={!data.lineItems[editingIndex].manufacturerCode || !isNumeric(data.lineItems[editingIndex].manufacturerCode) ? 'Numérico Obrigatório' : null} isReadOnly={isReadOnly} />
                                        <ValidatedInput label="Ref. Fabricante *" value={data.lineItems[editingIndex].manufacturerRef || ''} onChange={e => onLineItemChange(editingIndex, 'manufacturerRef', e.target.value)} error={isFieldInvalid(data.lineItems[editingIndex].manufacturerRef) ? 'Obrigatório' : null} isReadOnly={isReadOnly} />
                                        <ValidatedInput label="Matéria Prima" value={data.lineItems[editingIndex].material || ''} onChange={e => onLineItemChange(editingIndex, 'material', e.target.value)} isReadOnly={isReadOnly} />
                                        <ValidatedInput label="País Fabricante" value={data.lineItems[editingIndex].manufacturerCountry || ''} onChange={e => onLineItemChange(editingIndex, 'manufacturerCountry', e.target.value)} isReadOnly={isReadOnly} />
                                    </div>
                                </div>

                                {/* 2. Regulatory Acts */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Atos Legais (Regulatório)
                                    </div>
                                    
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                        <span className="text-xs font-bold text-brand-600">Ato Legal 1</span>
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                            <ValidatedInput minimal label="Tipo" value={data.lineItems[editingIndex].legalAct1Type || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct1Type', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Emissor" value={data.lineItems[editingIndex].legalAct1Issuer || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct1Issuer', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Número" value={data.lineItems[editingIndex].legalAct1Number || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct1Number', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Ano" value={data.lineItems[editingIndex].legalAct1Year || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct1Year', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Ex" value={data.lineItems[editingIndex].legalAct1Ex || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct1Ex', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Alíquota (%)" value={data.lineItems[editingIndex].legalAct1Rate || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct1Rate', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                        <span className="text-xs font-bold text-slate-600">Ato Legal 2</span>
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                            <ValidatedInput minimal label="Tipo" value={data.lineItems[editingIndex].legalAct2Type || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct2Type', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Emissor" value={data.lineItems[editingIndex].legalAct2Issuer || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct2Issuer', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Número" value={data.lineItems[editingIndex].legalAct2Number || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct2Number', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Ano" value={data.lineItems[editingIndex].legalAct2Year || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct2Year', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Ex" value={data.lineItems[editingIndex].legalAct2Ex || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct2Ex', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Alíquota (%)" value={data.lineItems[editingIndex].legalAct2Rate || ''} onChange={e => onLineItemChange(editingIndex, 'legalAct2Rate', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Attributes Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                        <Database className="w-3.5 h-3.5" /> Atributos e Especificações
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Atributo 1</span>
                                            <ValidatedInput minimal label="Nível" value={data.lineItems[editingIndex].attr1Level || ''} onChange={e => onLineItemChange(editingIndex, 'attr1Level', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Atributo" value={data.lineItems[editingIndex].attr1Name || ''} onChange={e => onLineItemChange(editingIndex, 'attr1Name', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Especificação" value={data.lineItems[editingIndex].attr1Value || ''} onChange={e => onLineItemChange(editingIndex, 'attr1Value', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Atributo 2</span>
                                            <ValidatedInput minimal label="Nível" value={data.lineItems[editingIndex].attr2Level || ''} onChange={e => onLineItemChange(editingIndex, 'attr2Level', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Atributo" value={data.lineItems[editingIndex].attr2Name || ''} onChange={e => onLineItemChange(editingIndex, 'attr2Name', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Especificação" value={data.lineItems[editingIndex].attr2Value || ''} onChange={e => onLineItemChange(editingIndex, 'attr2Value', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Atributo 3</span>
                                            <ValidatedInput minimal label="Nível" value={data.lineItems[editingIndex].attr3Level || ''} onChange={e => onLineItemChange(editingIndex, 'attr3Level', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Atributo" value={data.lineItems[editingIndex].attr3Name || ''} onChange={e => onLineItemChange(editingIndex, 'attr3Name', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                            <ValidatedInput minimal label="Especificação" value={data.lineItems[editingIndex].attr3Value || ''} onChange={e => onLineItemChange(editingIndex, 'attr3Value', e.target.value)} isReadOnly={isReadOnly} className="bg-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                         <ValidatedTextArea label="Nota Complementar" value={data.lineItems[editingIndex].complementaryNote || ''} onChange={e => onLineItemChange(editingIndex, 'complementaryNote', e.target.value)} isReadOnly={isReadOnly} />
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={handleCloseModal} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                                Concluir Edição
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
