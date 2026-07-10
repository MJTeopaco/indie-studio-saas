import React from 'react';
import { Link } from '@inertiajs/react';

export default function ProjectCard({ project, tenantId }) {
    const title = project.title || project.name || 'Untitled Project';
    const description = project.description || 'No description provided for this project yet.';
    const membersCount = project.members_count ?? 0;
    const tasksCount = project.tasks_count ?? 0;

    return (
        <Link
            href={`/studio/${tenantId}/projects/${project.id}`}
            className="group relative block rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-hidden"
        >
            {/* Top decorative indigo accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        {/* Folder icon */}
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {project.status || 'ACTIVE'}
                    </span>
                </div>

                <span className="text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors">
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
                </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {title}
            </h3>

            {/* Description */}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
                {description}
            </p>

            {/* Footer Metrics */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                    {/* Users icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-indigo-500 dark:text-indigo-400"
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
                    {/* CheckSquare icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-purple-500 dark:text-purple-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>{tasksCount} Open {tasksCount === 1 ? 'Task' : 'Tasks'}</span>
                </div>
            </div>
        </Link>
    );
}
