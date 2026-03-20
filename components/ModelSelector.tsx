'use client';

import { useState, useMemo } from 'react';
import { useP402Store, useProviders, useSelectedModel } from '@/lib/store';
import { MODEL_TIERS } from '@/lib/types';
import { formatCost, p402 } from '@/lib/p402-client';
import type { LiveModel } from '@/lib/types';

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
  const [source, setSource] = useState<'providers' | 'catalog'>('providers');
  const [liveModels, setLiveModels] = useState<LiveModel[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const handleSourceSwitch = async (next: 'providers' | 'catalog') => {
    setSource(next);
    if (next === 'catalog' && liveModels === null && !liveLoading) {
      setLiveLoading(true);
      setLiveError(null);
      try {
        const res = await p402.getModels();
        setLiveModels(res.data || []);
      } catch (e) {
        setLiveError(e instanceof Error ? e.message : 'Failed to load catalog');
      } finally {
        setLiveLoading(false);
      }
    }
  };

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

  // Filter provider models
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

  // Group by tier (providers mode)
  const groupedModels = useMemo(() => {
    const groups: Record<string, typeof filteredModels> = {};
    filteredModels.forEach((m) => {
      if (!groups[m.tier]) groups[m.tier] = [];
      groups[m.tier].push(m);
    });
    return groups;
  }, [filteredModels]);

  // Group live models by provider
  const groupedLiveModels = useMemo(() => {
    if (!liveModels) return {};
    const groups: Record<string, LiveModel[]> = {};
    liveModels
      .filter((m) =>
        search === '' ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.provider.toLowerCase().includes(search.toLowerCase())
      )
      .forEach((m) => {
        if (!groups[m.provider]) groups[m.provider] = [];
        groups[m.provider].push(m);
      });
    return groups;
  }, [liveModels, search]);

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

      {/* Source Toggle + Filters */}
      <div className="p-4 border-b-2 border-neutral-900 bg-neutral-50 space-y-3">
        {/* Source pills */}
        <div className="flex gap-0 border-2 border-neutral-900 w-fit">
          <button
            onClick={() => handleSourceSwitch('providers')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter transition-all ${
              source === 'providers' ? 'bg-neutral-900 text-p402-primary' : 'bg-white text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => handleSourceSwitch('catalog')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter border-l-2 border-neutral-900 transition-all ${
              source === 'catalog' ? 'bg-neutral-900 text-p402-primary' : 'bg-white text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Live Catalog
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="SEARCH MODELS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 bg-white border-2 border-neutral-900 px-3 py-2 text-sm font-mono
                     focus:border-p402-info focus:outline-none"
        />

        {/* Tier Filter (providers only) */}
        {source === 'providers' && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['all', 'premium', 'mid', 'budget'].map((tier) => (
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
        )}
      </div>

      {/* Model List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">

        {/* ── PROVIDERS MODE ── */}
        {source === 'providers' && (
          <>
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
          </>
        )}

        {/* ── LIVE CATALOG MODE ── */}
        {source === 'catalog' && (
          <>
            {liveLoading && (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-neutral-100 border-2 border-neutral-200 animate-pulse" />
                ))}
              </div>
            )}

            {liveError && (
              <div className="border-2 border-red-300 bg-red-50 p-4 text-center space-y-2">
                <p className="text-xs font-mono text-red-600">{liveError}</p>
                <button
                  onClick={() => { setLiveModels(null); handleSourceSwitch('catalog'); }}
                  className="text-[10px] font-bold uppercase px-3 py-1 border-2 border-red-400 bg-white"
                >
                  Retry
                </button>
              </div>
            )}

            {!liveLoading && !liveError && Object.entries(groupedLiveModels).map(([provider, models]) => (
              <div key={provider}>
                <h3 className="text-xs font-black uppercase mb-3 flex items-center gap-2 text-neutral-500">
                  <span className="w-2 h-2 border border-neutral-400 bg-neutral-400"></span>
                  {provider} <span className="text-neutral-400">({models.length})</span>
                </h3>
                <div className="grid gap-3">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        selectModel(model.id);
                        onClose();
                      }}
                      className={`w-full text-left p-3 border-2 transition-all ${selectedModel === model.id
                        ? 'bg-p402-primary/10 border-p402-primary shadow-[4px_4px_0px_0px_rgba(182,255,46,1)]'
                        : 'bg-white border-neutral-200 hover:border-neutral-900 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate text-neutral-900">{model.name}</div>
                          <div className="text-xs text-neutral-500 font-mono">
                            {(model.context_window / 1000).toFixed(0)}K ctx
                            {model.max_output_tokens && ` · ${(model.max_output_tokens / 1000).toFixed(0)}K out`}
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-mono text-neutral-500">
                          <div>${model.pricing.input_per_1k.toFixed(4)}/1K in</div>
                          <div>${model.pricing.output_per_1k.toFixed(4)}/1K out</div>
                        </div>
                      </div>
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

            {!liveLoading && !liveError && liveModels !== null && Object.keys(groupedLiveModels).length === 0 && (
              <div className="text-center text-neutral-400 py-12 font-mono text-sm border-2 border-dashed border-neutral-200">
                NO_MATCHING_MODELS_FOUND
              </div>
            )}
          </>
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
