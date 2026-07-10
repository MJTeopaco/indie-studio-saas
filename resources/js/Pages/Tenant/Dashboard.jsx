import React, { useState } from 'react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, usePage } from '@inertiajs/react';
import ProjectCard from '@/Components/Tenant/Projects/ProjectCard';
import CreateProjectModal from '@/Components/Tenant/Projects/CreateProjectModal';

export default function TenantDashboard({ studio, projects: serverProjects }) {
    const { activeWorkspace } = usePage().props;
    const tenantId = activeWorkspace || (studio ? studio.id : '');

    const initialProjects = Array.isArray(serverProjects) ? serverProjects : [];
    const [projects, setProjects] = useState(initialProjects);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateProject = (newProject) => {
        setProjects((prev) => [newProject, ...prev]);
    };

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title={`${studio?.name || 'Studio'} — Dashboard`} />

            <div className="flex flex-col py-10 px-8 space-y-10 max-w-7xl mx-auto">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-xl p-8">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex items-center justify-between flex-wrap gap-6">
                        <div className="flex items-center gap-5">
                            {/* Studio Avatar */}
                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center shadow-lg shadow-brand/20">
                                <span className="text-3xl font-extrabold text-white">
                                    {(studio?.name || 'S').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-brand font-semibold uppercase tracking-widest mb-1">
                                    Studio Workspace
                                </p>
                                <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
                                    {studio?.name || 'Indie Studio'}
                                </h1>
                            </div>
                        </div>

                        {/* Quick Stats Overview Pills */}
                        <div className="flex items-center gap-4">
                            <div className="bg-surface/80 border border-surface-border rounded-xl px-4 py-2.5 text-center">
                                <p className="text-[11px] text-text-muted uppercase font-semibold">Total Projects</p>
                                <p className="text-lg font-bold text-text-primary mt-0.5">{projects.length}</p>
                            </div>
                            <div className="bg-surface/80 border border-surface-border rounded-xl px-4 py-2.5 text-center">
                                <p className="text-[11px] text-text-muted uppercase font-semibold">Active Members</p>
                                <p className="text-lg font-bold text-text-primary mt-0.5">
                                    {projects.reduce((acc, p) => acc + (p.members_count || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Studio Projects</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Select a project to open its dedicated workspace or launch a new initiative.
                            </p>
                        </div>
                    </div>

                    {/* Responsive CSS Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Dashed Create New Project Card */}
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-100/80 dark:hover:bg-slate-800/80 p-8 text-center transition-all duration-200 min-h-[14rem] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-md">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-7 h-7"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>

                            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                Create New Project
                            </h3>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 max-w-[14rem]">
                                Organize tasks, assign members, and track delivery progress.
                            </p>
                        </button>

                        {/* Existing Project Cards */}
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} tenantId={tenantId} />
                        ))}
                    </div>
                </div>

                {/* Create New Project Modal */}
                <CreateProjectModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateProject}
                />
            </div>
        </TenantLayout>
    );
}
