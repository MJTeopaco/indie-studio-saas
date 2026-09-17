import React from 'react';
import {
    Sparkles,
    Flame,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Zap,
    User,
    Calendar,
    ChevronDown,
    ChevronUp,
    Info,
    X,
    ArrowRight,
    ShieldCheck,
    Layers,
} from 'lucide-react';

/**
 * Deterministic, jargon-free AI CPA reasoning engine.
 * Converts complex CPM math (ES, EF, LS, LF, float) into plain, intuitive English
 * that non-technical users and project managers can immediately understand.
 */
export function getEasyTaskAiReasoning(task) {
    if (!task) return null;

    const float = Number(task.total_float ?? 0);
    const hours = Number(task.estimated_hours ?? 0);
    const days = Math.round((hours / 8) * 10) / 10;
    const isCritical = Boolean(task.is_critical || float === 0);
    const assigneeName = task.assignee?.name || 'Unassigned team member';
    const floatDays = Math.round((Math.abs(float) / 8) * 10) / 10;

    // 1. DELAYED / RUNNING LATE
    if (float < 0) {
        const lateHours = Math.abs(float);
        return {
            status: 'delayed',
            badgeText: 'Behind Schedule',
            badgeSub: `${lateHours}h Late`,
            badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
            headline: `Needs Immediate Help — Delaying Project Delivery`,
            shortSummary: `This task is running ${lateHours}h behind schedule and is currently pushing back your overall project launch date.`,
            why: `Every hour this task stays delayed directly postpones your final project delivery. Downstream tasks are currently waiting for this work to be completed.`,
            bufferText: `Behind schedule by ${lateHours} hours (${floatDays} work days)`,
            impact: `Your project delivery date will slip unless action is taken right now.`,
            action: `Add an extra team member to help ${assigneeName}, or trim non-essential requirements to get back on track immediately.`,
        };
    }

    // 2. CRITICAL PATH (ZERO SLACK)
    if (isCritical) {
        return {
            status: 'critical',
            badgeText: 'Must-Do On Time',
            badgeSub: 'Zero Buffer',
            badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
            headline: `Direct Deadline Risk — Must finish on time`,
            shortSummary: `If this task is delayed by even 1 day, the entire project launch date will be delayed by 1 day.`,
            why: `This task connects directly to your final project delivery with zero breathing room. Other tasks are lined up waiting for it, so any delay here immediately pushes back the finish line.`,
            bufferText: `0 hours of buffer (Any delay directly hurts the deadline)`,
            impact: `Highest priority in your project. A delay here cannot be made up elsewhere without rushing.`,
            action: `Keep ${assigneeName} focused on this task. Protect them from side interruptions and resolve any blockers immediately.`,
        };
    }

    // 3. FLEXIBLE PATH (HAS POSITIVE BUFFER / SLACK)
    return {
        status: 'flexible',
        badgeText: 'Flexible Timing',
        badgeSub: `+${float}h Buffer`,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        headline: `Safe Buffer — Can be rescheduled if urgent work arises`,
        shortSummary: `You have ${float}h (${floatDays} days) of breathing room before this task affects the project deadline.`,
        why: `This task has safe cushion time built in. You can start it later, pause it, or work on it at a normal pace without risking your final project delivery date.`,
        bufferText: `+${float} hours of safe breathing room (${floatDays} work days)`,
        impact: `Safe buffer. If an emergency happens on a Must-Do task, this task can wait safely.`,
        action: `Work on Must-Do tasks first. If team members need emergency help on critical tasks, ${assigneeName} can pause this task temporarily without any risk.`,
    };
}

/**
 * Calculates high-level project timeline insights in plain English.
 */
