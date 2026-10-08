import { Link, usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import { useState } from 'react';
import axios from 'axios';
import { MoreVertical, Users, ArrowRight } from 'lucide-react';

export default function StudioCard({ studio, role = 'Member' }) {
    const pageUser = usePage().props.auth?.user;
    const isOwner = role.toLowerCase() === 'owner' || studio.owner_id === pageUser?.id;

    const [copying, setCopying] = useState(false);

    // Prevent default to avoid triggering the Link wrapper
    const handleActionClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const copyInviteLink = async () => {
        if (copying) return;
        setCopying(true);
        try {
            const response = await axios.post(`/hub/studio/${studio.id}/invite`);
            const token = response.data.code;
            await navigator.clipboard.writeText(token);

            // Show "Copied!" temporarily
            setTimeout(() => setCopying(false), 2000);
        } catch (error) {
            console.error('Failed to generate invite link', error);
            setCopying(false);
        }
    };

    // Role-dependent authorization:
    // Only studio owners can generate invitation codes via `/hub/studio/{studio}/invite`.
    // Non-owners have no permitted actions on Central Hub.
    // Per specification: If the user has no permitted actions for that studio, do not render the kebab at all.
    const hasPermittedActions = isOwner;

    const memberCount = studio.users_count ?? studio.members_count ?? 1;

    return (
        <Link
            href={`/studio/${studio.id}/overview`}
            className="group relative flex flex-col justify-between rounded-2xl border border-surface-border bg-surface-elevated/85 hover:bg-surface-elevated shadow-xs hover:shadow-md hover:border-brand/40 transition-all duration-200 ease-out hover:-translate-y-0.5 overflow-hidden focus-ring p-5 sm:p-6 cursor-pointer"
        >
            <div>
                {/* Row 1: Studio avatar tile on left, kebab menu on right */}
                <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 group-hover:bg-brand/20 group-hover:border-brand/40 flex items-center justify-center flex-shrink-0 transition-all duration-200 overflow-hidden shadow-2xs">
                        {studio.logo ? (
                            <img
                                src={studio.logo}
                                alt={studio.name}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        ) : (
                            <span className="font-heading font-bold text-lg text-brand">
                                {studio.name ? studio.name.charAt(0).toUpperCase() : 'S'}
                            </span>
                        )}
                    </div>

                    {/* Kebab menu button (rendered ONLY if user has permitted actions) */}
                    {hasPermittedActions && (
                        <div className="relative z-10 -mr-1.5 -mt-1.5" onClick={handleActionClick}>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-surface-border transition-colors duration-150 focus-ring cursor-pointer"
                                        aria-label={`Actions for ${studio.name}`}
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-surface-elevated border border-surface-border rounded-xl shadow-lg">
                                    {isOwner && (
                                        <button
                                            type="button"
                                            onClick={copyInviteLink}
                                            className="block w-full px-4 py-2 text-left text-xs leading-5 text-text-primary hover:bg-surface transition duration-150 ease-in-out focus:outline-none focus:bg-surface cursor-pointer"
                                        >
                                            {copying ? 'Copied code!' : 'Copy invite code'}
                                        </button>
                                    )}
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    )}
                </div>

                {/* Studio name below avatar */}
                <div className="mt-4">
                    <h3 className="font-heading text-base sm:text-lg font-semibold text-text-primary group-hover:text-brand transition-colors duration-150 truncate tracking-tight">
                        {studio.name}
                    </h3>

                    {/* Meta row: role badge + member count */}
                    <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-surface border border-surface-border text-text-muted">
                            {role}
                        </span>
                        <span className="text-xs text-text-muted inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            <span>
                                {memberCount} {memberCount === 1 ? 'member' : 'members'}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer row separated by hairline divider */}
            <div className="mt-5 pt-3.5 border-t border-surface-border/70 group-hover:border-surface-border transition-colors duration-150 flex items-center justify-between text-xs text-text-muted">
                {studio.last_activity ? (
                    <span>{studio.last_activity}</span>
                ) : (
                    <span />
                )}
                <span className="inline-flex items-center gap-1.5 font-semibold text-text-muted group-hover:text-brand transition-colors duration-150">
                    Open
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </span>
            </div>
        </Link>
    );
}
