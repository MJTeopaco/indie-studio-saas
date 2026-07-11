import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import RightSidebar from '@/Components/Tenant/Projects/RightSidebar';
import {
    CheckSquare,
    Cpu,
    Calendar,
    Users,
    Paperclip,
    Mic,
    Send,
    Sparkles,
} from 'lucide-react';

/**
 * Helper Component: QuickActionCard
 * Refactored to a sleek horizontal flex row with a plus trigger, matching the reference layout.
 */
function QuickActionCard({ title, description, icon: Icon, badgeColor, onClick }) {
    const colorMap = {
        brand: 'bg-brand-10 dark:bg-brand-20 text-brand dark:text-brand-light border-brand-30',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
        sky: 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50',
        purple: 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50',
    };

    const activeBadgeClass = colorMap[badgeColor] || colorMap.brand;

    return (
        <div
            onClick={onClick}
            className="group relative flex items-center justify-between rounded-xl bg-white/80 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 hover:border-brand dark:hover:border-brand/60 px-4 py-3.5 shadow-sm hover:shadow-md hover:bg-white/95 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${activeBadgeClass}`}
                >
                    <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-heading text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                        {title}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-500 font-sans mt-0.5 line-clamp-1">
                        {description}
                    </span>
                </div>
            </div>
            <span className="text-gray-400 dark:text-slate-500 group-hover:text-brand dark:group-hover:text-brand-light font-bold text-lg select-none">
                +
            </span>
        </div>
    );
}

export default function TenantDashboard({ studio }) {
    const { activeWorkspace } = usePage().props;
    const studioName = studio?.name || 'Pixel Play Studio';

    // Agentic chat input state
    const [prompt, setPrompt] = useState('');

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

    const handleQuickAction = (actionTitle) => {
        setPrompt(`StudioSprint AI, please help me ${actionTitle.toLowerCase()} for ${studioName}.`);
    };

    const handlePromptSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        alert(`StudioSprint LLM Agent received: "${prompt}"`);
        setPrompt('');
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
                        onClick={() => alert('StudioSprint Plan: Standard Account')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-heading font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm shadow-brand/15"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Upgrade</span>
                    </button>
                </div>
            </div>

            {/* Split Screen Container: Center Canvas + Right Sidebar */}
            <div className="flex-grow flex overflow-hidden min-h-[calc(100vh-8.5rem)]">
                {/* Center Canvas */}
                <div className="flex-1 flex flex-col justify-between overflow-y-auto relative p-6 sm:p-10 lg:p-12">
                    <div className="max-w-4xl mx-auto w-full space-y-10 my-auto py-8">
                        {/* Header Area */}
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-10 text-brand dark:text-brand-light border border-brand-30 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI-Assisted Sprint Orchestration</span>
                            </div>

                            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                                Welcome to {studioName}
                            </h1>

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto font-sans">
                                Get started by creating a task or let the StudioSprint AI orchestrate your studio sprint.
                            </p>
                        </div>

                        {/* Quick Actions (2x2 Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            <QuickActionCard
                                title="Create Task"
                                description="Define task requirements and deadliness."
                                icon={CheckSquare}
                                badgeColor="brand"
                                onClick={() => handleQuickAction('Create Task')}
                            />
                            <QuickActionCard
                                title="Run GNN Match"
                                description="Recommend optimal developers based on GNN model."
                                icon={Cpu}
                                badgeColor="emerald"
                                onClick={() => handleQuickAction('Run GNN Match')}
                            />
                            <QuickActionCard
                                title="View Timeline"
                                description="Explore interactive roadmaps and sprint milestones."
                                icon={Calendar}
                                badgeColor="sky"
                                onClick={() => handleQuickAction('View Timeline')}
                            />
                            <QuickActionCard
                                title="Manage Team"
                                description="Assign developers and configure permission roles."
                                icon={Users}
                                badgeColor="purple"
                                onClick={() => handleQuickAction('Manage Team')}
                            />
                        </div>
                    </div>

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

                                <div className="text-[10px] font-mono text-gray-400 dark:text-slate-600 pr-2 select-none">
                                    {prompt.length} / 3,000
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
