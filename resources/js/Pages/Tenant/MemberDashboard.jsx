import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import TaskFlyoutInspector from '@/Components/Tenant/Tasks/TaskFlyoutInspector';
import { showToast } from '@/Components/SystemToast';
import axios from 'axios';
import {
    Check,
    Play,
    Pause,
    CheckCircle2
} from 'lucide-react';

export default function MemberDashboard({ 
    studio, 
    myTasks = [], 
    sprintTasks = [], 
    inboxTasks = [], 
    notifications: initialNotifications = [],
    activeSprint = null, 
    pendingEstimatesCount = 0 
}) {
    const { auth, activeWorkspace } = usePage().props;
    const user = auth?.user;
    const studioName = studio?.name || 'Studio';

    // Local tasks list for optimistic updates
    const [tasksList, setTasksList] = useState(myTasks);

    // Focus Zone view scale: 'today' | 'week'
    const [focusScale, setFocusScale] = useState('today');

    // Timer state for "Start timer"
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    // Slide-over flyout inspector state
    const [selectedTask, setSelectedTask] = useState(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    useEffect(() => {
        setTasksList(myTasks);
    }, [myTasks]);

    // Timer effect
    useEffect(() => {
        let interval = null;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimerSeconds((prev) => prev + 1);
            }, 1000);
        } else if (!isTimerRunning && timerSeconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerSeconds]);

    const formatTimer = (totalSec) => {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Metric 1: My Tasks Due
    const tasksDueCount = useMemo(() => {
        return tasksList.filter(t => t.status !== 'completed' && t.sprint_status !== 'done').length;
    }, [tasksList]);
    const tasksDueFormatted = String(tasksDueCount).padStart(2, '0');

    // Metric 2: Focus Hours
    const totalFocusHours = useMemo(() => {
        return tasksList.reduce((acc, t) => acc + (Number(t.estimated_hours) || 0), 0);
    }, [tasksList]);
    const focusHoursFormatted = String(Math.round(totalFocusHours)).padStart(2, '0');

    // Metric 3: Blocked On Me
    const blockedOnMeCount = useMemo(() => {
        return tasksList.filter(t => {
            const isStuck = t.status === 'stuck' || t.sprint_status === 'stuck';
            const isCrit = Boolean(t.is_critical || (t.total_float !== null && Number(t.total_float) <= 0));
            return isStuck || isCrit;
        }).length;
    }, [tasksList]);
    const blockedFormatted = String(blockedOnMeCount).padStart(2, '0');

    // Metric 4: Done This Week
    const doneThisWeekCount = useMemo(() => {
        return tasksList.filter(t => t.status === 'completed' || t.sprint_status === 'done').length;
    }, [tasksList]);
    const doneFormatted = String(doneThisWeekCount).padStart(2, '0');

    // NOW • CURRENT TASK
    const currentTask = useMemo(() => {
        const inProgress = tasksList.find(t => t.status === 'in_progress' || t.sprint_status === 'in_progress');
        if (inProgress) return inProgress;

        const crit = tasksList.find(t => (t.is_critical || (t.total_float !== null && Number(t.total_float) <= 0)) && t.status !== 'completed');
        if (crit) return crit;

        return tasksList.find(t => t.status !== 'completed' && t.sprint_status !== 'done') || null;
    }, [tasksList]);

    // NEXT UP tasks queue
    const nextUpTasks = useMemo(() => {
        return tasksList
            .filter(t => t.id !== currentTask?.id && t.status !== 'completed' && t.sprint_status !== 'done')
            .slice(0, 3);
    }, [tasksList, currentTask]);

    // Action Ledger tasks
    const ledgerTasks = useMemo(() => {
        return tasksList;
    }, [tasksList]);

    // Handle opening inspector
    const handleOpenInspector = (task) => {
        setSelectedTask(task);
        setIsInspectorOpen(true);
    };

    // Execute status change with optimistic UI update and backend PATCH
    const handleUpdateTaskStatus = async (task, newStatus, note) => {
        const prevTasks = [...tasksList];

        const sprintStatusMap = {
            todo: 'ready_to_start',
            in_progress: 'in_progress',
            review: 'waiting_for_review',
            completed: 'done',
            stuck: 'stuck',
        };
        const mappedSprintStatus = sprintStatusMap[newStatus] || newStatus;

        // Optimistic update
        setTasksList(prev => prev.map(t => {
            if (t.id === task.id) {
                return { 
                    ...t, 
                    status: newStatus,
                    sprint_status: mappedSprintStatus,
                    completion_notes: note || t.completion_notes,
                };
            }
            return t;
        }));

        try {
            const url = route('tenant.tasks.update-status', {
                tenant: activeWorkspace,
                task: task.id,
            });

            await axios.patch(url, { 
                status: newStatus,
                sprint_status: mappedSprintStatus,
                completion_notes: note,
            }, {
                headers: { 'Accept': 'application/json' }
            });

            showToast(`Task #${task.id} updated to ${newStatus}`, 'success');
        } catch (err) {
            console.error('Failed to update task status', err);
            setTasksList(prevTasks);
            throw new Error('Failed to update task status on the server.');
        }
    };

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`My Work — ${studioName}`} />

            <div className="flex-1 overflow-y-auto bg-surface text-text-primary p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* ── Top Workspace Bar (Matching Wireframe Header) ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                        <div className="flex items-center gap-3">
                            {/* Blue Square Rounded Icon */}
                            <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                {studioName.charAt(0).toUpperCase()}
                            </div>

                            <span className="font-heading font-bold text-base text-text-primary tracking-tight">
                                Workspace
                            </span>

                            {/* Active & Inactive Navigation Pills */}
                            <nav className="flex items-center gap-1.5 ml-2">
                                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-heading text-xs font-bold shadow-2xs">
                                    Dashboard
                                </span>
                                <Link
                                    href={`/studio/${activeWorkspace}/projects`}
                                    className="px-3 py-1 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated text-xs font-semibold transition-colors"
                                >
                                    Projects
                                </Link>
                                <Link
                                    href={`/studio/${activeWorkspace}/team`}
                                    className="px-3 py-1 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated text-xs font-semibold transition-colors"
                                >
                                    Team
                                </Link>
                            </nav>
                        </div>
                    </div>

                    {/* ── METRIC CARDS ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Card 1: MY TASKS DUE */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    Tasks Due
                                </span>
                                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mt-1.5 block">
                                    {tasksDueFormatted}
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Progress Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                <div
                                    className="absolute inset-y-0 left-0 bg-brand/15 border-r border-brand/30 transition-all duration-500"
                                    style={{ width: `${Math.min(100, tasksDueCount * 15)}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-mono font-semibold text-text-muted">
                                    {tasksDueCount} active in backlog
                                </span>
                            </div>
                        </div>

                        {/* Card 2: FOCUS HOURS */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    Focus Hours
                                </span>
                                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mt-1.5 block font-mono">
                                    {focusHoursFormatted}
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Capacity Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                <div
                                    className="absolute inset-y-0 left-0 bg-brand/15 border-r border-brand/30 transition-all duration-500"
                                    style={{ width: `${Math.min(100, (totalFocusHours / 40) * 100)}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-mono font-semibold text-text-muted">
                                    {Math.round(totalFocusHours)}h allocated
                                </span>
                            </div>
                        </div>

                        {/* Card 3: BLOCKED ON ME */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    Blocked On Me
                                </span>
                                <span className={`font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mt-1.5 block ${blockedOnMeCount > 0 ? 'text-rose-500' : 'text-text-primary'}`}>
                                    {blockedFormatted}
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Alert Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                {blockedOnMeCount > 0 ? (
                                    <span className="relative z-10 text-[10px] font-mono font-bold text-rose-500 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                        Critical / blocked items
                                    </span>
                                ) : (
                                    <span className="relative z-10 text-[10px] font-mono font-semibold text-emerald-500 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        No active blockers
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Card 4: DONE THIS WEEK */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    Done This Week
                                </span>
                                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mt-1.5 block font-mono">
                                    {doneFormatted}
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Velocity Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                <div
                                    className="absolute inset-y-0 left-0 bg-emerald-500/15 border-r border-emerald-500/30 transition-all duration-500"
                                    style={{ width: `${Math.min(100, doneThisWeekCount * 20)}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-mono font-semibold text-emerald-500">
                                    {doneThisWeekCount} tasks completed
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* ── MAIN STAGE: Focus Zone ── */}
                    <div className="p-6 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="font-heading text-lg font-bold text-text-primary tracking-tight">
                                    Focus Zone
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Immediate execution target and upcoming personal queue
                                </p>
                            </div>

                            {/* Segmented Control: [ Today | This week ] */}
                            <div className="flex items-center rounded-xl border border-surface-border bg-surface p-1 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setFocusScale('today')}
                                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        focusScale === 'today'
                                            ? 'bg-brand text-white shadow-2xs'
                                            : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFocusScale('week')}
                                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        focusScale === 'week'
                                            ? 'bg-brand text-white shadow-2xs'
                                            : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    This week
                                </button>
                            </div>
                        </div>

                        {/* Split Stage: Left NOW Task vs Right NEXT UP Queue */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Left Pane: Active Focus Task */}
                            <div className="lg:col-span-7 rounded-2xl bg-hatched-pattern border border-surface-border/80 p-6 flex flex-col justify-between min-h-[190px]">
                                <div>
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                        <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase">
                                            Active Focus Target
                                        </span>
                                    </div>
                                    <h3
                                        onClick={() => currentTask && handleOpenInspector(currentTask)}
                                        className="font-heading text-xl sm:text-2xl font-bold text-text-primary leading-snug cursor-pointer hover:text-brand transition-colors line-clamp-2"
                                    >
                                        {currentTask ? currentTask.title : 'All pending tasks completed! Pick up new work.'}
                                    </h3>
                                </div>

                                <div className="pt-6 flex items-center justify-between gap-4 flex-wrap">
                                    {/* Tactile Timer Button */}
                                    <button
                                        type="button"
                                        onClick={() => setIsTimerRunning(prev => !prev)}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-2xs cursor-pointer ${
                                            isTimerRunning
                                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400'
                                                : 'bg-surface border-surface-border text-text-primary hover:border-brand'
                                        }`}
                                    >
                                        {isTimerRunning ? (
                                            <>
                                                <Pause className="w-3.5 h-3.5" />
                                                <span>{formatTimer(timerSeconds)} • Pause</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-3.5 h-3.5 text-brand" />
                                                <span>{timerSeconds > 0 ? `${formatTimer(timerSeconds)} • Resume` : 'Start timer'}</span>
                                            </>
                                        )}
                                    </button>

                                    {currentTask && (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenInspector(currentTask)}
                                            className="text-xs font-semibold text-text-muted hover:text-brand transition-colors cursor-pointer"
                                        >
                                            Inspect details →
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Pane: Next Up Queue */}
                            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                                <div>
                                    <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block mb-2.5">
                                        Next In Queue
                                    </span>

                                    <div className="space-y-2.5">
                                        {nextUpTasks.length === 0 ? (
                                            <p className="text-xs text-text-muted italic py-4">
                                                No upcoming queued tasks.
                                            </p>
                                        ) : (
                                            nextUpTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => handleOpenInspector(task)}
                                                    className="p-3 rounded-xl bg-surface border border-surface-border/70 hover:border-brand/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-4 h-4 rounded-md border border-slate-300 dark:border-slate-600 group-hover:border-brand shrink-0" />
                                                        <span className="text-xs font-medium text-text-primary group-hover:text-brand transition-colors truncate">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full border border-surface-border bg-surface-elevated text-[10px] font-semibold text-text-muted shrink-0">
                                                        {task.hard_constraint_date ? 'Due' : 'Queued'}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── MY ACTION LEDGER ── */}
                    <div className="p-6 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-heading text-lg font-bold text-text-primary tracking-tight">
                                    My Action Ledger
                                </h3>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Personal deliverables, assigned projects, and deadline tracking
                                </p>
                            </div>
                            <span className="text-xs font-mono text-text-muted font-semibold">
                                {ledgerTasks.length} tasks assigned
                            </span>
                        </div>

                        {/* Task Ledger Rows */}
                        <div className="divide-y divide-surface-border/60 border border-surface-border/70 rounded-xl overflow-hidden bg-surface/40">
                            {ledgerTasks.length === 0 ? (
                                <div className="p-8 text-center text-text-muted italic text-xs">
                                    No active tasks in your personal ledger.
                                </div>
                            ) : (
                                ledgerTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface/80 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Checkbox square indicator */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenInspector(task)}
                                                className="w-4 h-4 rounded-md border border-slate-300 dark:border-slate-600 hover:border-brand flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                                            >
                                                {(task.status === 'completed' || task.sprint_status === 'done') && (
                                                    <Check className="w-3 h-3 text-brand" />
                                                )}
                                            </button>

                                            {/* Task Title */}
                                            <span
                                                onClick={() => handleOpenInspector(task)}
                                                className="font-medium text-xs sm:text-sm text-text-primary hover:text-brand transition-colors truncate cursor-pointer"
                                            >
                                                {task.title}
                                            </span>
                                        </div>

                                        {/* Right Badges & Action Button */}
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            {/* Project Pill */}
                                            <span className="px-2.5 py-0.5 rounded-full border border-surface-border bg-surface text-[11px] font-semibold text-text-muted">
                                                {task.project_name || 'Project'}
                                            </span>

                                            {/* Due Pill */}
                                            <span className="px-2.5 py-0.5 rounded-full border border-surface-border bg-surface text-[11px] font-semibold text-text-muted">
                                                {task.hard_constraint_date || (task.days_until_deadline ? `Due in ${task.days_until_deadline}d` : 'Due')}
                                            </span>

                                            {/* Action Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenInspector(task)}
                                                className="px-3 py-1 rounded-xl border border-surface-border bg-surface hover:bg-surface-elevated text-xs font-bold text-text-primary transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-2xs cursor-pointer"
                                            >
                                                Action
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Slide-Over Flyout Inspector ── */}
            <TaskFlyoutInspector
                isOpen={isInspectorOpen}
                task={selectedTask}
                onClose={() => {
                    setIsInspectorOpen(false);
                    setSelectedTask(null);
                }}
                onUpdateStatus={handleUpdateTaskStatus}
                canManage={false}
                currentUserId={user?.id}
            />
        </TenantLayout>
    );
}
