import React from 'react';
import { Link } from '@inertiajs/react';
import { Folder, ChevronRight, Users, CheckSquare } from 'lucide-react';

export default function ProjectCard({ project, tenantId }) {
    const title = project.title || project.name || 'Untitled Project';
    const description = project.description || 'No description provided for this project yet.';
    const membersCount = project.members_count ?? 0;
    const tasksCount = project.tasks_count ?? 0;

    return (
        <Link
            href={`/studio/${tenantId}/projects/${project.id}`}
            className="group relative block rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-brand dark:hover:border-brand focus-ring overflow-hidden"
        >
            {/* Top decorative brand accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-brand-light opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20 flex items-center justify-center text-brand dark:text-brand-light group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light border border-brand/20">
                        {project.status || 'ACTIVE'}
                    </span>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-brand transition-colors" />
            </div>

            {/* Title */}
            <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-brand-light transition-colors line-clamp-1">
                {title}
            </h3>

            {/* Description */}
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">
                {description}
            </p>

            {/* Footer Metrics */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-gray-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand dark:text-brand-light" />
                    <span>{membersCount} {membersCount === 1 ? 'Member' : 'Members'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <span>{tasksCount} Open {tasksCount === 1 ? 'Task' : 'Tasks'}</span>
                </div>
            </div>
        </Link>
    );
}

