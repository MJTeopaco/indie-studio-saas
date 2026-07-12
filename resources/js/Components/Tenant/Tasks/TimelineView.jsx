import React, { useMemo } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDate(str) {
    if (!str) return null;
    return new Date(str);
}

function daysBetween(a, b) {
    return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}

// ── Avatar Stack ──────────────────────────────────────────────────────────────
function AvatarStack({ names = [] }) {
    return (
        <div className="flex -space-x-1.5">
            {names.slice(0, 3).map((n, i) => (
                <div key={i} title={n}
                    className="w-5 h-5 rounded-full bg-indigo-500 border border-white dark:border-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                    {n.charAt(0)}
                </div>
            ))}
        </div>
    );
}

// ── TimelineView ──────────────────────────────────────────────────────────────
export default function TimelineView({ tasks = [] }) {
    // Build a date range covering all tasks ± 2 days padding
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allDates = tasks.flatMap(t => [parseDate(t.startDate), parseDate(t.dueDate)]).filter(Boolean);
    const minDate = allDates.length ? new Date(Math.min(...allDates)) : new Date(today.getTime() - 7 * 86400000);
    const maxDate = allDates.length ? new Date(Math.max(...allDates)) : new Date(today.getTime() + 21 * 86400000);
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 4);

    const totalDays = daysBetween(minDate, maxDate);

    // Build day headers (weekly groups)
    const days = Array.from({ length: totalDays }, (_, i) => {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    // Week groups for month/week header
    const months = [];
    let lastMonth = null;
    days.forEach((d, i) => {
        const m = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (m !== lastMonth) {
            months.push({ label: m, startIdx: i, count: 0 });
            lastMonth = m;
        }
        months[months.length - 1].count++;
    });

    const COL_W = 36; // px per day
    const LEFT_W = 180; // px left label column
    const ROW_H = 44;  // px per row

    const STATUS_COLOR = {
        todo:        'bg-gray-300 dark:bg-slate-600',
        in_progress: 'bg-indigo-500',
        in_review:   'bg-amber-500',
        completed:   'bg-emerald-500',
    };

    // Group tasks by client
    const grouped = tasks.reduce((acc, t) => {
        const grp = t.client || 'General';
        if (!acc[grp]) acc[grp] = [];
        acc[grp].push(t);
        return acc;
    }, {});

    const todayOffset = daysBetween(minDate, today);

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <div style={{ minWidth: `${LEFT_W + totalDays * COL_W}px` }}>

                        {/* Month header */}
                        <div className="flex border-b border-gray-100 dark:border-slate-800/60 bg-gray-50/60 dark:bg-slate-800/20" style={{ marginLeft: LEFT_W }}>
                            {months.map((m, i) => (
                                <div key={i}
                                    style={{ width: m.count * COL_W }}
                                    className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-2 py-2 border-r border-gray-200/60 dark:border-slate-700/40 shrink-0">
                                    {m.label}
                                </div>
                            ))}
                        </div>

                        {/* Day header */}
                        <div className="flex border-b border-gray-100 dark:border-slate-800/60">
                            {/* Sticky label */}
                            <div style={{ width: LEFT_W }} className="shrink-0 px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-gray-50/60 dark:bg-slate-800/20 border-r border-gray-200 dark:border-slate-700/60">
                                Task
                            </div>
                            {days.map((d, i) => {
                                const isToday = daysBetween(today, d) === 0;
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                return (
                                    <div key={i}
                                        style={{ width: COL_W }}
                                        className={`shrink-0 flex flex-col items-center justify-center py-1.5 border-r border-gray-100 dark:border-slate-800/40 last:border-0 ${isWeekend ? 'bg-gray-50/60 dark:bg-slate-800/10' : ''} ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}>
                                        <span className={`text-[9px] font-semibold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                            {d.toLocaleDateString('en', { weekday: 'narrow' })}
                                        </span>
                                        <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400'}`}>
                                            {d.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Task rows */}
                        {Object.entries(grouped).map(([group, groupTasks]) => (
                            <div key={group}>
                                {/* Group label */}
                                <div className="flex items-center bg-gray-50/50 dark:bg-slate-800/20 border-b border-gray-100 dark:border-slate-800/40">
                                    <div style={{ width: LEFT_W }} className="shrink-0 px-4 py-2 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-r border-gray-200 dark:border-slate-700/60">
                                        {group}
                                    </div>
                                    <div style={{ width: totalDays * COL_W }} className="h-8" />
                                </div>

                                {groupTasks.map(task => {
                                    const start = parseDate(task.startDate);
                                    const end   = parseDate(task.dueDate);
                                    const barStart = start ? Math.max(0, daysBetween(minDate, start)) : 0;
                                    const barEnd   = end   ? Math.min(totalDays, daysBetween(minDate, end)) : barStart + 2;
                                    const barW = Math.max(1, barEnd - barStart) * COL_W;

                                    return (
                                        <div key={task.id} className="flex items-center border-b border-gray-50 dark:border-slate-800/30 hover:bg-gray-50/40 dark:hover:bg-slate-800/10 transition-colors" style={{ height: ROW_H }}>
                                            {/* Task label */}
                                            <div style={{ width: LEFT_W }} className="shrink-0 px-4 flex flex-col justify-center border-r border-gray-200 dark:border-slate-700/60 h-full">
                                                <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{task.title}</span>
                                                {task.assignee && (
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{task.assignee}</span>
                                                )}
                                            </div>

                                            {/* Gantt area */}
                                            <div style={{ width: totalDays * COL_W }} className="relative h-full flex-shrink-0">
                                                {/* Weekend shading */}
                                                {days.map((d, i) => (d.getDay() === 0 || d.getDay() === 6) ? (
                                                    <div key={i}
                                                        style={{ left: i * COL_W, width: COL_W, top: 0, bottom: 0 }}
                                                        className="absolute bg-gray-50/80 dark:bg-slate-800/20 pointer-events-none" />
                                                ) : null)}

                                                {/* Today line */}
                                                {todayOffset >= 0 && todayOffset <= totalDays && (
                                                    <div
                                                        className="absolute top-0 bottom-0 w-px bg-indigo-500 z-10 pointer-events-none"
                                                        style={{ left: todayOffset * COL_W + COL_W / 2 }}
                                                    />
                                                )}

                                                {/* Task bar */}
                                                {barW > 0 && (
                                                    <div
                                                        className={`absolute top-1/2 -translate-y-1/2 rounded-full flex items-center px-2 gap-1.5 shadow-sm ${STATUS_COLOR[task.status] || STATUS_COLOR.todo}`}
                                                        style={{ left: barStart * COL_W + 1, width: barW - 2, height: 24, minWidth: 24 }}
                                                        title={`${task.title} — ${task.startDate} → ${task.dueDate}`}
                                                    >
                                                        <span className="text-white text-[9px] font-semibold truncate flex-1">{task.title}</span>
                                                        {task.assignee && <AvatarStack names={[task.assignee]} />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                    </div>
                </div>
            </div>
        </div>
    );
}
