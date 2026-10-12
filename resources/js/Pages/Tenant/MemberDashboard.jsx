import React, { useState, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/Components/UI/card';
import { Badge } from '@/Components/UI/badge';
import { Progress } from '@/Components/UI/progress';
import { Button } from '@/Components/UI/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/UI/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/UI/tabs';
import DataTable from '@/Components/UI/data-table';
import PriorityBadge from '@/Components/Tenant/PriorityBadge';
import TaskFlyoutInspector from '@/Components/Tenant/Tasks/TaskFlyoutInspector';
import { showToast } from '@/Components/SystemToast';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import {
    CheckSquare,
    Clock,
    Flame,
    Target,
    MessageSquare,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Activity,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';

const STATUS_COLORS = {
    todo: '#94a3b8',
    in_progress: '#007CFF',
    review: '#f59e0b',
    completed: '#10b981',
    stuck: '#f43f5e',
};

/**
 * Compact SVG Ring Visualization for overall progress
 */
function ProgressRing({ percent = 0, size = 52, strokeWidth = 5 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const clamped = Math.min(100, Math.max(0, percent));
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-brand transition-all duration-500 ease-out"
                />
            </svg>
            <span className="absolute type-caption font-bold text-slate-800 dark:text-slate-200">
                {Math.round(clamped)}%
            </span>
        </div>
    );
}

/**
 * Segmented Multi-Color Bar for Open Tasks by Status
 */
function SegmentedStatusBar({ breakdown = { todo: 0, in_progress: 0, review: 0, stuck: 0 }, total = 0 }) {
    const sum = total || (breakdown.todo + breakdown.in_progress + breakdown.review + (breakdown.stuck || 0));
    if (sum === 0) {
        return (
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800" title="No active tasks" />
        );
    }

    const segments = [
        { key: 'todo', count: breakdown.todo || 0, bg: 'bg-slate-400', label: 'To Do' },
        { key: 'in_progress', count: breakdown.in_progress || 0, bg: 'bg-[#007CFF]', label: 'In Progress' },
        { key: 'review', count: breakdown.review || 0, bg: 'bg-amber-500', label: 'In Review' },
        { key: 'stuck', count: breakdown.stuck || 0, bg: 'bg-rose-500', label: 'Blocked' },
    ].filter(s => s.count > 0);

    return (
        <div className="space-y-1.5 w-full">
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 gap-0.5">
                {segments.map(seg => (
                    <div
                        key={seg.key}
                        style={{ width: `${(seg.count / sum) * 100}%` }}
                        className={`h-full ${seg.bg} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                        title={`${seg.label}: ${seg.count}`}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2 type-caption flex-wrap text-slate-500 dark:text-slate-400">
                {segments.map(seg => (
                    <span key={seg.key} className="inline-flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${seg.bg}`} />
                        <span>{seg.count} {seg.label}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * Split Bar for Due Soon / Overdue / On Track
 */
function DueDateSplitBar({ breakdown = { overdue: 0, due_soon: 0, on_track: 0 } }) {
    const total = (breakdown.overdue || 0) + (breakdown.due_soon || 0) + (breakdown.on_track || 0);
    if (total === 0) {
        return (
            <div className="w-full h-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40" title="All tasks on track" />
        );
    }

    const segments = [
        { key: 'overdue', count: breakdown.overdue || 0, bg: 'bg-rose-500', label: 'Overdue' },
        { key: 'due_soon', count: breakdown.due_soon || 0, bg: 'bg-amber-500', label: 'Due ≤ 48h' },
        { key: 'on_track', count: breakdown.on_track || 0, bg: 'bg-emerald-500', label: 'On Track' },
    ].filter(s => s.count > 0);

    return (
        <div className="space-y-1.5 w-full">
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 gap-0.5">
                {segments.map(seg => (
                    <div
                        key={seg.key}
                        style={{ width: `${(seg.count / total) * 100}%` }}
                        className={`h-full ${seg.bg} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                        title={`${seg.label}: ${seg.count}`}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2 type-caption flex-wrap text-slate-500 dark:text-slate-400">
                {segments.map(seg => (
                    <span key={seg.key} className="inline-flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${seg.bg}`} />
                        <span>{seg.count} {seg.label}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function MemberDashboard({
    studio,
    metrics = {},
    charts = {},
    tables = {},
    projects = [],
    activeSprint = null,
}) {
    const { auth, activeWorkspace } = usePage().props;
    const user = auth?.user;
    const studioName = studio?.name || 'Studio';

    // Local tasks list for optimistic updates
    const [tasksList, setTasksList] = useState(tables.my_tasks || []);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    React.useEffect(() => {
        setTasksList(tables.my_tasks || []);
    }, [tables.my_tasks]);

    // Open side panel in-place preview
    const handleTaskClick = (task) => {
        if (!task) return;
        setSelectedTask(task);
        setIsInspectorOpen(true);
    };

    // Quick status update from side panel
    const handleUpdateTaskStatus = async (task, newStatus, note) => {
        return new Promise((resolve, reject) => {
            router.patch(
                route('tenant.tasks.update-status', {
                    tenant: studio?.id || activeWorkspace,
                    task: task.id,
                }),
                {
                    status: newStatus,
                    completion_notes: note,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        showToast(`Task #${task.id} updated to ${newStatus}`, 'success');
                        setTasksList((prev) =>
                            prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
                        );
                        resolve();
                    },
                    onError: (err) => {
                        console.error('Task status update failed:', err);
                        showToast('Failed to update task status.', 'error');
                        reject(new Error('Failed to update task status'));
                    },
                }
            );
        });
    };

    // TanStack Columns: My Tasks
    const myTasksColumns = useMemo(
        () => [
            {
                accessorKey: 'priority',
                header: 'Priority',
                cell: ({ row }) => (
                    <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={row.original.priority} />
                        {row.original.is_critical && (
                            <span title="Critical Path Task">
                                <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            </span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'title',
                header: 'Task Title',
                cell: ({ row }) => (
                    <button
                        type="button"
                        onClick={() => handleTaskClick(row.original)}
                        className="text-left group flex flex-col max-w-[320px] cursor-pointer"
                    >
                        <span className="type-body font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light truncate transition-colors">
                            {row.original.title}
                        </span>
                        <span className="type-caption text-slate-500 dark:text-slate-400 truncate">
                            {row.original.project_name || 'Studio Task'}
                        </span>
                    </button>
                ),
            },
            {
                accessorKey: 'due_date',
                header: 'Due Date',
                cell: ({ row }) => {
                    const days = row.original.days_until_deadline;
                    const isOverdue = days !== null && days < 0;
                    const isSoon = days !== null && days >= 0 && days <= 2;

                    return (
                        <div className="flex flex-col">
                            <span className={`type-caption ${isOverdue ? 'text-rose-600 font-bold' : isSoon ? 'text-amber-600 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                                {row.original.due_date || (days !== null ? `${days}d left` : 'No deadline')}
                            </span>
                            {isOverdue && (
                                <span className="text-[10px] text-rose-500 font-mono">
                                    Past due by {Math.abs(days)}d
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const s = row.original.status;
                    const map = {
                        todo: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                        in_progress: 'bg-brand/10 text-brand dark:text-brand-light',
                        review: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
                        completed: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
                        stuck: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
                    };
                    const label = {
                        todo: 'To Do',
                        in_progress: 'In Progress',
                        review: 'In Review',
                        completed: 'Completed',
                        stuck: 'Blocked',
                    };
                    return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${map[s] || map.todo}`}>
                            {label[s] || s}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'story_points',
                header: 'Points / Hrs',
                cell: ({ row }) => (
                    <span className="font-mono type-caption text-slate-500 dark:text-slate-400">
                        {row.original.story_points ? `${row.original.story_points} SP` : '—'} • {row.original.estimated_hours || 0}h
                    </span>
                ),
            },
            {
                id: 'action',
                header: '',
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTaskClick(row.original)}
                        className="h-7 type-caption font-semibold text-brand hover:text-brand-dark cursor-pointer"
                    >
                        Inspect
                    </Button>
                ),
            },
        ],
        [tasksList]
    );

    // TanStack Columns: Up Next (Top 3)
    const upNextColumns = useMemo(
        () => [
            {
                accessorKey: 'priority',
                header: 'Priority',
                cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
            },
            {
                accessorKey: 'title',
                header: 'Next Priority Task',
                cell: ({ row }) => (
                    <button
                        type="button"
                        onClick={() => handleTaskClick(row.original)}
                        className="text-left group flex flex-col max-w-[320px] cursor-pointer"
                    >
                        <span className="type-body font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light truncate transition-colors">
                            {row.original.title}
                        </span>
                        <span className="type-caption text-slate-500 dark:text-slate-400 truncate">
                            {row.original.project_name}
                        </span>
                    </button>
                ),
            },
            {
                accessorKey: 'due_date',
                header: 'Target Due',
                cell: ({ row }) => (
                    <span className="type-caption text-slate-600 dark:text-slate-300">
                        {row.original.due_date || 'No deadline'}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'State',
                cell: ({ row }) => (
                    <Badge variant="outline" className="capitalize text-xs">
                        {row.original.status.replace('_', ' ')}
                    </Badge>
                ),
            },
            {
                id: 'action',
                header: '',
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        onClick={() => handleTaskClick(row.original)}
                        className="h-7 text-xs bg-brand hover:bg-brand-dark text-white gap-1 cursor-pointer"
                    >
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                ),
            },
        ],
        []
    );

    // TanStack Columns: Needs My Review
    const needsMyReviewColumns = useMemo(
        () => [
            {
                accessorKey: 'title',
                header: 'Review Request',
                cell: ({ row }) => (
                    <button
                        type="button"
                        onClick={() => handleTaskClick(row.original)}
                        className="text-left group flex flex-col max-w-[280px] cursor-pointer"
                    >
                        <span className="type-body font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light truncate transition-colors">
                            {row.original.title}
                        </span>
                        <span className="type-caption text-slate-500 dark:text-slate-400 truncate">
                            {row.original.project_name}
                        </span>
                    </button>
                ),
            },
            {
                accessorKey: 'assignee_name',
                header: 'Author',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={row.original.assignee_avatar} />
                            <AvatarFallback className="text-[10px]">
                                {row.original.assignee_name?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="type-caption text-slate-700 dark:text-slate-300">
                            {row.original.assignee_name}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'priority',
                header: 'Priority',
                cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
            },
            {
                accessorKey: 'created_at_human',
                header: 'Submitted',
                cell: ({ row }) => (
                    <span className="type-caption text-slate-500 dark:text-slate-400">
                        {row.original.created_at_human}
                    </span>
                ),
            },
            {
                id: 'action',
                header: '',
                cell: ({ row }) => (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskClick(row.original)}
                        className="h-7 text-xs font-semibold text-brand hover:text-brand-dark border-brand/30 hover:bg-brand/10 gap-1 cursor-pointer"
                    >
                        <span>Review</span>
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                ),
            },
        ],
        []
    );

    // TanStack Columns: Recent Messages & Mentions
    const recentMessagesColumns = useMemo(
        () => [
            {
                accessorKey: 'title',
                header: 'Message / Mention',
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="type-body font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[300px]">
                            {row.original.title}
                        </span>
                        <span className="type-caption text-slate-600 dark:text-slate-400 line-clamp-1">
                            {row.original.body}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'type',
                header: 'Type',
                cell: ({ row }) => {
                    const isMention = row.original.type === 'channel_mention';
                    return (
                        <Badge variant={isMention ? 'default' : 'secondary'} className="text-[10px] capitalize">
                            {isMention ? 'Mention' : 'Direct Message'}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'created_at_human',
                header: 'Received',
                cell: ({ row }) => (
                    <span className="type-caption text-slate-500 dark:text-slate-400">
                        {row.original.created_at_human}
                    </span>
                ),
            },
            {
                id: 'action',
                header: '',
                cell: ({ row }) => (
                    <Link
                        href={route('tenant.inbox', { tenant: studio?.id || activeWorkspace })}
                        className="type-caption font-semibold text-brand hover:underline"
                    >
                        Reply
                    </Link>
                ),
            },
        ],
        [studio?.id, activeWorkspace]
    );

    // ── Metric Card Computations ──
    const openTasksMetric = metrics.open_tasks || {
        count: metrics.open_tasks_count || 0,
        breakdown: { todo: 0, in_progress: 0, review: 0, stuck: 0 },
    };

    const dueSoonMetric = metrics.due_soon || {
        count: metrics.due_soon_count || 0,
        breakdown: { overdue: 0, due_soon: 0, on_track: 0 },
    };

    const overallProgressMetric = metrics.overall_progress || {
        completed: 0,
        total: 0,
        percent: 0,
    };

    const hoursMetric = metrics.hours_this_week || {
        hours: 0,
        limit: 40,
        percent: 0,
        is_overloaded: false,
    };

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`My Work — ${studioName}`} />

            <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950 px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-8 w-full">
                {/* ── Top Header (Member Focus) ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="type-page-title text-slate-900 dark:text-slate-50">
                                My Work
                            </h1>
                            <Badge variant="outline" className="text-xs font-semibold">
                                Member Focus
                            </Badge>
                        </div>
                        <p className="mt-1 type-subheading text-slate-500 dark:text-slate-400">
                            Your personal tasks, code reviews, weekly capacity, and sprint milestones.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href={route('tenant.inbox', { tenant: studio?.id || activeWorkspace })}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                        >
                            <MessageSquare className="h-4 w-4 text-brand" />
                            <span>Inbox</span>
                        </Link>
                    </div>
                </div>

                {/* ── Exactly 4 Workload Metric Cards with Compact Visuals ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1: My Open Tasks */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="type-subheading flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span>My Open Tasks</span>
                                <CheckSquare className="h-4 w-4 text-brand" />
                            </CardDescription>
                            <div className="flex items-baseline justify-between gap-2 mt-1">
                                <CardTitle className="type-metric-number text-slate-900 dark:text-slate-50">
                                    {openTasksMetric.count}
                                </CardTitle>
                                <span className="type-caption text-slate-400 dark:text-slate-500 font-medium">
                                    assigned to you
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <SegmentedStatusBar breakdown={openTasksMetric.breakdown} total={openTasksMetric.count} />
                        </CardContent>
                    </Card>

                    {/* Card 2: Due Soon / Overdue */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="type-subheading flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span>Due Soon / Overdue</span>
                                <Clock className={`h-4 w-4 ${dueSoonMetric.count > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                            </CardDescription>
                            <div className="flex items-baseline justify-between gap-2 mt-1">
                                <CardTitle className={`type-metric-number ${
                                    (dueSoonMetric.breakdown?.overdue || 0) > 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : dueSoonMetric.count > 0
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-slate-900 dark:text-slate-50'
                                }`}>
                                    {dueSoonMetric.count}
                                </CardTitle>
                                <span className="type-caption text-slate-400 dark:text-slate-500 font-medium">
                                    {(dueSoonMetric.breakdown?.overdue || 0) > 0 ? 'action required' : 'deadline alerts'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <DueDateSplitBar breakdown={dueSoonMetric.breakdown} />
                        </CardContent>
                    </Card>

                    {/* Card 3: Overall Progress */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="type-subheading flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span>Overall Progress</span>
                                <Target className="h-4 w-4 text-emerald-500" />
                            </CardDescription>
                            <div className="flex items-center justify-between gap-3 mt-1">
                                <div>
                                    <CardTitle className="type-metric-number text-slate-900 dark:text-slate-50">
                                        {overallProgressMetric.percent}%
                                    </CardTitle>
                                    <span className="type-caption text-slate-500 dark:text-slate-400 block mt-0.5">
                                        {overallProgressMetric.completed} of {overallProgressMetric.total} tasks completed
                                    </span>
                                </div>
                                <ProgressRing percent={overallProgressMetric.percent} />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-1">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, overallProgressMetric.percent)}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Weekly Hours vs Capacity */}
                    <Card className={`shadow-xs hover:shadow-md transition-shadow ${
                        hoursMetric.is_overloaded ? 'border-rose-400/60 dark:border-rose-500/40 bg-rose-50/10' : ''
                    }`}>
                        <CardHeader className="pb-2">
                            <CardDescription className="type-subheading flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span>Weekly Hours vs Capacity</span>
                                <Activity className={`h-4 w-4 ${hoursMetric.is_overloaded ? 'text-rose-500' : 'text-brand'}`} />
                            </CardDescription>
                            <div className="flex items-baseline justify-between gap-2 mt-1">
                                <CardTitle className={`type-metric-number ${
                                    hoursMetric.is_overloaded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-50'
                                }`}>
                                    {hoursMetric.hours}h <span className="type-subheading text-slate-400 font-normal">/ {hoursMetric.limit}h</span>
                                </CardTitle>
                                {hoursMetric.is_overloaded ? (
                                    <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
                                        Overload
                                    </Badge>
                                ) : (
                                    <span className="type-caption text-slate-400 dark:text-slate-500 font-medium">
                                        {hoursMetric.percent}% utilized
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2 space-y-1.5">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        hoursMetric.is_overloaded ? 'bg-rose-500 animate-pulse' : 'bg-brand'
                                    }`}
                                    style={{ width: `${Math.min(100, hoursMetric.percent)}%` }}
                                />
                            </div>
                            <span className="type-caption text-slate-500 dark:text-slate-400 block truncate">
                                {hoursMetric.is_overloaded
                                    ? `Exceeds weekly capacity by ${(hoursMetric.hours - hoursMetric.limit).toFixed(1)}h`
                                    : `${(hoursMetric.limit - hoursMetric.hours).toFixed(1)}h available this week`}
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Scaled Charts Section (Larger heights and responsive grid) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Split (Donut) */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="type-section-title text-slate-900 dark:text-slate-100">
                                My Tasks by Status
                            </CardTitle>
                            <CardDescription className="type-subheading text-slate-500 dark:text-slate-400">
                                Distribution of your current assignments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.status_split || []}
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {(charts.status_split || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || STATUS_COLORS[entry.status]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                borderRadius: '0.75rem',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                color: '#fff',
                                                fontSize: '12px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                {(charts.status_split || []).map((item) => (
                                    <div key={item.status} className="flex items-center gap-2 type-caption">
                                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sprint Progress Burndown (Area Chart) */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="type-section-title text-slate-900 dark:text-slate-100">
                                My Sprint Progress
                            </CardTitle>
                            <CardDescription className="type-subheading text-slate-500 dark:text-slate-400">
                                Story points burndown in active sprint.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            {charts.sprint_progress?.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.sprint_progress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                borderRadius: '0.75rem',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                color: '#fff',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Area type="monotone" dataKey="ideal" name="Target" stroke="#94a3b8" strokeDasharray="3 3" fill="#94a3b8" fillOpacity={0.1} />
                                        <Area type="monotone" dataKey="actual" name="Remaining Points" stroke="#007CFF" strokeWidth={2.5} fill="#007CFF" fillOpacity={0.2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                                    <Target className="h-8 w-8 stroke-1" />
                                    <span className="type-caption text-center px-4">No active sprint points. Items will plot here during sprints.</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Completed Work per Week (Bar Chart) */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="type-section-title text-slate-900 dark:text-slate-100">
                                Completed Work per Week
                            </CardTitle>
                            <CardDescription className="type-subheading text-slate-500 dark:text-slate-400">
                                Your delivery velocity and completed task volume.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.weekly_completed || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            borderRadius: '0.75rem',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#fff',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="completed" name="Tasks Done" fill="#10b981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Member Action Tables ── */}
                <div className="space-y-4">
                    <Tabs defaultValue="tasks" className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div>
                                <h3 className="type-section-title text-slate-900 dark:text-slate-100">
                                    Assignments & Reviews
                                </h3>
                                <p className="type-subheading text-slate-500 dark:text-slate-400">
                                    Prioritized tasks, pending peer reviews, and teammate mentions.
                                </p>
                            </div>
                            <TabsList className="bg-slate-100 dark:bg-slate-800">
                                <TabsTrigger value="tasks" className="type-subheading">
                                    My Tasks ({tasksList.length})
                                </TabsTrigger>
                                <TabsTrigger value="upnext" className="type-subheading">
                                    Up Next ({tables.up_next?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="reviews" className="type-subheading">
                                    Needs My Review ({tables.needs_my_review?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="messages" className="type-subheading">
                                    Messages & Mentions
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="tasks" className="mt-4">
                            <DataTable
                                columns={myTasksColumns}
                                data={tasksList}
                                emptyMessage="You have no tasks assigned right now."
                            />
                        </TabsContent>

                        <TabsContent value="upnext" className="mt-4">
                            <DataTable
                                columns={upNextColumns}
                                data={tables.up_next || []}
                                emptyMessage="No queued tasks. You are all caught up!"
                            />
                        </TabsContent>

                        <TabsContent value="reviews" className="mt-4">
                            <DataTable
                                columns={needsMyReviewColumns}
                                data={tables.needs_my_review || []}
                                emptyMessage="No peer code reviews waiting on you."
                            />
                        </TabsContent>

                        <TabsContent value="messages" className="mt-4">
                            <DataTable
                                columns={recentMessagesColumns}
                                data={tables.recent_messages || []}
                                emptyMessage="No recent messages or mentions."
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* ── Restored Side Panel Task Inspector (In-place preview, Esc handling, quick status updates) ── */}
            <TaskFlyoutInspector
                isOpen={isInspectorOpen}
                task={selectedTask}
                onClose={() => {
                    setIsInspectorOpen(false);
                    setSelectedTask(null);
                }}
                onUpdateStatus={handleUpdateTaskStatus}
                canManage={false}
                currentUserId={user?.id}
            />
        </TenantLayout>
    );
}
