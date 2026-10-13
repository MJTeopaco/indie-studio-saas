import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    CheckCircle2,
    CheckSquare,
    SlidersHorizontal,
    Flame,
    Check,
    Loader2,
    MessageSquare,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';
import { resolveCpaStatus } from '@/lib/cpaTerminology';

const SPRINT_STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Under Review' },
    { value: 'completed', label: 'Done' },
    { value: 'stuck', label: 'Blocked / Stuck' },
];

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
}) {
    const [activeTab, setActiveTab] = useState('details');
    const [selectedStatus, setSelectedStatus] = useState(task?.status || task?.sprint_status || 'todo');
    const [selectedPriority, setSelectedPriority] = useState(task?.priority || 'Medium');
    const [selectedAssignee, setSelectedAssignee] = useState(
        typeof task?.assignee === 'string' ? task?.assignee : (task?.assignee?.name || task?.assigned_user_id || '')
    );
    const [storyPoints, setStoryPoints] = useState(task?.story_points ?? '');
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (task) {
            setSelectedStatus(task.status || task.sprint_status || 'todo');
            setSelectedPriority(task.priority || 'Medium');
            setSelectedAssignee(
                typeof task.assignee === 'string' ? task.assignee : (task.assignee?.name || task.assigned_user_id || '')
            );
            setStoryPoints(task.story_points ?? '');
            setCommentText('');
            setComments(task.comments || [
                { id: 1, user: 'System', text: 'Task logged and scheduled in sprint', time: '1d ago' },
                { id: 2, user: task.assignee?.name || 'Assignee', text: 'Started preliminary analysis and branch setup', time: '4h ago' }
            ]);
        }
    }, [task]);

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !task) return null;

    const taskKey = task.task_key || `TASK-${String(task.id).padStart(3, '0')}`;
    const projectName = task.project_name || task.project?.name || 'StudioSprint Core';
    const isCompleted = selectedStatus === 'completed' || selectedStatus === 'done';

    const isCritical = Boolean(
        task.is_critical || (task.total_float !== null && task.total_float !== undefined && Number(task.total_float) <= 0)
    );
    const totalFloat = task.total_float !== null && task.total_float !== undefined ? Number(task.total_float) : null;
    const dueDateDisplay = task.hard_constraint_date 
        ? String(task.hard_constraint_date).split('T')[0] 
        : (task.due_date || task.dueDate || 'Sprint Target');

    const cpaInfo = resolveCpaStatus({
        totalFloat,
        isCritical: task.is_critical,
        dueDate: task.hard_constraint_date || task.due_date || task.dueDate,
        daysUntilDeadline: task.days_until_deadline,
        dependentCount: task.dependent_tasks_count || task.downstream_count || 0,
        status: selectedStatus,
    });

    // Safe inline updater
    const handleFieldChange = async (field, value) => {
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
                await updateTask(task.id, patch);
            } else if (typeof onUpdateStatus === 'function' && (field === 'status' || field === 'sprint_status')) {
                await onUpdateStatus(task, value);
            }
        } catch (err) {
            console.error('Failed to update task property', err);
            showToast('Failed to update task property', 'error');
        }
    };

    const handleMarkComplete = async () => {
        if (isCompleted) return;
        setIsSubmitting(true);
        try {
            setSelectedStatus('completed');
            if (typeof updateTask === 'function') {
                await updateTask(task.id, { status: 'completed', sprint_status: 'done' });
            } else if (typeof onUpdateStatus === 'function') {
                await onUpdateStatus(task, 'completed', 'Marked complete via inspector');
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
            time: 'Just now'
        };
        setComments(prev => [...prev, newEntry]);
        setCommentText('');
        showToast('Comment added', 'success');
    };

    // Parse acceptance criteria
    const rawCriteria = task.acceptance_criteria || [
        'Deterministic CPM start & finish conditions met',
        'Story point estimation reviewed with engineering team',
        'Branch pull request submitted with zero regressions'
    ];
    const acceptanceItems = Array.isArray(rawCriteria) 
        ? rawCriteria 
        : String(rawCriteria).split('\n').filter(Boolean);

    return (
        <div 
            className="fixed inset-0 z-50 overflow-hidden" 
            aria-labelledby="task-drawer-title" 
            role="dialog" 
            aria-modal="true"
        >
            {/* Embedded styles for responsive <= 480px compaction */}
            <style>{`
                @media (max-width: 480px) {
                    .task-drawer-sheet {
                        width: 100vw !important;
                        max-width: 100vw !important;
                    }
                    .task-drawer-heading {
                        padding: 14px 16px 10px !important;
                    }
                    .task-drawer-tabs {
                        padding: 0 16px !important;
                    }
                    .task-drawer-section {
                        padding: 12px 16px !important;
                    }
                    .task-drawer-footer {
                        padding: 10px 16px max(10px, env(safe-area-inset-bottom)) 16px !important;
                    }
                }
            `}</style>

            {/* Darkened & heavily blurred backdrop scrim so sidebar is seen clearly as an overlay */}
            <div
                className="fixed inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-backdrop-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Right-Side Drawer Sheet with smooth slide-in popup animation */}
            <div
                className="task-drawer-sheet fixed inset-y-0 right-0 z-50 flex flex-col transform animate-drawer-in"
                style={{
                    width: 'min(100%, 400px)',
                    height: '100dvh',
                    backgroundColor: 'var(--elevated)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-12px 0 32px -4px rgba(0, 0, 0, 0.45), -4px 0 12px -2px rgba(0, 0, 0, 0.2)'
                }}
            >
                {/* ── Topline (height: 50px) ── */}
                <div
                    className="relative flex items-center justify-between shrink-0"
                    style={{
                        height: '50px',
                        padding: '0 54px 0 20px',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--elevated)'
                    }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span
                            className="font-bold tracking-wider uppercase shrink-0"
                            style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--foreground)'
                            }}
                        >
                            {taskKey}
                        </span>
                        <span
                            className="truncate uppercase font-medium"
                            style={{
                                fontSize: '9px',
                                color: 'var(--muted-foreground)'
                            }}
                        >
                            Task Details
                        </span>
                    </div>

                    <span
                        className="text-[9px] uppercase font-mono tracking-wider hidden sm:inline"
                        style={{ color: 'var(--muted-foreground)' }}
                    >
                        ESC to close
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close task details"
                        className="absolute right-4 top-3.5 p-1 rounded-md transition-colors cursor-pointer"
                        style={{
                            color: 'var(--muted-foreground)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        <X style={{ width: '13px', height: '13px' }} />
                    </button>
                </div>

                {/* ── Heading (padding: 16px 20px 12px) ── */}
                <div
                    className="task-drawer-heading shrink-0"
                    style={{
                        padding: '16px 20px 12px',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--elevated)'
                    }}
                >
                    <p
                        className="truncate font-medium uppercase tracking-wider"
                        style={{
                            fontSize: '10px',
                            marginBottom: '5px',
                            color: 'var(--muted-foreground)'
                        }}
                    >
                        {projectName}
                    </p>

                    <h2
                        id="task-drawer-title"
                        className="font-semibold tracking-tight"
                        style={{
                            fontSize: '17px',
                            lineHeight: 1.4,
                            color: 'var(--foreground)'
                        }}
                    >
                        {task.title}
                    </h2>

                    <div
                        className="flex items-center gap-1.5 flex-wrap"
                        style={{ marginTop: '10px' }}
                    >
                        {task.task_classification && (
                            <span
                                className="font-semibold px-2 py-0.5 rounded-[4px] border"
                                style={{
                                    fontSize: '9px',
                                    backgroundColor: 'var(--card)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--muted-foreground)'
                                }}
                            >
                                {task.task_classification}
                            </span>
                        )}
                        {task.story_points !== null && task.story_points !== undefined && (
                            <span
                                className="font-semibold px-2 py-0.5 rounded-[4px] border"
                                style={{
                                    fontSize: '9px',
                                    fontFamily: 'var(--font-mono)',
                                    backgroundColor: 'var(--card)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--primary)'
                                }}
                            >
                                {task.story_points} pts
                            </span>
                        )}
                        <span
                            className="font-semibold px-2 py-0.5 rounded-[4px] border uppercase"
                            style={{
                                fontSize: '9px',
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                color: isCritical ? 'var(--warning)' : 'var(--muted-foreground)'
                            }}
                        >
                            {selectedPriority}
                        </span>
                    </div>
                </div>

                {/* ── Tabs (height: 36px, gap: 16px) ── */}
                <div
                    className="task-drawer-tabs flex items-center shrink-0"
                    role="tablist"
                    style={{
                        gap: '16px',
                        padding: '0 20px',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--elevated)'
                    }}
                >
                    <button
                        type="button"
                        role="tab"
                        id="tab-details"
                        aria-selected={activeTab === 'details'}
                        aria-controls="panel-details"
                        onClick={() => setActiveTab('details')}
                        className="text-[11px] font-medium transition-colors cursor-pointer relative"
                        style={{
                            height: '36px',
                            paddingBottom: '9px',
                            borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'details' ? 'var(--primary)' : 'var(--muted-foreground)',
                            fontWeight: activeTab === 'details' ? 600 : 500
                        }}
                    >
                        Details
                    </button>

                    <button
                        type="button"
                        role="tab"
                        id="tab-activity"
                        aria-selected={activeTab === 'activity'}
                        aria-controls="panel-activity"
                        onClick={() => setActiveTab('activity')}
                        className="text-[11px] font-medium transition-colors cursor-pointer relative flex items-center gap-1.5"
                        style={{
                            height: '36px',
                            paddingBottom: '9px',
                            borderBottom: activeTab === 'activity' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'activity' ? 'var(--primary)' : 'var(--muted-foreground)',
                            fontWeight: activeTab === 'activity' ? 600 : 500
                        }}
                    >
                        <span>Activity</span>
                        <span
                            className="px-1.5 py-0.2 rounded-full font-mono text-[9px]"
                            style={{
                                backgroundColor: 'var(--card)',
                                color: 'var(--muted-foreground)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            {comments.length}
                        </span>
                    </button>
                </div>

                {/* ── Middle Scrollable Region ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'details' ? (
                        <div id="panel-details" role="tabpanel" aria-labelledby="tab-details">
                            {/* Section 1: Properties */}
                            <div
                                className="task-drawer-section"
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid var(--border)'
                                }}
                            >
                                <h3
                                    className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
                                    style={{
                                        fontSize: '10px',
                                        marginBottom: '10px',
                                        color: 'var(--muted-foreground)'
                                    }}
                                >
                                    <SlidersHorizontal style={{ width: '12px', height: '12px' }} />
                                    <span>Properties</span>
                                </h3>

                                <div className="space-y-1.5">
                                    {/* Assignee */}
                                    <div
                                        className="grid items-center gap-2"
                                        style={{
                                            gridTemplateColumns: '1fr 1.35fr',
                                            minHeight: '34px'
                                        }}
                                    >
                                        <label
                                            htmlFor="prop-assignee"
                                            className="font-medium"
                                            style={{
                                                fontSize: '10px',
                                                color: 'var(--muted-foreground)'
                                            }}
                                        >
                                            Assignee
                                        </label>
                                        <select
                                            id="prop-assignee"
                                            value={selectedAssignee}
                                            onChange={(e) => handleFieldChange('assignee', e.target.value)}
                                            className="rounded-[6px] outline-none transition-colors cursor-pointer"
                                            style={{
                                                fontSize: '10px',
                                                padding: '5px 8px',
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--foreground)'
                                            }}
                                        >
                                            <option value="">Unassigned</option>
                                            {selectedAssignee && !teamMembers.some(m => m.name === selectedAssignee) && (
                                                <option value={selectedAssignee}>{selectedAssignee}</option>
                                            )}
                                            {teamMembers.map(m => (
                                                <option key={m.id || m.name} value={m.name || m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Priority */}
                                    <div
                                        className="grid items-center gap-2"
                                        style={{
                                            gridTemplateColumns: '1fr 1.35fr',
                                            minHeight: '34px'
                                        }}
                                    >
                                        <label
                                            htmlFor="prop-priority"
                                            className="font-medium"
                                            style={{
                                                fontSize: '10px',
                                                color: 'var(--muted-foreground)'
                                            }}
                                        >
                                            Priority
                                        </label>
                                        <select
                                            id="prop-priority"
                                            value={selectedPriority}
                                            onChange={(e) => handleFieldChange('priority', e.target.value)}
                                            className="rounded-[6px] outline-none transition-colors cursor-pointer"
                                            style={{
                                                fontSize: '10px',
                                                padding: '5px 8px',
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--foreground)'
                                            }}
                                        >
                                            {PRIORITY_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Story Points */}
                                    <div
                                        className="grid items-center gap-2"
                                        style={{
                                            gridTemplateColumns: '1fr 1.35fr',
                                            minHeight: '34px'
                                        }}
                                    >
                                        <label
                                            htmlFor="prop-points"
                                            className="font-medium"
                                            style={{
                                                fontSize: '10px',
                                                color: 'var(--muted-foreground)'
                                            }}
                                        >
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
                                            className="rounded-[6px] outline-none transition-colors"
                                            style={{
                                                width: '56px',
                                                fontSize: '10px',
                                                fontFamily: 'var(--font-mono)',
                                                padding: '5px 8px',
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--foreground)',
                                                textAlign: 'right'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Schedule */}
                            <div
                                className="task-drawer-section"
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid var(--border)'
                                }}
                            >
                                <h3
                                    className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
                                    style={{
                                        fontSize: '10px',
                                        marginBottom: '10px',
                                        color: 'var(--muted-foreground)'
                                    }}
                                >
                                    <Clock style={{ width: '12px', height: '12px' }} />
                                    <span>Schedule</span>
                                </h3>

                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--card)',
                                        border: '1px solid var(--border)'
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    color: 'var(--primary)'
                                                }}
                                                className="shrink-0"
                                            />
                                            <span
                                                className="block font-bold tracking-tight text-sm font-mono"
                                                style={{ color: 'var(--foreground)' }}
                                            >
                                                {dueDateDisplay}
                                            </span>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cpaInfo.badgeClass}`}>
                                            {cpaInfo.label}
                                        </span>
                                    </div>

                                    {/* Consequence statement */}
                                    <div
                                        className="flex items-start gap-1.5 leading-snug mt-2 text-[10.5px]"
                                    >
                                        {cpaInfo.tier === 'emergency' ? (
                                            <AlertTriangle style={{ width: '13px', height: '13px' }} className="shrink-0 text-rose-500 mt-0.5" />
                                        ) : cpaInfo.tier === 'vigilance' ? (
                                            <Flame style={{ width: '13px', height: '13px' }} className="shrink-0 text-amber-500 mt-0.5" />
                                        ) : cpaInfo.tier === 'safe' ? (
                                            <CheckCircle2 style={{ width: '13px', height: '13px' }} className="shrink-0 text-emerald-500 mt-0.5" />
                                        ) : (
                                            <Clock style={{ width: '13px', height: '13px' }} className="shrink-0 text-amber-500 mt-0.5" />
                                        )}
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                                            {cpaInfo.consequence}
                                        </span>
                                    </div>

                                    {/* Action Invitation Card */}
                                    {cpaInfo.actionPrompt && (
                                        <div
                                            className="mt-2.5 pt-2 border-t flex items-start gap-1.5"
                                            style={{ borderColor: 'var(--border)' }}
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand shrink-0 mt-0.5">
                                                Next Step:
                                            </span>
                                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                                                {cpaInfo.actionPrompt}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Acceptance Criteria */}
                            <div
                                className="task-drawer-section"
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid var(--border)'
                                }}
                            >
                                <h3
                                    className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
                                    style={{
                                        fontSize: '10px',
                                        marginBottom: '10px',
                                        color: 'var(--muted-foreground)'
                                    }}
                                >
                                    <CheckSquare style={{ width: '12px', height: '12px' }} />
                                    <span>Acceptance Criteria</span>
                                </h3>

                                <div
                                    className="flex flex-col"
                                    style={{ gap: '7px' }}
                                >
                                    {acceptanceItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-2 leading-snug"
                                            style={{
                                                fontSize: '10px',
                                                color: 'var(--foreground)'
                                            }}
                                        >
                                            <span
                                                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                                                style={{ backgroundColor: 'var(--primary)' }}
                                            />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 4: Task Status Grid */}
                            <div
                                className="task-drawer-section"
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid var(--border)'
                                }}
                            >
                                <h3
                                    className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
                                    style={{
                                        fontSize: '10px',
                                        marginBottom: '10px',
                                        color: 'var(--muted-foreground)'
                                    }}
                                >
                                    <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                                    <span>Task Status</span>
                                </h3>

                                <div
                                    className="grid grid-cols-2"
                                    style={{ gap: '6px' }}
                                >
                                    {SPRINT_STATUS_OPTIONS.map((opt) => {
                                        const isSelected = selectedStatus === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleFieldChange('status', opt.value)}
                                                className="px-2.5 rounded-[6px] text-left flex items-center justify-between transition-colors shadow-none cursor-pointer"
                                                style={{
                                                    height: '32px',
                                                    fontSize: '9px',
                                                    fontWeight: isSelected ? 600 : 500,
                                                    backgroundColor: isSelected
                                                        ? 'color-mix(in oklch, var(--primary) 12%, var(--card))'
                                                        : 'var(--card)',
                                                    border: isSelected
                                                        ? '1px solid var(--primary)'
                                                        : '1px solid var(--border)',
                                                    color: 'var(--foreground)'
                                                }}
                                            >
                                                <span className="truncate">{opt.label}</span>
                                                {isSelected && (
                                                    <Check
                                                        style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            color: 'var(--primary)'
                                                        }}
                                                        className="shrink-0"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div id="panel-activity" role="tabpanel" aria-labelledby="tab-activity" className="p-4 sm:p-5 space-y-4">
                            {/* Activity Feed Entries */}
                            <div className="space-y-2.5">
                                {comments.map((entry) => (
                                    <div
                                        key={entry.id}
                                        style={{
                                            padding: '10px 0',
                                            gap: '10px',
                                            fontSize: '10px',
                                            borderBottom: '1px solid var(--border)'
                                        }}
                                        className="flex flex-col"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-[var(--foreground)]">{entry.user}</span>
                                            <span style={{ fontSize: '9px' }} className="text-[var(--muted-foreground)] font-mono">{entry.time}</span>
                                        </div>
                                        <p className="text-[var(--foreground)] leading-relaxed">{entry.text}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Comment Composer */}
                            <form onSubmit={handleAddComment} style={{ marginTop: '12px' }}>
                                <label htmlFor="comment-composer" className="sr-only">Add Comment</label>
                                <textarea
                                    id="comment-composer"
                                    rows={2}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add an activity update or review note..."
                                    className="w-full rounded-[6px] outline-none transition-colors"
                                    style={{
                                        fontSize: '11px',
                                        padding: '8px 10px',
                                        backgroundColor: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--foreground)',
                                        resize: 'none'
                                    }}
                                />

                                <div
                                    className="flex items-center justify-between"
                                    style={{ marginTop: '8px' }}
                                >
                                    <span
                                        style={{ fontSize: '9px' }}
                                        className="text-[var(--muted-foreground)] font-mono"
                                    >
                                        Preview Activity
                                    </span>

                                    <button
                                        type="submit"
                                        disabled={!commentText.trim()}
                                        className="font-medium rounded-[6px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{
                                            height: '28px',
                                            fontSize: '10px',
                                            padding: '0 12px',
                                            backgroundColor: 'var(--primary)',
                                            color: '#ffffff'
                                        }}
                                    >
                                        Post Note
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* ── Sticky Action Footer (padding: 10px 20px, buttons: height 34px) ── */}
                <div
                    className="task-drawer-footer shrink-0 flex items-center justify-end gap-2.5"
                    style={{
                        padding: '10px 20px',
                        borderTop: '1px solid var(--border)',
                        backgroundColor: 'var(--elevated)'
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-medium rounded-[6px] transition-colors cursor-pointer"
                        style={{
                            height: '34px',
                            fontSize: '11px',
                            padding: '0 14px',
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)'
                        }}
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        onClick={handleMarkComplete}
                        disabled={isCompleted || isSubmitting}
                        className="font-semibold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            height: '34px',
                            fontSize: '11px',
                            padding: '0 16px',
                            backgroundColor: 'var(--primary)',
                            color: '#ffffff'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 style={{ width: '12px', height: '12px' }} className="animate-spin" />
                                <span>Updating...</span>
                            </>
                        ) : isCompleted ? (
                            <>
                                <Check style={{ width: '12px', height: '12px' }} />
                                <span>Completed</span>
                            </>
                        ) : (
                            <span>Mark Complete</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
