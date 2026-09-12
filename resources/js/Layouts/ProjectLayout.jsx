import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';

export default function ProjectLayout({ auth, project, children }) {
    const { activeWorkspace, canManage, currentUserRole } = usePage().props;
    const user = auth?.user || { name: 'Demo User', role: 'manager' };
    const tenantId = activeWorkspace || 'default';
    const projectTitle = project?.title || project?.name || 'Project Workspace';

    return (
        <div className="h-screen w-full overflow-hidden bg-surface text-text-primary flex">
            {/* AI-Agentic StudioSprint Left Sidebar */}
            <Sidebar user={user} />

            {/* Right Side: Header + Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Project Header Bar */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        {/* Left: Back Link & Project Title */}
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/studio/${tenantId}/dashboard`}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                title="Back to Studio Dashboard"
                            >
                                {/* ArrowLeft icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                            </Link>

                            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand dark:text-brand-light">
                                    StudioSprint Workspace
                                </span>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    {projectTitle}
                                </h1>
                            </div>
                        </div>

                        {/* Right: User Info */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-8 h-8 rounded-full bg-brand-10 dark:bg-brand-20 border border-brand-30 flex items-center justify-center text-xs font-bold text-brand dark:text-brand-light">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                        {user.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {currentUserRole || 'Member'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}

