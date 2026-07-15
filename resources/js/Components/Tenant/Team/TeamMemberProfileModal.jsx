import React from 'react';
import { Calendar, Clock3, Activity, Sparkles, FolderKanban, StickyNote, Settings, X } from 'lucide-react';

const healthStyles = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
};

const projectHealthStyles = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    danger: 'bg-rose-100 text-rose-700 border-rose-200',
};

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 text-sm dark:border-slate-800">
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-slate-100">{value}</span>
        </div>
    );
}

export default function TeamMemberProfileModal({ isOpen, onClose, member, canManage = false }) {
    if (!isOpen || !member) {
        return null;
    }

    const profile = member.profile || {};
    const health = profile.health || { label: 'Healthy', tone: 'success' };
    const skills = Array.isArray(profile.skillset) ? profile.skillset : [];
    const projects = Array.isArray(profile.projects) ? profile.projects : [];
    const stats = profile.stats || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{member.name}</h2>
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${healthStyles[health.tone] || healthStyles.success}`}>
                                    {health.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{member.position}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Utilization Rate</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-slate-100">{profile.utilization_rate ?? 0}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Avg Update Time</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-slate-100">{profile.avg_update_time || '0h'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Revision Rate</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-slate-100">{profile.revision_rate ?? 0}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-b border-gray-100 px-6 py-4 dark:border-slate-800">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Assigned Tasks</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.total_tasks ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Active Tasks</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.active_tasks ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Completed Tasks</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.completed_tasks ?? 0}</p>
                    </div>
                </div>

                <div className="px-6 pb-4">
                    <InfoRow icon={Calendar} label="Next Availability Date" value={profile.next_availability_date || 'N/A'} />
                    <InfoRow icon={Activity} label="Last Active" value={profile.last_active || 'N/A'} />
                    <InfoRow icon={Clock3} label="Last Update Sent" value={profile.last_update_sent || 'N/A'} />
                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 text-sm dark:border-slate-800">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                            <Sparkles className="h-4 w-4" />
                            <span>Skillset</span>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            {skills.length ? skills.map(skill => (
                                <span key={skill.id} className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                    {skill.name}
                                </span>
                            )) : (
                                <span className="text-xs text-gray-400 dark:text-slate-500">No skills recorded</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                        <FolderKanban className="h-4 w-4" />
                        <span>{projects.length} Project{projects.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="space-y-2">
                        {projects.length ? projects.map(project => (
                            <div key={project.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/40">
                                <div>
                                    <span className="font-semibold text-gray-900 dark:text-slate-100">{project.name}</span>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                                        {project.task_completed_count ?? 0} done / {((project.task_open_count ?? 0) + (project.task_completed_count ?? 0))} assigned
                                    </p>
                                </div>
                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${projectHealthStyles[project.health_tone] || projectHealthStyles.success}`}>
                                    {project.health}
                                </span>
                            </div>
                        )) : (
                            <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                                No project memberships yet.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-slate-800">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200"
                    >
                        <StickyNote className="h-4 w-4" />
                        Notes
                    </button>
                    {canManage && (
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200"
                        >
                            <Settings className="h-4 w-4" />
                            Edit Settings
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
