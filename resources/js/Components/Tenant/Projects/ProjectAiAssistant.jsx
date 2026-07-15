import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Bot, Loader2, MessageCircle, Send, X, Calendar as CalendarIcon, 
    AlertTriangle, Check, Plus, Sparkles, ShieldAlert, Clock, Edit2 
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import SprintDecomposeModal from '@/Components/ML/SprintDecomposeModal';

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

function CreateTaskActionCard({ payload, projectId, tenantId, canManage, onDismiss }) {
    const [taskData, setTaskData] = useState({
        title: payload?.title || 'New Task',
        objective: payload?.description || payload?.objective || '',
        estimated_hours: payload?.estimated_hours || 4,
        priority: payload?.priority || 'Medium',
        task_difficulty: payload?.task_difficulty || 'Medium',
        task_classification: payload?.task_classification || 'Feature',
        required_skills: payload?.required_skills || [],
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async () => {
        if (!canManage) return;
        setIsExecuting(true);
        setError(null);
        try {
            await axios.post(route('tenant.projects.ai-assistant.execute-action', { tenant: tenantId, project: projectId }), {
                action: 'create_task',
                payload: taskData,
            });
            setIsSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task. Please try again.');
            setIsExecuting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="mt-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Task Created & Timeline Recalculated!</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Refreshing board workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3 overflow-hidden rounded-xl border border-brand/30 bg-white dark:bg-slate-900 shadow-md">
            <div className="bg-gradient-to-r from-brand/15 via-brand/10 to-transparent px-3.5 py-2.5 border-b border-brand/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
                        <Plus className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Proposed Action: Create Task</span>
                </div>
                {canManage && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] font-semibold text-brand hover:underline flex items-center gap-1"
                    >
                        <Edit2 className="w-3 h-3" /> Edit
                    </button>
                )}
            </div>

            <div className="p-3.5 space-y-3">
                {isEditing ? (
                    <div className="space-y-2.5">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Task Title</label>
                            <input
                                type="text"
                                value={taskData.title}
                                onChange={e => setTaskData({ ...taskData, title: e.target.value })}
                                className="w-full mt-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 focus:border-brand focus:outline-none dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Objective / Description</label>
                            <textarea
                                value={taskData.objective}
                                onChange={e => setTaskData({ ...taskData, objective: e.target.value })}
                                rows={2}
                                className="w-full mt-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 focus:border-brand focus:outline-none dark:text-slate-100"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Est. Hours</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={taskData.estimated_hours}
                                    onChange={e => setTaskData({ ...taskData, estimated_hours: parseFloat(e.target.value) || 0 })}
                                    className="w-full mt-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 focus:border-brand focus:outline-none dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Priority</label>
                                <select
                                    value={taskData.priority}
                                    onChange={e => setTaskData({ ...taskData, priority: e.target.value })}
                                    className="w-full mt-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 focus:border-brand focus:outline-none dark:text-slate-100"
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Difficulty</label>
                                <select
                                    value={taskData.task_difficulty}
                                    onChange={e => setTaskData({ ...taskData, task_difficulty: e.target.value })}
                                    className="w-full mt-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 focus:border-brand focus:outline-none dark:text-slate-100"
                                >
                                    <option value="Hard">Hard</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Easy">Easy</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 w-full"
                        >
                            Done Editing
                        </button>
                    </div>
                ) : (
                    <>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{taskData.title}</h4>
                            {taskData.objective && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{taskData.objective}</p>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3 h-3 text-slate-400" /> {taskData.estimated_hours}h
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                taskData.priority === 'High' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                                taskData.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                                'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                                {taskData.priority} Priority
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800">
                                {taskData.task_difficulty}
                            </span>
                        </div>
                        {taskData.required_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                {taskData.required_skills.map((skill, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 rounded bg-brand/10 text-brand text-[9px] font-bold">
                                        {typeof skill === 'object' ? skill.name : skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {error && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-[11px]">
                        {error}
                    </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    {!canManage ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold w-full">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>Only studio managers can create tasks.</span>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onDismiss}
                                disabled={isExecuting}
                                className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                Dismiss
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isExecuting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-sm transition-all hover:shadow disabled:opacity-50"
                            >
                                {isExecuting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-3.5 h-3.5" /> Create Task
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SprintDecompositionActionCard({ payload, canManage, onLaunch, onDismiss }) {
    return (
        <div className="mt-3 overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 shadow-md">
            <div className="bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent px-3.5 py-2.5 border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    </span>
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Proposed Action: AI Sprint Decomposer</span>
                </div>
            </div>

            <div className="p-3.5 space-y-3">
                <div className="rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 p-2.5">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Detected Scope / Epic Prompt</p>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 italic">
                        "{payload?.prompt || 'Full sprint decomposition'}"
                    </p>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Launching our macro-orchestrator will break down this epic into structured tasks with recommended skill dependencies, compute GNN team fit scores, and build your Critical Path timeline.
                </p>

                <div className="pt-2 border-t border-indigo-500/15 flex items-center justify-end gap-2">
                    {!canManage ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold w-full">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>Only studio managers can launch Sprint Decomposition.</span>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onDismiss}
                                className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                            >
                                Dismiss
                            </button>
                            <button
                                type="button"
                                onClick={() => onLaunch(payload?.prompt || '')}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Launch Decomposer
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProjectAiAssistant({ projectId, tenantId, teamMembers = [], canManage = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([{ 
        role: 'assistant', 
        content: 'Hi — I am your Agentic AI Assistant. Ask questions, analyze risks, or describe single tasks / full sprints to create right on your board!', 
        mode: 'chat', 
        data: null,
        intent: 'qa',
        actionPayload: null,
    }]);
    const [isLoading, setIsLoading] = useState(false);
    const [decomposeModalConfig, setDecomposeModalConfig] = useState({ isOpen: false, description: '' });
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
        setMessages(current => [...current, { role: 'user', content, mode, data: null, intent: 'qa', actionPayload: null }]);
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
                    intent: response.data.intent || 'qa',
                    actionPayload: response.data.action_payload || null,
                }
            ]);
        } catch (error) {
            setMessages(current => [...current, { 
                role: 'assistant', 
                content: error.response?.data?.message || 'I could not reach the project assistant. Please try again.',
                intent: 'qa',
                actionPayload: null,
            }]);
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
        <button type="button" onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/30 transition-transform hover:scale-105" title="Ask Project AI"><MessageCircle className="h-6 w-6" /></button>
        {isOpen && <div className="fixed bottom-6 right-6 z-50 flex h-[min(620px,calc(100vh-3rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <Bot className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Project AI Assistant</h2>
                        <p className="text-[10px] text-slate-500">Agentic Orchestrator & Grounded Q&A</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="h-4 w-4" />
                </button>
            </header>
            <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3 dark:border-slate-800 custom-scrollbar overflow-x-auto whitespace-nowrap">
                {quickActions.map(action => <button key={action.mode} onClick={() => sendMessage(action.prompt, action.mode)} disabled={isLoading} className="rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[10px] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50 transition-colors">{action.label}</button>)}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4">
                {messages.map((message, index) => (
                    <div key={index} className={`max-w-[92%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                        <div className={`whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-xs leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-brand text-white rounded-br-none' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                            {message.content}
                        </div>
                        {message.role === 'assistant' && (
                            <>
                                {renderChart(message)}
                                {message.intent === 'create_task' && message.actionPayload && (
                                    <CreateTaskActionCard
                                        payload={message.actionPayload}
                                        projectId={projectId}
                                        tenantId={tenantId}
                                        canManage={canManage}
                                        onDismiss={() => {
                                            setMessages(current => current.map((m, idx) => idx === index ? { ...m, actionPayload: null } : m));
                                        }}
                                    />
                                )}
                                {message.intent === 'decompose_sprint' && message.actionPayload && (
                                    <SprintDecompositionActionCard
                                        payload={message.actionPayload}
                                        canManage={canManage}
                                        onLaunch={prompt => {
                                            setDecomposeModalConfig({ isOpen: true, description: prompt });
                                        }}
                                        onDismiss={() => {
                                            setMessages(current => current.map((m, idx) => idx === index ? { ...m, actionPayload: null } : m));
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </div>
                ))}
                
                {isLoading && (
                    <div className="max-w-[90%] mr-auto">
                        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-bl-none">
                            <span className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                                ))}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Processing request & intent…</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={event => { event.preventDefault(); sendMessage(); }} className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-800"><input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask a question or describe a task/sprint to create…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /><button disabled={!input.trim() || isLoading} className="rounded-xl bg-brand p-2 text-white disabled:opacity-50 hover:bg-brand-dark transition-colors shrink-0"><Send className="h-4 w-4" /></button></form>
        </div>}

        <SprintDecomposeModal
            isOpen={decomposeModalConfig.isOpen}
            onClose={() => setDecomposeModalConfig({ isOpen: false, description: '' })}
            projectId={projectId}
            tenantId={tenantId}
            teamMembers={teamMembers}
            initialDescription={decomposeModalConfig.description}
            autoStart={true}
            onSaveSuccess={() => {
                setDecomposeModalConfig({ isOpen: false, description: '' });
                window.location.reload();
            }}
        />
    </>;
}
