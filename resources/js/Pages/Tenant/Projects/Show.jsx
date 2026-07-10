import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ProjectLayout from '@/Layouts/ProjectLayout';

export default function Show({ project, auth }) {
    const pageProps = usePage().props;
    const currentAuth = auth || pageProps.auth || { user: { name: 'Studio Member', role: 'manager' } };
    const projectData = project || {
        id: 1,
        title: 'StudioSprint Project Workspace',
        description: 'Collaborative development space.',
    };

    const projectTitle = projectData.title || projectData.name || 'Untitled Project';

    return (
        <ProjectLayout auth={currentAuth} project={projectData}>
            <Head title={`Project Workspace - ${projectTitle}`} />

            {/* Expansive Blank Canvas Area with Center Watermark */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-12 min-h-[calc(100vh-4rem)]">
                <div className="max-w-xl text-center space-y-4 p-10 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {/* FolderKanban / Workspace icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-7 h-7"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                            <path d="M8 10v4" />
                            <path d="M12 10v2" />
                            <path d="M16 10v6" />
                        </svg>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        Project Workspace: {projectTitle}
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                        Task and Member management coming soon. This blank landing page establishes the dedicated project context for collaborative scheduling and ML recommendations.
                    </p>
                </div>
            </div>
        </ProjectLayout>
    );
}
