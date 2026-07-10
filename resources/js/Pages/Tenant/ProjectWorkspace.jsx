import React from 'react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function ProjectWorkspace({ studio, project }) {
    const { activeWorkspace } = usePage().props;
    const tenantId = activeWorkspace || (studio ? studio.id : '');

    const projectName = project?.name || project?.title || 'Untitled Project';

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title={`${projectName} — Workspace`} />

            <div className="flex flex-col min-h-[calc(100vh-4rem)]">
                {/* Top Navigation / Header Bar */}
                <header className="border-b border-surface-border bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-30 px-8 py-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/studio/${tenantId}/dashboard`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-surface-border hover:border-brand/60 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors duration-150"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4"
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
                                Back to Dashboard
                            </Link>

                            <div className="h-4 w-px bg-surface-border" />

                            <div className="flex items-center gap-2.5">
                                <span className="text-sm font-bold text-text-primary">
                                    {projectName}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-brand/10 text-brand border border-brand/20">
                                    Active Project
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Body: Expansive Canvas Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-surface to-surface-elevated/40">
                    <div className="max-w-2xl w-full text-center p-12 rounded-3xl bg-surface-elevated/60 border border-surface-border/80 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-6 shadow-md">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-8 h-8"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>

                            <p className="text-xs uppercase tracking-widest font-semibold text-brand mb-2">
                                Scoped Workspace
                            </p>

                            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                                Project Workspace: {projectName}
                            </h1>

                            <p className="mt-4 text-sm text-text-muted max-w-md leading-relaxed">
                                Task and Member management coming soon. This blank landing page establishes the dedicated project context for collaborative scheduling and ML recommendations.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
