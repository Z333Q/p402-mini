'use client';

import { useState } from 'react';
import { useP402Store, useIsStreaming } from '@/lib/store';

export function AuditTool() {
    const [repoUrl, setRepoUrl] = useState('');
    const [code, setCode] = useState('');
    const [activeTab, setActiveTab] = useState<'url' | 'code'>('url');
    const sendMessage = useP402Store((s) => s.sendMessage);
    const isStreaming = useIsStreaming();

    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = activeTab === 'url' ? repoUrl : code;
        if (!content.trim() || isStreaming) return;

        const prompt = activeTab === 'url'
            ? `Please perform a security and quality audit of the following GitHub repository: ${content}. Focus on smart contract vulnerabilities, API security, and payment flow robustness.`
            : `Please perform a security and quality audit of the following code:\n\n\`\`\`\n${content}\n\`\`\`\n\nFocus on vulnerabilities, performance optimizations, and best practices.`;

        try {
            await sendMessage(prompt);
            // Switch back to chat or show results
        } catch (error) {
            console.error('Audit failed:', error);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-neutral-100 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full space-y-6">
                <div className="panel bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-neutral-900 flex items-center justify-center border-2 border-neutral-900">
                            <span className="text-p402-primary text-2xl font-black">A</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">GitHub Audit Tool</h2>
                            <p className="text-xs font-mono text-neutral-500 uppercase">Secure / Optimize / Review</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setActiveTab('url')}
                            className={`flex-1 py-2 text-xs font-bold uppercase border-2 transition-all ${activeTab === 'url' ? 'bg-neutral-900 text-p402-primary border-neutral-900' : 'bg-white border-neutral-200 hover:border-neutral-900'
                                }`}
                        >
                            Repo URL
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`flex-1 py-2 text-xs font-bold uppercase border-2 transition-all ${activeTab === 'code' ? 'bg-neutral-900 text-p402-primary border-neutral-900' : 'bg-white border-neutral-200 hover:border-neutral-900'
                                }`}
                        >
                            Direct Code
                        </button>
                    </div>

                    <form onSubmit={handleAudit} className="space-y-4">
                        {activeTab === 'url' ? (
                            <div>
                                <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1.5 ml-1">Repository URL</label>
                                <input
                                    type="text"
                                    placeholder="https://github.com/org/repo"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    className="w-full bg-neutral-50 border-2 border-neutral-900 px-4 py-3 text-sm font-mono focus:border-p402-info focus:outline-none"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1.5 ml-1">Paste Code</label>
                                <textarea
                                    placeholder="Paste your code here..."
                                    rows={8}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full bg-neutral-50 border-2 border-neutral-900 px-4 py-3 text-sm font-mono focus:border-p402-info focus:outline-none resize-none"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isStreaming || (activeTab === 'url' ? !repoUrl : !code)}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all disabled:opacity-50"
                        >
                            {isStreaming ? (
                                <>
                                    <span className="w-5 h-5 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                                    <span>ANALYZING...</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xl">🔍</span>
                                    <span>START AUDIT</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="panel bg-white p-4 border-2 border-neutral-200">
                        <h3 className="text-[10px] font-black uppercase text-neutral-400 mb-2">Vulnerability Scan</h3>
                        <p className="text-xs text-neutral-600 leading-relaxed font-mono">Real-time analysis of dependency chains and logic flows.</p>
                    </div>
                    <div className="panel bg-white p-4 border-2 border-neutral-200">
                        <h3 className="text-[10px] font-black uppercase text-neutral-400 mb-2">Gas Optimization</h3>
                        <p className="text-xs text-neutral-600 leading-relaxed font-mono">Detailed reports on computational waste and savings.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
