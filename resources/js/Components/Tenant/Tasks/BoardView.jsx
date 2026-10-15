import React, { useState } from 'react';
import { showToast } from '@/Components/SystemToast';

// ── Inline Icons ──────────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);
const MoreIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    </svg>
);
const AttachIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const CommentIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const AlertTriangleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// ── Overdue Helpers ───────────────────────────────────────────────────────────
export function isTaskOverdue(task) {
    if (!task) return false;
    const status = task.status || task.sprint_status || '';
    if (status === 'completed' || status === 'done') return false;
    if (status === 'overdue') return true;

    if (task.days_until_deadline !== null && task.days_until_deadline !== undefined) {
        if (Number(task.days_until_deadline) < 0) return true;
    }

    if (task.dueDate) {
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        if (due.getTime() < today.getTime()) return true;
    }

    if (task.hard_constraint_date) {
        const hard = new Date(task.hard_constraint_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        hard.setHours(0, 0, 0, 0);
        if (hard.getTime() < today.getTime()) return true;
    }

    return false;
}

export function getOverdueDays(task) {
    if (!task) return 0;
    if (task.days_until_deadline !== null && task.days_until_deadline !== undefined && Number(task.days_until_deadline) < 0) {
        return Math.abs(Number(task.days_until_deadline));
    }
    const targetDate = task.dueDate || task.hard_constraint_date;
    if (targetDate) {
        const due = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - due.getTime();
        if (diffMs > 0) {
            return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
    }
    return 1;
}

// ── Tag Pills ─────────────────────────────────────────────────────────────────
const TAG_COLORS = {
    Web:     'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    Saas:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    Mobile:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Design:  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    AI:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Backend: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

function TagPill({ tag }) {
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-wider ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {tag}
        </span>
    );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick, onDragStart }) {
    const overdue = isTaskOverdue(task);
    const overdueDays = getOverdueDays(task);

    const assigneeName = typeof task.assignee === 'string'
        ? task.assignee
        : (task.assignee?.name || 'Unassigned');

    return (
        <div
            draggable={task.status !== 'completed'}
            onDragStart={(event) => {
                if (task.status === 'completed') return;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(task.id));
                onDragStart?.(task);
            }}
            onClick={onClick}
            className={`group rounded-2xl bg-white dark:bg-slate-900 border p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col gap-3 ${
                overdue
                    ? 'border-rose-300/80 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-400 dark:hover:border-rose-700'
                    : 'border-gray-200 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-500/50'
            }`}
        >
            {/* Top row: Project / Client & Overdue badge */}
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium truncate">
                    {task.project_name ? task.project_name : (task.client ? `Client: ${task.client}` : `Task #${task.id}`)}
                </p>
                {overdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800 shrink-0 shadow-2xs">
                        <AlertTriangleIcon />
                        <span>{overdueDays > 0 ? `${overdueDays}d Late` : 'Overdue'}</span>
                    </span>
                )}
            </div>

            {/* Task title */}
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                {task.title}
            </h4>

            {/* Assignee + priority + tags row */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {assigneeName.charAt(0) || '?'}
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-slate-400 truncate max-w-[90px]">
                        {assigneeName}
                    </span>
                </div>
                {task.priority && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                        String(task.priority).toLowerCase() === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                        String(task.priority).toLowerCase() === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                        {task.priority}
                    </span>
                )}
                {task.tags?.map(tag => <TagPill key={tag} tag={tag} />)}
            </div>

            {/* Footer stats */}
            <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><AttachIcon />{task.attachments ?? 0}</span>
                    <span className="flex items-center gap-1 font-semibold text-gray-600 dark:text-slate-300">{task.progress ?? (task.status === 'completed' ? 100 : 0)}%</span>
                    <span className="flex items-center gap-1"><CommentIcon />{task.comments ?? 0}</span>
                </div>
                {overdue ? (
                    <span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                        <ClockIcon />
                        {task.dueDate ? `Due ${task.dueDate}` : `${overdueDays}d late`}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
                        <ClockIcon />
                        {task.dueDate ? task.dueDate : (task.days_until_deadline !== null && task.days_until_deadline !== undefined ? `${task.days_until_deadline}d left` : 'No due date')}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Column Configuration ──────────────────────────────────────────────────────
const COLUMN_CONFIG = {
    todo:        { title: 'To Do',       badge: 'bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-gray-400' },
    in_progress: { title: 'In Progress', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300', dot: 'bg-indigo-500' },
    review:      { title: 'In Review',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', dot: 'bg-amber-500' },
    overdue:     { title: 'Overdue',     badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40', dot: 'bg-rose-600 animate-pulse' },
    stuck:       { title: 'Stuck',       badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300/40', dot: 'bg-orange-500' },
    completed:   { title: 'Completed',   badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

function KanbanColumn({ colId, tasks, onAddTask, onTaskClick, onDragStart, onDropTask, isDropTarget, onDragOverCol, onDragLeaveCol }) {
    const cfg = COLUMN_CONFIG[colId] || { title: colId, badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                onDragOverCol?.(colId);
            }}
            onDragLeave={() => {
                onDragLeaveCol?.(colId);
            }}
            onDrop={(event) => {
                event.preventDefault();
                onDropTask?.(colId);
            }}
            className={`w-72 shrink-0 flex flex-col rounded-2xl bg-gray-50/80 dark:bg-slate-900/50 border min-h-[520px] transition-all duration-200 ${
                isDropTarget ? 'border-indigo-400 ring-2 ring-indigo-500/10 bg-indigo-500/2 dark:bg-indigo-500/4' : 'border-gray-200/80 dark:border-slate-800/70'
            }`}
        >
            {/* Column header */}
            <div className="px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-gray-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide">{cfg.title}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{tasks.length}</span>
                </div>
            </div>

            {/* Cards - flows naturally down the column so whole page scrolls smoothly */}
            <div className="p-3 space-y-3 flex-1">
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                        onDragStart={onDragStart}
                    />
                ))}

                {tasks.length === 0 && (
                    <div className="py-12 text-center rounded-xl border-2 border-dashed border-gray-200/80 dark:border-slate-800/80">
                        <p className="text-xs text-gray-400 dark:text-slate-600 font-medium">No tasks</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── BoardView ─────────────────────────────────────────────────────────────────
export default function BoardView({ tasks = [], onTaskClick, onStatusChange }) {
    const [draggedTask, setDraggedTask] = useState(null);
    const [hoveredColId, setHoveredColId] = useState(null);

    const handleAddTask = (colId) => {
        showToast(`Add task to "${COLUMN_CONFIG[colId].title}" — modal coming soon!`, 'info');
    };

    const handleDropTask = (status) => {
        if (!draggedTask || draggedTask.status === status) {
            setDraggedTask(null);
            setHoveredColId(null);
            return;
        }

        onStatusChange?.(draggedTask, status);
        setDraggedTask(null);
        setHoveredColId(null);
    };

    const tasksByCol = {
        todo:        tasks.filter(t => t.status === 'todo' && !isTaskOverdue(t)),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        review:      tasks.filter(t => t.status === 'review' || t.status === 'in_review'),
        overdue:     tasks.filter(t => (t.status === 'overdue' || (isTaskOverdue(t) && t.status === 'todo')) && t.status !== 'completed'),
        stuck:       tasks.filter(t => t.status === 'stuck' || t.sprint_status === 'stuck'),
        completed:   tasks.filter(t => t.status === 'completed'),
    };

    return (
        <div className="flex-1 overflow-x-auto overflow-y-visible custom-scrollbar p-2 sm:p-4">
            <div className="flex gap-4 min-w-max pb-10 items-start">
                {Object.keys(COLUMN_CONFIG).map(colId => (
                    <KanbanColumn
                        key={colId}
                        colId={colId}
                        tasks={tasksByCol[colId] || []}
                        onAddTask={handleAddTask}
                        onTaskClick={onTaskClick}
                        onDragStart={setDraggedTask}
                        onDropTask={handleDropTask}
                        onDragOverCol={setHoveredColId}
                        onDragLeaveCol={() => setHoveredColId(null)}
                        isDropTarget={hoveredColId === colId && draggedTask && draggedTask.status !== colId}
                    />
                ))}
            </div>
        </div>
    );
}
