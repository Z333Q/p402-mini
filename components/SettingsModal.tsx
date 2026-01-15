'use client';

import { useP402Store } from '@/lib/store';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const routingMode = useP402Store((s) => s.routingMode);
    const useCache = useP402Store((s) => s.useCache);
    const setRoutingMode = useP402Store((s) => s.setRoutingMode);
    const setUseCache = useP402Store((s) => s.setUseCache);

    if (!isOpen) return null;

    const modes: Array<{ id: typeof routingMode; label: string; desc: string }> = [
        { id: 'balanced', label: 'Balanced', desc: 'Optimal trade-off between cost and quality (Recommended).' },
        { id: 'cost', label: 'Cost Optimized', desc: 'Prioritize cheapest models and providers.' },
        { id: 'quality', label: 'Quality Focused', desc: 'Prioritize flagship models for complex tasks.' },
        { id: 'speed', label: 'High Speed', desc: 'Minimize latency for real-time applications.' },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-sm panel bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-neutral-900 bg-neutral-900 text-p402-primary">
                    <h2 className="text-lg font-black uppercase tracking-tight">V2 Protocol Settings</h2>
                    <button onClick={onClose} className="hover:text-white">✕</button>
                </div>

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

                    {/* Semantic Cache */}
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
                </div>

                <div className="p-4 bg-neutral-100 border-t-2 border-neutral-900">
                    <button
                        onClick={onClose}
                        className="w-full btn-primary py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        SAVE CONFIGURATION
                    </button>
                </div>
            </div>
        </div>
    );
}
