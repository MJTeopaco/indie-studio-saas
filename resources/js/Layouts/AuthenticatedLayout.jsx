import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import SystemToast from '@/Components/SystemToast';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { User, LogOut } from 'lucide-react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const userInitials = user.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen bg-surface text-text-primary">
            <nav className="border-b border-surface-border bg-surface-elevated">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center">
                            <div className="flex shrink-0 items-center">
                                <Link href={route('dashboard')}>
                                    <ApplicationLogo variant="horizontal" className="h-7" />
                                </Link>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="relative flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-slate-300 dark:ring-slate-700/80 hover:ring-2 hover:ring-brand/70 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-200 overflow-hidden cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-brand"
                                            aria-label="User profile menu"
                                        >
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <span className="font-heading font-bold text-xs uppercase tracking-tight">
                                                    {userInitials}
                                                </span>
                                            )}
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1.5 bg-surface-elevated border border-surface-border rounded-xl shadow-lg">
                                        <div className="px-4 py-2 border-b border-surface-border mb-1">
                                            <p className="text-xs font-semibold text-text-primary truncate">{user.name}</p>
                                            <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                                        </div>

                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <User className="w-3.5 h-3.5 text-text-muted" />
                                            <span>Profile</span>
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors w-full text-left"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span>Log Out</span>
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-text-muted transition duration-150 ease-in-out hover:bg-surface hover:text-text-primary focus:bg-surface focus:text-text-primary focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="border-t border-surface-border pb-2 pt-3">
                        <div className="px-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full ring-1 ring-slate-300 dark:ring-slate-700/80 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    userInitials
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-text-primary truncate">
                                    {user.name}
                                </div>
                                <div className="text-xs text-text-muted truncate">
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-surface-elevated shadow border-b border-surface-border">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
            <SystemToast />
        </div>
    );
}
