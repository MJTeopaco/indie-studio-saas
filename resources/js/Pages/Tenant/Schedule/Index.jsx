import React, { useState, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TenantLayout  from '@/Layouts/TenantLayout';
import DayPanel      from '@/Components/Tenant/Schedule/DayPanel';
import CalendarGrid  from '@/Components/Tenant/Schedule/CalendarGrid';
import WeekGrid      from '@/Components/Tenant/Schedule/WeekGrid';
import ManualTaskModal from '@/Components/Tenant/Projects/ManualTaskModal';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChevronIcon = ({ dir }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        {dir === 'left'
            ? <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            : <polyline points="9 18 15 12 9 6"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        }
    </svg>
);
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);
const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75"/>
        <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6"  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
);

// ── View modes ────────────────────────────────────────────────────────────────
const VIEWS = ['Month', 'Week', 'Day'];

// ── Mock task data (matches Task model + UI fields) ───────────────────────────
// Fields: id, title, status, priority, estimated_hours, client, assignee, dueDate, startDate
const ALL_TASKS = [
    { id: 101, title: 'Change top CTA button text',           status: 'todo',        priority: 'HIGH',   estimated_hours: 4,  client: 'Stellar',  assignee: 'Phoenix Baker',  dueDate: '2025-07-15', startDate: '2025-07-01' },
    { id: 102, title: 'Redesign analytics dashboard',          status: 'todo',        priority: 'MEDIUM', estimated_hours: 8,  client: 'Stellar',  assignee: 'Phoenix Baker',  dueDate: '2025-07-18', startDate: '2025-07-03' },
    { id: 103, title: 'Create landing page',                   status: 'todo',        priority: 'LOW',    estimated_hours: 12, client: 'Taskez',   assignee: 'Phoenix Baker',  dueDate: '2025-07-20', startDate: '2025-07-05' },
    { id: 104, title: 'Redesign news page',                    status: 'in_progress', priority: 'MEDIUM', estimated_hours: 6,  client: 'Stellar',  assignee: 'Phoenix Baker',  dueDate: '2025-07-12', startDate: '2025-07-02' },
    { id: 105, title: 'Copywrite',                             status: 'in_progress', priority: 'LOW',    estimated_hours: 3,  client: 'Taskez',   assignee: 'Phoenix Baker',  dueDate: '2025-07-10', startDate: '2025-07-06' },
    { id: 106, title: 'UI Animation for the onboarding flow',  status: 'in_review',   priority: 'HIGH',   estimated_hours: 16, client: 'Stellar',  assignee: 'Phoenix Baker',  dueDate: '2025-07-09', startDate: '2025-06-28' },
    { id: 107, title: 'UI Dark mode improvements',             status: 'in_review',   priority: 'MEDIUM', estimated_hours: 8,  client: 'Stellar',  assignee: 'Phoenix Baker',  dueDate: '2025-07-11', startDate: '2025-07-01' },
    { id: 108, title: 'Mobile Redesign',                       status: 'in_review',   priority: 'HIGH',   estimated_hours: 20, client: 'Taskez',   assignee: 'Phoenix Baker',  dueDate: '2025-07-14', startDate: '2025-07-04' },
    { id: 109, title: 'Navigation improvements',               status: 'completed',   priority: 'LOW',    estimated_hours: 4,  client: 'Taskez',   assignee: 'Phoenix Baker',  dueDate: '2025-06-30', startDate: '2025-06-20' },
    { id: 110, title: 'Text Animation component',              status: 'completed',   priority: 'MEDIUM', estimated_hours: 8,  client: 'Stellar',  assignee: 'Phoenix Baker',  dueDate: '2025-06-28', startDate: '2025-06-18' },
    { id: 201, title: 'Autonomous NPC AI Agent Core',          status: 'in_progress', priority: 'CRITICAL', estimated_hours: 40, client: 'Internal', assignee: 'Alex Chen',    dueDate: '2025-07-20', startDate: '2025-06-25' },
    { id: 202, title: 'GNN Node Embedding Layer',              status: 'in_review',   priority: 'HIGH',   estimated_hours: 24, client: 'Internal', assignee: 'Maya Lin',       dueDate: '2025-07-11', startDate: '2025-07-01' },
    { id: 203, title: 'Tenant Isolation Path Validation',      status: 'todo',        priority: 'MEDIUM', estimated_hours: 16, client: 'Internal', assignee: 'Marcus Vance',   dueDate: '2025-07-23', startDate: '2025-07-08' },
];

