import React from 'react';
import { AlertTriangle, CheckCircle2, Flame, Clock, Calendar } from 'lucide-react';
import { resolveCpaStatus } from '@/lib/cpaTerminology';

/**
 * CpaStatusBadge — Renders an alertness-focused status indicator for Critical Path Analysis (CPA).
 *
 * Tiers:
 * - Release Blocker (Tier 4 / Emergency): Rose pulsing alert for tasks pushing back launch.
 * - Past Target Date (Tier 3 / Local Slip): Amber alert for isolated overdue tasks.
 * - Zero Leeway (Tier 2 / High Vigilance): Gold alert for critical path tasks with no room for slip.
 * - Tight Leeway (Tier 1 / Warning): Amber-subtle alert for tasks with <= 8h buffer remaining.
 * - Safe Buffer (Tier 0 / Healthy): Emerald badge for flexible tasks with healthy buffer.
 * - Unscheduled: Slate badge for unestimated/unlinked tasks.
 */
export default function CpaStatusBadge({
    totalFloat,
    isCritical,
    dueDate = null,
    daysUntilDeadline = null,
    isOverdue = null,
    dependentCount = 0,
    status = 'todo',
    showSlack = true,
    showSublabel = null,
    showAction = false,
    className = '',
}) {
    const shouldShowSublabel = showSublabel !== null ? showSublabel : showSlack;

    const resolved = resolveCpaStatus({
        totalFloat,
        isCritical,
        dueDate,
        daysUntilDeadline,
        isOverdue,
        dependentCount,
        status,
    });

    const renderIcon = () => {
        const iconProps = { className: 'w-3.5 h-3.5 shrink-0' };
        switch (resolved.icon) {
            case 'AlertTriangle':
                return <AlertTriangle {...iconProps} className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />;
            case 'Flame':
                return <Flame {...iconProps} className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />;
            case 'Clock':
                return <Clock {...iconProps} className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />;
            case 'Calendar':
                return <Calendar {...iconProps} className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />;
            case 'CheckCircle2':
            default:
                return <CheckCircle2 {...iconProps} className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
        }
    };

    return (
        <span
            title={`${resolved.label}: ${resolved.consequence}${resolved.actionPrompt ? `\n\n👉 Recommended Next Action: ${resolved.actionPrompt}` : ''}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-help transition-all ${resolved.badgeClass} ${className}`}
        >
            {renderIcon()}
            <span>{resolved.label}</span>
            {shouldShowSublabel && resolved.sublabel && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-sm bg-black/5 dark:bg-white/10 text-[10px] font-mono font-medium">
                    {resolved.sublabel}
                </span>
            )}
            {showAction && resolved.actionLabel && (
                <span className="ml-1 pl-1.5 border-l border-current/25 text-[10px] font-medium opacity-90 hidden sm:inline">
                    {resolved.actionLabel}
                </span>
            )}
        </span>
    );
}

