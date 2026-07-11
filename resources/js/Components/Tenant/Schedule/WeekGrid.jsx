import React from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
}
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // roll back to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// ── Config ────────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM → 7 PM
const SHORT_DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_BG = {
    todo:        'bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/30 dark:border-sky-700/50 dark:text-sky-300',
    in_progress: 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-300',
    in_review:   'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-300',
    completed:   'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-300',
};
const EVENT_BG = {
    meeting:   'bg-indigo-200 border-indigo-400 text-indigo-900 dark:bg-indigo-800/40 dark:border-indigo-600/60 dark:text-indigo-200',
    milestone: 'bg-amber-200 border-amber-400 text-amber-900 dark:bg-amber-800/40 dark:border-amber-600/60 dark:text-amber-200',
    deadline:  'bg-rose-200 border-rose-400 text-rose-900 dark:bg-rose-800/40 dark:border-rose-600/60 dark:text-rose-200',
    review:    'bg-purple-200 border-purple-400 text-purple-900 dark:bg-purple-800/40 dark:border-purple-600/60 dark:text-purple-200',
};

// ── WeekGrid ──────────────────────────────────────────────────────────────────
/**
 * Props:
 *   weekStart    Date   — the Monday of the week to display
 *   selectedDate Date
 *   onSelectDate fn(Date)
 *   tasksByDate  Record<'YYYY-MM-DD', task[]>
 *   eventsByDate Record<'YYYY-MM-DD', event[]>
 */
export default function WeekGrid({ weekStart, selectedDate, onSelectDate, tasksByDate = {}, eventsByDate = {} }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const HOUR_H = 56; // px per hour row
    const COL_LEFT_W = 48; // px for hour label column

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Parse time string "HH:MM" → minutes from midnight
    const parseTime = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
    };

    // Current time indicator
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowTop = ((nowMinutes - HOURS[0] * 60) / 60) * HOUR_H;

    return (
        <div className="flex-1 overflow-auto">
            <div style={{ minWidth: `${COL_LEFT_W + 7 * 120}px` }}>

                {/* Day headers */}
                <div className="flex sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800/60">
                    {/* Spacer for hour labels */}
                    <div style={{ width: COL_LEFT_W }} className="shrink-0" />

                    {weekDays.map((d, i) => {
                        const isSelected = isSameDay(d, selectedDate);
                        const isTodayCol = isSameDay(d, today);
                        return (
                            <button
                                key={i}
                                onClick={() => onSelectDate(d)}
                                style={{ flex: 1 }}
                                className={`py-3 flex flex-col items-center border-l border-gray-100 dark:border-slate-800/60 transition-colors
                                    ${isTodayCol ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'}
                                `}
                            >
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isTodayCol ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                    {SHORT_DAY[i]}
                                </span>
                                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5
                                    ${isTodayCol ? 'bg-indigo-600 text-white' : ''}
                                    ${isSelected && !isTodayCol ? 'ring-2 ring-indigo-400 text-indigo-600 dark:text-indigo-400' : ''}
                                    ${!isTodayCol && !isSelected ? 'text-gray-700 dark:text-slate-300' : ''}
                                `}>
                                    {d.getDate()}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Hour rows grid */}
                <div className="relative flex">
                    {/* Hour labels */}
                    <div style={{ width: COL_LEFT_W }} className="shrink-0 flex flex-col">
                        {HOURS.map(h => (
                            <div key={h} style={{ height: HOUR_H }}
                                className="flex items-start justify-end pr-2 pt-1 text-[9px] font-semibold text-gray-400 dark:text-slate-500 shrink-0 border-b border-gray-50 dark:border-slate-800/30">
                                {h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className="flex flex-1 relative">
                        {weekDays.map((d, ci) => {
                            const dateStr   = toDateStr(d);
                            const dayTasks  = tasksByDate[dateStr]  || [];
                            const dayEvents = eventsByDate[dateStr] || [];
                            const isTodayCol = isSameDay(d, today);

                            return (
                                <div key={ci} style={{ flex: 1 }}
                                    className={`relative border-l border-gray-100 dark:border-slate-800/60 ${isTodayCol ? 'bg-indigo-50/20 dark:bg-indigo-900/5' : ''}`}
                                >
                                    {/* Hour lines */}
                                    {HOURS.map(h => (
                                        <div key={h} style={{ height: HOUR_H }}
                                            className="border-b border-gray-50 dark:border-slate-800/30" />
                                    ))}

                                    {/* Task blocks — positioned at their estimated start time (fallback: 9 AM) */}
                                    {dayTasks.map((task, ti) => {
                                        const startMin = (9 + ti) * 60; // stagger tasks from 9 AM
                                        const durationMin = Math.min((task.estimated_hours || 1) * 60, 120);
                                        const top  = ((startMin - HOURS[0] * 60) / 60) * HOUR_H;
                                        const height = (durationMin / 60) * HOUR_H;
                                        const style = STATUS_BG[task.status] || STATUS_BG.todo;
                                        return (
                                            <div key={task.id}
                                                style={{ top: Math.max(0, top), height: Math.max(20, height), left: 2, right: 2, position: 'absolute' }}
                                                className={`rounded-lg border px-1.5 py-1 overflow-hidden shadow-sm ${style} cursor-pointer hover:brightness-95 transition-all`}
                                                title={task.title}
                                            >
                                                <p className="text-[10px] font-bold truncate leading-tight">{task.title}</p>
                                                <p className="text-[9px] opacity-70 truncate">{task.assignee || 'Unassigned'}</p>
                                            </div>
                                        );
                                    })}

                                    {/* Event blocks */}
                                    {dayEvents.map((event, ei) => {
                                        const startMin = parseTime(event.startTime);
                                        const endMin   = parseTime(event.endTime) || startMin + 60;
                                        if (startMin === null) return null;
                                        const top    = ((startMin - HOURS[0] * 60) / 60) * HOUR_H;
                                        const height = ((endMin - startMin) / 60) * HOUR_H;
                                        const style  = EVENT_BG[event.type] || EVENT_BG.meeting;
                                        return (
                                            <div key={event.id}
                                                style={{ top: Math.max(0, top), height: Math.max(20, height), left: 2, right: 2, position: 'absolute' }}
                                                className={`rounded-lg border px-1.5 py-1 overflow-hidden shadow-sm ${style} cursor-pointer hover:brightness-95 transition-all`}
                                                title={event.title}
                                            >
                                                <p className="text-[10px] font-bold truncate leading-tight">{event.title}</p>
                                                <p className="text-[9px] opacity-70">{event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</p>
                                            </div>
                                        );
                                    })}

                                    {/* Today current-time line */}
                                    {isTodayCol && nowTop >= 0 && nowTop <= HOURS.length * HOUR_H && (
                                        <div style={{ top: nowTop, left: -4, right: 0, position: 'absolute' }}
                                            className="flex items-center z-10 pointer-events-none">
                                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                                            <div className="flex-1 h-px bg-indigo-600" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
