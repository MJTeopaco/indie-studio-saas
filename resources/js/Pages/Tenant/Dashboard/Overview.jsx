import React, { useState, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';

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

export default function Overview({ projects: propProjects = [], stats: propStats = null }) {
    const pageProps = usePage().props;
    const projects = propProjects.length > 0 ? propProjects : (pageProps.projects ?? []);

    // derive metrics from real projects
    const totalTasks   = projects.reduce((a, p) => a + (p.tasks_count ?? 0), 0);
    const totalMembers = projects.reduce((a, p) => a + (p.members_count ?? 0), 0);
    const activeCount  = projects.filter(p => p.status === 'active').length;
    const doneCount    = projects.filter(p => p.status === 'completed').length;
    const reviewCount  = projects.filter(p => p.status === 'review').length;
    const completionPct = projects.length > 0 ? Math.round((doneCount / projects.length) * 100) : 0;

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

    // Extract all scheduled CPA tasks from all projects
    const scheduledTasks = useMemo(() => {
        const list = [];
        projects.forEach(p => {
            if (p.tasks) {
                p.tasks.forEach(t => {
                    if (t.es !== null && t.ef !== null) {
                        list.push({
                            ...t,
                            projectName: p.name,
                        });
                    }
                });
            }
        });
        return list;
    }, [projects]);

    const maxFinishTime = useMemo(() => {
        if (scheduledTasks.length === 0) return 40;
        return Math.max(40, ...scheduledTasks.map(t => Number(t.ef)));
    }, [scheduledTasks]);

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
                                        { label: 'On Going',     count: activeCount,  color: 'bg-indigo-500', pct: projects.length > 0 ? Math.round((activeCount / projects.length) * 100) : 0 },
                                        { label: 'Under Review', count: reviewCount,  color: 'bg-amber-500',  pct: projects.length > 0 ? Math.round((reviewCount / projects.length) * 100) : 0 },
                                        { label: 'Finished',     count: doneCount,    color: 'bg-emerald-500', pct: completionPct },
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
                                        {projects.length > 0 ? `${completionPct}%` : '—'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
                                    <SpeedometerIcon />
                                </div>
                            </div>
                            {projects.length > 0 ? (
                                <div className="space-y-3">
                                    {[
                                        { label: 'Projects done', pct: completionPct, color: 'bg-indigo-500' },
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
                                                            {project.members_count > 0 ? (
                                                                <AvatarStack names={Array.from({ length: Math.min(project.members_count, 5) }, (_, i) => `M${i + 1}`)} max={3} />
                                                            ) : (
                                                                <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                                                            )}
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
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h2 className="font-heading text-base font-extrabold text-gray-900 dark:text-slate-100">
                                    Project Timeline
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:border-indigo-500 shadow-sm transition-colors">
                                    <FilterIcon />
                                    <span>Filter</span>
                                </button>
                                <button 
                                    onClick={() => alert("Add Schedule modal coming soon!")}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#4f46e5] hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
                                >
                                    <span className="text-sm font-semibold">+</span>
                                    <span>Add Schedule</span>
                                </button>
                            </div>
                        </div>

                        {/* Timeline Wrapper */}
                        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="min-w-[850px] space-y-4">
                                
                                {/* Axis Header Row */}
                                <div className="grid grid-cols-[150px_1fr] gap-4 items-center shrink-0">
                                    <div />
                                    <div className="grid grid-cols-9 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center select-none">
                                        {['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'].map(hour => (
                                            <span key={hour} className="text-left pl-1">{hour}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Lanes Container */}
                                <div className="space-y-3 relative">
                                    {scheduledTasks.length > 0 ? (
                                        [
                                            {
                                                name: 'Design Division',
                                                tasks: scheduledTasks.filter(t => {
                                                    const cl = (t.task_classification || '').toLowerCase();
                                                    const pos = (t.required_position || '').toLowerCase();
                                                    const ti = (t.title || '').toLowerCase();
                                                    return cl.includes('design') || cl.includes('frontend') || cl.includes('ui') || cl.includes('ux') ||
                                                           pos.includes('design') || pos.includes('frontend') || pos.includes('ui') || pos.includes('ux') ||
                                                           ti.includes('design') || ti.includes('frontend') || ti.includes('ui') || ti.includes('ux');
                                                }),
                                                colors: ['bg-indigo-650/90 text-white border-indigo-500', 'bg-emerald-600/90 text-white border-emerald-500']
                                            },
                                            {
                                                name: 'Dev Division',
                                                tasks: scheduledTasks.filter(t => {
                                                    const cl = (t.task_classification || '').toLowerCase();
                                                    const pos = (t.required_position || '').toLowerCase();
                                                    const ti = (t.title || '').toLowerCase();
                                                    const isDesign = cl.includes('design') || cl.includes('frontend') || cl.includes('ui') || cl.includes('ux') ||
                                                                     pos.includes('design') || pos.includes('frontend') || pos.includes('ui') || pos.includes('ux') ||
                                                                     ti.includes('design') || ti.includes('frontend') || ti.includes('ui') || ti.includes('ux');
                                                    if (isDesign) return false;
                                                    return cl.includes('dev') || cl.includes('developer') || cl.includes('engineer') || cl.includes('backend') || cl.includes('full stack') || cl.includes('ai') || cl.includes('ml') || cl.includes('database') ||
                                                           pos.includes('dev') || pos.includes('developer') || pos.includes('engineer') || pos.includes('backend') || pos.includes('full stack') || pos.includes('ai') || pos.includes('ml') || pos.includes('database') ||
                                                           ti.includes('dev') || ti.includes('developer') || ti.includes('engineer') || ti.includes('backend') || ti.includes('full stack') || ti.includes('ai') || ti.includes('ml') || ti.includes('database');
                                                }),
                                                colors: ['bg-sky-600/90 text-white border-sky-500', 'bg-amber-600/90 text-white border-amber-500']
                                            },
                                            {
                                                name: 'Marketing',
                                                tasks: scheduledTasks.filter(t => {
                                                    const cl = (t.task_classification || '').toLowerCase();
                                                    const pos = (t.required_position || '').toLowerCase();
                                                    const ti = (t.title || '').toLowerCase();
                                                    const isDesign = cl.includes('design') || cl.includes('frontend') || cl.includes('ui') || cl.includes('ux') ||
                                                                     pos.includes('design') || pos.includes('frontend') || pos.includes('ui') || pos.includes('ux') ||
                                                                     ti.includes('design') || ti.includes('frontend') || ti.includes('ui') || ti.includes('ux');
                                                    const isDev = !isDesign && (cl.includes('dev') || cl.includes('developer') || cl.includes('engineer') || cl.includes('backend') || cl.includes('full stack') || cl.includes('ai') || cl.includes('ml') || cl.includes('database') ||
                                                                   pos.includes('dev') || pos.includes('developer') || pos.includes('engineer') || pos.includes('backend') || pos.includes('full stack') || pos.includes('ai') || pos.includes('ml') || pos.includes('database') ||
                                                                   ti.includes('dev') || ti.includes('developer') || ti.includes('engineer') || ti.includes('backend') || ti.includes('full stack') || ti.includes('ai') || ti.includes('ml') || ti.includes('database'));
                                                    return !isDesign && !isDev;
                                                }),
                                                colors: ['bg-violet-600/90 text-white border-violet-500', 'bg-pink-600/90 text-white border-pink-500']
                                            }
                                        ].map((lane, laneIdx) => (
                                            <div key={lane.name} className="grid grid-cols-[150px_1fr] gap-4 items-center shrink-0">
                                                {/* Left label */}
                                                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 select-none">
                                                    {lane.name}
                                                </span>
                                                {/* Grid lane body */}
                                                <div className="relative h-14 bg-[#f8fafc]/60 dark:bg-slate-900/40 border border-gray-150/60 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                                    {/* Hour divider lines */}
                                                    <div className="absolute inset-0 grid grid-cols-9 pointer-events-none divide-x divide-gray-100/80 dark:divide-slate-800/40" />

                                                    {/* Lane blocks */}
                                                    {lane.tasks.map((task, tIdx) => {
                                                        const scale = 9 / maxFinishTime;
                                                        const pctLeft = (Number(task.es) * scale * 11) % 80; // beautiful distribution logic
                                                        const pctWidth = Math.max(15, (Number(task.ef) - Number(task.es)) * scale * 12);
                                                        const blockColor = lane.colors[tIdx % lane.colors.length];
                                                        const initials = task.assignee ? task.assignee.name.split(' ').map(n => n[0]).join('') : 'U';

                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className={`absolute top-2.5 h-9 rounded-xl border flex items-center justify-between px-3.5 shadow-sm transition-all hover:scale-[1.01] select-none ${blockColor}`}
                                                                style={{ left: `${pctLeft}%`, width: `${Math.min(pctWidth, 100 - pctLeft - 2)}%` }}
                                                            >
                                                                <span className="text-[11px] font-bold truncate max-w-[70%]" title={task.title}>
                                                                    {task.title}
                                                                </span>
                                                                {/* Assignee avatars overlapping */}
                                                                <div className="flex -space-x-1.5 shrink-0 select-none">
                                                                    <div className="w-5.5 h-5.5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[9px] font-bold text-white uppercase select-none">
                                                                        {initials.charAt(0)}
                                                                    </div>
                                                                    {task.is_critical && (
                                                                        <div className="w-5.5 h-5.5 rounded-full bg-rose-500/80 border border-white/40 flex items-center justify-center text-[8px] font-extrabold text-white select-none">
                                                                            C
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        /* ── Empty State ── */
                                        [
                                            { name: 'Design Division' },
                                            { name: 'Dev Division' },
                                            { name: 'Marketing' }
                                        ].map(lane => (
                                            <div key={lane.name} className="grid grid-cols-[150px_1fr] gap-4 items-center shrink-0">
                                                {/* Left label */}
                                                <span className="text-xs font-bold text-gray-400 dark:text-slate-500 select-none">
                                                    {lane.name}
                                                </span>
                                                {/* Empty Grid lane body */}
                                                <div className="relative h-14 bg-[#f8fafc]/30 dark:bg-slate-900/10 border border-gray-150/40 dark:border-slate-800/60 rounded-xl overflow-hidden">
                                                    {/* Hour divider lines */}
                                                    <div className="absolute inset-0 grid grid-cols-9 pointer-events-none divide-x divide-gray-100/40 dark:divide-slate-850" />
                                                    {/* No data overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 dark:text-slate-650 font-medium select-none">
                                                        No schedule
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                            </div>
                        </div>

                        {scheduledTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-300 dark:text-slate-700 mb-2">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400">No scheduled timeline tasks found</p>
                                <p className="text-[10px] text-gray-450 dark:text-slate-500 mt-0.5">
                                    Recalculate your project workspace with CPA to populate division timelines.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </TenantLayout>
    );
}
