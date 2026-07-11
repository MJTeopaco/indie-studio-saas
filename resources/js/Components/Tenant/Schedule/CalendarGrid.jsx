import React from 'react';
import EventPill from './EventPill';

// ── Helpers ───────────────────────────────────────────────────────────────────
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOffset(year, month) {
    // Monday = 0 offset
    return (new Date(year, month, 1).getDay() + 6) % 7;
}
function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
}
function toDateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── CalendarGrid (Month View) ─────────────────────────────────────────────────
/**
 * Props:
 *   year         number
 *   month        number  (0-indexed)
 *   selectedDate Date
 *   onSelectDate fn(Date)
 *   tasksByDate  Record<'YYYY-MM-DD', task[]>
 *   eventsByDate Record<'YYYY-MM-DD', event[]>
 */
export default function CalendarGrid({ year, month, selectedDate, onSelectDate, tasksByDate = {}, eventsByDate = {} }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth  = getDaysInMonth(year, month);
    const firstOffset  = getFirstDayOffset(year, month);

    // Prev month tail days
    const prevMonthDays = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1);
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;

    // Build flat cell array: { day, month, year, isCurrentMonth }
    const cells = [];
    for (let i = firstOffset - 1; i >= 0; i--) {
        cells.push({ day: prevMonthDays - i, year: prevYear, month: prevMonth, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, year, month, isCurrentMonth: true });
    }
    const remaining = 42 - cells.length; // always 6 rows × 7 cols
    for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, year: nextYear, month: nextMonth, isCurrentMonth: false });
    }

    const rows = [];
    for (let r = 0; r < 6; r++) {
        rows.push(cells.slice(r * 7, r * 7 + 7));
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Week day header */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800/60 bg-gray-50/40 dark:bg-slate-800/20">
                {WEEK_DAYS.map(d => (
                    <div key={d} className="py-2.5 text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* Week rows */}
            <div className="flex-1 grid grid-rows-6 divide-y divide-gray-100 dark:divide-slate-800/40">
                {rows.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-7 divide-x divide-gray-100 dark:divide-slate-800/40">
                        {row.map((cell, ci) => {
                            const cellDate = new Date(cell.year, cell.month, cell.day);
                            const isSelected   = isSameDay(cellDate, selectedDate);
                            const isTodayCell  = isSameDay(cellDate, today);
                            const dateStr      = toDateStr(cell.year, cell.month, cell.day);
                            const dayTasks     = tasksByDate[dateStr]  || [];
                            const dayEvents    = eventsByDate[dateStr] || [];
                            const allItems     = [
                                ...dayTasks.map(t  => ({ title: t.title, type: t.status === 'completed' ? 'done' : 'task' })),
                                ...dayEvents.map(e => ({ title: e.title, type: e.type })),
                            ];
                            const visible  = allItems.slice(0, 3);
                            const overflow = allItems.length - visible.length;

                            return (
                                <button
                                    key={ci}
                                    onClick={() => onSelectDate(cellDate)}
                                    className={`relative flex flex-col gap-1 p-1.5 pt-1 text-left transition-all group overflow-hidden min-h-0
                                        ${!cell.isCurrentMonth ? 'opacity-30' : ''}
                                        ${isSelected ? 'bg-indigo-50/70 dark:bg-indigo-900/15 ring-1 ring-inset ring-indigo-300 dark:ring-indigo-700/60' : 'hover:bg-gray-50/80 dark:hover:bg-slate-800/30'}
                                    `}
                                >
                                    {/* Day number */}
                                    <span className={`self-start flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 transition-colors
                                        ${isTodayCell  ? 'bg-indigo-600 text-white' : ''}
                                        ${isSelected && !isTodayCell ? 'text-indigo-700 dark:text-indigo-400 font-extrabold' : ''}
                                        ${!isTodayCell && !isSelected ? 'text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-200' : ''}
                                    `}>
                                        {cell.day}
                                    </span>

                                    {/* Event / task pills */}
                                    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                                        {visible.map((item, idx) => (
                                            <EventPill key={idx} title={item.title} type={item.type} />
                                        ))}
                                        {overflow > 0 && (
                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold pl-1">+{overflow} more</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
