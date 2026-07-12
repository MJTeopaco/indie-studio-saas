import React, { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import TenantLayout from '@/Layouts/TenantLayout';
import RightSidebar from '@/Components/Tenant/Projects/RightSidebar';
import SprintDecomposeModal from '@/Components/ML/SprintDecomposeModal';
import { CheckSquare, Cpu, Calendar, Users, Paperclip, Mic, Send, Sparkles, Bot, Loader2, X } from 'lucide-react';

function QuickActionCard({ title, description, icon: Icon, badgeColor, onClick }) {
    const colorMap = {
        brand: 'bg-brand-10 dark:bg-brand-20 text-brand dark:text-brand-light border-brand-30',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
        sky: 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50',
        purple: 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50',
    };

    return (
        <button type="button" onClick={onClick} className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white/80 px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-brand hover:bg-white/95 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-brand/60 dark:hover:bg-slate-800/60">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${colorMap[badgeColor] || colorMap.brand}`}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0"><span className="font-heading block truncate text-sm font-bold text-gray-900 transition-colors group-hover:text-brand dark:text-slate-100 dark:group-hover:text-brand-light">{title}</span><span className="mt-0.5 block truncate text-[10px] text-gray-500 dark:text-slate-500">{description}</span></div>
            </div>
            <span className="shrink-0 text-lg font-bold text-gray-400 transition-colors group-hover:text-brand dark:text-slate-500 dark:group-hover:text-brand-light">+</span>
        </button>
    );
}

function deadlineDaysFromPrompt(prompt) {
    const match = prompt.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})\b/i);
    if (!match) return null;

    const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(match[1].toLowerCase());
    const deadline = new Date(Number(match[2]), month + 1, 0);
    return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86_400_000));
}

