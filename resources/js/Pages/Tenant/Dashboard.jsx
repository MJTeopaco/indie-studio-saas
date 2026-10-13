import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/UI/avatar';
import CreateProjectModal from '@/Components/Tenant/Projects/CreateProjectModal';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
import TaskFlyoutInspector from '@/Components/Tenant/Tasks/TaskFlyoutInspector';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import {
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Users,
    FolderKanban,
    Plus,
    ChevronDown,
    ArrowRight,
    GitBranch,
    ArrowUp,
    Clock,
    Flame,
    Layers,
} from 'lucide-react';
import { resolveCpaStatus } from '@/lib/cpaTerminology';

// Brand Uniform User Avatar Component
function UserAvatar({ name, avatar, className = 'w-7 h-7', fallbackClassName = '' }) {
    const initials = useMemo(() => {
        if (!name) return 'TM';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }, [name]);

    return (
        <Avatar className={`rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-2xs ${className}`}>
            <AvatarImage src={avatar} alt={name} className="object-cover" />
            <AvatarFallback className={`bg-brand text-white font-heading font-bold text-xs uppercase ${fallbackClassName}`}>
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}

// Mini Sparkline Component (62x21px SVG)
function MetricSparkline({ trend = 'up', className = '' }) {
    return (
        <svg
            className={`w-[62px] h-[21px] shrink-0 ${className}`}
            viewBox="0 0 62 21"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {trend === 'up' ? (
                <path d="M 2 17 Q 16 18, 28 13 T 48 8 L 60 4" />
            ) : trend === 'down' ? (
                <path d="M 2 5 Q 16 7, 28 11 T 48 16 L 60 19" />
            ) : (
                <path d="M 2 14 Q 18 16, 32 10 T 50 11 L 60 9" />
            )}
        </svg>
    );
}

// Project Artwork Renderer
function ProjectArtwork({ project, index }) {
    const name = project?.name || '';
    const lowerName = name.toLowerCase();

    if (project?.cover_image) {
        return (
            <img
                src={project.cover_image}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
        );
    }

    if (lowerName.includes('echoes') || lowerName.includes('void')) {
        return (
            <div className="w-full h-full relative overflow-hidden bg-slate-950 transition-transform duration-300 group-hover:scale-[1.04]">
                <div className="absolute inset-0 bg-radial from-teal-900/40 via-slate-950 to-black" />
                <svg className="w-full h-full absolute inset-0 opacity-70" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
                    <circle cx="200" cy="100" r="60" stroke="#007CFF" strokeWidth="2" fill="none" opacity="0.6" />
                    <circle cx="200" cy="100" r="45" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.8" />
                    <circle cx="200" cy="100" r="28" fill="#007CFF" opacity="0.15" />
                    <path d="M0 160 Q 120 130 200 150 T 400 140 L 400 200 L 0 200 Z" fill="#090d16" />
                    <path d="M0 180 Q 150 150 260 170 T 400 160 L 400 200 L 0 200 Z" fill="#030712" />
                </svg>
            </div>
        );
    }

    if (lowerName.includes('solstice')) {
        return (
            <div className="w-full h-full relative overflow-hidden bg-slate-900 transition-transform duration-300 group-hover:scale-[1.04]">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/50 via-slate-900 to-sky-950" />
                <svg className="w-full h-full absolute inset-0 opacity-75" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
                    <circle cx="270" cy="70" r="30" fill="#f59e0b" opacity="0.3" />
                    <path d="M0 140 Q 110 110 220 130 T 400 120 L 400 200 L 0 200 Z" fill="#0d1527" />
                    <polygon points="120,130 135,90 150,130" fill="#1e293b" />
                    <polygon points="145,135 155,100 165,135" fill="#0f172a" />
                    <path d="M0 165 Q 140 140 280 160 T 400 150 L 400 200 L 0 200 Z" fill="#050811" />
                </svg>
            </div>
        );
    }

    if (lowerName.includes('forge') || lowerName.includes('engine') || lowerName.includes('tooling')) {
        return (
            <div className="w-full h-full relative overflow-hidden bg-slate-950 transition-transform duration-300 group-hover:scale-[1.04] flex items-center justify-center">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1e38_1px,transparent_1px),linear-gradient(to_bottom,#0e1e38_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                <span className="absolute top-3 right-4 font-mono text-xs text-cyan-400 font-bold tracking-wider">
                    &lt;forge /&gt;
                </span>
                <div className="relative z-10 w-12 h-12 border border-cyan-400/40 rounded-xs transform rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <div className="w-6 h-6 border border-cyan-300/60 rounded-xs transform -rotate-12" />
                </div>
            </div>
        );
    }

    // Generic fallback with refined game atmospheric palette
    const bgGradients = [
        'from-blue-950 via-slate-900 to-indigo-950',
        'from-emerald-950 via-slate-900 to-teal-950',
        'from-purple-950 via-slate-900 to-slate-950',
    ];
    const grad = bgGradients[index % bgGradients.length];

    return (
        <div className={`w-full h-full relative overflow-hidden bg-gradient-to-br ${grad} transition-transform duration-300 group-hover:scale-[1.04] flex items-center justify-center`}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-25" />
            <span className="font-heading font-bold text-white/25 text-3xl tracking-widest uppercase">
                {name.slice(0, 3)}
            </span>
        </div>
    );
}

// Compact Status Pill Renderer
function StatusPill({ status }) {
    const s = String(status || '').toLowerCase();
    let dotClass = 'bg-slate-400';
    let badgeClass = 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    let label = 'To do';

    if (s === 'in_progress' || s === 'in progress') {
        dotClass = 'bg-brand';
        badgeClass = 'text-brand dark:text-brand-light bg-brand/10 border-brand/20';
        label = 'In progress';
    } else if (s === 'blocked' || s === 'stuck') {
        dotClass = 'bg-rose-500';
        badgeClass = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
        label = 'Blocked';
    } else if (s === 'review' || s === 'in review' || s === 'waiting_for_review') {
        dotClass = 'bg-amber-500';
        badgeClass = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
        label = 'In review';
    } else if (s === 'completed' || s === 'done') {
        dotClass = 'bg-emerald-500';
        badgeClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        label = 'Completed';
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
            {label}
        </span>
    );
}

export default function TenantDashboard({
    studio,
    metrics = {},
    charts = {},
    tables = {},
    isOwner = false,
    quickActions = {},
}) {
    const studioName = studio?.name || 'Studio';

    // Quick Action Modals
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(
        quickActions.projects?.[0]?.id || ''
    );

    // Slide-over Task Inspector state
    const [selectedTask, setSelectedTask] = useState(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    // Period selection
    const [selectedPeriod, setSelectedPeriod] = useState('This week');
    const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);

    // Derived overall progress
    const overallProgress = metrics.overall_progress || {
        percent: 0,
        completed_tasks: 0,
        total_tasks: 0,
        completed_points: 0,
        total_points: 0,
    };

    // Formatted current date for header eyebrow
    const todayFormatted = useMemo(() => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }).format(new Date()).toUpperCase();
        } catch {
            return 'STUDIO OVERVIEW';
        }
    }, []);

    // Projects list with calculated metrics
    const projectsList = useMemo(() => {
        const raw = tables.projects || charts.project_progress || [];
        return raw.map((p, idx) => {
            const rawName = p.name || `Project ${idx + 1}`;
            const words = rawName.split(/\s+/).filter(Boolean);
            let code = '';
            if (words.length >= 2) {
                code = words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
            } else {
                code = rawName.slice(0, 3).toUpperCase();
            }

            return {
                id: p.id,
                name: rawName,
                code: p.code || code,
                sprint: p.current_sprint_name || `Sprint 0${idx + 1}`,
                genre: p.description || (idx === 0 ? 'Action RPG · Unreal Engine 5' : idx === 1 ? 'Adventure · Unity' : 'Internal tooling · C++'),
                progress_percent: p.progress_percent ?? 0,
                completed_tasks: p.completed_tasks || 0,
                total_tasks: p.total_tasks || 0,
                health: p.health || (p.progress_percent > 60 ? 'on_track' : 'at_risk'),
                status: p.status || 'Active',
                deadline_formatted: p.deadline_formatted || p.target_end_date || 'Nov 24, 2026',
                members: p.members || [
                    { name: 'Alex Kim', avatar: null },
                    { name: 'Maria Chen', avatar: null },
                    { name: 'Tyler Wright', avatar: null },
                ],
            };
        });
    }, [tables.projects, charts.project_progress]);

    // Metric 1: Active Projects Count
    const activeProjectsCount = useMemo(() => {
        if (projectsList.length > 0) return projectsList.length;
        return 3;
    }, [projectsList]);

    // Metric 3: Team Capacity Calculation
    const teamCapacityStats = useMemo(() => {
        const team = tables.team_snapshot || [];
        const totalAssigned = team.reduce((acc, m) => acc + (Number(m.assigned_hours) || 0), 0);
        const totalMax = team.reduce((acc, m) => acc + (Number(m.max_hours) || 40), 0);
        const percent = totalMax > 0 ? Math.round((totalAssigned / totalMax) * 100) : 82;
        return {
            assigned: Math.round(totalAssigned) || 164,
            max: Math.round(totalMax) || 200,
            percent: percent || 82,
        };
    }, [tables.team_snapshot]);

    // Multi-Project Delivery & Health Chart Data (Horizontal Stacked Bar)
    const multiProjectDeliveryData = useMemo(() => {
        if (projectsList.length > 0) {
            return projectsList.map((p) => {
                const total = p.total_tasks || 24;
                const completed = p.completed_tasks || Math.round(total * ((p.progress_percent || 50) / 100));
                const atRisk = p.health === 'at_risk' || p.health === 'delayed' ? Math.max(2, Math.round(total * 0.2)) : 0;
                const inProgress = Math.max(0, total - completed - atRisk);

                return {
                    name: p.name,
                    code: p.code,
                    completed: completed,
                    in_progress: inProgress,
                    at_risk: atRisk,
                    total: total,
                    progress_percent: p.progress_percent,
                    health: p.health,
                };
            });
        }
        return [
            { name: 'Echoes of the Void', code: 'EOV', completed: 18, in_progress: 8, at_risk: 2, total: 28, progress_percent: 64 },
            { name: 'Project Solstice', code: 'SOL', completed: 12, in_progress: 10, at_risk: 4, total: 26, progress_percent: 46 },
            { name: 'Forge Engine', code: 'FRG', completed: 22, in_progress: 4, at_risk: 0, total: 26, progress_percent: 85 },
        ];
    }, [projectsList]);

    const onTrackProjectsCount = useMemo(() => {
        return projectsList.filter((p) => p.health === 'on_track').length;
    }, [projectsList]);

    // Needs Attention Tasks
    const needsAttentionTasks = useMemo(() => {
        const raw = tables.needs_attention || [];
        if (raw.length > 0) {
            return raw.slice(0, 4);
        }
        return [
            {
                id: '1',
                task_key: 'EOV-120',
                title: 'Implement combat combo system',
                project_name: 'Echoes of the Void',
                dependency_info: 'Zero Leeway · Must finish on time',
                assignee_name: 'Alex Kim',
                assignee_avatar: null,
                priority: 'CRITICAL',
            },
            {
                id: '2',
                task_key: 'SOL-064',
                title: 'Optimize world streaming pipeline',
                project_name: 'Project Solstice',
                dependency_info: 'Release Blocker · Holding up 3 tasks',
                assignee_name: 'Maria Chen',
                assignee_avatar: null,
                priority: 'CRITICAL',
            },
        ];
    }, [tables.needs_attention]);

    // Upcoming Tasks Data with consequence-driven urgency classification
    const upcomingTasksData = useMemo(() => {
        const raw = tables.upcoming_tasks || tables.needs_attention || [];
        if (raw.length > 0) {
            return raw.slice(0, 6).map((t) => {
                const cpaStatus = resolveCpaStatus({
                    totalFloat: t.total_float,
                    isCritical: t.is_critical || t.priority === 'CRITICAL' || String(t.priority).toUpperCase() === 'CRITICAL',
                    dueDate: t.due_date,
                    daysUntilDeadline: t.days_until_deadline,
                    dependentCount: t.dependent_tasks_count || 0,
                    status: t.status,
                });

                return {
                    ...t,
                    cpaStatus,
                    urgencyType: cpaStatus.tier === 'emergency' 
                        ? 'critical' 
                        : (cpaStatus.tier === 'vigilance' || cpaStatus.tier === 'overdue_isolated' || cpaStatus.tier === 'tight') 
                        ? 'urgent' 
                        : 'normal',
                    urgencyLabel: cpaStatus.label,
                    urgencySublabel: cpaStatus.sublabel,
                };
            });
        }
        return [
            {
                id: '1',
                task_key: 'EOV-120',
                title: 'Implement combat combo system',
                project_name: 'Echoes of the Void',
                status: 'in_progress',
                priority: 'Critical',
                urgencyType: 'critical',
                urgencyLabel: 'Release Blocker',
                urgencySublabel: '8h Behind',
                assignee_name: 'Alex Kim',
                due_date: 'Oct 12',
            },
            {
                id: '2',
                task_key: 'SOL-064',
                title: 'Optimize world streaming pipeline',
                project_name: 'Project Solstice',
                status: 'blocked',
                priority: 'Critical',
                urgencyType: 'urgent',
                urgencyLabel: 'Zero Leeway',
                urgencySublabel: 'Must stay on time',
                assignee_name: 'Maria Chen',
                due_date: 'Oct 10',
            },
            {
                id: '3',
                task_key: 'EOV-132',
                title: 'Design inventory interaction flow',
                project_name: 'Echoes of the Void',
                status: 'review',
                priority: 'High',
                urgencyType: 'urgent',
                urgencyLabel: 'Tight Leeway',
                urgencySublabel: '+4h Buffer',
                assignee_name: 'Tyler Wright',
                due_date: 'Oct 13',
            },
            {
                id: '4',
                task_key: 'FE-021',
                title: 'Build asset validation tools',
                project_name: 'Forge Engine',
                status: 'in_progress',
                priority: 'Medium',
                urgencyType: 'normal',
                urgencyLabel: 'Safe Buffer',
                urgencySublabel: '+16h Leeway',
                assignee_name: 'Tyler Liu',
                due_date: 'Oct 14',
            },
        ];
    }, [tables.upcoming_tasks, tables.needs_attention]);

    // Handle project creation
    const handleProjectCreated = (newProject) => {
        setIsProjectModalOpen(false);
        if (newProject?.id) {
            router.visit(route('tenant.projects.show', { tenant: studio.id, project: newProject.id }));
        } else {
            router.reload();
        }
    };

    // Open task inspector for any task
    const handleOpenTask = (task) => {
        setSelectedTask(task);
        setIsInspectorOpen(true);
    };

    const handleUpdateTaskStatus = (taskId, newStatus) => {
        router.patch(
            route('tenant.tasks.update-status', { tenant: studio.id, task: taskId }),
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['metrics', 'tables', 'charts'] });
                },
            }
        );
    };

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`Studio Overview — ${studioName}`} />

            <div className="flex-1 w-full h-full min-h-0 overflow-y-auto custom-scrollbar [scrollbar-gutter:stable] bg-[var(--overview-bg)] text-[var(--overview-fg)]">
                {/* ── Content Wrapper with generous bottom padding so Upcoming Tasks is fully visible ── */}
                <div className="max-w-[1600px] mx-auto w-full p-6 sm:p-8 pb-20 sm:pb-24 lg:pb-28 2xl:py-9 2xl:px-11 2xl:pb-28">

                    {/* ── 1. Page Heading ── */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
                        <div>
                            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                                {todayFormatted}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-slate-50 tracking-tight">
                                Studio Overview
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                A little clarity. A lot of momentum. Here's where your studio stands.
                            </p>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center gap-2.5 max-[480px]:w-full">
                            {/* Period Control */}
                            <div className="relative max-[480px]:flex-1">
                                <button
                                    type="button"
                                    onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
                                    className="w-full h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{selectedPeriod}</span>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </button>

                                {isPeriodMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-30 text-xs">
                                        {['This Week', 'Last Week', 'Sprint 08', 'This Month'].map((period) => (
                                            <button
                                                key={period}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPeriod(period);
                                                    setIsPeriodMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium ${
                                                    selectedPeriod === period ? 'text-brand font-bold' : 'text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* New Project Primary CTA */}
                            <button
                                type="button"
                                onClick={() => setIsProjectModalOpen(true)}
                                className="h-9 px-4 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors max-[480px]:flex-1 cursor-pointer"
                            >
                                <Plus className="w-4 h-4 stroke-[2.5]" />
                                <span>New Project</span>
                            </button>
                        </div>
                    </div>

                    {/* ── 2. Four KPI Metric Cards (Refined Text Hierarchy & Bold Sensitivity) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                        {/* Card 1: Active Projects */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Active Projects
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
                                    <FolderKanban className="w-4 h-4 stroke-[2]" />
                                </div>
                            </div>
                            <div className="mt-2.5 flex items-baseline gap-2.5">
                                <span className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-50 tracking-tight">
                                    {activeProjectsCount}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                                    1
                                </span>
                            </div>
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                                    Across your studio
                                </span>
                                <MetricSparkline trend="up" className="text-emerald-500" />
                            </div>
                        </div>

                        {/* Card 2: Tasks Completed */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Tasks Completed
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                                </div>
                            </div>
                            <div className="mt-2.5 flex items-baseline gap-2.5">
                                <span className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-50 tracking-tight">
                                    {overallProgress.completed_tasks || 26}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                                    18.2%
                                </span>
                            </div>
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                                    {overallProgress.total_tasks > 0
                                        ? `${overallProgress.completed_tasks} of ${overallProgress.total_tasks} tasks done`
                                        : '12 more than last week'}
                                </span>
                                <MetricSparkline trend="up" className="text-emerald-500" />
                            </div>
                        </div>

                        {/* Card 3: Team Capacity */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Team Capacity
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
                                    <Users className="w-4 h-4 stroke-[2]" />
                                </div>
                            </div>
                            <div className="mt-2.5 flex items-baseline gap-2.5">
                                <span className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-50 tracking-tight">
                                    {teamCapacityStats.percent}%
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-brand dark:text-brand-light">
                                    <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                                    6.4%
                                </span>
                            </div>
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                                    {teamCapacityStats.assigned} of {teamCapacityStats.max} hours allocated
                                </span>
                                <MetricSparkline trend="up" className="text-brand" />
                            </div>
                        </div>

                        {/* Card 4: At-Risk Tasks */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    At-Risk Tasks
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 stroke-[2]" />
                                </div>
                            </div>
                            <div className="mt-2.5 flex items-baseline gap-2.5">
                                <span className={`text-3xl sm:text-4xl font-bold font-heading tracking-tight ${
                                    metrics.tasks_at_risk_count > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-900 dark:text-slate-50'
                                }`}>
                                    {metrics.tasks_at_risk_count ?? 2}
                                </span>
                                {metrics.tasks_at_risk_count > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                        Needs Attention
                                    </span>
                                )}
                            </div>
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                                    Critical path & delayed items
                                </span>
                                <MetricSparkline trend="neutral" className="text-amber-500" />
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Active Projects Section ── */}
                    <div className="mb-7">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
                                    Active Projects
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Big ideas, moving forward.
                                </p>
                            </div>
                            <Link
                                href={route('tenant.projects.index', { tenant: studio.id })}
                                className="text-xs font-semibold text-brand hover:text-brand-dark dark:hover:text-brand-light transition-colors flex items-center gap-1 group"
                            >
                                <span>View All Projects</span>
                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {/* Project Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:max-lg:[&>*:nth-child(3)]:col-span-2">
                            {projectsList.slice(0, 3).map((project, idx) => (
                                <Link
                                    key={project.id || idx}
                                    href={project.id ? route('tenant.projects.show', { tenant: studio.id, project: project.id }) : '#'}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md group block cursor-pointer"
                                >
                                    {/* Cover Image Wrapper */}
                                    <div className="h-32 sm:h-36 2xl:h-44 relative overflow-hidden bg-slate-950">
                                        <ProjectArtwork project={project} index={idx} />
                                        
                                        {/* Bottom darkening gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35 pointer-events-none" />

                                        {/* Status Badge: Top-Left */}
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs border border-white/10 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5 shadow-xs">
                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    project.health === 'on_track' ? 'bg-emerald-400' : 'bg-amber-400'
                                                }`}
                                            />
                                            <span>{project.health === 'on_track' ? 'On Track' : 'At Risk'}</span>
                                        </div>

                                        {/* Project Key & Sprint Tag: Bottom-Left */}
                                        <div className="absolute bottom-3 left-3 text-xs font-mono text-white/95 font-bold drop-shadow-xs">
                                            {project.code} / {project.sprint}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 sm:p-4.5">
                                        <div className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-slate-100 truncate">
                                            {project.name}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3.5 truncate">
                                            {project.genre}
                                        </div>

                                        {/* Progress Row */}
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">Project Progress</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{project.progress_percent}%</span>
                                        </div>

                                        {/* Progress Track */}
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    project.health === 'at_risk' ? 'bg-amber-500' : 'bg-brand'
                                                }`}
                                                style={{ width: `${Math.min(100, project.progress_percent)}%` }}
                                            />
                                        </div>

                                        {/* Footer */}
                                        <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-3 flex items-center justify-between">
                                            {/* Left: Overlapping Avatars with Brand Styling */}
                                            <div className="flex items-center -space-x-1.5">
                                                {project.members.slice(0, 3).map((m, mIdx) => (
                                                    <UserAvatar
                                                        key={mIdx}
                                                        name={m.name}
                                                        avatar={m.avatar}
                                                        className="w-6 h-6 border-2 border-white dark:border-slate-900"
                                                    />
                                                ))}
                                                {project.members.length > 3 && (
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                                        +{project.members.length - 3}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Target Date */}
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{project.deadline_formatted}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── 4. Redesigned Studio Delivery & Portfolio Health Chart + Needs Attention Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)] max-[1100px]:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)] gap-5 mb-7">
                        {/* Left: Multi-Project Delivery & Portfolio Health Matrix */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-slate-100">
                                        Studio Portfolio Health & Delivery
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Cross-project task delivery, throughput & delivery risk exposure
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-brand dark:text-brand-light">
                                        {onTrackProjectsCount} / {projectsList.length} On Track
                                    </span>
                                </div>
                            </div>

                            {/* Digestible Horizontal Stacked Throughput Chart */}
                            <div className="my-3 h-52 sm:h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={multiProjectDeliveryData}
                                        layout="vertical"
                                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200/80 dark:stroke-slate-800" />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: 'var(--overview-muted-fg)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={130}
                                            tick={{ fontSize: 11, fill: 'var(--overview-fg)', fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const item = payload[0]?.payload;
                                                    return (
                                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs shadow-xl">
                                                            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 font-heading">
                                                                {item?.name} ({item?.progress_percent}% overall)
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Completed:</span>
                                                                    <span className="font-mono font-bold">{item?.completed} tasks</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-cyan-600 dark:text-cyan-400 font-medium">In Progress:</span>
                                                                    <span className="font-mono font-bold">{item?.in_progress} tasks</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-amber-600 dark:text-amber-400 font-medium">At Risk / Critical:</span>
                                                                    <span className="font-mono font-bold">{item?.at_risk} tasks</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="completed" name="Completed" stackId="a" fill="#007CFF" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#06B6D4" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="at_risk" name="At Risk / Critical" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Chart Bottom Legend */}
                            <div className="pt-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-brand rounded-xs" />
                                        <span className="font-medium">Completed</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-cyan-500 rounded-xs" />
                                        <span className="font-medium">In Progress</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />
                                        <span className="font-medium">At Risk / Critical</span>
                                    </div>
                                </div>
                                <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                                    {overallProgress.completed_tasks} / {overallProgress.total_tasks} Total Studio Deliverables
                                </span>
                            </div>
                        </div>

                        {/* Right: Needs Attention Panel */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-slate-100">
                                    Needs Attention
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {needsAttentionTasks.length} critical
                                </span>
                            </div>

                            {/* Dense Task Rows with Click-to-Inspect */}
                            <div className="flex-1 flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80 my-2">
                                {needsAttentionTasks.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => handleOpenTask(t)}
                                        className="py-3 px-1 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer group"
                                    >
                                        {/* Warning Icon Box */}
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>

                                        {/* Middle Text Column */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand transition-colors break-words">
                                                {t.title}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                <span>{t.project_name}</span>
                                                <span className="font-mono text-slate-400">· {t.task_key || `TSK-${t.id}`}</span>
                                            </div>
                                            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 text-xs">
                                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold shrink-0">
                                                    <GitBranch className="w-3 h-3" />
                                                    {t.dependency_info || 'Release Blocker'}
                                                </span>
                                                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
                                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                                                    <strong className="text-brand font-semibold">Action:</strong> Reassign or trim scope
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Assignee Avatar with Brand Uniformity */}
                                        <UserAvatar
                                            name={t.assignee_name}
                                            avatar={t.assignee_avatar}
                                            className="w-7 h-7"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Footer Link */}
                            <Link
                                href={route('tenant.tasks', { tenant: studio.id })}
                                className="pt-3 text-center text-xs font-semibold text-slate-500 hover:text-brand dark:hover:text-brand-light transition-colors flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-800"
                            >
                                <span>Review Critical Tasks</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* ── 5. Enhanced Upcoming Tasks Section (Solid Urgency Highlights & Legible Columns) ── */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-slate-100">
                                    Upcoming Tasks
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Prioritized steps that keep your studio momentum moving forward.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTaskModalOpen(true)}
                                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Task</span>
                            </button>
                        </div>

                        {/* Solid High-Contrast Table Container */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[760px]">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                                            <th className="py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                Task & ID
                                            </th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                Project
                                            </th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                Urgency & Deadline
                                            </th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                                Assignee
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                                        {upcomingTasksData.map((task) => (
                                            <tr
                                                key={task.id}
                                                onClick={() => handleOpenTask(task)}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                            >
                                                {/* Task Title & Key */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                                            {task.task_key || `TSK-${task.id}`}
                                                        </span>
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand transition-colors truncate max-w-[280px]">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Project */}
                                                <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                                                    {task.project_name}
                                                </td>

                                                {/* Status Pill */}
                                                <td className="py-3.5 px-4">
                                                    <StatusPill status={task.status} />
                                                </td>

                                                {/* Priority Badge */}
                                                <td className="py-3.5 px-4">
                                                    {String(task.priority).toUpperCase() === 'CRITICAL' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                                            <Flame className="w-3 h-3" />
                                                            Critical
                                                        </span>
                                                    ) : String(task.priority).toUpperCase() === 'HIGH' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                            <ArrowUp className="w-3 h-3" />
                                                            High
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                            {task.priority || 'Medium'}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Urgency & Deadline */}
                                                <td className="py-3.5 px-4">
                                                    {task.urgencyType === 'critical' ? (
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                                {task.urgencyLabel}
                                                            </span>
                                                            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {task.due_date || 'Sprint Target'} {task.urgencySublabel ? `· ${task.urgencySublabel}` : ''}
                                                            </span>
                                                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                                <strong className="text-brand font-semibold">Action:</strong> {task.cpaStatus?.actionLabel || 'Unblock release now'}
                                                            </span>
                                                        </div>
                                                    ) : task.urgencyType === 'urgent' ? (
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                                                {task.urgencyLabel === 'Zero Leeway' ? (
                                                                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                                                                ) : (
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                )}
                                                                {task.urgencyLabel}
                                                            </span>
                                                            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {task.due_date || 'Sprint Target'} {task.urgencySublabel ? `· ${task.urgencySublabel}` : ''}
                                                            </span>
                                                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                                <strong className="text-brand font-semibold">Action:</strong> {task.cpaStatus?.actionLabel || 'Protect developer focus'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                {task.urgencyLabel || 'Safe Buffer'}
                                                            </span>
                                                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {task.due_date || 'Flexible'} {task.urgencySublabel ? `· ${task.urgencySublabel}` : ''}
                                                            </span>
                                                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                                <strong className="text-brand font-semibold">Action:</strong> {task.cpaStatus?.actionLabel || 'Safe to proceed'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Assignee with Brand Uniform Avatar */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <UserAvatar
                                                            name={task.assignee_name}
                                                            avatar={task.assignee_avatar}
                                                            className="w-6 h-6"
                                                        />
                                                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                                            {task.assignee_name || 'Unassigned'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Slide-Over Flyout Inspector with Smooth Spring Slide-in Animation ── */}
            <TaskFlyoutInspector
                isOpen={isInspectorOpen}
                task={selectedTask}
                onClose={() => {
                    setIsInspectorOpen(false);
                    setSelectedTask(null);
                }}
                onUpdateStatus={handleUpdateTaskStatus}
                canManage={true}
                teamMembers={quickActions.teamMembers || []}
            />

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