// ── Mock events (schedule-specific) ──────────────────────────────────────────
const ALL_EVENTS = [
    { id: 1,  title: 'Team Standup',           date: '2025-07-07', startTime: '09:00', endTime: '09:30',  type: 'meeting'   },
    { id: 2,  title: 'Sprint Planning',         date: '2025-07-07', startTime: '10:00', endTime: '11:30',  type: 'meeting'   },
    { id: 3,  title: 'Design Review',           date: '2025-07-09', startTime: '14:00', endTime: '15:00',  type: 'review'    },
    { id: 4,  title: 'Team Standup',           date: '2025-07-10', startTime: '09:00', endTime: '09:30',  type: 'meeting'   },
    { id: 5,  title: 'Onboarding Deadline',     date: '2025-07-11', startTime: '17:00', endTime: null,     type: 'deadline'  },
    { id: 6,  title: 'Q3 Milestone Review',     date: '2025-07-14', startTime: '13:00', endTime: '14:00',  type: 'milestone' },
    { id: 7,  title: 'Team Standup',           date: '2025-07-14', startTime: '09:00', endTime: '09:30',  type: 'meeting'   },
    { id: 8,  title: 'UX Feedback Session',     date: '2025-07-15', startTime: '11:00', endTime: '12:00',  type: 'review'    },
    { id: 9,  title: 'Team Standup',           date: '2025-07-17', startTime: '09:00', endTime: '09:30',  type: 'meeting'   },
    { id: 10, title: 'Sprint Retrospective',    date: '2025-07-18', startTime: '15:00', endTime: '16:30',  type: 'meeting'   },
    { id: 11, title: 'GNN Launch Milestone',    date: '2025-07-20', startTime: '12:00', endTime: null,     type: 'milestone' },
    { id: 12, title: 'Code Freeze Deadline',    date: '2025-07-23', startTime: '18:00', endTime: null,     type: 'deadline'  },
    { id: 13, title: 'Team Standup',           date: '2025-07-21', startTime: '09:00', endTime: '09:30',  type: 'meeting'   },
    { id: 14, title: 'Stakeholder Demo',        date: '2025-07-25', startTime: '14:00', endTime: '15:30',  type: 'review'    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
function addMonths(date, n) {
    return new Date(date.getFullYear(), date.getMonth() + n, 1);
}
function addWeeks(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n * 7);
    return d;
}
function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
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
        if (day !== 0 && day !== 6) added++;
    }
    return date.toISOString().slice(0, 10);
}

