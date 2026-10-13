import React from 'react';
import {
    Calendar,
    Clock3,
    Activity,
    Sparkles,
    FolderKanban,
    StickyNote,
    Settings,
    X,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import Modal from '@/Components/Modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/UI/avatar';
import { Badge } from '@/Components/UI/badge';
import { Button } from '@/Components/UI/button';
import { IconButton } from '@/Components/UI/IconButton';
import { SectionHeader } from '@/Components/UI/SectionHeader';
import { cn } from '@/lib/utils';

export default function TeamMemberProfileModal({
    isOpen,
    onClose,
    member,
    canManage = false,
}) {
    if (!member) {
        return null;
    }

    const profile = member.profile || {};
    const health = profile.health || { label: 'Healthy', tone: 'success' };
    const skills = Array.isArray(profile.skillset) ? profile.skillset : [];
    const projects = Array.isArray(profile.projects) ? profile.projects : [];
    const stats = profile.stats || {};
    const initial = (member.name || 'U').charAt(0).toUpperCase();

    const healthBadgeClass =
        health.tone === 'danger'
            ? 'border-[var(--critical)]/30 bg-[var(--critical)]/10 text-[var(--critical)]'
            : health.tone === 'warning'
            ? 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]'
            : 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="xl">
            <div className="bg-[var(--card)] text-[var(--foreground)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[85vh]">
                {/* 1. Modal Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 rounded-full border border-[var(--border)] shrink-0">
                            {member.avatar_url && (
                                <AvatarImage src={member.avatar_url} alt={member.name} />
                            )}
                            <AvatarFallback className="bg-[var(--secondary)] text-[var(--foreground)] text-sm font-bold font-mono">
                                {initial}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-heading text-sm sm:text-base font-bold text-[var(--foreground)] truncate">
                                    {member.name}
                                </h3>
                                <Badge
                                    className={cn(
                                        'text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0',
                                        healthBadgeClass
                                    )}
                                >
                                    {health.label}
                                </Badge>
                                {member.working_status === 'on_leave' && (
                                    <Badge
                                        variant="warning"
                                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] shrink-0"
                                    >
                                        On Leave {member.leave_end_date ? `(Until ${member.leave_end_date})` : ''}
                                    </Badge>
                                )}
                                {member.leave_request_status === 'pending' && (
                                    <Badge
                                        variant="warning"
                                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] shrink-0"
                                    >
                                        Leave Pending
                                    </Badge>
                                )}
                                {member.working_status === 'emergency' && (
                                    <Badge
                                        variant="destructive"
                                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--critical)]/30 bg-[var(--critical)]/10 text-[var(--critical)] shrink-0"
                                    >
                                        Emergency Absence
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">
                                {member.position || member.role || 'Contributor'} • Joined {member.joined_at || 'Recently'}
                            </p>
                        </div>
                    </div>

                    <IconButton
                        aria-label="Close passport"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </IconButton>
                </div>

                {/* 2. Scrollable Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                    {/* Performance & Capacity Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)] text-center">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                                Utilization
                            </p>
                            <p className="font-mono text-base font-bold text-[var(--foreground)] mt-0.5">
                                {profile.utilization_rate ?? 0}%
                            </p>
                        </div>
                        <div className="border-x border-[var(--border)]">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                                Avg Turnaround
                            </p>
                            <p className="font-mono text-base font-bold text-[var(--foreground)] mt-0.5">
                                {profile.avg_update_time || '0h'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                                Revision Rate
                            </p>
                            <p className="font-mono text-base font-bold text-[var(--foreground)] mt-0.5">
                                {profile.revision_rate ?? 0}%
                            </p>
                        </div>
                    </div>

                    {/* Task Execution Matrix */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[var(--secondary)]/40 border border-[var(--border)] text-center">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                                Total Tasks
                            </p>
                            <p className="font-mono text-sm font-semibold text-[var(--foreground)] mt-0.5">
                                {stats.total_tasks ?? 0}
                            </p>
                        </div>
                        <div className="border-x border-[var(--border)]">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                                Active Tasks
                            </p>
                            <p className="font-mono text-sm font-semibold text-[var(--primary)] mt-0.5">
                                {stats.active_tasks ?? 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                                Completed
                            </p>
                            <p className="font-mono text-sm font-semibold text-[var(--success)] mt-0.5">
                                {stats.completed_tasks ?? 0}
                            </p>
                        </div>
                    </div>

                    {/* Availability & Activity */}
                    <div className="space-y-2">
                        <SectionHeader
                            icon={Calendar}
                            title="Availability & Activity"
                            description="Recent check-ins and delivery schedule."
                        />
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/60">
                                <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" /> Next Available
                                </span>
                                <span className="font-mono text-[11px] font-medium text-[var(--foreground)]">
                                    {profile.next_availability_date || 'Immediate'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/60">
                                <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-[var(--success)]" /> Last Active
                                </span>
                                <span className="text-[11px] text-[var(--foreground)]">
                                    {profile.last_active || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/60">
                                <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5">
                                    <Clock3 className="w-3.5 h-3.5 text-[var(--warning)]" /> Last Update Sent
                                </span>
                                <span className="text-[11px] text-[var(--foreground)]">
                                    {profile.last_update_sent || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Skill Matrix */}
                    <div className="space-y-2">
                        <SectionHeader
                            icon={Sparkles}
                            title="Skill Matrix"
                            description="Demonstrated technical proficiencies and tooling."
                        />
                        <div className="flex flex-wrap gap-1.5">
                            {skills.length > 0 ? (
                                skills.map((skill) => (
                                    <span
                                        key={skill.id || skill.name}
                                        className="text-[10px] bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] px-2 py-1 rounded-[4px] font-medium flex items-center gap-1.5"
                                    >
                                        <span>{skill.name}</span>
                                        {skill.proficiency_level > 0 && (
                                            <span className="text-[9px] font-mono text-[var(--primary)] font-bold">
                                                L{skill.proficiency_level}
                                            </span>
                                        )}
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-[var(--muted-foreground)] italic">
                                    No skills recorded in developer passport.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Project Memberships */}
                    <div className="space-y-2">
                        <SectionHeader
                            icon={FolderKanban}
                            title={`Assigned Projects (${projects.length})`}
                            description="Active initiatives and deliverables."
                        />
                        <div className="space-y-1.5">
                            {projects.length > 0 ? (
                                projects.map((project) => {
                                    const open = project.task_open_count ?? 0;
                                    const done = project.task_completed_count ?? 0;
                                    const isExpiring = project.health_tone === 'danger';

                                    return (
                                        <div
                                            key={project.id}
                                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[var(--secondary)]/40 border border-[var(--border)] text-xs"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-[var(--foreground)] truncate">
                                                    {project.name}
                                                </p>
                                                <p className="text-[10px] text-[var(--muted-foreground)] font-mono mt-0.5">
                                                    {done} completed / {open + done} assigned tasks
                                                </p>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    'text-[9px] font-medium px-2 py-0.5 rounded-full border shrink-0',
                                                    isExpiring
                                                        ? 'border-[var(--critical)]/30 bg-[var(--critical)]/10 text-[var(--critical)]'
                                                        : 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]'
                                                )}
                                            >
                                                {project.health || 'On track'}
                                            </Badge>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-[var(--muted-foreground)] italic">
                                    No active project memberships yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Modal Actions Row (Right-aligned at bottom) */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-t border-[var(--border)] shrink-0 bg-[var(--card)]">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs font-heading font-medium gap-1.5 border-[var(--border)]"
                        >
                            <StickyNote className="w-3.5 h-3.5" />
                            <span>Notes</span>
                        </Button>
                        {canManage && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs font-heading font-medium gap-1.5 border-[var(--border)]"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                <span>Settings</span>
                            </Button>
                        )}
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        className="h-8 px-4 text-xs font-heading font-medium"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
