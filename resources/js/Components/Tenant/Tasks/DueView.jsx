import React from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDate(str) {
    if (!str) return null;
    return new Date(str);
}
function daysDiff(dateStr) {
    if (!dateStr) return null;
    const d = parseDate(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

// ── DueLabel ──────────────────────────────────────────────────────────────────
function DueLabel({ diff }) {
    if (diff === null) return <span className="text-gray-400 dark:text-slate-500 text-xs italic">No due date</span>;
    if (diff < 0)  return <span className="text-rose-600 dark:text-rose-400 text-xs font-bold">{Math.abs(diff)}d overdue</span>;
    if (diff === 0) return <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">Due today</span>;
    if (diff <= 7)  return <span className="text-amber-500 dark:text-amber-400 text-xs font-semibold">Due in {diff}d</span>;
    return <span className="text-gray-400 dark:text-slate-500 text-xs">{diff}d remaining</span>;
}

// ── Priority badge ────────────────────────────────────────────────────────────
const PRIORITY_DOT = {
    CRITICAL: 'bg-rose-500',
    HIGH:     'bg-amber-500',
    MEDIUM:   'bg-sky-500',
    LOW:      'bg-gray-400',
};

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
    todo:        { label: 'To Do',       cls: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300' },
    in_progress: { label: 'In Progress', cls: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    in_review:   { label: 'In Review',   cls: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

// ── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({ task, isOverdue }) {
    const diff = daysDiff(task.dueDate);
    const status = STATUS_MAP[task.status] || STATUS_MAP.todo;
    return (
        <div className={`flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-slate-800/30 hover:bg-gray-50/60 dark:hover:bg-slate-800/20 transition-colors ${isOverdue ? 'border-l-2 border-l-rose-400' : ''}`}>
            {/* Priority dot */}
            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || PRIORITY_DOT.MEDIUM}`} />

            {/* Title */}
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200 line-clamp-1">{task.title}</span>

            {/* Project */}
            <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate max-w-[100px]">{task.client}</span>

            {/* Assignee */}
            <div className="flex items-center gap-1.5 min-w-[110px]">
                {task.assignee ? (
                    <>
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {task.assignee.charAt(0)}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{task.assignee}</span>
                    </>
                ) : (
                    <span className="text-[11px] italic text-gray-400 dark:text-slate-500">Unassigned</span>
                )}
            </div>

            {/* Status badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.cls}`}>{status.label}</span>

            {/* Due label */}
            <div className="min-w-[90px] text-right">
                <DueLabel diff={diff} />
            </div>
        </div>
    );
}

// ── Section ───────────────────────────────────────────────────────────────────
function DueSection({ title, tasks, accent, isOverdue = false }) {
    if (!tasks.length) return null;
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-slate-800/60 ${accent}`}>
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-800/60 text-[10px] font-bold text-gray-600 dark:text-slate-400">
                    {tasks.length}
                </span>
            </div>
            {/* Rows */}
            <div>
                {tasks.map(task => <TaskRow key={task.id} task={task} isOverdue={isOverdue} />)}
            </div>
        </div>
    );
}

// ── DueView ───────────────────────────────────────────────────────────────────
export default function DueView({ tasks = [] }) {
    const overdue   = tasks.filter(t => { const d = daysDiff(t.dueDate); return d !== null && d < 0 && t.status !== 'completed'; });
    const today     = tasks.filter(t => { const d = daysDiff(t.dueDate); return d !== null && d === 0 && t.status !== 'completed'; });
    const thisWeek  = tasks.filter(t => { const d = daysDiff(t.dueDate); return d !== null && d > 0 && d <= 7 && t.status !== 'completed'; });
    const upcoming  = tasks.filter(t => { const d = daysDiff(t.dueDate); return d !== null && d > 7 && t.status !== 'completed'; });
    const noDue     = tasks.filter(t => !t.dueDate && t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');

    const isEmpty = !overdue.length && !today.length && !thisWeek.length && !upcoming.length && !noDue.length && !completed.length;

    if (isEmpty) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
                            <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">All caught up!</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">No tasks to display.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <DueSection
                title="⚠️ Overdue"
                tasks={overdue}
                accent="bg-rose-50/60 dark:bg-rose-900/10 border-l-4 border-l-rose-500"
                isOverdue
            />
            <DueSection
                title="🔥 Due Today"
                tasks={today}
                accent="bg-amber-50/60 dark:bg-amber-900/10 border-l-4 border-l-amber-500"
            />
            <DueSection
                title="📅 Due This Week"
                tasks={thisWeek}
                accent="bg-indigo-50/40 dark:bg-indigo-900/10 border-l-4 border-l-indigo-400"
            />
            <DueSection
                title="🗓 Upcoming"
                tasks={upcoming}
                accent="bg-gray-50/60 dark:bg-slate-800/20 border-l-4 border-l-gray-300 dark:border-l-slate-600"
            />
            <DueSection
                title="📋 No Due Date"
                tasks={noDue}
                accent="bg-gray-50/40 dark:bg-slate-800/10 border-l-4 border-l-gray-200 dark:border-l-slate-700"
            />
            <DueSection
                title="✅ Completed"
                tasks={completed}
                accent="bg-emerald-50/40 dark:bg-emerald-900/10 border-l-4 border-l-emerald-400"
            />
        </div>
    );
}