// ── Index page ────────────────────────────────────────────────────────────────
export default function ScheduleIndex({ tasks = [], events = [], studio, projects = [] }) {
    const { activeWorkspace } = usePage().props;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeView,   setActiveView]   = useState('Month');
    const [currentDate,  setCurrentDate]  = useState(new Date(today));
    const [selectedDate, setSelectedDate] = useState(new Date(today));

    // Modal states for updating task status
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setTaskModalOpen(true);
    };

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeEvents = Array.isArray(events) ? events : [];

    // Derived calendar position
    const calYear  = currentDate.getFullYear();
    const calMonth = currentDate.getMonth();
    const weekStart = getMondayOfWeek(currentDate);

    // Group tasks by their assignment date first, then schedule/deadline dates.
    const tasksByDate = useMemo(() => {
        const map = {};
        safeTasks.forEach(t => {
            const dateKey = t.assigned_at
                ? t.assigned_at.slice(0, 10)
                : t.hard_constraint_date
                ? t.hard_constraint_date.split('T')[0]
                : (t.ef !== null && t.ef !== undefined && (t.project?.start_date || studio?.start_date)
                    ? deriveCalendarDate(t.project?.start_date || studio?.start_date, t.ef)
                    : t.dueDate);

            if (dateKey) {
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(t);
            }
        });
        return map;
    }, [safeTasks, studio]);

    // Group events by date
    const eventsByDate = useMemo(() => {
        const map = {};
        safeEvents.forEach(e => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [safeEvents]);

    // Tasks and events for the selected date
    const selectedDateStr = toDateStr(selectedDate);
    const selectedTasks  = tasksByDate[selectedDateStr]  || [];
    const selectedEvents = eventsByDate[selectedDateStr] || [];

    // Sets of date strings that have any task / event (for mini-cal dots)
    const allTaskDates  = useMemo(() => new Set(Object.keys(tasksByDate)),  [tasksByDate]);
    const allEventDates = useMemo(() => new Set(Object.keys(eventsByDate)), [eventsByDate]);

    // Handle date selection — also sync current calendar position
    const handleSelectDate = (date) => {
        setSelectedDate(date);
        setCurrentDate(date);
    };

    // Navigation
    const goToPrev = () => {
        if (activeView === 'Month') setCurrentDate(d => addMonths(d, -1));
        else if (activeView === 'Week') setCurrentDate(d => addWeeks(d, -1));
        else setCurrentDate(d => addDays(d, -1));
    };
    const goToNext = () => {
        if (activeView === 'Month') setCurrentDate(d => addMonths(d, 1));
        else if (activeView === 'Week') setCurrentDate(d => addWeeks(d, 1));
        else setCurrentDate(d => addDays(d, 1));
    };
    const goToToday = () => {
        setCurrentDate(new Date(today));
        setSelectedDate(new Date(today));
    };

    // Header label
    const headerLabel = activeView === 'Month'
        ? new Date(calYear, calMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
        : activeView === 'Week'
        ? `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <TenantLayout>
            <Head title="Studio Schedule" />

            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">

                {/* ── Top Bar ── */}
                <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800/80 flex items-center justify-between gap-4 shrink-0">

                    {/* Left: title + nav */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                            <CalendarIcon />
                            <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100">Schedule</h1>
                        </div>

                        <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />

                        {/* Month/Week navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={goToPrev}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronIcon dir="left" />
                            </button>
                            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 min-w-[160px] text-center">
                                {headerLabel}
                            </span>
                            <button
                                onClick={goToNext}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronIcon dir="right" />
                            </button>
                        </div>

                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-600/60 transition-all"
                        >
                            Today
                        </button>
                    </div>

                    {/* Right: view switcher + add event */}
                    <div className="flex items-center gap-3">
                        {/* View switcher */}
                        <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
                            {VIEWS.map(v => (
                                <button
                                    key={v}
                                    onClick={() => setActiveView(v)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                        activeView === v
                                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => alert('Add event — coming soon!')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 dark:bg-indigo-600 text-white hover:bg-gray-800 dark:hover:bg-indigo-700 shadow-sm transition-all"
                        >
                            <PlusIcon /> Add Event
                        </button>
                    </div>
                </div>

                {/* ── Main content: LEFT panel + RIGHT calendar ── */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT — Day detail panel */}
                    <DayPanel
                        selectedDate={selectedDate}
                        onSelectDate={handleSelectDate}
                        tasks={selectedTasks}
                        events={selectedEvents}
                        allTaskDates={allTaskDates}
                        allEventDates={allEventDates}
                        onTaskClick={handleTaskClick}
                    />

                    {/* RIGHT — Calendar view */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                        {activeView === 'Month' && (
                            <CalendarGrid
                                year={calYear}
                                month={calMonth}
                                selectedDate={selectedDate}
                                onSelectDate={handleSelectDate}
                                tasksByDate={tasksByDate}
                                eventsByDate={eventsByDate}
                            />
                        )}
                        {activeView === 'Week' && (
                            <WeekGrid
                                weekStart={weekStart}
                                selectedDate={selectedDate}
                                onSelectDate={handleSelectDate}
                                tasksByDate={tasksByDate}
                                eventsByDate={eventsByDate}
                            />
                        )}
                        {activeView === 'Day' && (
                            <WeekGrid
                                weekStart={currentDate}
                                selectedDate={selectedDate}
                                onSelectDate={handleSelectDate}
                                tasksByDate={tasksByDate}
                                eventsByDate={eventsByDate}
                                isDayView={true}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for updating and completing a task (accessible to both managers and members) */}
            {taskModalOpen && selectedTask && (
                <ManualTaskModal
                    isOpen={taskModalOpen}
                    onClose={() => { setTaskModalOpen(false); setSelectedTask(null); }}
                    project={projects.find(p => p.id === selectedTask.project_id) || { id: selectedTask.project_id, name: selectedTask.project_name || 'Project' }}
                    editingTask={selectedTask}
                    tenantId={activeWorkspace}
                />
            )}
        </TenantLayout>
    );
}
