import React, { useState, useMemo } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { showToast } from '@/Components/SystemToast';
import TaskFlyoutInspector from '@/Components/Tenant/Tasks/TaskFlyoutInspector';
import {
    Check,
    ChevronRight,
    Search,
    X,
    FolderKanban,
    Users,
    Zap,
    Flame,
    CheckCircle2,
    Calendar,
    Target
} from 'lucide-react';

export default function Overview({ projects: propProjects = [], stats: propStats = null }) {
    const pageProps = usePage().props;
    const { activeWorkspace, studio: propStudio, auth } = pageProps;
    const studioName = propStudio?.name || 'Studio';
    const projects = propProjects.length > 0 ? propProjects : (pageProps.projects ?? []);

    // Timeline view scale: 'week' | 'month' | 'quarter'
    const [timelineScale, setTimelineScale] = useState('week');

    // Slide-over flyout inspector state
    const [selectedTask, setSelectedTask] = useState(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    // Flatten all tasks across projects
    const allTasks = useMemo(() => {
        const list = [];
        projects.forEach(p => {
            if (Array.isArray(p.tasks)) {
                p.tasks.forEach(t => {
                    list.push({
                        ...t,
                        project_id: p.id,
                        project_name: p.name,
                    });
                });
            }
        });
        return list;
    }, [projects]);

    // Metric 1: Portfolio Health
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalTasksCount = allTasks.length;
    const completedTasksCount = allTasks.filter(t => t.status === 'completed' || t.sprint_status === 'done').length;
    const portfolioHealthPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // Metric 2: At-Risk Work (Critical zero-float tasks or stuck tasks)
    const atRiskTasks = useMemo(() => {
        return allTasks.filter(t => {
            const hasZeroFloat = t.total_float !== null && t.total_float !== undefined && Number(t.total_float) <= 0;
            const isStuck = t.status === 'stuck' || t.sprint_status === 'stuck';
            return Boolean(t.is_critical || hasZeroFloat || isStuck);
        });
    }, [allTasks]);
    const atRiskCountFormatted = String(atRiskTasks.length).padStart(2, '0');

    // Metric 3: Team Load
    const uniqueAssignees = useMemo(() => {
        const set = new Set();
        allTasks.forEach(t => {
            const name = t.assignee?.name || t.assignee;
            if (name && typeof name === 'string') set.add(name);
        });
        return Array.from(set);
    }, [allTasks]);
    const assignedTasksCount = allTasks.filter(t => Boolean(t.assignee)).length;
    const teamLoadPct = totalTasksCount > 0 ? Math.round((assignedTasksCount / totalTasksCount) * 100) : 0;

    // Metric 4: Budget / Story Points Burn
    const totalStoryPoints = useMemo(() => {
        return allTasks.reduce((acc, t) => acc + (Number(t.story_points) || 0), 0);
    }, [allTasks]);

    const deliveredStoryPoints = useMemo(() => {
        return allTasks
            .filter(t => t.status === 'completed' || t.sprint_status === 'done')
            .reduce((acc, t) => acc + (Number(t.actual_story_points ?? t.story_points) || 0), 0);
    }, [allTasks]);

    const budgetBurnPct = totalStoryPoints > 0 ? Math.round((deliveredStoryPoints / totalStoryPoints) * 100) : portfolioHealthPct;

    // Timeline calculation based on projects
    const timelineProjects = useMemo(() => {
        if (projects.length === 0) {
            return [
                { id: 1, name: 'Project Alpha', startOffset: 15, barLength: 45, secondStart: 65, secondLength: 20 },
                { id: 2, name: 'Project Beta', startOffset: 25, barLength: 50 },
                { id: 3, name: 'Project Gamma', startOffset: 10, barLength: 25, secondStart: 50, secondLength: 35 },
                { id: 4, name: 'Project Delta', startOffset: 35, barLength: 55 },
            ];
        }

        return projects.map((p, idx) => {
            const pTasks = Array.isArray(p.tasks) ? p.tasks : [];
            const done = pTasks.filter(t => t.status === 'completed' || t.sprint_status === 'done').length;
            const progress = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 40;

            const startOffset = ((idx * 15) % 40) + 10;
            const barLength = Math.max(25, Math.min(65, progress));
            const hasBuffer = idx % 2 === 0;

            return {
                id: p.id,
                name: p.name,
                progress,
                startOffset,
                barLength,
                secondStart: hasBuffer ? startOffset + barLength + 5 : null,
                secondLength: hasBuffer ? 20 : null,
            };
        });
    }, [projects]);

    // Handle task inspection
    const handleOpenInspector = (task) => {
        setSelectedTask(task);
        setIsInspectorOpen(true);
    };

    // Handle status update submission from the flyout inspector
    const handleUpdateTaskStatus = async (task, newStatus, note) => {
        return new Promise((resolve, reject) => {
            router.patch(
                route('tenant.projects.tasks.update', {
                    tenant: activeWorkspace,
                    project: task.project_id,
                    task: task.id,
                }),
                {
                    status: newStatus,
                    sprint_status: newStatus === 'todo' ? 'ready_to_start' : newStatus,
                    completion_notes: note,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        showToast(`Task #${task.id} updated to ${newStatus}`, 'success');
                        resolve();
                    },
                    onError: (err) => {
                        console.error('Update failed:', err);
                        reject(new Error('Failed to update task status'));
                    },
                }
            );
        });
    };

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`Dashboard — ${studioName}`} />

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

                        {/* Card 1: PORTFOLIO HEALTH */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    Portfolio Health
                                </span>
                                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mt-1.5 block">
                                    {String(portfolioHealthPct).padStart(2, '0')}%
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Progress Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                <div
                                    className="absolute inset-y-0 left-0 bg-brand/15 border-r border-brand/30 transition-all duration-500"
                                    style={{ width: `${portfolioHealthPct}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-mono font-semibold text-text-muted">
                                    {completedTasksCount} of {totalTasksCount} tasks done
                                </span>
                            </div>
                        </div>

                        {/* Card 2: AT-RISK WORK */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    At-Risk Work
                                </span>
                                <span className={`font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mt-1.5 block ${atRiskTasks.length > 0 ? 'text-rose-500' : 'text-text-primary'}`}>
                                    {atRiskCountFormatted}
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Alert Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                {atRiskTasks.length > 0 ? (
                                    <span className="relative z-10 text-[10px] font-mono font-bold text-rose-500 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                        Zero-float critical path items
                                    </span>
                                ) : (
                                    <span className="relative z-10 text-[10px] font-mono font-semibold text-emerald-500 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Schedules on track
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Card 3: TEAM LOAD */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    Team Allocation
                                </span>
                                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mt-1.5 block">
                                    {String(teamLoadPct).padStart(2, '0')}%
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Capacity Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                <div
                                    className="absolute inset-y-0 left-0 bg-brand/15 border-r border-brand/30 transition-all duration-500"
                                    style={{ width: `${teamLoadPct}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-mono font-semibold text-text-muted">
                                    {uniqueAssignees.length} active contributors
                                </span>
                            </div>
                        </div>

                        {/* Card 4: BUDGET BURN */}
                        <div className="p-5 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase block">
                                    Budget & Story Points Burn
                                </span>
                                <span className="font-heading text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight mt-1.5 block font-mono">
                                    {String(budgetBurnPct).padStart(2, '0')}%
                                </span>
                            </div>
                            {/* Bottom Striped / Hatched Burn Box */}
                            <div className="h-9 w-full rounded-xl bg-hatched-pattern border border-surface-border/70 relative overflow-hidden flex items-center px-3">
                                <div
                                    className="absolute inset-y-0 left-0 bg-brand/15 border-r border-brand/30 transition-all duration-500"
                                    style={{ width: `${budgetBurnPct}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-mono font-semibold text-text-muted">
                                    {deliveredStoryPoints} of {totalStoryPoints} story points burned
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* ── MAIN STAGE: Visual Timeline ── */}
                    <div className="p-6 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="font-heading text-lg font-bold text-text-primary tracking-tight">
                                    Visual Timeline
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Cross-project delivery schedules and milestone buffers
                                </p>
                            </div>

                            {/* Segmented Control: [ Week | Month | Quarter ] */}
                            <div className="flex items-center rounded-xl border border-surface-border bg-surface p-1 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setTimelineScale('week')}
                                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        timelineScale === 'week'
                                            ? 'bg-brand text-white shadow-2xs'
                                            : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    Week
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTimelineScale('month')}
                                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        timelineScale === 'month'
                                            ? 'bg-brand text-white shadow-2xs'
                                            : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTimelineScale('quarter')}
                                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        timelineScale === 'quarter'
                                            ? 'bg-brand text-white shadow-2xs'
                                            : 'text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    Quarter
                                </button>
                            </div>
                        </div>

                        {/* Visual Gantt Lanes Container */}
                        <div className="divide-y divide-surface-border/60 border border-surface-border/70 rounded-xl overflow-hidden bg-surface/40">
                            {timelineProjects.map((p) => (
                                <div
                                    key={p.id}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-surface/80 transition-colors"
                                >
                                    {/* Project Name Label */}
                                    <div className="w-32 shrink-0">
                                        <span className="font-heading font-bold text-xs uppercase tracking-wider text-text-primary truncate block">
                                            {p.name}
                                        </span>
                                    </div>

                                    {/* Timeline Horizontal Track */}
                                    <div className="flex-1 h-8 rounded-lg bg-surface border border-surface-border/60 relative overflow-hidden flex items-center">
                                        {/* Primary Blue Gantt Bar */}
                                        <div
                                            className="h-5 rounded-md bg-brand shadow-xs absolute transition-all duration-300 flex items-center px-2 cursor-pointer hover:opacity-90"
                                            style={{
                                                left: `${p.startOffset}%`,
                                                width: `${p.barLength}%`,
                                            }}
                                            title={`${p.name}: Active Execution Bar`}
                                        />

                                        {/* Secondary Gray Milestone / Buffer Bar */}
                                        {p.secondStart && p.secondLength && (
                                            <div
                                                className="h-5 rounded-md bg-slate-400 dark:bg-slate-600 shadow-xs absolute transition-all duration-300 flex items-center px-2 cursor-pointer hover:opacity-90"
                                                style={{
                                                    left: `${p.secondStart}%`,
                                                    width: `${p.secondLength}%`,
                                                }}
                                                title={`${p.name}: Buffer / Phase 2 Bar`}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── ACTIONABLE TASK LEDGER ── */}
                    <div className="p-6 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-heading text-lg font-bold text-text-primary tracking-tight">
                                    Actionable Task Ledger
                                </h3>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Executive oversight on deliverables, due dates, and schedule constraints
                                </p>
                            </div>
                            <span className="text-xs font-mono text-text-muted font-semibold">
                                {allTasks.length} total tasks
                            </span>
                        </div>

                        {/* Task Ledger Rows */}
                        <div className="divide-y divide-surface-border/60 border border-surface-border/70 rounded-xl overflow-hidden bg-surface/40">
                            {allTasks.length === 0 ? (
                                <div className="p-8 text-center text-text-muted italic text-xs">
                                    No active tasks in the studio ledger.
                                </div>
                            ) : (
                                allTasks.slice(0, 8).map((task) => (
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
                                            {/* Assignee Pill */}
                                            <span className="px-2.5 py-0.5 rounded-full border border-surface-border bg-surface text-[11px] font-semibold text-text-muted">
                                                {task.assignee?.name || task.assignee || 'Unassigned'}
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
                canManage={true}
                currentUserId={auth?.user?.id}
            />
        </TenantLayout>
    );
}
