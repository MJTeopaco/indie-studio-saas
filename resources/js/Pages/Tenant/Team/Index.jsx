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
import TeamMemberCard from '@/Components/Tenant/TeamMemberCard';
import TeamTimeline from '@/Components/Tenant/TeamTimeline';

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
                                const status = statuses[index % statuses.length];
                                const badgeClass = statusStyles[status];
                                const department = ['Engineering', 'Product', 'Design', 'QA'][index % 4];

                                return (
                                    <TeamMemberCard
                                        key={member.id}
                                        member={member}
                                        index={index}
                                        status={status}
                                        badgeClass={badgeClass}
                                        department={department}
                                    />
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

                            <TeamTimeline timelineTasks={timelineTasks} />
                        </div>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
