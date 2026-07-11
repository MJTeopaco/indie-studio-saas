import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Users,
    Search,
    Filter,
    Plus,
    FolderPlus,
    Calendar,
    ArrowRight,
    UserPlus,
    ChevronRight,
    Grid,
    List,
} from 'lucide-react';

export default function TeamIndex({ studio, members = [], canManage = false }) {
    const studioName = studio?.name || 'Studio';

    // UI state
    const [activeTab, setActiveTab] = useState('Team Overview');
    const [timelineMode, setTimelineMode] = useState('Day');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter members based on search query
    const filteredMembers = members.filter(
        (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Mock timeline tasks matching the reference image layout
    const timelineTasks = [
        {
            name: 'Research',
            blocks: [
                { text: 'About 4 hours', startCol: 1, endCol: 5, assignees: ['AC', 'ML'] },
            ],
        },
        {
            name: 'Wireframe',
            blocks: [
                { text: 'About 3 hours', startCol: 2, endCol: 5, assignees: ['MV'] },
                { text: 'About 6 hours', startCol: 7, endCol: 13, assignees: ['AC', 'ML', 'PM'] },
            ],
        },
        {
            name: 'UI Design',
            blocks: [
                { text: 'About 3 hours', startCol: 3, endCol: 6, assignees: ['PM'] },
                { text: 'About 6 hours', startCol: 7, endCol: 13, assignees: ['AC', 'ML', 'MV', 'PM'] },
            ],
        },
        {
            name: 'Usability Testing',
            blocks: [
                { text: 'About 4 hours', startCol: 4, endCol: 8, assignees: ['AC', 'MV'] },
                { text: 'About 3 hours', startCol: 10, endCol: 13, assignees: ['ML'] },
            ],
        },
    ];

    // Mock statuses for cards layout
    const statuses = ['Active', 'Remote', 'Part-time'];
    const statusStyles = {
        Active: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
        Remote: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
        'Part-time': 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    };

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`Teams — ${studioName}`} />

            <div className="flex-1 overflow-y-auto bg-surface text-text-primary p-6 sm:p-10 lg:p-12 select-none">
                {/* 1. Header Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                            Teams
                        </span>
                        <h1 className="font-heading text-3xl font-extrabold tracking-tight mt-0.5 text-gray-900 dark:text-slate-100">
                            Teams
                        </h1>
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => alert('Add Team Member modal placeholder')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-heading font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm shadow-brand/15"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>New Member</span>
                            </button>
                            <button
                                onClick={() => alert('New Project coming soon!')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-transparent border border-surface-border text-text-primary text-xs font-heading font-semibold hover:bg-white/10 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <FolderPlus className="w-4 h-4 text-text-muted" />
                                <span>New Project</span>
                            </button>
                            <button
                                onClick={() => alert('New Task coming soon!')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-transparent border border-surface-border text-text-primary text-xs font-heading font-semibold hover:bg-white/10 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <Plus className="w-4 h-4 text-text-muted" />
                                <span>New Task</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. Sub-navigation tabs */}
                <div className="flex items-center gap-6 mt-8 border-b border-surface-border">
                    {['Department Board', 'Team Overview', 'All tasks'].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-heading font-semibold transition-all relative ${
                                    isActive
                                        ? 'text-brand dark:text-brand-light font-bold'
                                        : 'text-text-muted hover:text-text-primary'
                                }`}
                            >
                                {tab}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand dark:bg-brand-light rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 3. Conditional Content States */}
                {members.length === 0 ? (
                    /* CASE A: Empty State */
                    <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-white/20 dark:bg-slate-900/10 p-16 text-center max-w-xl mx-auto shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-brand-10 flex items-center justify-center text-brand border border-brand-30 mb-6">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100">
                            No team members yet
                        </h3>
                        <p className="mt-2 text-sm text-text-muted font-sans max-w-sm">
                            Start building your studio team by inviting developers to collaborate in this studio workspace.
                        </p>
                        {canManage && (
                            <button
                                onClick={() => alert('Invite member triggered')}
                                className="mt-6 inline-flex items-center gap-1.5 px-4 py-2.25 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-heading font-semibold transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand/20"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Invite Member</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* CASE B: Display State */
                    <div className="mt-8 space-y-12">
                        {/* Subsection Title and Control Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100">
                                Members
                            </h3>

                            <div className="flex items-center gap-3">
                                {/* Search input */}
                                <div className="relative flex items-center">
                                    <Search className="w-4 h-4 absolute left-3 text-gray-400 dark:text-slate-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="pl-9 pr-12 py-1.75 rounded-xl bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 focus:border-brand dark:focus:border-brand/60 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none cursor-pointer transition-all"
                                    />
                                    <span className="absolute right-2.5 text-[9px] font-mono text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700/80 rounded px-1.5 py-0.5">
                                        ⌘F
                                    </span>
                                </div>

                                {/* Filter trigger */}
                                <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 text-xs font-sans text-text-muted hover:text-text-primary transition-colors">
                                    <Filter className="w-3.5 h-3.5" />
                                    <span>Filter</span>
                                </button>

                                {/* Mock Layout buttons */}
                                <div className="flex items-center bg-gray-100 dark:bg-slate-800/50 p-1 border border-gray-200/60 dark:border-slate-700/50 rounded-xl">
                                    <button className="p-1 rounded-lg text-brand bg-white dark:bg-slate-700 shadow-sm">
                                        <Grid className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition-colors">
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 8-member Grid view */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredMembers.map((member, index) => {
                                // Assign mock attributes for design fidelity (Active/Remote/Part-time, phone, etc.)
                                const status = statuses[index % statuses.length];
                                const badgeClass = statusStyles[status];
                                const phone = `(${201 + index}) 555-010${index}`;
                                const department = ['Engineering', 'Product', 'Design', 'QA'][index % 4];

                                return (
                                    <div
                                        key={member.id}
                                        className="group rounded-2xl bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg transition-all duration-200 relative flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Header avatar & Status badge */}
                                            <div className="flex items-center justify-between">
                                                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span
                                                    className={`rounded-full text-[10px] px-2 py-0.5 font-bold uppercase ${badgeClass}`}
                                                >
                                                    {status}
                                                </span>
                                            </div>

                                            {/* Names */}
                                            <div className="mt-4">
                                                <h4 className="font-heading text-base font-bold text-gray-900 dark:text-slate-100 truncate group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                                                    {member.name}
                                                </h4>
                                                <p className="text-xs text-text-muted font-sans mt-0.5 truncate">
                                                    {member.position}
                                                </p>
                                            </div>

                                            {/* Divider */}
                                            <div className="my-4 border-t border-gray-100 dark:border-slate-800/50"></div>

                                            {/* Department & Join Date */}
                                            <div className="grid grid-cols-2 gap-2 text-xs font-sans text-text-muted">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-semibold block">
                                                        Department
                                                    </span>
                                                    <span className="font-semibold text-gray-900 dark:text-slate-200">
                                                        {department}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-semibold block">
                                                        Joining
                                                    </span>
                                                    <span className="font-semibold text-gray-900 dark:text-slate-200">
                                                        {member.joined_at}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Email & Phone */}
                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800/50 space-y-1 text-xs font-sans">
                                                <p className="text-text-muted truncate hover:text-brand dark:hover:text-brand-light cursor-pointer">
                                                    {member.email}
                                                </p>
                                                <p className="text-text-muted">
                                                    {phone}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Link Arrow */}
                                        <div className="absolute bottom-4 right-4 text-gray-400 dark:text-slate-500 group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                                            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 4. Timeline Schedule View */}
                        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20 p-6 shadow-sm space-y-6">
                            {/* Timeline Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-heading text-base font-bold text-gray-900 dark:text-slate-200">
                                        December 12, 2024
                                    </span>
                                    <span className="text-xs text-text-muted cursor-pointer hover:text-brand select-none">&gt;</span>
                                </div>

                                {/* Mode Selectors */}
                                <div className="flex items-center bg-gray-100 dark:bg-slate-800/50 p-1 border border-gray-200/60 dark:border-slate-700/50 rounded-xl select-none">
                                    {['Day', 'Week', 'Month', 'Year'].map((mode) => {
                                        const isModeActive = timelineMode === mode;
                                        return (
                                            <button
                                                key={mode}
                                                onClick={() => setTimelineMode(mode)}
                                                className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all duration-200 ${
                                                    isModeActive
                                                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                {mode}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Gantt Timeline Chart */}
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
                                                            <span className="text-[10px] font-semibold text-brand truncate max-w-[70%]">
                                                                {block.text}
                                                            </span>
                                                            <div className="flex -space-x-1 flex-shrink-0">
                                                                {block.assignees.map((initial, aIdx) => (
                                                                    <div
                                                                        key={aIdx}
                                                                        className="w-4.5 h-4.5 rounded-full bg-white dark:bg-slate-800 text-[8px] font-bold text-brand border border-brand-30 flex items-center justify-center"
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
                        </div>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
