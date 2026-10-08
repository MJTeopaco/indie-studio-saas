import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import SystemToast from '@/Components/SystemToast';
import { ChevronRight, ArrowLeft, LayoutGrid } from 'lucide-react';

function getSectionName(url = '') {
    if (url.includes('/overview')) return 'Overview';
    if (url.includes('/ai-workspace')) return 'AI Workspace';
    if (url.includes('/tasks')) return 'Tasks';
    if (url.includes('/schedule')) return 'Schedule';
    if (url.includes('/team')) return 'Team';
    if (url.includes('/projects')) return 'Projects';
    if (url.includes('/docs')) return 'Documentation & Reports';
    if (url.includes('/reports')) return 'Reports & Analytics';
    if (url.includes('/inbox')) return 'Inbox';
    if (url.includes('/settings')) return 'Settings';
    if (url.includes('/burndown')) return 'Burndown';
    if (url.includes('/estimates')) return 'Estimates';
    if (url.includes('/my-work')) return 'My Work';
    if (url.includes('/dashboard')) return 'AI Workspace';
    return 'Studio Workspace';
}

/**
 * Workspace-aware layout for all tenant (studio) pages.
 * Displays a persistent top header with breadcrumb navigation,
 * studio switcher / return to central link, and the studio sidebar.
 */
export default function TenantLayout({ children, studioName }) {
    const pageProps = usePage().props || {};
    const { auth, activeWorkspace, studio: propStudio } = pageProps;
    const currentUrl = usePage().url || '';
    const user = auth?.user;

    const currentStudioName = studioName || propStudio?.name || activeWorkspace || 'Studio';
    const sectionName = getSectionName(currentUrl);
    const studioSlug = activeWorkspace || propStudio?.id || 'default';

    return (
        <div className="h-screen w-full overflow-hidden bg-surface text-text-primary flex">
            {/* Skip to Content for Keyboard/Screen-Reader Users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-xl focus:shadow-lg focus:font-heading focus:text-xs focus:font-bold focus-ring"
            >
                Skip to main content
            </a>

            {/* Left Navigation Sidebar */}
            <Sidebar user={user} studioName={currentStudioName} />

            {/* Main Content Area with Persistent Top Header */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Breadcrumb & Return Bar */}
                <header
                    aria-label="Studio Top Bar"
                    className="h-14 shrink-0 border-b border-surface-border bg-surface-elevated/75 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-20 select-none transition-colors duration-200"
                >
                    {/* Breadcrumbs Trail */}
                    <nav aria-label="Breadcrumbs" className="flex items-center gap-2 min-w-0 text-xs sm:text-sm">
                        <Link
                            href="/dashboard"
                            className="group flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors rounded-md p-1 focus-ring"
                            title="Return to Central Hub"
                        >
                            <LayoutGrid className="w-3.5 h-3.5 text-text-muted group-hover:text-brand transition-colors" />
                            <span className="font-heading font-medium hidden sm:inline">Your Hub</span>
                        </Link>

                        <ChevronRight className="w-3.5 h-3.5 text-text-muted/40 shrink-0" aria-hidden="true" />

                        <Link
                            href={`/studio/${studioSlug}/overview`}
                            className="font-heading font-medium text-text-secondary hover:text-text-primary transition-colors truncate max-w-[120px] sm:max-w-[200px] rounded-md p-1 focus-ring"
                            title={`Studio: ${currentStudioName}`}
                        >
                            {currentStudioName}
                        </Link>

                        <ChevronRight className="w-3.5 h-3.5 text-text-muted/40 shrink-0" aria-hidden="true" />

                        <span className="font-heading font-semibold text-text-primary truncate">
                            {sectionName}
                        </span>
                    </nav>

                    {/* Quick Return to Central Hub Button */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/dashboard"
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-elevated hover:border-brand/40 text-xs font-heading font-medium text-text-secondary hover:text-text-primary transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-2xs hover:shadow-xs focus-ring cursor-pointer"
                            title="Back to Central Hub"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 text-text-muted group-hover:text-brand transition-colors" />
                            <span className="hidden sm:inline">Return to Central</span>
                            <span className="sm:hidden">Central Hub</span>
                        </Link>
                    </div>
                </header>

                {/* Main Page Content */}
                <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {children}
                </main>
            </div>

            {/* Global system toast notifications */}
            <SystemToast />
        </div>
    );
}
