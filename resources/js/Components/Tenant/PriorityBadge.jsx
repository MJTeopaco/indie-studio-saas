import React from 'react';

/**
 * PriorityBadge — Renders a styled priority label pill.
 */
export default function PriorityBadge({ priority }) {
    const map = {
        CRITICAL: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
        HIGH: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        MEDIUM: 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30',
        LOW: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30',
    };
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                map[priority] || map.MEDIUM
            }`}
        >
            {priority}
        </span>
    );
}
