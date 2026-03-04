'use client';

import { useState, useEffect } from 'react';
import { useP402Store } from '@/lib/store';
import { p402 } from '@/lib/p402-client';
import type { CacheStats, Mandate } from '@/lib/types';
import { useToastStore } from '@/lib/toast-store';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const routingMode = useP402Store((s) => s.routingMode);
    const useCache = useP402Store((s) => s.useCache);
    const setRoutingMode = useP402Store((s) => s.setRoutingMode);
    const setUseCache = useP402Store((s) => s.setUseCache);
    const disconnect = useP402Store((s) => s.disconnect);

    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
    const [cacheStatsError, setCacheStatsError] = useState(false);
    const [clearResult, setClearResult] = useState<string | null>(null);
    const [clearing, setClearing] = useState(false);

    const [mandates, setMandates] = useState<Mandate[]>([]);
    const [mandatesError, setMandatesError] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Reset clear result on open
        setClearResult(null);

        p402.getCacheStats()
            .then(setCacheStats)
            .catch(() => setCacheStatsError(true));

        p402.getMandates()
            .then((res) => setMandates(res.data || []))
            .catch(() => setMandatesError(true));
    }, [isOpen]);

    const handleClearCache = async () => {
        setClearing(true);
        try {
            const res = await p402.clearCache();
            setClearResult(`Cleared ${res.cleared} entries`);
            // Refresh stats
            const stats = await p402.getCacheStats().catch(() => null);
            if (stats) setCacheStats(stats);
        } catch {
            setClearResult('Clear failed');
        } finally {
            setClearing(false);
        }
    };

    if (!isOpen) return null;

    const modes: Array<{ id: typeof routingMode; label: string; desc: string }> = [
        { id: 'balanced', label: 'Balanced', desc: 'Optimal trade-off between cost and quality (Recommended).' },
        { id: 'cost', label: 'Cost Optimized', desc: 'Prioritize cheapest models and providers.' },
        { id: 'quality', label: 'Quality Focused', desc: 'Prioritize flagship models for complex tasks.' },
        { id: 'speed', label: 'High Speed', desc: 'Minimize latency for real-time applications.' },
    ];

    const activeMandates = mandates.filter((m) => m.status === 'active');

    return (
        <div className="fixed inset-0 z-50 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-sm panel bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-neutral-900 bg-neutral-900 text-p402-primary flex-shrink-0">
                    <h2 className="text-lg font-black uppercase tracking-tight">Settings</h2>
                    <button onClick={onClose} className="hover:text-white">✕</button>
                </div>

                <div className="overflow-y-auto flex-1">
                    <div className="p-6 space-y-8">
                        {/* Routing Mode */}
                        <div>
                            <label className="block text-xs font-black uppercase text-neutral-400 mb-4 tracking-wider">Orchestration Mode</label>
                            <div className="space-y-3">
                                {modes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setRoutingMode(mode.id)}
                                        className={`w-full text-left p-3 border-2 transition-all ${routingMode === mode.id
                                                ? 'bg-p402-primary/10 border-p402-primary shadow-[4px_4px_0px_0px_rgba(182,255,46,1)]'
                                                : 'bg-white border-neutral-200 hover:border-neutral-900'
                                            }`}
                                    >
                                        <div className="font-bold text-sm uppercase text-neutral-900">{mode.label}</div>
                                        <div className="text-[10px] font-mono text-neutral-500 mt-0.5">{mode.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Semantic Cache Toggle */}
                        <div className="flex items-center justify-between p-4 bg-neutral-50 border-2 border-neutral-900">
                            <div>
                                <div className="font-bold text-sm uppercase text-neutral-900">Semantic Caching</div>
                                <div className="text-[10px] font-mono text-neutral-500">Reduce costs by reusing results</div>
                            </div>
                            <button
                                onClick={() => setUseCache(!useCache)}
                                className={`w-12 h-6 border-2 border-neutral-900 relative transition-colors ${useCache ? 'bg-p402-primary' : 'bg-neutral-300'
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-neutral-900 transition-all ${useCache ? 'right-0.5' : 'left-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Cache Stats */}
                        <div className="border-t-2 border-neutral-200 pt-6">
                            <label className="block text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider">Cache Stats</label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="bg-neutral-50 border-2 border-neutral-200 p-2 text-center">
                                    <div className="text-[9px] font-black uppercase text-neutral-400">HIT RATE</div>
                                    <div className="font-mono font-bold text-sm text-neutral-900 mt-0.5">
                                        {cacheStats && !cacheStatsError
                                            ? `${(cacheStats.hitRate * 100).toFixed(0)}%`
                                            : '—'}
                                    </div>
                                </div>
                                <div className="bg-neutral-50 border-2 border-neutral-200 p-2 text-center">
                                    <div className="text-[9px] font-black uppercase text-neutral-400">ENTRIES</div>
                                    <div className="font-mono font-bold text-sm text-neutral-900 mt-0.5">
                                        {cacheStats && !cacheStatsError ? cacheStats.totalEntries : '—'}
                                    </div>
                                </div>
                                <div className="bg-neutral-50 border-2 border-neutral-200 p-2 text-center">
                                    <div className="text-[9px] font-black uppercase text-neutral-400">EST. SAVINGS</div>
                                    <div className="font-mono font-bold text-sm text-neutral-900 mt-0.5">
                                        {cacheStats && !cacheStatsError
                                            ? `$${cacheStats.estimatedSavings.toFixed(3)}`
                                            : '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleClearCache}
                                    disabled={clearing}
                                    className="px-3 py-1.5 text-[10px] font-black uppercase border-2 border-neutral-900
                                               bg-white hover:bg-neutral-100 disabled:opacity-50 transition-colors
                                               shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5"
                                >
                                    {clearing ? 'CLEARING...' : 'CLEAR CACHE'}
                                </button>
                                {clearResult && (
                                    <span className="text-[10px] font-mono text-neutral-500">{clearResult}</span>
                                )}
                            </div>
                        </div>

                        {/* Mandates */}
                        <div className="border-t-2 border-neutral-200 pt-6">
                            <label className="block text-xs font-black uppercase text-neutral-400 mb-3 tracking-wider">
                                Active Mandates
                            </label>

                            {mandatesError ? (
                                <p className="text-[10px] font-mono text-neutral-400">—</p>
                            ) : activeMandates.length === 0 ? (
                                <p className="text-[10px] font-mono text-neutral-400 border-2 border-dashed border-neutral-200 p-3 text-center">
                                    No active mandates
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {activeMandates.map((mandate) => {
                                        const progress = mandate.constraints.max_amount_usd > 0
                                            ? Math.min(mandate.amount_spent_usd / mandate.constraints.max_amount_usd, 1)
                                            : 0;
                                        const expiresAt = new Date(mandate.constraints.expires_at);
                                        const now = new Date();
                                        const diffMs = expiresAt.getTime() - now.getTime();
                                        const diffDays = Math.floor(diffMs / 86400000);
                                        const expiresLabel = diffDays > 0
                                            ? `${diffDays}d`
                                            : diffMs > 0 ? '<1d' : 'expired';

                                        return (
                                            <div key={mandate.id} className="border-2 border-neutral-200 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-neutral-600 truncate max-w-[140px]">
                                                        {mandate.agent_did.length > 20
                                                            ? `${mandate.agent_did.slice(0, 10)}…${mandate.agent_did.slice(-8)}`
                                                            : mandate.agent_did}
                                                    </span>
                                                    <span className="text-[9px] font-mono text-neutral-400">exp {expiresLabel}</span>
                                                </div>
                                                <div className="h-1.5 bg-neutral-200 border border-neutral-300">
                                                    <div
                                                        className="h-full bg-p402-primary transition-all"
                                                        style={{ width: `${progress * 100}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[9px] font-mono text-neutral-400">
                                                    <span>${mandate.amount_spent_usd.toFixed(3)} spent</span>
                                                    <span>/ ${mandate.constraints.max_amount_usd.toFixed(2)} max</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-neutral-100 border-t-2 border-neutral-900 flex-shrink-0 space-y-2">
                    <button
                        onClick={onClose}
                        className="w-full btn-primary py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        DONE
                    </button>
                    <button
                        onClick={() => {
                            disconnect();
                            useToastStore.getState().addToast({ type: 'info', title: 'Disconnected' });
                            onClose();
                        }}
                        className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400
                                   hover:text-neutral-900 hover:bg-neutral-200 transition-colors border border-neutral-200"
                    >
                        Disconnect Wallet
                    </button>
                </div>
            </div>
        </div>
    );
}
