import React, { useState } from 'react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';

export default function PendingQueue({ studio, tasks }) {
    const [submitting, setSubmitting] = useState(null);

    const submitEstimate = (taskId, points) => {
        setSubmitting(taskId);
        router.post(`/studio/${studio?.id || 'default'}/tasks/${taskId}/estimates`, {
            submitted_points: points
        }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(null)
        });
    };

    const fibonacci = [1, 2, 3, 5, 8, 13];

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title="Pending Estimates" />

            <div className="flex-1 overflow-y-auto py-10 px-8 space-y-8 max-w-7xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-slate-100">Pending Estimates</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Select a Fibonacci point value for tasks requiring your estimation.
                    </p>
                </div>

                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
                        <h3 className="text-lg font-bold font-heading text-gray-900 dark:text-slate-100">You're all caught up!</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">No tasks currently require your estimation.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div key={task.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{task.title}</h3>
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-lg font-medium border border-gray-200/50 dark:border-slate-700/50">
                                            {task.project?.name || 'No Project'}
                                        </span>
                                        {task.story_points_ai_suggested && (
                                            <span className="flex items-center gap-1.5 text-brand dark:text-brand-light font-medium bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-lg">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                AI Suggests: <strong className="font-mono">{task.story_points_ai_suggested} pt</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700/60">
                                        {fibonacci.map((point) => (
                                            <button
                                                key={point}
                                                onClick={() => submitEstimate(task.id, point)}
                                                disabled={submitting === task.id}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold font-mono text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-brand dark:hover:text-brand-light transition-all focus-ring disabled:opacity-50"
                                            >
                                                {submitting === task.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    point
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}

