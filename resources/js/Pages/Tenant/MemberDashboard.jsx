import React, { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import MemberTaskCard from '@/Components/Tenant/Tasks/MemberTaskCard';
import MemberTaskDetailModal from '@/Components/Tenant/Tasks/MemberTaskDetailModal';
import { 
    CheckCircle2, 
    Clock, 
    Flame, 
    Target, 
    ListTodo, 
    Search, 
    Filter, 
    Sparkles, 
    ArrowRight, 
    Inbox, 
    Calendar,
    Kanban,
    Layers,
    AlertCircle,
    Check,
} from 'lucide-react';
import axios from 'axios';

function ConfirmDialog({ isOpen, title, message, confirmLabel, confirmColor = 'brand', onConfirm, onCancel }) {
    if (!isOpen) return null;
    const colorMap = {
        brand: 'bg-brand hover:bg-brand-dark text-white',
        rose: 'bg-rose-600 hover:bg-rose-700 text-white',
        amber: 'bg-amber-500 hover:bg-amber-600 text-white',
        emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${colorMap[confirmColor] || colorMap.brand}`}
                    >
                        {confirmLabel || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MemberDashboard({ 
    studio, 
    myTasks = [], 
    sprintTasks = [], 
    inboxTasks = [], 
    notifications: initialNotifications = [],
    activeSprint = null, 
    pendingEstimatesCount = 0 
}) {
    const { auth, activeWorkspace } = usePage().props;
    const user = auth?.user;

    // View mode: 'board' | 'focus'
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('view') === 'focus') return 'focus';
        }
        return 'board';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');

    // Local tasks list for optimistic updates
    const [tasksList, setTasksList] = useState(myTasks);
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Confirmation dialog state for quick card actions
    const [confirmDialog, setConfirmDialog] = useState(null); // { task, newSprintStatus, title, message, confirmLabel, confirmColor }

    // Sync tasksList when myTasks prop updates
    React.useEffect(() => {
        setTasksList(myTasks);
    }, [myTasks]);

    // Unique projects list for filtering
    const projectsList = useMemo(() => {
        const set = new Map();
        tasksList.forEach(t => {
            if (t.project_id && t.project_name) {
                set.set(t.project_id, t.project_name);
            }
        });
        return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
    }, [tasksList]);

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return tasksList.filter(task => {
            const matchesSearch = searchQuery === '' || 
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (task.project_name && task.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (task.epic_name && task.epic_name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesProject = selectedProject === 'all' || String(task.project_id) === String(selectedProject);
            
            const isTaskCritical = task.is_critical || task.priority?.toLowerCase() === 'critical' || task.sprint_priority === 'critical';
            const matchesPriority = selectedPriority === 'all' ||
                (selectedPriority === 'critical' && isTaskCritical) ||
                (selectedPriority === 'high' && (task.priority?.toLowerCase() === 'high' || task.sprint_priority === 'high')) ||
                (selectedPriority === 'medium' && task.priority?.toLowerCase() === 'medium') ||
                (selectedPriority === 'low' && task.priority?.toLowerCase() === 'low');

            return matchesSearch && matchesProject && matchesPriority;
        });
    }, [tasksList, searchQuery, selectedProject, selectedPriority]);

    // Active sprint tasks subset
    const currentSprintTasks = useMemo(() => {
        if (!activeSprint) return filteredTasks;
        return filteredTasks.filter(t => t.sprint_id === activeSprint.id);
    }, [filteredTasks, activeSprint]);

    // Grouping tasks by sprint status for the Kanban columns
    const columns = useMemo(() => {
        const targetTasks = activeSprint ? currentSprintTasks : filteredTasks;
        return {
            ready: targetTasks.filter(t => !t.sprint_status || t.sprint_status === 'ready_to_start' || t.status === 'todo'),
            in_progress: targetTasks.filter(t => t.sprint_status === 'in_progress'),
            review: targetTasks.filter(t => t.sprint_status === 'waiting_for_review' || t.sprint_status === 'pending_deploy' || t.status === 'review'),
            done: targetTasks.filter(t => t.sprint_status === 'done' || t.status === 'completed'),
            stuck: targetTasks.filter(t => t.sprint_status === 'stuck'),
        };
    }, [currentSprintTasks, filteredTasks, activeSprint]);

    // Focus tasks (Critical / High priority that are ready or in progress)
    const focusTasks = useMemo(() => {
        return filteredTasks.filter(t => {
            const isCritOrHigh = t.is_critical || 
                t.priority?.toLowerCase() === 'critical' || 
                t.priority?.toLowerCase() === 'high' ||
                t.sprint_priority === 'critical' ||
                t.sprint_priority === 'high';
            const isNotDone = t.sprint_status !== 'done' && t.status !== 'completed';
            return isCritOrHigh && isNotDone;
        });
    }, [filteredTasks]);

    // Story points statistics
    const pointsStats = useMemo(() => {
        const pool = activeSprint ? currentSprintTasks : tasksList;
        const total = pool.reduce((acc, t) => acc + (t.story_points || 0), 0);
        const completed = pool
            .filter(t => t.sprint_status === 'done' || t.status === 'completed')
            .reduce((acc, t) => acc + (t.actual_story_points ?? t.story_points ?? 0), 0);
        return { total, completed };
    }, [activeSprint, currentSprintTasks, tasksList]);

    // Status change trigger with confirmation dialog
    const handleStatusChange = (task, newSprintStatus, confirmOptions = null) => {
        if (confirmOptions) {
            setConfirmDialog({
                task,
                newSprintStatus,
                title: confirmOptions.title || 'Update Task Status?',
                message: confirmOptions.message || 'Are you sure you want to change the status of this task?',
                confirmLabel: confirmOptions.confirmLabel || 'Confirm',
                confirmColor: confirmOptions.confirmColor || 'brand',
            });
            return;
        }
        executeStatusChange(task, newSprintStatus);
    };

    const executeStatusChange = async (task, newSprintStatus) => {
        const prevTasks = [...tasksList];
        setConfirmDialog(null);
        
        // Optimistic update
        setTasksList(prev => prev.map(t => {
            if (t.id === task.id) {
                return { 
                    ...t, 
                    sprint_status: newSprintStatus,
                    status: {
                        ready_to_start: 'todo',
                        in_progress: 'in_progress',
                        waiting_for_review: 'review',
                        done: 'completed',
                        stuck: 'stuck',
                    }[newSprintStatus] ?? t.status,
                };
            }
            return t;
        }));

        try {
            const url = route('tenant.tasks.update-status', {
                tenant: activeWorkspace,
                task: task.id,
            });

            await axios.patch(url, { sprint_status: newSprintStatus }, {
                headers: { 'Accept': 'application/json' }
            });
        } catch (err) {
            console.error('Failed to update task status', err);
            // Rollback on failure
            setTasksList(prevTasks);
        }
    };

    const handleTaskCardClick = (task) => {
        setSelectedTask(task);
        setDetailModalOpen(true);
    };

    const handleTaskUpdatedFromModal = (updatedTask) => {
        setTasksList(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    };

    const todayDateFormatted = new Intl.DateTimeFormat('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
    }).format(new Date());

    return (
        <TenantLayout studioName={studio?.name}>
            <Head title={`My Work — ${studio?.name || 'Studio'}`} />

            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
                
                {/* ── Top Header / Hero Section ── */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 py-5 shrink-0">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{todayDateFormatted}</span>
                                <span>•</span>
                                <span className="text-brand dark:text-brand-light font-bold">{studio?.name || 'Studio'}</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                Welcome back, {user?.name || 'Developer'}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Here is your active sprint execution board and focus queue.
                            </p>
                        </div>

                        {/* Fast Quick Links / Actions */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {pendingEstimatesCount > 0 && (
                                <Link
                                    href={`/studio/${activeWorkspace}/estimates/pending`}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 shadow-xs transition-all"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                                    <span>{pendingEstimatesCount} Pending Estimates</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}

                            <Link
                                href={`/studio/${activeWorkspace}/tasks`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ListTodo className="w-3.5 h-3.5 text-slate-500" />
                                <span>All My Tasks</span>
                            </Link>

                            <Link
                                href={`/studio/${activeWorkspace}/burndown`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Target className="w-3.5 h-3.5 text-slate-500" />
                                <span>Burndown</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Main Container ── */}
                <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6 flex-1 flex flex-col">
                    
                    {/* ── Stat Cards Grid ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* 1. Active Sprint Card */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Target className="w-3.5 h-3.5 text-indigo-500" />
                                        Active Sprint
                                    </span>
                                    {activeSprint && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {activeSprint ? activeSprint.name : 'No Active Sprint'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    {activeSprint ? (activeSprint.project_name || 'Project execution') : 'Tasks in backlog queue'}
                                </p>
                            </div>

                            {activeSprint ? (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-slate-600 dark:text-slate-400">Sprint Progress</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">{activeSprint.completion}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${activeSprint.completion}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                                        <span>{activeSprint.done_tasks} / {activeSprint.total_tasks} Tasks Done</span>
                                        {activeSprint.end_date && <span>Ends {activeSprint.end_date}</span>}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                                    Sprint planning in progress
                                </div>
                            )}
                        </div>

                        {/* 2. Today's Focus Card */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                                        Today's Focus
                                    </span>
                                    {focusTasks.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                            High Priority
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                        {focusTasks.length}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        tasks needing immediate work
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('focus')}
                                    className="w-full flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
                                >
                                    <span>View Focus Tasks</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* 3. Story Points Velocity Card */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                                        Story Points
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                        {pointsStats.completed}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        / {pointsStats.total} SP Delivered
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${pointsStats.total > 0 ? Math.min(100, Math.round((pointsStats.completed / pointsStats.total) * 100)) : 0}%` }}
                                    />
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    {pointsStats.total > 0 ? `${Math.round((pointsStats.completed / pointsStats.total) * 100)}% points burn complete` : 'No estimated points'}
                                </span>
                            </div>
                        </div>

                        {/* 4. Estimates Queue Card */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        Estimation Queue
                                    </span>
                                    {pendingEstimatesCount > 0 && (
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                        {pendingEstimatesCount}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        tasks awaiting Fibonacci vote
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                {pendingEstimatesCount > 0 ? (
                                    <Link
                                        href={`/studio/${activeWorkspace}/estimates/pending`}
                                        className="w-full flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
                                    >
                                        <span>Submit Votes Now</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                ) : (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>All caught up!</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Toolbar: Search, Filters & View Toggle ── */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
                        
                        {/* View Switcher Tabs */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setViewMode('board')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'board'
                                        ? 'bg-white dark:bg-slate-900 text-brand dark:text-brand-light shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <Kanban className="w-3.5 h-3.5" />
                                <span>Sprint Board</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('focus')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'focus'
                                        ? 'bg-white dark:bg-slate-900 text-brand dark:text-brand-light shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <Flame className="w-3.5 h-3.5" />
                                <span>Today's Focus ({focusTasks.length})</span>
                            </button>
                        </div>

                        {/* Search & Select Filters */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Search */}
                            <div className="relative flex items-center">
                                <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand w-48 sm:w-56"
                                />
                            </div>

                            {/* Project Filter */}
                            {projectsList.length > 0 && (
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand cursor-pointer"
                                >
                                    <option value="all">All Projects</option>
                                    {projectsList.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}

                            {/* Priority Filter */}
                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-brand cursor-pointer"
                            >
                                <option value="all">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* ── View Content Area ── */}
                    {viewMode === 'board' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start flex-1 min-h-0">
                            
                            {/* Column 1: Ready to Start */}
                            <div className="flex flex-col bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800/80">
                                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Ready to Start
                                        </h4>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-2xs">
                                        {columns.ready.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                                    {columns.ready.length === 0 ? (
                                        <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
                                            No ready tasks
                                        </div>
                                    ) : (
                                        columns.ready.map(task => (
                                            <MemberTaskCard
                                                key={task.id}
                                                task={task}
                                                currentUserId={user?.id}
                                                onClick={handleTaskCardClick}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 2: In Progress */}
                            <div className="flex flex-col bg-amber-50/40 dark:bg-slate-900/50 rounded-2xl p-3 border border-amber-200/50 dark:border-slate-800/80">
                                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-amber-200/60 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
                                             In Progress
                                        </h4>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-2xs">
                                        {columns.in_progress.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                                    {columns.in_progress.length === 0 ? (
                                        <div className="p-4 rounded-xl border border-dashed border-amber-200 dark:border-slate-800 text-center text-xs text-slate-400">
                                            No tasks currently in progress
                                        </div>
                                    ) : (
                                        columns.in_progress.map(task => (
                                            <MemberTaskCard
                                                key={task.id}
                                                task={task}
                                                currentUserId={user?.id}
                                                onClick={handleTaskCardClick}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 3: In Review */}
                            <div className="flex flex-col bg-blue-50/40 dark:bg-slate-900/50 rounded-2xl p-3 border border-blue-200/50 dark:border-slate-800/80">
                                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-blue-200/60 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400">
                                            Review
                                        </h4>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-2xs">
                                        {columns.review.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                                    {columns.review.length === 0 ? (
                                        <div className="p-4 rounded-xl border border-dashed border-blue-200 dark:border-slate-800 text-center text-xs text-slate-400">
                                            No tasks waiting for review
                                        </div>
                                    ) : (
                                        columns.review.map(task => (
                                            <MemberTaskCard
                                                key={task.id}
                                                task={task}
                                                currentUserId={user?.id}
                                                onClick={handleTaskCardClick}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 4: Done */}
                            <div className="flex flex-col bg-emerald-50/40 dark:bg-slate-900/50 rounded-2xl p-3 border border-emerald-200/50 dark:border-slate-800/80">
                                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-emerald-200/60 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">
                                            Done
                                        </h4>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-2xs">
                                        {columns.done.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                                    {columns.done.length === 0 ? (
                                        <div className="p-4 rounded-xl border border-dashed border-emerald-200 dark:border-slate-800 text-center text-xs text-slate-400">
                                            Completed tasks appear here
                                        </div>
                                    ) : (
                                        columns.done.map(task => (
                                            <MemberTaskCard
                                                key={task.id}
                                                task={task}
                                                currentUserId={user?.id}
                                                onClick={handleTaskCardClick}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 5: Blocked / Stuck */}
                            <div className="flex flex-col bg-rose-50/40 dark:bg-slate-900/50 rounded-2xl p-3 border border-rose-200/50 dark:border-slate-800/80">
                                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-rose-200/60 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-400">
                                            Blocked / Stuck
                                        </h4>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 shadow-2xs">
                                        {columns.stuck.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                                    {columns.stuck.length === 0 ? (
                                        <div className="p-4 rounded-xl border border-dashed border-rose-200 dark:border-slate-800 text-center text-xs text-slate-400">
                                            No blocked items
                                        </div>
                                    ) : (
                                        columns.stuck.map(task => (
                                            <MemberTaskCard
                                                key={task.id}
                                                task={task}
                                                currentUserId={user?.id}
                                                onClick={handleTaskCardClick}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Focus View */}
                    {viewMode === 'focus' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-rose-500" />
                                    <span>High Priority & Critical Focus Tasks</span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Items sorted by urgency and priority. Tackle these first to prevent blocking sprint milestones.
                                </p>
                            </div>

                            {focusTasks.length === 0 ? (
                                <div className="p-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-400">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No high-priority blockers pending!</p>
                                    <p className="text-xs text-slate-500 mt-0.5">You are in good standing with all critical tasks.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {focusTasks.map(task => (
                                        <MemberTaskCard
                                            key={task.id}
                                            task={task}
                                            currentUserId={user?.id}
                                            onClick={handleTaskCardClick}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                </div>
            </div>

            {/* ── Detail & Update Modal ── */}
            {selectedTask && (
                <MemberTaskDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    task={selectedTask}
                    tenantId={activeWorkspace}
                    currentUserId={user?.id}
                    onTaskUpdated={handleTaskUpdatedFromModal}
                />
            )}

            {/* ── Quick Progression Confirm Modal ── */}
            <ConfirmDialog
                isOpen={Boolean(confirmDialog)}
                title={confirmDialog?.title}
                message={confirmDialog?.message}
                confirmLabel={confirmDialog?.confirmLabel}
                confirmColor={confirmDialog?.confirmColor}
                onConfirm={() => executeStatusChange(confirmDialog.task, confirmDialog.newSprintStatus)}
                onCancel={() => setConfirmDialog(null)}
            />
        </TenantLayout>
    );
}
