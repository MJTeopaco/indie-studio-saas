import React from 'react';
import { 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    ExternalLink, 
    GitBranch, 
    ChevronRight,
    ArrowUpRight,
    Flame
} from 'lucide-react';

export default function MemberTaskCard({ task, currentUserId, onClick, onStatusChange }) {
    const isCritical = task.is_critical || task.priority?.toLowerCase() === 'critical' || task.sprint_priority === 'critical';
    const isHigh = task.priority?.toLowerCase() === 'high' || task.sprint_priority === 'high';

    const hasReviewer = Boolean(task.reviewer_user_id);
    const isReviewer = Boolean(
        task.is_reviewer || (currentUserId && Number(task.reviewer_user_id) === Number(currentUserId))
    );

    const getPriorityBadge = () => {
        if (isCritical) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    <Flame className="w-2.5 h-2.5" />
                    Critical
                </span>
            );
        }
        if (isHigh) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                    <ArrowUpRight className="w-2.5 h-2.5" />
                    High
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {task.priority || 'Normal'}
            </span>
        );
    };

    const getStatusIndicator = () => {
        const s = task.sprint_status || task.status;
        switch (s) {
            case 'in_progress':
                return (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="In Progress" />
                );
            case 'waiting_for_review':
            case 'review':
                return (
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="In Review" />
                );
            case 'done':
            case 'completed':
                return (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Done" />
                );
            case 'stuck':
                return (
                    <span className="w-2 h-2 rounded-full bg-rose-500" title="Blocked" />
                );
            default:
                return (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" title="Ready to Start" />
                );
        }
    };

    const renderDueDate = () => {
        if (!task.hard_constraint_date && task.days_until_deadline === null) {
            return null;
        }

        const days = task.days_until_deadline;
        let badgeClass = "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800";
        let text = task.hard_constraint_date;

        if (days !== null && days !== undefined) {
            if (days < 0) {
                badgeClass = "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 font-semibold";
                text = `${Math.abs(days)}d overdue`;
            } else if (days === 0) {
                badgeClass = "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 font-semibold";
                text = "Due today";
            } else if (days <= 2) {
                badgeClass = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";
                text = `Due in ${days}d`;
            } else {
                text = `Due in ${days}d`;
            }
        }

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${badgeClass}`}>
                <Clock className="w-3 h-3 shrink-0" />
                {text}
            </span>
        );
    };

    return (
        <div 
            onClick={() => onClick && onClick(task)}
            className="group relative bg-white dark:bg-slate-900/90 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 hover:border-brand/60 dark:hover:border-brand/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
            <div>
                {/* Top Row: Project / Epic & Priority */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {getStatusIndicator()}
                        {task.epic_name && (
                            <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[110px]"
                                style={{
                                    backgroundColor: task.epic_color ? `${task.epic_color}18` : 'rgba(99, 102, 241, 0.1)',
                                    color: task.epic_color || '#6366f1',
                                }}
                            >
                                {task.epic_name}
                            </span>
                        )}
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                            {task.project_name || 'Project'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {getPriorityBadge()}
                        {task.story_points !== null && task.story_points !== undefined && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {task.story_points} SP
                            </span>
                        )}
                    </div>
                </div>

                {/* Task Title */}
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light transition-colors line-clamp-2 mb-1.5">
                    {task.title}
                </h4>

                {/* Description Snippet */}
                {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                        {task.description}
                    </p>
                )}

                {/* Reviewer / Assignee badge if reviewer exists */}
                {task.reviewer && (
                    <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 px-1.5 py-0.5 rounded-md">
                            <span>Reviewer:</span>
                            <span className="font-semibold">{task.reviewer}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Meta & Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2">
                    {renderDueDate()}

                    {task.github_link && (
                        <a 
                            href={task.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
                            title="Open Branch / PR"
                        >
                            <GitBranch className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>

                {/* Quick Status Buttons with confirmation workflow */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
                    {/* 1. To Do -> Start (Cannot go back once started) */}
                    {(!task.sprint_status || task.sprint_status === 'ready_to_start' || task.status === 'todo') && (
                        <button
                            type="button"
                            onClick={() => onStatusChange && onStatusChange(task, 'in_progress', {
                                title: 'Start Task',
                                message: `Do you really want to start the task "${task.title}"? Once started, it cannot be changed back to To Do.`,
                                confirmLabel: 'Yes, Start Task',
                                confirmColor: 'brand',
                            })}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-10 text-brand dark:bg-brand-900/30 dark:text-brand-light hover:bg-brand hover:text-white dark:hover:bg-brand transition-all flex items-center gap-1 shadow-xs"
                            title="Start Working"
                        >
                            <span>Start</span>
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}

                    {/* 2. In Progress: Member can choose "Done" (routes to review or directly done) or "Stuck" */}
                    {task.sprint_status === 'in_progress' && (
                        <>
                            {hasReviewer ? (
                                <button
                                    type="button"
                                    onClick={() => onStatusChange && onStatusChange(task, 'waiting_for_review', {
                                        title: 'Submit for Review',
                                        message: `Do you really want to submit the task "${task.title}" for review? It will be sent to ${task.reviewer || 'the assigned reviewer'} for approval.`,
                                        confirmLabel: 'Yes, Submit for Review',
                                        confirmColor: 'brand',
                                    })}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all flex items-center gap-1 shadow-xs"
                                    title="Submit to reviewer"
                                >
                                    <span>Review</span>
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onStatusChange && onStatusChange(task, 'done', {
                                        title: 'Complete Task',
                                        message: `Do you really want to mark the task "${task.title}" as done?`,
                                        confirmLabel: 'Yes, Mark as Done',
                                        confirmColor: 'emerald',
                                    })}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all flex items-center gap-1 shadow-xs"
                                    title="Mark as Done"
                                >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Done</span>
                                </button>
                            )}

                            {/* Stuck / Blocked option */}
                            <button
                                type="button"
                                onClick={() => onStatusChange && onStatusChange(task, 'stuck', {
                                    title: 'Mark as Stuck',
                                    message: `Do you really want to mark the task "${task.title}" as stuck?`,
                                    confirmLabel: 'Yes, Mark as Stuck',
                                    confirmColor: 'rose',
                                })}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all flex items-center gap-1"
                                title="Mark as Blocked / Stuck"
                            >
                                <AlertCircle className="w-3 h-3" />
                                <span>Stuck</span>
                            </button>
                        </>
                    )}

                    {/* 3. Waiting for Review: Only the assigned reviewer (or manager) can mark done */}
                    {(task.sprint_status === 'waiting_for_review' || task.sprint_status === 'pending_deploy' || task.status === 'review') && (
                        isReviewer ? (
                            <button
                                type="button"
                                onClick={() => onStatusChange && onStatusChange(task, 'done', {
                                    title: 'Approve Task',
                                    message: `Do you really want to approve and mark the task "${task.title}" as done?`,
                                    confirmLabel: 'Yes, Approve and Mark Done',
                                    confirmColor: 'emerald',
                                })}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all flex items-center gap-1 shadow-xs"
                                title="Approve & Mark Done"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                            </button>
                        ) : (
                            <span 
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md"
                                title={`Awaiting approval by ${task.reviewer || 'reviewer'}`}
                            >
                                <span>In Review</span>
                            </span>
                        )
                    )}

                    {/* 4. Done */}
                    {(task.sprint_status === 'done' || task.status === 'completed') && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 px-1 py-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                        </span>
                    )}

                    {/* 5. Stuck -> Resume */}
                    {task.sprint_status === 'stuck' && (
                        <button
                            type="button"
                            onClick={() => onStatusChange && onStatusChange(task, 'in_progress', {
                                title: 'Resume Task',
                                message: `Do you really want to resume working on the task "${task.title}"?`,
                                confirmLabel: 'Yes, Resume Working',
                                confirmColor: 'brand',
                            })}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all flex items-center gap-1 shadow-xs"
                            title="Resume Task"
                        >
                            <AlertCircle className="w-3 h-3" />
                            <span>Resume</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
