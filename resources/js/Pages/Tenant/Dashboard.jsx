import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
import { Separator } from '@/Components/ui/separator';
import DataTable from '@/Components/ui/data-table';
import PriorityBadge from '@/Components/Tenant/PriorityBadge';
import CpaStatusBadge from '@/Components/Tenant/CpaStatusBadge';
import CreateProjectModal from '@/Components/Tenant/Projects/CreateProjectModal';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
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
    TrendingUp,
    AlertTriangle,
    Flame,
    UserX,
    Clock,
    Sparkles,
    Plus,
    Layers,
    Activity,
    CheckCircle2,
    ArrowRight,
    Shield,
    Calendar,
    Users,
    FolderKanban,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';

const STATUS_COLORS = {
    todo: '#94a3b8',
    in_progress: '#007CFF',
    review: '#f59e0b',
    completed: '#10b981',
};

export default function TenantDashboard({
    studio,
    metrics = {},
    charts = {},
    tables = {},
    isOwner = false,
    studioLeadership = [],
    quickActions = {},
}) {
    const studioName = studio?.name || 'Studio';

    // Quick Action modal states
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(
        quickActions.projects?.[0]?.id || ''
    );

    const overallProgress = metrics.overall_progress || {
        percent: 0,
        completed_tasks: 0,
        total_tasks: 0,
        completed_points: 0,
        total_points: 0,
    };
    const currentSprint = metrics.current_sprint || {
        has_sprint: false,
        name: 'No active sprint',
        days_left: null,
        percent: 0,
    };

    const handleProjectCreated = (newProject) => {
        setIsProjectModalOpen(false);
        if (newProject?.id) {
            router.visit(route('tenant.projects.show', { tenant: studio.id, project: newProject.id }));
        } else {
            router.reload();
        }
    };

    // TanStack Columns: Needs Attention (At-Risk Tasks)
    const needsAttentionColumns = useMemo(
        () => [
            {
                accessorKey: 'title',
                header: 'Task',
                cell: ({ row }) => (
                    <div className="flex flex-col gap-0.5 max-w-[240px]">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {row.original.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {row.original.project_name}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'assignee_name',
                header: 'Assignee',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={row.original.assignee_avatar} />
                            <AvatarFallback className="text-[10px]">
                                {row.original.assignee_name?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[110px] text-xs">
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
                accessorKey: 'total_float',
                header: 'CPA Health',
                cell: ({ row }) => (
                    <CpaStatusBadge
                        totalFloat={row.original.total_float}
                        isCritical={row.original.is_critical}
                    />
                ),
            },
            {
                accessorKey: 'due_date',
                header: 'Deadline',
                cell: ({ row }) => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                        {row.original.due_date || (row.original.days_until_deadline !== null ? `${row.original.days_until_deadline}d left` : 'No date')}
                    </span>
                ),
            },
        ],
        []
    );

    // TanStack Columns: Team Snapshot
    const teamSnapshotColumns = useMemo(
        () => [
            {
                accessorKey: 'name',
                header: 'Member',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={row.original.avatar} />
                            <AvatarFallback className="text-xs font-semibold">
                                {row.original.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {row.original.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {row.original.position || row.original.role}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'active_tasks_count',
                header: 'Active Tasks',
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-semibold">
                        {row.original.active_tasks_count}
                    </span>
                ),
            },
            {
                accessorKey: 'load_percent',
                header: 'Weekly Load',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 min-w-[140px]">
                        <Progress
                            value={Math.min(100, row.original.load_percent)}
                            className={`h-2 flex-1 ${
                                row.original.is_overloaded
                                    ? '[&>div]:bg-rose-500'
                                    : row.original.load_percent > 80
                                    ? '[&>div]:bg-amber-500'
                                    : '[&>div]:bg-brand'
                            }`}
                        />
                        <span
                            className={`text-xs font-mono font-bold ${
                                row.original.is_overloaded
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            {row.original.load_percent}%
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'assigned_hours',
                header: 'Hours',
                cell: ({ row }) => (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {row.original.assigned_hours}h / {row.original.max_hours}h
                    </span>
                ),
            },
        ],
        []
    );

    // TanStack Columns: Projects
    const projectsColumns = useMemo(
        () => [
            {
                accessorKey: 'name',
                header: 'Project',
                cell: ({ row }) => (
                    <Link
                        href={route('tenant.projects.show', { tenant: studio.id, project: row.original.id })}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-brand-light transition-colors"
                    >
                        {row.original.name}
                    </Link>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge variant="outline" className="capitalize text-xs">
                        {row.original.status}
                    </Badge>
                ),
            },
            {
                accessorKey: 'progress_percent',
                header: 'Progress',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 min-w-[130px]">
                        <Progress value={row.original.progress_percent} className="h-2 flex-1 [&>div]:bg-brand" />
                        <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {row.original.progress_percent}%
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'deadline_formatted',
                header: 'Target Date',
                cell: ({ row }) => (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {row.original.deadline_formatted}
                    </span>
                ),
            },
            {
                accessorKey: 'health',
                header: 'Health',
                cell: ({ row }) => {
                    const health = row.original.health;
                    if (health === 'delayed') {
                        return (
                            <Badge variant="destructive" className="text-[11px] font-semibold">
                                Delayed
                            </Badge>
                        );
                    }
                    if (health === 'at_risk') {
                        return (
                            <Badge variant="warning" className="text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40">
                                At Risk
                            </Badge>
                        );
                    }
                    return (
                        <Badge variant="success" className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40">
                            On Track
                        </Badge>
                    );
                },
            },
        ],
        [studio.id]
    );

    // TanStack Columns: Recent Activity
    const recentActivityColumns = useMemo(
        () => [
            {
                accessorKey: 'title',
                header: 'Task Activity',
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
                header: 'Assignee',
                cell: ({ row }) => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                        {row.original.assignee_name}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge variant="secondary" className="capitalize text-xs">
                        {row.original.status.replace('_', ' ')}
                    </Badge>
                ),
            },
            {
                accessorKey: 'updated_at_human',
                header: 'When',
                cell: ({ row }) => (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {row.original.updated_at_human}
                    </span>
                ),
            },
        ],
        []
    );

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`Studio Dashboard — ${studioName}`} />

            <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950 px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-8 w-full">
                {/* ── Top Header & Executive Quick Actions ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold font-heading tracking-tight text-slate-900 dark:text-slate-50">
                                {studioName}
                            </h1>
                            <Badge variant="secondary" className="text-xs font-semibold">
                                Leader View
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Studio health, sprint throughput, team capacity, and project delivery.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => setIsProjectModalOpen(true)}
                            className="gap-2 shadow-xs"
                        >
                            <Plus className="h-4 w-4 text-brand" />
                            <span>New Project</span>
                        </Button>
                        <Button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="gap-2 bg-brand hover:bg-brand-dark text-white shadow-xs"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Task</span>
                        </Button>
                    </div>
                </div>

                {/* ── Number Cards Grid (6 cards) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Overall Progress */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Overall Progress</span>
                                <TrendingUp className="h-4 w-4 text-brand" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {overallProgress.percent}%
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            <Progress value={overallProgress.percent} className="h-1.5 [&>div]:bg-brand" />
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                {overallProgress.completed_tasks} / {overallProgress.total_tasks} tasks done
                            </span>
                        </CardContent>
                    </Card>

                    {/* Current Sprint */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Current Sprint</span>
                                <Calendar className="h-4 w-4 text-indigo-500" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {currentSprint.has_sprint ? `${currentSprint.percent}%` : '—'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            {currentSprint.has_sprint ? (
                                <>
                                    <Progress value={currentSprint.percent} className="h-1.5 [&>div]:bg-indigo-500" />
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                        {currentSprint.days_left !== null ? `${currentSprint.days_left}d remaining` : currentSprint.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block">
                                    No active sprint
                                </span>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tasks at Risk */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Tasks at Risk</span>
                                <Flame className="h-4 w-4 text-amber-500" />
                            </CardDescription>
                            <CardTitle className={`text-2xl font-bold font-heading ${
                                metrics.tasks_at_risk_count > 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-900 dark:text-slate-50'
                            }`}>
                                {metrics.tasks_at_risk_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Critical path or delayed
                            </span>
                        </CardContent>
                    </Card>

                    {/* Unassigned Tasks */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Unassigned Tasks</span>
                                <UserX className="h-4 w-4 text-slate-400" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {metrics.unassigned_tasks_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Awaiting developer assignment
                            </span>
                        </CardContent>
                    </Card>

                    {/* Overloaded Members */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Overloaded</span>
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                            </CardDescription>
                            <CardTitle className={`text-2xl font-bold font-heading ${
                                metrics.overloaded_members_count > 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-900 dark:text-slate-50'
                            }`}>
                                {metrics.overloaded_members_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Above weekly limit
                            </span>
                        </CardContent>
                    </Card>

                    {/* Items Waiting on Me */}
                    <Card className="shadow-xs hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-medium flex items-center justify-between">
                                <span>Waiting on Me</span>
                                <Sparkles className="h-4 w-4 text-brand" />
                            </CardDescription>
                            <CardTitle className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-50">
                                {metrics.items_waiting_count}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                Estimates needing review
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Owner-Only Studio Leadership Panel ── */}
                {isOwner && (
                    <Card className="border-brand/20 bg-linear-to-r from-brand-5/40 via-white to-transparent dark:from-brand-900/10 dark:via-slate-900 dark:to-transparent shadow-xs">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-brand/10 dark:bg-brand/20 text-brand flex items-center justify-center">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-50">
                                        Studio Leadership
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Read-only executive roster for studio owners.
                                    </CardDescription>
                                </div>
                            </div>
                            <Link
                                href={route('tenant.team', { tenant: studio.id })}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark dark:hover:text-brand-light transition-colors"
                            >
                                <span>Manage Team</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {studioLeadership.map((leader) => (
                                    <div
                                        key={leader.id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={leader.avatar} />
                                            <AvatarFallback className="text-xs font-bold text-brand">
                                                {leader.name?.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                                {leader.name}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 uppercase">
                                                    {leader.role}
                                                </Badge>
                                                <span className="truncate">{leader.position}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Charts Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Burndown / Velocity Chart (2 cols) */}
                    <Card className="lg:col-span-2 shadow-xs">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-bold">
                                        Sprint Analytics
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Throughput, burndown trajectory, and historical velocity.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="burndown" className="space-y-4">
                                <TabsList className="bg-slate-100 dark:bg-slate-800/80">
                                    <TabsTrigger value="burndown" className="text-xs">
                                        Sprint Burndown
                                    </TabsTrigger>
                                    <TabsTrigger value="velocity" className="text-xs">
                                        Velocity per Sprint
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="burndown" className="h-[300px] w-full">
                                    {charts.burndown?.length ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={charts.burndown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#007CFF" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#007CFF" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 11 }} />
                                                <Tooltip />
                                                <Area type="monotone" dataKey="ideal" name="Ideal Burndown" stroke="#94a3b8" strokeDasharray="4 4" fill="url(#idealGrad)" />
                                                <Area type="monotone" dataKey="actual" name="Actual Points" stroke="#007CFF" strokeWidth={2} fill="url(#actualGrad)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                                            <Calendar className="h-8 w-8 stroke-1" />
                                            <span className="text-xs">No active sprint burndown data. Create or activate a sprint to track story points.</span>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="velocity" className="h-[300px] w-full">
                                    {charts.velocity?.length ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={charts.velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                                <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 11 }} />
                                                <Tooltip />
                                                <Bar dataKey="points" name="Story Points" fill="#007CFF" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                                            <Activity className="h-8 w-8 stroke-1" />
                                            <span className="text-xs">No historical sprint velocity yet. Completed sprints will appear here.</span>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Task Status Split Donut (1 col) */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold">
                                Task Status Split
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Distribution of tasks across studio workflows.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.status_split || []}
                                            innerRadius={55}
                                            outerRadius={85}
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
                </div>

                {/* ── Progress Per Project & Team Workload Progress Bars ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Progress per Project */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Project Progress</CardTitle>
                                <CardDescription className="text-xs">Delivery completion per project</CardDescription>
                            </div>
                            <Link href={route('tenant.projects.index', { tenant: studio.id })} className="text-xs font-semibold text-brand hover:underline">
                                View all
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-3.5">
                            {charts.project_progress?.length ? (
                                charts.project_progress.map((p) => (
                                    <div key={p.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                                            <span className="font-mono text-slate-500">{p.completed_tasks}/{p.total_tasks} tasks ({p.progress_percent}%)</span>
                                        </div>
                                        <Progress value={p.progress_percent} className="h-2 [&>div]:bg-brand" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-400 py-6 text-center">No projects in this studio yet.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Workload */}
                    <Card className="shadow-xs">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Team Workload</CardTitle>
                                <CardDescription className="text-xs">Assigned task hours vs weekly capacity limit</CardDescription>
                            </div>
                            <Link href={route('tenant.team', { tenant: studio.id })} className="text-xs font-semibold text-brand hover:underline">
                                View team
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-3.5">
                            {charts.team_workload?.length ? (
                                charts.team_workload.slice(0, 5).map((m) => (
                                    <div key={m.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={m.avatar} />
                                                    <AvatarFallback className="text-[9px]">{m.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>
                                            </div>
                                            <span className={`font-mono text-xs font-bold ${m.is_overloaded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {m.assigned_hours}h / {m.max_hours}h ({m.load_percent}%)
                                            </span>
                                        </div>
                                        <Progress
                                            value={Math.min(100, m.load_percent)}
                                            className={`h-2 ${m.is_overloaded ? '[&>div]:bg-rose-500' : m.load_percent > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-brand'}`}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-400 py-6 text-center">No team members assigned yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Executive Tables Tabs (TanStack Table v8) ── */}
                <div className="space-y-4">
                    <Tabs defaultValue="attention" className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div>
                                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
                                    Studio Records
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Detailed data tables for risk analysis, team capacity, and project tracking.
                                </p>
                            </div>
                            <TabsList className="bg-slate-100 dark:bg-slate-800">
                                <TabsTrigger value="attention" className="text-xs">
                                    Needs Attention ({tables.needs_attention?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="team" className="text-xs">
                                    Team Snapshot ({tables.team_snapshot?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="projects" className="text-xs">
                                    Projects ({tables.projects?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="text-xs">
                                    Recent Activity
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="attention" className="mt-4">
                            <DataTable
                                columns={needsAttentionColumns}
                                data={tables.needs_attention || []}
                                emptyMessage="All tasks are on track. No critical-path bottlenecks or delayed items."
                            />
                        </TabsContent>

                        <TabsContent value="team" className="mt-4">
                            <DataTable
                                columns={teamSnapshotColumns}
                                data={tables.team_snapshot || []}
                                emptyMessage="No team members in this studio."
                            />
                        </TabsContent>

                        <TabsContent value="projects" className="mt-4">
                            <DataTable
                                columns={projectsColumns}
                                data={tables.projects || []}
                                emptyMessage="No projects created yet."
                            />
                        </TabsContent>

                        <TabsContent value="activity" className="mt-4">
                            <DataTable
                                columns={recentActivityColumns}
                                data={tables.recent_activity || []}
                                emptyMessage="No recent activity recorded."
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* ── Modals for Quick Actions ── */}
            {isProjectModalOpen && (
                <CreateProjectModal
                    isOpen={isProjectModalOpen}
                    onClose={() => setIsProjectModalOpen(false)}
                    onCreated={handleProjectCreated}
                />
            )}

            {isTaskModalOpen && (
                <ManualTaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    project={quickActions.projects?.find((p) => String(p.id) === String(selectedProjectId)) || quickActions.projects?.[0]}
                    tenantId={studio.id}
                    teamMembers={quickActions.teamMembers || []}
                    skills={quickActions.skills || []}
                    positions={quickActions.positions || []}
                />
            )}
        </TenantLayout>
    );
}
