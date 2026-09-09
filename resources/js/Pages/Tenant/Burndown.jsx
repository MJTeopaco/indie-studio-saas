import React from 'react';
import { Head } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { TrendingDown, Activity } from 'lucide-react';

export default function Burndown({ burndownData = [], studioName }) {
    return (
        <TenantLayout studioName={studioName}>
            <Head title={`Burndown Dashboard — ${studioName}`} />
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-12">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingDown className="w-6 h-6 text-brand" />
                            Burndown & Velocity Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Track sprint progress and team velocity across projects.</p>
                    </div>

                    {burndownData.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-sm border border-gray-200 dark:border-slate-700">
                            <p className="text-gray-500 dark:text-gray-400">No active projects found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {burndownData.map((project) => (
                                <div key={project.project_id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                                    <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                                        {project.project_name}
                                        <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-brand-10 text-brand">
                                            {project.remaining_points} pts remaining
                                        </span>
                                    </h2>
                                    
                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-1 bg-gray-100 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                            <div 
                                                className="bg-brand h-full rounded-full transition-all"
                                                style={{ width: `${project.total_points > 0 ? (project.completed_points / project.total_points) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 w-16 text-right">
                                            {project.total_points > 0 ? Math.round((project.completed_points / project.total_points) * 100) : 0}%
                                        </div>
                                    </div>

                                    <div className="mt-8 border-t border-gray-100 dark:border-slate-700/60 pt-6">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
                                            <Activity className="w-4 h-4 text-emerald-500" />
                                            Velocity History
                                        </h3>
                                        
                                        {project.velocities.length === 0 ? (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">No sprints computed yet. Wait for the nightly sweep.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {project.velocities.map((v, i) => (
                                                    <div key={i} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{v.sprint}</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">{v.velocity} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </TenantLayout>
    );
}
