import React, { useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import TenantLayout from '@/Layouts/TenantLayout';
import RightSidebar from '@/Components/Tenant/Projects/RightSidebar';
import HierarchicalDecompositionModal from '@/Components/ML/HierarchicalDecompositionModal';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
import CreateProjectModal from '@/Components/Tenant/Projects/CreateProjectModal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { showToast } from '@/Components/SystemToast';
import { useChatSessions } from '@/hooks/useChatSessions';
import { CheckSquare, Cpu, Calendar, Users, Paperclip, Mic, Send, Sparkles, Bot, X } from 'lucide-react';

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

function isTaskPlanningRequest(prompt) {
    return /\b(plan|create|build|implement|develop|design|schedule|break\s+down|decompose|add|make|set\s+up)\b[\s\S]*\b(task|tasks|feature|features|sprint|project|work|workflow|landing\s*page|page|website|web\s*app|application|app|game|platform|system)\b/i.test(prompt);
}

function isNewProjectRequest(prompt) {
    return /\b(create|build|make|start|develop|launch|set\s+up)\b[\s\S]*\b(project|website|web\s*app|application|app|game|platform|system|product|landing\s*page)\b/i.test(prompt);
}

function suggestedProjectName(prompt) {
    const match = prompt.match(/(?:project|website|app|game)\s+(?:called|named)\s+[“"']?([^“"'.!,\n]+)[”"']?/i)
        || prompt.match(/(?:create|build|make|start)\s+[“"']([^“"']+)[”"']/i);
    return match ? match[1].trim() : '';
}

export default function TenantDashboard({ studio, projects = [], activeTasks = [], skills = [], positions = [], teamMembers = [] }) {
    const { canManage } = usePage().props;
    const studioName = studio?.name || 'Pixel Play Studio';

    const [prompt, setPrompt] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [messages, setMessages] = useState([]);
    const [generation, setGeneration] = useState(null);

    const [isPlanOpen, setIsPlanOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isProjectCreationOpen, setIsProjectCreationOpen] = useState(false);
    const [pendingProjectPlan, setPendingProjectPlan] = useState(null);
    const [isTextareaFlashing, setIsTextareaFlashing] = useState(false);
    const abortRef = useRef(null);
    const chatEndRef = useRef(null);
    const promptTextareaRef = useRef(null);
    const isRestoringRef = useRef(false); // Bug 3 fix: suppresses auto-persist while loading a past session

    const {
        sessions,
        activeSessionId,
        isLoading: isSessionsLoading,
        startNewSession,
        selectSession,
        persistCurrentSession,
        deleteSession
    } = useChatSessions(studio.id);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, generation]);

    // Auto-persist on message changes
    // Bug 3 fix: skip persist entirely when messages were set by selectSession (not by the user)
    useEffect(() => {
        if (isRestoringRef.current) return;
        persistCurrentSession(messages);
    }, [messages, persistCurrentSession]);

    const handleNewChat = () => startNewSession(messages, !!generation, setMessages);
    const handleSelectChat = (id) => {
        // Bug 3 fix: signal to the auto-persist effect that the upcoming setMessages
        // call is a restore, not new user content — so it won't try to persist it
        isRestoringRef.current = true;
        selectSession(id, (loadedMessages) => {
            setMessages(loadedMessages);
            // Give React one tick to re-render before re-enabling persist
            setTimeout(() => { isRestoringRef.current = false; }, 50);
        });
    };
    const [chatToDelete, setChatToDelete] = useState(null);
    const [isDeletingChat, setIsDeletingChat] = useState(false);
    const [activeActionIntent, setActiveActionIntent] = useState(null);

    const handleDeleteChat = (id) => {
        setChatToDelete(id);
    };

    const confirmDeleteChat = async () => {
        if (!chatToDelete) return;
        setIsDeletingChat(true);
        try {
            await deleteSession(chatToDelete, messages, setMessages);
            showToast('Chat session deleted successfully.', 'info');
        } catch (error) {
            console.error('Failed to delete chat:', error);
            showToast('Failed to delete chat session.', 'error');
        } finally {
            setIsDeletingChat(false);
            setChatToDelete(null);
        }
    };



    const addAssistantMessage = (content) => {
        setMessages(current => [...current, { id: crypto.randomUUID(), role: 'assistant', content }]);
    };

    const handleQuickAction = (actionTitle) => {
        let template = '';
        
        if (actionTitle === 'Plan Sprint') {
            setActiveActionIntent('CREATE_TASK');
            template = `📝 Feature Breakdown Guide
Please fill in the details below. I will break this down into a complete set of tasks and sub-tasks for your team.

Create a task: [Task Title]

Goal: [What are we building, and why does it matter?]
Requirements: [Key things it must do]
Constraints: [Any technical limits — optional]
Done when: [Acceptance criteria — how we'll know it's finished]`;
        } else if (actionTitle === 'Suggest Assignees') {
            setActiveActionIntent(null);
            template = `Goal: Recommend optimal developer assignments for the unassigned tasks in the current sprint.

Context: Evaluate our team's current workload and run the Graph Neural Network (GNN) matching algorithm against our skill matrices. 

Focus Area: Please prioritize finding the best fit for tasks related to [Insert specific Epic, e.g., Backend API Integration or Frontend UI]. 

Expected Output: Provide the top 3 developer recommendations per task, including their matching confidence score, and highlight any resource deficits if we lack specific skills.`;
        } else if (actionTitle === 'Analyze Critical Path') {
            setActiveActionIntent(null);
            template = `Goal: Analyze the health and timeline of the current active sprint.

Context: Evaluate the task dependencies and estimated hours using our Critical Path logic.

Requirements:
1. Identify any bottlenecks or tasks with zero total float that could delay the sprint.
2. Flag any developers who are over-allocated based on the earliest start/latest finish times.
3. Suggest actionable schedule adjustments to ensure we hit our delivery deadline.`;
        } else if (actionTitle === 'Audit Skill Coverage') {
            setActiveActionIntent(null);
            template = `Goal: Audit our studio's current workforce profile and tech stack capabilities.

Context: We are planning to take on a new project heavily focused on [Insert Macro-Domain, e.g., Data Science / Game Dev]. 

Requirements:
1. Analyze our team's current proficiency levels in required micro-domains.
2. Identify any critical skill gaps or low-coverage areas that will lower our GNN matching scores.
3. Recommend specific upskilling areas or new hiring profiles needed to support this upcoming project.`;
        }
        
        setPrompt(template);
        
        setIsTextareaFlashing(true);
        setTimeout(() => setIsTextareaFlashing(false), 800);

        setTimeout(() => {
            if (promptTextareaRef.current) {
                promptTextareaRef.current.focus();
                const startBracketIdx = template.indexOf('[');
                const endBracketIdx = template.indexOf(']');
                if (startBracketIdx !== -1 && endBracketIdx !== -1 && endBracketIdx > startBracketIdx) {
                    promptTextareaRef.current.setSelectionRange(startBracketIdx, endBracketIdx + 1);
                }
            }
        }, 50);
    };

    const isTaskPlanningRequest = (text) => {
        const triggers = ['plan', 'break down', 'decompose', 'generate tasks', 'sprint', 'roadmap', 'schedule'];
        return triggers.some(t => text.toLowerCase().includes(t));
    };

    const isNewProjectRequest = (text) => {
        const triggers = ['new project', 'start a project', 'create a project', 'build a new'];
        return triggers.some(t => text.toLowerCase().includes(t));
    };

    const suggestedProjectName = (text) => {
        const titleMatch = text.match(/project (?:called|named|for) ["']?([^"'.]+)["']?/i);
        if (titleMatch) return titleMatch[1].trim();
        const firstSentence = text.split(/[.!?]/)[0];
        return firstSentence.length < 40 ? firstSentence : firstSentence.substring(0, 37) + '...';
    };

    const handlePromptSubmit = async (e) => {
        e.preventDefault();
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt || generation) return;

        setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', content: trimmedPrompt }]);
        setPrompt('');

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            let isPlanning = false;
            let isNewProject = false;

            if (activeActionIntent === 'CREATE_TASK') {
                isPlanning = true;
            } else {
                // Call backend semantic router
                setGeneration({ stage: 'chat', message: 'Analyzing request intent…', pct: 15 });
                const { data: intentData } = await axios.post(route('tenant.workspace.ai-router', { tenant: studio.id }), {
                    message: trimmedPrompt,
                }, { signal: controller.signal });

                if (intentData.intent === 'CREATE_TASK') {
                    isPlanning = true;
                } else if (intentData.intent === 'NEW_PROJECT') {
                    isNewProject = true;
                }
            }

            if (!isPlanning && !isNewProject) {
                setGeneration({ stage: 'chat', message: 'Preparing a response…', pct: 35 });
                const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
                const { data } = await axios.post(route('tenant.workspace.ai-assistant', { tenant: studio.id }), {
                    message: trimmedPrompt,
                    history,
                }, { signal: controller.signal });
                addAssistantMessage(data.reply || 'I could not answer that right now. Please try again.');
                setActiveActionIntent(null);
                return;
            }

            if (!canManage) {
                addAssistantMessage('Only studio managers are authorized to plan and create tasks or projects.');
                setActiveActionIntent(null);
                return;
            }

            if (isNewProject || selectedProjectId === '') {
                // New Project path
                setPendingProjectPlan({
                    description: trimmedPrompt,
                    name: suggestedProjectName(trimmedPrompt),
                });
                setIsProjectCreationOpen(true);
                addAssistantMessage('I’ll help you decompose this. Add a project name first, and then I will generate the Epic and Sprint breakdown.');
                setActiveActionIntent(null);
                return;
            } else {
                // Existing Project path
                setPendingProjectPlan({
                    description: trimmedPrompt,
                });
                setIsPlanOpen(true);
                addAssistantMessage('Opening the AI Project Decomposer to draft your tasks...');
                setActiveActionIntent(null);
            }
        } catch (error) {
            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
            addAssistantMessage(error.response?.data?.message || error.message || 'I could not respond just now. Please try again.');
        } finally {
            abortRef.current = null;
            setGeneration(null);
        }
    };

    const cancelGeneration = () => abortRef.current?.abort();

    const handleProjectCreated = (project) => {
        if (!pendingProjectPlan || !project) return;
        setSelectedProjectId(String(project.id));
        setIsPlanOpen(true);
        addAssistantMessage(`Created “${project.name}”. Opening the AI Project Decomposer...`);
    };

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
                        onClick={() => showToast('StudioSprint Plan: Standard Account', 'info')}
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
                                    <div className={`mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 ${canManage ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
                                        {canManage && (
                                            <>
                                                <QuickActionCard title="Plan Sprint" description="Break down an epic into sprint tasks." icon={CheckSquare} badgeColor="brand" onClick={() => handleQuickAction('Plan Sprint')} />
                                                <QuickActionCard title="Suggest Assignees" description="Recommend optimal developer assignments for tasks." icon={Cpu} badgeColor="emerald" onClick={() => handleQuickAction('Suggest Assignees')} />
                                            </>
                                        )}
                                        <QuickActionCard title="Analyze Critical Path" description="Analyze the health and timeline of the current sprint." icon={Calendar} badgeColor="sky" onClick={() => handleQuickAction('Analyze Critical Path')} />
                                        <QuickActionCard title="Audit Skill Coverage" description="Audit our studio's current workforce profile and tech stack." icon={Users} badgeColor="purple" onClick={() => handleQuickAction('Audit Skill Coverage')} />
                                    </div>
                                </div>
                            )}

                            {messages.map(message => (
                                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {message.role === 'assistant' && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}
                                    {message.role === 'user' ? (
                                        /* User bubble: plain text, preserve line breaks */
                                        <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-brand text-white">
                                            {message.content}
                                        </div>
                                    ) : (
                                        /* Assistant bubble: Bug 1 fix — render LLM Markdown with prose typography */
                                        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700">
                                            <div className="prose prose-sm dark:prose-invert max-w-none
                                                            prose-p:my-1 prose-headings:my-2 prose-headings:font-semibold
                                                            prose-ul:my-1 prose-ol:my-1 prose-li:my-0
                                                            prose-pre:my-2 prose-code:text-brand dark:prose-code:text-brand-light
                                                            prose-a:text-brand dark:prose-a:text-brand-light">
                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {generation && (
                                <div className="flex gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Bot className="h-4 w-4" /></div>
                                    <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700">
                                        <div className="flex items-center gap-3">
                                            {/* Typing-indicator dots */}
                                            <span className="flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <span
                                                        key={i}
                                                        className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce"
                                                        style={{ animationDelay: `${i * 150}ms` }}
                                                    />
                                                ))}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                                {generation.stage === 'chat' ? 'Preparing a response' : 'Creating your task plan'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{generation.message || 'Working on your request...'}</p>
                                        {/* Shimmer progress bar */}
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700 relative">
                                            <div
                                                className="h-full rounded-full bg-brand transition-all duration-700"
                                                style={{ width: `${generation.pct || 10}%` }}
                                            />
                                            <div className="absolute inset-0 animate-shimmer rounded-full opacity-40" />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[11px]">
                                            <span className="text-brand">{generation.stage === 'chat' ? 'Workspace conversation' : 'Drafting tasks'}</span>
                                            <button type="button" onClick={cancelGeneration} className="inline-flex items-center gap-1 text-gray-400 hover:text-red-500"><X className="h-3 w-3" /> Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {isPlanOpen && pendingProjectPlan && (
                        <HierarchicalDecompositionModal
                            isOpen={isPlanOpen}
                            onClose={() => {
                                setIsPlanOpen(false);
                                setPendingProjectPlan(null);
                            }}
                            projectId={selectedProjectId}
                            tenantId={studio.id}
                            teamMembers={teamMembers}
                            initialDescription={pendingProjectPlan.description}
                            autoStart={true}
                            onSaveSuccess={() => router.visit(route('tenant.projects.show', { tenant: studio.id, project: selectedProjectId }))}
                        />
                    )}

                    <CreateProjectModal
                        isOpen={isProjectCreationOpen}
                        onClose={() => {
                            setIsProjectCreationOpen(false);
                        }}
                        onCreated={handleProjectCreated}
                        initialTitle={pendingProjectPlan?.name || ''}
                        initialDescription={pendingProjectPlan?.description || ''}
                        planCount={pendingProjectPlan?.tasks?.length || 0}
                    />

                    {isTaskModalOpen && selectedProjectId && (
                        <ManualTaskModal
                            isOpen={isTaskModalOpen}
                            onClose={() => setIsTaskModalOpen(false)}
                            project={projects.find(p => Number(p.id) === Number(selectedProjectId))}
                            tenantId={studio.id}
                            teamMembers={teamMembers}
                            skills={skills}
                            positions={positions}
                        />
                    )}

                    {/* Agentic Chat Bar (Taller, rounded-2xl, dual-row layout) */}
                    <div className="sticky bottom-0 z-20 pt-4 pb-2 w-full max-w-3xl mx-auto">
                        <form
                            onSubmit={handlePromptSubmit}
                            className={`flex flex-col gap-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border ${isTextareaFlashing ? 'border-brand ring-4 ring-brand/30 bg-brand/5 dark:bg-brand/10 shadow-brand/20' : 'border-gray-200 dark:border-slate-800 shadow-2xl'} p-2.5 focus-within:border-brand dark:focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/20 transition-all duration-300`}
                        >
                            {/* Top row: Textarea & Send button */}
                            <div className="flex items-center gap-2">
                                <TextareaAutosize
                                    minRows={1}
                                    maxRows={10}
                                    ref={promptTextareaRef}
                                    value={prompt}
                                    onChange={(e) => {
                                        setPrompt(e.target.value);
                                        if (e.target.value.trim() === '') setActiveActionIntent(null);
                                    }}
                                    placeholder="Ask a question, or describe a task to create a plan…"
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
                                    disabled={!prompt.trim() || generation}
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
                                        onClick={() => showToast('Attachment upload coming soon!', 'info')}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                                        title="Attach Sprint Doc or Spec"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>Attach</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => showToast('Voice input coming soon!', 'info')}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                                        title="Voice Input Prompt"
                                    >
                                        <Mic className="w-3.5 h-3.5" />
                                        <span>Voice Message</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => showToast('Prompt library coming soon!', 'info')}
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
                                        <option value="">New Project</option>
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

                {/* Right Sidebar Component: AI Workspace Chat History */}
                <RightSidebar
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    isLoading={!!generation}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    onDeleteChat={handleDeleteChat}
                />
            </div>

            <ConfirmationModal
                isOpen={!!chatToDelete}
                onClose={() => setChatToDelete(null)}
                onConfirm={confirmDeleteChat}
                title="Delete Chat Session"
                message="Are you sure you want to delete this chat session? This action cannot be undone."
                confirmText="Delete Chat"
                cancelText="Keep Chat"
                variant="danger"
                isLoading={isDeletingChat}
            />
        </TenantLayout>
    );
}
