import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';

// ── Inline SVG Icons ─────────────────────────────────────────────────────────
const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const TrendUpIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
const PlusIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);
const FilterIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const CalSmIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
);

// ── Doc Type Badge ────────────────────────────────────────────────────────────
const DocBadge = ({ ext = 'DOC' }) => {
    const colorMap = {
        DOC: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
        PDF: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
        ZIP: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        MOV: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
        PNG: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${colorMap[ext] || colorMap.DOC}`}>
            {ext}
        </span>
    );
};

// ── Mini SVG Bar Chart ────────────────────────────────────────────────────────
function MiniBarChart({ data = [] }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = 14, gap = 7, chartH = 44;
    const totalW = data.length * (barW + gap) - gap;
    return (
        <svg width={totalW} height={chartH + 16} style={{ display: 'block', overflow: 'visible' }}>
            {data.map((d, i) => {
                const barH = Math.max(4, (d.value / max) * chartH);
                const x = i * (barW + gap);
                const y = chartH - barH;
                return (
                    <g key={d.label}>
                        <rect x={x} y={y} width={barW} height={barH} rx="3"
                            fill={d.active ? '#6366f1' : 'rgba(99,102,241,0.18)'} />
                        <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="8" fill="#9ca3af">
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
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

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        'In Progress':   'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700/40',
        'Under Review':  'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/40',
        'Completed':     'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40',
        'Pending':       'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || map['Pending']}`}>
            {status}
        </span>
    );
}

// ── Timeline Bar ─────────────────────────────────────────────────────────────
function TimelineBar({ label, start, duration, color, avatars }) {
    const hourStart = 8, hourEnd = 18;
    const totalHours = hourEnd - hourStart;
    const leftPct = ((start - hourStart) / totalHours) * 100;
    const widthPct = (duration / totalHours) * 100;
    const colorMap = {
        brand:   'bg-indigo-500',
        emerald: 'bg-emerald-500',
        amber:   'bg-amber-500',
        sky:     'bg-sky-500',
        purple:  'bg-purple-500',
        pink:    'bg-pink-500',
    };
    return (
        <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-full px-3 flex items-center gap-2 shadow-sm ${colorMap[color] || colorMap.brand}`}
            style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 12)}%`, height: '30px', minWidth: '90px' }}
        >
            <span className="text-white text-[10px] font-semibold truncate flex-1">{label}</span>
            {avatars && <AvatarStack names={avatars} max={2} />}
        </div>
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

