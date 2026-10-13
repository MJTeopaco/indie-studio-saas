import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    User, 
    AlertCircle, 
    AlertTriangle,
    CheckCircle2, 
    Flame, 
    Layers,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { resolveCpaStatus } from '@/lib/cpaTerminology';

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDate(str) {
    if (!str) return null;
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(str);
}

function formatDate(date) {
    if (!date) return '';
    return date.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
    const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

// Format date label for header: "Oct 9" or "10"
function formatHeaderDay(date, isFirstOrNewMonth) {
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return isFirstOrNewMonth ? `${month} ${day}` : `${day}`;
}

// ── Color Themes by Project / Key Hash ─────────────────────────────────────────
const THEME_PALETTES = [
    {
        // Purple / Mauve
        bar: 'bg-purple-200/95 border-purple-400 text-purple-950 hover:bg-purple-300 dark:bg-purple-900/85 dark:border-purple-400/90 dark:text-purple-100 dark:hover:bg-purple-800/90',
        badge: 'bg-white/95 border-purple-300 text-purple-950 dark:bg-black/60 dark:border-purple-400/40 dark:text-purple-100',
        indicator: 'bg-purple-500',
    },
    {
        // Blue / Indigo
        bar: 'bg-blue-200/95 border-blue-400 text-blue-950 hover:bg-blue-300 dark:bg-blue-900/85 dark:border-blue-400/90 dark:text-blue-100 dark:hover:bg-blue-800/90',
        badge: 'bg-white/95 border-blue-300 text-blue-950 dark:bg-black/60 dark:border-blue-400/40 dark:text-blue-100',
        indicator: 'bg-blue-500',
    },
    {
        // Cyan / Sky
        bar: 'bg-cyan-200/95 border-cyan-400 text-cyan-950 hover:bg-cyan-300 dark:bg-cyan-900/85 dark:border-cyan-400/90 dark:text-cyan-100 dark:hover:bg-cyan-800/90',
        badge: 'bg-white/95 border-cyan-300 text-cyan-950 dark:bg-black/60 dark:border-cyan-400/40 dark:text-cyan-100',
        indicator: 'bg-cyan-500',
    },
    {
        // Emerald / Green
        bar: 'bg-emerald-200/95 border-emerald-400 text-emerald-950 hover:bg-emerald-300 dark:bg-emerald-900/85 dark:border-emerald-400/90 dark:text-emerald-100 dark:hover:bg-emerald-800/90',
        badge: 'bg-white/95 border-emerald-300 text-emerald-950 dark:bg-black/60 dark:border-emerald-400/40 dark:text-emerald-100',
        indicator: 'bg-emerald-500',
    },
    {
        // Amber / Orange
        bar: 'bg-amber-200/95 border-amber-400 text-amber-950 hover:bg-amber-300 dark:bg-amber-900/85 dark:border-amber-400/90 dark:text-amber-100 dark:hover:bg-amber-800/90',
        badge: 'bg-white/95 border-amber-300 text-amber-950 dark:bg-black/60 dark:border-amber-400/40 dark:text-amber-100',
        indicator: 'bg-amber-500',
    },
    {
        // Rose / Coral
        bar: 'bg-rose-200/95 border-rose-400 text-rose-950 hover:bg-rose-300 dark:bg-rose-900/85 dark:border-rose-400/90 dark:text-rose-100 dark:hover:bg-rose-800/90',
        badge: 'bg-white/95 border-rose-300 text-rose-950 dark:bg-black/60 dark:border-rose-400/40 dark:text-rose-100',
        indicator: 'bg-rose-500',
    },
];

function getPaletteForTask(task, index) {
    if (task.epic_color) {
        // Can map epic color if custom
    }
    const seed = (Number(task.project_id || 0) * 7 + (task.id || index)) % THEME_PALETTES.length;
    return THEME_PALETTES[seed];
}

// ── TimelineView Component ───────────────────────────────────────────────────
export default function TimelineView({ tasks = [], onTaskClick }) {
    const scrollContainerRef = useRef(null);

    // Zoom column width state: 64px, 80px (default), 96px
    const [colWidth, setColWidth] = useState(80);

    // Active hovered task for interactive tooltip
    const [hoveredTask, setHoveredTask] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // ── 1. Calculate Date Bounds & Grid Dimensions ───────────────────────────
    const { minDate, maxDate, totalDays, days } = useMemo(() => {
        if (!tasks.length) {
            const min = new Date(today.getTime() - 3 * 86400000);
            const max = new Date(today.getTime() + 11 * 86400000);
            const count = daysBetween(min, max) + 1;
            const daysArr = Array.from({ length: count }, (_, i) => {
                const d = new Date(min);
                d.setDate(d.getDate() + i);
                return d;
            });
            return { minDate: min, maxDate: max, totalDays: count, days: daysArr };
        }

        const validStartDates = [];
        const validDueDates = [];

        tasks.forEach(t => {
            const s = parseDate(t.startDate);
            const d = parseDate(t.dueDate);
            if (s) validStartDates.push(s);
            if (d) validDueDates.push(d);
        });

        const allDates = [...validStartDates, ...validDueDates];
        let minTime = allDates.length ? Math.min(...allDates.map(d => d.getTime())) : today.getTime();
        let maxTime = allDates.length ? Math.max(...allDates.map(d => d.getTime())) : today.getTime();

        const min = new Date(minTime);
        const max = new Date(maxTime);

        // Add 2 days before earliest task and 4 days after latest task for visual breathing room
        min.setDate(min.getDate() - 2);
        max.setDate(max.getDate() + 4);

        // Ensure minimum 14 days visible
        if (daysBetween(min, max) < 14) {
            max.setDate(min.getDate() + 14);
        }

        const count = daysBetween(min, max) + 1;
        const daysArr = Array.from({ length: count }, (_, i) => {
            const d = new Date(min);
            d.setDate(d.getDate() + i);
            return d;
        });

        return { minDate: min, maxDate: max, totalDays: count, days: daysArr };
    }, [tasks, today]);

    // Position of today line in pixels
    const todayOffsetDays = daysBetween(minDate, today);
    const todayPixelLeft = todayOffsetDays >= 0 && todayOffsetDays < totalDays
        ? todayOffsetDays * colWidth + colWidth / 2
        : null;

    // Pan date range buttons
    const handlePan = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction * colWidth * 5;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleJumpToToday = () => {
        if (scrollContainerRef.current && todayPixelLeft !== null) {
            const target = Math.max(0, todayPixelLeft - scrollContainerRef.current.clientWidth / 2 + 130);
            scrollContainerRef.current.scrollTo({ left: target, behavior: 'smooth' });
        }
    };

    // Auto scroll near current tasks on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            if (todayPixelLeft !== null) {
                const target = Math.max(0, todayPixelLeft - 200);
                scrollContainerRef.current.scrollTo({ left: target });
            }
        }
    }, [todayPixelLeft]);

    const LEFT_COL_W = 280; // Width of Task / milestone sticky left column
    const ROW_HEIGHT = 52;  // Height of each task row

    return (
        <div className="flex-1 flex flex-col h-full bg-surface-elevated dark:bg-slate-950 border border-surface-border dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs relative">
            
            {/* ── Top Timeline Controls Bar ── */}
            <div className="px-5 py-3 border-b border-surface-border dark:border-slate-800/80 bg-surface/60 dark:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary dark:text-slate-200 uppercase tracking-wider font-heading">
                        Schedule Gantt
                    </span>
                    <span className="text-[11px] font-mono text-text-muted dark:text-slate-400">
                        ({tasks.length} task{tasks.length !== 1 ? 's' : ''})
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Date Navigation */}
                    <div className="flex items-center bg-surface-elevated dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => handlePan(-1)}
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Scroll Left"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleJumpToToday}
                            className="px-2.5 py-1 text-[11px] font-semibold text-text-muted hover:text-brand dark:hover:text-brand-light transition-colors cursor-pointer"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePan(1)}
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Scroll Right"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Zoom Density Controls */}
                    <div className="flex items-center bg-surface-elevated dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setColWidth(w => Math.max(64, w - 12))}
                            disabled={colWidth <= 64}
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Zoom Out (Compact)"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-medium text-text-muted px-1.5">
                            {colWidth}px
                        </span>
                        <button
                            type="button"
                            onClick={() => setColWidth(w => Math.min(108, w + 12))}
                            disabled={colWidth >= 108}
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Zoom In (Spacious)"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Scrollable Gantt Table Area ── */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar select-none relative"
            >
                <div 
                    style={{ minWidth: `${LEFT_COL_W + totalDays * colWidth}px` }}
                    className="relative flex flex-col"
                >
                    {/* ── HEADER ROW ── */}
                    <div className="flex items-stretch border-b border-surface-border dark:border-slate-800 bg-surface/80 dark:bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md">
                        {/* Sticky Left Header: Task / Milestone */}
                        <div 
                            style={{ width: `${LEFT_COL_W}px` }}
                            className="shrink-0 px-5 py-3 flex items-center font-bold text-xs text-text-muted dark:text-slate-400 uppercase tracking-wider font-heading sticky left-0 z-40 bg-surface dark:bg-slate-900 border-r border-surface-border dark:border-slate-800/90 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]"
                        >
                            Task / Milestone
                        </div>

                        {/* Date Columns Header: Oct 9 | 10 | 11 | 12 ... */}
                        <div className="flex-1 flex">
                            {days.map((d, i) => {
                                const isFirst = i === 0;
                                const isNewMonth = !isFirst && d.getDate() === 1;
                                const isToday = daysBetween(today, d) === 0;
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                                return (
                                    <div
                                        key={i}
                                        style={{ width: `${colWidth}px` }}
                                        className={`shrink-0 flex items-center justify-center py-3 border-r border-slate-200/60 dark:border-slate-800/60 text-center transition-colors ${
                                            isToday 
                                                ? 'bg-brand/10 text-brand font-bold dark:bg-brand/15' 
                                                : isWeekend 
                                                ? 'bg-slate-100/40 dark:bg-slate-900/30 text-text-muted/80 dark:text-slate-500' 
                                                : 'text-text-muted dark:text-slate-400 font-medium'
                                        }`}
                                    >
                                        <span className={`text-xs ${isFirst || isNewMonth ? 'font-bold text-text-primary dark:text-slate-200' : 'text-xs'}`}>
                                            {formatHeaderDay(d, isFirst || isNewMonth)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── GRID BODY: TASK ROWS ── */}
                    <div className="flex-1 relative">
                        {/* Background Vertical Grid Lines Across All Rows */}
                        <div 
                            className="absolute inset-0 pointer-events-none flex"
                            style={{ left: `${LEFT_COL_W}px` }}
                        >
                            {days.map((d, i) => {
                                const isToday = daysBetween(today, d) === 0;
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                                return (
                                    <div
                                        key={i}
                                        style={{ width: `${colWidth}px` }}
                                        className={`h-full shrink-0 border-r border-slate-200/50 dark:border-slate-800/50 ${
                                            isToday 
                                                ? 'bg-brand/[0.03] dark:bg-brand/[0.04]' 
                                                : isWeekend 
                                                ? 'bg-slate-100/30 dark:bg-slate-900/20' 
                                                : ''
                                        }`}
                                    />
                                );
                            })}

                            {/* Today Glowing Vertical Marker Line */}
                            {todayPixelLeft !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-brand z-20 pointer-events-none shadow-[0_0_8px_rgba(0,124,255,0.7)]"
                                    style={{ left: `${todayPixelLeft}px` }}
                                />
                            )}
                        </div>

                        {/* Task Rows */}
                        {tasks.map((task, rowIndex) => {
                            const palette = getPaletteForTask(task, rowIndex);

                            // Compute Bar Bounds
                            const startDate = parseDate(task.startDate);
                            const dueDate = parseDate(task.dueDate);

                            let startOffset = startDate ? daysBetween(minDate, startDate) : 0;
                            let endOffset = dueDate ? daysBetween(minDate, dueDate) : startOffset + 1;

                            // Clamp bounds
                            if (endOffset < startOffset) {
                                endOffset = startOffset + 1;
                            }

                            const durationDays = Math.max(1, endOffset - startOffset + 1);
                            const barLeft = startOffset * colWidth + 4;
                            const barWidth = durationDays * colWidth - 8;

                            // Formatted Points & Task Key
                            const pts = task.story_points ?? Math.max(1, Math.round((task.estimated_hours || 8) / 4));
                            const taskCode = task.task_key || `#${task.id}`;

                            return (
                                <div
                                    key={task.id || rowIndex}
                                    style={{ height: `${ROW_HEIGHT}px` }}
                                    className="flex items-center border-b border-slate-200/60 dark:border-slate-800/60 group relative"
                                >
                                    {/* Sticky Left Column: Task / Milestone Title */}
                                    <div
                                        style={{ width: `${LEFT_COL_W}px` }}
                                        onClick={() => onTaskClick?.(task)}
                                        className="shrink-0 px-5 flex items-center gap-2.5 h-full sticky left-0 z-20 bg-surface-elevated dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/60 border-r border-surface-border dark:border-slate-800/90 transition-colors cursor-pointer shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.4)]"
                                    >
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${palette.indicator}`} />
                                        <div className="min-w-0 flex-1">
                                            <p 
                                                title={task.title}
                                                className="text-xs font-semibold text-text-primary dark:text-slate-100 truncate group-hover:text-brand transition-colors"
                                            >
                                                {task.title}
                                            </p>
                                            {task.project_name && (
                                                <p className="text-[10px] text-text-muted dark:text-slate-500 truncate">
                                                    {task.project_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timeline Bar Area */}
                                    <div 
                                        className="flex-1 h-full relative"
                                        style={{ width: `${totalDays * colWidth}px` }}
                                    >
                                        {/* Gantt Bar */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTaskClick?.(task);
                                            }}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredTask(task);
                                                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
                                            }}
                                            onMouseLeave={() => setHoveredTask(null)}
                                            style={{
                                                left: `${barLeft}px`,
                                                width: `${barWidth}px`,
                                                height: '34px',
                                                top: '9px',
                                            }}
                                            className={`absolute rounded-md border flex items-center px-2.5 gap-2 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.008] active:scale-[0.99] z-10 ${palette.bar}`}
                                        >
                                            {/* Pill Badge Inside Bar: [ EOV-120 · 8 pts ] */}
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shrink-0 border ${palette.badge}`}>
                                                <span>{taskCode}</span>
                                                <span className="opacity-50">·</span>
                                                <span>{pts} pts</span>
                                            </span>

                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── FLOATING HOVER INSPECTOR TOOLTIP ── */}
            {hoveredTask && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 9999,
                    }}
                    className="pointer-events-none min-w-[240px] max-w-[320px] p-3 rounded-xl bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 text-white shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-100"
                >
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold text-brand-light uppercase">
                            {hoveredTask.task_key || `#${hoveredTask.id}`}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {hoveredTask.status?.replace(/_/g, ' ') || 'To Do'}
                        </span>
                    </div>

                    <h4 className="text-xs font-bold leading-snug line-clamp-2 text-white mb-2">
                        {hoveredTask.title}
                    </h4>

                    <div className="space-y-1 text-[11px] border-t border-slate-800 pt-2 text-slate-300">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" /> Date Span:
                            </span>
                            <span className="font-mono font-medium text-slate-200">
                                {hoveredTask.startDate} → {hoveredTask.dueDate}
                            </span>
                        </div>

                        {hoveredTask.estimated_hours && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" /> Estimate:
                                </span>
                                <span className="font-mono text-slate-200">
                                    {hoveredTask.estimated_hours}h
                                </span>
                            </div>
                        )}

                        {hoveredTask.assignee && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" /> Assignee:
                                </span>
                                <span className="font-medium text-slate-200 truncate max-w-[140px]">
                                    {hoveredTask.assignee}
                                </span>
                            </div>
                        )}

                        {hoveredTask && (() => {
                            const cpa = resolveCpaStatus({
                                totalFloat: hoveredTask.total_float,
                                isCritical: hoveredTask.is_critical,
                                dueDate: hoveredTask.due_date,
                                daysUntilDeadline: hoveredTask.days_until_deadline,
                                status: hoveredTask.status,
                            });

                            if (cpa.tier === 'emergency') {
                                return (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/50">
                                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                                        <span>Release Blocker (Delaying Launch)</span>
                                    </div>
                                );
                            }
                            if (cpa.tier === 'vigilance') {
                                return (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                                        <Flame className="w-3 h-3 text-amber-400" />
                                        <span>Zero Leeway (Milestone Pacing)</span>
                                    </div>
                                );
                            }
                            if (cpa.tier === 'tight') {
                                return (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-300 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-700/40">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>Tight Leeway ({cpa.sublabel})</span>
                                    </div>
                                );
                            }
                            if (cpa.tier === 'safe') {
                                return (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Safe Buffer ({cpa.sublabel})</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>
            )}

            {/* ── Timeline Footer Status ── */}
            <div className="px-5 py-2.5 bg-surface/80 dark:bg-slate-900/80 border-t border-surface-border dark:border-slate-800/80 flex items-center justify-between text-[11px] text-text-muted dark:text-slate-400 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium">All systems operational</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px]">
                        Range: {formatDate(minDate)} → {formatDate(maxDate)}
                    </span>
                    <span className="text-text-muted/40">|</span>
                    <span className="font-medium">Click any bar to edit task</span>
                </div>
            </div>

        </div>
    );
}
