import React, { useState } from 'react';

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
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {tag}
        </span>
    );
}

// ── Task Card (matches reference image) ───────────────────────────────────────
function TaskCard({ task }) {
    return (
        <div className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-500/50 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3">
            {/* Client label */}
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                Client: <span className="font-semibold text-gray-500 dark:text-slate-400">{task.client}</span>
            </p>

            {/* Task title */}
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                {task.title}
            </h4>

            {/* Assignee + tags row */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {task.assignee?.charAt(0) || '?'}
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-slate-400 truncate max-w-[90px]">
                        {task.assignee || 'Unassigned'}
                    </span>
                </div>
                {task.tags?.map(tag => <TagPill key={tag} tag={tag} />)}
            </div>

            {/* Footer stats */}
            <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><AttachIcon />{task.attachments ?? 0}</span>
                    <span className="flex items-center gap-1 font-semibold text-gray-600 dark:text-slate-300">{task.progress ?? 0}%</span>
                    <span className="flex items-center gap-1"><CommentIcon />{task.comments ?? 0}</span>
                </div>
                <span className="flex items-center gap-1"><ClockIcon />{task.daysLeft}</span>
            </div>
        </div>
    );
}

// ── Column ────────────────────────────────────────────────────────────────────
const COLUMN_CONFIG = {
    todo:        { title: 'To Do',       badge: 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-300',         dot: 'bg-gray-400' },
    in_progress: { title: 'In Progress', badge: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500' },
    in_review:   { title: 'In Review',   badge: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',    dot: 'bg-amber-500' },
    completed:   { title: 'Completed',   badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

function KanbanColumn({ colId, tasks, onAddTask }) {
    const cfg = COLUMN_CONFIG[colId];
    return (
        <div className="w-72 shrink-0 flex flex-col rounded-2xl bg-gray-50/80 dark:bg-slate-900/50 border border-gray-200/80 dark:border-slate-800/70 max-h-full overflow-hidden">
            {/* Column header */}
            <div className="px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-gray-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wide">{cfg.title}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{tasks.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onAddTask(colId)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700/60 transition-colors"
                        title="Add task"
                    >
                        <PlusIcon />
                    </button>
                    <button className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700/60 transition-colors">
                        <MoreIcon />
                    </button>
                </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {tasks.map(task => <TaskCard key={task.id} task={task} />)}

                {tasks.length === 0 && (
                    <div className="py-10 text-center rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                        <p className="text-xs text-gray-400 dark:text-slate-600">No tasks yet</p>
                    </div>
                )}
            </div>

            {/* Add new */}
            <button
                onClick={() => onAddTask(colId)}
                className="flex items-center gap-2 mx-3 mb-3 mt-1 px-3 py-2 rounded-xl text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-200/50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <PlusIcon /> Add new
            </button>
        </div>
    );
}

// ── BoardView ─────────────────────────────────────────────────────────────────
export default function BoardView({ tasks = [] }) {
    const handleAddTask = (colId) => {
        alert(`Add task to "${COLUMN_CONFIG[colId].title}" — modal coming soon!`);
    };

    const tasksByCol = {
        todo:        tasks.filter(t => t.status === 'todo'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        in_review:   tasks.filter(t => t.status === 'in_review'),
        completed:   tasks.filter(t => t.status === 'completed'),
    };

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-6">
            <div className="flex gap-4 h-full min-w-max pb-2">
                {Object.keys(COLUMN_CONFIG).map(colId => (
                    <KanbanColumn
                        key={colId}
                        colId={colId}
                        tasks={tasksByCol[colId]}
                        onAddTask={handleAddTask}
                    />
                ))}
            </div>
        </div>
    );
}
