import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import ProjectLayout from '@/Layouts/ProjectLayout';
import {
    CheckCircle2,
    Layers,
    GitBranch,
    Clock,
    AlertTriangle,
    ChevronRight,
    ChevronDown,
    Plus,
    Target,
    Columns3,
    TableProperties,
    CalendarDays,
    ListTodo,
    MoreVertical,
    Flame,
    ArrowRight,
    Cpu,
    Sparkles,
    Filter,
    Check,
    X,
    ShieldAlert,
    Zap,
    BarChart3,
    Activity,
    Calendar,
    Users
} from 'lucide-react';
import axios from 'axios';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    LabelList
} from 'recharts';

import BestFitModal from '@/Components/ML/BestFitModal';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
import ProjectAiAssistant from '@/Components/Tenant/Projects/ProjectAiAssistant';
import CpaStatusBadge from '@/Components/Tenant/CpaStatusBadge';
import EpicBreakdown from '@/Components/Tenant/Projects/EpicBreakdown';
import SprintBreakdown from '@/Components/Tenant/Projects/SprintBreakdown';
import UpdateTaskStatusModal from '@/Components/Tenant/Projects/UpdateTaskStatusModal';
import ManageAssignmentModal from '@/Components/Tenant/Projects/ManageAssignmentModal';
import TaskFlyoutInspector from '@/Components/Tenant/Tasks/TaskFlyoutInspector';
import { CpaAiSummaryCard, CpaTaskAiModal, CpaTaskAiButton } from '@/Components/Tenant/CpaAiSynthesizer';
import { showToast } from '@/Components/SystemToast';

// ── Color tokens & mapping ───────────────────────────────────────────────────
const STATUS_CONFIG = {
    todo: {
        id: 'todo',
        label: 'To do',
        sprintKey: 'ready_to_start',
        color: 'var(--muted-foreground)',
        bgClass: 'bg-[var(--muted-foreground)]',
        badgeBg: 'bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]',
    },
    in_progress: {
        id: 'in_progress',
        label: 'In progress',
        sprintKey: 'in_progress',
        color: 'var(--cyan)',
        bgClass: 'bg-[var(--cyan)]',
        badgeBg: 'bg-[var(--cyan)]/10 text-[var(--cyan)] border-[var(--cyan)]/25',
    },
    review: {
        id: 'review',
        label: 'In review',
        sprintKey: 'waiting_for_review',
        color: 'var(--warning)',
        bgClass: 'bg-[var(--warning)]',
        badgeBg: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/25',
    },
    completed: {
        id: 'completed',
        label: 'Done',
        sprintKey: 'done',
        color: 'var(--success)',
        bgClass: 'bg-[var(--success)]',
        badgeBg: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/25',
    },
    overdue: {
        id: 'overdue',
        label: 'Overdue',
        sprintKey: 'overdue',
        color: '#f43f5e',
        bgClass: 'bg-rose-500',
        badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    },
    stuck: {
        id: 'stuck',
        label: 'Blocked',
        sprintKey: 'stuck',
        color: 'var(--critical)',
        bgClass: 'bg-[var(--critical)]',
        badgeBg: 'bg-[var(--critical)]/10 text-[var(--critical)] border-[var(--critical)]/25',
    },
};

const AVATAR_TONES = [
    'var(--cyan)',
    'var(--primary)',
    'var(--pink)',
    'var(--warning)',
    'var(--success)',
    'var(--critical)',
];

const priorityWeight = {
    critical: 0,
    Critical: 0,
    CRITICAL: 0,
    high: 1,
    High: 1,
    HIGH: 1,
    medium: 2,
    Medium: 2,
    MEDIUM: 2,
    low: 3,
    Low: 3,
    LOW: 3,
};

function sortByPriorityAndCriticality(tasks) {
    return [...tasks].sort((a, b) => {
        const aCritical = Boolean(a.is_critical);
        const bCritical = Boolean(b.is_critical);
        if (aCritical !== bCritical) return aCritical ? -1 : 1;
        const aPri = priorityWeight[String(a.priority || 'Medium').toLowerCase()] ?? 2;
        const bPri = priorityWeight[String(b.priority || 'Medium').toLowerCase()] ?? 2;
        if (aPri !== bPri) return aPri - bPri;
        const aFloat = a.total_float !== null && a.total_float !== undefined ? Number(a.total_float) : 999999;
        const bFloat = b.total_float !== null && b.total_float !== undefined ? Number(b.total_float) : 999999;
        if (aFloat !== bFloat) return aFloat - bFloat;
        return Number(a.id ?? 0) - Number(b.id ?? 0);
    });
}

function normalizeTaskStatus(task) {
    const s = task.status || '';
    const sp = task.sprint_status || '';
    if (s === 'completed' || sp === 'done') return 'completed';
    if (s === 'overdue' || sp === 'overdue') return 'overdue';

    if (task.days_until_deadline !== null && task.days_until_deadline !== undefined && Number(task.days_until_deadline) < 0) {
        return 'overdue';
    }

    const targetDate = task.dueDate || task.due_date || task.hard_constraint_date;
    if (targetDate) {
        const due = new Date(targetDate);
        if (!isNaN(due.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            due.setHours(0, 0, 0, 0);
            if (due.getTime() < today.getTime()) return 'overdue';
        }
    }

    if (s === 'stuck' || sp === 'stuck') return 'stuck';
    if (s === 'review' || sp === 'waiting_for_review') return 'review';
    if (s === 'in_progress' || sp === 'in_progress') return 'in_progress';
    return 'todo';
}

function getTaskAssignees(task) {
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
        return task.assignees.map(a => (typeof a === 'object' ? a.name : a));
    }
    if (task.assignee) {
        return [typeof task.assignee === 'object' ? task.assignee.name : task.assignee];
    }
    return ['Unassigned'];
}