// ── Main Overview Page ────────────────────────────────────────────────────────
export default function Overview() {
    const [expanded, setExpanded] = useState({ vortex: true, energy: false, eyez: false });
    const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    const divisionBars = [
        [
            { label: 'Meeting Brief Project', start: 8, duration: 1.5, color: 'brand',   avatars: ['Alex', 'Jordan', 'Sam'] },
            { label: 'Design System',          start: 11, duration: 2.5, color: 'emerald', avatars: ['Morgan', 'Taylor'] },
        ],
        [
            { label: 'Sprint Planning',  start: 9.5, duration: 2,   color: 'sky',    avatars: ['Dana', 'Riley'] },
            { label: 'Branding Project', start: 14,  duration: 2.5, color: 'amber',  avatars: ['Chris', 'Avery'] },
        ],
        [
            { label: 'User Research', start: 10,   duration: 1.5, color: 'purple', avatars: ['Pat', 'Jess'] },
            { label: 'Sprint Review', start: 15.5, duration: 1.5, color: 'pink',   avatars: ['Morgan'] },
        ],
    ];

    const vortexRows = [
        { name: 'Branding Logo', due: '3 tasks', files: ['DOC', 'PDF'], assignees: ['Alex', 'Jordan'],  status: 'In Progress',  prog: 72 },
        { name: 'Animation',     due: '5 tasks', files: ['MOV', 'ZIP'], assignees: ['Sam', 'Morgan'],   status: 'Under Review', prog: 55 },
        { name: 'Landing Page',  due: '8 tasks', files: ['DOC', 'PNG'], assignees: ['Taylor', 'Chris'], status: 'In Progress',  prog: 40 },
    ];

    return (
        <TenantLayout>
            <Head title="Overview — Dashboard" />
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 min-h-screen">

                {/* ── Page Header ── */}
                <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                    <div>
                        <h1 className="font-heading text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                            Dashboard Overview
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                            Your studio at a glance — metrics, timelines &amp; active projects.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300 hover:border-indigo-500 transition-all shadow-sm">
                            <CalSmIcon /> <span>July 2025</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-sm">
                            <PlusIcon /> <span>Add Schedule</span>
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-8 space-y-5">

                    {/* ── METRIC CARDS ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Card 1: Overall Tasks */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                                        Overall Tasks
                                    </p>
                                    <p className="font-heading text-4xl font-extrabold text-gray-900 dark:text-slate-100 mt-1 leading-none">
                                        23
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <CheckIcon />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {[
                                    { label: 'On Going',      count: 12, color: 'bg-indigo-500', pct: 52 },
                                    { label: 'Under Review',  count:  6, color: 'bg-amber-500',  pct: 26 },
                                    { label: 'Finish',        count:  4, color: 'bg-emerald-500', pct: 17 },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <span className="text-[11px] text-gray-500 dark:text-slate-400 w-24 shrink-0">{item.label}</span>
                                        <LinearProgress pct={item.pct} color={item.color} w="flex-1" />
                                        <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 w-4 text-right shrink-0">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Card 2: Project Track */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Project Track</p>
                                    <p className="font-heading text-4xl font-extrabold text-gray-900 dark:text-slate-100 mt-1 leading-none">4,892</p>
                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Referral</p>
                                </div>
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-700/40 shrink-0">
                                    <TrendUpIcon /> +12.2%
                                </span>
                            </div>
                            <div className="mt-3">
                                <MiniBarChart data={[
                                    { label: 'Jan', value: 55,  active: false },
                                    { label: 'Feb', value: 80,  active: false },
                                    { label: 'Mar', value: 65,  active: false },
                                    { label: 'Apr', value: 100, active: true  },
                                ]} />
                            </div>
                        </div>

                        {/* Card 3: Project Progress */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Project Progress</p>
                                    <p className="font-heading text-4xl font-extrabold text-gray-900 dark:text-slate-100 mt-1 leading-none">89%</p>
                                </div>
                                <div className="relative shrink-0">
                                    <CircleProgress percent={89} size={56} stroke={5} color="#6366f1" />
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                        89%
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Performing Progress', pct: 89, color: 'bg-indigo-500' },
                                    { label: 'Target Sales',        pct: 67, color: 'bg-amber-500'  },
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
                        </div>
                    </div>

                    {/* ── PROJECT TIMELINE ── */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800/60">
                            <h2 className="font-heading text-sm font-bold text-gray-900 dark:text-slate-100">
                                Project Timeline
                            </h2>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                    <FilterIcon /> <span>Filter</span>
                                </button>
                                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all">
                                    <PlusIcon /> <span>Add Schedule</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-5 overflow-x-auto">
                            <div className="min-w-[700px]">
                                {/* Hour labels row */}
                                <div className="flex mb-2 pl-32">
                                    {hours.map(h => (
                                        <div key={h} className="flex-1 text-center text-[9px] font-medium text-gray-400 dark:text-slate-500">
                                            {h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`}
                                        </div>
                                    ))}
                                </div>
                                {/* Division rows */}
                                <div className="space-y-2.5">
                                    {['Design Division', 'Dev Division', 'Marketing'].map((divName, ri) => (
                                        <div key={divName} className="flex items-center gap-3">
                                            <div className="w-28 shrink-0 text-[11px] font-medium text-gray-500 dark:text-slate-400 text-right pr-3 leading-tight">
                                                {divName}
                                            </div>
                                            <div className="flex-1 relative h-11 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800/50 overflow-hidden">
                                                {/* Vertical hour grid lines */}
                                                <div className="absolute inset-0 flex pointer-events-none">
                                                    {hours.map((_, i) => (
                                                        <div key={i} className="flex-1 border-r border-gray-200/50 dark:border-slate-700/30 last:border-0" />
                                                    ))}
                                                </div>
                                                {/* Timeline bars for this row */}
                                                {divisionBars[ri]?.map((bar, bi) => (
                                                    <TimelineBar key={bi} {...bar} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── ACTIVE PROJECTS TABLE ── */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800/60">
                            <h2 className="font-heading text-sm font-bold text-gray-900 dark:text-slate-100">
                                Active Projects
                            </h2>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all">
                                <PlusIcon /> <span>New Project</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px]">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-800/50">
                                        {['Project Name', 'Due Tasks', 'Source Files', 'Assigned Teams', 'Status', 'Progress'].map(col => (
                                            <th key={col} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>

                                    {/* ── Vortex folder row ── */}
                                    <tr className="border-b border-gray-50 dark:border-slate-800/30 hover:bg-gray-50/70 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                        onClick={() => toggle('vortex')}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-gray-400 dark:text-slate-500 w-4 flex items-center"><ChevronIcon isOpen={expanded.vortex} /></span>
                                                <span className="text-indigo-500"><FolderIcon /></span>
                                                <span className="font-heading font-bold text-sm text-gray-900 dark:text-slate-100">Vortex</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-slate-400">16 tasks</td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-1.5"><DocBadge ext="DOC"/><DocBadge ext="PDF"/><DocBadge ext="ZIP"/></div>
                                        </td>
                                        <td className="px-5 py-3"><AvatarStack names={['Alex', 'Jordan', 'Sam', 'Morgan']} max={3} /></td>
                                        <td className="px-5 py-3"><StatusBadge status="In Progress" /></td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <LinearProgress pct={62} color="bg-indigo-500" w="w-16" />
                                                <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400">62%</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Vortex sub-rows */}
                                    {expanded.vortex && vortexRows.map(sub => (
                                        <tr key={sub.name}
                                            className="border-b border-gray-50 dark:border-slate-800/20 bg-gray-50/40 dark:bg-slate-800/10 hover:bg-gray-50/80 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-5 py-2.5">
                                                <div className="flex items-center gap-2.5 pl-9">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-indigo-600 shrink-0" />
                                                    <span className="text-sm text-gray-700 dark:text-slate-300">{sub.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-2.5 text-xs text-gray-500 dark:text-slate-400">{sub.due}</td>
                                            <td className="px-5 py-2.5">
                                                <div className="flex gap-1.5">{sub.files.map(f => <DocBadge key={f} ext={f} />)}</div>
                                            </td>
                                            <td className="px-5 py-2.5"><AvatarStack names={sub.assignees} max={2} /></td>
                                            <td className="px-5 py-2.5"><StatusBadge status={sub.status} /></td>
                                            <td className="px-5 py-2.5">
                                                <div className="relative w-8 h-8 flex items-center justify-center">
                                                    <CircleProgress percent={sub.prog} size={30} stroke={2.5} color="#6366f1" />
                                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-indigo-600 dark:text-indigo-400">
                                                        {sub.prog}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* ── Energy. folder row ── */}
                                    <tr className="border-b border-gray-50 dark:border-slate-800/30 hover:bg-gray-50/70 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                        onClick={() => toggle('energy')}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-gray-400 dark:text-slate-500 w-4 flex items-center"><ChevronIcon isOpen={expanded.energy} /></span>
                                                <span className="text-amber-500"><FolderIcon /></span>
                                                <span className="font-heading font-bold text-sm text-gray-900 dark:text-slate-100">Energy.</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-slate-400">9 tasks</td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-1.5"><DocBadge ext="PDF"/><DocBadge ext="MOV"/></div>
                                        </td>
                                        <td className="px-5 py-3"><AvatarStack names={['Taylor', 'Chris', 'Riley']} max={3} /></td>
                                        <td className="px-5 py-3"><StatusBadge status="Under Review" /></td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <LinearProgress pct={38} color="bg-amber-500" w="w-16" />
                                                <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400">38%</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {expanded.energy && (
                                        <tr className="border-b border-gray-50 dark:border-slate-800/20 bg-gray-50/40 dark:bg-slate-800/10">
                                            <td colSpan={6} className="px-5 py-2 pl-16 text-[11px] text-gray-400 dark:text-slate-500 italic">
                                                3 sub-tasks — expand for detail view
                                            </td>
                                        </tr>
                                    )}

                                    {/* ── Eyez. folder row ── */}
                                    <tr className="hover:bg-gray-50/70 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                        onClick={() => toggle('eyez')}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-gray-400 dark:text-slate-500 w-4 flex items-center"><ChevronIcon isOpen={expanded.eyez} /></span>
                                                <span className="text-emerald-500"><FolderIcon /></span>
                                                <span className="font-heading font-bold text-sm text-gray-900 dark:text-slate-100">Eyez.</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-slate-400">12 tasks</td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-1.5"><DocBadge ext="ZIP"/><DocBadge ext="PNG"/></div>
                                        </td>
                                        <td className="px-5 py-3"><AvatarStack names={['Avery', 'Dana', 'Pat']} max={3} /></td>
                                        <td className="px-5 py-3"><StatusBadge status="Completed" /></td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <LinearProgress pct={94} color="bg-emerald-500" w="w-16" />
                                                <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400">94%</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {expanded.eyez && (
                                        <tr className="bg-gray-50/40 dark:bg-slate-800/10">
                                            <td colSpan={6} className="px-5 py-2 pl-16 text-[11px] text-gray-400 dark:text-slate-500 italic">
                                                5 sub-tasks — expand for detail view
                                            </td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </TenantLayout>
    );
}
