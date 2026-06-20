import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';

/**
 * Workspace-aware layout for all tenant (studio) pages.
 * Reads `activeWorkspace` from Inertia shared props so every
 * nav link is automatically scoped to the current studio's path.
 */
export default function TenantLayout({ children, studioName }) {
    const { auth, activeWorkspace } = usePage().props;
    const user = auth.user;

    const base = `/studio/${activeWorkspace}`;

    const navItems = [
        {
            label: 'Dashboard',
            href: `${base}/dashboard`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
            ),
            active: true,
            comingSoon: false,
        },
        {
            label: 'Tasks',
            href: `${base}/tasks`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
            ),
            active: false,
            comingSoon: true,
        },
        {
            label: 'Team',
            href: `${base}/team`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
            ),
            active: false,
            comingSoon: true,
        },
        {
            label: 'Settings',
            href: `${base}/settings`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
            ),
            active: false,
            comingSoon: true,
        },
    ];

    return (
        <div className="min-h-screen bg-surface text-text-primary flex">

            {/* ── Sidebar ─────────────────────────────────────── */}
            <aside className="w-64 flex-shrink-0 flex flex-col bg-surface-elevated border-r border-surface-border">

                {/* Brand / Studio identity */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
                    <Link href="/" className="flex items-center gap-2">
                        <ApplicationLogo className="text-lg" />
                    </Link>
                </div>

                {/* Studio name badge */}
                <div className="px-5 py-4 border-b border-surface-border">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-1">
                        Workspace
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-brand">
                                {(studioName ?? 'S').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-text-primary truncate">
                            {studioName ?? 'Studio'}
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => (
                        item.comingSoon ? (
                            <div
                                key={item.label}
                                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted cursor-not-allowed select-none opacity-50"
                                title="Coming soon"
                            >
                                <span className="text-text-muted">{item.icon}</span>
                                <span>{item.label}</span>
                                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider bg-surface rounded px-1.5 py-0.5 text-text-muted border border-surface-border">
                                    Soon
                                </span>
                            </div>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                                    item.active
                                        ? 'bg-brand/10 text-brand'
                                        : 'text-text-muted hover:bg-surface hover:text-text-primary'
                                }`}
                            >
                                <span className={item.active ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        )
                    ))}
                </nav>

                {/* User section at bottom */}
                <div className="border-t border-surface-border px-3 py-3">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-surface hover:text-text-primary transition-colors duration-150">
                                {/* Avatar initials */}
                                <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center border border-surface-border flex-shrink-0">
                                    <span className="text-xs font-semibold text-text-primary">
                                        {(user?.name ?? 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="flex-1 text-left truncate">{user?.name}</span>
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="bottom">
                            <Dropdown.Link href={route('profile.edit')}>
                                Profile
                            </Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button">
                                Log Out
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </aside>

            {/* ── Main content ────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