export default function TenantDashboard({ studio, projects = [] }) {
    const studioName = studio?.name || 'Pixel Play Studio';

    const [prompt, setPrompt] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
    const [messages, setMessages] = useState([]);
    const [generation, setGeneration] = useState(null);
    const [draftTasks, setDraftTasks] = useState(null);
    const [isPlanOpen, setIsPlanOpen] = useState(false);
    const abortRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, generation]);

    // Mock Active Tasks for Right Sidebar enriched with StudioSprint AI routing
    const mockActiveTasks = [
        {
            id: 101,
            title: 'Autonomous NPC AI Agent',
            classification: 'Model Training',
            estimatedHours: '40h',
            priority: 'CRITICAL',
            isCriticalPath: true,
            assignee: 'Alex Chen',
            gnnMatchScore: '96% Fit',
        },
        {
            id: 102,
            title: 'GNN Node Embedding Layer',
            classification: 'AI/ML Core',
            estimatedHours: '24h',
            priority: 'HIGH',
            isCriticalPath: true,
            assignee: 'Maya Lin',
            gnnMatchScore: '94% Fit',
        },
        {
            id: 103,
            title: 'Real-time CPA Scheduling Engine',
            classification: 'Algorithmic',
            estimatedHours: '32h',
            priority: 'HIGH',
            isCriticalPath: false,
            assignee: null,
            gnnMatchScore: null,
        },
        {
            id: 104,
            title: 'Tenant Isolation Path Validation',
            classification: 'Security',
            estimatedHours: '16h',
            priority: 'MEDIUM',
            isCriticalPath: false,
            assignee: 'Marcus Vance',
            gnnMatchScore: '89% Fit',
        },
        {
            id: 105,
            title: 'Telemetry & Token Usage Dashboard',
            classification: 'Analytics',
            estimatedHours: '12h',
            priority: 'LOW',
            isCriticalPath: false,
            assignee: null,
            gnnMatchScore: null,
        },
    ];

    const addAssistantMessage = (content) => {
        setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', content }]);
    };

    const handleQuickAction = (actionTitle) => {
        setPrompt(`StudioSprint AI, please help me ${actionTitle.toLowerCase()} for ${studioName}.`);
    };

    const handlePromptSubmit = async (e) => {
        e.preventDefault();
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt || !selectedProjectId || generation) return;

        const daysUntilDeadline = deadlineDaysFromPrompt(trimmedPrompt);
        const planningPrompt = daysUntilDeadline === null
            ? trimmedPrompt
            : `${trimmedPrompt}\n\nPlanning rule: The stated date is the overall delivery deadline, not the amount of work. Break the work into lean, AI-assisted tasks with realistic, efficient hour estimates.`;
        setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', content: trimmedPrompt }]);
        setPrompt('');
        setGeneration({ stage: 'intent', message: 'Reading your request and identifying the work involved.', pct: 10 });

        try {
            const controller = new AbortController();
            abortRef.current = controller;
            const response = await fetch('http://127.0.0.1:8001/api/llm/decompose-project/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: planningPrompt }),
                signal: controller.signal,
            });

            if (!response.ok) throw new Error(`AI service returned HTTP ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop() ?? '';

                events.filter(Boolean).forEach(eventText => {
                    const event = eventText.match(/^event:\s*(.+)$/m)?.[1] ?? 'message';
                    const data = eventText.match(/^data:\s*(.+)$/m)?.[1];
                    if (!data) return;
                    const payload = JSON.parse(data);
                    if (event === 'progress') setGeneration(payload);
                    if (event === 'done') {
                        const tasks = payload.tasks.map(task => ({
                            ...task,
                            ...(daysUntilDeadline === null ? {} : { days_until_deadline: daysUntilDeadline }),
                        }));
                        setGeneration(null);
                        if (tasks.length === 1) {
                            const singleTask = tasks[0];
                            addAssistantMessage(`Identified 1 simple task: "${singleTask.title}". Creating it immediately...`);
                            axios.post(route('tenant.projects.tasks.store', { tenant: studio.id, project: selectedProjectId }), {
                                title: singleTask.title,
                                description: singleTask.objective || singleTask.description || '',
                                assigned_user_id: null,
                                estimated_hours: singleTask.estimated_hours || 1.0,
                                priority: singleTask.priority || 'Medium',
                                status: 'todo',
                                depends_on: []
                            }).then(() => {
                                addAssistantMessage(`Successfully created task: "${singleTask.title}" and automatically computed the schedule.`);
                            }).catch(err => {
                                console.error(err);
                                addAssistantMessage(`Failed to save task: "${singleTask.title}".`);
                            });
                        } else {
                            setDraftTasks(tasks);
                            addAssistantMessage(`Your draft plan is ready with ${tasks.length} tasks. Review and edit it before adding it to the project.`);
                            setIsPlanOpen(true);
                        }
                    }
                    if (event === 'error') throw new Error(payload.message || 'The AI could not complete the plan.');
                });
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                addAssistantMessage(error.message || 'I could not create a plan just now. Please try again.');
            }
        } finally {
            abortRef.current = null;
            setGeneration(null);
        }
    };

    const cancelGeneration = () => abortRef.current?.abort();

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`AI Workspace — ${studioName}`} />

            {/* Sticky Header Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0 select-none">
                <h1 className="font-heading text-base font-bold text-gray-900 dark:text-slate-100">
                    Studio Workspace
                </h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => alert('StudioSprint Plan: Standard Account')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-heading font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm shadow-brand/15"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Upgrade</span>
                    </button>
                </div>
            </div>

            {/* Split Screen Container: Center Canvas + Right Sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* Center Canvas */}
                <div className="flex-1 flex flex-col justify-between overflow-y-auto relative p-6 sm:p-10 lg:p-12">
                    <div className={`mx-auto flex w-full max-w-3xl flex-1 flex-col py-6 ${messages.length === 0 && !generation ? 'justify-center' : 'justify-end'}`}>
                        <div className="min-h-[18rem] space-y-5 overflow-y-auto pr-1">
                            {messages.length === 0 && !generation && (
                                <div className="my-auto py-8">
                                    <div className="space-y-3 text-center">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-30 bg-brand-10 px-3 py-1 text-xs font-semibold text-brand shadow-sm dark:text-brand-light"><Sparkles className="h-3.5 w-3.5" />AI-Assisted Sprint Orchestration</div>
                                        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl lg:text-5xl">Welcome to {studioName}</h2>
                                        <p className="mx-auto max-w-xl text-sm text-gray-600 dark:text-gray-400 sm:text-base">Get started by creating a task or let the StudioSprint AI orchestrate your studio sprint.</p>
                                    </div>
                                    <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                                        <QuickActionCard title="Create Task" description="Define task requirements and deadlines." icon={CheckSquare} badgeColor="brand" onClick={() => handleQuickAction('Create Task')} />
                                        <QuickActionCard title="Run GNN Match" description="Recommend optimal developers based on GNN model." icon={Cpu} badgeColor="emerald" onClick={() => handleQuickAction('Run GNN Match')} />
                                        <QuickActionCard title="View Timeline" description="Explore interactive roadmaps and sprint milestones." icon={Calendar} badgeColor="sky" onClick={() => handleQuickAction('View Timeline')} />
                                        <QuickActionCard title="Manage Team" description="Assign developers and configure permission roles." icon={Users} badgeColor="purple" onClick={() => handleQuickAction('Manage Team')} />
                                    </div>
                                </div>
                            )}

                            {messages.map(message => (
                                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {message.role === 'assistant' && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Bot className="h-4 w-4" /></div>}
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-brand text-white' : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'}`}>{message.content}</div>
                                </div>
                            ))}

                            {generation && (
                                <div className="flex gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Bot className="h-4 w-4" /></div>
                                    <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-slate-100"><Loader2 className="h-4 w-4 animate-spin text-brand" /> Creating your task plan</div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{generation.message || 'Working on your request...'}</p>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700"><div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${generation.pct || 10}%` }} /></div>
                                        <div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-brand">{generation.stage === 'intent' ? 'Understanding scope' : generation.stage === 'llm' ? 'Drafting tasks' : 'Validating the plan'}</span><button type="button" onClick={cancelGeneration} className="inline-flex items-center gap-1 text-gray-400 hover:text-red-500"><X className="h-3 w-3" /> Cancel</button></div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {isPlanOpen && draftTasks && (
                        <SprintDecomposeModal
                            isOpen={isPlanOpen}
                            onClose={() => setIsPlanOpen(false)}
                            projectId={selectedProjectId}
                            tenantId={studio.id}
                            initialDraftTasks={draftTasks}
                            onSaveSuccess={() => router.visit(route('tenant.projects.show', { tenant: studio.id, project: selectedProjectId }))}
                        />
                    )}

                    {/* Agentic Chat Bar (Taller, rounded-2xl, dual-row layout) */}
                    <div className="sticky bottom-0 z-20 pt-4 pb-2 w-full max-w-3xl mx-auto">
                        <form
                            onSubmit={handlePromptSubmit}
                            className="flex flex-col gap-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-800 shadow-2xl p-2.5 focus-within:border-brand dark:focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/20 transition-all"
                        >
                            {/* Top row: Textarea & Send button */}
                            <div className="flex items-center gap-2">
                                <textarea
                                    rows="1"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ask the AI to schedule the next sprint or assign tasks..."
                                    maxLength="3000"
                                    className="flex-1 bg-transparent border-0 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:ring-0 resize-none min-h-[2.5rem] align-middle font-sans"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handlePromptSubmit(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!prompt.trim() || !selectedProjectId || generation}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-brand hover:bg-brand-dark text-white shadow-md shadow-brand/25 transition-all hover:scale-105 active:scale-95 self-center shrink-0 mr-1"
                                    title="Send Prompt"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Divider line */}
                            <div className="border-t border-gray-100 dark:border-slate-800/80 my-1"></div>

                            {/* Bottom row: Attach, Voice, Browse, Counter */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => alert('Attachment upload coming soon!')}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                                        title="Attach Sprint Doc or Spec"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>Attach</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => alert('Voice input coming soon!')}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                                        title="Voice Input Prompt"
                                    >
                                        <Mic className="w-3.5 h-3.5" />
                                        <span>Voice Message</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => alert('Prompt library coming soon!')}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                                        title="Browse Prompt Library"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Browse Prompts</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 pr-2">
                                    <select
                                        value={selectedProjectId}
                                        onChange={(event) => setSelectedProjectId(event.target.value)}
                                        className="max-w-[180px] bg-transparent text-[10px] font-semibold text-gray-500 outline-none dark:text-slate-400"
                                        aria-label="Project for AI tasks"
                                    >
                                        <option value="">Select project</option>
                                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                                    </select>
                                    <div className="text-[10px] font-mono text-gray-400 dark:text-slate-600 select-none">
                                        {prompt.length} / 3,000
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Sidebar Component: Active Sprint Tasks Feed */}
                <RightSidebar
                    tasks={mockActiveTasks}
                    onDraftNewTask={() =>
                        setPrompt(`StudioSprint AI, please draft a new sprint task for ${studioName} and run GNN developer routing.`)
                    }
                />
            </div>
        </TenantLayout>
    );
}
