import React, { useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProjectLayout from '@/Layouts/ProjectLayout';
import { CalendarDays, Clock, Columns3, Cpu, Plus, Search, TableProperties, AlertTriangle, Flame, CheckCircle2, Edit2, Flag } from 'lucide-react';
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

function TaskAssignee({ task, onFindFit }) {
    if (!task.assignee) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onFindFit(task); }}
                className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
            >
                <Cpu className="h-3 w-3" />
                Find Fit
            </button>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                {task.assignee.name.charAt(0)}
            </span>
            <span className="max-w-28 truncate text-xs font-medium text-gray-700 dark:text-slate-300">
                {task.assignee.name}
            </span>
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

function KanbanCard({ task, onFindFit, onEdit, projectStartDate }) {
    const isDelayed = task.total_float !== null && task.total_float !== undefined && Number(task.total_float) < 0;

    return (
        <div
            onClick={() => onEdit(task)}
            className={`group cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
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

function Spreadsheet({ groups, onFindFit, onEdit, projectStartDate }) {
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
                            const finishDateStr = projectStartDate && task.ef !== null ? deriveCalendarDate(projectStartDate, task.ef) : (task.ef !== null ? `Hour ${task.ef}` : '—');
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => onEdit(task)}
                                    className="group grid grid-cols-[2fr_1.6fr_1.2fr_.8fr_1fr_.8fr_1fr_.6fr] items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
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
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                            title="Edit Task Specs & CPA Anchor"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
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
    const scheduled = tasks.filter(task => task.es !== null && task.ef !== null);
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
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Delayed / Critical</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand inline-block" /> Standard Flow</span>
                    </div>
                </div>

                {scheduled.length ? (
                    <div className="space-y-5">
                        {scheduled.map(task => {
                            const isDelayed = task.total_float !== null && task.total_float !== undefined && Number(task.total_float) < 0;
                            const isCrit = task.is_critical || (task.total_float !== null && Number(task.total_float) === 0);
                            const startStr = project.start_date ? deriveCalendarDate(project.start_date, task.es) : `Hour ${task.es}`;
                            const finishStr = project.start_date ? deriveCalendarDate(project.start_date, task.ef) : `Hour ${task.ef}`;

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => onEdit(task)}
                                    className={`grid grid-cols-[240px_1fr_180px] items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                                        isDelayed
                                            ? 'border-rose-300 bg-rose-50/40 dark:border-rose-800/60 dark:bg-rose-950/20'
                                            : isCrit
                                            ? 'border-amber-200 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10'
                                            : 'border-transparent hover:border-gray-200 hover:bg-gray-50/50 dark:hover:border-slate-800 dark:hover:bg-slate-800/30'
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
                                                isDelayed ? 'bg-rose-600 animate-pulse' : isCrit ? 'bg-amber-500' : 'bg-brand'
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
    const [activeView, setActiveView] = useState('spreadsheet');
    const [searchQuery, setSearchQuery] = useState('');
    const [bestFitTask, setBestFitTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [isManualTaskOpen, setIsManualTaskOpen] = useState(false);

    const currentAuth = auth || pageProps.auth || { user: { name: 'Studio Member', role: 'manager' } };
    const allTasks = project?.tasks || [];
    const visibleTasks = useMemo(() => {
        return allTasks.filter(task => !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.assignee?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allTasks, searchQuery]);

    const groups = statuses.map(status => ({
        ...status,
        tasks: visibleTasks.filter(task => task.status === status.id)
    }));

    const tabs = [
        { id: 'spreadsheet', label: 'Spreadsheet', icon: TableProperties },
        { id: 'timeline',    label: 'CPA Gantt Timeline', icon: CalendarDays },
        { id: 'board',       label: 'Board', icon: Columns3 }
    ];

    const tenantId = studio?.id || pageProps.activeWorkspace || 'default';

    const handleNewTask = () => {
        setEditingTask(null);
        setIsManualTaskOpen(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsManualTaskOpen(true);
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

                        <button
                            onClick={handleNewTask}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-light px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            New Task
                        </button>
                    </div>
                </div>

                {/* View Views */}
                <div className="min-h-0 flex-1 overflow-auto">
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
                                <section key={group.id} className="flex w-80 flex-col rounded-2xl border border-gray-200 bg-gray-100/70 dark:border-slate-800 dark:bg-slate-900/50">
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

            <ProjectAiAssistant projectId={project.id} tenantId={tenantId} />
        </ProjectLayout>
    );
}
