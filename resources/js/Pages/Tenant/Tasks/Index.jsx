import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import BoardView    from '@/Components/Tenant/Tasks/BoardView';
import ListView     from '@/Components/Tenant/Tasks/ListView';
import TimelineView from '@/Components/Tenant/Tasks/TimelineView';
import DueView      from '@/Components/Tenant/Tasks/DueView';

// ── Inline Icons ──────────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);
const ImportIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const ChevronDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ── View Tab Config ───────────────────────────────────────────────────────────
const VIEWS = [
    { key: 'board',    label: 'Board' },
    { key: 'list',     label: 'List' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'due',      label: 'Due Tasks' },
];

// ── Mock Projects (matches Project model: id, name, description, status) ──────
const MOCK_PROJECTS = [
    {
        id: 1,
        name: 'Lumora: E-commerce website',
        description: 'e-commerce website for niche aesthetic products',
        status: 'planning',
    },
    {
        id: 2,
        name: 'StudioSprint AI Recommendations Engine',
        description: 'Graph Neural Network matching model linking incoming studio tasks to optimal developers.',
        status: 'active',
    },
];

// ── Mock Tasks per project (matches Task model fields):
//   id, project_id, title, description, task_classification, required_position,
//   minimum_experience_years, task_difficulty, priority, estimated_hours,
//   days_until_deadline, target_macro_domains, required_skills,
//   assigned_user_id, status
//   + UI-only: client, assignee, tags, attachments, comments, progress, daysLeft, startDate, dueDate
const MOCK_TASKS = {
    1: [
        {
            id: 101,
            project_id: 1,
            title: 'Change top CTA button text',
            task_classification: 'UI/UX',
            priority: 'HIGH',
            estimated_hours: 4,
            status: 'todo',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: ['Web', 'Saas'],
            attachments: 4, comments: 2, progress: 50, daysLeft: '4d',
            startDate: '2025-07-01', dueDate: '2025-07-15',
        },
        {
            id: 102,
            project_id: 1,
            title: 'Redesign analytics dashboard',
            task_classification: 'UI/UX',
            priority: 'MEDIUM',
            estimated_hours: 8,
            status: 'todo',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: ['Saas', 'Mobile'],
            attachments: 4, comments: 0, progress: 50, daysLeft: '4d',
            startDate: '2025-07-03', dueDate: '2025-07-18',
        },
        {
            id: 103,
            project_id: 1,
            title: 'Create landing page',
            task_classification: 'Frontend',
            priority: 'LOW',
            estimated_hours: 12,
            status: 'todo',
            client: 'Taskez',
            assignee: 'Phoenix Baker',
            tags: ['Web', 'Saas', 'Mobile'],
            attachments: 4, comments: 2, progress: 60, daysLeft: '4d',
            startDate: '2025-07-05', dueDate: '2025-07-20',
        },
        {
            id: 104,
            project_id: 1,
            title: 'Redesign news page',
            task_classification: 'Design',
            priority: 'MEDIUM',
            estimated_hours: 6,
            status: 'in_progress',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: ['Web'],
            attachments: 4, comments: 0, progress: 50, daysLeft: '4d',
            startDate: '2025-07-02', dueDate: '2025-07-12',
        },
        {
            id: 105,
            project_id: 1,
            title: 'Copywrite',
            task_classification: 'Content',
            priority: 'LOW',
            estimated_hours: 3,
            status: 'in_progress',
            client: 'Taskez',
            assignee: 'Phoenix Baker',
            tags: ['Web'],
            attachments: 4, comments: 0, progress: 50, daysLeft: '4d',
            startDate: '2025-07-06', dueDate: '2025-07-10',
        },
        {
            id: 106,
            project_id: 1,
            title: 'UI Animation for the onboarding flow',
            task_classification: 'UI/UX',
            priority: 'HIGH',
            estimated_hours: 16,
            status: 'in_review',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: ['Web', 'Saas'],
            attachments: 4, comments: 3, progress: 50, daysLeft: '4d',
            startDate: '2025-06-28', dueDate: '2025-07-09',
        },
        {
            id: 107,
            project_id: 1,
            title: 'UI Dark mode improvements',
            task_classification: 'UI/UX',
            priority: 'MEDIUM',
            estimated_hours: 8,
            status: 'in_review',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: ['Saas', 'Mobile'],
            attachments: 4, comments: 2, progress: 50, daysLeft: '4d',
            startDate: '2025-07-01', dueDate: '2025-07-11',
        },
        {
            id: 108,
            project_id: 1,
            title: 'Mobile Redesign',
            task_classification: 'Design',
            priority: 'HIGH',
            estimated_hours: 20,
            status: 'in_review',
            client: 'Taskez',
            assignee: 'Phoenix Baker',
            tags: ['Mobile'],
            attachments: 4, comments: 2, progress: 50, daysLeft: '4d',
            startDate: '2025-07-04', dueDate: '2025-07-14',
        },
        {
            id: 109,
            project_id: 1,
            title: 'Navigation improvements',
            task_classification: 'Frontend',
            priority: 'LOW',
            estimated_hours: 4,
            status: 'completed',
            client: 'Taskez',
            assignee: 'Phoenix Baker',
            tags: [],
            attachments: 4, comments: 0, progress: 100, daysLeft: '—',
            startDate: '2025-06-20', dueDate: '2025-06-30',
        },
        {
            id: 110,
            project_id: 1,
            title: 'Text Animation component',
            task_classification: 'Frontend',
            priority: 'MEDIUM',
            estimated_hours: 8,
            status: 'completed',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: [],
            attachments: 4, comments: 2, progress: 100, daysLeft: '—',
            startDate: '2025-06-18', dueDate: '2025-06-28',
        },
        {
            id: 111,
            project_id: 1,
            title: 'Change top button color',
            task_classification: 'Design',
            priority: 'LOW',
            estimated_hours: 2,
            status: 'completed',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: [],
            attachments: 4, comments: 0, progress: 100, daysLeft: '—',
            startDate: '2025-06-15', dueDate: '2025-06-22',
        },
        {
            id: 112,
            project_id: 1,
            title: 'Visual Assets library setup',
            task_classification: 'Design',
            priority: 'MEDIUM',
            estimated_hours: 10,
            status: 'completed',
            client: 'Stellar',
            assignee: 'Phoenix Baker',
            tags: [],
            attachments: 4, comments: 0, progress: 100, daysLeft: '—',
            startDate: '2025-06-10', dueDate: '2025-06-20',
        },
    ],
    2: [
        {
            id: 201,
            project_id: 2,
            title: 'Autonomous NPC AI Agent Core',
            task_classification: 'Model Training',
            priority: 'CRITICAL',
            estimated_hours: 40,
            status: 'in_progress',
            client: 'Internal',
            assignee: 'Alex Chen',
            tags: ['AI', 'Backend'],
            attachments: 2, comments: 5, progress: 65, daysLeft: '8d',
            startDate: '2025-06-25', dueDate: '2025-07-20',
        },
        {
            id: 202,
            project_id: 2,
            title: 'GNN Node Embedding Layer',
            task_classification: 'AI/ML Core',
            priority: 'HIGH',
            estimated_hours: 24,
            status: 'in_review',
            client: 'Internal',
            assignee: 'Maya Lin',
            tags: ['AI'],
            attachments: 3, comments: 2, progress: 88, daysLeft: '2d',
            startDate: '2025-07-01', dueDate: '2025-07-11',
        },
        {
            id: 203,
            project_id: 2,
            title: 'Tenant Isolation Path Validation',
            task_classification: 'Security',
            priority: 'MEDIUM',
            estimated_hours: 16,
            status: 'todo',
            client: 'Internal',
            assignee: 'Marcus Vance',
            tags: ['Backend'],
            attachments: 1, comments: 0, progress: 0, daysLeft: '12d',
            startDate: '2025-07-08', dueDate: '2025-07-23',
        },
        {
            id: 204,
            project_id: 2,
            title: 'Initial Figma Design Token Extraction',
            task_classification: 'UI/UX Design',
            priority: 'MEDIUM',
            estimated_hours: 16,
            status: 'completed',
            client: 'Internal',
            assignee: 'Elena Rostova',
            tags: ['Design'],
            attachments: 4, comments: 1, progress: 100, daysLeft: '—',
            startDate: '2025-06-15', dueDate: '2025-06-25',
        },
    ],
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksIndex() {
    const { activeWorkspace } = usePage().props;

    // Active view tab
    const [activeView, setActiveView] = useState('board');

    // Selected project
    const [selectedProjectId, setSelectedProjectId] = useState(MOCK_PROJECTS[0].id);
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

    // Search query
    const [searchQuery, setSearchQuery] = useState('');

    const selectedProject = MOCK_PROJECTS.find(p => p.id === selectedProjectId) || MOCK_PROJECTS[0];

    // Filter tasks for the selected project
    const projectTasks = (MOCK_TASKS[selectedProjectId] || []).filter(task =>
        searchQuery
            ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (task.assignee && task.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase()))
            : true
    );

    const activeViewLabel = VIEWS.find(v => v.key === activeView)?.label || 'Board';

    return (
        <TenantLayout>
            <Head title={`Tasks — ${selectedProject.name}`} />

            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">

                {/* ── Top Bar ── */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800/80 shrink-0">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 mb-3">
                        <span className="font-medium text-gray-600 dark:text-slate-300">Board</span>
                        <span>›</span>
                        <span className="font-medium text-gray-600 dark:text-slate-300">{activeViewLabel}</span>
                    </div>

                    {/* Title row */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left: Project selector + Title */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setProjectDropdownOpen(p => !p)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all max-w-[280px]"
                                >
                                    <span className="truncate">{selectedProject.name}</span>
                                    <ChevronDownIcon />
                                </button>
                                {projectDropdownOpen && (
                                    <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[260px]">
                                        {MOCK_PROJECTS.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => { setSelectedProjectId(p.id); setProjectDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm transition-colors ${p.id === selectedProjectId ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                            >
                                                <span className="block font-medium truncate">{p.name}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">{p.status}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: View tabs + search + actions */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* View switcher */}
                            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
                                {VIEWS.map(v => (
                                    <button
                                        key={v.key}
                                        onClick={() => setActiveView(v.key)}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                            activeView === v.key
                                                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                                                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative hidden sm:block">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="pl-9 pr-4 py-2 w-48 rounded-xl bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-indigo-400 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none transition-all"
                                />
                            </div>

                            {/* Import button */}
                            <button
                                onClick={() => alert('Import tasks — coming soon!')}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all"
                            >
                                <ImportIcon /> Import
                            </button>

                            {/* New Board CTA */}
                            <button
                                onClick={() => alert('Create new task board — coming soon!')}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 dark:bg-indigo-600 text-white hover:bg-gray-800 dark:hover:bg-indigo-700 shadow-sm transition-all"
                            >
                                <PlusIcon /> New Board
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── View Content ── */}
                {activeView === 'board'    && <BoardView    tasks={projectTasks} />}
                {activeView === 'list'     && <ListView     tasks={projectTasks} />}
                {activeView === 'timeline' && <TimelineView tasks={projectTasks} />}
                {activeView === 'due'      && <DueView      tasks={projectTasks} />}
            </div>

            {/* Close project dropdown on outside click */}
            {projectDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
            )}
        </TenantLayout>
    );
}
