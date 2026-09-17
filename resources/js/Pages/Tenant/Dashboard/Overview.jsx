import React, { useState, useMemo } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { showToast } from '@/Components/SystemToast';
import { getEasyTaskAiReasoning, CpaTaskAiModal } from '@/Components/Tenant/CpaAiSynthesizer';
import {
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Filter,
    Layers,
    Flame,
    User,
    ArrowRight,
    Search,
    SlidersHorizontal,
    Info,
    ExternalLink,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Zap,
    X as LucideX,
} from 'lucide-react';

// ── High-Fidelity SVG Icons ──────────────────────────────────────────────────
const TasksIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-600 dark:text-indigo-400">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const FoldersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-500 dark:text-amber-400">
        <path d="M22 19V9C22 7.9 21.1 7 20 7H12L10.4 5.4C9.7 4.7 8.6 4.2 7.6 4.2H4C2.9 4.2 2 5.1 2 6.2V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const SpeedometerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-500 dark:text-emerald-400">
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
);

const FolderIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M22 19V9C22 7.9 21.1 7 20 7H12L10.4 5.4C9.7 4.7 8.6 4.2 7.6 4.2H4C2.9 4.2 2 5.1 2 6.2V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ChevronIcon = ({ isOpen }) => (
    <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        style={{ display:'inline-block', transition:'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
        <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const FilterIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const XIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);

const EmptyBoxIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        'active':    'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700/40',
        'review':    'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/40',
        'planning':  'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-700/40',
        'completed': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40',
        'paused':    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    };
    const label = { active: 'In Progress', review: 'Under Review', planning: 'Planning', completed: 'Completed', paused: 'Paused' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || map['paused']}`}>
            {label[status] || status}
        </span>
    );
}

// ── Thin linear progress bar ─────────────────────────────────────────────────
function LinearProgress({ pct, color = 'bg-indigo-500', w = 'w-16' }) {
    return (
        <div className={`${w} h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden`}>
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.7s ease' }} />
        </div>
    );
}

// ── Circular Progress Ring ────────────────────────────────────────────────────
function CircleProgress({ percent = 0, size = 36, stroke = 3, color = '#6366f1' }) {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(99,102,241,0.13)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
    );
}

// ── Avatar Stack ─────────────────────────────────────────────────────────────
function AvatarStack({ names = [], max = 3 }) {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-sky-500'];
    const sliced = names.slice(0, max);
    return (
        <div className="flex -space-x-2">
            {sliced.map((name, i) => (
                <div key={i} title={name}
                    className={`w-6 h-6 rounded-full ${colors[i % colors.length]} border-2 border-white dark:border-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0`}>
                    {name.charAt(0)}
                </div>
            ))}
            {names.length > max && (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 text-gray-600 dark:text-slate-300 text-[8px] font-bold flex items-center justify-center shrink-0">
                    +{names.length - max}
                </div>
            )}
        </div>
    );
}

const STATUS_FILTERS = [
    { key: 'all',       label: 'All',         color: 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900' },
    { key: 'active',    label: 'In Progress',  color: 'bg-indigo-500 text-white' },
    { key: 'planning',  label: 'Planning',     color: 'bg-sky-500 text-white' },
    { key: 'review',    label: 'Under Review', color: 'bg-amber-500 text-white' },
    { key: 'completed', label: 'Completed',    color: 'bg-emerald-500 text-white' },
    { key: 'paused',    label: 'Paused',       color: 'bg-gray-400 text-white' },
];

// ── AI CPA Synthesis & Non-Technical Reasoning Engine ───────────────────────
function getTaskAiReasoning(task) {
    const easy = getEasyTaskAiReasoning(task);
    if (!easy) return null;
    return {
        ...easy,
        strategy: easy.action,
        proof: `Estimated: ${task.estimated_hours || 0}h • Cushion: ${easy.bufferText}`,
    };
}

export default function Overview({ projects: propProjects = [], stats: propStats = null }) {
    const pageProps = usePage().props;
    const projects = propProjects.length > 0 ? propProjects : (pageProps.projects ?? []);

    // derive metrics from real projects
    const totalTasks   = projects.reduce((a, p) => a + (p.tasks_count ?? 0), 0);
    
    // Count unique assignees dynamically across all projects for real-time overview members count
    const totalMembers = useMemo(() => {
        const names = new Set();
        projects.forEach(p => {
            (p.tasks || []).forEach(t => {
                if (t.assignee && t.assignee.name) {
                    names.add(t.assignee.name);
                }
            });
        });
        return names.size;
    }, [projects]);

    const activeCount  = projects.filter(p => p.status === 'active').length;

    // Real-time task status counts
    const activeTasksCount  = projects.reduce((a, p) => a + (p.tasks_active ?? 0), 0);
    const doneTasksCount    = projects.reduce((a, p) => a + (p.tasks_done ?? 0), 0);
    const reviewTasksCount  = projects.reduce((a, p) => a + (p.tasks_under_review ?? 0), 0);

    const taskCompletionPct = totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0;


    // Filter states
    const [filterOpen,     setFilterOpen]     = useState(false);
    const [activeStatus,   setActiveStatus]   = useState('all');
    const [searchQuery,    setSearchQuery]     = useState('');
    const [expanded,       setExpanded]       = useState({});

    const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const applyFilter = (key) => {
        setActiveStatus(key);
        setFilterOpen(false);
    };

    const clearFilter = () => {
        setActiveStatus('all');
        setSearchQuery('');
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesStatus = activeStatus === 'all' || p.status === activeStatus;
            const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [projects, activeStatus, searchQuery]);

    const hasActiveFilter = activeStatus !== 'all' || searchQuery.length > 0;

    // CPA Filter States
    const [cpaSelectedProjectId, setCpaSelectedProjectId] = useState('all');
    const [cpaCriticalOnly, setCpaCriticalOnly] = useState(false);
    const [cpaSearchQuery, setCpaSearchQuery] = useState('');
    const [cpaViewMode, setCpaViewMode] = useState('gantt'); // 'gantt' | 'table'

    // CPA AI Synthesis Modal & Inline Expansion States
    const [selectedTaskForAiModal, setSelectedTaskForAiModal] = useState(null);
    const [expandedAiReasoningTaskId, setExpandedAiReasoningTaskId] = useState(null);

    // Extract all scheduled CPA tasks from all projects with full CPM metrics
    const scheduledTasks = useMemo(() => {
        const list = [];
        projects.forEach(p => {
            if (p.tasks) {
                p.tasks.forEach(t => {
                    if (t.es !== null && t.ef !== null && t.es !== undefined && t.ef !== undefined) {
                        const es = Number(t.es);
                        const ef = Number(t.ef);
                        const ls = (t.ls !== null && t.ls !== undefined) ? Number(t.ls) : null;
                        const lf = (t.lf !== null && t.lf !== undefined) ? Number(t.lf) : null;
                        const totalFloat = (t.total_float !== null && t.total_float !== undefined)
                            ? Number(t.total_float)
                            : (ls !== null ? Math.max(0, ls - es) : 0);
                        const isCritical = Boolean(t.is_critical || totalFloat === 0);
                        const duration = Math.max(1, ef - es);

                        list.push({
                            ...t,
                            es,
                            ef,
                            ls,
                            lf,
                            total_float: totalFloat,
                            is_critical: isCritical,
                            duration,
                            projectId: p.id,
                            projectName: p.name,
                        });
                    }
                });
            }
        });
        return list;
    }, [projects]);

    // Filtered CPA tasks based on project selector, critical path toggle, and search
    const filteredCpaTasks = useMemo(() => {
        return scheduledTasks.filter(t => {
            if (cpaSelectedProjectId !== 'all' && String(t.projectId) !== String(cpaSelectedProjectId)) {
                return false;
            }
            if (cpaCriticalOnly && !t.is_critical) {
                return false;
            }
            if (cpaSearchQuery.trim()) {
                const q = cpaSearchQuery.toLowerCase();
                const matchesTitle = t.title.toLowerCase().includes(q);
                const matchesAssignee = t.assignee?.name?.toLowerCase().includes(q);
                const matchesProject = t.projectName.toLowerCase().includes(q);
                if (!matchesTitle && !matchesAssignee && !matchesProject) return false;
            }
            return true;
        }).sort((a, b) => {
            // Sort: critical first, then by early start ascending
            if (a.is_critical && !b.is_critical) return -1;
            if (!a.is_critical && b.is_critical) return 1;
            return a.es - b.es;
        });
    }, [scheduledTasks, cpaSelectedProjectId, cpaCriticalOnly, cpaSearchQuery]);

    // Calculate maximum timeline duration taking into account early finish AND late finish buffers
    const maxTimelineHours = useMemo(() => {
        if (filteredCpaTasks.length === 0) return 40;
        const maxBoundary = Math.max(
            ...filteredCpaTasks.map(t => Math.max(t.ef, Number(t.lf ?? (t.ef + (t.total_float || 0)))))
        );
        // Round up to nearest multiple of 16 (2 work days) or 24
        return Math.max(40, Math.ceil(maxBoundary / 16) * 16);
    }, [filteredCpaTasks]);

    // Generate responsive tick intervals
    const timelineTicks = useMemo(() => {
        const step = maxTimelineHours > 160 ? 32 : (maxTimelineHours > 80 ? 16 : 8);
        const ticks = [];
        for (let h = 0; h <= maxTimelineHours; h += step) {
            ticks.push({
                hour: h,
                day: Math.floor(h / 8) + 1,
            });
        }
        return ticks;
    }, [maxTimelineHours]);

    const criticalTasksCount = useMemo(() => {
        return scheduledTasks.filter(t => t.is_critical).length;
    }, [scheduledTasks]);

    const flexibleTasksCount = useMemo(() => {
        return scheduledTasks.filter(t => !t.is_critical).length;
    }, [scheduledTasks]);

    // High-level AI Synthesis & Schedule Intelligence for the active CPA scope
    const cpaAiSynthesis = useMemo(() => {
        if (filteredCpaTasks.length === 0) return null;

        const criticalTasks = filteredCpaTasks.filter(t => t.is_critical);
        const flexibleTasks = filteredCpaTasks.filter(t => !t.is_critical);
        const totalCritHours = criticalTasks.reduce((acc, t) => acc + t.duration, 0);
        const totalFlexHours = flexibleTasks.reduce((acc, t) => acc + t.duration, 0);
        const avgSlack = flexibleTasks.length > 0
            ? Math.round((flexibleTasks.reduce((acc, t) => acc + (t.total_float || 0), 0) / flexibleTasks.length) * 10) / 10
            : 0;

        // Developer bottleneck risk analysis on critical path
        const devCriticalMap = {};
        criticalTasks.forEach(t => {
            const name = t.assignee?.name || 'Unassigned';
            if (!devCriticalMap[name]) devCriticalMap[name] = { name, count: 0, hours: 0 };
            devCriticalMap[name].count += 1;
            devCriticalMap[name].hours += t.duration;
        });

        const topBottleneckDev = Object.values(devCriticalMap).sort((a, b) => b.hours - a.hours)[0] || null;

        return {
            criticalTasksCount: criticalTasks.length,
            flexibleTasksCount: flexibleTasks.length,
            totalCritHours,
            totalFlexHours,
            avgSlack,
            topBottleneckDev,
            critRatio: Math.round((criticalTasks.length / filteredCpaTasks.length) * 100),
        };
    }, [filteredCpaTasks]);

    return (
        <TenantLayout>
            <Head title="Overview — Dashboard" />
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 min-h-screen">

                {/* Page Header */}
                <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="font-heading text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                            Dashboard Overview
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                            Your studio at a glance — metrics &amp; active projects.
                        </p>
                    </div>

                    <div className="relative flex items-center gap-2">
                        {hasActiveFilter && (
                            <button
                                onClick={clearFilter}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all hover:bg-rose-100 dark:hover:bg-rose-900/30"
                            >
                                <XIcon /> Clear
                            </button>
                        )}
                        <button
                            onClick={() => setFilterOpen(o => !o)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm ${
                                hasActiveFilter
                                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-indigo-500'
                            }`}
                        >
                            <FilterIcon />
                            <span>Filter{activeStatus !== 'all' ? `: ${STATUS_FILTERS.find(f => f.key === activeStatus)?.label}` : ''}</span>
                        </button>

                        {filterOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 z-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden w-64 p-4">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Filter by Status</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {STATUS_FILTERS.map(f => (
                                            <button
                                                key={f.key}
                                                onClick={() => applyFilter(f.key)}
                                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                                                    activeStatus === f.key
                                                        ? f.color + ' scale-105 shadow-sm'
                                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Search</p>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Project name..."
                                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="px-6 pb-8 space-y-6">

                    {/* METRIC CARDS with High-Fidelity SVG Icons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Card 1: Overall Tasks */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                        Overall Tasks
                                    </p>
                                    <p className="font-heading text-4xl font-extrabold text-gray-900 dark:text-slate-100 mt-1 leading-none">
                                        {totalTasks > 0 ? totalTasks : '—'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/40">
                                    <TasksIcon />
                                </div>
                            </div>
                            {totalTasks > 0 ? (
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'On Going',     count: activeTasksCount,  color: 'bg-indigo-500', pct: totalTasks > 0 ? Math.round((activeTasksCount / totalTasks) * 100) : 0 },
                                        { label: 'Under Review', count: reviewTasksCount,  color: 'bg-amber-500',  pct: totalTasks > 0 ? Math.round((reviewTasksCount / totalTasks) * 100) : 0 },
                                        { label: 'Finished',     count: doneTasksCount,    color: 'bg-emerald-500', pct: taskCompletionPct },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-3">
                                            <span className="text-[11px] text-gray-500 dark:text-slate-400 w-24 shrink-0">{item.label}</span>
                                            <LinearProgress pct={item.pct} color={item.color} w="flex-1" />
                                            <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 w-4 text-right shrink-0">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 italic">No tasks available yet.</p>
                            )}
                        </div>

                        {/* Card 2: Projects */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Total Projects</p>
                                    <p className="font-heading text-4xl font-extrabold text-gray-900 dark:text-slate-100 mt-1 leading-none">
                                        {projects.length > 0 ? projects.length : '—'}
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{activeCount} active</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800/40">
                                    <FoldersIcon />
                                </div>
                            </div>
                            {projects.length === 0 && (
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 italic mt-3">No projects created yet.</p>
                            )}
                        </div>

                        {/* Card 3: Project Progress */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Completion Rate</p>
                                    <p className="font-heading text-4xl font-extrabold text-gray-900 dark:text-slate-100 mt-1 leading-none">
                                        {totalTasks > 0 ? `${taskCompletionPct}%` : '—'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
                                    <SpeedometerIcon />
                                </div>
                            </div>
                            {projects.length > 0 ? (
                                <div className="space-y-3">
                                    {[
                                        { label: 'Tasks completed', pct: taskCompletionPct, color: 'bg-indigo-500' },
                                        { label: 'Team members', pct: totalMembers > 0 ? Math.min(100, totalMembers * 10) : 0, color: 'bg-amber-500' },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[11px] text-gray-500 dark:text-slate-400">{item.label}</span>
                                                <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300">{item.pct}%</span>
                                            </div>
                                            <LinearProgress pct={item.pct} color={item.color} w="w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 italic">No data available yet.</p>
                            )}
                        </div>
                    </div>

                    {/* ACTIVE PROJECTS TABLE */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800/60 gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <h2 className="font-heading text-sm font-bold text-gray-900 dark:text-slate-100">
                                    Active Projects
                                </h2>
                                {hasActiveFilter && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                        {filteredProjects.length} result{filteredProjects.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    {STATUS_FILTERS.slice(0, 4).map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setActiveStatus(f.key)}
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                                activeStatus === f.key
                                                    ? f.color + ' shadow-sm'
                                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {filteredProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <div className="text-gray-300 dark:text-slate-750">
                                    <EmptyBoxIcon />
                                </div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                    {hasActiveFilter ? 'No projects match your filter.' : 'No projects yet.'}
                                </p>
                                {hasActiveFilter && (
                                    <button onClick={clearFilter} className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                                        Clear filter
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-slate-800/50">
                                            {['Project Name', 'Due Tasks', 'Assigned Members', 'Status', 'Progress'].map(col => (
                                                <th key={col} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProjects.map((project, idx) => {
                                            const colors = ['text-indigo-500', 'text-amber-500', 'text-emerald-500', 'text-sky-500', 'text-pink-500'];
                                            const folderColor = colors[idx % colors.length];
                                            const tasksDone = project.tasks_done ?? 0;
                                            const tasksTotal = project.tasks_count ?? 0;
                                            const pct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
                                            const progressColor = project.status === 'completed' ? 'bg-emerald-500' : project.status === 'review' ? 'bg-amber-500' : 'bg-indigo-500';
                                            const isExpanded = !!expanded[project.id];

                                            return (
                                                <React.Fragment key={project.id}>
                                                    <tr
                                                        className="border-b border-gray-50 dark:border-slate-800/30 hover:bg-gray-50/70 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                                        onClick={() => toggleExpand(project.id)}
                                                    >
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-gray-400 dark:text-slate-500 w-4 flex items-center"><ChevronIcon isOpen={isExpanded} /></span>
                                                                <span className={folderColor}><FolderIcon /></span>
                                                                <span className="font-heading font-bold text-sm text-gray-900 dark:text-slate-100">{project.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-xs text-gray-550 dark:text-slate-400">{tasksTotal} tasks</td>
                                                        <td className="px-5 py-3">
                                                            {(() => {
                                                                const assigneeNames = Array.from(new Set(
                                                                    (project.tasks || [])
                                                                        .map(t => t.assignee?.name)
                                                                        .filter(Boolean)
                                                                ));
                                                                return assigneeNames.length > 0 ? (
                                                                    <AvatarStack names={assigneeNames} max={3} />
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-5 py-3"><StatusBadge status={project.status} /></td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <LinearProgress pct={pct} color={progressColor} w="w-16" />
                                                                <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400">{pct}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="border-b border-gray-50 dark:border-slate-800/20 bg-gray-50/40 dark:bg-slate-800/10">
                                                            <td colSpan={5} className="px-5 py-2.5 pl-16 text-xs text-gray-505 dark:text-slate-400">
                                                                <span className="font-medium">{project.description || 'No description provided.'}</span>
                                                                {tasksTotal > 0 && <span className="ml-3 text-gray-400">· {tasksTotal} task{tasksTotal !== 1 ? 's' : ''} tracked</span>}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* PROJECT TIMELINE (CPA) SECTION */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-5">
                        {/* Section Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-heading text-base font-extrabold text-gray-900 dark:text-slate-100">
                                        Project Timeline & Critical Path Analysis (CPA)
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                        CPM Network
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                    Workflow dependency schedule: highlights non-negotiable critical path bottlenecks and slack float buffers.
                                </p>
                            </div>

                            {/* Filter & View Mode Controls */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* View Mode Toggle */}
                                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setCpaViewMode('gantt')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            cpaViewMode === 'gantt'
                                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Gantt Chart
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCpaViewMode('table')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            cpaViewMode === 'table'
                                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        Sequence Table
                                    </button>
                                </div>

                                {/* Project Picker */}
                                <div className="flex items-center gap-1.5">
                                    <label htmlFor="cpa-proj-select" className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                        Project:
                                    </label>
                                    <select
                                        id="cpa-proj-select"
                                        value={cpaSelectedProjectId}
                                        onChange={(e) => setCpaSelectedProjectId(e.target.value)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="all">All Projects ({scheduledTasks.length} tasks)</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Search Filter */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={cpaSearchQuery}
                                        onChange={(e) => setCpaSearchQuery(e.target.value)}
                                        placeholder="Search task or dev..."
                                        className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 border-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44"
                                    />
                                </div>

                                {/* Critical Only Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setCpaCriticalOnly(!cpaCriticalOnly)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                        cpaCriticalOnly
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                    title="Filter to tasks on the Critical Path"
                                >
                                    <Flame className="w-3.5 h-3.5" />
                                    <span>Critical Path Only</span>
                                </button>
                            </div>
                        </div>

                        {/* CPA Key Indicators & Explainer Legend */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">Critical Path Tasks</span>
                                    <span className="text-xl font-black text-rose-900 dark:text-rose-200">{criticalTasksCount}</span>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                    <Flame className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">Flexible Tasks (Has Float)</span>
                                    <span className="text-xl font-black text-indigo-900 dark:text-indigo-200">{flexibleTasksCount}</span>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Scheduled Scope</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{filteredCpaTasks.length} Tasks</span>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                                    <Layers className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Max Project Duration</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                                        {maxTimelineHours}h <span className="text-xs font-normal text-slate-400">({Math.ceil(maxTimelineHours / 8)}d)</span>
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* ── AI CPA Schedule Synthesis & Executive Intelligence Card ── */}
                        {cpaAiSynthesis && (
                            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 p-4 sm:p-5 dark:border-indigo-900/40 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/20 shadow-xs space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/40 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 fill-amber-500 text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                                                AI Schedule Summary &amp; Team Focus Insights
                                            </h3>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Plain-English timeline analysis showing which tasks control your deadlines and where your team has breathing room.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 shrink-0 self-start sm:self-auto">
                                        <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                        {cpaAiSynthesis.critRatio}% Must-Do Task Ratio
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    {/* 1. Must-Do Tasks */}
                                    <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            <Flame className="w-3.5 h-3.5" />
                                            <span>Must-Do On Time ({cpaAiSynthesis.criticalTasksCount} Tasks)</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                            These tasks total <strong className="text-slate-900 dark:text-slate-100">{cpaAiSynthesis.totalCritHours}h</strong> of work with zero breathing room. Any delay here directly pushes back the final project completion date.
                                        </p>
                                    </div>

                                    {/* 2. Flexible Tasks */}
                                    <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Flexible Tasks ({cpaAiSynthesis.flexibleTasksCount} Tasks)</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                            These tasks have an average of <strong className="text-slate-900 dark:text-slate-100">+{cpaAiSynthesis.avgSlack}h</strong> (about {Math.round(cpaAiSynthesis.avgSlack / 8 * 10) / 10} days) of safe buffer. They can safely wait or be paused without affecting deadlines.
                                        </p>
                                    </div>

                                    {/* 3. Team Workload Focus */}
                                    <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            <User className="w-3.5 h-3.5" />
                                            <span>Team Workload Focus</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                                            {cpaAiSynthesis.topBottleneckDev ? (
                                                <>
                                                    <strong className="text-slate-900 dark:text-slate-100">{cpaAiSynthesis.topBottleneckDev.name}</strong> is assigned to <strong className="text-amber-600 dark:text-amber-400">{cpaAiSynthesis.topBottleneckDev.count} must-do tasks</strong> ({cpaAiSynthesis.topBottleneckDev.hours}h). Protect their focus from distractions to protect your deadline.
                                                </>
                                            ) : (
                                                'Must-do tasks are evenly distributed across the team with no single team member overloaded.'
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Legend explanation banner */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-rose-500 to-red-600 inline-block shadow-2xs" />
                                    <span className="font-bold text-rose-700 dark:text-rose-400">Critical Path:</span>
                                    <span className="text-[11px] text-slate-500">Zero slack float. Any delay directly delays the project completion date.</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-indigo-500 to-indigo-600 inline-block shadow-2xs" />
                                    <span className="font-bold text-indigo-700 dark:text-indigo-400">Flexible Task:</span>
                                    <span className="text-[11px] text-slate-500">Scheduled duration with safe float buffer (dashed extension).</span>
                                </div>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">1 Work Day = 8 Hours</span>
                        </div>

                        {/* Timeline Gantt Grid or Sequence Table with Guaranteed Zero Overlap */}
                        {filteredCpaTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-8 space-y-3">
                                <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                                <p className="text-sm font-bold text-gray-700 dark:text-slate-300">
                                    {scheduledTasks.length === 0 ? 'No Critical Path tasks scheduled yet' : 'No tasks match current filter'}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
                                    {scheduledTasks.length === 0
                                        ? 'Calculate your project schedules with task estimated hours and dependencies to generate automatic Critical Path Gantt timelines.'
                                        : 'Try toggling off "Critical Path Only", clearing the search, or selecting "All Projects" to view other scheduled tasks.'}
                                </p>
                                {scheduledTasks.length === 0 && projects.length > 0 && (
                                    <Link
                                        href={`/studio/${pageProps.auth?.user?.studio_slug || 'workspace'}/projects/${projects[0].id}`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 transition-all"
                                    >
                                        <span>Open Project Workspace</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                            </div>
                        ) : cpaViewMode === 'table' ? (
                            /* Sequence Table View */
                            <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                <th className="px-4 py-3">Seq</th>
                                                <th className="px-4 py-3">Task Title</th>
                                                <th className="px-4 py-3">Project</th>
                                                <th className="px-4 py-3">Assignee</th>
                                                <th className="px-4 py-3">Duration</th>
                                                <th className="px-4 py-3">Early Start (ES)</th>
                                                <th className="px-4 py-3">Early Finish (EF)</th>
                                                <th className="px-4 py-3">Slack (Float)</th>
                                                <th className="px-4 py-3">Critical Status</th>
                                                <th className="px-4 py-3 text-right">AI Synthesis &amp; Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                                            {filteredCpaTasks.map((t, idx) => {
                                                const ai = getTaskAiReasoning(t);
                                                const isExpanded = expandedAiReasoningTaskId === t.id;

                                                return (
                                                    <React.Fragment key={t.id}>
                                                        <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                            <td className="px-4 py-3 font-mono text-[10px] text-slate-400 font-bold">#{idx + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-bold text-slate-900 dark:text-slate-100">{t.title}</div>
                                                                <span className="text-[10px] text-slate-400 font-mono">ID: #{t.id}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{t.projectName}</td>
                                                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{t.assignee?.name || 'Unassigned'}</td>
                                                            <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{t.duration}h</td>
                                                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{t.es}h <span className="text-[10px] text-slate-400">(Day {Math.floor(t.es / 8) + 1})</span></td>
                                                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{t.ef}h <span className="text-[10px] text-slate-400">(Day {Math.floor(t.ef / 8) + 1})</span></td>
                                                            <td className="px-4 py-3 font-mono">
                                                                {t.total_float > 0 ? (
                                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">+{t.total_float}h slack</span>
                                                                ) : (
                                                                    <span className="text-rose-600 dark:text-rose-400 font-bold">0h (No slack)</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {t.is_critical ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                                                        <Flame className="w-3 h-3 text-rose-500" />
                                                                        Critical Bottleneck
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40">
                                                                        <Clock className="w-3 h-3 text-indigo-500" />
                                                                        Flexible Buffer
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedTaskForAiModal(t)}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 transition-all shadow-2xs"
                                                                        title="Read full AI Synthesis explanation"
                                                                    >
                                                                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                                        <span>AI Reason</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedAiReasoningTaskId(isExpanded ? null : t.id)}
                                                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                                        title="Toggle inline explanation"
                                                                    >
                                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Inline Expanded AI CPA Synthesis Details */}
                                                        {isExpanded && ai && (
                                                            <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 border-y border-indigo-100 dark:border-indigo-900/40">
                                                                <td colSpan={10} className="p-4 sm:p-5">
                                                                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-indigo-200/70 dark:border-indigo-900/50 shadow-xs space-y-3">
                                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50 dark:border-slate-800 pb-2.5">
                                                                            <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                                                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                                                <span>AI Synthesis Diagnosis: {ai.headline}</span>
                                                                            </h5>
                                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${ai.badgeClass} self-start sm:self-auto`}>
                                                                                {ai.badgeText}
                                                                            </span>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                                            <div className="space-y-1.5">
                                                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                                                                    Why It's Critical vs. Flexible
                                                                                </span>
                                                                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                                                                                    {ai.why}
                                                                                </p>
                                                                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 font-mono text-[10px] text-indigo-700 dark:text-indigo-300 border border-slate-100 dark:border-slate-700">
                                                                                    {ai.proof}
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-1.5">
                                                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                                                                    Schedule Impact &amp; Optimization Strategy
                                                                                </span>
                                                                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                                                                                    {ai.impact}
                                                                                </p>
                                                                                <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/50 text-[11px] font-medium">
                                                                                    💡 <strong>AI Recommendation:</strong> {ai.strategy}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* Gantt View */
                            <div className="w-full overflow-x-auto border border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs">
                                <div className="min-w-[960px]">
                                    {/* Timeline Header Row (Axis) */}
                                    <div className="flex items-center border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                                        <div className="w-72 p-3 font-bold text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wider shrink-0 border-r border-gray-200 dark:border-slate-800">
                                            Task & Assignment
                                        </div>
                                        <div className="flex-1 relative h-9">
                                            {timelineTicks.map((tick) => {
                                                const leftPct = (tick.hour / maxTimelineHours) * 100;
                                                return (
                                                    <div
                                                        key={tick.hour}
                                                        className="absolute top-0 bottom-0 border-l border-gray-200/80 dark:border-slate-700/60 pl-1.5 pt-2 text-[10px] font-mono text-gray-500 dark:text-slate-400"
                                                        style={{ left: `${leftPct}%` }}
                                                    >
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{tick.hour}h</span>
                                                        <span className="text-gray-400 text-[9px] ml-1">(D{tick.day})</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Task Rows (Guaranteed Zero Overlap - 1 Task per Dedicated Row) */}
                                    <div className="divide-y divide-gray-100 dark:divide-slate-800/60">
                                        {filteredCpaTasks.map((t) => {
                                            const maxHour = maxTimelineHours;
                                            const leftPct = Math.min(94, (t.es / maxHour) * 100);
                                            const rawWidthPct = (t.duration / maxHour) * 100;
                                            const widthPct = Math.max(3.5, Math.min(100 - leftPct, rawWidthPct));

                                            const remainingPct = Math.max(0, 100 - (leftPct + widthPct));
                                            const rawFloatPct = t.total_float > 0 ? (t.total_float / maxHour) * 100 : 0;
                                            const floatWidthPct = Math.min(remainingPct, rawFloatPct);
                                            const assigneeName = t.assignee?.name || 'Unassigned';

                                            return (
                                                <React.Fragment key={t.id}>
                                                    <div className="flex items-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                                                    {/* Left Info Column */}
                                                    <div className="w-72 p-3 shrink-0 border-r border-gray-100 dark:border-slate-800/60 space-y-1">
                                                        <div className="flex items-center justify-between gap-1.5">
                                                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex-1" title={t.title}>
                                                                {t.title}
                                                            </h4>
                                                            {t.is_critical ? (
                                                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 shrink-0">
                                                                    Critical
                                                                </span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 shrink-0">
                                                                    +{t.total_float}h float
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] text-slate-400 gap-1">
                                                            <span className="truncate max-w-[120px] text-slate-500 font-medium" title={t.projectName}>
                                                                {t.projectName}
                                                            </span>
                                                            <span className="truncate max-w-[110px] text-slate-600 dark:text-slate-300 font-semibold" title={assigneeName}>
                                                                {assigneeName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedTaskForAiModal(t)}
                                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                                                title="View AI Synthesis reasoning for this CPA result"
                                                            >
                                                                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                                <span>AI Reason</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedAiReasoningTaskId(expandedAiReasoningTaskId === t.id ? null : t.id)}
                                                                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                                title="Toggle inline details"
                                                            >
                                                                {expandedAiReasoningTaskId === t.id ? 'Hide' : 'Quick View'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Right Gantt Track Column */}
                                                    <div className="flex-1 relative h-12 flex items-center px-1">
                                                        {/* Vertical grid lines */}
                                                        {timelineTicks.map((tick) => (
                                                            <div
                                                                key={tick.hour}
                                                                className="absolute top-0 bottom-0 border-l border-gray-100 dark:border-slate-800/50 pointer-events-none"
                                                                style={{ left: `${(tick.hour / maxTimelineHours) * 100}%` }}
                                                            />
                                                        ))}

                                                        {/* Task Scheduled Bar */}
                                                        <div
                                                            onClick={() => setSelectedTaskForAiModal(t)}
                                                            className={`absolute h-8 rounded-xl flex items-center justify-between px-2.5 text-xs font-bold shadow-xs transition-all select-none cursor-pointer hover:brightness-105 group-hover:scale-[1.01] ${
                                                                t.is_critical
                                                                    ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white border border-rose-400 shadow-rose-500/20'
                                                                    : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border border-indigo-400 shadow-indigo-500/20'
                                                            }`}
                                                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                                            title={`Task #${t.id}: ${t.title}\nClick to view complete AI Synthesis reasoning`}
                                                        >
                                                            {widthPct < 14 ? (
                                                                <span className="text-[10px] font-mono mx-auto font-bold truncate">
                                                                    {t.duration}h
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span className="truncate text-[11px] font-bold drop-shadow-xs flex items-center gap-1">
                                                                        <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300 opacity-80 shrink-0" />
                                                                        {t.title}
                                                                    </span>
                                                                    <span className="text-[10px] opacity-90 font-mono ml-2 shrink-0">
                                                                        {t.duration}h
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Float / Slack Buffer Bar */}
                                                        {floatWidthPct > 0 && (
                                                            <div
                                                                className="absolute h-6 rounded-r-lg border-y border-r border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-mono flex items-center justify-center pointer-events-none select-none overflow-hidden"
                                                                style={{ left: `${leftPct + widthPct}%`, width: `${floatWidthPct}%` }}
                                                                title={`Slack Buffer: +${t.total_float}h float (safe buffer before project delay)`}
                                                            >
                                                                {floatWidthPct > 5 && <span className="truncate px-1 font-bold">+{t.total_float}h</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Inline Gantt AI Reasoning Row */}
                                                {expandedAiReasoningTaskId === t.id && (() => {
                                                    const ai = getTaskAiReasoning(t);
                                                    if (!ai) return null;
                                                    return (
                                                        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-4 border-t border-indigo-100 dark:border-indigo-900/40">
                                                            <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-indigo-200/70 dark:border-indigo-900/50 shadow-xs space-y-2">
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50 dark:border-slate-800 pb-2">
                                                                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                                        <span>AI Synthesis Diagnosis: {ai.headline}</span>
                                                                    </h5>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${ai.badgeClass} self-start sm:self-auto`}>
                                                                        {ai.badgeText}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                                    <div>
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CPA Mathematical Reason</span>
                                                                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{ai.why}</p>
                                                                        <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-1">{ai.proof}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Schedule Impact &amp; Strategy</span>
                                                                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{ai.impact}</p>
                                                                        <div className="mt-1.5 text-amber-900 dark:text-amber-200 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/50">
                                                                            💡 {ai.strategy}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── AI CPA Task Synthesis Modal ── */}
            {/* AI Task Explanation Modal */}
            <CpaTaskAiModal
                task={selectedTaskForAiModal}
                isOpen={Boolean(selectedTaskForAiModal)}
                onClose={() => setSelectedTaskForAiModal(null)}
            />
        </TenantLayout>
    );
}
