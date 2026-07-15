import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProjectLayout from '@/Layouts/ProjectLayout';
import { BarChart3, CalendarDays, Clock, Columns3, Cpu, Plus, Search, TableProperties, AlertTriangle, Flame, CheckCircle2, Edit2, Flag } from 'lucide-react';
import axios from 'axios';
import BestFitModal from '@/Components/ML/BestFitModal';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
import ProjectAiAssistant from '@/Components/Tenant/Projects/ProjectAiAssistant';
import CpaStatusBadge from '@/Components/Tenant/CpaStatusBadge';

const statuses = [
    { id: 'todo', title: 'To Do', className: 'bg-slate-500/15 text-slate-500' },
    { id: 'in_progress', title: 'In Progress', className: 'bg-brand/15 text-brand' },
    { id: 'review', title: 'In Review', className: 'bg-amber-500/15 text-amber-500' },
    { id: 'completed', title: 'Done', className: 'bg-emerald-500/15 text-emerald-500' },
];

const priorityWeight = {
    critical: 0,
    Critical: 0,
    CRITICAL: 0,
    high: 1,
    High: 1,
    HIGH: 1,
    medium: 2,
    Medium: 2,
    MEDIUM: 2,
    low: 3,
    Low: 3,
    LOW: 3,
};

function sortByPriorityAndCriticality(tasks) {
    return [...tasks].sort((a, b) => {
        const aCritical = a.is_critical || (a.total_float !== null && Number(a.total_float) <= 0);
        const bCritical = b.is_critical || (b.total_float !== null && Number(b.total_float) <= 0);
        if (aCritical !== bCritical) return aCritical ? -1 : 1;
        const aPri = priorityWeight[String(a.priority || 'Medium').toLowerCase()] ?? 2;
        const bPri = priorityWeight[String(b.priority || 'Medium').toLowerCase()] ?? 2;
        if (aPri !== bPri) return aPri - bPri;
        const aES = a.es !== null ? Number(a.es) : 999999;
        const bES = b.es !== null ? Number(b.es) : 999999;
        if (aES !== bES) return aES - bES;
        return Number(a.id ?? 0) - Number(b.id ?? 0);
    });
}

