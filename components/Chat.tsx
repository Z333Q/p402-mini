'use client';

import { useState, useRef, useEffect } from 'react';
import { useP402Store, useMessages, useIsStreaming, useBalance, useUserProfile } from '@/lib/store';
import { formatCost, formatSavings } from '@/lib/p402-client';
import { ModelBadge } from './ModelSelector';
import type { ChatMessage } from '@/lib/types';

interface ChatProps {
  onModelClick: () => void;
  onFundClick: () => void;
}

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

        {/* Streaming indicator */}
        {isStreaming && streamingContent && (
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-p402-primary border-2 border-neutral-900 flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-neutral-900 font-extrabold text-sm">AI</span>
            </div>
            <div className="flex-1 panel shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-sm font-mono whitespace-pre-wrap">{streamingContent}</div>
              <div className="mt-3 flex items-center gap-2 border-t-2 border-neutral-200 pt-2">
                <span className="w-2.5 h-2.5 bg-p402-primary rounded-none animate-pulse" />
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">COMPUTING RESPONSE...</span>
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

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const profile = useUserProfile();

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-slideUp`}>
      {/* Avatar */}
      <div
        className={`w-10 h-10 flex items-center justify-center flex-shrink-0 border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${isUser ? 'bg-neutral-900' : 'bg-p402-primary'
          }`}
      >
        {isUser && profile?.pfpUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={profile.pfpUrl} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <span className={`font-extrabold text-sm ${isUser ? 'text-white' : 'text-neutral-900'}`}>
            {isUser ? 'YOU' : 'AI'}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 max-w-[85%] border-2 border-neutral-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isUser
          ? 'bg-white'
          : 'bg-white'
          }`}
      >
        <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-neutral-800">{message.content}</div>

        {/* Cost info for assistant messages */}
        {!isUser && message.cost && (
          <div className="mt-4 pt-3 border-t-2 border-neutral-200">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-neutral-500 font-bold">
                  COST: <span className="text-neutral-900 bg-neutral-100 px-1">{formatCost(message.cost.total_cost)}</span>
                </span>
                {message.cost.direct_cost > 0 && (
                  <span className="text-neutral-400">
                    DIRECT: <span className="line-through decoration-2">
                      {formatCost(message.cost.direct_cost)}
                    </span>
                  </span>
                )}
              </div>
              {message.cost.savings > 0 && (
                <span className="text-p402-success font-bold bg-p402-success/10 px-1">
                  Saved {formatSavings(message.cost.savings, message.cost.direct_cost)}
                </span>
              )}
            </div>
            <div className="mt-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>{message.cost.input_tokens} IN // {message.cost.output_tokens} OUT // {message.model}</span>
              <div className="flex items-center gap-3">
                {message.latency_ms && (
                  <span className="flex items-center gap-1">
                    <span className="text-p402-info">⚡</span> {message.latency_ms}ms
                  </span>
                )}
                {message.cached && (
                  <span className="text-p402-success border border-p402-success px-1 leading-none h-4 flex items-center">
                    CACHED
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onFundClick, balance }: { onFundClick: () => void; balance: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-p402-primary border-4 border-neutral-900 flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <span className="text-neutral-900 font-black text-4xl">P</span>
      </div>
      <h2 className="text-2xl font-black uppercase mb-3 text-neutral-900 tracking-tight">System Ready</h2>
      <p className="text-neutral-500 text-sm font-mono mb-8 max-w-xs">
        &gt; Initialize request sequence<br />
        &gt; Select optimal model<br />
        &gt; Execute payload
      </p>

      {balance === 0 ? (
        <button
          onClick={onFundClick}
          className="btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          INITIALIZE WALLET ($5)
        </button>
      ) : (
        <div className="bg-neutral-200 px-4 py-2 border-2 border-neutral-900 text-xs font-mono text-neutral-600">
          AWAITING INPUT...
        </div>
      )}

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-4 mt-12 w-full max-w-sm">
        {[
          { icon: '🔄', label: 'ROUTING' },
          { icon: '💰', label: '-70% COST' },
          { icon: '⚡', label: 'FAILOVER' }
        ].map((f) => (
          <div key={f.label} className="border-2 border-neutral-200 p-2 bg-white">
            <div className="text-2xl mb-1 grayscale">{f.icon}</div>
            <div className="text-[10px] font-bold uppercase text-neutral-500">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatInput({ onModelClick, onFundClick }: { onModelClick: () => void; onFundClick: () => void }) {
  const [input, setInput] = useState('');
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

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(message); // Restore input on error
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="border-t-2 border-neutral-900 p-4 bg-white">
      {/* Model selector row */}
      <div className="flex items-center justify-between mb-3">
        <ModelBadge onClick={onModelClick} />
        {balance < 1 && balance > 0 && (
          <button
            onClick={onFundClick}
            className="text-xs font-bold text-p402-warning hover:text-p402-warning/80 uppercase tracking-wide flex items-center gap-1"
          >
            <span>⚠</span> Low Funds
          </button>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={balance <= 0 ? 'Initialize wallet to begin...' : 'Enter prompt...'}
          disabled={isStreaming}
          rows={1}
          className="flex-1 bg-neutral-50 border-2 border-neutral-900 px-4 py-3 text-sm font-mono
                     resize-none focus:border-p402-info focus:outline-none focus:ring-0
                     disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="w-14 h-auto bg-neutral-900 text-p402-primary font-bold 
                     border-2 border-neutral-900 hover:bg-neutral-800 transition-colors
                     disabled:bg-neutral-300 disabled:border-neutral-300 disabled:text-neutral-500
                     flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(182,255,46,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          {isStreaming ? (
            <span className="w-5 h-5 border-2 border-p402-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-xl">↵</span>
          )}
        </button>
      </form>

      {/* Keyboard hint */}
      <div className="mt-3 flex justify-between items-center text-[10px] text-neutral-400 font-mono uppercase">
        <span>STATUS: {isStreaming ? 'BUSY' : 'READY'}</span>
        <span>RETURN TO SEND</span>
      </div>
    </div>
  );
}
