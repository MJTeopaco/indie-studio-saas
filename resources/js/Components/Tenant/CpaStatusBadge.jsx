import React from 'react';
import { AlertTriangle, CheckCircle2, Flame, Clock } from 'lucide-react';

/**
 * CpaStatusBadge — Renders a rich status indicator for Critical Path Analysis (CPA).
 *
 * Visual Treatments:
 * - Delayed (Negative Float): Rose/Red pulsing alert indicating deadline breach.
 * - Critical (Zero Float / Critical Path): Amber/Orange highlight for bottlenecks.
 * - On Track (Positive Float): Emerald/Green indicating available slack buffer.
 */
export default function CpaStatusBadge({ totalFloat, isCritical, showSlack = true, className = '' }) {
    if (totalFloat === null || totalFloat === undefined) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${className}`}
            >
                <Clock className="w-3.5 h-3.5" />
                Unscheduled
            </span>
        );
    }

    const floatVal = Number(totalFloat);

    if (floatVal < 0) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 animate-pulse shadow-sm shadow-rose-500/10 ${className}`}
            >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Delayed</span>
                {showSlack && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-500/30 text-[10px] font-mono">
                        {Math.abs(floatVal)}h Over
                    </span>
                )}
            </span>
        );
    }

    if (isCritical || floatVal === 0) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-sm shadow-amber-500/10 ${className}`}
            >
                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Critical Path</span>
                {showSlack && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-500/30 text-[10px] font-mono">
                        0h Slack
                    </span>
                )}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 ${className}`}
        >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>On Track</span>
            {showSlack && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded bg-emerald-200/50 dark:bg-emerald-500/20 text-[10px] font-mono">
                    +{floatVal}h Slack
                </span>
            )}
        </span>
    );
}