function PriorityBadge({ priority }) {
    const colors = {
        Critical: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
        High: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        Medium: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
        Low: 'bg-slate-500/15 text-slate-500 border-slate-500/30'
    };
    return (
        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[priority] || colors.Medium}`}>
            {priority || 'Medium'}
        </span>
    );
}

function isUserAssignedToTask(task, authUser) {
    if (!authUser?.id) return false;
    const userId = Number(authUser.id);
    if (Number(task.assigned_user_id) === userId) return true;
    if (Array.isArray(task.assignees) && task.assignees.some(m => Number(m.id) === userId)) return true;
    if (task.assignee && Number(task.assignee.id) === userId) return true;
    return false;
}

function TaskAssignee({ task, onFindFit }) {
    const { canManage } = usePage().props;
    // An explicit empty array means every active assignment was removed.
    // Only use the legacy primary assignee when this payload omits the new field.
    const assignees = Array.isArray(task.assignees)
        ? task.assignees
        : (task.assignee ? [task.assignee] : []);

    if (!assignees.length) {
        return canManage ? (
            <button
                onClick={(e) => { e.stopPropagation(); onFindFit(task); }}
                className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
            >
                <Cpu className="h-3 w-3" />
                Assign member
            </button>
        ) : (
            <span className="text-xs italic text-gray-400 dark:text-slate-500">Unassigned</span>
        );
    }
    return (
        <div className="flex min-w-0 items-center gap-1.5" title={assignees.map(member => member.name).join(', ')}>
            <div className="flex -space-x-1.5">
                {assignees.slice(0, 3).map(member => (
                    <span key={member.id} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand text-[10px] font-bold text-white dark:border-slate-900">
                        {member.name.charAt(0).toUpperCase()}
                    </span>
                ))}
            </div>
            <span className="max-w-36 truncate text-xs font-medium text-gray-700 dark:text-slate-300">
                {assignees.map(member => member.name).join(', ')}
            </span>
            {assignees.length > 3 && (
                <span className="text-[10px] font-bold text-gray-400">+{assignees.length - 3}</span>
            )}
        </div>
    );
}

// Helper: Derive calendar date from project start date and working hours
function deriveCalendarDate(startDateStr, hoursOffset) {
    if (!startDateStr || hoursOffset === null || hoursOffset === undefined) return null;
    const daysOffset = Math.floor(Number(hoursOffset) / 8);
    const date = new Date(startDateStr);
    let added = 0;
    while (added < daysOffset) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            added++;
        }
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function KanbanCard({ task, onFindFit, onEdit, projectStartDate, onDragStart }) {
    const { canManage, auth } = usePage().props;
    const isClickable = canManage || isUserAssignedToTask(task, auth?.user);
    const isDelayed = task.total_float !== null && task.total_float !== undefined && Number(task.total_float) < 0;
    const canMove = isClickable && task.status !== 'completed';

    return (
        <div
            draggable={canMove}
            onDragStart={(event) => {
                if (!canMove) return;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(task.id));
                onDragStart?.(task);
            }}
            onClick={() => isClickable && onEdit(task)}
            className={`group rounded-xl border bg-white p-4 shadow-sm transition-all dark:bg-slate-900 ${
                canMove ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : isClickable ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
            } ${
                isDelayed
                    ? 'border-rose-400/80 bg-rose-50/20 dark:border-rose-500/50 dark:bg-rose-950/20'
                    : task.is_critical
                    ? 'border-amber-400/80 dark:border-amber-500/50'
                    : 'border-gray-200 dark:border-slate-800'
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-gray-400">#{task.id}</span>
                    {task.hard_constraint_date && (
                        <span title={`Fixed Deadline: ${task.hard_constraint_date}`} className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-300">
                            <Flag className="w-2.5 h-2.5" /> Fixed
                        </span>
                    )}
                </div>
                <PriorityBadge priority={task.priority} />
            </div>

            <h4 className="mt-2.5 text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-brand transition-colors">
                {task.title}
            </h4>
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-slate-400">
                {task.task_classification || 'Engineering'}
            </p>

            <div className="mt-3 flex items-center justify-between">
                <CpaStatusBadge totalFloat={task.total_float} isCritical={task.is_critical} />
                {(task.es !== null && task.ef !== null) && (
                    <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400">
                        {projectStartDate ? deriveCalendarDate(projectStartDate, task.ef) : `EF ${task.ef}h`}
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
                <TaskAssignee task={task} onFindFit={onFindFit} />
                <span className="flex items-center gap-1 font-mono text-[11px] text-gray-500">
                    <Clock className="h-3 w-3" />
                    {task.estimated_hours}h
                </span>
            </div>
        </div>
    );
}

function ProjectDashboard({ project, tasks }) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const activeTasks = tasks.filter(task => ['todo', 'in_progress', 'review'].includes(task.status)).length;
    const criticalTasks = tasks.filter(task => task.is_critical || Number(task.total_float) === 0).length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const estimatedHours = tasks.reduce((sum, task) => sum + Number(task.estimated_hours || 0), 0);
    const completedHours = tasks
        .filter(task => task.status === 'completed')
        .reduce((sum, task) => sum + Number(task.estimated_hours || 0), 0);
    const statusRows = statuses.map(status => {
        const count = tasks.filter(task => task.status === status.id).length;
        return {
            ...status,
            count,
            pct: totalTasks ? Math.round((count / totalTasks) * 100) : 0,
        };
    });
    const nextCriticalTasks = sortByPriorityAndCriticality(tasks)
        .filter(task => task.status !== 'completed')
        .slice(0, 5);

    return (
        <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {/* Metric 1: Completion Gauge */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between h-32">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Completion Rate</p>
                        <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-slate-100">{completionRate}%</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{completedTasks}/{totalTasks} tasks done</p>
                    </div>
                    <div className="relative h-14 w-14 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(156,163,175,0.12)" strokeWidth="3" />
                            <circle
                                cx="18" cy="18" r="16" fill="none"
                                stroke="url(#completionGrad)"
                                strokeWidth="3.5"
                                strokeDasharray="100.5"
                                strokeDashoffset={100.5 - (completionRate * 1.005)}
                                strokeLinecap="round"
                                className="transition-all duration-500 ease-out"
                            />
                            <defs>
                                <linearGradient id="completionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#4f46e5" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-indigo-600 dark:text-indigo-450">
                            {completionRate}%
                        </div>
                    </div>
                </div>

                {/* Metric 2: Sparkline Trend */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-32">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Tasks</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{activeTasks} Items</p>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50/50 dark:bg-indigo-950/20">
                                In Progress
                            </span>
                        </div>
                    </div>
                    <div className="w-full h-8 mt-2 overflow-visible">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path
                                d={`M 0 ${30 - (Math.max(10, activeTasks * 5) / 100) * 20} L 20 22 L 40 18 L 60 25 L 80 15 L 100 10`}
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d={`M 0 ${30 - (Math.max(10, activeTasks * 5) / 100) * 20} L 20 22 L 40 18 L 60 25 L 80 15 L 100 10 L 100 30 L 0 30 Z`}
                                fill="url(#activeSparkGrad)"
                                opacity="0.12"
                            />
                            <defs>
                                <linearGradient id="activeSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4f46e5" />
                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Metric 3: Critical Attention */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-32">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Critical Tasks</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-slate-100">{criticalTasks} Items</p>
                    </div>
                    <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-rose-600 dark:text-rose-450">
                            <span>Zero Float Risk</span>
                            <span>{criticalTasks > 0 ? 'Urgent' : 'Nominal'}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                            <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                                style={{ width: `${totalTasks ? (criticalTasks / totalTasks) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Metric 4: Hours Completed */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-32">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hours Burned</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-slate-100">{completedHours}h Done</p>
                    </div>
                    <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-450">
                            <span>Burn Velocity</span>
                            <span>{estimatedHours ? Math.round((completedHours / estimatedHours) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${estimatedHours ? (completedHours / estimatedHours) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_.8fr]">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Status Distribution</h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Visual status breakdown of all project tasks.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        {/* Donut Chart SVG */}
                        <div className="relative flex justify-center py-2">
                            <svg width="150" height="150" viewBox="0 0 36 36" className="rotate-[-90deg]">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(156,163,175,0.08)" strokeWidth="3" />
                                {statusRows.map((seg, idx) => {
                                    let cumulative = 0;
                                    for (let i = 0; i < idx; i++) {
                                        cumulative += statusRows[i].pct;
                                    }
                                    const strokeColors = {
                                        completed: '#10b981',
                                        review: '#f59e0b',
                                        in_progress: '#4f46e5',
                                        todo: '#9ca3af'
                                    };
                                    return (
                                        <circle
                                            key={seg.id}
                                            cx="18" cy="18" r="15.915"
                                            fill="none"
                                            stroke={strokeColors[seg.id] || '#cbd5e1'}
                                            strokeWidth="4"
                                            strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                                            strokeDashoffset={100 - cumulative}
                                            className="transition-all duration-300 hover:stroke-[5]"
                                        />
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-gray-900 dark:text-slate-100">{totalTasks}</span>
                                <span className="text-[9px] font-bold text-gray-455 uppercase tracking-widest">Tasks</span>
                            </div>
                        </div>

                        {/* Status Legend List */}
                        <div className="space-y-3">
                            {statusRows.map(row => {
                                const dotColors = {
                                    completed: 'bg-emerald-500',
                                    review: 'bg-amber-500',
                                    in_progress: 'bg-brand',
                                    todo: 'bg-slate-400'
                                };
                                return (
                                    <div key={row.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 dark:border-slate-800/40">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`h-2.5 w-2.5 rounded-full ${dotColors[row.id]}`} />
                                            <span className="text-xs font-semibold text-gray-700 dark:text-slate-350">{row.title}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-extrabold text-gray-900 dark:text-slate-100">{row.count}</span>
                                            <span className="text-[10px] text-gray-400 ml-1.5">({row.pct}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Project Details</h2>
                    <div className="mt-4 space-y-3 text-sm">
                        {[
                            ['Name', project.name || 'Untitled project'],
                            ['Status', project.status || 'planning'],
                            ['Start Date', project.start_date || 'Not set'],
                            ['Target End', project.target_end_date || 'Not set'],
                            ['Description', project.description || 'No description provided.'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 dark:border-slate-800">
                                <span className="text-gray-500 dark:text-slate-400">{label}</span>
                                <span className="max-w-[65%] text-right font-semibold text-gray-900 dark:text-slate-100 truncate">{value}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-rose-500" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Auto-Priority Queue</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {nextCriticalTasks.length ? nextCriticalTasks.map(task => (
                        <div key={task.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-sm">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900 dark:text-slate-100">{task.title}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{task.task_classification || 'Task'} - {task.estimated_hours || 0}h</p>
                            </div>
                            <PriorityBadge priority={task.priority} />
                            <CpaStatusBadge totalFloat={task.total_float} isCritical={task.is_critical} />
                        </div>
                    )) : (
                        <p className="py-6 text-center text-sm text-gray-400">No open priority tasks.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

function Spreadsheet({ groups, onFindFit, onEdit, projectStartDate }) {
    const { canManage, auth } = usePage().props;
    return (
        <div className="space-y-6 overflow-auto p-6">
            {groups.map(group => (
                <section key={group.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                        <span className={`h-2 w-2 rounded-full ${group.id === 'completed' ? 'bg-emerald-500' : group.id === 'review' ? 'bg-amber-500' : group.id === 'in_progress' ? 'bg-brand' : 'bg-slate-400'}`} />
                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-300">{group.title}</h2>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-slate-800">{group.tasks.length}</span>
                    </div>

                    <div className="min-w-[950px]">
                        <div className="grid grid-cols-[2fr_1.6fr_1.2fr_.8fr_1fr_.8fr_1fr_.6fr] gap-4 border-b border-gray-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:border-slate-800">
                            <span>Task</span>
                            <span>CPA Status</span>
                            <span>Assignee</span>
                            <span>Hours</span>
                            <span>Target Finish</span>
                            <span>Priority</span>
                            <span>Status</span>
                            <span className="text-right">Actions</span>
                        </div>

                        {group.tasks.map(task => {
                            const isClickable = canManage || isUserAssignedToTask(task, auth?.user);
                            const finishDateStr = projectStartDate && task.ef !== null ? deriveCalendarDate(projectStartDate, task.ef) : (task.ef !== null ? `Hour ${task.ef}` : '—');
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => isClickable && onEdit(task)}
                                    className={`group grid grid-cols-[2fr_1.6fr_1.2fr_.8fr_1fr_.8fr_1fr_.6fr] items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[10px] text-gray-400">#{task.id}</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate group-hover:text-brand">{task.title}</span>
                                        </div>
                                        <span className="block text-[11px] text-gray-500 dark:text-slate-400 truncate">{task.description || '—'}</span>
                                    </div>

                                    <div>
                                        <CpaStatusBadge totalFloat={task.total_float} isCritical={task.is_critical} />
                                    </div>

                                    <div>
                                        <TaskAssignee task={task} onFindFit={onFindFit} />
                                    </div>

                                    <span className="font-mono text-xs text-gray-600 dark:text-slate-300">{task.estimated_hours}h</span>

                                    <div className="text-xs text-gray-700 dark:text-slate-300">
                                        <span className="block font-medium">{finishDateStr}</span>
                                        {task.hard_constraint_date && (
                                            <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-mono">Fixed: {task.hard_constraint_date}</span>
                                        )}
                                    </div>

                                    <div>
                                        <PriorityBadge priority={task.priority} />
                                    </div>

                                    <div>
                                        <span className={`w-fit rounded-full px-2 py-1 text-[10px] font-bold ${group.className}`}>{group.title}</span>
                                    </div>

                                    <div className="text-right">
                                        {isClickable && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                                title="Edit Task Specs & CPA Anchor"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {!group.tasks.length && (
                            <div className="px-4 py-7 text-center text-xs text-gray-400">No tasks in this status.</div>
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
}

function Timeline({ tasks, project, onEdit }) {
    const { canManage, auth } = usePage().props;
    const scheduled = sortByPriorityAndCriticality(tasks.filter(task => task.es !== null && task.ef !== null));
    const maxFinish = Math.max(1, ...scheduled.map(task => Number(task.ef)));
    const formatHours = hours => `${Number(hours).toFixed(1)}h (${(Number(hours) / 8).toFixed(1)} days)`;

    // Calculate project-level metrics
    const hasDelayed = scheduled.some(t => t.total_float !== null && Number(t.total_float) < 0);
    const criticalCount = scheduled.filter(t => t.is_critical || (t.total_float !== null && Number(t.total_float) === 0)).length;

    return (
        <div className="overflow-auto p-6 space-y-6">
            {/* Summary Bar */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Project Anchor Start</span>
                    <span className="mt-1 block text-sm font-bold text-gray-900 dark:text-slate-100 font-mono">
                        {project.start_date || 'Not Set (Defaults to Today)'}
                    </span>
                </div>
                <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Target Deadline</span>
                    <span className="mt-1 block text-sm font-bold text-gray-900 dark:text-slate-100 font-mono">
                        {project.target_end_date || 'No Target Anchor'}
                    </span>
                </div>
                <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Scheduled Tasks</span>
                    <span className="mt-1 block text-sm font-bold text-gray-900 dark:text-slate-100">
                        {scheduled.length} of {tasks.length} ({criticalCount} Critical Path)
                    </span>
                </div>
                <div className="flex items-center justify-start md:justify-end">
                    {hasDelayed ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold animate-pulse">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            Project Schedule Breached
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Schedule Healthy
                        </div>
                    )}
                </div>
            </div>

            {/* Gantt Chart Panel */}
            <div className="min-w-[850px] rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Dynamic Critical Path Analysis (CPA) Gantt</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Auto-derived early start (ES), early finish (EF), and float slack based on project network dependencies.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Completed</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> In Progress</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Delayed / Critical</span>
                    </div>
                </div>

                {scheduled.length ? (
                    <div className="space-y-5">
                        {scheduled.map(task => {
                            const isClickable = canManage || isUserAssignedToTask(task, auth?.user);
                            const isDelayed = task.total_float !== null && task.total_float !== undefined && Number(task.total_float) < 0;
                            const isCrit = task.is_critical || (task.total_float !== null && Number(task.total_float) === 0);
                            const isCompleted = task.status === 'completed';
                            const startStr = project.start_date ? deriveCalendarDate(project.start_date, task.es) : `Hour ${task.es}`;
                            const finishStr = project.start_date ? deriveCalendarDate(project.start_date, task.ef) : `Hour ${task.ef}`;
                            const statusLabel = task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : task.status === 'review' ? 'In Review' : 'To Do';

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => isClickable && onEdit(task)}
                                    className={`grid grid-cols-[240px_1fr_180px] items-center gap-4 p-3 rounded-xl border transition-all ${
                                        isClickable
                                            ? 'cursor-pointer hover:border-gray-200 hover:bg-gray-50/50 dark:hover:border-slate-800 dark:hover:bg-slate-800/30'
                                            : 'cursor-default'
                                    } ${
                                        isDelayed
                                            ? 'border-rose-300 bg-rose-50/40 dark:border-rose-800/60 dark:bg-rose-950/20'
                                            : isCrit
                                            ? 'border-amber-200 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10'
                                            : 'border-transparent'
                                    }`}
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-[10px] text-gray-400">#{task.id}</span>
                                            <p className="truncate text-xs font-bold text-gray-900 dark:text-slate-100 hover:text-brand">{task.title}</p>
                                        </div>
                                        <p className="mt-1 font-mono text-[10px] text-gray-500 dark:text-slate-400">
                                            {startStr} → {finishStr} ({task.estimated_hours}h)
                                        </p>
                                    </div>

                                    {/* Bar visualizer */}
                                    <div className="relative h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 overflow-hidden px-1 flex items-center">
                                        <div
                                            title={`ES ${task.es} - EF ${task.ef} (${task.estimated_hours}h)`}
                                            className={`absolute top-1.5 h-5 rounded-md shadow-sm flex items-center justify-between px-2 text-[10px] font-bold text-white transition-all ${
                                                isCompleted ? 'bg-emerald-500' : isDelayed ? 'bg-rose-600 animate-pulse' : isCrit ? 'bg-amber-500' : task.status === 'in_progress' ? 'bg-indigo-500' : 'bg-brand'
                                            }`}
                                            style={{
                                                left: `${(Number(task.es) / maxFinish) * 100}%`,
                                                width: `${Math.max(6, ((Number(task.ef) - Number(task.es)) / maxFinish) * 100)}%`
                                            }}
                                        >
                                            <span className="truncate">{task.estimated_hours}h</span>
                                        </div>
                                    </div>

                                    {/* Status Badge & Actions */}
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                            isCompleted
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : task.status === 'in_progress'
                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                                : task.status === 'review'
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>{statusLabel}</span>
                                        <CpaStatusBadge totalFloat={task.total_float} isCritical={task.is_critical} showSlack={true} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-16 text-center text-sm text-gray-400">
                        The timeline will appear once tasks are created with estimated hours and dependency links.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Show({ project, studio, teamMembers, auth, skills = [], positions = [] }) {
    const pageProps = usePage().props;
    const { canManage } = pageProps;
    const [activeView, setActiveView] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [bestFitTask, setBestFitTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [isManualTaskOpen, setIsManualTaskOpen] = useState(false);
    const [taskRows, setTaskRows] = useState(project?.tasks || []);
    const [draggedTask, setDraggedTask] = useState(null);
    const [hoveredColId, setHoveredColId] = useState(null);

    const currentAuth = auth || pageProps.auth || { user: { name: 'Studio Member', role: 'manager' } };
    const allTasks = taskRows;

    useEffect(() => {
        setTaskRows(project?.tasks || []);
    }, [project?.id, project?.tasks]);

    const visibleTasks = useMemo(() => {
        return sortByPriorityAndCriticality(allTasks.filter(task => !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.assignee?.name?.toLowerCase().includes(searchQuery.toLowerCase())));
    }, [allTasks, searchQuery]);

    const groups = statuses.map(status => ({
        ...status,
        tasks: sortByPriorityAndCriticality(visibleTasks.filter(task => task.status === status.id))
    }));

    const tabs = [
        { id: 'dashboard',   label: 'Dashboard', icon: BarChart3 },
        { id: 'spreadsheet', label: 'Spreadsheet', icon: TableProperties },
        { id: 'timeline',    label: 'CPA Gantt Timeline', icon: CalendarDays },
        { id: 'board',       label: 'Board', icon: Columns3 }
    ];

    const tenantId = studio?.id || pageProps.activeWorkspace || 'default';

    const handleNewTask = () => {
        if (!canManage) return;
        setEditingTask(null);
        setIsManualTaskOpen(true);
    };

    const handleEditTask = (task) => {
        if (!canManage && !isUserAssignedToTask(task, pageProps.auth?.user)) {
            return;
        }
        setEditingTask(task);
        setIsManualTaskOpen(true);
    };

    const handleDropTask = async (targetStatus) => {
        if (!draggedTask || draggedTask.status === targetStatus) {
            setDraggedTask(null);
            setHoveredColId(null);
            return;
        }

        const previousRows = taskRows;
        setTaskRows(rows => rows.map(task => task.id === draggedTask.id ? { ...task, status: targetStatus } : task));
        setDraggedTask(null);
        setHoveredColId(null);

        try {
            await axios.patch(route('tenant.projects.tasks.update', { tenant: tenantId, project: project.id, task: draggedTask.id }), {
                status: targetStatus,
            });
        } catch (error) {
            setTaskRows(previousRows);
            console.error('Unable to move task', error);
        }
    };

    return (
        <ProjectLayout auth={currentAuth} project={project}>
            <Head title={`${project?.name || 'Project'} — Workspace`} />
            <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
                {/* Top Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveView(tab.id)}
                                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                                        activeView === tab.id
                                            ? 'bg-white text-brand shadow-sm dark:bg-slate-700 dark:text-brand-light'
                                            : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-1 items-center justify-end gap-3">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchQuery}
                                onChange={event => setSearchQuery(event.target.value)}
                                placeholder="Search tasks or assignees..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>

                        {canManage && (
                            <button
                                onClick={handleNewTask}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-light px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                New Task
                            </button>
                        )}
                    </div>
                </div>

                {/* View Views */}
                <div className="min-h-0 flex-1 overflow-auto">
                    {activeView === 'dashboard' && (
                        <ProjectDashboard project={project} tasks={allTasks} />
                    )}

                    {activeView === 'spreadsheet' && (
                        <Spreadsheet
                            groups={groups}
                            onFindFit={setBestFitTask}
                            onEdit={handleEditTask}
                            projectStartDate={project?.start_date}
                        />
                    )}

                    {activeView === 'timeline' && (
                        <Timeline
                            tasks={visibleTasks}
                            project={project}
                            onEdit={handleEditTask}
                        />
                    )}

                    {activeView === 'board' && (
                        <div className="flex min-w-max gap-5 p-6">
                            {groups.map(group => (
                                <section
                                    key={group.id}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        if (hoveredColId !== group.id) {
                                            setHoveredColId(group.id);
                                        }
                                    }}
                                    onDragLeave={() => {
                                        setHoveredColId(null);
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        handleDropTask(group.id);
                                    }}
                                    className={`flex w-80 flex-col rounded-2xl border transition-all duration-200 ${
                                        hoveredColId === group.id && draggedTask && draggedTask.status !== group.id
                                            ? 'border-brand ring-2 ring-brand/10 bg-brand/5'
                                            : 'border-gray-250 dark:border-slate-800 bg-gray-100/70 dark:bg-slate-900/50'
                                    }`}
                                >
                                    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800">
                                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-200">{group.title}</h2>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${group.className}`}>{group.tasks.length}</span>
                                    </header>
                                    <div className="space-y-3 p-3 overflow-y-auto max-h-[calc(100vh-230px)]">
                                        {group.tasks.map(task => (
                                            <KanbanCard
                                                key={task.id}
                                                task={task}
                                                onFindFit={setBestFitTask}
                                                onEdit={handleEditTask}
                                                projectStartDate={project?.start_date}
                                                onDragStart={setDraggedTask}
                                            />
                                        ))}
                                        {!group.tasks.length && (
                                            <p className="py-10 text-center text-xs text-gray-400">No tasks in {group.title}</p>
                                        )}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ManualTaskModal
                isOpen={isManualTaskOpen}
                onClose={() => setIsManualTaskOpen(false)}
                project={project}
                tenantId={tenantId}
                teamMembers={teamMembers}
                skills={skills}
                positions={positions}
                editingTask={editingTask}
            />

            <BestFitModal
                isOpen={Boolean(bestFitTask)}
                onClose={() => setBestFitTask(null)}
                task={bestFitTask}
                teamMembers={teamMembers}
                tenantId={tenantId}
            />

            <ProjectAiAssistant
                projectId={project.id}
                tenantId={tenantId}
                teamMembers={teamMembers}
                canManage={canManage}
            />
        </ProjectLayout>
    );
}
