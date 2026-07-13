import { Link } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import { useState } from 'react';
import axios from 'axios';

export default function StudioCard({ studio, role = 'Member' }) {
    const isOwner = role.toLowerCase() === 'owner';

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
            console.error("Failed to generate invite link", error);
            setCopying(false);
        }
    };

    return (
        <Link
            href={`/studio/${studio.id}/dashboard`}
            className="group block bg-surface-elevated rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                            <span className="text-lg font-bold text-brand">
                                {studio.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-heading text-lg font-bold text-text-primary group-hover:text-brand transition-colors">
                                {studio.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface border border-surface-border text-text-muted">
                                    {role}
                                </span>
                                <span className="text-xs text-text-muted flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {(studio.users_count ?? studio.members_count ?? 1)} {((studio.users_count ?? studio.members_count ?? 1) === 1) ? 'Member' : 'Members'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Actions (Dropdown) */}
                    <div className="relative z-10" onClick={handleActionClick}>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-lg transition-colors focus:outline-none">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48">
                                {isOwner ? (
                                    <button 
                                        onClick={copyInviteLink} 
                                        className="block w-full px-4 py-2 text-left text-sm leading-5 text-text-primary hover:bg-surface transition duration-150 ease-in-out focus:outline-none focus:bg-surface"
                                    >
                                        {copying ? 'Copied Code!' : 'Copy Invite Code'}
                                    </button>
                                ) : (
                                    <Dropdown.Link href="#" as="button" className="text-red-600 hover:text-red-700">
                                        Leave Studio
                                    </Dropdown.Link>
                                )}
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </Link>
    );
}
