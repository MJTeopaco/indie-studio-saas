import React from 'react';

const TYPE_STYLES = {
    meeting:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    milestone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    deadline:  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    review:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    task:      'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    done:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const TYPE_DOT = {
    meeting:   'bg-indigo-500',
    milestone: 'bg-amber-500',
    deadline:  'bg-rose-500',
    review:    'bg-purple-500',
    task:      'bg-sky-500',
    done:      'bg-emerald-500',
};

/**
 * EventPill — compact chip shown inside calendar day cells.
 * Props: title (string), type (string), compact (bool — dot-only mode)
 */
export default function EventPill({ title, type = 'task', compact = false }) {
    const style = TYPE_STYLES[type] || TYPE_STYLES.task;
    const dot   = TYPE_DOT[type]   || TYPE_DOT.task;

    if (compact) {
        // Dot-only mode for very small cells
        return <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} title={title} />;
    }

    return (
        <span className={`flex items-center gap-1 px-1.5 py-px rounded text-[9px] font-semibold truncate ${style}`}>
            <span className={`w-1 h-1 rounded-full shrink-0 ${dot}`} />
            <span className="truncate">{title}</span>
        </span>
    );
}
