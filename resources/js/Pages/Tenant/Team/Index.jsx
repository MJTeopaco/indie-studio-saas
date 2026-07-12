import React, { useState, useMemo } from 'react';
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
    X,
} from 'lucide-react';
import TeamMemberCard from '@/Components/Tenant/TeamMemberCard';
import TeamTimeline from '@/Components/Tenant/TeamTimeline';

// Helper to determine department based on position
const getDepartment = (position) => {
    const pos = (position || '').toLowerCase();
    if (pos.includes('design') || pos.includes('ui') || pos.includes('ux') || pos.includes('artist') || pos.includes('graphics')) {
        return 'Design';
    }
    if (pos.includes('product') || pos.includes('manager') || pos.includes('analyst') || pos.includes('strategy')) {
        return 'Product';
    }
    if (pos.includes('qa') || pos.includes('tester') || pos.includes('quality') || pos.includes('testing')) {
        return 'QA';
    }
    return 'Engineering';
};

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'QA'];
const STATUSES = ['Active', 'Remote', 'Part-time'];

const statusStyles = {
    Active: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    Remote: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
    'Part-time': 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
};

export default function TeamIndex({ studio, members = [], canManage = false }) {
    const studioName = studio?.name || 'Studio';

    // UI state
    const [activeTab, setActiveTab] = useState('Team Overview');
    const [timelineMode, setTimelineMode] = useState('Day');
    
    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [filterOpen, setFilterOpen] = useState(false);

    // Map each member's status and department based on their index/data
    const enrichedMembers = useMemo(() => {
        return members.map((m, idx) => {
            const status = STATUSES[idx % STATUSES.length];
            const dept = getDepartment(m.position);
            return {
                ...m,
                status,
                department: dept,
                badgeClass: statusStyles[status],
            };
        });
    }, [members]);

    // Filter members based on search and selected filters
    const filteredMembers = useMemo(() => {
        return enrichedMembers.filter((m) => {
            const matchesSearch =
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesDept = selectedDepartment === 'All' || m.department === selectedDepartment;
            const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus;
            
            return matchesSearch && matchesDept && matchesStatus;
        });
    }, [enrichedMembers, searchQuery, selectedDepartment, selectedStatus]);

    // Group filtered members by department for the Department Board
    const groupedMembers = useMemo(() => {
        const groups = { Engineering: [], Product: [], Design: [], QA: [] };
        filteredMembers.forEach((m) => {
            if (groups[m.department]) {
                groups[m.department].push(m);
            } else {
                groups.Engineering.push(m);
            }
        });
        return groups;
    }, [filteredMembers]);

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

    const hasActiveFilters = searchQuery !== '' || selectedDepartment !== 'All' || selectedStatus !== 'All';

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedDepartment('All');
        setSelectedStatus('All');
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

                {/* 2. Sub-navigation tabs (Removed 'All tasks') */}
                <div className="flex items-center gap-6 mt-8 border-b border-surface-border">
                    {['Department Board', 'Team Overview'].map((tab) => {
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
                                {activeTab}
                            </h3>

                            <div className="flex items-center gap-3 relative">
                                {/* Clear filters if active */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-heading text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Clear</span>
                                    </button>
                                )}

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

                                {/* Filter trigger & Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setFilterOpen(o => !o)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-sans transition-colors ${
                                            hasActiveFilters
                                                ? 'bg-brand text-white border-brand'
                                                : 'bg-white dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 text-text-muted hover:text-text-primary'
                                        }`}
                                    >
                                        <Filter className="w-3.5 h-3.5" />
                                        <span>Filter</span>
                                    </button>

                                    {filterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 z-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 w-60 space-y-4">
                                                {/* Department Filter */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Department</p>
                                                    <select
                                                        value={selectedDepartment}
                                                        onChange={(e) => { setSelectedDepartment(e.target.value); setFilterOpen(false); }}
                                                        className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-brand"
                                                    >
                                                        <option value="All">All Departments</option>
                                                        {DEPARTMENTS.map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Status Filter */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Status</p>
                                                    <select
                                                        value={selectedStatus}
                                                        onChange={(e) => { setSelectedStatus(e.target.value); setFilterOpen(false); }}
                                                        className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-brand"
                                                    >
                                                        <option value="All">All Statuses</option>
                                                        {STATUSES.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rendering View based on activeTab */}
                        {activeTab === 'Team Overview' ? (
                            /* ── VIEW A: Team Overview Grid ── */
                            filteredMembers.length === 0 ? (
                                <div className="py-20 text-center text-text-muted">
                                    <p className="text-sm font-semibold">No team members match your criteria.</p>
                                    <button onClick={clearFilters} className="mt-2 text-xs text-brand hover:underline">Clear filters</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredMembers.map((member, idx) => (
                                        <TeamMemberCard
                                            key={member.id}
                                            member={member}
                                            index={idx}
                                            status={member.status}
                                            badgeClass={member.badgeClass}
                                            department={member.department}
                                        />
                                    ))}
                                </div>
                            )
                        ) : (
                            /* ── VIEW B: Department Board (Categorization Grid) ── */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {DEPARTMENTS.map((dept) => {
                                    const deptMembers = groupedMembers[dept] || [];
                                    return (
                                        <div key={dept} className="bg-gray-100/50 dark:bg-slate-900/30 rounded-2xl p-4 border border-gray-200/50 dark:border-slate-800/50 flex flex-col min-h-[300px]">
                                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200/60 dark:border-slate-800">
                                                <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                                    <span>{dept}</span>
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-500 font-sans">
                                                        {deptMembers.length}
                                                    </span>
                                                </h4>
                                            </div>

                                            <div className="space-y-4 flex-1">
                                                {deptMembers.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
                                                        <span className="text-xs italic">No members</span>
                                                    </div>
                                                ) : (
                                                    deptMembers.map((member, idx) => (
                                                        <TeamMemberCard
                                                            key={member.id}
                                                            member={member}
                                                            index={idx}
                                                            status={member.status}
                                                            badgeClass={member.badgeClass}
                                                            department={member.department}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

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
