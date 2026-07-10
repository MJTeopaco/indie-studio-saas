import React from 'react';
import { Link } from '@inertiajs/react';

export default function ProjectCard({ project, tenantId }) {
    const membersCount = project.members_count ?? 0;
    const tasksCount = project.tasks_count ?? 0;
    const statusText = project.status ? project.status.toUpperCase() : 'ACTIVE';

    return (
        <Link
            href={`/studio/${tenantId}/projects/${project.id}`}
            className="group block relative rounded-2xl bg-white dark:bg-surface-elevated border border-gray-200 dark:border-surface-border p-6 shadow-md hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:border-brand/70 dark:hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-surface overflow-hidden"
        >
            {/* Subtle top accent gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Header: Project Icon & Status Badge */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand transition-transform duration-200 group-hover:scale-105">
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
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-brand/10 text-brand border border-brand/20">
                        {statusText}
                    </span>
                </div>

                <div className="text-gray-400 dark:text-text-muted group-hover:text-brand transition-colors">
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
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </div>

            {/* Project Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-text-primary group-hover:text-brand transition-colors line-clamp-1">
                {project.name || project.title}
            </h3>

            {/* Truncated Description */}
            <p className="mt-2 text-sm text-gray-600 dark:text-text-muted line-clamp-2 min-h-[2.5rem]">
                {project.description || 'No description provided for this project yet.'}
            </p>

            {/* Footer Metrics Pills */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-surface-border/60 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-text-muted">
                <div className="flex items-center gap-1.5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-brand"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{membersCount} {membersCount === 1 ? 'Member' : 'Members'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-indigo-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>{tasksCount} Open {tasksCount === 1 ? 'Task' : 'Tasks'}</span>
                </div>
            </div>
        </Link>
    );
}
