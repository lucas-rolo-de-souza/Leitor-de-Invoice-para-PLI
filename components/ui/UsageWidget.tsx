import React, { useState, useEffect, useMemo } from 'react';
import { usageService, SessionStats, UsageLog } from '../../services/usageService';
import { currencyService } from '../../services/currencyService';
import { Activity, X, DollarSign, Clock, Zap, Server, History, Fingerprint, Trash2, Search, Filter } from 'lucide-react';

interface UsageWidgetProps {
    refreshTrigger: number; // Increment to force refresh
}

export const UsageWidget: React.FC<UsageWidgetProps> = ({ refreshTrigger }) => {
    // We default to "Current Session" stats
    const [stats, setStats] = useState<SessionStats>(usageService.getCurrentSessionStats());
    const [lifetimeStats, setLifetimeStats] = useState<SessionStats>(usageService.getLifetimeStats());
    
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
    const [searchTerm, setSearchTerm] = useState('');
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [brlRate, setBrlRate] = useState<number | null>(null);

    // Fetch stats and logs
    useEffect(() => {
        setStats(usageService.getCurrentSessionStats());
        setLifetimeStats(usageService.getLifetimeStats());
        setLogs(usageService.getLogs(viewMode));
    }, [refreshTrigger, isOpen, viewMode]);

    // Fetch Currency on Mount with Safety Catch
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const rate = await currencyService.getUSDtoBRLRate();
                if (rate) setBrlRate(rate);
            } catch (error) {
                console.warn("Failed to load currency rate in widget:", error);
            }
        };
        fetchRate();
    }, []);

    const handleClearHistory = () => {
        if (confirm('Tem certeza que deseja apagar todo o histórico de uso?')) {
            usageService.clear();
            setStats(usageService.getCurrentSessionStats());
            setLifetimeStats(usageService.getLifetimeStats());
            setLogs([]);
        }
    };

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        const lower = searchTerm.toLowerCase();
        return logs.filter(l => 
            l.model.toLowerCase().includes(lower) || 
            l.sessionId.toLowerCase().includes(lower)
        );
    }, [logs, searchTerm]);

    if (!stats) return null;

    // Footer Display (Always Current Session)
    const currentCost = stats.totalCost;
    const formattedCurrentBrl = (brlRate ? currentCost * brlRate : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Modal Display (Depends on View Mode)
    const activeStats = viewMode === 'current' ? stats : lifetimeStats;
    const activeCost = activeStats.totalCost;
    const activeBrl = brlRate ? activeCost * brlRate : 0;
    const formattedActiveBrl = activeBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 });

    return (
        <>
            {/* Footer Trigger Button - Shows Current Session Totals */}
            <button 
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 text-[10px] font-medium text-slate-400 hover:text-green-600 transition-colors px-3 py-1 rounded-full hover:bg-green-50 group border border-transparent hover:border-green-100"
                title={`Sessão Atual: ${stats.sessionId}\nCusto Estimado (BCB): ${formattedCurrentBrl}`}
            >
                <div className="bg-slate-100 group-hover:bg-green-100 p-1 rounded-full transition-colors">
                    <Activity className="w-3 h-3" /> 
                </div>
                <span className="font-mono">${currentCost.toFixed(4)}</span>
                <span className="opacity-30 mx-1">|</span>
                <span>{(stats.totalInputTokens + stats.totalOutputTokens).toLocaleString()} tokens</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/20">
                        
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl shadow-sm ring-1 ring-black/5">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                        Monitor de Consumo AI
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Rastreamento de custos e tokens Gemini
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Control Bar */}
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                            {/* View Toggle */}
                            <div className="flex bg-slate-200/60 p-1 rounded-lg w-full sm:w-auto">
                                <button 
                                    onClick={() => setViewMode('current')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm ${viewMode === 'current' ? 'bg-white text-brand-700 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}
                                >
                                    Sessão Atual
                                </button>
                                <button 
                                    onClick={() => setViewMode('all')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all shadow-sm ${viewMode === 'all' ? 'bg-white text-brand-700 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 shadow-none'}`}
                                >
                                    Histórico Completo
                                </button>
                            </div>

                             {/* Search & Actions */}
                             <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-initial">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar logs..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                                {viewMode === 'all' && (
                                    <button 
                                        onClick={handleClearHistory}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Limpar Histórico"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                             </div>
                        </div>

                        {/* Session ID Banner (Only Current) */}
                        {viewMode === 'current' && (
                            <div className="bg-brand-50/50 px-6 py-2 border-b border-brand-100 flex items-center justify-center sm:justify-start gap-2 text-[10px] text-brand-700 font-mono">
                                <Fingerprint className="w-3 h-3" />
                                <span className="opacity-70">SESSION ID:</span>
                                <span className="font-bold">{usageService.getSessionId()}</span>
                            </div>
                        )}

                        {/* Dashboard Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-b border-slate-100 shrink-0 bg-white">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-2 tracking-wider">
                                    <DollarSign className="w-3.5 h-3.5" /> Custo {viewMode === 'all' ? 'Total' : 'Sessão'}
                                </div>
                                <div className="text-2xl font-bold text-slate-800 tracking-tight">${activeCost.toFixed(5)}</div>
                                
                                {/* BRL Display */}
                                {brlRate && (
                                    <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                                        <div className="text-xs font-bold text-green-700">
                                            {formattedActiveBrl}
                                        </div>
                                        <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">PTAX</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-2 tracking-wider">
                                    <Zap className="w-3.5 h-3.5" /> Total Tokens
                                </div>
                                <div className="text-2xl font-bold text-slate-800">{(activeStats.totalInputTokens + activeStats.totalOutputTokens).toLocaleString()}</div>
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-[10px] font-mono text-slate-500">
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> In: {activeStats.totalInputTokens.toLocaleString()}</span>
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Out: {activeStats.totalOutputTokens.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-2 tracking-wider">
                                    <Clock className="w-3.5 h-3.5" /> Latência Média
                                </div>
                                <div className="text-2xl font-bold text-slate-800">{(activeStats.averageLatency / 1000).toFixed(2)}s</div>
                                <div className="mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400">Tempo de resposta da API</div>
                            </div>
                             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-200 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-2 tracking-wider">
                                    <Server className="w-3.5 h-3.5" /> Requisições
                                </div>
                                <div className="text-2xl font-bold text-slate-800">{activeStats.totalRequests}</div>
                                <div className="mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400">Chamadas realizadas</div>
                            </div>
                        </div>

                        {/* Logs List */}
                        <div className="overflow-y-auto custom-scrollbar p-0 flex-1 bg-slate-50/50">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 text-[10px] uppercase tracking-wider shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 bg-slate-50">Data/Hora</th>
                                        <th className="px-6 py-3 bg-slate-50">Modelo</th>
                                        <th className="px-6 py-3 text-right bg-slate-50">Tokens</th>
                                        <th className="px-6 py-3 text-right bg-slate-50">Tempo</th>
                                        <th className="px-6 py-3 text-right bg-slate-50">Custo (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                {searchTerm ? 'Nenhum log corresponde à busca.' : `Nenhum registro encontrado ${viewMode === 'current' ? 'nesta sessão' : 'no histórico'}.`}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-3 text-slate-600 whitespace-nowrap flex flex-col">
                                                    <span className="font-medium text-slate-700 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                    {viewMode === 'all' && <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-800">
                                                    <span className="bg-slate-100 group-hover:bg-white text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 uppercase tracking-wide">
                                                        {log.model.replace('gemini-', '').replace('-latest', '').replace('-preview', '')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right text-slate-600 font-mono text-xs">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <span title="Input" className="text-blue-600/70">{log.inputTokens}</span>
                                                        <span className="text-slate-300">/</span>
                                                        <span title="Output" className="text-purple-600/70">{log.outputTokens}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right text-slate-600 text-xs font-mono">
                                                    {(log.latencyMs / 1000).toFixed(2)}s
                                                </td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-700 font-mono text-xs">
                                                    ${log.cost.toFixed(5)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Persistent Storage Notice */}
                        <div className="bg-white p-2 border-t border-slate-200 text-center text-[10px] text-slate-400 shrink-0">
                             <span className="flex items-center justify-center gap-1"><History className="w-3 h-3" /> Armazenamento local (LocalStorage). Limpe o histórico para liberar espaço.</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};