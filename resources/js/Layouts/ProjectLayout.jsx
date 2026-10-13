import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';

import { Search, Bell, HelpCircle, ChevronRight } from 'lucide-react';

export default function ProjectLayout({ auth, project, studioName, children }) {
    const { activeWorkspace, currentStudioName, canManage, currentUserRole } = usePage().props;
    const user = auth?.user || { name: 'Demo User', role: 'manager' };
    const tenantId = activeWorkspace || 'default';
    const projectTitle = project?.title || project?.name || 'Project Workspace';
    const resolvedStudioName = studioName || currentStudioName || 'Studio';

    const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)] flex">
            {/* Left Sidebar */}
            <Sidebar user={user} studioName={resolvedStudioName} />

            {/* Right Side: Header + Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar (64px, sticky, blurred) — breadcrumbs › project name */}
                <header className="sticky top-0 z-30 h-16 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)] shrink-0 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    {/* Left: Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <Link href="/hub" className="hover:text-[var(--foreground)] transition-colors">
                            Workspace
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]/60" />
                        <Link href={`/studio/${tenantId}/dashboard`} className="hover:text-[var(--foreground)] transition-colors truncate max-w-[160px]">
                            {resolvedStudioName}
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]/60" />
                        <span className="text-[var(--foreground)] font-medium truncate max-w-[200px]">
                            Project workspace
                        </span>
                    </nav>

                    {/* Right: Search, Help, Notification, User Avatar */}
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                            <input
                                type="text"
                                readOnly
                                placeholder="Search anything..."
                                className="pl-8 pr-12 py-1.5 w-52 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus:outline-hidden"
                            />
                            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)] bg-[var(--card)] border border-[var(--border)] rounded">
                                ⌘ K
                            </kbd>
                        </div>

                        <button
                            type="button"
                            title="Help and documentation"
                            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            title="Notifications"
                            className="relative p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                        </button>

                        <div className="w-7 h-7 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center text-xs font-bold text-[var(--primary)] font-mono ml-1">
                            {userInitial}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}

