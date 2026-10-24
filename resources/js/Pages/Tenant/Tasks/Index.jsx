import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import BoardView    from '@/Components/Tenant/Tasks/BoardView';
import ListView     from '@/Components/Tenant/Tasks/ListView';
import TimelineView from '@/Components/Tenant/Tasks/TimelineView';
import DueView      from '@/Components/Tenant/Tasks/DueView';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
import MemberTaskDetailModal from '@/Components/Tenant/Tasks/MemberTaskDetailModal';
import TaskFlyoutInspector from '@/Components/Tenant/Tasks/TaskFlyoutInspector';
import { Search, ChevronDown, PackageX, Plus, Filter } from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

// ── View Tab Config ───────────────────────────────────────────────────────────
const VIEWS = [
    { key: 'board',    label: 'Board' },
    { key: 'list',     label: 'List' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'due',      label: 'Due Tasks' },
];

const PRIORITIES = [
    { key: 'all',      label: 'All Priorities' },
    { key: 'critical', label: 'Critical' },
    { key: 'high',     label: 'High' },
    { key: 'medium',   label: 'Medium' },
    { key: 'low',      label: 'Low' },
];

export default function TasksIndex({ studio, projects = [], tasks = {}, isManager = false }) {
    const { activeWorkspace, canManage = false } = usePage().props;
    const hasManagerRights = isManager || Boolean(canManage);

    // Active view tab (default to timeline if navigated for timeline, else board)
    const [activeView, setActiveView] = useState('board');

    // Selected project state: 'all' or a project id
    const [selectedProjectId, setSelectedProjectId] = useState('all');
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

    // Selected priority filter
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

    // Search query for tasks
    const [searchQuery, setSearchQuery] = useState('');

    // Local task modal state
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    // Keep an internal mutable copy of tasks for immediate optimistic status changes
    const [localTasksMap, setLocalTasksMap] = useState(tasks);

    useEffect(() => {
        setLocalTasksMap(tasks);
    }, [tasks]);

    // Real-time task status sync across team members via WebSocket
    useEffect(() => {
        const studioId = studio?.id || activeWorkspace?.id;
        if (!studioId || typeof window === 'undefined' || !window.Echo) return;

        const channel = window.Echo.private(`studio.${studioId}`);
        channel.listen('.task.status.updated', (data) => {
            if (data?.taskId && data?.status) {
                setLocalTasksMap(prev => {
                    const next = { ...prev };
                    Object.keys(next).forEach(projId => {
                        next[projId] = (next[projId] || []).map(t => {
                            if (t.id === data.taskId) {
                                return { ...t, status: data.status, ...(data.task || {}) };
                            }
                            return t;
                        });
                    });
                    return next;
                });
                setSelectedTask(prev => {
                    if (prev && prev.id === data.taskId) {
                        return { ...prev, status: data.status, ...(data.task || {}) };
                    }
                    return prev;
                });
            }
        });

        return () => {
            channel.stopListening('.task.status.updated');
        };
    }, [studio?.id, activeWorkspace?.id]);

    const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

    // Aggregate tasks based on project selection
    const rawTasks = useMemo(() => {
        if (!selectedProjectId || selectedProjectId === 'all') {
            return Object.values(localTasksMap).flat();
        }
        return localTasksMap[selectedProjectId] || [];
    }, [localTasksMap, selectedProjectId]);

    // Filter tasks based on search and priority
    const filteredTasks = useMemo(() => {
        return rawTasks.filter(t => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const assigneeName = typeof t.assignee === 'string' 
                    ? t.assignee 
                    : (t.assignee?.name || '');
                const matches = (
                    (t.title && t.title.toLowerCase().includes(q)) ||
                    (t.description && t.description.toLowerCase().includes(q)) ||
                    (t.task_key && t.task_key.toLowerCase().includes(q)) ||
                    (t.project_name && t.project_name.toLowerCase().includes(q)) ||
                    (assigneeName && assigneeName.toLowerCase().includes(q))
                );
                if (!matches) return false;
            }

            if (selectedPriority && selectedPriority !== 'all') {
                if (t.priority?.toLowerCase() !== selectedPriority.toLowerCase()) {
                    return false;
                }
            }

            return true;
        });
    }, [rawTasks, searchQuery, selectedPriority]);

    // Open task details drawer sheet
    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    // Open task creation modal
    const handleNewTask = () => {
        setSelectedTask(null);
        setTaskModalOpen(true);
    };

    // Inline update handler for Task Details Drawer
    const handleUpdateTask = (taskId, patch) => {
        const sprintStatusMap = {
            todo: 'ready_to_start',
            in_progress: 'in_progress',
            review: 'waiting_for_review',
            completed: 'done',
            stuck: 'stuck',
            overdue: 'overdue',
        };
        const augmentedPatch = { ...patch };
        if (patch.status && !patch.sprint_status && sprintStatusMap[patch.status]) {
            augmentedPatch.sprint_status = sprintStatusMap[patch.status];
        }

        setLocalTasksMap(prev => {
            const copy = { ...prev };
            for (const pid of Object.keys(copy)) {
                copy[pid] = copy[pid].map(t =>
                    t.id === taskId ? { ...t, ...augmentedPatch } : t
                );
            }
            return copy;
        });

        if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(prev => prev ? { ...prev, ...augmentedPatch } : null);
        }

        const targetProject = selectedTask?.project_id || projects[0]?.id;
        if (targetProject) {
            router.patch(
                route('tenant.projects.tasks.update', {
                    tenant: activeWorkspace,
                    project: targetProject,
                    task: taskId,
                }),
                augmentedPatch,
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: (errors) => {
                        setLocalTasksMap(tasks);
                        const msg = typeof errors === 'string'
                            ? errors
                            : Object.values(errors || {})[0] || 'Failed to update task';
                        showToast(msg, 'error');
                    },
                }
            );
        }
    };

    // Callback when moving cards in BoardView
    const handleStatusChange = (task, newStatus) => {
        const sprintStatusMap = {
            todo: 'ready_to_start',
            in_progress: 'in_progress',
            review: 'waiting_for_review',
            completed: 'done',
            stuck: 'stuck',
            overdue: 'overdue',
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
                onError: (errors) => {
                    setLocalTasksMap(tasks);
                    const msg = typeof errors === 'string'
                        ? errors
                        : Object.values(errors || {})[0] || 'Failed to update task position';
                    showToast(msg, 'error');
                },
            }
        );
    };

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title={selectedProject ? `Tasks — ${selectedProject.name}` : "All Tasks"} />

            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden bg-surface text-text-primary custom-scrollbar">

                {/* ── Page Header: All Tasks + Subtitle + New Task CTA ── */}
                <div className="sticky top-0 z-20 px-6 pt-5 pb-4 bg-surface-elevated/95 backdrop-blur-md border-b border-surface-border shrink-0 shadow-2xs">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Title and Subtitle */}
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-slate-100 tracking-tight font-heading">
                                {selectedProject ? selectedProject.name : 'All Tasks'}
                            </h1>
                            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                                {selectedProject 
                                    ? (selectedProject.description || 'Every task in this project workspace.') 
                                    : 'Every task. Every project. One clear view.'}
                            </p>
                        </div>

                        {/* Top Right Action: + New task */}
                        {hasManagerRights && projects.length > 0 && (
                            <button
                                type="button"
                                onClick={handleNewTask}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-light text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer focus-ring"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Task</span>
                            </button>
                        )}
                    </div>

                    {/* ── Filter Toolbar ── */}
                    <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                        {/* Left: View Switcher Segmented Pills */}
                        <div className="flex items-center bg-surface dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl p-1 gap-1 shadow-2xs">
                            {VIEWS.map(v => (
                                <button
                                    type="button"
                                    key={v.key}
                                    onClick={() => setActiveView(v.key)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer focus-ring ${
                                        activeView === v.key
                                            ? 'bg-brand text-white shadow-2xs dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700/80'
                                            : 'text-text-muted hover:text-text-primary dark:hover:text-slate-200'
                                    }`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>

                        {/* Right: Search + Project Filter + Priority Filter */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Search className="w-3.5 h-3.5" />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="pl-9 pr-4 py-1.5 w-44 sm:w-56 rounded-xl bg-surface dark:bg-slate-900 border border-surface-border dark:border-slate-800 focus-ring text-xs text-text-primary placeholder-text-muted transition-all shadow-2xs"
                                />
                            </div>

                            {/* Project Filter Dropdown */}
                            {projects.length > 0 && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProjectDropdownOpen(o => !o);
                                            setPriorityDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-xs font-semibold text-text-primary hover:border-brand/50 transition-all focus-ring cursor-pointer shadow-2xs"
                                    >
                                        <span className="truncate max-w-[140px]">
                                            {selectedProject ? selectedProject.name : 'All Projects'}
                                        </span>
                                        <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                    </button>

                                    {projectDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-1.5 z-50 bg-surface-elevated dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl shadow-xl overflow-hidden min-w-[200px] animate-in fade-in-50 zoom-in-95 duration-100">
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedProjectId('all'); setProjectDropdownOpen(false); }}
                                                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                                                    selectedProjectId === 'all' ? 'bg-brand/10 text-brand font-bold' : 'text-text-primary hover:bg-surface dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                All Projects
                                            </button>
                                            <div className="border-t border-surface-border dark:border-slate-800 my-0.5" />
                                            {projects.map(p => (
                                                <button
                                                    type="button"
                                                    key={p.id}
                                                    onClick={() => { setSelectedProjectId(p.id); setProjectDropdownOpen(false); }}
                                                    className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                                                        p.id === selectedProjectId ? 'bg-brand/10 text-brand font-bold' : 'text-text-primary hover:bg-surface dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    <span className="block truncate font-medium">{p.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Priority Filter Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPriorityDropdownOpen(o => !o);
                                        setProjectDropdownOpen(false);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-xs font-semibold text-text-primary hover:border-brand/50 transition-all focus-ring cursor-pointer shadow-2xs"
                                >
                                    <span className="capitalize">
                                        {PRIORITIES.find(p => p.key === selectedPriority)?.label || 'All Priorities'}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                </button>

                                {priorityDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 z-50 bg-surface-elevated dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-in fade-in-50 zoom-in-95 duration-100">
                                        {PRIORITIES.map(pr => (
                                            <button
                                                type="button"
                                                key={pr.key}
                                                onClick={() => { setSelectedPriority(pr.key); setPriorityDropdownOpen(false); }}
                                                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                                                    pr.key === selectedPriority ? 'bg-brand/10 text-brand font-bold' : 'text-text-primary hover:bg-surface dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                {pr.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Empty State for Projects ── */}
                {projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface">
                        <div className="text-text-muted mb-4 opacity-40">
                            <PackageX className="w-12 h-12" />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">
                            {hasManagerRights ? 'No Projects Found' : 'No Assigned Projects'}
                        </h2>
                        <p className="text-sm text-text-muted mt-1 max-w-sm">
                            {hasManagerRights
                                ? 'Create your first project to organize tasks, assign developers, and start planning sprints.'
                                : 'You are not assigned to any projects yet. When you are added to a project or assigned tasks, your project details and tasks will appear here.'}
                        </p>
                        {hasManagerRights && (
                            <Link
                                href={route('tenant.projects.index', { tenant: activeWorkspace })}
                                className="mt-5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-light transition-all shadow-2xs focus-ring"
                            >
                                Go to Projects
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
                        {filteredTasks.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-surface-elevated dark:bg-slate-900/60 rounded-2xl border border-surface-border dark:border-slate-800">
                                <div className="text-text-muted mb-3 opacity-40">
                                    <PackageX className="w-10 h-10" />
                                </div>
                                <h3 className="text-sm font-bold text-text-primary dark:text-slate-200">No Tasks Match Filter</h3>
                                <p className="text-xs text-text-muted mt-1 max-w-xs">
                                    {searchQuery || selectedPriority !== 'all' 
                                        ? "Try adjusting your search keywords or priority filter." 
                                        : "There are currently no tasks defined for this project workspace."}
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0">
                                {activeView === 'board'    && <BoardView    tasks={filteredTasks} onTaskClick={handleTaskClick} onStatusChange={handleStatusChange} />}
                                {activeView === 'list'     && <ListView     tasks={filteredTasks} onTaskClick={handleTaskClick} />}
                                {activeView === 'timeline' && <TimelineView tasks={filteredTasks} onTaskClick={handleTaskClick} />}
                                {activeView === 'due'      && <DueView      tasks={filteredTasks} onTaskClick={handleTaskClick} />}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Close dropdowns on outside click */}
            {(projectDropdownOpen || priorityDropdownOpen) && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => { setProjectDropdownOpen(false); setPriorityDropdownOpen(false); }} 
                    aria-hidden="true" 
                />
            )}

            {/* Task Details Drawer Sheet */}
            {selectedTask && (
                <TaskFlyoutInspector
                    isOpen={Boolean(selectedTask)}
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    updateTask={handleUpdateTask}
                    onUpdateStatus={(t, newStatus) => handleStatusChange(t, newStatus)}
                    canManage={hasManagerRights}
                    currentUserId={usePage().props.auth?.user?.id}
                    tenantId={studio?.id || activeWorkspace}
                    onTaskUpdated={(updatedTask) => {
                        setSelectedTask(updatedTask);
                        setLocalTasksMap(prev => {
                            const next = { ...prev };
                            Object.keys(next).forEach(pid => {
                                next[pid] = (next[pid] || []).map(t =>
                                    t.id === updatedTask.id ? { ...t, ...updatedTask } : t
                                );
                            });
                            return next;
                        });
                    }}
                />
            )}

            {/* Modal for creating a new task */}
            {taskModalOpen && !selectedTask && (
                <ManualTaskModal
                    isOpen={taskModalOpen}
                    onClose={() => setTaskModalOpen(false)}
                    project={selectedProject || projects[0]}
                    editingTask={null}
                    tenantId={activeWorkspace}
                />
            )}
        </TenantLayout>
    );
}
