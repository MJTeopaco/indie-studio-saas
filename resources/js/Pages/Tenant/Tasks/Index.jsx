import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import BoardView    from '@/Components/Tenant/Tasks/BoardView';
import ListView     from '@/Components/Tenant/Tasks/ListView';
import TimelineView from '@/Components/Tenant/Tasks/TimelineView';
import DueView      from '@/Components/Tenant/Tasks/DueView';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';

// ── Inline Icons ──────────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);
const ImportIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const ChevronDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const EmptyBoxIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ── View Tab Config ───────────────────────────────────────────────────────────
const VIEWS = [
    { key: 'board',    label: 'Board' },
    { key: 'list',     label: 'List' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'due',      label: 'Due Tasks' },
];

export default function TasksIndex({ studio, projects = [], tasks = {} }) {
    const { activeWorkspace } = usePage().props;

    // Active view tab
    const [activeView, setActiveView] = useState('board');

    // Selected project state
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

    // Search query
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states for updating task status
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    // Local tasks map state for optimistic UI updates
    const [localTasksMap, setLocalTasksMap] = useState(tasks);

    useEffect(() => {
        setLocalTasksMap(tasks);
    }, [tasks]);

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setTaskModalOpen(true);
    };

    const handleStatusChange = (task, newStatus) => {
        // Optimistically update status locally
        setLocalTasksMap(prev => {
            const copy = { ...prev };
            const projectList = copy[task.project_id] || [];
            copy[task.project_id] = projectList.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
            return copy;
        });

        router.patch(
            route('tenant.projects.tasks.update', {
                tenant: activeWorkspace,
                project: task.project_id,
                task: task.id
            }),
            { status: newStatus },
            {
                preserveScroll: true,
                onError: (errors) => {
                    console.error('Failed to update status', errors);
                    // Rollback on error
                    setLocalTasksMap(tasks);
                }
            }
        );
    };

    // Initialize selected project ID on mount or projects prop change
    useEffect(() => {
        if (projects.length > 0 && selectedProjectId === null) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects]);

    const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

    // Filter tasks for the selected project
    const rawProjectTasks = selectedProjectId ? (localTasksMap[selectedProjectId] || []) : [];
    const projectTasks = rawProjectTasks.filter(task =>
        searchQuery
            ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (task.assignee && task.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (task.task_classification && task.task_classification.toLowerCase().includes(searchQuery.toLowerCase()))
            : true
    );

    return (
        <TenantLayout>
            <Head title={selectedProject ? `Tasks — ${selectedProject.name}` : "Tasks"} />

            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">

                {/* ── Top Bar ── */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800/80 shrink-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left: Project selector + Title */}
                        <div className="flex items-center gap-3">
                            {projects.length > 0 ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setProjectDropdownOpen(p => !p)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all max-w-[280px]"
                                    >
                                        <span className="truncate">{selectedProject?.name}</span>
                                        <ChevronDownIcon />
                                    </button>
                                    {projectDropdownOpen && (
                                        <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[260px]">
                                            {projects.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => { setSelectedProjectId(p.id); setProjectDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${p.id === selectedProjectId ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <span className="block font-medium truncate">{p.name}</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">{p.status}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <h1 className="text-base font-bold text-gray-400 dark:text-slate-500">No Projects</h1>
                            )}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            {projects.length > 0 && (
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
                                        <SearchIcon />
                                    </span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search tasks..."
                                        className="pl-9 pr-4 py-2 w-48 rounded-xl bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-indigo-400 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none transition-all"
                                    />
                                </div>
                            )}

                            {selectedProjectId && (
                                <Link
                                    href={route('tenant.projects.show', { tenant: activeWorkspace, project: selectedProjectId })}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                                >
                                    <PlusIcon /> Manage Tasks
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Empty State for Projects ── */}
                {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-slate-950">
                        <div className="text-gray-300 dark:text-slate-700 mb-4">
                            <EmptyBoxIcon />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">No Projects Found</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
                            Create your first project to organize tasks, assign developers, and start planning sprints.
                        </p>
                        <Link
                            href={route('tenant.projects.index', { tenant: activeWorkspace })}
                            className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md"
                        >
                            Go to Projects
                        </Link>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* ── Inline Viewing Options & Control Area (Outside navbar, in components area) ── */}
                        <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800/50 bg-gray-50/50 dark:bg-slate-900/10 flex items-center justify-between shrink-0">
                            {/* View Tabs */}
                            <div className="flex items-center bg-gray-200/60 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
                                {VIEWS.map(v => (
                                    <button
                                        key={v.key}
                                        onClick={() => setActiveView(v.key)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                                            activeView === v.key
                                                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>

                            <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                                Showing {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* ── Main View Content area ── */}
                        <div className="flex-1 overflow-y-auto">
                            {projectTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="text-gray-300 dark:text-slate-800 mb-3">
                                        <EmptyBoxIcon />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">No Tasks Available</h3>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
                                        {searchQuery ? "No tasks match your search query." : "There are currently no tasks defined for this project workspace."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {activeView === 'board'    && <BoardView    tasks={projectTasks} onTaskClick={handleTaskClick} onStatusChange={handleStatusChange} />}
                                    {activeView === 'list'     && <ListView     tasks={projectTasks} onTaskClick={handleTaskClick} />}
                                    {activeView === 'timeline' && <TimelineView tasks={projectTasks} onTaskClick={handleTaskClick} />}
                                    {activeView === 'due'      && <DueView      tasks={projectTasks} onTaskClick={handleTaskClick} />}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Close project dropdown on outside click */}
            {projectDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
            )}

            {/* Modal for updating and completing a task (accessible to both managers and members) */}
            {taskModalOpen && selectedTask && (
                <ManualTaskModal
                    isOpen={taskModalOpen}
                    onClose={() => { setTaskModalOpen(false); setSelectedTask(null); }}
                    project={projects.find(p => p.id === selectedTask.project_id) || selectedProject}
                    editingTask={selectedTask}
                    tenantId={activeWorkspace}
                />
            )}
        </TenantLayout>
    );
}