export function getProjectTimelineSummary(tasks = [], project = null) {
    const scheduled = tasks.filter(t => t.es !== null && t.ef !== null);
    if (!scheduled.length) return null;

    const criticalTasks = scheduled.filter(t => t.is_critical || (t.total_float !== null && Number(t.total_float) === 0));
    const delayedTasks = scheduled.filter(t => t.total_float !== null && Number(t.total_float) < 0);
    const flexibleTasks = scheduled.filter(t => Number(t.total_float ?? 0) > 0);

    const totalCritHours = criticalTasks.reduce((sum, t) => sum + Number(t.estimated_hours ?? 0), 0);
    const totalCritDays = Math.round((totalCritHours / 8) * 10) / 10;

    const avgBufferHours = flexibleTasks.length
        ? Math.round(flexibleTasks.reduce((sum, t) => sum + Number(t.total_float ?? 0), 0) / flexibleTasks.length)
        : 0;
    const avgBufferDays = Math.round((avgBufferHours / 8) * 10) / 10;

    // Detect team bottleneck: person carrying the most critical path hours
    const devCritMap = {};
    criticalTasks.forEach(t => {
        const name = t.assignee?.name || 'Unassigned';
        if (!devCritMap[name]) devCritMap[name] = { name, count: 0, hours: 0 };
        devCritMap[name].count += 1;
        devCritMap[name].hours += Number(t.estimated_hours ?? 0);
    });

    const bottleneckDev = Object.values(devCritMap).sort((a, b) => b.hours - a.hours)[0] || null;

    // Determine overall health status
    let healthStatus = 'healthy';
    let healthTitle = 'Schedule is Healthy & On Track';
    let healthBadge = 'On Track';
    let healthBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';

    if (delayedTasks.length > 0) {
        healthStatus = 'delayed';
        healthTitle = 'Project Delivery Date At Risk';
        healthBadge = `${delayedTasks.length} Task${delayedTasks.length > 1 ? 's' : ''} Running Late`;
        healthBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse';
    } else if (criticalTasks.length > (scheduled.length * 0.6)) {
        healthStatus = 'tight';
        healthTitle = 'Tight Schedule — High Attention Needed';
        healthBadge = 'Tight Timeline';
        healthBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
    }

    return {
        totalScheduled: scheduled.length,
        criticalCount: criticalTasks.length,
        delayedCount: delayedTasks.length,
        flexibleCount: flexibleTasks.length,
        totalCritHours,
        totalCritDays,
        avgBufferHours,
        avgBufferDays,
        bottleneckDev,
        healthStatus,
        healthTitle,
        healthBadge,
        healthBadgeClass,
    };
}

/**
 * Executive AI CPA Schedule Synthesis Banner Card.
 * Designed with simple terms for non-technical users.
 */
