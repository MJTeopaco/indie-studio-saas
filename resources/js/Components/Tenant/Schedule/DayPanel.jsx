import React, { useState } from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);
const ChevronIcon = ({ dir = 'left' }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        {dir === 'left'
            ? <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            : <polyline points="9 18 15 12 9 6"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        }
    </svg>
);
const CheckIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ── Priority dot ──────────────────────────────────────────────────────────────
const PRIORITY_DOT = {
    CRITICAL: 'bg-rose-500',
    HIGH:     'bg-amber-500',
    MEDIUM:   'bg-sky-500',
    LOW:      'bg-gray-400',
};

// ── Event type styles ─────────────────────────────────────────────────────────
const EVENT_BORDER = {
    meeting:   'border-indigo-400 dark:border-indigo-500',
    milestone: 'border-amber-400 dark:border-amber-500',
    deadline:  'border-rose-400 dark:border-rose-500',
    review:    'border-purple-400 dark:border-purple-500',
};
const EVENT_TIME_BG = {
    meeting:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    milestone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    deadline:  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    review:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

// ── Mini calendar helpers ─────────────────────────────────────────────────────
const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getMiniCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    // Monday-start offset
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
}

// ── DayPanel ──────────────────────────────────────────────────────────────────
/**
 * DayPanel — Left panel showing:
 *   • Mini navigation calendar (top)
 *   • Task checklist for selectedDate
 *   • Scheduled events for selectedDate
 *
 * Props:
 *   selectedDate   Date     — the day being viewed
 *   onSelectDate   fn       — called when user clicks a mini-cal date
 *   tasks          array    — filtered tasks for selectedDate
 *   events         array    — filtered events for selectedDate
 *   allTaskDates   Set<str> — 'YYYY-MM-DD' strings with any task (for dot indicators)
 *   allEventDates  Set<str> — 'YYYY-MM-DD' strings with any event (for dot indicators)
 */
export default function DayPanel({ selectedDate, onSelectDate, tasks = [], events = [], allTaskDates = new Set(), allEventDates = new Set() }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [miniYear,  setMiniYear]  = useState(selectedDate.getFullYear());
    const [miniMonth, setMiniMonth] = useState(selectedDate.getMonth());
    const [checked,   setChecked]   = useState(new Set());

    const miniDays = getMiniCalendarDays(miniYear, miniMonth);
    const miniMonthLabel = new Date(miniYear, miniMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const prevMiniMonth = () => {
        if (miniMonth === 0) { setMiniYear(y => y - 1); setMiniMonth(11); }
        else setMiniMonth(m => m - 1);
    };
    const nextMiniMonth = () => {
        if (miniMonth === 11) { setMiniYear(y => y + 1); setMiniMonth(0); }
        else setMiniMonth(m => m + 1);
    };

    const toggleCheck = (id) => {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectedLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const isToday = isSameDay(selectedDate, today);

    return (
        <div className="w-80 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 overflow-y-auto">

            {/* ── Mini Calendar ── */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800/60">
                {/* Mini month nav */}
                <div className="flex items-center justify-between mb-3">
                    <button onClick={prevMiniMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors">
                        <ChevronIcon dir="left" />
                    </button>
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{miniMonthLabel}</span>
                    <button onClick={nextMiniMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors">
                        <ChevronIcon dir="right" />
                    </button>
                </div>

                {/* Week day labels */}
                <div className="grid grid-cols-7 mb-1">
                    {WEEK_DAYS.map(d => (
                        <div key={d} className="text-center text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase py-1">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-y-0.5">
                    {miniDays.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} />;
                        const cellDate = new Date(miniYear, miniMonth, day);
                        const isSelected = isSameDay(cellDate, selectedDate);
                        const isTodayCell = isSameDay(cellDate, today);
                        const dateStr = cellDate.toISOString().slice(0, 10);
                        const hasTask  = allTaskDates.has(dateStr);
                        const hasEvent = allEventDates.has(dateStr);

                        return (
                            <button
                                key={day}
                                onClick={() => onSelectDate(cellDate)}
                                className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] font-semibold transition-all duration-100
                                    ${isSelected  ? 'bg-indigo-600 text-white shadow-sm'        : ''}
                                    ${isTodayCell && !isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-300 dark:ring-indigo-700' : ''}
                                    ${!isSelected && !isTodayCell ? 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800' : ''}
                                `}
                            >
                                {day}
                                {/* Indicator dots */}
                                {(hasTask || hasEvent) && !isSelected && (
                                    <div className="flex gap-0.5 absolute bottom-0.5">
                                        {hasTask  && <span className="w-1 h-1 rounded-full bg-sky-500" />}
                                        {hasEvent && <span className="w-1 h-1 rounded-full bg-indigo-500" />}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Selected Date Header ── */}
            <div className="px-4 pt-4 pb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">{selectedLabel}</h2>
                {isToday && (
                    <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        Today
                    </span>
                )}
            </div>

            {/* ── Task Checklist ── */}
            <div className="px-4 pb-3 flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Tasks  <span className="ml-1 px-1.5 py-px rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">{tasks.length}</span>
                    </span>
                    <button
                        onClick={() => alert('Add task — coming soon!')}
                        className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-colors"
                    >
                        <PlusIcon /> Add
                    </button>
                </div>

                {tasks.length === 0 ? (
                    <div className="py-6 text-center rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-800/60">
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">No tasks scheduled</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {tasks.map(task => {
                            const isChecked = checked.has(task.id);
                            return (
                                <button
                                    key={task.id}
                                    onClick={() => toggleCheck(task.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all group
                                        ${isChecked
                                            ? 'bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800/60 opacity-60'
                                            : 'bg-white dark:bg-slate-800/20 border-gray-100 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-700/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                                        }`}
                                >
                                    {/* Custom checkbox */}
                                    <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors
                                        ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                                        {isChecked && <CheckIcon />}
                                    </span>

                                    {/* Priority dot */}
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-gray-400'}`} />

                                    {/* Title */}
                                    <span className={`flex-1 text-xs font-medium leading-snug ${isChecked ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-200'}`}>
                                        {task.title}
                                    </span>

                                    {/* Project badge */}
                                    <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 font-medium truncate max-w-[60px]">
                                        {task.client}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Scheduled Events ── */}
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-800/60 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Events  <span className="ml-1 px-1.5 py-px rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{events.length}</span>
                    </span>
                    <button
                        onClick={() => alert('Add event — coming soon!')}
                        className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-colors"
                    >
                        <PlusIcon /> Add
                    </button>
                </div>

                {events.length === 0 ? (
                    <div className="py-4 text-center rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-800/60">
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">No events scheduled</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {events.map(event => (
                            <div key={event.id}
                                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/20 border border-l-4 ${EVENT_BORDER[event.type] || 'border-gray-200 dark:border-slate-700'} border-gray-100 dark:border-slate-800/60`}
                            >
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 mt-px ${EVENT_TIME_BG[event.type] || 'bg-gray-100 text-gray-600'}`}>
                                    {event.startTime}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{event.title}</p>
                                    {event.endTime && (
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500">{event.startTime} – {event.endTime}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
