import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Clock,
    GitBranch,
    Layers,
    FolderGit2,
    Target,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Play,
    CheckCheck,
    AlertTriangle,
    Eye,
    UserCheck,
    ArrowRight,
    ExternalLink,
} from 'lucide-react';
import axios from 'axios';

/**
 * Status chip — compact colored badge.
 */
function StatusChip({ status }) {
    const map = {
        todo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
        review: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
        completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
        stuck: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    };
    const label = {
        todo: 'To Do',
        in_progress: 'In Progress',
        review: 'In Review',
        completed: 'Done',
        stuck: 'Blocked',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${map[status] ?? map.todo}`}>
            {label[status] ?? status}
        </span>
    );
}

/**
 * Confirmation dialog overlay.
 */
function ConfirmDialog({ isOpen, title, message, confirmLabel, confirmColor = 'brand', onConfirm, onCancel, children }) {
    if (!isOpen) return null;
    const colorMap = {
        brand: 'bg-brand hover:bg-brand-dark text-white',
        rose: 'bg-rose-600 hover:bg-rose-700 text-white',
        amber: 'bg-amber-500 hover:bg-amber-600 text-white',
        emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-100">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
                {children}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${colorMap[confirmColor]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MemberTaskDetailModal({ isOpen, onClose, task, tenantId, currentUserId, onTaskUpdated }) {
    if (!isOpen || !task) return null;

    const [actualSp, setActualSp] = useState(task.actual_story_points ?? '');
    const [githubLink, setGithubLink] = useState(task.github_link || '');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Confirmation dialog state
    const [confirm, setConfirm] = useState(null); // { action, label, color, message }

    useEffect(() => {
        if (task) {
            setActualSp(task.actual_story_points ?? '');
            setGithubLink(task.github_link || '');
            setErrorMsg(null);
            setConfirm(null);
        }
    }, [task]);

    const currentStatus = task.status || 'todo';
    const hasReviewer = !!task.reviewer_user_id;
    const isDoer = currentUserId && (
        Number(task.assigned_user_id) === Number(currentUserId)
    );
    const isReviewer = currentUserId && Number(task.reviewer_user_id) === Number(currentUserId);

    const doStatusUpdate = async (newStatus, extraPayload = {}) => {
        setIsSaving(true);
        setErrorMsg(null);
        setConfirm(null);

        const payload = {
            status: newStatus,
            github_link: githubLink.trim() || null,
            ...extraPayload,
        };

        if (newStatus === 'completed' && actualSp !== '') {
            payload.actual_story_points = parseInt(actualSp, 10);
        }

        try {
            const url = route('tenant.tasks.update-status', {
                tenant: tenantId,
                task: task.id,
            });

            await axios.patch(url, payload, {
                headers: { 'Accept': 'application/json' },
            });

            if (onTaskUpdated) {
                onTaskUpdated({
                    ...task,
                    status: newStatus,
                    sprint_status: {
                        todo: 'ready_to_start',
                        in_progress: 'in_progress',
                        review: 'waiting_for_review',
                        completed: 'done',
                        stuck: 'stuck',
                    }[newStatus] ?? task.sprint_status,
                    actual_story_points: payload.actual_story_points ?? task.actual_story_points,
                    github_link: payload.github_link,
                });
            }

            onClose();
        } catch (err) {
            console.error('Failed to update task', err);
            const msg = err.response?.data?.message || 'Could not update task. Please try again.';
            setErrorMsg(msg);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Action buttons depending on current status and role ──────────────────

    const renderActionButtons = () => {
        const btnBase = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm';

        if (currentStatus === 'todo') {
            if (!isDoer) return <p className="text-xs text-slate-400 text-center py-2">You are not the assigned doer for this task.</p>;
            return (
                <button
                    type="button"
                    onClick={() => setConfirm({ action: 'in_progress', label: 'Start Task', color: 'brand', message: `Do you really want to start the task "${task.title}"? Once started, it cannot be changed back to To Do.` })}
                    className={`${btnBase} bg-brand text-white hover:bg-brand-dark`}
                >
                    <Play className="w-3.5 h-3.5" /> Start Task
                </button>
            );
        }

        if (currentStatus === 'in_progress') {
            if (!isDoer) return <p className="text-xs text-slate-400 text-center py-2">Only the assigned doer can update this task's status.</p>;
            return (
                <div className="flex flex-col gap-2">
                    {hasReviewer ? (
                        <button
                            type="button"
                            onClick={() => setConfirm({ action: 'review', label: 'Submit for Review', color: 'brand', message: `Do you really want to submit the task "${task.title}" for review? It will be sent to ${task.reviewer || 'the assigned reviewer'} for approval.` })}
                            className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}
                        >
                            <Eye className="w-3.5 h-3.5" /> Submit for Review
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirm({ action: 'completed', label: 'Mark as Done', color: 'emerald', message: `Do you really want to mark the task "${task.title}" as done?` })}
                            className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                            <CheckCheck className="w-3.5 h-3.5" /> Mark as Done
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setConfirm({ action: 'stuck', label: 'Mark as Stuck', color: 'rose', message: `Do you really want to mark the task "${task.title}" as stuck?` })}
                        className={`${btnBase} bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" /> Mark as Blocked
                    </button>
                </div>
            );
        }

        if (currentStatus === 'review') {
            if (isReviewer) {
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                            <UserCheck className="w-4 h-4 shrink-0" />
                            <span>You are the assigned reviewer. Review the work and mark it done or send it back.</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setConfirm({ action: 'completed', label: 'Approve & Mark Done', color: 'emerald', message: `Do you really want to approve and mark the task "${task.title}" as done?` })}
                            className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                            <CheckCheck className="w-3.5 h-3.5" /> Approve &amp; Mark Done
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirm({ action: 'in_progress', label: 'Send Back to Doer', color: 'amber', message: `Do you really want to send the task "${task.title}" back for revision?` })}
                            className={`${btnBase} bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950`}
                        >
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Send Back for Revision
                        </button>
                    </div>
                );
            }
            return (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>
                        Waiting for <strong>{task.reviewer || 'reviewer'}</strong> to approve.
                        Only the reviewer can mark this done.
                    </span>
                </div>
            );
        }

        if (currentStatus === 'completed') {
            return (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>This task is completed. 🎉</span>
                </div>
            );
        }

        if (currentStatus === 'stuck') {
            if (!isDoer) return <p className="text-xs text-slate-400 text-center py-2">Contact your team leader to unblock this task.</p>;
            return (
                <button
                    type="button"
                    onClick={() => setConfirm({ action: 'in_progress', label: 'Resume Task', color: 'brand', message: `Do you really want to resume working on the task "${task.title}"?` })}
                    className={`${btnBase} bg-brand text-white hover:bg-brand-dark`}
                >
                    <Play className="w-3.5 h-3.5" /> Resume Task
                </button>
            );
        }

        return null;
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="space-y-1.5 pr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                                    #{task.id}
                                </span>
                                {task.project_name && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <FolderGit2 className="w-3 h-3" />
                                        {task.project_name}
                                    </span>
                                )}
                                {task.epic_name && (
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                                        style={{
                                            backgroundColor: task.epic_color ? `${task.epic_color}20` : 'rgba(99, 102, 241, 0.15)',
                                            color: task.epic_color || '#6366f1',
                                        }}
                                    >
                                        <Layers className="w-3 h-3" />
                                        {task.epic_name}
                                    </span>
                                )}
                                {task.sprint_name && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">
                                        <Target className="w-3 h-3" />
                                        {task.sprint_name}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                {task.title}
                            </h3>

                            <div className="flex items-center gap-2 flex-wrap">
                                <StatusChip status={currentStatus} />
                                {hasReviewer && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                        <UserCheck className="w-3 h-3" />
                                        Reviewer: {task.reviewer || `User #${task.reviewer_user_id}`}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                        {errorMsg && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                                Description
                            </label>
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                                {task.description || <span className="italic text-slate-400">No description provided.</span>}
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800">
                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Priority</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{task.priority || 'Normal'}</span>
                            </div>
                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Story Points</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">
                                    {task.story_points !== null && task.story_points !== undefined ? `${task.story_points} SP` : 'Not estimated'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Est. Hours</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">
                                    {task.estimated_hours ? `${task.estimated_hours}h` : '—'}
                                </span>
                            </div>
                            {task.assignee && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Doer</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{task.assignee}</span>
                                </div>
                            )}
                            {task.reviewer && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Reviewer</span>
                                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-0.5 inline-block">{task.reviewer}</span>
                                </div>
                            )}
                            {task.hard_constraint_date && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Deadline</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 inline-block">{task.hard_constraint_date}</span>
                                </div>
                            )}
                        </div>

                        {/* GitHub Link */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                                GitHub Branch / PR URL
                            </label>
                            <div className="relative flex items-center">
                                <GitBranch className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                                <input
                                    type="url"
                                    value={githubLink}
                                    onChange={(e) => setGithubLink(e.target.value)}
                                    placeholder="https://github.com/organization/repo/pull/123"
                                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand transition-all"
                                />
                                {githubLink && (
                                    <a
                                        href={githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute right-3 text-slate-400 hover:text-brand"
                                        title="Open Link"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Actual SP (shown when completing) */}
                        {(currentStatus === 'in_progress' || currentStatus === 'review') && (
                            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                                <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    Actual Story Points (optional)
                                </label>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                    Record actual SP for velocity tracking when completing.
                                </p>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={actualSp}
                                    onChange={(e) => setActualSp(e.target.value)}
                                    placeholder={`Estimated: ${task.story_points ?? '0'} SP`}
                                    className="w-full sm:w-48 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <p className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 mb-3 tracking-wider">
                                Task Actions
                            </p>
                            {isSaving ? (
                                <div className="flex items-center justify-center gap-2 py-3 text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs">Saving…</span>
                                </div>
                            ) : (
                                renderActionButtons()
                            )}
                        </div>

                        {/* Close */}
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation overlay */}
            <ConfirmDialog
                isOpen={!!confirm}
                title={confirm?.label ?? ''}
                message={confirm?.message ?? ''}
                confirmLabel={confirm?.label ?? 'Confirm'}
                confirmColor={confirm?.color ?? 'brand'}
                onConfirm={() => doStatusUpdate(confirm.action)}
                onCancel={() => setConfirm(null)}
            />
        </>
    );
}
