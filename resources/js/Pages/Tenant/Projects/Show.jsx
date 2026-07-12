import React, { useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProjectLayout from '@/Layouts/ProjectLayout';
import { CalendarDays, Clock, Columns3, Cpu, Plus, Search, TableProperties } from 'lucide-react';
import BestFitModal from '@/Components/ML/BestFitModal';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';
import ProjectAiAssistant from '@/Components/Tenant/Projects/ProjectAiAssistant';

const statuses = [
    { id: 'todo', title: 'To Do', className: 'bg-slate-500/15 text-slate-500' },
    { id: 'in_progress', title: 'In Progress', className: 'bg-brand/15 text-brand' },
    { id: 'review', title: 'In Review', className: 'bg-amber-500/15 text-amber-500' },
    { id: 'completed', title: 'Done', className: 'bg-emerald-500/15 text-emerald-500' },
];

function PriorityBadge({ priority }) {
    const colors = { Critical: 'bg-rose-500/15 text-rose-500 border-rose-500/30', High: 'bg-amber-500/15 text-amber-500 border-amber-500/30', Medium: 'bg-sky-500/15 text-sky-500 border-sky-500/30', Low: 'bg-slate-500/15 text-slate-500 border-slate-500/30' };
    return <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[priority] || colors.Medium}`}>{priority || 'Medium'}</span>;
}

function TaskAssignee({ task, onFindFit }) {
    if (!task.assignee) return <button onClick={() => onFindFit(task)} className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand hover:bg-brand hover:text-white"><Cpu className="h-3 w-3" />Find Fit</button>;
    return <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">{task.assignee.name.charAt(0)}</span><span className="max-w-28 truncate text-xs font-medium text-gray-700 dark:text-slate-300">{task.assignee.name}</span></div>;
}

function KanbanCard({ task, onFindFit }) {
    return <div className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${task.is_critical ? 'border-rose-400/60' : 'border-gray-200 dark:border-slate-800'}`}>
        <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-gray-400">#{task.id}</span><PriorityBadge priority={task.priority} /></div>
        <h4 className="mt-3 text-sm font-bold text-gray-900 dark:text-slate-100">{task.title}</h4>
        <p className="mt-1 truncate text-xs text-gray-500 dark:text-slate-400">{task.task_classification || 'Task'}</p>
        {(task.es !== null && task.ef !== null) && <div className="mt-3 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-mono text-slate-500 dark:bg-slate-950">ES {task.es} · EF {task.ef}{task.is_critical ? ' · Critical' : ''}</div>}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800"><TaskAssignee task={task} onFindFit={onFindFit} /><span className="flex items-center gap-1 font-mono text-[11px] text-gray-500"><Clock className="h-3 w-3" />{task.estimated_hours}h</span></div>
    </div>;
}

