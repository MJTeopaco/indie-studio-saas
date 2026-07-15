import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bot, Loader2, MessageCircle, Send, X, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const quickActions = [
    { label: 'Risk scan', mode: 'risk', prompt: 'Scan this project for risks.' },
    { label: 'Project summary', mode: 'summary', prompt: 'Summarize this project.' },
    { label: 'Deadline prediction', mode: 'deadline', prompt: 'When is this project likely to finish?' },
];

const COLORS = {
    todo: '#94a3b8',        // slate-400
    in_progress: '#3b82f6', // blue-500
    review: '#f59e0b',      // amber-500
    completed: '#10b981',   // emerald-500
};

export default function ProjectAiAssistant({ projectId, tenantId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi — I can answer project questions or check risks, status, and the expected delivery date.', mode: 'chat', data: null }]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const sendMessage = async (message = input, mode = 'chat') => {
        const content = message.trim();
        if (!content || isLoading) return;
        
        const history = messages.map(({ role, content: text }) => ({ role, content: text }));
        setMessages(current => [...current, { role: 'user', content, mode: 'chat', data: null }]);
        setInput('');
        setIsLoading(true);
        
        try {
            const response = await axios.post(
                route('tenant.projects.ai-assistant', { tenant: tenantId, project: projectId }), 
                { message: content, mode, history }
            );
            setMessages(current => [
                ...current, 
                { 
                    role: 'assistant', 
                    content: response.data.reply || 'I could not generate a response.',
                    mode: mode,
                    data: response.data.data || null,
                }
            ]);
        } catch (error) {
            setMessages(current => [...current, { role: 'assistant', content: error.response?.data?.message || 'I could not reach the project assistant. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderChart = (message) => {
        if (!message.data) return null;

        if (message.mode === 'summary' && message.data.stats) {
            const stats = message.data.stats;
            const data = [
                { name: 'To Do', value: stats.total_tasks - stats.completed - stats.in_progress, color: COLORS.todo },
                { name: 'In Progress', value: stats.in_progress, color: COLORS.in_progress },
                { name: 'Completed', value: stats.completed, color: COLORS.completed },
            ].filter(item => item.value > 0);

            return (
                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Task Breakdown</p>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (message.mode === 'risk' && message.data.risk_factors) {
            const risks = message.data.risk_factors;
            const data = Object.keys(risks).map(key => ({
                name: key.replace(/_/g, ' '),
                score: typeof risks[key] === 'object' ? risks[key].score : risks[key]
            })).filter(item => item.score !== undefined);

            if (data.length === 0) return null;

            return (
                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Risk Factors
                    </p>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Bar dataKey="score" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        if (message.mode === 'deadline' && message.data.predicted_date) {
            return (
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/30 flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Estimated Completion</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{message.data.predicted_date}</p>
                    </div>
                </div>
            );
        }

        return null;
    };

    return <>
        <button type="button" onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30 transition-transform hover:scale-105" title="Ask project AI"><MessageCircle className="h-6 w-6" /></button>
        {isOpen && <div className="fixed bottom-6 right-6 z-50 flex h-[min(620px,calc(100vh-3rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand"><Bot className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Project AI</h2><p className="text-[10px] text-slate-500">Grounded in this project’s data</p></div></div><button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></header>
            <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3 dark:border-slate-800 custom-scrollbar overflow-x-auto whitespace-nowrap">
                {quickActions.map(action => <button key={action.mode} onClick={() => sendMessage(action.prompt, action.mode)} disabled={isLoading} className="rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[10px] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50">{action.label}</button>)}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4">
                {messages.map((message, index) => (
                    <div key={index} className={`max-w-[90%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                        <div className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>
                            {message.content}
                        </div>
                        {message.role === 'assistant' && renderChart(message)}
                    </div>
                ))}
                
                {isLoading && (
                    <div className="max-w-[90%] mr-auto">
                        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                                ))}
                            </span>
                            <span className="text-xs text-slate-500">Reviewing project data…</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={event => { event.preventDefault(); sendMessage(); }} className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-800"><input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about this project…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900" /><button disabled={!input.trim() || isLoading} className="rounded-xl bg-brand p-2 text-white disabled:opacity-50 hover:bg-brand-dark transition-colors"><Send className="h-4 w-4" /></button></form>
        </div>}
    </>;
}
