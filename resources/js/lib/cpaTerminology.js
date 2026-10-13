/**
 * resources/js/lib/cpaTerminology.js
 *
 * Centralized, consequence-driven terminology resolver for Critical Path Method (CPM).
 * Translates operations research math (ES/EF/LS/LF/float) into clear, actionable studio language.
 * Enunciates alertness without overwhelming users with technical jargon.
 */

/**
 * Checks if a date or deadline indicator is overdue.
 * @param {string|Date|null} dueDate
 * @param {number|null} daysUntilDeadline
 * @returns {boolean}
 */
export function checkIsOverdue(dueDate, daysUntilDeadline = null) {
    if (daysUntilDeadline !== null && daysUntilDeadline !== undefined) {
        return Number(daysUntilDeadline) < 0;
    }

    if (!dueDate) return false;

    try {
        const parsed = new Date(dueDate);
        if (!isNaN(parsed.getTime())) {
            // Compare with start of today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return parsed < today;
        }
    } catch {
        // Ignore unparseable date strings
    }

    return false;
}

/**
 * Resolves CPM mathematics into intuitive, consequence-driven studio language.
 *
 * @param {Object} params
 * @param {number|string|null} [params.totalFloat] - Total float in hours from CPM engine.
 * @param {boolean|number} [params.isCritical] - Flag indicating critical path membership.
 * @param {string|Date|null} [params.dueDate] - Constraint date or derived completion date.
 * @param {number|null} [params.daysUntilDeadline] - Explicit days until deadline.
 * @param {boolean} [params.isOverdue] - Explicit overdue flag if already evaluated.
 * @param {number} [params.dependentCount=0] - Number of downstream tasks waiting on this.
 * @param {string} [params.status='todo'] - Task status ('todo', 'in_progress', 'review', 'completed').
 * @returns {Object} Rich status descriptor
 */
export function resolveCpaStatus({
    totalFloat,
    isCritical,
    dueDate = null,
    daysUntilDeadline = null,
    isOverdue = null,
    dependentCount = 0,
    status = 'todo',
} = {}) {
    // 1. Completed tasks
    const normalizedStatus = String(status || '').toLowerCase();
    if (normalizedStatus === 'completed' || normalizedStatus === 'done') {
        return {
            tier: 'completed',
            level: 0,
            label: 'Completed',
            sublabel: 'Delivered',
            consequence: 'Work delivered and verified.',
            badgeClass: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
            icon: 'CheckCircle2',
            actionLabel: 'Delivered',
            actionPrompt: 'Work is delivered. No further action needed.',
        };
    }

    // Determine if overdue
    const isLate = isOverdue !== null ? Boolean(isOverdue) : checkIsOverdue(dueDate, daysUntilDeadline);
    const critFlag = Boolean(isCritical);
    const floatVal = totalFloat !== null && totalFloat !== undefined && totalFloat !== '' ? Number(totalFloat) : null;

    // 2. TIER 4: EMERGENCY — Release Blocker (Negative float OR Overdue on Critical Path)
    if ((floatVal !== null && floatVal < 0) || (isLate && critFlag)) {
        const lateHours = floatVal !== null && floatVal < 0 ? Math.abs(floatVal) : null;
        const sub = lateHours
            ? `${lateHours}h Behind`
            : dependentCount > 0
            ? `Blocks ${dependentCount} tasks`
            : 'Overdue';

        return {
            tier: 'emergency',
            level: 4,
            label: 'Release Blocker',
            sublabel: sub,
            consequence: 'Directly delaying project delivery. Downstream tasks are waiting for this work.',
            badgeClass: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 animate-pulse shadow-xs shadow-rose-500/10',
            icon: 'AlertTriangle',
            actionLabel: 'Unblock release now',
            actionPrompt: 'Reassign backup team members, split the task, or trim non-essential requirements to rescue the target launch date.',
        };
    }

    // 3. TIER 3: Past Target Date (Isolated Overdue with non-negative float)
    if (isLate) {
        return {
            tier: 'overdue_isolated',
            level: 3,
            label: 'Past Target Date',
            sublabel: dependentCount > 0 ? `Blocks ${dependentCount} tasks` : 'Overdue',
            consequence: dependentCount > 0
                ? `Holding up ${dependentCount} downstream tasks.`
                : 'Missed target date, but no project delivery milestone is blocked.',
            badgeClass: 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-xs shadow-amber-500/10',
            icon: 'Clock',
            actionLabel: 'Reschedule deadline',
            actionPrompt: 'Align with the assignee on a realistic revised date to keep sprint metrics accurate.',
        };
    }

    // 4. TIER 2: HIGH VIGILANCE — Zero Leeway (On-track Critical Path)
    if (critFlag || (floatVal !== null && floatVal === 0)) {
        return {
            tier: 'vigilance',
            level: 2,
            label: 'Zero Leeway',
            sublabel: dependentCount > 0 ? `Blocks ${dependentCount} tasks` : 'Must stay on time',
            consequence: 'Must finish on time. Any delay directly postpones the project delivery date.',
            badgeClass: 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-xs shadow-amber-500/10',
            icon: 'Flame',
            actionLabel: 'Protect developer focus',
            actionPrompt: 'Shield the developer from interruptions, deprioritize side chores, and resolve reviews immediately.',
        };
    }

    // 5. TIER 1: Tight Leeway (1h - 8h buffer remaining)
    if (floatVal !== null && floatVal > 0 && floatVal <= 8) {
        return {
            tier: 'tight',
            level: 1,
            label: 'Tight Leeway',
            sublabel: `+${floatVal}h Buffer`,
            consequence: `Only ${floatVal}h of safe cushion remaining before project delivery date is at risk.`,
            badgeClass: 'bg-amber-50/70 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
            icon: 'Clock',
            actionLabel: 'Maintain steady pace',
            actionPrompt: 'Keep on pace during daily standups to avoid exhausting the remaining schedule buffer.',
        };
    }

    // 6. TIER 0: HEALTHY — Safe Buffer (Float > 8h)
    if (floatVal !== null && floatVal > 8) {
        return {
            tier: 'safe',
            level: 0,
            label: 'Safe Buffer',
            sublabel: `+${floatVal}h Leeway`,
            consequence: `Safe schedule cushion. Can slip up to ${floatVal}h without impacting project delivery.`,
            badgeClass: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
            icon: 'CheckCircle2',
            actionLabel: 'Safe to proceed / pair on blockers',
            actionPrompt: 'Safe to proceed at normal speed. Assignee can be temporarily paired onto Release Blockers without risk.',
        };
    }

    // 7. Unscheduled
    return {
        tier: 'unscheduled',
        level: -1,
        label: 'Unscheduled',
        sublabel: 'Needs timing',
        consequence: 'Add estimated hours and dependencies to map this task onto the project timeline.',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
        icon: 'Calendar',
        actionLabel: 'Add estimate & dependencies',
        actionPrompt: 'Enter estimated hours and predecessor dependencies so the Critical Path Engine can sequence this task.',
    };
}
