/**
 * Centralized Task Status and Color Token Mapping
 * Follows the decided SaaS design system recipe:
 * - 8–12% soft tinted background
 * - 25–35% subtle border
 * - WCAG AA compliant text shade
 * - Solid status dot
 */

export const WORKFLOW_STATUS_KEYS = ['todo', 'in_progress', 'review', 'completed'];

export const STATUS_CONFIG = {
    todo: {
        key: 'todo',
        label: 'To Do',
        dot: 'bg-slate-400 dark:bg-slate-500',
        pill: 'bg-slate-100 text-slate-700 border border-slate-300/60 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
        selectedPicker: 'bg-slate-200/80 border-slate-400 text-slate-900 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100',
    },
    in_progress: {
        key: 'in_progress',
        label: 'In Progress',
        dot: 'bg-blue-500',
        pill: 'bg-blue-50 text-blue-700 border border-blue-300/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
        selectedPicker: 'bg-blue-100/90 border-blue-400 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200',
    },
    review: {
        key: 'review',
        label: 'In Review',
        dot: 'bg-amber-500',
        pill: 'bg-amber-50 text-amber-800 border border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        selectedPicker: 'bg-amber-100/90 border-amber-400 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200',
    },
    completed: {
        key: 'completed',
        label: 'Completed',
        dot: 'bg-emerald-500',
        pill: 'bg-emerald-50 text-emerald-800 border border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
        selectedPicker: 'bg-emerald-100/90 border-emerald-400 text-emerald-900 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200',
    },
    stuck: {
        key: 'stuck',
        label: 'Stuck',
        actionLabel: 'Blocked / Stuck',
        dot: 'bg-rose-500',
        pill: 'bg-rose-50 text-rose-800 border border-rose-300/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
        selectedPicker: 'bg-rose-100/90 border-rose-400 text-rose-900 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200',
    },
    overdue: {
        key: 'overdue',
        label: 'Overdue',
        dot: 'bg-rose-600',
        pill: 'bg-rose-50 text-rose-700 border border-rose-300/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/70',
    },
};

/**
 * Normalizes any task status string to standard key.
 */
export function normalizeStatusKey(rawStatus, rawSprintStatus) {
    const s = String(rawStatus || '').toLowerCase();
    const sp = String(rawSprintStatus || '').toLowerCase();

    if (s === 'completed' || s === 'done' || sp === 'done' || sp === 'completed') return 'completed';
    if (s === 'review' || s === 'under_review' || sp === 'waiting_for_review') return 'review';
    if (s === 'in_progress' || sp === 'in_progress') return 'in_progress';
    if (s === 'stuck' || s === 'blocked' || sp === 'stuck') return 'stuck';
    if (s === 'overdue' || sp === 'overdue') return 'overdue';
    return 'todo';
}

/**
 * Format relative due date and overdue status.
 * e.g., "Due Oct 2 · 19 days overdue" or "Due in 3 days"
 */
export function formatRelativeDueDate(targetDate) {
    if (!targetDate) {
        return { text: 'No due date', formattedDate: null, isOverdue: false, days: null };
    }

    const due = new Date(targetDate);
    if (isNaN(due.getTime())) {
        return { text: String(targetDate), formattedDate: String(targetDate), isOverdue: false, days: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateClean = new Date(due);
    dueDateClean.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDateClean.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (diffDays < 0) {
        const absDays = Math.abs(diffDays);
        return {
            text: `Due ${formatted} · ${absDays} ${absDays === 1 ? 'day' : 'days'} overdue`,
            shortText: `${absDays}d overdue`,
            formattedDate: formatted,
            isOverdue: true,
            days: diffDays,
        };
    }
    if (diffDays === 0) {
        return {
            text: 'Due today',
            shortText: 'Due today',
            formattedDate: formatted,
            isOverdue: false,
            days: 0,
        };
    }
    return {
        text: `Due ${formatted} · In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`,
        shortText: `Due in ${diffDays}d`,
        formattedDate: formatted,
        isOverdue: false,
        days: diffDays,
    };
}
