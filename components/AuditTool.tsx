'use client';

import { useState } from 'react';
import { useP402Store, useIsStreaming } from '@/lib/store';

export function AuditTool() {
    const [repoUrl, setRepoUrl] = useState('');
    const [code, setCode] = useState('');
    const [activeTab, setActiveTab] = useState<'url' | 'code'>('url');
    const [submitted, setSubmitted] = useState(false);
    const sendMessage = useP402Store((s) => s.sendMessage);
    const isStreaming = useIsStreaming();

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = activeTab === 'url' ? repoUrl : code;
        if (!content.trim() || isStreaming) return;

        const prompt = activeTab === 'url'
            ? `Please perform a thorough security and quality audit of the following GitHub repository: ${content}. Cover: potential vulnerabilities, input validation, authentication flows, dependency risks, and any payment or API security concerns. Provide a structured report.`
            : `Please perform a thorough security and quality audit of the following code:\n\n\`\`\`\n${content}\n\`\`\`\n\nCover: vulnerabilities, logic errors, performance issues, and best practices. Provide a structured report with severity levels.`;

        try {
            setSubmitted(true);
            await sendMessage(prompt);
        } catch (error) {
            console.error('Audit failed:', error);
            setSubmitted(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-neutral-100 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full space-y-4">
                <div className="panel bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-neutral-900 flex items-center justify-center border-2 border-neutral-900 flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B6FF2E" strokeWidth="2.5" strokeLinecap="square">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">Code Audit</h2>
                            <p className="text-[10px] font-mono text-neutral-500 uppercase">Security · Performance · Best Practices</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-2 border-neutral-900 mb-5">
                        <button
                            onClick={() => { setActiveTab('url'); setSubmitted(false); }}
                            className={`flex-1 py-2 text-xs font-bold uppercase border-r-2 border-neutral-900 transition-all ${activeTab === 'url' ? 'bg-neutral-900 text-p402-primary' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
                        >
                            Repo URL
                        </button>
                        <button
                            onClick={() => { setActiveTab('code'); setSubmitted(false); }}
                            className={`flex-1 py-2 text-xs font-bold uppercase transition-all ${activeTab === 'code' ? 'bg-neutral-900 text-p402-primary' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
                        >
                            Paste Code
                        </button>
                    </div>

                    <form onSubmit={handleAudit} className="space-y-4">
                        {activeTab === 'url' ? (
                            <div>
                                <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1.5 tracking-wider">
                                    GitHub Repository URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://github.com/org/repo"
                                    value={repoUrl}
                                    onChange={(e) => { setRepoUrl(e.target.value); setSubmitted(false); }}
                                    className="w-full bg-neutral-50 border-2 border-neutral-900 px-4 py-3 text-sm font-mono
                                               focus:border-p402-primary focus:outline-none"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1.5 tracking-wider">
                                    Code (any language)
                                </label>
                                <textarea
                                    placeholder="Paste your code here..."
                                    rows={8}
                                    value={code}
                                    onChange={(e) => { setCode(e.target.value); setSubmitted(false); }}
                                    className="w-full bg-neutral-50 border-2 border-neutral-900 px-4 py-3 text-sm font-mono
                                               focus:border-p402-primary focus:outline-none resize-none"
                                />
                            </div>
                        )}

                        {/* Post-submit hint */}
                        {submitted && !isStreaming && (
                            <div className="flex items-center gap-2 bg-p402-primary/10 border-2 border-p402-primary px-3 py-2 text-xs font-mono">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Audit submitted — switch to <strong className="mx-1 uppercase">Chat</strong> to see results
                            </div>
                        )}

                        {isStreaming && (
                            <div className="flex items-center gap-2 bg-neutral-100 border-2 border-neutral-300 px-3 py-2 text-xs font-mono">
                                <span className="w-2 h-2 bg-p402-primary animate-pulse" />
                                Analyzing... check <strong className="mx-1 uppercase">Chat</strong> tab for results
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isStreaming || (activeTab === 'url' ? !repoUrl.trim() : !code.trim())}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-3
                                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                       active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isStreaming ? (
                                <>
                                    <span className="w-4 h-4 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                                    <span>ANALYZING...</span>
                                </>
                            ) : (
                                <span>START AUDIT</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="panel bg-white p-4 border-2 border-neutral-200">
                        <h3 className="text-[10px] font-black uppercase text-neutral-400 mb-1.5">Security Scan</h3>
                        <p className="text-xs text-neutral-600 leading-relaxed font-mono">
                            Identify vulnerabilities, injection risks, and auth weaknesses.
                        </p>
                    </div>
                    <div className="panel bg-white p-4 border-2 border-neutral-200">
                        <h3 className="text-[10px] font-black uppercase text-neutral-400 mb-1.5">Code Quality</h3>
                        <p className="text-xs text-neutral-600 leading-relaxed font-mono">
                            Performance, logic errors, and best-practice recommendations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
