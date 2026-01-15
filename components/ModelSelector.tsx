'use client';

import { useState, useMemo } from 'react';
import { useP402Store, useProviders, useSelectedModel } from '@/lib/store';
import { MODEL_TIERS } from '@/lib/types';
import { formatCost } from '@/lib/p402-client';

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelSelector({ isOpen, onClose }: ModelSelectorProps) {
  const providers = useProviders();
  const selectedModel = useSelectedModel();
  const selectModel = useP402Store((s) => s.selectModel);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Flatten all models from providers
  const allModels = useMemo(() => {
    return providers.flatMap((p) =>
      p.models.map((m) => ({
        ...m,
        providerName: p.name,
        providerStatus: p.status,
        fullId: `${p.id}/${m.id}`,
      }))
    );
  }, [providers]);

  // Filter models
  const filteredModels = useMemo(() => {
    return allModels.filter((m) => {
      const matchesFilter = filter === 'all' || m.tier === filter;
      const matchesSearch =
        search === '' ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.providerName.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allModels, filter, search]);

  // Group by tier
  const groupedModels = useMemo(() => {
    const groups: Record<string, typeof filteredModels> = {};
    filteredModels.forEach((m) => {
      if (!groups[m.tier]) groups[m.tier] = [];
      groups[m.tier].push(m);
    });
    return groups;
  }, [filteredModels]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/90 backdrop-blur-sm flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-neutral-900 bg-white">
        <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Select Model</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center bg-white border-2 border-neutral-900 
                     hover:bg-neutral-100 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b-2 border-neutral-900 bg-neutral-50 space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="SEARCH MODELS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 bg-white border-2 border-neutral-900 px-3 py-2 text-sm font-mono
                     focus:border-p402-info focus:outline-none"
        />

        {/* Tier Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'flagship', 'balanced', 'efficient', 'budget'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilter(tier)}
              className={`px-3 py-1 text-[10px] font-bold uppercase whitespace-nowrap border-2 
                         transition-all ${filter === tier
                  ? 'bg-neutral-900 text-p402-primary border-neutral-900 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]'
                  : 'bg-white text-neutral-500 border-neutral-300 hover:border-neutral-900 hover:text-neutral-900'
                }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Model List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {Object.entries(groupedModels).map(([tier, models]) => (
          <div key={tier}>
            <h3
              className="text-xs font-black uppercase mb-3 flex items-center gap-2"
              style={{ color: MODEL_TIERS[tier as keyof typeof MODEL_TIERS]?.color || '#888' }}
            >
              <span className="w-2 h-2 border border-current bg-current"></span>
              {MODEL_TIERS[tier as keyof typeof MODEL_TIERS]?.label || tier} <span className="text-neutral-400">({models.length})</span>
            </h3>
            <div className="grid gap-3">
              {models.map((model) => (
                <button
                  key={model.fullId}
                  onClick={() => {
                    selectModel(model.fullId);
                    onClose();
                  }}
                  className={`w-full text-left p-3 border-2 transition-all ${selectedModel === model.fullId
                    ? 'bg-p402-primary/10 border-p402-primary shadow-[4px_4px_0px_0px_rgba(182,255,46,1)]'
                    : 'bg-white border-neutral-200 hover:border-neutral-900 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate text-neutral-900">{model.name}</div>
                      <div className="text-xs text-neutral-500 font-mono uppercase">{model.providerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-500 font-mono">
                        {formatCost(model.input_cost_per_1k)}/1K
                      </div>
                      <div className="text-xs text-neutral-500 font-mono">
                        {formatCost(model.output_cost_per_1k)}/1K
                      </div>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {model.capabilities.slice(0, 4).map((cap) => (
                      <span
                        key={cap}
                        className="px-1.5 py-0.5 border border-neutral-200 bg-neutral-50 text-neutral-500 text-[9px] uppercase font-bold"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredModels.length === 0 && (
          <div className="text-center text-neutral-400 py-12 font-mono text-sm border-2 border-dashed border-neutral-200">
            NO_MATCHING_MODELS_FOUND
          </div>
        )}
      </div>
    </div>
  );
}

// Compact model display for chat input
export function ModelBadge({ onClick }: { onClick: () => void }) {
  const selectedModel = useSelectedModel();
  const providers = useProviders();

  // Find the selected model
  const model = useMemo(() => {
    for (const p of providers) {
      const m = p.models.find((m) => `${p.id}/${m.id}` === selectedModel);
      if (m) return { ...m, providerName: p.name };
    }
    return null;
  }, [providers, selectedModel]);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 border-2 border-neutral-900 
                 hover:bg-white transition-colors text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
    >
      <span
        className="w-2 h-2 border border-black"
        style={{ backgroundColor: MODEL_TIERS[(model?.tier || 'balanced') as keyof typeof MODEL_TIERS]?.color || '#888' }}
      />
      <span className="font-bold text-neutral-900 truncate max-w-[140px] uppercase tracking-tight">
        {model?.name || selectedModel.split('/').pop()}
      </span>
      <span className="text-neutral-500 text-[10px]">▼</span>
    </button>
  );
}