function getInitials(name) {
    if (!name || name === 'Unassigned') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function deriveCalendarDate(startDateStr, hoursOffset) {
    if (!startDateStr || hoursOffset === null || hoursOffset === undefined) return null;
    const daysOffset = Math.floor(Number(hoursOffset) / 8);
    const date = new Date(startDateStr);
    let added = 0;
    while (added < daysOffset) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            added++;
        }
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Show({
    project,
    studio,
    teamMembers = [],
    auth,
    skills = [],
    positions = [],
    epics = [],
    epicGroups = [],
    epicPhases = [],
    epicPriorities = [],
    sprints = [],
    backlogTasks = []
}) {
    const pageProps = usePage().props;
    const { canManage } = pageProps;
    const currentAuth = auth || pageProps.auth || { user: { name: 'Studio Member', role: 'manager' } };
    const tenantId = studio?.id || pageProps.activeWorkspace || 'default';

    // ── Tab Navigation State ─────────────────────────────────────────────────
    // Valid views: 'dashboard' | 'spreadsheet' (Tasks) | 'sprint' | 'epic' | 'timeline' | 'board'
    const [activeView, setActiveView] = useState('dashboard');

    // ── Task Data State ──────────────────────────────────────────────────────
    const [taskRows, setTaskRows] = useState(project?.tasks || []);
    const [draggedTask, setDraggedTask] = useState(null);
    const [hoveredColId, setHoveredColId] = useState(null);

    // ── Interactive Status Filter (for Band 2 Priority Queue) ─────────────────
    const [activeStatusFilter, setActiveStatusFilter] = useState(null);

    // ── Modal & Inspector States ─────────────────────────────────────────────
    const [selectedInspectorTask, setSelectedInspectorTask] = useState(null);
    const [isManualTaskOpen, setIsManualTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [bestFitTask, setBestFitTask] = useState(null);
    const [assignmentTask, setAssignmentTask] = useState(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [statusEditingTask, setStatusEditingTask] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [aiModalTask, setAiModalTask] = useState(null);

    useEffect(() => {
        setTaskRows(project?.tasks || []);
    }, [project?.id, project?.tasks]);

    const allTasks = taskRows;
    const activeSprint = useMemo(() => sprints?.find(s => s.status === 'active') || sprints?.[0], [sprints]);

    // ── Calculate Metric Pulse Row (Band 1) ──────────────────────────────────
    const totalTasks = allTasks.length;
    const completedTasks = useMemo(() => allTasks.filter(t => normalizeTaskStatus(t) === 'completed').length, [allTasks]);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const inProgressTasks = useMemo(() => allTasks.filter(t => normalizeTaskStatus(t) === 'in_progress').length, [allTasks]);
    const reviewTasks = useMemo(() => allTasks.filter(t => normalizeTaskStatus(t) === 'review').length, [allTasks]);
    const todoTasks = useMemo(() => allTasks.filter(t => normalizeTaskStatus(t) === 'todo').length, [allTasks]);
    const stuckTasks = useMemo(() => allTasks.filter(t => normalizeTaskStatus(t) === 'stuck').length, [allTasks]);

    const criticalTasks = useMemo(() => {
        return allTasks.filter(t => Boolean(t.is_critical) && normalizeTaskStatus(t) !== 'completed').length;
    }, [allTasks]);

    const totalPoints = useMemo(() => {
        const sum = allTasks.reduce((acc, t) => acc + Number(t.story_points || t.estimated_hours || 0), 0);
        return sum > 0 ? sum : totalTasks;
    }, [allTasks, totalTasks]);

    const pointsDelivered = useMemo(() => {
        return allTasks
            .filter(t => normalizeTaskStatus(t) === 'completed')
            .reduce((acc, t) => acc + Number(t.story_points || t.estimated_hours || 0), 0);
    }, [allTasks]);

    const pointsInFlight = useMemo(() => {
        return allTasks
            .filter(t => ['in_progress', 'review'].includes(normalizeTaskStatus(t)))
            .reduce((acc, t) => acc + Number(t.story_points || t.estimated_hours || 0), 0);
    }, [allTasks]);

    const pointsBlocked = useMemo(() => {
        return allTasks
            .filter(t => normalizeTaskStatus(t) === 'stuck')
            .reduce((acc, t) => acc + Number(t.story_points || t.estimated_hours || 0), 0);
    }, [allTasks]);

    // ── Assignee Color Palette Mapping ───────────────────────────────────────
    const assigneeColorMap = useMemo(() => {
        const names = Array.from(new Set(allTasks.flatMap(getTaskAssignees)));
        const map = {};
        names.forEach((name, i) => {
            map[name] = AVATAR_TONES[i % AVATAR_TONES.length];
        });
        return map;
    }, [allTasks]);

    // ── Stacked Column Chart Data (Band 3 Sprint Delivery) ────────────────────
    const sprintDeliveryData = useMemo(() => {
        const stages = [
            { key: 'todo', label: 'To do' },
            { key: 'in_progress', label: 'In progress' },
            { key: 'review', label: 'In review' },
            { key: 'completed', label: 'Done' },
            { key: 'stuck', label: 'Blocked' },
        ];

        const assignees = Object.keys(assigneeColorMap);

        return stages.map(stage => {
            const stageTasks = allTasks.filter(t => normalizeTaskStatus(t) === stage.key);
            const row = { stage: stage.label, total: 0 };

            assignees.forEach(name => {
                const pts = stageTasks
                    .filter(t => getTaskAssignees(t).includes(name))
                    .reduce((acc, t) => acc + Number(t.story_points || t.estimated_hours || 0), 0);
                row[name] = pts;
                row.total += pts;
            });

            return row;
        });
    }, [allTasks, assigneeColorMap]);

    // ── Donut Chart Data (Band 3 Task Distribution) ──────────────────────────
    const donutData = useMemo(() => {
        return [
            { id: 'todo', name: 'To do', value: todoTasks, color: STATUS_CONFIG.todo.color },
            { id: 'in_progress', name: 'In progress', value: inProgressTasks, color: STATUS_CONFIG.in_progress.color },
            { id: 'review', name: 'In review', value: reviewTasks, color: STATUS_CONFIG.review.color },
            { id: 'completed', name: 'Done', value: completedTasks, color: STATUS_CONFIG.completed.color },
            { id: 'stuck', name: 'Blocked', value: stuckTasks, color: STATUS_CONFIG.stuck.color },
        ].filter(d => d.value > 0);
    }, [todoTasks, inProgressTasks, reviewTasks, completedTasks, stuckTasks]);

    // ── Assignee Task Counts (Band 3 Breakdown) ──────────────────────────────
    const assigneeTaskCounts = useMemo(() => {
        const counts = {};
        allTasks.forEach(task => {
            const assignees = getTaskAssignees(task);
            assignees.forEach(name => {
                counts[name] = (counts[name] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, count]) => ({
            name,
            count,
            color: assigneeColorMap[name] || 'var(--primary)',
        })).sort((a, b) => b.count - a.count);
    }, [allTasks, assigneeColorMap]);

    // ── Filtered Tasks for Priority Queue (Band 2) ───────────────────────────
    const priorityQueueTasks = useMemo(() => {
        let pool = allTasks;
        if (activeStatusFilter) {
            pool = pool.filter(t => normalizeTaskStatus(t) === activeStatusFilter);
        }
        return sortByPriorityAndCriticality(pool).slice(0, 3);
    }, [allTasks, activeStatusFilter]);

    // ── Handlers & Actions ───────────────────────────────────────────────────
    const handleNewTask = () => {
        if (!canManage) return;
        setEditingTask(null);
        setIsManualTaskOpen(true);
    };

    const handleEditTask = (task) => {
        if (!canManage && !allTasks.some(t => t.id === task.id)) return;
        setSelectedInspectorTask(task);
    };

    const handleUpdateTask = (taskId, fields) => {
        setTaskRows(rows => rows.map(t => (t.id === taskId ? { ...t, ...fields } : t)));
        if (selectedInspectorTask?.id === taskId) {
            setSelectedInspectorTask(prev => ({ ...prev, ...fields }));
        }
        window.dispatchEvent(new CustomEvent('task-updated', { detail: { taskId, updates: fields } }));
    };

    const handleStatusChange = (task, newStatus) => {
        const mappedSprintStatus = Object.values(STATUS_CONFIG).find(c => c.id === newStatus)?.sprintKey || newStatus;
        handleUpdateTask(task.id, { status: newStatus, sprint_status: mappedSprintStatus });

        axios.patch(route('tenant.projects.tasks.update', { tenant: tenantId, project: project.id, task: task.id }), {
            status: newStatus,
            sprint_status: mappedSprintStatus,
        }).catch(err => {
            console.error('Failed to sync status update:', err);
        });
    };

    const handleDropTask = async (targetStatus) => {
        if (!draggedTask || draggedTask.status === targetStatus) {
            setDraggedTask(null);
            setHoveredColId(null);
            return;
        }

        const prevTasks = taskRows;
        const mappedSprint = Object.values(STATUS_CONFIG).find(c => c.id === targetStatus)?.sprintKey || targetStatus;

        setTaskRows(rows => rows.map(t => (t.id === draggedTask.id ? { ...t, status: targetStatus, sprint_status: mappedSprint } : t)));
        setDraggedTask(null);
        setHoveredColId(null);

        try {
            await axios.patch(route('tenant.projects.tasks.update', { tenant: tenantId, project: project.id, task: draggedTask.id }), {
                status: targetStatus,
                sprint_status: mappedSprint,
            });
        } catch (error) {
            setTaskRows(prevTasks);
            showToast('Failed to update task position', 'error');
        }
    };

    const handleAssignmentSuccess = (taskId, newAssignees) => {
        const updates = {
            assignees: newAssignees,
            assignee: newAssignees[0] || null,
            assigned_user_id: newAssignees[0]?.id || null,
        };
        handleUpdateTask(taskId, updates);
    };

    // ── Tab Config ───────────────────────────────────────────────────────────
    const TABS = [
        { id: 'dashboard',   label: 'Dashboard' },
        { id: 'spreadsheet', label: 'Tasks' },
        { id: 'sprint',      label: 'Sprint planning' },
        { id: 'epic',        label: 'Epics' },
        { id: 'timeline',    label: 'Critical path' },
        { id: 'board',       label: 'Board' },
    ];

    const projectKey = project?.key || project?.code || (project?.name ? project.name.substring(0, 3).toUpperCase() : 'PRJ');
    const projectType = project?.type || project?.category || 'Internal tooling';
    const techStack = project?.tech_stack || project?.description || 'C++';

    return (
        <ProjectLayout auth={currentAuth} project={project} studioName={studio?.name}>
            <Head title={`${project?.name || 'Project'} — Workspace`} />

            <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col flex-1 min-h-0 text-[var(--foreground)] overflow-x-hidden">

                {/* ── Page Heading Shell ── */}
                <div className="mb-[18px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            {/* Eyebrow */}
                            <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                                PROJECT / {projectKey}
                            </p>
                            {/* Project Name */}
                            <h1 className="font-heading font-bold text-[25px] leading-tight text-[var(--foreground)] tracking-tight">
                                {project?.name || 'Forge Engine'}
                            </h1>
                            {/* Project Type */}
                            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                                {projectType} · {techStack}
                            </p>
                        </div>

                        {/* Top Actions: Status Badge & Add Task */}
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-[var(--border)] bg-[var(--card)] text-[var(--success)] shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                                {project?.status === 'in_progress' ? 'On track' : (project?.status || 'On track')}
                            </span>

                            {canManage && (
                                <button
                                    type="button"
                                    onClick={handleNewTask}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] hover:opacity-90 active:scale-[0.98] text-white text-xs font-heading font-semibold shadow-2xs hover:shadow-md transition-all cursor-pointer focus-ring"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add task</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Tabs Line ── */}
                    <div className="mt-4 border-b border-[var(--border)] flex items-center gap-6 overflow-x-auto no-scrollbar">
                        {TABS.map(tab => {
                            const isActive = activeView === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveView(tab.id)}
                                    className={`h-9 px-0.5 text-xs font-heading font-semibold transition-all relative flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                        isActive
                                            ? 'text-[var(--foreground)] font-bold'
                                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--primary)] rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab Content Container (20px gap) ── */}
                <div className="space-y-5 flex-1 pb-16">

                    {/* ══════════════════════════════════════════════════════════
                        VIEW 1: DASHBOARD TAB
                    ══════════════════════════════════════════════════════════ */}
                    {activeView === 'dashboard' && (
                        <div className="space-y-5 animate-in fade-in duration-200">

                            {/* ── Band 1: Metric Pulse Row (4 equal cols, no boxes, bottom border) ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-5 border-b border-[var(--border)]">
                                
                                {/* 1. Project completion */}
                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                        <span>Project completion</span>
                                    </div>
                                    <div className="flex items-baseline gap-2.5 mt-2">
                                        <span className="font-heading font-extrabold text-[28px] sm:text-[30px] leading-none text-[var(--foreground)]">
                                            {completionRate}%
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20">
                                            <span className="w-1 h-1 rounded-full bg-[var(--success)]" />
                                            {completedTasks}/{totalTasks} tasks done
                                        </span>
                                    </div>
                                    {/* Thin progress bar */}
                                    <div className="w-full h-1 bg-[var(--secondary)] rounded-full overflow-hidden mt-3">
                                        <div
                                            className="h-full bg-[var(--cyan)] rounded-full transition-all duration-500"
                                            style={{ width: `${completionRate}%` }}
                                        />
                                    </div>
                                </div>

                                {/* 2. Active work */}
                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                        <Layers className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                        <span>Active work</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="font-heading font-extrabold text-[28px] sm:text-[30px] leading-none text-[var(--foreground)]">
                                            {String(inProgressTasks).padStart(2, '0')}
                                        </span>
                                        <span className="text-xs text-[var(--muted-foreground)] font-medium">
                                            in progress
                                        </span>
                                    </div>
                                    {/* Segmented status bar */}
                                    <div className="flex items-center gap-1.5 w-full h-1.5 mt-3">
                                        <div className={`flex-1 h-full rounded-full ${todoTasks > 0 ? 'bg-[var(--muted-foreground)]' : 'bg-[var(--secondary)]'}`} title={`To do: ${todoTasks}`} />
                                        <div className={`flex-1 h-full rounded-full ${inProgressTasks > 0 ? 'bg-[var(--cyan)]' : 'bg-[var(--secondary)]'}`} title={`In progress: ${inProgressTasks}`} />
                                        <div className={`flex-1 h-full rounded-full ${reviewTasks > 0 ? 'bg-[var(--warning)]' : 'bg-[var(--secondary)]'}`} title={`In review: ${reviewTasks}`} />
                                        <div className={`flex-1 h-full rounded-full ${completedTasks > 0 ? 'bg-[var(--success)]' : 'bg-[var(--secondary)]'}`} title={`Done: ${completedTasks}`} />
                                        <div className={`flex-1 h-full rounded-full ${stuckTasks > 0 ? 'bg-[var(--critical)]' : 'bg-[var(--secondary)]'}`} title={`Blocked: ${stuckTasks}`} />
                                    </div>
                                </div>

                                {/* 3. Critical path */}
                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                        <GitBranch className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                        <span>Critical path</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className={`font-heading font-extrabold text-[28px] sm:text-[30px] leading-none ${
                                            criticalTasks > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'
                                        }`}>
                                            {String(criticalTasks).padStart(2, '0')}
                                        </span>
                                        <span className={`text-xs font-semibold ${
                                            criticalTasks > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'
                                        }`}>
                                            {criticalTasks > 0 ? 'at risk' : 'clear'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[var(--muted-foreground)] mt-2">
                                        {criticalTasks > 0 ? 'Protect your next milestone' : 'No critical tasks remaining'}
                                    </p>
                                </div>

                                {/* 4. Delivery effort */}
                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                                        <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                        <span>Delivery effort</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="font-heading font-extrabold text-[28px] sm:text-[30px] leading-none text-[var(--foreground)]">
                                            {pointsDelivered}
                                        </span>
                                        <span className="font-mono text-sm font-semibold text-[var(--muted-foreground)]">
                                            /{totalPoints}
                                        </span>
                                        <span className="text-xs text-[var(--muted-foreground)] font-medium ml-1">
                                            points delivered
                                        </span>
                                    </div>
                                    {/* Success progress bar */}
                                    <div className="w-full h-1 bg-[var(--secondary)] rounded-full overflow-hidden mt-3">
                                        <div
                                            className="h-full bg-[var(--success)] rounded-full transition-all duration-500"
                                            style={{ width: `${totalPoints > 0 ? (pointsDelivered / totalPoints) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                            </div>

                            {/* ── Band 2: Context (1.5fr and 1fr min 350px) ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(350px,1fr)] gap-[18px]">
                                
                                {/* Priority queue (wide panel, padding 12px 18px) */}
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-[12px_18px] shadow-2xs flex flex-col justify-between min-h-[160px]">
                                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/60">
                                        <h2 className="font-heading font-bold text-sm text-[var(--foreground)]">
                                            {activeStatusFilter ? `${STATUS_CONFIG[activeStatusFilter]?.label || activeStatusFilter} queue` : 'Priority queue'}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => setActiveView('spreadsheet')}
                                            className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                                        >
                                            <span>All tasks</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Queue Task Rows (Up to 3) */}
                                    <div className="divide-y divide-[var(--border)]/40 mt-1">
                                        {priorityQueueTasks.length === 0 ? (
                                            <div className="py-6 text-center text-xs text-[var(--muted-foreground)] font-mono">
                                                No tasks in this queue.
                                            </div>
                                        ) : (
                                            priorityQueueTasks.map((task, idx) => {
                                                const normStatus = normalizeTaskStatus(task);
                                                const statusObj = STATUS_CONFIG[normStatus] || STATUS_CONFIG.todo;
                                                const assignees = getTaskAssignees(task);
                                                const primaryAssignee = assignees[0] || 'Unassigned';
                                                const avatarColor = assigneeColorMap[primaryAssignee] || 'var(--primary)';
                                                const dueDateStr = formatShortDate(task.due_date || task.hard_constraint_date);

                                                return (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        onClick={() => setSelectedInspectorTask(task)}
                                                        className="w-full text-left py-2.5 px-1.5 flex items-center justify-between gap-3 rounded-lg hover:bg-[var(--secondary)]/60 transition-colors group cursor-pointer"
                                                    >
                                                        {/* Left: Rank & Title Info */}
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="font-mono text-xs font-semibold text-[var(--muted-foreground)] shrink-0 w-5">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="font-heading font-bold text-xs sm:text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                                                                    {task.title}
                                                                </p>
                                                                <p className="text-[11px] font-mono text-[var(--muted-foreground)] mt-0.5">
                                                                    #{task.id} · {task.story_points ?? (task.estimated_hours || 0)} pts · Due {dueDateStr}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Right: Badge, Avatar, Chevron */}
                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                            {task.is_critical ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20">
                                                                    Critical path
                                                                </span>
                                                            ) : (
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusObj.badgeBg}`}>
                                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusObj.color }} />
                                                                    {statusObj.label}
                                                                </span>
                                                            )}

                                                            <div
                                                                className="w-5 h-5 rounded-full border border-white/20 text-[9px] font-bold font-mono flex items-center justify-center text-white"
                                                                style={{ backgroundColor: avatarColor }}
                                                                title={primaryAssignee}
                                                            >
                                                                {getInitials(primaryAssignee)}
                                                            </div>

                                                            <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Project details (narrow panel, padding 14px 18px) */}
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-[14px_18px] shadow-2xs flex flex-col justify-between">
                                    <h2 className="font-heading font-bold text-sm text-[var(--foreground)] mb-2.5">
                                        Project details
                                    </h2>

                                    {/* 2x2 dl grid */}
                                    <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                                        <div>
                                            <dt className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 mb-1">
                                                <Target className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                                <span>Target release</span>
                                            </dt>
                                            <dd className="font-mono font-semibold text-[var(--foreground)]">
                                                {formatDate(project?.target_end_date)}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-[11px] text-[var(--muted-foreground)] mb-1">
                                                Status
                                            </dt>
                                            <dd>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20">
                                                    <span className="w-1 h-1 rounded-full bg-[var(--success)]" />
                                                    {project?.status === 'in_progress' ? 'On track' : (project?.status || 'On track')}
                                                </span>
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-[11px] text-[var(--muted-foreground)] mb-1">
                                                Current sprint
                                            </dt>
                                            <dd className="font-medium text-[var(--foreground)]">
                                                {activeSprint?.name || 'Sprint 12'}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-[11px] text-[var(--muted-foreground)] mb-1">
                                                Project key
                                            </dt>
                                            <dd className="font-mono font-bold text-[var(--foreground)]">
                                                {projectKey}
                                            </dd>
                                        </div>
                                    </dl>

                                    {/* Mini visual overlay strip */}
                                    <div className="mt-3.5 pt-2.5 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                                        <span className="font-mono text-[10px]">{projectType}</span>
                                        <span className="font-mono text-[10px] text-[var(--foreground)] font-semibold">{techStack}</span>
                                    </div>
                                </div>

                            </div>

                            {/* ── Band 3: Insight Charts (both panels 410px tall on desktop) ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(350px,1fr)] gap-[18px]">
                                
                                {/* Sprint delivery (wide, 410px tall) */}
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-[14px_18px] shadow-2xs h-auto lg:h-[410px] flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="font-heading font-bold text-sm text-[var(--foreground)]">
                                                    Sprint delivery
                                                </h2>
                                                <p className="text-[11px] text-[var(--muted-foreground)]">
                                                    {activeSprint?.name || 'Sprint 12'}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                                                Sprint preview
                                            </span>
                                        </div>

                                        {/* Summary Strip (3 equal cells inside rounded frame) */}
                                        <div className="grid grid-cols-3 border border-[var(--border)] rounded-md divide-x divide-[var(--border)] bg-[var(--secondary)]/20 mt-3 mb-2">
                                            <div className="p-2 text-center">
                                                <p className="font-heading font-extrabold text-[18px] leading-tight text-[var(--foreground)]">
                                                    {pointsDelivered}/{totalPoints}
                                                </p>
                                                <p className="text-[9px] font-semibold uppercase text-[var(--muted-foreground)] tracking-[.06em] mt-0.5">
                                                    Points Delivered
                                                </p>
                                            </div>
                                            <div className="p-2 text-center">
                                                <p className="font-heading font-extrabold text-[18px] leading-tight text-[var(--foreground)]">
                                                    {pointsInFlight}
                                                </p>
                                                <p className="text-[9px] font-semibold uppercase text-[var(--muted-foreground)] tracking-[.06em] mt-0.5">
                                                    Points in Flight
                                                </p>
                                            </div>
                                            <div className="p-2 text-center">
                                                <p className={`font-heading font-extrabold text-[18px] leading-tight ${
                                                    pointsBlocked > 0 ? 'text-[var(--warning)]' : 'text-[var(--foreground)]'
                                                }`}>
                                                    {pointsBlocked}
                                                </p>
                                                <p className="text-[9px] font-semibold uppercase text-[var(--muted-foreground)] tracking-[.06em] mt-0.5">
                                                    Points Blocked
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stacked Column Chart */}
                                    <div
                                        className="flex-1 min-h-[200px] w-full mt-1"
                                        role="img"
                                        aria-label={`Sprint delivery chart: To do ${sprintDeliveryData[0]?.total || 0} pts, In progress ${sprintDeliveryData[1]?.total || 0} pts, In review ${sprintDeliveryData[2]?.total || 0} pts, Done ${sprintDeliveryData[3]?.total || 0} pts, Blocked ${sprintDeliveryData[4]?.total || 0} pts`}
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={sprintDeliveryData}
                                                maxBarSize={56}
                                                barCategoryGap="24%"
                                                margin={{ top: 16, right: 8, left: -20, bottom: 0 }}
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="var(--border)"
                                                    strokeDasharray="3 3"
                                                    opacity={0.4}
                                                />
                                                <XAxis
                                                    dataKey="stage"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-sans)' }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                                />
                                                <Tooltip
                                                    content={({ active, payload, label }) => {
                                                        if (!active || !payload?.length) return null;
                                                        return (
                                                            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-2.5 shadow-xl text-xs z-50">
                                                                <p className="font-bold text-[var(--foreground)] mb-1.5">{label}</p>
                                                                {payload
                                                                    .filter(p => Number(p.value) > 0)
                                                                    .map((p, i) => (
                                                                        <div key={i} className="flex items-center justify-between gap-4 py-0.5 text-[11px]">
                                                                            <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                                {p.name}
                                                                            </span>
                                                                            <span className="font-mono font-bold text-[var(--foreground)]">
                                                                                {p.value} pts
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        );
                                                    }}
                                                />
                                                {/* Stacked bars for each assignee */}
                                                {Object.keys(assigneeColorMap).map((name, idx) => {
                                                    const isTop = idx === Object.keys(assigneeColorMap).length - 1;
                                                    return (
                                                        <Bar
                                                            key={name}
                                                            dataKey={name}
                                                            stackId="deliveryStack"
                                                            fill={assigneeColorMap[name]}
                                                            radius={isTop ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                                                            isAnimationActive={false}
                                                        />
                                                    );
                                                })}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Legend Row */}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]/60 text-[11px]">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {Object.entries(assigneeColorMap).map(([name, color]) => (
                                                <div key={name} className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                    <span className="text-[var(--muted-foreground)] text-[10px] font-medium">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <span className="font-mono text-[10px] text-[var(--muted-foreground)] shrink-0">
                                            Story points by stage
                                        </span>
                                    </div>
                                </div>

                                {/* Task distribution (narrow, 410px tall) */}
                                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-[14px_18px] shadow-2xs h-auto lg:h-[410px] flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="font-heading font-bold text-sm text-[var(--foreground)]">
                                                Task distribution
                                            </h2>
                                            <span className="font-mono text-xs text-[var(--muted-foreground)] font-semibold">
                                                {totalTasks} total
                                            </span>
                                        </div>

                                        {/* Donut Chart with Center Percentage */}
                                        <div className="relative h-[160px] w-full flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={donutData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius="71%"
                                                        outerRadius="92%"
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                        stroke="var(--card)"
                                                        isAnimationActive={false}
                                                    >
                                                        {donutData.map(entry => (
                                                            <Cell key={entry.id} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Centered Percentage Label */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-[26px] font-heading font-extrabold text-[var(--foreground)] leading-none">
                                                    {completionRate}%
                                                </span>
                                                <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                                                    tasks complete
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown: Two Columns side-by-side */}
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border)]/60 text-xs mt-auto">
                                        
                                        {/* Column 1: Status Toggle Filters */}
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-1 font-semibold">
                                                Status
                                            </p>
                                            <div className="space-y-0.5">
                                                {Object.values(STATUS_CONFIG).map(s => {
                                                    const count = allTasks.filter(t => normalizeTaskStatus(t) === s.id).length;
                                                    const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                                                    const isPressed = activeStatusFilter === s.id;

                                                    return (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            aria-pressed={isPressed}
                                                            onClick={() => setActiveStatusFilter(prev => (prev === s.id ? null : s.id))}
                                                            className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-all text-left cursor-pointer ${
                                                                isPressed
                                                                    ? 'bg-[var(--secondary)] ring-1 ring-[var(--primary)] text-[var(--foreground)] font-bold'
                                                                    : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/40 hover:text-[var(--foreground)]'
                                                            }`}
                                                            title={`Filter queue by ${s.label}`}
                                                        >
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                                                <span className="text-[11px] truncate">{s.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                                                                <span className="font-bold text-[var(--foreground)]">{count}</span>
                                                                <span className="text-[var(--muted-foreground)]/60">({pct}%)</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Column 2: Assigned (Count) */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
                                                    Assigned
                                                </p>
                                                <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                                                    {assigneeTaskCounts.length}
                                                </span>
                                            </div>
                                            <div className="space-y-1 max-h-[135px] overflow-y-auto custom-scrollbar pr-0.5">
                                                {assigneeTaskCounts.slice(0, 5).map(item => (
                                                    <div key={item.name} className="flex items-center justify-between py-0.5">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <div
                                                                className="w-4 h-4 rounded-full text-[8px] font-bold font-mono text-white flex items-center justify-center shrink-0"
                                                                style={{ backgroundColor: item.color }}
                                                            >
                                                                {getInitials(item.name)}
                                                            </div>
                                                            <span className="text-[11px] text-[var(--muted-foreground)] truncate max-w-[85px]" title={item.name}>
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-[11px] font-bold text-[var(--foreground)]">
                                                            {item.count}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>

                            {/* ── Footer Operational Status ── */}
                            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]/60 text-[11px] text-[var(--muted-foreground)]">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                                    <span className="font-medium">All systems operational</span>
                                </div>
                                <span className="font-mono text-[10px] text-[var(--muted-foreground)]/80">
                                    StudioSprint by Vautera Labs
                                </span>
                            </div>

                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        VIEW 2: TASKS TAB (Spreadsheet / Table)
                    ══════════════════════════════════════════════════════════ */}
                    {activeView === 'spreadsheet' && (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs animate-in fade-in duration-200">
                            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                                <h2 className="font-heading font-bold text-sm text-[var(--foreground)]">
                                    Tasks Table ({allTasks.length} total)
                                </h2>
                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={handleNewTask}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Task</span>
                                    </button>
                                )}
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/40 text-[10px] font-mono uppercase text-[var(--muted-foreground)] tracking-wider">
                                            <th className="py-2.5 px-4 w-16">ID</th>
                                            <th className="py-2.5 px-4">Title</th>
                                            <th className="py-2.5 px-4">Status</th>
                                            <th className="py-2.5 px-4">Priority</th>
                                            <th className="py-2.5 px-4">Assignee</th>
                                            <th className="py-2.5 px-4 text-right">Points</th>
                                            <th className="py-2.5 px-4">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]/50">
                                        {allTasks.map(task => {
                                            const normStatus = normalizeTaskStatus(task);
                                            const statusObj = STATUS_CONFIG[normStatus] || STATUS_CONFIG.todo;
                                            const assignees = getTaskAssignees(task);
                                            const primaryAssignee = assignees[0] || 'Unassigned';
                                            const avatarColor = assigneeColorMap[primaryAssignee] || 'var(--primary)';

                                            return (
                                                <tr
                                                    key={task.id}
                                                    onClick={() => setSelectedInspectorTask(task)}
                                                    className="h-[42px] hover:bg-[var(--secondary)]/50 transition-colors cursor-pointer group"
                                                >
                                                    <td className="py-2.5 px-4 font-mono font-semibold text-[var(--muted-foreground)]">
                                                        #{task.id}
                                                    </td>
                                                    <td className="py-2.5 px-4 font-heading font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                                        {task.title}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusObj.badgeBg}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusObj.color }} />
                                                            {statusObj.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span className={`font-mono text-[10px] font-bold uppercase ${
                                                            task.priority === 'Critical' ? 'text-[var(--critical)]' : task.priority === 'High' ? 'text-[var(--warning)]' : 'text-[var(--muted-foreground)]'
                                                        }`}>
                                                            {task.priority || 'Medium'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div
                                                                className="w-5 h-5 rounded-full text-[9px] font-mono font-bold text-white flex items-center justify-center shrink-0"
                                                                style={{ backgroundColor: avatarColor }}
                                                            >
                                                                {getInitials(primaryAssignee)}
                                                            </div>
                                                            <span className="truncate max-w-[120px] text-[var(--muted-foreground)]">
                                                                {primaryAssignee}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 font-mono font-bold text-right text-[var(--foreground)]">
                                                        {task.story_points ?? (task.estimated_hours || 0)}
                                                    </td>
                                                    <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--muted-foreground)]">
                                                        {formatDate(task.due_date || task.hard_constraint_date)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        VIEW 3: SPRINT PLANNING TAB
                    ══════════════════════════════════════════════════════════ */}
                    {activeView === 'sprint' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            {/* Compact Callout at Top */}
                            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shrink-0">
                                        <TableProperties className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-sm text-[var(--foreground)]">
                                            {activeSprint?.name || 'Sprint 12'} · {pointsDelivered + pointsInFlight} of {totalPoints} points planned
                                        </p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                            Sprint velocity pacing is on track with {teamMembers.length || 4} developers committed.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => showToast('AI Task Decomposition initiated for current sprint.', 'info')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--primary)]/40 hover:bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-heading font-semibold transition-colors cursor-pointer shrink-0"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Decompose with AI</span>
                                </button>
                            </div>

                            {/* Full Sprint Breakdown Component */}
                            <SprintBreakdown
                                sprints={sprints}
                                backlogTasks={backlogTasks}
                                epics={epics}
                                project={project}
                                tenantId={tenantId}
                                canManage={canManage}
                                onNewTask={handleNewTask}
                                onFindFit={(task) => {
                                    setAssignmentTask(task);
                                    setIsAssignmentModalOpen(true);
                                }}
                            />
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        VIEW 4: EPICS TAB
                    ══════════════════════════════════════════════════════════ */}
                    {activeView === 'epic' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <EpicBreakdown
                                epics={epics}
                                epicGroups={epicGroups}
                                epicPhases={epicPhases}
                                epicPriorities={epicPriorities}
                                project={project}
                                tenantId={tenantId}
                            />
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        VIEW 5: CRITICAL PATH TAB (Gantt & CPA Synthesis)
                    ══════════════════════════════════════════════════════════ */}
                    {activeView === 'timeline' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            {/* Schedule synthesis callout */}
                            <CpaAiSummaryCard tasks={allTasks} project={project} />

                            {/* CPA Schedule Panel */}
                            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-2xs">
                                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
                                    <div>
                                        <h2 className="font-heading font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                                            <span>Critical Path Gantt Timeline</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20">
                                                Zero-Slack Pacing
                                            </span>
                                        </h2>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                            Visualizing early start, late finish, and critical paths that dictate project delivery.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium text-[var(--muted-foreground)]">
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--warning)]" /> Critical path</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--cyan)]" /> In progress</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--success)]" /> Completed</span>
                                    </div>
                                </div>

                                {/* Task Timeline Rows */}
                                <div className="space-y-3">
                                    {allTasks.map(task => {
                                        const isCrit = Boolean(task.is_critical);
                                        const normStatus = normalizeTaskStatus(task);
                                        const isCompleted = normStatus === 'completed';

                                        return (
                                            <div
                                                key={task.id}
                                                onClick={() => setSelectedInspectorTask(task)}
                                                className={`grid grid-cols-[240px_1fr_180px] items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer ${
                                                    isCrit
                                                        ? 'border-[var(--warning)]/40 bg-[var(--warning)]/5'
                                                        : 'border-[var(--border)] hover:bg-[var(--secondary)]/40'
                                                }`}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">#{task.id}</span>
                                                        <p className="font-heading font-bold text-xs text-[var(--foreground)] truncate">
                                                            {task.title}
                                                        </p>
                                                    </div>
                                                    <p className="font-mono text-[10px] text-[var(--muted-foreground)] mt-0.5">
                                                        {task.estimated_hours || 0}h work
                                                    </p>
                                                </div>

                                                {/* Mini progress bar */}
                                                <div className="relative h-6 rounded bg-[var(--secondary)]/70 overflow-hidden px-1 flex items-center">
                                                    <div
                                                        className={`h-4 rounded text-[9px] font-mono font-bold text-white px-2 flex items-center justify-between transition-all ${
                                                            isCompleted ? 'bg-[var(--success)]' : isCrit ? 'bg-[var(--warning)]' : 'bg-[var(--cyan)]'
                                                        }`}
                                                        style={{ width: `${Math.min(100, Math.max(20, (Number(task.story_points || 3) * 12)))}%` }}
                                                    >
                                                        <span>{task.story_points || 3} pts</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-2">
                                                    <CpaTaskAiButton task={task} onClick={t => setAiModalTask(t)} />
                                                    <CpaStatusBadge totalFloat={task.total_float} isCritical={task.is_critical} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        VIEW 6: BOARD TAB (Kanban Columns)
                    ══════════════════════════════════════════════════════════ */}
                    {activeView === 'board' && (
                        <div className="flex min-w-max gap-5 overflow-x-auto pb-8 custom-scrollbar animate-in fade-in duration-200 items-start">
                            {Object.values(STATUS_CONFIG).map(col => {
                                const colTasks = allTasks.filter(t => normalizeTaskStatus(t) === col.id);

                                return (
                                    <div
                                        key={col.id}
                                        onDragOver={e => {
                                             e.preventDefault();
                                             if (hoveredColId !== col.id) setHoveredColId(col.id);
                                        }}
                                        onDragLeave={() => setHoveredColId(null)}
                                        onDrop={e => {
                                             e.preventDefault();
                                             handleDropTask(col.id);
                                        }}
                                        className={`w-72 flex flex-col rounded-xl border min-h-[500px] transition-all ${
                                             hoveredColId === col.id && draggedTask && normalizeTaskStatus(draggedTask) !== col.id
                                                 ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-[var(--secondary)]'
                                                 : 'border-[var(--border)] bg-[var(--card)]'
                                        }`}
                                    >
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                                                <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">
                                                    {col.label}
                                                </h3>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--secondary)] text-[var(--muted-foreground)]">
                                                {colTasks.length}
                                            </span>
                                        </div>

                                        {/* Column Task Cards */}
                                        <div className="p-3 space-y-2.5 flex-1">
                                            {colTasks.map(task => {
                                                const assignees = getTaskAssignees(task);
                                                const primaryAssignee = assignees[0] || 'Unassigned';
                                                const avatarColor = assigneeColorMap[primaryAssignee] || 'var(--primary)';

                                                return (
                                                    <div
                                                        key={task.id}
                                                        draggable={canManage}
                                                        onDragStart={() => setDraggedTask(task)}
                                                        onClick={() => setSelectedInspectorTask(task)}
                                                        className="p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 hover:border-[var(--primary)]/60 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                                                    >
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="font-mono text-[10px] text-[var(--muted-foreground)]">#{task.id}</span>
                                                            {task.is_critical && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/20">
                                                                    Critical
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h4 className="font-heading font-bold text-xs text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-2">
                                                            {task.title}
                                                        </h4>

                                                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/40 text-[10px]">
                                                            <span className="font-mono font-semibold text-[var(--muted-foreground)]">
                                                                {task.story_points ?? (task.estimated_hours || 0)} SP
                                                            </span>
                                                            <div
                                                                className="w-5 h-5 rounded-full text-[9px] font-mono font-bold text-white flex items-center justify-center shrink-0"
                                                                style={{ backgroundColor: avatarColor }}
                                                                title={primaryAssignee}
                                                            >
                                                                {getInitials(primaryAssignee)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {colTasks.length === 0 && (
                                                <div className="py-8 text-center text-xs text-[var(--muted-foreground)] font-mono">
                                                    Empty
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                SHARED TASK INSPECTOR SHEET (Opens on any task click)
            ══════════════════════════════════════════════════════════════════ */}
            {selectedInspectorTask && (
                <TaskFlyoutInspector
                    isOpen={Boolean(selectedInspectorTask)}
                    task={selectedInspectorTask}
                    onClose={() => setSelectedInspectorTask(null)}
                    updateTask={handleUpdateTask}
                    onUpdateStatus={(t, newStatus) => handleStatusChange(t, newStatus)}
                    canManage={canManage}
                    currentUserId={currentAuth?.user?.id}
                    teamMembers={teamMembers}
                />
            )}

            {/* ── Additional Modals Preserved ── */}
            <ManualTaskModal
                isOpen={isManualTaskOpen}
                onClose={() => setIsManualTaskOpen(false)}
                project={project}
                tenantId={tenantId}
                sprints={(sprints || []).filter(s => s.status !== 'completed')}
                teamMembers={teamMembers}
                skills={skills}
                positions={positions}
                editingTask={editingTask}
            />

            <BestFitModal
                isOpen={Boolean(bestFitTask)}
                onClose={() => setBestFitTask(null)}
                task={bestFitTask}
                teamMembers={teamMembers}
                tenantId={tenantId}
                onSuccess={handleAssignmentSuccess}
            />

            <ProjectAiAssistant
                projectId={project.id}
                tenantId={tenantId}
                teamMembers={teamMembers}
                canManage={canManage}
            />

            <UpdateTaskStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                task={statusEditingTask}
                project={project}
                tenantId={tenantId}
                onSuccess={(id, spStatus, kbStatus) => {
                    handleUpdateTask(id, { sprint_status: spStatus, status: kbStatus });
                }}
            />

            <ManageAssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                task={assignmentTask}
                teamMembers={teamMembers}
                onTriggerAi={t => setBestFitTask(t)}
                project={project}
                tenantId={tenantId}
                onSuccess={handleAssignmentSuccess}
            />

            <CpaTaskAiModal
                task={aiModalTask}
                isOpen={Boolean(aiModalTask)}
                onClose={() => setAiModalTask(null)}
            />
        </ProjectLayout>
    );
}
