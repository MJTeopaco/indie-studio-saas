import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageHeader } from '@/Components/UI/PageHeader';
import { Segments } from '@/Components/UI/Segments';
import { IconButton } from '@/Components/UI/IconButton';
import { Button } from '@/Components/UI/button';
import TeamMemberCard from '@/Components/Tenant/TeamMemberCard';
import TeamMemberProfileModal from '@/Components/Tenant/Team/TeamMemberProfileModal';
import InviteMemberModal from '@/Components/Tenant/Team/InviteMemberModal';
import {
    Search,
    UserPlus,
    Users,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';

/**
 * Helper to determine department based on position/role.
 * Maps into the 3 studio departments: Engineering, Design, QA.
 */
const getDepartment = (position) => {
    const pos = (position || '').toLowerCase();
    if (
        pos.includes('design') ||
        pos.includes('ui') ||
        pos.includes('ux') ||
        pos.includes('artist') ||
        pos.includes('graphics') ||
        pos.includes('illustrator')
    ) {
        return 'Design';
    }
    if (
        pos.includes('qa') ||
        pos.includes('tester') ||
        pos.includes('quality') ||
        pos.includes('testing')
    ) {
        return 'QA';
    }
    return 'Engineering';
};

/**
 * Helper to extract skill tags array from a member object.
 */
const getMemberSkills = (member) => {
    if (Array.isArray(member.profile?.skillset) && member.profile.skillset.length > 0) {
        return member.profile.skillset
            .map((s) => (typeof s === 'object' ? s.name : s))
            .filter(Boolean);
    }
    if (Array.isArray(member.skills) && member.skills.length > 0) {
        return member.skills
            .map((s) => (typeof s === 'object' ? s.name : s))
            .filter(Boolean);
    }
    if (typeof member.skills === 'string' && member.skills.trim()) {
        return member.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
};

export default function TeamIndex({
    studio,
    members = [],
    canManage = false,
    isOwner = false,
}) {
    const studioName = studio?.name || 'Studio';

    // Filter & search states
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state (kept local to page)
    const [currentPage, setCurrentPage] = useState(1);
    const [columnsCount, setColumnsCount] = useState(4);
    const gridRef = useRef(null);

    // Modal states
    const [selectedMember, setSelectedMember] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // 1. Enrich members with derived department
    const enrichedMembers = useMemo(() => {
        return members.map((m) => {
            const department = getDepartment(m.position);
            return {
                ...m,
                department,
            };
        });
    }, [members]);

    // 2. Department counts for segments
    const departmentCounts = useMemo(() => {
        const counts = { All: enrichedMembers.length, Engineering: 0, Design: 0, QA: 0 };
        enrichedMembers.forEach((m) => {
            if (counts[m.department] !== undefined) {
                counts[m.department] += 1;
            }
        });
        return counts;
    }, [enrichedMembers]);

    // Segment options: Everyone / Engineering / Design / QA
    const departmentOptions = useMemo(
        () => [
            { value: 'All', label: 'Everyone', count: departmentCounts.All },
            { value: 'Engineering', label: 'Engineering', count: departmentCounts.Engineering },
            { value: 'Design', label: 'Design', count: departmentCounts.Design },
            { value: 'QA', label: 'QA', count: departmentCounts.QA },
        ],
        [departmentCounts]
    );

    // 3. Filter members by department and search (name & skills)
    const filteredMembers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return enrichedMembers.filter((m) => {
            // Department filter
            if (selectedDepartment !== 'All' && m.department !== selectedDepartment) {
                return false;
            }

            // Search filter (matches name and skills)
            if (query) {
                const nameMatches = (m.name || '').toLowerCase().includes(query);
                const skills = getMemberSkills(m);
                const skillMatches = skills.some((s) => s.toLowerCase().includes(query));
                if (!nameMatches && !skillMatches) {
                    return false;
                }
            }

            return true;
        });
    }, [enrichedMembers, selectedDepartment, searchQuery]);

    // Reset pagination to page 1 when department or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDepartment, searchQuery]);

    // 4. Derive columns count dynamically from rendered grid via ResizeObserver
    useEffect(() => {
        const el = gridRef.current;
        if (!el) return;

        const measureColumns = () => {
            try {
                const computed = window.getComputedStyle(el).gridTemplateColumns;
                if (computed && computed !== 'none') {
                    const cols = computed.split(' ').filter(Boolean).length;
                    if (cols > 0) {
                        setColumnsCount(cols);
                        return;
                    }
                }
            } catch (e) {
                // Ignore computation errors
            }

            // Fallback calculation: width / (minmax 240px + gap 14px)
            const width = el.getBoundingClientRect().width;
            if (width > 0) {
                const cols = Math.max(1, Math.floor((width + 14) / (240 + 14)));
                setColumnsCount(cols);
            }
        };

        measureColumns();

        const observer = new ResizeObserver(() => {
            measureColumns();
        });
        observer.observe(el);

        return () => observer.disconnect();
    }, [filteredMembers.length]);

    // Page size = number of columns currently shown × 2 rows
    const pageSize = Math.max(2, columnsCount * 2);
    const totalPages = Math.ceil(filteredMembers.length / pageSize);

    // Keep current page within bounds if viewport resizing changes totalPages
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Slice members for active page
    const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    const paginatedMembers = useMemo(() => {
        if (filteredMembers.length <= pageSize) {
            return filteredMembers;
        }
        const startIndex = (safeCurrentPage - 1) * pageSize;
        return filteredMembers.slice(startIndex, startIndex + pageSize);
    }, [filteredMembers, safeCurrentPage, pageSize]);

    // Handlers
    const handleOpenProfile = (member) => {
        setSelectedMember(member);
        setIsProfileModalOpen(true);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedDepartment('All');
    };

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`Your team — ${studioName}`} />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full select-none flex flex-col">
                {/* 1. Page Header */}
                <PageHeader
                    title="Your team"
                    subtitle="Great games start with great people."
                    action={
                        canManage ? (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setIsInviteModalOpen(true)}
                                className="h-8 px-3 text-xs font-heading font-semibold gap-1.5"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Invite member</span>
                            </Button>
                        ) : null
                    }
                    className="mb-[18px]"
                />

                {/* 2. Toolbar row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    {/* Left: Department Segments */}
                    <Segments
                        options={departmentOptions}
                        value={selectedDepartment}
                        onChange={(val) => setSelectedDepartment(val)}
                        className="self-start sm:self-auto"
                    />

                    {/* Right: Search Input (fixed comfortable ~260px width on desktop) */}
                    <div className="relative w-full sm:w-[260px] shrink-0">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or skill..."
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-hidden focus:border-[var(--primary)] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Member Grid / Empty State */}
                {filteredMembers.length === 0 ? (
                    /* 5. Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--card)]/40 my-auto min-h-[260px]">
                        <div className="w-12 h-12 rounded-xl bg-[var(--secondary)] text-[var(--muted-foreground)] flex items-center justify-center mb-3 border border-[var(--border)]">
                            <Users className="w-6 h-6" />
                        </div>

                        <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                            {selectedDepartment !== 'All'
                                ? `No team members in ${selectedDepartment} yet.`
                                : searchQuery
                                ? 'No team members match your criteria.'
                                : 'No team members yet.'}
                        </h3>

                        <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-sm">
                            {selectedDepartment !== 'All'
                                ? `Invite developers or reassign team members to collaborate in ${selectedDepartment}.`
                                : searchQuery
                                ? `No developers found matching "${searchQuery}". Try searching by another name or skill keyword.`
                                : 'Start building your studio team by inviting developers to collaborate in this workspace.'}
                        </p>

                        <div className="mt-4 flex items-center gap-2">
                            {(searchQuery || selectedDepartment !== 'All') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="h-8 px-3 text-xs font-heading font-medium border-[var(--border)]"
                                >
                                    Clear filters
                                </Button>
                            )}

                            {canManage && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="h-8 px-3 text-xs font-heading font-semibold gap-1.5"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Invite member</span>
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* Member grid */}
                        <div
                            ref={gridRef}
                            className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[14px] items-stretch"
                        >
                            {paginatedMembers.map((member) => (
                                <TeamMemberCard
                                    key={member.id}
                                    member={member}
                                    onSelect={handleOpenProfile}
                                />
                            ))}
                        </div>

                        {/* 4. Compact Pagination Bar (rendered only when filtered list exceeds 1 page) */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border)] text-xs">
                                <span className="text-[11px] text-[var(--muted-foreground)]">
                                    {filteredMembers.length}{' '}
                                    {filteredMembers.length === 1 ? 'person' : 'people'}
                                </span>

                                <div className="flex items-center gap-2">
                                    <IconButton
                                        aria-label="Previous page"
                                        variant="outline"
                                        size="sm"
                                        disabled={safeCurrentPage <= 1}
                                        onClick={() =>
                                            setCurrentPage((p) => Math.max(1, p - 1))
                                        }
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </IconButton>

                                    <span className="font-mono text-[11px] text-[var(--foreground)] px-1 font-medium">
                                        {safeCurrentPage} / {totalPages}
                                    </span>

                                    <IconButton
                                        aria-label="Next page"
                                        variant="outline"
                                        size="sm"
                                        disabled={safeCurrentPage >= totalPages}
                                        onClick={() =>
                                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                                        }
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </IconButton>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Developer Passport Modal */}
            <TeamMemberProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => {
                    setIsProfileModalOpen(false);
                    setSelectedMember(null);
                }}
                member={selectedMember}
                canManage={canManage}
            />

            {/* Invite Member Modal */}
            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                studio={studio}
            />
        </TenantLayout>
    );
}