function Spreadsheet({ groups, onFindFit }) {
    return <div className="space-y-6 overflow-auto p-6">
        {groups.map(group => <section key={group.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50"><span className={`h-2 w-2 rounded-full ${group.id === 'completed' ? 'bg-emerald-500' : group.id === 'review' ? 'bg-amber-500' : group.id === 'in_progress' ? 'bg-brand' : 'bg-slate-400'}`} /><h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-300">{group.title}</h2><span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-slate-800">{group.tasks.length}</span></div>
            <div className="min-w-[850px]"><div className="grid grid-cols-[2fr_2fr_1.2fr_.8fr_.8fr_1fr] gap-4 border-b border-gray-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:border-slate-800"><span>Task</span><span>Description</span><span>Assignee</span><span>Hours</span><span>Priority</span><span>Status</span></div>{group.tasks.map(task => <div key={task.id} className="grid grid-cols-[2fr_2fr_1.2fr_.8fr_.8fr_1fr] items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-slate-800"><span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{task.title}</span><span className="truncate text-xs text-gray-500 dark:text-slate-400">{task.description || '—'}</span><TaskAssignee task={task} onFindFit={onFindFit} /><span className="font-mono text-xs text-gray-600 dark:text-slate-300">{task.estimated_hours}h</span><PriorityBadge priority={task.priority} /><span className={`w-fit rounded-full px-2 py-1 text-[10px] font-bold ${group.className}`}>{group.title}</span></div>)}{!group.tasks.length && <div className="px-4 py-7 text-center text-xs text-gray-400">No tasks in this status.</div>}</div>
        </section>)}
    </div>;
}

function Timeline({ tasks }) {
    const scheduled = tasks.filter(task => task.es !== null && task.ef !== null);
    const maxFinish = Math.max(1, ...scheduled.map(task => Number(task.ef)));
    const formatHours = hours => `${Number(hours).toFixed(1)}h · ${(Number(hours) / 8).toFixed(1)} working days`;

    return <div className="overflow-auto p-6"><div className="min-w-[720px] rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">CPA Timeline</h2><p className="mt-1 text-xs text-gray-500">Schedule values use working hours (8 hours per workday), not calendar days.</p></div><CalendarDays className="h-5 w-5 text-brand" /></div>{scheduled.length ? <div className="space-y-4">{scheduled.map(task => <div key={task.id} className="grid grid-cols-[190px_1fr] items-center gap-4"><div><p className="truncate text-xs font-semibold text-gray-800 dark:text-slate-200">{task.title}</p><p className="mt-0.5 font-mono text-[10px] text-gray-400">Start {formatHours(task.es)} · Finish {formatHours(task.ef)}</p></div><div className="relative h-7 rounded bg-slate-100 dark:bg-slate-800"><div title={`${formatHours(task.es)} – ${formatHours(task.ef)}`} className={`absolute top-1 h-5 rounded ${task.is_critical ? 'bg-rose-500' : 'bg-brand'}`} style={{ left: `${(Number(task.es) / maxFinish) * 100}%`, width: `${Math.max(3, ((Number(task.ef) - Number(task.es)) / maxFinish) * 100)}%` }} /></div></div>)}</div> : <div className="py-16 text-center text-sm text-gray-400">The timeline will appear once the background schedule calculation completes.</div>}</div></div>;
}

export default function Show({ project, studio, teamMembers, auth, skills = [], positions = [] }) {
    const pageProps = usePage().props;
    const [activeView, setActiveView] = useState('spreadsheet');
    const [searchQuery, setSearchQuery] = useState('');
    const [bestFitTask, setBestFitTask] = useState(null);
    const [isManualTaskOpen, setIsManualTaskOpen] = useState(false);
    const currentAuth = auth || pageProps.auth || { user: { name: 'Studio Member', role: 'manager' } };
    const allTasks = project?.tasks || [];
    const visibleTasks = useMemo(() => allTasks.filter(task => !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.assignee?.name?.toLowerCase().includes(searchQuery.toLowerCase())), [allTasks, searchQuery]);
    const groups = statuses.map(status => ({ ...status, tasks: visibleTasks.filter(task => task.status === status.id) }));
    const tabs = [{ id: 'spreadsheet', label: 'Spreadsheet', icon: TableProperties }, { id: 'timeline', label: 'Timeline', icon: CalendarDays }, { id: 'board', label: 'Board', icon: Columns3 }];

    const tenantId = studio?.id || pageProps.activeWorkspace || 'default';

    return <ProjectLayout auth={currentAuth} project={project}><Head title={`${project?.name || 'Project'} — Workspace`} /><div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80"><div className="flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveView(tab.id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeView === tab.id ? 'bg-white text-brand shadow-sm dark:bg-slate-700 dark:text-brand-light' : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}</div><div className="flex flex-1 items-center justify-end gap-3"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search tasks or assignees..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800" /></div><button onClick={() => setIsManualTaskOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm"><Plus className="h-4 w-4" />New Task</button></div></div>
        <div className="min-h-0 flex-1 overflow-auto">{activeView === 'spreadsheet' && <Spreadsheet groups={groups} onFindFit={setBestFitTask} />}{activeView === 'timeline' && <Timeline tasks={visibleTasks} />}{activeView === 'board' && <div className="flex min-w-max gap-5 p-6">{groups.map(group => <section key={group.id} className="flex w-80 flex-col rounded-2xl border border-gray-200 bg-gray-100/70 dark:border-slate-800 dark:bg-slate-900/50"><header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-800"><h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-slate-200">{group.title}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${group.className}`}>{group.tasks.length}</span></header><div className="space-y-3 p-3">{group.tasks.map(task => <KanbanCard key={task.id} task={task} onFindFit={setBestFitTask} />)}{!group.tasks.length && <p className="py-10 text-center text-xs text-gray-400">No tasks in {group.title}</p>}</div></section>)}</div>}</div>
    </div><ManualTaskModal isOpen={isManualTaskOpen} onClose={() => setIsManualTaskOpen(false)} project={project} tenantId={tenantId} teamMembers={teamMembers} skills={skills} positions={positions} /><BestFitModal isOpen={Boolean(bestFitTask)} onClose={() => setBestFitTask(null)} task={bestFitTask} teamMembers={teamMembers} tenantId={tenantId} /><ProjectAiAssistant projectId={project.id} tenantId={tenantId} /></ProjectLayout>;
}
