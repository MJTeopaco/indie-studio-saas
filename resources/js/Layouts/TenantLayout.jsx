import React from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';

/**
 * Workspace-aware layout for all tenant (studio) pages.
 * Reads `activeWorkspace` from Inertia shared props so every
 * nav link is automatically scoped to the current studio's path.
 */
export default function TenantLayout({ children, studioName }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex">
            {/* AI-Agentic StudioSprint Left Sidebar */}
            <Sidebar user={user} studioName={studioName} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

