import React, { useState } from 'react';
import axios from 'axios';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';

const quickActions = [
    { label: 'Risk scan', mode: 'risk', prompt: 'Scan this project for risks.' },
    { label: 'Project summary', mode: 'summary', prompt: 'Summarize this project.' },
    { label: 'Deadline prediction', mode: 'deadline', prompt: 'When is this project likely to finish?' },
];

export default function ProjectAiAssistant({ projectId, tenantId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi — I can answer project questions or check risks, status, and the expected delivery date.' }]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (message = input, mode = 'chat') => {
        const content = message.trim();
        if (!content || isLoading) return;
        const history = messages.map(({ role, content: text }) => ({ role, content: text }));
        setMessages(current => [...current, { role: 'user', content }]);
        setInput('');
        setIsLoading(true);
        try {
            const response = await axios.post(route('tenant.projects.ai-assistant', { tenant: tenantId, project: projectId }), { message: content, mode, history });
            setMessages(current => [...current, { role: 'assistant', content: response.data.reply || 'I could not generate a response.' }]);
        } catch (error) {
            setMessages(current => [...current, { role: 'assistant', content: error.response?.data?.message || 'I could not reach the project assistant. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return <>
        <button type="button" onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30 transition-transform hover:scale-105" title="Ask project AI"><MessageCircle className="h-6 w-6" /></button>
        {isOpen && <div className="fixed bottom-6 right-6 z-50 flex h-[min(620px,calc(100vh-3rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand"><Bot className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Project AI</h2><p className="text-[10px] text-slate-500">Grounded in this project’s data</p></div></div><button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></header>
            <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3 dark:border-slate-800">{quickActions.map(action => <button key={action.mode} onClick={() => sendMessage(action.prompt, action.mode)} disabled={isLoading} className="rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[10px] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50">{action.label}</button>)}</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((message, index) => <div key={index} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${message.role === 'user' ? 'ml-auto bg-brand text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{message.content}</div>)}{isLoading && <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Reviewing project data…</div>}</div>
            <form onSubmit={event => { event.preventDefault(); sendMessage(); }} className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-800"><input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about this project…" className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand/20 dark:bg-slate-800" /><button disabled={!input.trim() || isLoading} className="rounded-xl bg-brand p-2 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
        </div>}
    </>;
}
