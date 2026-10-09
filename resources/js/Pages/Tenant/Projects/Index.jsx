import React, { useEffect, useState } from 'react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ProjectCard from '@/Components/Tenant/Projects/ProjectCard';
import CreateProjectModal from '@/Components/Tenant/Projects/CreateProjectModal';

export default function TenantProjectsIndex({ studio, projects: serverProjects }) {
    const { activeWorkspace } = usePage().props;
    const tenantId = activeWorkspace || (studio ? studio.id : 'default');

    const initialProjects = Array.isArray(serverProjects) ? serverProjects : [];

    const [projects, setProjects] = useState(initialProjects);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        setProjects(initialProjects);
    }, [serverProjects]);

    const handleCreateProject = (newProject) => {
        setProjects((prev) => [newProject, ...prev]);
    };

    return (
        <TenantLayout studioName={studio?.name || 'Pixel Play Studio'}>
            <Head title={`${studio?.name || 'Studio'} — Projects`} />

            <div className="flex-1 overflow-y-auto py-10 px-8 space-y-10 max-w-7xl mx-auto w-full">
                {/* Workspace Header Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
                    <div className="relative flex items-center justify-between flex-wrap gap-6">
                        <div className="flex items-center gap-5">
                            {/* Studio Avatar */}
                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-brand/10 dark:bg-brand/20 border border-brand/20 flex items-center justify-center text-brand dark:text-brand-light shadow-sm">
                                <span className="text-2xl font-bold font-mono">
                                    {(studio?.name || 'P').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand dark:text-brand-light mb-1">
                                    Studio Workspace
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-heading">
                                    {studio?.name || 'Pixel Play Studio'}
                                </h1>
                            </div>
                        </div>

                        {/* Quick Stats Overview Pills */}
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-center min-w-[6.5rem]">
                                <p className="text-[11px] text-gray-500 dark:text-slate-400 uppercase font-semibold">Total Projects</p>
                                <p className="text-lg font-bold font-mono text-gray-900 dark:text-slate-100 mt-0.5">{projects.length}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-center min-w-[6.5rem]">
                                <p className="text-[11px] text-gray-500 dark:text-slate-400 uppercase font-semibold">Active Members</p>
                                <p className="text-lg font-bold font-mono text-gray-900 dark:text-slate-100 mt-0.5">
                                    {studio?.members_count ?? projects.reduce((acc, p) => acc + (p.members_count || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-slate-100">Studio Projects</h2>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
                                Select a project to open its dedicated Kanban workspace or launch a new initiative.
                            </p>
                        </div>
                    </div>

                    {/* Responsive CSS Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Dashed Create New Project Card */}
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-brand dark:hover:border-brand bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-100/80 dark:hover:bg-slate-800/80 p-8 text-center transition-all duration-200 min-h-[14rem] focus-ring cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand/10 dark:bg-brand/20 group-hover:bg-brand group-hover:text-white text-brand dark:text-brand-light flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm">
                                <Plus className="w-6 h-6 stroke-[2.5]" />
                            </div>

                            <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                                Create New Project
                            </h3>
                            <p className="mt-1 text-xs text-gray-600 dark:text-slate-400 max-w-[14rem]">
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

