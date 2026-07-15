import React, { useState } from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────
const SortIcon = ({ dir }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: dir ? 1 : 0.3 }}>
        {dir === 'asc'  && <polyline points="18 15 12 9 6 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
        {dir === 'desc' && <polyline points="6 9 12 15 18 9"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
        {!dir && (
            <>
                <polyline points="18 15 12 9 6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </>
        )}
    </svg>
);
const PlusIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);
const ChevronIcon = ({ isOpen }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        style={{ display:'inline-block', transition:'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
        <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ── Status dot + label ────────────────────────────────────────────────────────
const STATUS_MAP = {
    todo:        { label: 'To Do',       dot: 'bg-gray-400',    text: 'text-gray-500 dark:text-slate-400' },
    in_progress: { label: 'In Progress', dot: 'bg-indigo-500',  text: 'text-indigo-600 dark:text-indigo-400' },
    review:      { label: 'In Review',   dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
    in_review:   { label: 'In Review',   dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
    completed:   { label: 'Completed',   dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
};

function StatusCell({ status }) {
    const cfg = STATUS_MAP[status] || STATUS_MAP.todo;
    return (
        <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ── Priority badge ────────────────────────────────────────────────────────────
const PRIORITY_MAP = {
    CRITICAL: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700/40',
    HIGH:     'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/40',
    MEDIUM:   'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-700/40',
    LOW:      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};
function PriorityCell({ priority }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${PRIORITY_MAP[priority] || PRIORITY_MAP.MEDIUM}`}>
            {priority}
        </span>
    );
}

// ── Tag pills ─────────────────────────────────────────────────────────────────
const TAG_COLORS = {
    Web:     'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    Saas:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    Mobile:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Design:  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    AI:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Backend: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }) {
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
            </div>
            <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400 w-7 text-right shrink-0">{pct}%</span>
        </div>
    );
}

// ── Columns config ────────────────────────────────────────────────────────────
const COLUMNS = [
    { key: 'title',      label: 'Task Name',   sortable: true,  width: 'min-w-[220px]' },
    { key: 'client',     label: 'Client',      sortable: true,  width: 'min-w-[120px]' },
    { key: 'assignee',   label: 'Assignee',    sortable: true,  width: 'min-w-[130px]' },
    { key: 'tags',       label: 'Tags',        sortable: false, width: 'min-w-[120px]' },
    { key: 'priority',   label: 'Priority',    sortable: true,  width: 'min-w-[100px]' },
    { key: 'status',     label: 'Status',      sortable: true,  width: 'min-w-[120px]' },
    { key: 'dueDate',    label: 'Due Date',    sortable: true,  width: 'min-w-[110px]' },
    { key: 'progress',   label: 'Progress',    sortable: true,  width: 'min-w-[130px]' },
];

// ── ListView ──────────────────────────────────────────────────────────────────
export default function ListView({ tasks = [], onTaskClick }) {
    const [sortKey, setSortKey] = useState('title');
    const [sortDir, setSortDir] = useState('asc');
    const [collapsed, setCollapsed] = useState({});

    const handleSort = (key) => {
        if (!COLUMNS.find(c => c.key === key)?.sortable) return;
        setSortKey(prev => {
            if (prev === key) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                return key;
            }
            setSortDir('asc');
            return key;
        });
    };

    // Group tasks by client (project)
    const grouped = tasks.reduce((acc, task) => {
        const grp = task.client || 'Ungrouped';
        if (!acc[grp]) acc[grp] = [];
        acc[grp].push(task);
        return acc;
    }, {});

    // Sort within each group
    const sortedGrouped = Object.entries(grouped).map(([group, groupTasks]) => ({
        group,
        tasks: [...groupTasks].sort((a, b) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        }),
    }));

    const toggleGroup = (grp) => setCollapsed(prev => ({ ...prev, [grp]: !prev[grp] }));

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden min-w-[900px]">
                {/* Table header */}
                <table className="w-full table-auto">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-800/60 bg-gray-50/60 dark:bg-slate-800/20">
                            {COLUMNS.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className={`px-4 py-3 text-left text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider ${col.width} ${col.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-slate-300 select-none' : ''}`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {col.label}
                                        {col.sortable && <SortIcon dir={sortKey === col.key ? sortDir : null} />}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedGrouped.map(({ group, tasks: groupTasks }) => (
                            <>
                                {/* Group header row */}
                                <tr
                                    key={`group-${group}`}
                                    className="bg-gray-50/80 dark:bg-slate-800/30 cursor-pointer hover:bg-gray-100/80 dark:hover:bg-slate-800/50 transition-colors"
                                    onClick={() => toggleGroup(group)}
                                >
                                    <td colSpan={COLUMNS.length} className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 dark:text-slate-500">
                                                <ChevronIcon isOpen={!collapsed[group]} />
                                            </span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{group}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-700 text-[10px] font-bold text-gray-500 dark:text-slate-400">
                                                {groupTasks.length}
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Task rows */}
                                {!collapsed[group] && groupTasks.map((task, i) => (
                                    <tr
                                        key={task.id}
                                        onClick={() => onTaskClick?.(task)}
                                        className={`border-b border-gray-50 dark:border-slate-800/30 hover:bg-gray-50/60 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-gray-50/20 dark:bg-slate-800/10'}`}
                                    >
                                        <td className="px-4 py-3 pl-9">
                                            <span className="text-sm font-medium text-gray-800 dark:text-slate-200 line-clamp-1">{task.title}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{task.client}</td>
                                        <td className="px-4 py-3">
                                            {task.assignee ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                                        {task.assignee.charAt(0)}
                                                    </div>
                                                    <span className="text-xs text-gray-600 dark:text-slate-400 truncate max-w-[90px]">{task.assignee}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-gray-400 dark:text-slate-500">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {task.tags?.slice(0, 2).map(tag => (
                                                    <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-500'}`}>{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><PriorityCell priority={task.priority} /></td>
                                        <td className="px-4 py-3"><StatusCell status={task.status} /></td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 font-mono">{task.dueDate || '—'}</td>
                                        <td className="px-4 py-3"><ProgressBar pct={task.progress ?? 0} /></td>
                                    </tr>
                                ))}

                                {/* Add task row */}
                                {!collapsed[group] && (
                                    <tr key={`add-${group}`} className="border-b border-gray-50 dark:border-slate-800/30">
                                        <td colSpan={COLUMNS.length} className="px-4 py-2 pl-9">
                                            <button
                                                onClick={() => alert(`Add task to ${group}`)}
                                                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            >
                                                <PlusIcon /> Add Task
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
