'use client';

import { useState, useEffect } from 'react';
import { p402 } from '@/lib/p402-client';
import type { RemoteAgent } from '@/lib/types';

function TrustBar({ score }: { score: number }) {
  const color =
    score >= 80 ? '#B6FF2E' :
    score >= 50 ? '#00F0FF' :
    score >= 25 ? '#FF9900' :
    '#FF4444';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-200 border border-neutral-300">
        <div
          className="h-full transition-all"
          style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="panel border-2 border-neutral-200 p-3 animate-pulse space-y-2">
      <div className="h-4 bg-neutral-200 w-3/4" />
      <div className="h-2 bg-neutral-100 w-full" />
      <div className="h-1.5 bg-neutral-100 w-full mt-3" />
      <div className="flex gap-1 mt-2">
        <div className="h-4 w-12 bg-neutral-100" />
        <div className="h-4 w-16 bg-neutral-100" />
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: RemoteAgent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full text-left panel border-2 transition-all ${
        expanded
          ? 'border-p402-primary shadow-[4px_4px_0px_0px_rgba(182,255,46,1)]'
          : 'border-neutral-200 hover:border-neutral-900 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
      }`}
    >
      <div className="p-3 space-y-2">
        {/* Name + Status */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-bold text-sm text-neutral-900 leading-tight">{agent.name}</span>
          <span
            className={`text-[9px] font-black uppercase px-1.5 py-0.5 border flex-shrink-0 ${
              agent.status === 'active'
                ? 'bg-p402-primary/20 border-p402-primary text-neutral-900'
                : 'bg-neutral-100 border-neutral-300 text-neutral-500'
            }`}
          >
            {agent.status}
          </span>
        </div>

        {/* Trust Bar */}
        <TrustBar score={agent.trust_score} />

        {/* Capabilities (max 3) */}
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <span
              key={cap}
              className="px-1.5 py-0.5 border border-neutral-200 bg-neutral-50 text-neutral-500 text-[9px] uppercase font-bold"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="px-1.5 py-0.5 text-neutral-400 text-[9px] font-mono">
              +{agent.capabilities.length - 3}
            </span>
          )}
        </div>

        {/* Pricing */}
        {agent.pricing && (
          <div className="text-[10px] font-mono text-neutral-500">
            ${agent.pricing.input_per_1k.toFixed(4)}/${agent.pricing.output_per_1k.toFixed(4)} per 1k
          </div>
        )}

        {/* Expanded: full details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t-2 border-neutral-100 space-y-3">
            {agent.description && (
              <p className="text-xs text-neutral-600 leading-relaxed">{agent.description}</p>
            )}

            {agent.capabilities.length > 3 && (
              <div>
                <div className="text-[9px] font-black uppercase text-neutral-400 mb-1">All Capabilities</div>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-1.5 py-0.5 border border-neutral-300 text-neutral-600 text-[9px] uppercase font-bold"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {agent.skills && agent.skills.length > 0 && (
              <div>
                <div className="text-[9px] font-black uppercase text-neutral-400 mb-1">Skills</div>
                <div className="space-y-1">
                  {agent.skills.map((skill) => (
                    <div key={skill.id} className="text-xs font-mono text-neutral-600">
                      <span className="font-bold text-neutral-900">{skill.name}</span>
                      {skill.description && <span className="text-neutral-500"> — {skill.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agent.stats && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-[9px] font-black uppercase text-neutral-400">REQUESTS</div>
                  <div className="font-mono font-bold text-xs text-neutral-900">{agent.stats.total_requests}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-black uppercase text-neutral-400">SUCCESS</div>
                  <div className="font-mono font-bold text-xs text-neutral-900">
                    {(agent.stats.success_rate * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-black uppercase text-neutral-400">LATENCY</div>
                  <div className="font-mono font-bold text-xs text-neutral-900">{agent.stats.avg_latency_ms}ms</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export function AgentsPanel() {
  const [agents, setAgents] = useState<RemoteAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await p402.getAgents();
      setAgents(res.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = search
    ? agents.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.capabilities.some((c) => c.toLowerCase().includes(search.toLowerCase()))
      )
    : agents;

  return (
    <div className="flex-1 overflow-y-auto bg-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-black uppercase text-neutral-900 tracking-tight">A2A Registry</h2>
            <p className="text-[10px] font-mono text-neutral-500 mt-0.5">Agent-to-Agent Discovery</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="text-[10px] font-bold uppercase px-3 py-1.5 border-2 border-neutral-900
                       bg-white hover:bg-neutral-100 disabled:opacity-40 transition-colors
                       shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-0.5"
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>

        {/* Search */}
        {!loading && !error && agents.length > 0 && (
          <input
            type="text"
            placeholder="SEARCH AGENTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-white border-2 border-neutral-900 px-3 text-sm font-mono
                       focus:border-p402-primary focus:outline-none mb-4 placeholder:text-neutral-400"
          />
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border-2 border-red-300 bg-red-50 p-4 text-center space-y-2">
            <p className="text-xs font-mono text-red-600">{error}</p>
            <button
              onClick={load}
              className="text-[10px] font-bold uppercase px-3 py-1.5 border-2 border-red-400 bg-white hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && agents.length === 0 && (
          <div className="border-2 border-dashed border-neutral-300 p-8 text-center space-y-2">
            <p className="text-xs font-black uppercase text-neutral-400">No Agents Registered</p>
            <p className="text-[10px] font-mono text-neutral-400">
              Protocol: did:web:mini.p402.io
            </p>
          </div>
        )}

        {/* Agent grid */}
        {!loading && !error && agents.length > 0 && filtered.length === 0 && (
          <div className="border-2 border-dashed border-neutral-300 p-6 text-center">
            <p className="text-xs font-mono text-neutral-400">No agents match "{search}"</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
