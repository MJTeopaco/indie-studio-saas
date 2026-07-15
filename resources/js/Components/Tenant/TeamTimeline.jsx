import React from 'react';

/**
 * TeamTimeline — Renders the interactive Gantt chart timeline for team member task schedules.
 */
export default function TeamTimeline({ timelineTasks = [] }) {
    const hasTasks = timelineTasks && timelineTasks.length > 0;

    return (
        <div className="space-y-3">
            {/* Status Legend */}
            <div className="flex items-center justify-end gap-4 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block border border-emerald-600/20" /> Done</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block border border-indigo-600/20" /> Progress</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block border border-amber-600/20" /> Review</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-brand inline-block border border-brand/20" /> To Do</span>
            </div>

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
                    <div className="divide-y divide-gray-100 dark:divide-slate-800/40 text-xs min-h-[140px] flex flex-col justify-center">
                        {hasTasks ? (
                            timelineTasks.map((task) => (
                                <div
                                    key={task.name}
                                    className="grid grid-cols-12 h-14 relative divide-x divide-gray-100/55 dark:divide-slate-800/20 items-center"
                                >
                                    {/* Background Column lines */}
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className="h-full pointer-events-none" />
                                    ))}

                                    {/* Task Title Overlay */}
                                    <div className="absolute left-4 top-1.5 pointer-events-none">
                                        <span className="bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded text-[11px] font-bold text-gray-900 dark:text-slate-200 border border-gray-200/50 dark:border-slate-800/50">
                                            {task.name}
                                        </span>
                                    </div>

                                    {/* Task timeline blocks absolute mapping */}
                                    {task.blocks.map((block, bIdx) => {
                                        const startPercent = ((block.startCol - 1) / 12) * 100;
                                        const widthPercent = ((block.endCol - block.startCol) / 12) * 100;

                                        let statusClasses = "border-brand-30 bg-brand-10 hover:bg-brand-20 hover:border-brand-50 text-brand dark:text-brand-light";
                                        if (block.status === 'completed') {
                                            statusClasses = "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50";
                                        } else if (block.status === 'in_progress') {
                                            statusClasses = "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/50";
                                        } else if (block.status === 'review' || block.status === 'in_review') {
                                            statusClasses = "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100/50";
                                        }

                                        return (
                                            <div
                                                key={bIdx}
                                                style={{
                                                    left: `${startPercent}%`,
                                                    width: `${widthPercent}%`,
                                                }}
                                                className={`absolute h-9 rounded-xl border transition-colors shadow-sm flex items-center justify-between px-3 select-none ${statusClasses}`}
                                            >
                                            <span className="text-[10px] font-semibold text-brand dark:text-brand-light truncate max-w-[70%]">
                                                {block.text}
                                            </span>
                                            <div className="flex -space-x-1 flex-shrink-0">
                                                {(block.assignees || []).map((initial, aIdx) => (
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
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400 dark:text-slate-500">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-300 dark:text-slate-700 mb-2">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p className="text-xs font-semibold">No scheduled scheduled tasks</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Tasks will appear here when schedules are allocated.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}
