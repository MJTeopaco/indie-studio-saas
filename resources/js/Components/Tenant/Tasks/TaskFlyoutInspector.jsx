import React, { useState, useEffect } from 'react';
import {
    X,
    CheckCircle2,
    Clock,
    Flame,
    Cpu,
    Check,
    Loader2
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

const SPRINT_STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Under Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'stuck', label: 'Blocked / Stuck' },
];

export default function TaskFlyoutInspector({
    isOpen,
    task,
    onClose,
    onUpdateStatus,
    canManage = false,
    currentUserId = null,
}) {
    const [selectedStatus, setSelectedStatus] = useState(task?.status || 'todo');
    const [statusNote, setStatusNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (task) {
            setSelectedStatus(task.status || task.sprint_status || 'todo');
            setStatusNote('');
        }
    }, [task]);

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !task) return null;

    const isCritical = Boolean(
        task.is_critical || (task.total_float !== null && task.total_float !== undefined && Number(task.total_float) <= 0)
    );

    const totalFloat = task.total_float !== null && task.total_float !== undefined ? Number(task.total_float) : null;
    const es = task.es !== null && task.es !== undefined ? Number(task.es) : null;
    const ef = task.ef !== null && task.ef !== undefined ? Number(task.ef) : null;
    const ls = task.ls !== null && task.ls !== undefined ? Number(task.ls) : null;
    const lf = task.lf !== null && task.lf !== undefined ? Number(task.lf) : null;

    const handleConfirmStatus = async () => {
        if (!onUpdateStatus) {
            showToast(`Status updated to ${selectedStatus}`, 'success');
            onClose();
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdateStatus(task, selectedStatus, statusNote);
            setIsSubmitting(false);
            onClose();
        } catch (err) {
            setIsSubmitting(false);
            showToast(err.message || 'Failed to update task status.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="flyout-title" role="dialog" aria-modal="true">
            {/* Backdrop Scrim */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-xl bg-surface-elevated border-l border-surface-border shadow-2xl flex flex-col h-full transform transition-all ease-in-out duration-200">
                    
                    {/* ── Top Bar / Header ── */}
                    <div className="p-5 border-b border-surface-border flex items-center justify-between gap-4 bg-surface/50 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-surface border border-surface-border text-text-muted shrink-0">
                                #{task.id}
                            </span>
                            {task.task_classification && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand/10 text-brand dark:text-brand-light border border-brand/20 truncate">
                                    {task.task_classification}
                                </span>
                            )}
                            {task.story_points !== null && task.story_points !== undefined && (
                                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                                    {task.story_points} SP
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-text-muted hidden sm:inline font-mono">ESC to close</span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-surface-border transition-colors cursor-pointer"
                                aria-label="Close flyout inspector"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* ── Scrollable Inspector Body ── */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                        {/* Title & Description */}
                        <div className="space-y-2">
                            <h2 id="flyout-title" className="font-heading text-xl font-bold text-text-primary leading-snug">
                                {task.title}
                            </h2>
                            {task.description ? (
                                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                                    {task.description}
                                </p>
                            ) : (
                                <p className="text-xs text-text-muted italic">No detailed specification provided.</p>
                            )}
                        </div>

                        {/* ── Critical Path Awareness Banner ── */}
                        {isCritical ? (
                            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-1.5 animate-in fade-in-50 duration-200">
                                <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
                                    <Flame className="w-4 h-4 shrink-0 animate-pulse" />
                                    <span className="font-heading text-xs font-bold uppercase tracking-wider">
                                        Zero-Float Critical Path Task
                                    </span>
                                </div>
                                <p className="text-xs text-rose-300/90 leading-relaxed pl-6">
                                    Total float is <strong>0 hours</strong>. Any delay on this task will directly push back the milestone delivery date.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-surface-border bg-surface/60 p-3.5 flex items-center justify-between text-xs text-text-muted">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Task has buffer float</span>
                                </div>
                                {totalFloat !== null && (
                                    <span className="font-mono font-bold text-text-primary px-2 py-0.5 rounded bg-surface border border-surface-border">
                                        +{totalFloat}h float
                                    </span>
                                )}
                            </div>
                        )}

                        {/* ── CPM / PERT Schedule Matrix ── */}
                        <div className="rounded-2xl border border-surface-border bg-surface/40 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-brand" />
                                    <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text-primary">
                                        CPM / PERT Schedule Matrix
                                    </h3>
                                </div>
                                <span className="text-[10px] text-text-muted font-mono">Deterministic Engine</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                                <div className="p-3 rounded-xl bg-surface border border-surface-border/80">
                                    <span className="block text-[10px] uppercase font-bold text-text-muted tracking-wider">Early Start (ES)</span>
                                    <span className="font-mono text-sm font-bold text-text-primary mt-0.5 block">
                                        {es !== null ? `${es}h` : '—'}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-surface border border-surface-border/80">
                                    <span className="block text-[10px] uppercase font-bold text-text-muted tracking-wider">Early Finish (EF)</span>
                                    <span className="font-mono text-sm font-bold text-text-primary mt-0.5 block">
                                        {ef !== null ? `${ef}h` : '—'}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-surface border border-surface-border/80">
                                    <span className="block text-[10px] uppercase font-bold text-text-muted tracking-wider">Late Start (LS)</span>
                                    <span className="font-mono text-sm font-bold text-text-primary mt-0.5 block">
                                        {ls !== null ? `${ls}h` : '—'}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-surface border border-surface-border/80">
                                    <span className="block text-[10px] uppercase font-bold text-text-muted tracking-wider">Total Float (TF)</span>
                                    <span className={`font-mono text-sm font-bold mt-0.5 block ${isCritical ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {totalFloat !== null ? `${totalFloat}h` : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── Personnel & Workload ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-xl border border-surface-border bg-surface/40 space-y-2">
                                <span className="font-heading font-semibold text-text-muted uppercase tracking-wider text-[10px] block">
                                    Assignee & Reviewer
                                </span>
                                <div className="flex items-center gap-2 text-text-primary">
                                    <div className="w-6 h-6 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {(task.assignee?.name || task.assignee || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{task.assignee?.name || task.assignee || 'Unassigned'}</p>
                                        <p className="text-[10px] text-text-muted">
                                            {task.reviewer ? `Reviewer: ${task.reviewer?.name || task.reviewer}` : 'No peer reviewer'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-surface-border bg-surface/40 space-y-2">
                                <span className="font-heading font-semibold text-text-muted uppercase tracking-wider text-[10px] block">
                                    Workload & Priority
                                </span>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Estimated Hours:</span>
                                        <span className="font-mono font-bold text-text-primary">{task.estimated_hours || 0}h</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Difficulty:</span>
                                        <span className="font-medium text-text-primary">{task.task_difficulty || 'Medium'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Priority:</span>
                                        <span className="font-medium text-text-primary">{task.priority || 'Medium'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Status Transition & Confirmation Box ── */}
                        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 sm:p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                                    <Check className="w-4 h-4 text-brand" />
                                    <span>Advance Task Status</span>
                                </h3>
                                <span className="text-[10px] text-text-muted font-mono">Confirmation</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-text-muted mb-1.5">
                                        Select Target State
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {SPRINT_STATUS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setSelectedStatus(opt.value)}
                                                className={`p-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                                                    selectedStatus === opt.value
                                                        ? 'bg-brand text-white border-brand shadow-xs'
                                                        : 'bg-surface border-surface-border text-text-muted hover:text-text-primary hover:border-surface-border/80'
                                                }`}
                                            >
                                                <span>{opt.label}</span>
                                                {selectedStatus === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-text-muted mb-1.5">
                                        Transition Note / Review Context (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={statusNote}
                                        onChange={(e) => setStatusNote(e.target.value)}
                                        placeholder="e.g., Pull request merged, tests passing"
                                        className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── Footer Actions ── */}
                    <div className="p-4 sm:p-5 border-t border-surface-border bg-surface/70 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl border border-surface-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmStatus}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold transition-all shadow-sm shadow-brand/20 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Confirm Status Change</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
