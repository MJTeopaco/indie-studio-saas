import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProjectLayout from '@/Layouts/ProjectLayout';
import RightSidebar from '@/Components/Tenant/Projects/RightSidebar';
import {
    CheckSquare,
    Cpu,
    Calendar,
    Users,
    Paperclip,
    Mic,
    Send,
    MoreHorizontal,
    Plus,
    Sparkles,
    User,
} from 'lucide-react';

/**
 * Helper Component: QuickActionCard
 * Glassmorphic 2x2 action card with colorful soft icon badge.
 */
function QuickActionCard({ title, description, icon: Icon, badgeColor, onClick }) {
    const colorMap = {
        indigo: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
        sky: 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50',
        purple: 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50',
    };

    const activeBadgeClass = colorMap[badgeColor] || colorMap.indigo;

    return (
        <div
            onClick={onClick}
            className="group relative rounded-2xl bg-white/80 dark:bg-slate-800/50 backdrop-blur-md border border-gray-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
            <div className="flex items-center justify-between">
                <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${activeBadgeClass}`}
                >
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors">
                    Action
                </span>
            </div>

            <div className="mt-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {title}
                </h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {description}
                </p>
            </div>
        </div>
    );
}


export default function Show({ project, auth }) {
    const pageProps = usePage().props;
    const currentAuth = auth || pageProps.auth || { user: { name: 'Studio Member', role: 'manager' } };

    // Mock project data fallback
    const projectData = project || {
        id: 1,
        title: 'StudioSprint AI Recommendations Engine',
        description: 'Graph Neural Network matching model linking incoming studio tasks to optimal developers.',
    };

    const projectTitle = projectData.title || projectData.name || 'Untitled Project';

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
        setPrompt(`StudioSprint AI, please help me ${actionTitle.toLowerCase()} for ${projectTitle}.`);
    };

    const handlePromptSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        alert(`StudioSprint LLM Agent received: "${prompt}"`);
        setPrompt('');
    };

    return (
        <ProjectLayout auth={currentAuth} project={projectData}>
            <Head title={`Workspace — ${projectTitle}`} />

            {/* Split Screen Container: Center Canvas + Right Sidebar */}
            <div className="flex-1 flex overflow-hidden min-h-[calc(100vh-4rem)]">
                {/* Center Canvas */}
                <div className="flex-1 flex flex-col justify-between overflow-y-auto relative p-6 sm:p-10 lg:p-12">
                    <div className="max-w-4xl mx-auto w-full space-y-10 my-auto py-8">
                        {/* Header Area */}
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI-Assisted Sprint Orchestration</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                                Welcome to {projectTitle}
                            </h1>

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                                Get started by creating a task or let the StudioSprint AI orchestrate your sprint.
                            </p>
                        </div>

                        {/* Quick Actions (2x2 Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            <QuickActionCard
                                title="Create Task"
                                description="Define task requirements, proficiency matrix, and deadline."
                                icon={CheckSquare}
                                badgeColor="indigo"
                                onClick={() => handleQuickAction('Create Task')}
                            />
                            <QuickActionCard
                                title="Run GNN Match"
                                description="Rank and recommend optimal studio developers based on skill graph."
                                icon={Cpu}
                                badgeColor="emerald"
                                onClick={() => handleQuickAction('Run GNN Match')}
                            />
                            <QuickActionCard
                                title="View Timeline"
                                description="Explore interactive Gantt roadmaps and sprint milestones."
                                icon={Calendar}
                                badgeColor="sky"
                                onClick={() => handleQuickAction('View Timeline')}
                            />
                            <QuickActionCard
                                title="Manage Team"
                                description="Assign studio developers and configure role permissions."
                                icon={Users}
                                badgeColor="purple"
                                onClick={() => handleQuickAction('Manage Team')}
                            />
                        </div>
                    </div>

                    {/* Agentic Chat Bar (Bottom Floating Pinned) */}
                    <div className="sticky bottom-0 z-20 pt-4 pb-2 w-full max-w-3xl mx-auto">
                        <form
                            onSubmit={handlePromptSubmit}
                            className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200 dark:border-slate-700 shadow-2xl p-2 transition-all focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20"
                        >
                            {/* Left Icons: Attach & Voice */}
                            <div className="flex items-center gap-1 pl-2">
                                <button
                                    type="button"
                                    onClick={() => alert('Attachment upload coming soon!')}
                                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Attach Sprint Doc or Spec"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => alert('Voice input coming soon!')}
                                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Voice Input Prompt"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Main Prompt Input */}
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ask the AI to schedule the next sprint or assign tasks..."
                                className="flex-1 bg-transparent border-0 px-2 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0"
                            />

                            {/* Right Submit Button */}
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 transition-transform active:scale-95"
                                title="Send Prompt"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Sidebar Component: Active Sprint Tasks Feed */}
                <RightSidebar
                    tasks={mockActiveTasks}
                    onDraftNewTask={() =>
                        setPrompt(`StudioSprint AI, please draft a new sprint task for ${projectTitle} and run GNN developer routing.`)
                    }
                />
            </div>
        </ProjectLayout>
    );
}
