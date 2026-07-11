import React from 'react';

/**
 * TeamTimeline — Renders the interactive Gantt chart timeline for team member task schedules.
 */
export default function TeamTimeline({ timelineTasks }) {
    return (
        <div className="overflow-x-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="min-w-[800px] border border-gray-200/60 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20 overflow-hidden font-sans">
                {/* Timeline Hour Columns header */}
                <div className="grid grid-cols-12 border-b border-gray-200 dark:border-slate-800 divide-x divide-gray-100 dark:divide-slate-800/40 text-[10px] font-semibold text-text-muted text-center py-2.5 bg-gray-50/50 dark:bg-slate-800/20">
                    {['10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM'].map(
                        (hour) => (
                            <div key={hour} className="uppercase tracking-wider select-none">
                                {hour}
                            </div>
                        )
                    )}
                </div>

                {/* Tasks Rows mapping */}
                <div className="divide-y divide-gray-100 dark:divide-slate-800/40 text-xs">
                    {timelineTasks.map((task) => (
                        <div
                            key={task.name}
                            className="grid grid-cols-12 h-14 relative divide-x divide-gray-100/50 dark:divide-slate-800/20 items-center"
                        >
                            {/* Background Column lines */}
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="h-full pointer-events-none" />
                            ))}

                            {/* Task Title Overlay (Left pinned hover) */}
                            <div className="absolute left-4 top-1.5 pointer-events-none">
                                <span className="bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded text-[11px] font-bold text-gray-900 dark:text-slate-200 border border-gray-200/50 dark:border-slate-800/50">
                                    {task.name}
                                </span>
                            </div>

                            {/* Task timeline blocks absolute mapping */}
                            {task.blocks.map((block, bIdx) => {
                                // Map block coordinates to column span variables
                                const startPercent = ((block.startCol - 1) / 12) * 100;
                                const widthPercent = ((block.endCol - block.startCol) / 12) * 100;

                                return (
                                    <div
                                        key={bIdx}
                                        style={{
                                            left: `${startPercent}%`,
                                            width: `${widthPercent}%`,
                                        }}
                                        className="absolute h-9 rounded-xl border border-brand-30 bg-brand-10 hover:bg-brand-20 hover:border-brand-50 transition-colors shadow-sm flex items-center justify-between px-3 select-none"
                                    >
                                        <span className="text-[10px] font-semibold text-brand dark:text-brand-light truncate max-w-[70%]">
                                            {block.text}
                                        </span>
                                        <div className="flex -space-x-1 flex-shrink-0">
                                            {block.assignees.map((initial, aIdx) => (
                                                <div
                                                    key={aIdx}
                                                    className="w-4.5 h-4.5 rounded-full bg-white dark:bg-slate-800 text-[8px] font-bold text-brand dark:text-brand-light border border-brand-30 flex items-center justify-center"
                                                >
                                                    {initial}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
