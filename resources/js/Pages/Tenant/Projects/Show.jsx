import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProjectLayout from '@/Layouts/ProjectLayout';
import {
    Plus,
    Sparkles,
    Search,
    Filter,
    MoreHorizontal,
    Clock,
    User,
    CheckCircle2,
    CircleDashed,
    AlertCircle,
    ArrowUpRight,
    Cpu,
} from 'lucide-react';
import KanbanCard from '@/Components/Tenant/KanbanCard';

export default function Show({ project, auth }) {
    const pageProps = usePage().props;
    const currentAuth = auth || pageProps.auth || { user: { name: 'Studio Member', role: 'manager' } };

    const projectData = project || {
        id: 1,
        name: 'Lumora: E-commerce website',
        title: 'Lumora: E-commerce website',
        description: 'e-commerce website for niche aesthetic products',
    };

    const projectTitle = projectData.name || projectData.title || 'Lumora: E-commerce website';

    // Kanban state with initial tasks divided into columns
    const [columns, setColumns] = useState([
        {
            id: 'backlog',
            title: 'Backlog',
            badgeClass: 'bg-gray-500/15 text-gray-400',
            tasks: [
                {
                    id: 105,
                    title: 'Telemetry & Token Usage Dashboard',
                    classification: 'Analytics',
                    estimatedHours: '12h',
                    priority: 'LOW',
                    assignee: null,
                    gnnMatchScore: null,
                },
                {
                    id: 106,
                    title: 'Stripe Checkout Webhook Resiliency',
                    classification: 'Payment Gateway',
                    estimatedHours: '18h',
                    priority: 'MEDIUM',
                    assignee: null,
                    gnnMatchScore: '91% Fit',
                },
            ],
        },
        {
            id: 'todo',
            title: 'To Do',
            badgeClass: 'bg-sky-500/15 text-sky-400',
            tasks: [
                {
                    id: 103,
                    title: 'Real-time CPA Scheduling Engine',
                    classification: 'Algorithmic',
                    estimatedHours: '32h',
                    priority: 'HIGH',
                    assignee: 'Alex Chen',
                    gnnMatchScore: '94% Fit',
                },
                {
                    id: 104,
                    title: 'Tenant Isolation Path Validation',
                    classification: 'Security',
                    estimatedHours: '16h',
                    priority: 'MEDIUM',
                    assignee: 'Marcus Vance',
                    gnnMatchScore: '89% Fit',
                },
            ],
        },
        {
            id: 'in_progress',
            title: 'In Progress',
            badgeClass: 'bg-brand/15 text-brand dark:text-brand-light',
            tasks: [
                {
                    id: 101,
                    title: 'Autonomous NPC AI Agent Core',
                    classification: 'Model Training',
                    estimatedHours: '40h',
                    priority: 'CRITICAL',
                    assignee: 'Alex Chen',
                    gnnMatchScore: '96% Fit',
                },
                {
                    id: 102,
                    title: 'GNN Node Embedding Layer',
                    classification: 'AI/ML Core',
                    estimatedHours: '24h',
                    priority: 'HIGH',
                    assignee: 'Maya Lin',
                    gnnMatchScore: '94% Fit',
                },
            ],
        },
        {
            id: 'review',
            title: 'In Review',
            badgeClass: 'bg-amber-500/15 text-amber-400',
            tasks: [
                {
                    id: 100,
                    title: 'Product Catalog GraphQL API Schema',
                    classification: 'Backend Architecture',
                    estimatedHours: '20h',
                    priority: 'HIGH',
                    assignee: 'Sarah Jenkins',
                    gnnMatchScore: '95% Fit',
                },
            ],
        },
        {
            id: 'done',
            title: 'Done',
            badgeClass: 'bg-emerald-500/15 text-emerald-400',
            tasks: [
                {
                    id: 99,
                    title: 'Initial Figma Design Token Extraction',
                    classification: 'UI/UX Design',
                    estimatedHours: '16h',
                    priority: 'MEDIUM',
                    assignee: 'Elena Rostova',
                    gnnMatchScore: '98% Fit',
                },
            ],
        },
    ]);

    const [searchQuery, setSearchQuery] = useState('');

    const handleAIOptimize = () => {
        alert('StudioSprint AI: Running GNN Graph Optimization to balance developer workload across columns!');
    };

    return (
        <ProjectLayout auth={currentAuth} project={projectData}>
            <Head title={`Kanban Board — ${projectTitle}`} />

            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
                {/* Kanban Toolbar Bar */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
                    {/* Left: Search & Filters */}
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search sprint tasks, assignees, or tags..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800/60 border border-transparent focus:border-brand text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleAIOptimize}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-10 hover:bg-brand-20 text-brand dark:text-brand-light border border-brand-30 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 text-brand" />
                            <span>AI Balance Board</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => alert('Add Task modal coming soon!')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-light text-white shadow-sm shadow-brand/20 transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Task</span>
                        </button>
                    </div>
                </div>

                {/* Kanban Board Columns Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div className="flex gap-5 h-full min-w-max pb-2">
                        {columns.map((column) => {
                            const filteredTasks = column.tasks.filter((t) =>
                                searchQuery
                                    ? t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      (t.assignee && t.assignee.toLowerCase().includes(searchQuery.toLowerCase()))
                                    : true
                            );

                            return (
                                <div
                                    key={column.id}
                                    className="w-80 flex flex-col rounded-2xl bg-gray-100/70 dark:bg-slate-900/50 border border-gray-200/80 dark:border-slate-800/80 max-h-full overflow-hidden"
                                >
                                    {/* Column Header */}
                                    <div className="px-4 py-3.5 border-b border-gray-200/60 dark:border-slate-800/80 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-slate-200">
                                                {column.title}
                                            </h3>
                                            <span
                                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${column.badgeClass}`}
                                            >
                                                {filteredTasks.length}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => alert(`Add task to ${column.title}`)}
                                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-200/60 dark:hover:bg-slate-800 transition-colors"
                                            title="Add task to column"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Cards Scrollable Area */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700">
                                        {filteredTasks.map((task) => (
                                            <KanbanCard key={task.id} task={task} />
                                        ))}

                                        {filteredTasks.length === 0 && (
                                            <div className="py-12 text-center rounded-xl border border-dashed border-gray-300 dark:border-slate-800">
                                                <p className="text-xs text-gray-400 dark:text-slate-600">
                                                    No tasks in {column.title}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </ProjectLayout>
    );
}
