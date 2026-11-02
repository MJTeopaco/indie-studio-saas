import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/UI/avatar';
import { Badge } from '@/Components/UI/badge';
import { Progress } from '@/Components/UI/progress';
import { Button } from '@/Components/UI/button';
import { cn } from '@/lib/utils';

/**
 * TeamMemberCard — Sleek compact panel card for team members.
 * Conforms to StudioSprint design token standards (10-11px compact UI, 1px var(--border)).
 */
export default function TeamMemberCard({
    member,
    onSelect,
    className,
}) {
    if (!member) return null;

    // Extract workload and capacity
    const stats = member.profile?.stats || {};
    const maxHours = Number(stats.max_hours_per_week ?? member.max_hours_per_week ?? 40);
    const rawWorkload = Number(stats.active_load_hours ?? member.weekly_hours ?? member.workload ?? 0);
    const workloadHours = Math.round(rawWorkload * 10) / 10;

    const isOverCapacity = workloadHours > maxHours;
    const progressVal = maxHours > 0 ? Math.min(100, Math.round((workloadHours / maxHours) * 100)) : 0;

    // Health & Operational status (synchronized with TeamMemberProfileModal)
    const health = member.profile?.health || { label: 'Healthy', tone: 'success' };
    const healthBadgeClass =
        health.tone === 'danger'
            ? 'border-[var(--critical)]/30 bg-[var(--critical)]/10 text-[var(--critical)]'
            : health.tone === 'warning'
            ? 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]'
            : 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';

    const isEmergency = member.working_status === 'emergency';
    const isOnLeave = member.working_status === 'on_leave';
    const isLeavePending = member.leave_request_status === 'pending' && !isOnLeave;

    // Extract skill tags
    const skills = React.useMemo(() => {
        if (Array.isArray(member.profile?.skillset) && member.profile.skillset.length > 0) {
            return member.profile.skillset.map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean);
        }
        if (Array.isArray(member.skills) && member.skills.length > 0) {
            return member.skills.map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean);
        }
        if (typeof member.skills === 'string' && member.skills.trim()) {
            return member.skills.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
    }, [member]);

    const initial = (member.name || 'U').charAt(0).toUpperCase();
    const roleText = member.position || member.role || 'Contributor';

    return (
        <div
            className={cn(
                'group rounded-[10px] bg-[var(--card)] border border-[var(--border)] p-[14px_16px] flex flex-col gap-2 h-full transition-all hover:border-[var(--primary)]/40 relative',
                className
            )}
        >
            {/* 1. Top row: 32px avatar + operational status & health badges */}
            <div className="flex items-center justify-between gap-2">
                <Avatar className="h-8 w-8 rounded-full border border-[var(--border)] shrink-0">
                    {member.avatar_url && (
                        <AvatarImage src={member.avatar_url} alt={member.name} />
                    )}
                    <AvatarFallback className="bg-[var(--secondary)] text-[var(--foreground)] text-xs font-bold font-mono">
                        {initial}
                    </AvatarFallback>
                </Avatar>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Operational exception badges */}
                    {isEmergency && (
                        <Badge
                            variant="destructive"
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--critical)]/30 bg-[var(--critical)]/10 text-[var(--critical)] shrink-0"
                        >
                            Emergency
                        </Badge>
                    )}
                    {isOnLeave && (
                        <Badge
                            variant="warning"
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] shrink-0"
                        >
                            On Leave
                        </Badge>
                    )}
                    {isLeavePending && (
                        <Badge
                            variant="warning"
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] shrink-0"
                        >
                            Leave Pending
                        </Badge>
                    )}

                    {/* Member Profile Health badge (matches modal header) */}
                    <Badge
                        className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0',
                            healthBadgeClass
                        )}
                    >
                        {health.label}
                    </Badge>
                </div>
            </div>

            {/* 2. Member name (13px, medium weight) */}
            <div className="min-w-0">
                <h3
                    className="text-[13px] font-medium text-[var(--foreground)] truncate leading-tight group-hover:text-[var(--primary)] transition-colors"
                    title={member.name}
                >
                    {member.name}
                </h3>

                {/* 3. Role (10px, muted) */}
                <p
                    className="text-[10px] text-[var(--muted-foreground)] truncate mt-0.5"
                    title={roleText}
                >
                    {roleText}
                </p>
            </div>

            {/* 4. Workload row: Weekly workload label (+ Over capacity chip) + mono Xh/Yh + slim Progress */}
            <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[var(--muted-foreground)] truncate">Weekly workload</span>
                        {isOverCapacity && (
                            <span className="text-[9px] font-medium text-[var(--warning)] bg-[var(--warning)]/10 px-1.5 py-0.5 rounded border border-[var(--warning)]/20 whitespace-nowrap">
                                Over capacity
                            </span>
                        )}
                    </div>
                    <span className="font-mono text-[var(--foreground)] font-medium shrink-0 ml-1">
                        {workloadHours}h / {maxHours}h
                    </span>
                </div>
                <Progress
                    value={progressVal}
                    className="h-1 bg-[var(--secondary)] rounded-full overflow-hidden"
                    indicatorClassName={
                        isOverCapacity ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'
                    }
                />
            </div>

            {/* 5. Skill tags: small pill chips (9px, muted background, 3px radius, wrap) */}
            <div className="flex flex-wrap gap-1.5 min-h-[22px] items-start pt-1">
                {skills.length > 0 ? (
                    skills.slice(0, 5).map((skill, idx) => (
                        <span
                            key={idx}
                            className="text-[9px] bg-[var(--secondary)] text-[var(--muted-foreground)] px-1.5 py-0.5 rounded-[3px] font-medium leading-tight"
                        >
                            {skill}
                        </span>
                    ))
                ) : (
                    <span className="text-[9px] text-[var(--muted-foreground)]/50 italic">
                        No skills listed
                    </span>
                )}
                {skills.length > 5 && (
                    <span className="text-[9px] bg-[var(--secondary)]/60 text-[var(--muted-foreground)] px-1 py-0.5 rounded-[3px] font-mono">
                        +{skills.length - 5}
                    </span>
                )}
            </div>

            {/* 6. Full-width ghost "View profile →" button pinned to card bottom via margin-top: auto */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSelect && onSelect(member)}
                className="w-full mt-auto text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] justify-center h-7 py-1 px-2 rounded-lg transition-colors border border-transparent hover:border-[var(--border)] cursor-pointer"
            >
                <span>View profile</span>
                <span className="ml-1 text-[var(--primary)] transition-transform group-hover:translate-x-0.5">
                    →
                </span>
            </Button>
        </div>
    );
}
