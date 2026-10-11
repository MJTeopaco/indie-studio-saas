import React, { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import DataTable from '@/Components/ui/data-table';
import PriorityBadge from '@/Components/Tenant/PriorityBadge';
import CpaStatusBadge from '@/Components/Tenant/CpaStatusBadge';
import MemberTaskDetailModal from '@/Components/Tenant/Tasks/MemberTaskDetailModal';
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
    Sparkles,
    Eye,
    MessageSquare,
    Calendar,
    ArrowRight,
    Inbox,
    AlertCircle,
    CheckCircle2,
    Layers,
    Activity,
    ExternalLink,
} from 'lucide-react';
import axios from 'axios';

const STATUS_COLORS = {
    todo: '#94a3b8',
    in_progress: '#007CFF',
    review: '#f59e0b',
    completed: '#10b981',
};

export default function MemberDashboard({
    studio,
    metrics = {},
    charts = {},
    tables = {},
    projects = [],
    activeSprint = null,
    pendingEstimatesCount = 0,
}) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const studioName = studio?.name || 'Studio';

    // Local tasks list for optimistic updates
    const [tasksList, setTasksList] = useState(tables.my_tasks || []);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    React.useEffect(() => {
        setTasksList(tables.my_tasks || []);
    }, [tables.my_tasks]);

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
    };

    const handleTaskUpdated = (updatedTask) => {
        setTasksList((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        );
    };

    const handleQuickStatusChange = async (task, newStatus) => {
        const prev = [...tasksList];
        setTasksList((curr) =>
            curr.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );

        try {
            const url = route('tenant.tasks.update-status', {
                tenant: studio.id,
                task: task.id,
            });
            await axios.patch(url, { sprint_status: newStatus });
        } catch (err) {
            console.error('Failed to update status', err);
            setTasksList(prev);
        }
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
                        className="text-left group flex flex-col max-w-[280px]"
                    >
                        <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light truncate transition-colors">
                            {row.original.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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
                            <span className={`text-xs ${isOverdue ? 'text-rose-600 font-bold' : isSoon ? 'text-amber-600 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${map[s] || map.todo}`}>
                            {label[s] || s}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'story_points',
                header: 'Points / Hrs',
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
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
                        className="h-7 text-xs font-semibold text-brand hover:text-brand-dark"
                    >
                        View
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
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[280px]">
                            {row.original.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {row.original.project_name}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'due_date',
                header: 'Target Due',
                cell: ({ row }) => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
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
                        className="h-7 text-xs bg-brand hover:bg-brand-dark text-white gap-1"
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
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[260px]">
                            {row.original.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {row.original.project_name}
                        </span>
                    </div>
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
                                {row.original.assignee_name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-700 dark:text-slate-300">
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {row.original.created_at_human}
                    </span>
                ),
            },
            {
                id: 'action',
                header: '',
                cell: ({ row }) => (
                    <Link
                        href={route('tenant.tasks', { tenant: studio.id })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                    >
                        <span>Review</span>
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                ),
            },
        ],
        [studio.id]
    );

    // TanStack Columns: Recent Messages & Mentions
    const recentMessagesColumns = useMemo(
        () => [
            {
                accessorKey: 'title',
                header: 'Message / Mention',
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[280px]">
                            {row.original.title}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {row.original.created_at_human}
                    </span>
                ),
            },
            {
                id: 'action',
                header: '',
                cell: ({ row }) => (
                    <Link
                        href={route('tenant.inbox', { tenant: studio.id })}
                        className="text-xs font-semibold text-brand hover:underline"
                    >
                        Reply
                    </Link>
                ),
            },
        ],
        [studio.id]
    );

    const hoursData = metrics.hours_this_week || { hours: 0, limit: 40, percent: 0 };

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`My Work — ${studioName}`} />

            <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950 px-6 py-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* ── Top Header (No Create Buttons for Members) ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold font-heading tracking-tight text-slate-900 dark:text-slate-50">
                                My Work
                            </h1>
                            <Badge variant="outline" className="text-xs font-semibold">
                                Member Focus
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Your personal tasks, code reviews, weekly capacity, and sprint milestones.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('tenant.inbox', { tenant: studio.id })}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                        >
                            <MessageSquare className="h-4 w-4 text-brand" />
                            <span>Inbox ({metrics.unread_mentions_count || 0})</span>
                        </Link>
                    </div>
                </div>

                {/* ── Number Cards Grid (7 Cards) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
                    {/* My Open Tasks */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Open Tasks</span>
                                <CheckSquare className="h-4 w-4 text-brand" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {metrics.open_tasks_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Assigned to you
                            </span>
                        </CardContent>
                    </Card>

                    {/* Due Soon / Overdue */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Due Soon / Late</span>
                                <Clock className="h-4 w-4 text-amber-500" />
                            </CardDescription>
                            <CardTitle className={`text-2xl font-bold font-heading ${
                                metrics.due_soon_count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-50'
                            }`}>
                                {metrics.due_soon_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Within 48h or overdue
                            </span>
                        </CardContent>
                    </Card>

                    {/* Waiting for Review */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>In Review</span>
                                <Eye className="h-4 w-4 text-indigo-500" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {metrics.waiting_review_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Awaiting reviewer check
                            </span>
                        </CardContent>
                    </Card>

                    {/* My Hours This Week */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Weekly Hours</span>
                                <Activity className="h-4 w-4 text-emerald-500" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {hoursData.hours}h
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <Progress value={Math.min(100, hoursData.percent)} className="h-1.5 [&>div]:bg-emerald-500" />
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Limit: {hoursData.limit}h ({hoursData.percent}%)
                            </span>
                        </CardContent>
                    </Card>

                    {/* Points This Sprint */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Sprint Points</span>
                                <Target className="h-4 w-4 text-purple-500" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {metrics.points_this_sprint} SP
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Committed capacity
                            </span>
                        </CardContent>
                    </Card>

                    {/* Planning Poker Votes */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Poker Votes</span>
                                <Sparkles className="h-4 w-4 text-brand" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {metrics.pending_votes_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Awaiting your estimate
                            </span>
                        </CardContent>
                    </Card>

                    {/* Unread Mentions */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Mentions</span>
                                <MessageSquare className="h-4 w-4 text-sky-500" />
                            </CardDescription>
                            <CardTitle className={`text-2xl font-bold font-heading ${
                                metrics.unread_mentions_count > 0 ? 'text-brand' : 'text-slate-900 dark:text-slate-50'
                            }`}>
                                {metrics.unread_mentions_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Unread notifications
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Personal Charts Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Split (Donut) */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold">
                                My Tasks by Status
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Distribution of your current assignments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-[170px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.status_split || []}
                                            innerRadius={45}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {(charts.status_split || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || STATUS_COLORS[entry.status]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {(charts.status_split || []).map((item) => (
                                    <div key={item.status} className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                                        <span className="font-mono font-bold ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sprint Progress Burndown (Area Chart) */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold">
                                My Sprint Progress
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Story points burndown in active sprint.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[220px]">
                            {charts.sprint_progress?.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.sprint_progress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="ideal" name="Target" stroke="#94a3b8" strokeDasharray="3 3" fill="#94a3b8" fillOpacity={0.1} />
                                        <Area type="monotone" dataKey="actual" name="Remaining Points" stroke="#007CFF" strokeWidth={2} fill="#007CFF" fillOpacity={0.2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                                    <Target className="h-8 w-8 stroke-1" />
                                    <span className="text-xs text-center px-4">No active sprint points. Items will plot here during sprints.</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Completed Work per Week (Bar Chart) */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold">
                                Completed Work per Week
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Your velocity and completed task volume.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.weekly_completed || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="completed" name="Tasks Done" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
                                    Assignments & Reviews
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Prioritized tasks, pending peer reviews, and teammate mentions.
                                </p>
                            </div>
                            <TabsList className="bg-slate-100 dark:bg-slate-800">
                                <TabsTrigger value="tasks" className="text-xs">
                                    My Tasks ({tasksList.length})
                                </TabsTrigger>
                                <TabsTrigger value="upnext" className="text-xs">
                                    Up Next ({tables.up_next?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="reviews" className="text-xs">
                                    Needs My Review ({tables.needs_my_review?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="messages" className="text-xs">
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

            {/* ── Task Detail Modal ── */}
            {isDetailModalOpen && selectedTask && (
                <MemberTaskDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    tenantId={studio.id}
                    currentUserId={user?.id}
                    onStatusChange={(newStatus) => {
                        handleQuickStatusChange(selectedTask, newStatus);
                        setIsDetailModalOpen(false);
                    }}
                />
            )}
        </TenantLayout>
    );
}
