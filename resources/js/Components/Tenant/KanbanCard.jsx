import React from 'react';
import { Clock, Cpu } from 'lucide-react';
import PriorityBadge from './PriorityBadge';

/**
 * KanbanCard — Renders a card representating a task in the project Kanban workspace.
 */
export default function KanbanCard({ task }) {
    return (
        <div className="group relative rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 hover:border-brand/60 dark:hover:border-brand/60 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-3">
            {/* Top row: ID + Priority */}
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-gray-400 dark:text-slate-500">
                    #{task.id}
                </span>
                <PriorityBadge priority={task.priority} />
            </div>

            {/* Task Title */}
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light transition-colors leading-snug truncate">
                {task.title}
            </h4>

            {/* Classification & GNN Score */}
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium truncate">
                    {task.classification}
                </span>

                {task.gnnMatchScore ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-10 text-brand dark:text-brand-light border border-brand-30 shrink-0">
                        <Cpu className="w-3 h-3" />
                        {task.gnnMatchScore}
                    </span>
                ) : (
                    <span className="text-[10px] text-gray-400 dark:text-slate-600 italic">
                        Unmatched
                    </span>
                )}
            </div>

            {/* Footer row: Assignee + Hours */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    {task.assignee ? (
                        <>
                            <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold">
                                {task.assignee.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate max-w-[100px]">
                                {task.assignee}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs italic text-gray-400 dark:text-slate-500">
                            Unassigned
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                    <span>{task.estimatedHours}</span>
                </div>
            </div>
        </div>
    );
}
