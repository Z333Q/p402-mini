'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useP402Store, useMessages, useIsStreaming, useBalance, useUserProfile } from '@/lib/store';
import { formatCost, formatSavings } from '@/lib/p402-client';
import { ModelBadge } from './ModelSelector';
import type { ChatMessage } from '@/lib/types';

interface ChatProps {
  onModelClick: () => void;
  onFundClick: () => void;
}

const STARTER_PROMPTS = [
  'Explain semantic caching and how it saves money',
  'Compare GPT-5.2 vs Claude 4.5 for code tasks',
  'Write a Solidity function for ERC-20 transfer',
  'What AI model is best for reasoning tasks?',
];

export function Chat({ onModelClick, onFundClick }: ChatProps) {
  const messages = useMessages();
  const isStreaming = useIsStreaming();
  const streamingContent = useP402Store((s) => s.streamingContent);
  const balance = useBalance();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-100">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <EmptyState onFundClick={onFundClick} balance={balance} />
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming bubble */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 animate-slideUp">
            <div className="w-9 h-9 bg-p402-primary border-2 border-neutral-900 flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-neutral-900 font-extrabold text-xs">AI</span>
            </div>
            <div className="flex-1 max-w-[85%] panel border-2 border-neutral-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-neutral-800">{streamingContent}</div>
              <div className="mt-3 flex items-center gap-2 border-t-2 border-neutral-200 pt-2">
                <span className="w-2 h-2 bg-p402-primary animate-pulse" />
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">COMPUTING...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onModelClick={onModelClick} onFundClick={onFundClick} />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available — silently fail
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
                 px-2 py-0.5 text-[9px] font-bold uppercase border border-neutral-300 bg-white
                 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900"
    >
      {copied ? 'COPIED' : 'COPY'}
    </button>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const profile = useUserProfile();

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slideUp group`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 flex items-center justify-center flex-shrink-0 border-2 border-neutral-900
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${isUser ? 'bg-neutral-900' : 'bg-p402-primary'}`}
      >
        {isUser && profile?.pfpUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={profile.pfpUrl} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <span className={`font-extrabold text-xs ${isUser ? 'text-white' : 'text-neutral-900'}`}>
            {isUser ? 'YOU' : 'AI'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] border-2 border-neutral-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white`}>
        <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-neutral-800">{message.content}</div>

        {/* Footer: cost info + copy button */}
        <div className="mt-3 pt-2 border-t-2 border-neutral-100 flex items-end justify-between gap-2">
          {/* Cost metadata (assistant only) */}
          {!isUser && message.cost ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 text-[10px] font-mono flex-wrap">
                <span className="text-neutral-500 font-bold">
                  COST: <span className="text-neutral-900 bg-neutral-100 px-1">{formatCost(message.cost.total_cost)}</span>
                </span>
                {message.cost.direct_cost > 0 && (
                  <span className="text-neutral-400">
                    <span className="line-through decoration-2">{formatCost(message.cost.direct_cost)}</span>
                  </span>
                )}
                {message.cost.savings > 0 && (
                  <span className="text-p402-success font-bold bg-p402-success/10 px-1">
                    -{formatSavings(message.cost.savings, message.cost.direct_cost)}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[9px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-3 flex-wrap">
                <span>{message.cost.input_tokens}in/{message.cost.output_tokens}out</span>
                {message.model && <span className="truncate max-w-[120px]">{message.model}</span>}
                {message.latency_ms && (
                  <span className="text-p402-info">⚡{message.latency_ms}ms</span>
                )}
                {message.cached && (
                  <span className="text-p402-success border border-p402-success px-1 leading-none">CACHED</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <CopyButton text={message.content} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onFundClick, balance }: { onFundClick: () => void; balance: number }) {
  const sendMessage = useP402Store((s) => s.sendMessage);

  const handlePrompt = async (prompt: string) => {
    if (balance <= 0) { onFundClick(); return; }
    try { await sendMessage(prompt); } catch { /* handled inside sendMessage */ }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 pt-8">
      <div className="w-16 h-16 bg-p402-primary border-4 border-neutral-900 flex items-center justify-center mb-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <span className="text-neutral-900 font-black text-3xl">P</span>
      </div>
      <h2 className="text-xl font-black uppercase mb-2 text-neutral-900 tracking-tight">System Ready</h2>
      <p className="text-neutral-500 text-xs font-mono mb-6 max-w-xs leading-relaxed">
        100+ AI models · smart routing · semantic cache<br />
        Pay only for what you use — USDC on Base
      </p>

      {balance === 0 ? (
        <button
          onClick={onFundClick}
          className="btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all mb-6"
        >
          LOAD USDC CREDITS
        </button>
      ) : (
        <div className="mb-6">
          <div className="text-[10px] font-black uppercase text-neutral-400 mb-3 tracking-wider">Try a starter prompt</div>
          <div className="grid gap-2 max-w-sm w-full">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handlePrompt(prompt)}
                className="text-left px-3 py-2 text-xs font-mono border-2 border-neutral-300 bg-white
                           hover:border-neutral-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-neutral-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-2">
        {[
          { label: 'ROUTING', sub: 'Optimal provider' },
          { label: '-70% COST', sub: 'Via caching' },
          { label: 'FAILOVER', sub: 'Auto-switch' },
        ].map((f) => (
          <div key={f.label} className="border-2 border-neutral-200 p-2 bg-white text-center">
            <div className="text-[10px] font-black uppercase text-neutral-900">{f.label}</div>
            <div className="text-[9px] font-mono text-neutral-400 mt-0.5">{f.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatInput({ onModelClick, onFundClick }: { onModelClick: () => void; onFundClick: () => void }) {
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const sendMessage = useP402Store((s) => s.sendMessage);
  const isStreaming = useIsStreaming();
  const balance = useBalance();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    if (balance <= 0) {
      onFundClick();
      return;
    }

    const message = input.trim();
    setInput('');
    setSendError(null);

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(message); // Restore on error
      setSendError(error instanceof Error ? error.message : 'Failed to send. Tap to retry.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  return (
    <div className="border-t-2 border-neutral-900 bg-white">
      {/* Error banner */}
      {sendError && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b-2 border-red-300 text-xs font-mono">
          <span className="text-red-600">{sendError}</span>
          <button
            onClick={() => { setSendError(null); handleSubmit({ preventDefault: () => {} } as React.FormEvent); }}
            className="text-[10px] font-bold uppercase px-2 py-0.5 border border-red-400 bg-white hover:bg-red-50 ml-3 flex-shrink-0"
          >
            RETRY
          </button>
        </div>
      )}

      <div className="p-4">
        {/* Model selector + balance warning row */}
        <div className="flex items-center justify-between mb-3">
          <ModelBadge onClick={onModelClick} />
          {balance < 1 && balance > 0 && (
            <button
              onClick={onFundClick}
              className="text-[10px] font-bold text-p402-warning hover:underline uppercase tracking-wide flex items-center gap-1"
            >
              ⚠ Low Funds — Add USDC
            </button>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={balance <= 0 ? 'Load credits to start...' : 'Enter your prompt...'}
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-neutral-50 border-2 border-neutral-900 px-4 py-3 text-sm font-mono
                       resize-none focus:border-p402-primary focus:outline-none focus:ring-0
                       disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-12 flex-shrink-0 bg-neutral-900 text-p402-primary font-bold
                       border-2 border-neutral-900 hover:bg-neutral-800 transition-colors
                       disabled:bg-neutral-200 disabled:border-neutral-200 disabled:text-neutral-400
                       flex items-center justify-center
                       shadow-[3px_3px_0px_0px_rgba(182,255,46,1)] disabled:shadow-none
                       hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            {isStreaming ? (
              <span className="w-4 h-4 border-2 border-p402-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21L23 12 2 3v7l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </form>

        {/* Status bar */}
        <div className="mt-2 flex justify-between items-center text-[9px] text-neutral-400 font-mono uppercase tracking-wider">
          <span className={isStreaming ? 'text-p402-primary font-bold' : ''}>
            {isStreaming ? '● STREAMING' : '○ READY'}
          </span>
          <span>↵ SEND · SHIFT+↵ NEWLINE</span>
        </div>
      </div>
    </div>
  );
}
