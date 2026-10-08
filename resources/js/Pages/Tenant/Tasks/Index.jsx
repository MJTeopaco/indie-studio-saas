import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import BoardView    from '@/Components/Tenant/Tasks/BoardView';
import ListView     from '@/Components/Tenant/Tasks/ListView';
import TimelineView from '@/Components/Tenant/Tasks/TimelineView';
import DueView      from '@/Components/Tenant/Tasks/DueView';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
import MemberTaskDetailModal from '@/Components/Tenant/Tasks/MemberTaskDetailModal';
import { Plus, Search, ChevronDown, PackageX, SlidersHorizontal } from 'lucide-react';

// ── View Tab Config ───────────────────────────────────────────────────────────
const VIEWS = [
    { key: 'board',    label: 'Board' },
    { key: 'list',     label: 'List' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'due',      label: 'Due Tasks' },
];

export default function TasksIndex({ studio, projects = [], tasks = {}, isManager = false }) {
    const { activeWorkspace, canManage = false } = usePage().props;
    const hasManagerRights = isManager || Boolean(canManage);

    // Active view tab
    const [activeView, setActiveView] = useState('board');

    // Selected project state
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

    // Search query for tasks within selected project
    const [searchQuery, setSearchQuery] = useState('');

    // Local task modal state
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    // Keep an internal mutable copy of tasks for immediate optimistic status changes
    const [localTasksMap, setLocalTasksMap] = useState(tasks);

    useEffect(() => {
        setLocalTasksMap(tasks);
    }, [tasks]);

    // Default to the first available project
    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0] || null;

    // Filter tasks for the selected project
    const rawProjectTasks = selectedProjectId ? (localTasksMap[selectedProjectId] || []) : [];
    const projectTasks = rawProjectTasks.filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (t.title && t.title.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.assignee && t.assignee.name && t.assignee.name.toLowerCase().includes(q))
        );
    });

    // Callback when clicking a card/row to view details or edit
    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setTaskModalOpen(true);
    };

    // Callback when moving cards in BoardView
    const handleStatusChange = (task, newStatus) => {
        const sprintStatusMap = {
            todo: 'ready_to_start',
            in_progress: 'in_progress',
            review: 'waiting_for_review',
            completed: 'done',
            stuck: 'stuck',
        };
        const newSprintStatus = sprintStatusMap[newStatus] || newStatus;

        // Optimistic UI update
        setLocalTasksMap(prev => {
            const copy = { ...prev };
            const projectList = copy[task.project_id] || [];
            copy[task.project_id] = projectList.map(t =>
                t.id === task.id ? { ...t, status: newStatus, sprint_status: newSprintStatus } : t
            );
            return copy;
        });

        // Backend PATCH request
        router.patch(
            route('tenant.projects.tasks.update', {
                tenant: activeWorkspace,
                project: task.project_id,
                task: task.id,
            }),
            {
                status: newStatus,
                sprint_status: newSprintStatus,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    setLocalTasksMap(tasks);
                },
            }
        );
    };

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title={selectedProject ? `Tasks — ${selectedProject.name}` : "Tasks"} />

            <div className="flex-1 flex flex-col overflow-hidden bg-surface text-text-primary">

                {/* ── Top Bar ── */}
                <div className="px-6 py-4 bg-surface-elevated border-b border-surface-border shrink-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left: Project selector + Title */}
                        <div className="flex items-center gap-3">
                            {projects.length > 0 ? (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setProjectDropdownOpen(p => !p)}
                                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-surface-border text-sm font-bold text-text-primary hover:border-brand/50 transition-all max-w-[280px] focus-ring cursor-pointer"
                                    >
                                        <span className="truncate">{selectedProject?.name}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                                    </button>
                                    {projectDropdownOpen && (
                                        <div className="absolute left-0 top-full mt-1.5 z-50 bg-surface-elevated border border-surface-border rounded-xl shadow-xl overflow-hidden min-w-[260px] animate-in fade-in-50 zoom-in-95 duration-150">
                                            {projects.map(p => (
                                                <button
                                                    type="button"
                                                    key={p.id}
                                                    onClick={() => { setSelectedProjectId(p.id); setProjectDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ${p.id === selectedProjectId ? 'bg-brand/10 text-brand font-semibold' : 'text-text-primary hover:bg-surface'}`}
                                                >
                                                    <span className="block font-medium truncate">{p.name}</span>
                                                    <span className="text-[10px] text-text-muted capitalize">{p.status}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <h1 className="text-base font-bold text-text-muted">No Projects</h1>
                            )}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            {projects.length > 0 && (
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                        <Search className="w-3.5 h-3.5" />
                                    </span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search tasks..."
                                        className="pl-9 pr-4 py-1.5 w-48 sm:w-60 rounded-xl bg-surface border border-surface-border focus-ring text-xs text-text-primary placeholder-text-muted transition-all"
                                    />
                                </div>
                            )}

                            {selectedProjectId && (
                                <Link
                                    href={route('tenant.projects.show', { tenant: activeWorkspace, project: selectedProjectId })}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-light shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] focus-ring"
                                >
                                    {hasManagerRights ? (
                                        <>
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Manage Tasks</span>
                                        </>
                                    ) : (
                                        <span>Project Details</span>
                                    )}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Empty State for Projects ── */}
                {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface">
                        <div className="text-text-muted mb-4 opacity-40">
                            <PackageX className="w-12 h-12" />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">No Projects Found</h2>
                        <p className="text-sm text-text-muted mt-1 max-w-sm">
                            Create your first project to organize tasks, assign developers, and start planning sprints.
                        </p>
                        <Link
                            href={route('tenant.projects.index', { tenant: activeWorkspace })}
                            className="mt-5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-light transition-all shadow-2xs focus-ring"
                        >
                            Go to Projects
                        </Link>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* ── Inline Viewing Options ── */}
                        <div className="px-6 py-3 border-b border-surface-border bg-surface-elevated/50 flex items-center justify-between shrink-0">
                            {/* View Tabs */}
                            <div className="flex items-center bg-surface rounded-xl p-1 gap-1 border border-surface-border">
                                {VIEWS.map(v => (
                                    <button
                                        type="button"
                                        key={v.key}
                                        onClick={() => setActiveView(v.key)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer focus-ring ${
                                            activeView === v.key
                                                ? 'bg-brand text-white shadow-2xs'
                                                : 'text-text-muted hover:text-text-primary'
                                        }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>

                            <span className="text-xs text-text-muted font-medium font-mono">
                                Showing {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* ── Main View Content area ── */}
                        <div className="flex-1 overflow-y-auto">
                            {projectTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="text-text-muted mb-3 opacity-40">
                                        <PackageX className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-sm font-bold text-text-primary">No Tasks Available</h3>
                                    <p className="text-xs text-text-muted mt-1 max-w-xs">
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
                <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} aria-hidden="true" />
            )}

            {/* Modal for updating task */}
            {taskModalOpen && selectedTask && (
                hasManagerRights ? (
                    <ManualTaskModal
                        isOpen={taskModalOpen}
                        onClose={() => { setTaskModalOpen(false); setSelectedTask(null); }}
                        project={projects.find(p => p.id === selectedTask.project_id) || selectedProject}
                        editingTask={selectedTask}
                        tenantId={activeWorkspace}
                    />
                ) : (
                    <MemberTaskDetailModal
                        isOpen={taskModalOpen}
                        onClose={() => { setTaskModalOpen(false); setSelectedTask(null); }}
                        task={selectedTask}
                        tenantId={activeWorkspace}
                        currentUserId={usePage().props.auth?.user?.id}
                        onTaskUpdated={(updatedTask) => {
                            setLocalTasksMap(prev => {
                                const copy = { ...prev };
                                const projectList = copy[updatedTask.project_id] || [];
                                copy[updatedTask.project_id] = projectList.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t);
                                return copy;
                            });
                        }}
                    />
                )
            )}
        </TenantLayout>
    );
}