export function CpaAiSummaryCard({ tasks = [], project = null, className = '' }) {
    const summary = getProjectTimelineSummary(tasks, project);
    if (!summary) return null;

    return (
        <div className={`rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/50 p-5 dark:border-indigo-900/50 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/30 shadow-xs space-y-4 ${className}`}>
            {/* Header with AI Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/50 pb-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Sparkles className="w-5 h-5 fill-white/80" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                AI Schedule Summary &amp; Timeline Insights
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                AI Synthesis
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Plain-English explanation of what tasks control your delivery date and where your team has breathing room.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${summary.healthBadgeClass}`}>
                        {summary.healthStatus === 'delayed' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {summary.healthBadge}
                    </span>
                </div>
            </div>

            {/* 3 Plain-English Insights Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Must-Do Tasks */}
                <div className="p-4 rounded-xl bg-white/95 dark:bg-slate-800/90 border border-amber-200/80 dark:border-amber-900/40 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                            <Flame className="w-4 h-4 text-amber-500" />
                            <span>Must-Do On Time</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            {summary.criticalCount} Tasks ({summary.totalCritHours}h)
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        These <strong className="text-slate-900 dark:text-slate-100">{summary.criticalCount} tasks</strong> directly control your project deadline. If any of them slips by even 1 day, your launch date slips by 1 day.
                    </p>
                    <div className="pt-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span>Give these tasks first priority every day.</span>
                    </div>
                </div>

                {/* 2. Flexible Tasks */}
                <div className="p-4 rounded-xl bg-white/95 dark:bg-slate-800/90 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span>Flexible Tasks</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                            {summary.flexibleCount} Tasks
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        These tasks have a safe cushion of <strong className="text-slate-900 dark:text-slate-100">+{summary.avgBufferHours}h</strong> (about {summary.avgBufferDays} days) of breathing room. You can delay or pause them without hurting the project deadline.
                    </p>
                    <div className="pt-1 text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span>Can be paused if urgent help is needed elsewhere.</span>
                    </div>
                </div>

                {/* 3. Team Focus & Bottleneck Warning */}
                <div className="p-4 rounded-xl bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Team Workload Focus</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Key Assignee
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {summary.bottleneckDev ? (
                            <>
                                <strong className="text-slate-900 dark:text-slate-100">{summary.bottleneckDev.name}</strong> has <strong className="text-amber-600 dark:text-amber-400">{summary.bottleneckDev.count} must-do tasks</strong> ({summary.bottleneckDev.hours}h).
                                Protecting their focus from side requests is the best way to keep the project on schedule.
                            </>
                        ) : (
                            'Must-do tasks are well distributed among team members with no single person overloaded.'
                        )}
                    </p>
                    <div className="pt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Clear blockers for key assignees first.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Task-level AI Explanation Modal.
 * Completely free of mathematical CPM jargon.
 */
export function CpaTaskAiModal({ task, isOpen, onClose }) {
    if (!isOpen || !task) return null;

    const reasoning = getEasyTaskAiReasoning(task);
    if (!reasoning) return null;

    const assigneeName = task.assignee?.name || 'Unassigned';
    const hours = Number(task.estimated_hours ?? 0);
    const days = Math.round((hours / 8) * 10) / 10;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3 pr-8">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        reasoning.status === 'delayed'
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                            : reasoning.status === 'critical'
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}>
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-slate-400">#{task.id}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${reasoning.badgeClass}`}>
                                {reasoning.status === 'delayed' ? (
                                    <AlertTriangle className="w-3 h-3" />
                                ) : reasoning.status === 'critical' ? (
                                    <Flame className="w-3 h-3" />
                                ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                )}
                                {reasoning.badgeText} ({reasoning.badgeSub})
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            {task.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Assigned to <strong className="text-slate-700 dark:text-slate-300">{assigneeName}</strong> • {hours}h ({days} work days)
                        </p>
                    </div>
                </div>

                {/* Headline Banner */}
                <div className={`p-3.5 rounded-xl border ${
                    reasoning.status === 'delayed'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                        : reasoning.status === 'critical'
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                }`}>
                    <p className="text-xs font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{reasoning.headline}</span>
                    </p>
                    <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                        {reasoning.shortSummary}
                    </p>
                </div>

                {/* Plain-English Breakdown */}
                <div className="space-y-3 text-xs">
                    {/* Why this status */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                            Why this task has this status
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {reasoning.why}
                        </p>
                    </div>

                    {/* Impact on Deadline */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                            Breathing Room / Schedule Buffer
                        </span>
                        <p className="text-slate-700 dark:text-slate-200 font-semibold">
                            {reasoning.bufferText}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {reasoning.impact}
                        </p>
                    </div>

                    {/* Recommended Action */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 space-y-1">
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 block text-[11px] uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            What You Should Do
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {reasoning.action}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Compact AI Reason Button with Sparkles for task rows in Gantt timelines or tables.
 */
export function CpaTaskAiButton({ task, onClick, className = '' }) {
    if (!task) return null;
    const reasoning = getEasyTaskAiReasoning(task);
    if (!reasoning) return null;

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick(task);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer ${
                reasoning.status === 'delayed'
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800'
                    : reasoning.status === 'critical'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800'
            } ${className}`}
            title="Click to view plain-English AI explanation for this task's schedule priority"
        >
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI Reason</span>
        </button>
    );
}
