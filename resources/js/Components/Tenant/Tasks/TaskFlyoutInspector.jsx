import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Flame,
    Check,
    Loader2,
    MessageSquare,
    Clock,
    AlertTriangle,
    ShieldAlert,
    ChevronDown,
    SlidersHorizontal,
    User,
    Users,
    Tag,
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import FlagComplexityModal from './FlagComplexityModal';
import { resolveCpaStatus } from '@/lib/cpaTerminology';
import {
    STATUS_CONFIG,
    WORKFLOW_STATUS_KEYS,
    normalizeStatusKey,
    formatRelativeDueDate,
} from '@/lib/taskStatusConfig';

const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
];

export default function TaskFlyoutInspector({
    isOpen,
    task,
    onClose,
    onUpdateStatus,
    updateTask,
    canManage = false,
    currentUserId = null,
    teamMembers = [],
    tenantId = null,
    onTaskUpdated = null,
}) {
    const { activeWorkspace } = usePage().props;
    const resolvedTenantId = tenantId || activeWorkspace;

    const [activeTab, setActiveTab] = useState('details');
    const [currentTask, setCurrentTask] = useState(task);
    const [selectedStatus, setSelectedStatus] = useState('todo');
    const [selectedPriority, setSelectedPriority] = useState('Medium');
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [storyPoints, setStoryPoints] = useState('');
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
    const [isResolvingFlag, setIsResolvingFlag] = useState(false);

    const sheetRef = useRef(null);
    const closeBtnRef = useRef(null);
    const previousActiveElementRef = useRef(null);

    // Sync state from task prop
    useEffect(() => {
        if (task) {
            setCurrentTask(task);
            const normalized = normalizeStatusKey(task.status, task.sprint_status);
            setSelectedStatus(normalized);
            setSelectedPriority(task.priority || 'Medium');
            setSelectedAssignee(
                typeof task.assignee === 'string'
                    ? task.assignee
                    : (task.assignee?.name || task.assigned_user_id || '')
            );
            setStoryPoints(task.story_points ?? '');
            setCommentText('');
            setComments(
                task.comments || [
                    { id: 1, user: 'System', text: 'Task scheduled in sprint roadmap', time: '1d ago' },
                    { id: 2, user: task.assignee?.name || 'Assignee', text: 'Preliminary investigation completed', time: '4h ago' },
                ]
            );
        }
    }, [task]);

    // Keyboard management: Escape key and Focus restoration
    useEffect(() => {
        if (!isOpen) return;

        previousActiveElementRef.current = document.activeElement;

        const handleKeyDown = (e) => {
            if (isFlagModalOpen) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose?.();
                return;
            }

            // Tab trap
            if (e.key === 'Tab' && sheetRef.current) {
                const focusable = sheetRef.current.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Auto-focus close button on mount
        const timer = setTimeout(() => {
            closeBtnRef.current?.focus();
        }, 50);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timer);
            if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
                previousActiveElementRef.current.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen || !task) return null;

    const activeTask = currentTask || task;
    const taskKey = activeTask.task_key || `TASK-${String(activeTask.id).padStart(3, '0')}`;
    const projectName = activeTask.project_name || activeTask.project?.name || 'StudioSprint Core';
    const isCompleted = selectedStatus === 'completed';

    const isCritical = Boolean(
        activeTask.is_critical || (activeTask.total_float !== null && activeTask.total_float !== undefined && Number(activeTask.total_float) <= 0)
    );
    const totalFloat = activeTask.total_float !== null && activeTask.total_float !== undefined ? Number(activeTask.total_float) : null;
    const rawDueDate = activeTask.hard_constraint_date || activeTask.due_date || activeTask.dueDate;
    const dueInfo = formatRelativeDueDate(rawDueDate);

    // Permission and role checks
    const hasReviewer = Boolean(activeTask?.reviewer_user_id || activeTask?.reviewer);
    const isReviewer = Boolean(
        currentUserId && activeTask?.reviewer_user_id && Number(activeTask.reviewer_user_id) === Number(currentUserId)
    );
    const isDoer = Boolean(
        currentUserId && (
            (activeTask?.assigned_user_id && Number(activeTask.assigned_user_id) === Number(currentUserId)) ||
            (activeTask?.assignee?.id && Number(activeTask.assignee.id) === Number(currentUserId))
        )
    );
    const canFlagComplexity = canManage || isDoer;
    const canMarkDone = Boolean(canManage || isReviewer || (!hasReviewer && isDoer));
    const reviewerDisplayName = typeof activeTask?.reviewer === 'string'
        ? activeTask.reviewer
        : (activeTask?.reviewer?.name || 'the assigned reviewer');

    const cpaInfo = resolveCpaStatus({
        totalFloat,
        isCritical: activeTask.is_critical,
        dueDate: rawDueDate,
        daysUntilDeadline: activeTask.days_until_deadline,
        dependentCount: activeTask.dependent_tasks_count || activeTask.downstream_count || 0,
        status: selectedStatus,
    });

    const isCantSlip = isCritical || cpaInfo.tier === 'vigilance' || (totalFloat !== null && totalFloat <= 0);

    const handleResolveComplexity = async (action, spValue = null) => {
        if (!resolvedTenantId || !activeTask?.id) return;
        setIsResolvingFlag(true);
        try {
            const url = route('tenant.tasks.resolve-complexity', {
                tenant: resolvedTenantId,
                task: activeTask.id,
            });
            const payload = { action };
            if (spValue !== null && spValue !== undefined) {
                payload.story_points = Number(spValue);
            }
            const res = await axios.post(url, payload);
            showToast(res.data?.message || 'Complexity resolution saved.', 'success');
            const updated = res.data?.task || {
                ...activeTask,
                needs_estimate_review: false,
                suggested_story_points: null,
                story_points: action === 'accept' && spValue ? Number(spValue) : activeTask.story_points,
            };
            setCurrentTask(updated);
            if (action === 'accept' && spValue) {
                setStoryPoints(spValue);
            }
            if (typeof onTaskUpdated === 'function') {
                onTaskUpdated(updated);
            } else if (typeof updateTask === 'function') {
                updateTask(updated.id, {
                    needs_estimate_review: false,
                    suggested_story_points: null,
                    ...(action === 'accept' && spValue ? { story_points: Number(spValue) } : {}),
                });
            }
        } catch (err) {
            console.error('Failed to resolve complexity flag', err);
            const msg = err.response?.data?.message || 'Could not resolve complexity flag.';
            showToast(msg, 'error');
        } finally {
            setIsResolvingFlag(false);
        }
    };

    // Handle field updates
    const handleFieldChange = async (field, value) => {
        if ((field === 'status' || field === 'sprint_status') && (value === 'completed' || value === 'done')) {
            if (!canMarkDone) {
                showToast(`Only ${reviewerDisplayName} or a manager can mark this task as done.`, 'warning');
                return;
            }
        }

        const patch = { [field]: value };
        if (field === 'status' || field === 'sprint_status') {
            setSelectedStatus(value);
        } else if (field === 'priority') {
            setSelectedPriority(value);
        } else if (field === 'story_points') {
            setStoryPoints(value);
        } else if (field === 'assignee' || field === 'assigned_user_id') {
            setSelectedAssignee(value);
        }

        try {
            if (typeof updateTask === 'function') {
                await updateTask(activeTask.id, patch);
            } else if (typeof onUpdateStatus === 'function' && (field === 'status' || field === 'sprint_status')) {
                await onUpdateStatus(activeTask, value);
            }
        } catch (err) {
            console.error('Failed to update task property', err);
            showToast('Failed to update task property', 'error');
        }
    };

    const handleMarkComplete = async () => {
        if (isCompleted) return;
        if (!canMarkDone) {
            showToast(`Only ${reviewerDisplayName} or a manager can mark this task as done.`, 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            setSelectedStatus('completed');
            if (typeof updateTask === 'function') {
                await updateTask(activeTask.id, { status: 'completed', sprint_status: 'done' });
            } else if (typeof onUpdateStatus === 'function') {
                await onUpdateStatus(activeTask, 'completed', 'Marked complete via inspector');
            }
            showToast('Task marked as complete', 'success');
        } catch (err) {
            showToast('Failed to mark task complete', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddComment = (e) => {
        e?.preventDefault();
        const trimmed = commentText.trim();
        if (!trimmed) return;
        const newEntry = {
            id: Date.now(),
            user: 'You',
            text: trimmed,
            time: 'Just now',
        };
        setComments((prev) => [...prev, newEntry]);
        setCommentText('');
        showToast('Comment added', 'success');
    };

    // Acceptance criteria parsing
    const rawCriteria = task.acceptance_criteria || [
        'Deterministic CPM start & finish conditions met',
        'Story point estimation reviewed with engineering team',
        'Branch pull request submitted with zero regressions',
    ];
    const acceptanceItems = Array.isArray(rawCriteria)
        ? rawCriteria
        : String(rawCriteria).split('\n').filter(Boolean);

    const activeStatusObj = STATUS_CONFIG[selectedStatus] || STATUS_CONFIG.todo;

    // Render portal into document body
    return (
        <>
            {createPortal(
                <div
            className="fixed inset-0 z-[60] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-details-title"
        >
            {/* Backdrop Scrim: existing overlay style, no blur */}
            <div
                className="fixed inset-0 bg-slate-950/50 dark:bg-black/70 animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Right-anchored Drawer Sheet */}
            <div
                ref={sheetRef}
                className="fixed inset-y-0 right-0 z-[70] flex flex-col h-[100dvh] max-h-[100dvh] w-full md:w-[clamp(32rem,40vw,45rem)] max-w-full bg-[var(--elevated)] border-l border-[var(--border)] shadow-2xl animate-in slide-in-from-right duration-300 ease-out select-none"
            >
                {/* ── STICKY HEADER ──────────────────────────────────────────────── */}
                <div className="shrink-0 sticky top-0 z-10 bg-[var(--elevated)] border-b border-[var(--border)]">
                    {/* Topline: Project & Task ID, Close Button */}
                    <div className="px-6 pt-5 pb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="type-caption font-mono font-bold text-[var(--foreground)] shrink-0">
                                {taskKey}
                            </span>
                            <span className="text-[var(--border)]">•</span>
                            <span className="type-caption text-[var(--muted-foreground)] truncate">
                                {projectName}
                            </span>
                        </div>

                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={onClose}
                            title="ESC to close"
                            aria-label="Close task details (ESC)"
                            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-colors cursor-pointer focus-ring"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Task Title (Wraps to 3 lines) */}
                    <div className="px-6 pt-1 pb-3">
                        <h2
                            id="task-details-title"
                            className="type-section-title font-bold text-[var(--foreground)] line-clamp-3 leading-snug select-text"
                        >
                            {activeTask.title}
                        </h2>
                    </div>

                    {/* Status & Urgency Row (Beneath Title) */}
                    <div className="px-6 pb-4 flex items-center gap-2 flex-wrap">
                        {/* Status Pill */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${activeStatusObj.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${activeStatusObj.dot}`} />
                            <span>{activeStatusObj.label}</span>
                        </span>

                        {/* Due Date Urgency Badge */}
                        {rawDueDate && (
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                    dueInfo.isOverdue
                                        ? 'bg-rose-50 text-rose-700 border-rose-300/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/70 font-semibold'
                                        : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)]'
                                }`}
                            >
                                <Clock className={`w-3.5 h-3.5 ${dueInfo.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--muted-foreground)]'}`} />
                                <span>{dueInfo.text}</span>
                            </span>
                        )}

                        {/* Priority Pill */}
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)]">
                            {selectedPriority} Priority
                        </span>

                        {/* Can't Slip Flag (Zero Leeway) */}
                        {isCantSlip && !isCompleted && (
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/70"
                                title="Zero schedule leeway — any delay directly postpones project delivery."
                            >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                <span>Can't slip</span>
                            </span>
                        )}
                    </div>

                    {/* Tabs (Details & Activity) */}
                    <div
                        className="px-6 flex items-center gap-6 border-t border-[var(--border)]/60 bg-[var(--elevated)]"
                        role="tablist"
                    >
                        <button
                            type="button"
                            role="tab"
                            id="tab-details"
                            aria-selected={activeTab === 'details'}
                            aria-controls="panel-details"
                            onClick={() => setActiveTab('details')}
                            className={`h-10 text-xs font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'details'
                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Details</span>
                        </button>

                        <button
                            type="button"
                            role="tab"
                            id="tab-activity"
                            aria-selected={activeTab === 'activity'}
                            aria-controls="panel-activity"
                            onClick={() => setActiveTab('activity')}
                            className={`h-10 text-xs font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'activity'
                                    ? 'border-[var(--primary)] text-[var(--primary)]'
                                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Activity</span>
                            <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]">
                                {comments.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {activeTab === 'details' ? (
                        <div id="panel-details" role="tabpanel" aria-labelledby="tab-details" className="space-y-6">
                            {/* Group 1: Properties */}
                            <section aria-labelledby="heading-properties" className="space-y-4">
                                <h3 id="heading-properties" className="type-section-title font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
                                    <span>Task Properties</span>
                                </h3>

                                <div className="space-y-3">
                                    {/* Assignee */}
                                    <div className="flex items-center justify-between gap-4">
                                        <label htmlFor="prop-assignee" className="type-subheading text-[var(--muted-foreground)] shrink-0">
                                            Assignee
                                        </label>
                                        <div className="relative min-w-48 max-w-64">
                                            <select
                                                id="prop-assignee"
                                                value={selectedAssignee}
                                                onChange={(e) => handleFieldChange('assignee', e.target.value)}
                                                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 pr-8 text-xs font-bold text-[var(--foreground)] focus-ring appearance-none cursor-pointer"
                                            >
                                                <option value="">Unassigned</option>
                                                {selectedAssignee && !teamMembers.some((m) => m.name === selectedAssignee) && (
                                                    <option value={selectedAssignee}>{selectedAssignee}</option>
                                                )}
                                                {teamMembers.map((m) => (
                                                    <option key={m.id || m.name} value={m.name || m.id}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute right-2.5 top-3 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Co-Contributors & Handover Attribution */}
                                    {task?.co_contributors && task.co_contributors.length > 0 && (
                                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                                            <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-amber-500" />
                                                    Co-Contributors & Handover
                                                </span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                                                    {task.co_contributors.length} prior {task.co_contributors.length === 1 ? 'member' : 'members'}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 divide-y divide-amber-500/10 pt-0.5">
                                                {task.co_contributors.map((contrib, idx) => (
                                                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                                                🤝
                                                            </span>
                                                            <span className="font-semibold truncate">{contrib.name}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-2">
                                                            {contrib.handover_reason === 'emergency_absence' ? 'Emergency Absence' : 'Handed Over'} {contrib.handed_over_at ? `(${contrib.handed_over_at})` : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Priority */}
                                    <div className="flex items-center justify-between gap-4">
                                        <label htmlFor="prop-priority" className="type-subheading text-[var(--muted-foreground)] shrink-0">
                                            Priority
                                        </label>
                                        <div className="relative min-w-48 max-w-64">
                                            <select
                                                id="prop-priority"
                                                value={selectedPriority}
                                                onChange={(e) => handleFieldChange('priority', e.target.value)}
                                                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 pr-8 text-xs font-bold text-[var(--foreground)] focus-ring appearance-none cursor-pointer"
                                            >
                                                {PRIORITY_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute right-2.5 top-3 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Story Points */}
                                    <div className="flex items-center justify-between gap-4">
                                        <label htmlFor="prop-points" className="type-subheading text-[var(--muted-foreground)] shrink-0">
                                            Story Points
                                        </label>
                                        <input
                                            id="prop-points"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={storyPoints}
                                            onChange={(e) => handleFieldChange('story_points', e.target.value ? Number(e.target.value) : '')}
                                            placeholder="—"
                                            className="h-9 w-24 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-mono font-bold text-[var(--foreground)] text-right focus-ring"
                                        />
                                    </div>

                                    {/* Task Classification / Type */}
                                    {task.task_classification && (
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="type-subheading text-[var(--muted-foreground)] shrink-0">
                                                Task Type
                                            </span>
                                            <span className="type-body font-semibold text-[var(--foreground)]">
                                                {task.task_classification}
                                            </span>
                                        </div>
                                    )}

                                    {/* Due Date Display */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="type-subheading text-[var(--muted-foreground)] shrink-0">
                                            Due Date
                                        </span>
                                        <span className="type-body font-bold text-[var(--foreground)] flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                            <span>{dueInfo.formattedDate || 'Sprint Target'}</span>
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Flag Complexity (UX Escape Hatch) */}
                            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                <span>Flag Complexity Issue</span>
                                            </label>
                                            {activeTask.needs_estimate_review && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                                                    Awaiting Review
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                            {activeTask.needs_estimate_review
                                                ? `Proposed: ${activeTask.suggested_story_points ?? '—'} SP (Current: ${activeTask.story_points ?? '0'} SP) • Note: "${activeTask.estimate_review_note || ''}"`
                                                : `Is this task harder than ${activeTask.story_points ?? 0} SP?`}
                                        </p>
                                    </div>

                                    {/* Action button(s) */}
                                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                                        {canFlagComplexity ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsFlagModalOpen(true)}
                                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                <span>{activeTask.needs_estimate_review ? 'Update Flag' : 'Notify Manager'}</span>
                                            </button>
                                        ) : (
                                            <span className="text-[11px] text-slate-400 italic">
                                                Assignee only
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Manager Quick Resolution Actions when awaiting review */}
                                {canManage && activeTask.needs_estimate_review && (
                                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                                            Manager Review:
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={isResolvingFlag}
                                                onClick={() => handleResolveComplexity('dismiss')}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            >
                                                Dismiss Flag
                                            </button>
                                            {activeTask.suggested_story_points && (
                                                <button
                                                    type="button"
                                                    disabled={isResolvingFlag}
                                                    onClick={() => handleResolveComplexity('accept', activeTask.suggested_story_points)}
                                                    className="px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                                >
                                                    {isResolvingFlag ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Check className="w-3 h-3" />
                                                    )}
                                                    <span>Accept {activeTask.suggested_story_points} SP</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-[var(--border)]" />

                            {/* Group 2: Schedule & Timing */}
                            <section aria-labelledby="heading-schedule" className="space-y-4">
                                <h3 id="heading-schedule" className="type-section-title font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[var(--primary)]" />
                                    <span>Schedule & Timing</span>
                                </h3>

                                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[var(--primary)]" />
                                            <span className="type-body font-bold text-[var(--foreground)] font-mono">
                                                {dueInfo.formattedDate ? `Target: ${dueInfo.formattedDate}` : 'Target: Sprint Milestone'}
                                            </span>
                                        </div>

                                        {isCantSlip ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/70">
                                                <Flame className="w-3 h-3 text-rose-600" />
                                                <span>Can't slip</span>
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cpaInfo.badgeClass}`}>
                                                {cpaInfo.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Plain sentence consequence explanation */}
                                    <p className="type-body text-[var(--muted-foreground)] leading-relaxed select-text">
                                        {isCantSlip
                                            ? 'Zero schedule leeway — any delay directly postpones project delivery.'
                                            : cpaInfo.consequence}
                                    </p>

                                    {/* Shortened Next Step coaching line (Owners and leaders only) */}
                                    {canManage && cpaInfo.actionPrompt && (
                                        <div className="mt-2 pt-2.5 border-t border-[var(--border)]/60 flex items-start gap-2">
                                            <span className="type-caption font-bold uppercase text-[var(--primary)] shrink-0 mt-0.5">
                                                Leader Note:
                                            </span>
                                            <span className="type-caption font-medium text-[var(--foreground)]">
                                                {cpaInfo.actionPrompt}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <hr className="border-[var(--border)]" />

                            {/* Group 3: Acceptance Criteria */}
                            <section aria-labelledby="heading-criteria" className="space-y-4">
                                <h3 id="heading-criteria" className="type-section-title font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                                    <span>Acceptance Criteria</span>
                                </h3>

                                <div className="space-y-2.5 max-w-prose">
                                    {acceptanceItems.length === 0 ? (
                                        <p className="type-body text-[var(--muted-foreground)] italic">
                                            No acceptance criteria specified for this task.
                                        </p>
                                    ) : (
                                        acceptanceItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 p-2.5 rounded-lg border border-[var(--border)]/50 bg-[var(--card)]/30 hover:bg-[var(--card)] transition-colors select-text"
                                            >
                                                <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
                                                <span className="type-body text-[var(--foreground)] leading-relaxed">
                                                    {item}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                            <hr className="border-[var(--border)]" />

                            {/* Group 4: Status Picker */}
                            <section aria-labelledby="heading-status-picker" className="space-y-4">
                                <h3 id="heading-status-picker" className="type-section-title font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                                    <span>Update Status</span>
                                </h3>

                                {/* Normal linear flow in board order */}
                                <div className="grid grid-cols-2 gap-3">
                                    {WORKFLOW_STATUS_KEYS.map((key) => {
                                        const cfg = STATUS_CONFIG[key];
                                        const isSelected = selectedStatus === key;
                                        const isDoneOpt = key === 'completed';
                                        const isOptDisabled = isDoneOpt && !canMarkDone;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleFieldChange('status', key)}
                                                disabled={isOptDisabled}
                                                title={isOptDisabled ? `Only ${reviewerDisplayName} or a manager can mark this task as done.` : ''}
                                                className={`h-9 px-3 rounded-lg flex items-center justify-between text-xs font-semibold transition-all border cursor-pointer focus-ring ${
                                                    isSelected
                                                        ? `${cfg.selectedPicker} shadow-xs`
                                                        : 'bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                                                } ${isOptDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                                                    <span className="truncate">{cfg.label}</span>
                                                </div>
                                                {isSelected && (
                                                    <Check className="w-3.5 h-3.5 text-current shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Separated Stuck / Blocked Option */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => handleFieldChange('status', 'stuck')}
                                        className={`w-full h-9 px-3 rounded-lg flex items-center justify-between text-xs font-semibold transition-all border cursor-pointer focus-ring ${
                                            selectedStatus === 'stuck'
                                                ? `${STATUS_CONFIG.stuck.selectedPicker} shadow-xs`
                                                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300/50 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG.stuck.dot}`} />
                                            <span>{STATUS_CONFIG.stuck.actionLabel}</span>
                                        </div>
                                        {selectedStatus === 'stuck' && (
                                            <Check className="w-3.5 h-3.5 text-current shrink-0" />
                                        )}
                                    </button>
                                </div>
                            </section>
                        </div>
                    ) : (
                        /* Activity Tab */
                        <div id="panel-activity" role="tabpanel" aria-labelledby="tab-activity" className="space-y-6">
                            <section aria-labelledby="heading-activity-feed" className="space-y-4">
                                <h3 id="heading-activity-feed" className="type-section-title font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                                    <span>Task Activity Feed</span>
                                </h3>

                                <div className="space-y-3">
                                    {comments.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/40 space-y-1.5 select-text"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="type-body font-bold text-[var(--foreground)]">
                                                    {entry.user}
                                                </span>
                                                <span className="type-caption font-mono text-[var(--muted-foreground)]">
                                                    {entry.time}
                                                </span>
                                            </div>
                                            <p className="type-body text-[var(--foreground)]/90 leading-relaxed">
                                                {entry.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Comment Composer */}
                                <form onSubmit={handleAddComment} className="space-y-3 pt-3 border-t border-[var(--border)]">
                                    <label htmlFor="task-comment-composer" className="type-subheading text-[var(--muted-foreground)] block">
                                        Add review note or activity update
                                    </label>
                                    <textarea
                                        id="task-comment-composer"
                                        rows={3}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Type an update or resolution note..."
                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 type-body text-[var(--foreground)] outline-hidden focus-ring resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim()}
                                            className="h-9 px-4 rounded-lg bg-[var(--primary)] hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-ring"
                                        >
                                            Post Update
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}
                </div>

                {/* ── STICKY ACTION FOOTER ────────────────────────────────────────── */}
                <div className="shrink-0 sticky bottom-0 z-10 bg-[var(--elevated)] border-t border-[var(--border)] px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer focus-ring"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        onClick={handleMarkComplete}
                        disabled={isCompleted || isSubmitting || !canMarkDone}
                        title={!canMarkDone ? `Only ${reviewerDisplayName} or a manager can mark this task as done.` : ''}
                        className="h-9 px-5 rounded-lg bg-[var(--primary)] hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Updating...</span>
                            </>
                        ) : isCompleted ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Completed</span>
                            </>
                        ) : !canMarkDone ? (
                            <span>Awaiting Reviewer</span>
                        ) : (
                            <span>Mark Complete</span>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )}

    {/* Flag Complexity Modal */}
    <FlagComplexityModal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        task={activeTask}
        tenantId={resolvedTenantId}
        onComplexityFlagged={(updatedTask) => {
            setCurrentTask(updatedTask);
            if (typeof onTaskUpdated === 'function') {
                onTaskUpdated(updatedTask);
            } else if (typeof updateTask === 'function') {
                updateTask(updatedTask.id, {
                    needs_estimate_review: updatedTask.needs_estimate_review,
                    suggested_story_points: updatedTask.suggested_story_points,
                    estimate_review_note: updatedTask.estimate_review_note,
                });
            }
        }}
    />
    </>
    );
}
