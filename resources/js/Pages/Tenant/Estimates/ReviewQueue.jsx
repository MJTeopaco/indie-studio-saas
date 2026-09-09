import React, { useState } from 'react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, router, useForm } from '@inertiajs/react';

export default function ReviewQueue({ studio, tasks }) {
    const [resolving, setResolving] = useState(null);
    const [resolutionData, setResolutionData] = useState({});

    const handleResolve = (taskId) => {
        const data = resolutionData[taskId] || {};
        if (!data.story_points) {
            alert('Please select a final point value.');
            return;
        }

        setResolving(taskId);
        router.post(`/studio/${studio?.id || 'default'}/tasks/${taskId}/estimates/resolve`, {
            story_points: data.story_points,
            estimate_review_note: data.estimate_review_note || '',
        }, {
            preserveScroll: true,
            onFinish: () => setResolving(null)
        });
    };

    const updateData = (taskId, field, value) => {
        setResolutionData(prev => ({
            ...prev,
            [taskId]: {
                ...(prev[taskId] || {}),
                [field]: value
            }
        }));
    };

    const fibonacci = [1, 2, 3, 5, 8, 13];

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title="Estimate Review Queue" />

            <div className="flex-1 overflow-y-auto py-10 px-8 space-y-8 max-w-7xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estimate Review Queue</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Resolve diverged or expired estimates to unblock scheduling.
                    </p>
                </div>

                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm text-center">
                        <svg className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Queue Clear</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No estimates currently require manager resolution.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tasks.map((task) => (
                            <div key={task.id} className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/30 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                                            <span className="inline-block mt-1 text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                                                {task.project?.name || 'No Project'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.story_points_ai_suggested && (
                                                <span className="text-xs font-medium text-brand dark:text-brand-light bg-brand/10 px-2 py-1 rounded-md">
                                                    AI Suggestion: {task.story_points_ai_suggested} pt
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Submissions</h4>
                                        {task.submissions && task.submissions.length > 0 ? (
                                            <div className="space-y-2">
                                                {task.submissions.map((sub, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sub.developer_name}</span>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded shadow-sm border border-gray-200 dark:border-slate-700">
                                                            {sub.submitted_points} pt
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No submissions (grace period expired).</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Resolution</h4>
                                        <div className="space-y-4 flex-1">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Final Story Points</label>
                                                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-max">
                                                    {fibonacci.map((point) => (
                                                        <button
                                                            key={point}
                                                            onClick={() => updateData(task.id, 'story_points', point)}
                                                            className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-semibold transition-all focus:outline-none ${
                                                                (resolutionData[task.id]?.story_points === point)
                                                                    ? 'bg-brand text-white shadow-md'
                                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'
                                                            }`}
                                                        >
                                                            {point}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution Note (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={resolutionData[task.id]?.estimate_review_note || ''}
                                                    onChange={(e) => updateData(task.id, 'estimate_review_note', e.target.value)}
                                                    placeholder="Why was this value chosen?"
                                                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-brand focus:border-brand"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-right">
                                            <button
                                                onClick={() => handleResolve(task.id)}
                                                disabled={resolving === task.id || !resolutionData[task.id]?.story_points}
                                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
                                            >
                                                {resolving === task.id ? 'Resolving...' : 'Lock Estimate'}
                                            </button>
                                        </div>
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
