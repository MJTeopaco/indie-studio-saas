import React from 'react';
import {
    MoreHorizontal,
    Sparkles,
    AlertCircle,
    Flame,
    Bot,
    UserPlus,
} from 'lucide-react';

/**
 * PinnedActionCard Subcomponent
 * Pinned "Draft New Task" card with dashed border, faint translucent background, and AI sparkles.
 */
function PinnedActionCard({ onDraftNewTask }) {
    return (
        <div
            onClick={onDraftNewTask}
            className="group cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/30 hover:bg-gray-100/80 hover:dark:bg-slate-800/50 p-3.5 transition-all duration-200 active:scale-[0.99]"
        >
            <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">
                    Draft New Task
                </span>
            </div>
        </div>
    );
}

/**
 * TaskSidebarCard Subcomponent
 * Sleek task card with ultra-soft corners, priority pill badge, Critical Path indicator,
 * and Graph Neural Network (GNN) match scoring.
 */
function TaskSidebarCard({ task }) {
    const normalizePriority = (priorityStr) => {
        const p = (priorityStr || '').toUpperCase();
        if (p === 'CRITICAL') return 'CRITICAL';
        if (p === 'HIGH') return 'HIGH';
        if (p === 'MEDIUM') return 'MEDIUM';
        return 'LOW';
    };

    const priorityKey = normalizePriority(task.priority);

    const priorityBadgeStyles = {
        LOW: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50',
        MEDIUM: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50',
        HIGH: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50',
        CRITICAL: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50',
    };

    const priorityBadgeClass = priorityBadgeStyles[priorityKey] || priorityBadgeStyles.LOW;

    // Resolve initials
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const assigneeName = typeof task.assignee === 'object' ? task.assignee?.name : task.assignee;
    const assigneeInitials =
        typeof task.assignee === 'object' && task.assignee?.initials
            ? task.assignee.initials
            : getInitials(assigneeName);

    const classificationText = task.classification || task.domain || 'Engineering';
    const estimatedHoursText = task.estimatedHours || task.hours || '8h';

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-800/60 p-4 ring-1 ring-gray-200/80 dark:ring-white/5 hover:dark:bg-slate-800/80 hover:ring-gray-300 dark:hover:ring-white/10 hover:shadow-md transition-all duration-200">
            {/* Title */}
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate" title={task.title}>
                {task.title}
            </h4>

            {/* Metadata Flex Row */}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 truncate">
                <span className="truncate">{classificationText}</span>
                <span className="flex-shrink-0 text-gray-400 dark:text-slate-600">•</span>
                <span className="flex-shrink-0">{estimatedHoursText}</span>
            </div>

            {/* Footer Flex Row */}
            <div className="mt-3 flex items-center justify-between gap-2">
                {/* Left: Priority Badge & Critical Path Indicator */}
                <div className="flex items-center gap-1.5">
                    <span
                        className={`rounded-full text-[10px] px-2 py-0.5 font-bold tracking-wide uppercase ${priorityBadgeClass}`}
                    >
                        {priorityKey}
                    </span>

                    {task.isCriticalPath && (
                        <div
                            className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400"
                            title="On Critical Path (CPA Schedule)"
                        >
                            <Flame className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                    )}
                </div>

                {/* Right: Assignee & GNN Match Score */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {assigneeName ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-[10px] font-bold">
                                {assigneeInitials}
                            </div>
                            {task.gnnMatchScore && (
                                <span
                                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                                    title="Graph Neural Network (GNN) Developer Fit Score"
                                >
                                    {typeof task.gnnMatchScore === 'number'
                                        ? `${task.gnnMatchScore}% Fit`
                                        : task.gnnMatchScore}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-slate-400"
                            title="Unassigned — Needs AI routing"
                        >
                            <Bot className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span>Unassigned</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * RightSidebar Main Component
 * Modern, minimalist, scrollable feed of sprint tasks for StudioSprint Project Workspace.
 */
export default function RightSidebar({ tasks = [], onDraftNewTask }) {
    // Default StudioSprint tasks if none passed
    const defaultTasks = [
        {
            id: 1,
            title: 'Autonomous NPC AI Agent',
            classification: 'Model Training',
            estimatedHours: '40h',
            priority: 'CRITICAL',
            isCriticalPath: true,
            assignee: 'Alex Chen',
            gnnMatchScore: '96% Fit',
        },
        {
            id: 2,
            title: 'GNN Node Embedding Layer',
            classification: 'AI/ML Core',
            estimatedHours: '24h',
            priority: 'HIGH',
            isCriticalPath: true,
            assignee: 'Maya Lin',
            gnnMatchScore: '94% Fit',
        },
        {
            id: 3,
            title: 'Real-time CPA Scheduling Engine',
            classification: 'Algorithmic',
            estimatedHours: '32h',
            priority: 'HIGH',
            isCriticalPath: false,
            assignee: null, // Unassigned
            gnnMatchScore: null,
        },
        {
            id: 4,
            title: 'Tenant Isolation Path Validation',
            classification: 'Security',
            estimatedHours: '16h',
            priority: 'MEDIUM',
            isCriticalPath: false,
            assignee: 'Marcus Vance',
            gnnMatchScore: '89% Fit',
        },
        {
            id: 5,
            title: 'Telemetry & Token Usage Dashboard',
            classification: 'Analytics',
            estimatedHours: '12h',
            priority: 'LOW',
            isCriticalPath: false,
            assignee: null, // Unassigned
            gnnMatchScore: null,
        },
    ];

    const displayTasks = tasks && tasks.length > 0 ? tasks : defaultTasks;

    const handleDraftNewTask = () => {
        if (onDraftNewTask) {
            onDraftNewTask();
        } else {
            alert('StudioSprint AI: Opening Agentic Task Drafter...');
        }
    };

    return (
        <aside className="w-80 lg:w-96 border-l border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/50 hidden lg:flex flex-col flex-shrink-0 h-full">
            {/* Sidebar Header */}
            <div className="p-6 pb-2 flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-200">
                    Active Sprint Tasks
                </h3>

                <button
                    type="button"
                    title="More options"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable List Container */}
            <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6 space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Pinned "Draft New Task" Card */}
                <PinnedActionCard onDraftNewTask={handleDraftNewTask} />

                {/* Task Cards */}
                {displayTasks.map((task) => (
                    <TaskSidebarCard key={task.id} task={task} />
                ))}
            </div>
        </aside>
    );
}
