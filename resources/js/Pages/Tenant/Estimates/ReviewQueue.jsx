import React, { useState } from 'react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head, router } from '@inertiajs/react';
import { showToast } from '@/Components/SystemToast';
import { CheckCircle, Sparkles, Lock, Loader2 } from 'lucide-react';

export default function ReviewQueue({ studio, tasks }) {
    const [resolving, setResolving] = useState(null);
    const [resolutionData, setResolutionData] = useState({});

    const handleResolve = (taskId) => {
        const data = resolutionData[taskId] || {};
        if (!data.story_points) {
            showToast('Please select a final point value.', 'warning');
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
                    <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-slate-100">Estimate Review Queue</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Resolve diverged or expired estimates to unblock sprint scheduling and CPA calculation.
                    </p>
                </div>

                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
                        <h3 className="text-lg font-bold font-heading text-gray-900 dark:text-slate-100">Queue Clear</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">No estimates currently require manager resolution.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tasks.map((task) => (
                            <div key={task.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-950/10">
                                    <div className="flex items-start justify-between flex-wrap gap-4">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{task.title}</h3>
                                            <span className="inline-block mt-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md font-medium border border-gray-200/50 dark:border-slate-700/50">
                                                {task.project?.name || 'No Project'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.story_points_ai_suggested && (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-brand dark:text-brand-light bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-lg">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    AI Suggestion: <strong className="font-mono">{task.story_points_ai_suggested} pt</strong>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Submissions</h4>
                                        {task.submissions && task.submissions.length > 0 ? (
                                            <div className="space-y-2">
                                                {task.submissions.map((sub, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/80 p-3 rounded-xl border border-gray-150 dark:border-slate-700/60">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{sub.developer_name}</span>
                                                        <span className="text-sm font-bold font-mono text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg shadow-2xs border border-gray-200 dark:border-slate-700">
                                                            {sub.submitted_points} pt
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 dark:text-slate-500 italic">No submissions (grace period expired).</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Resolution</h4>
                                        <div className="space-y-4 flex-1">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Final Story Points</label>
                                                <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700/60 w-max">
                                                    {fibonacci.map((point) => (
                                                        <button
                                                            key={point}
                                                            onClick={() => updateData(task.id, 'story_points', point)}
                                                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold font-mono transition-all focus-ring ${
                                                                (resolutionData[task.id]?.story_points === point)
                                                                    ? 'bg-brand text-white shadow-sm'
                                                                    : 'text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs'
                                                            }`}
                                                        >
                                                            {point}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Resolution Note (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={resolutionData[task.id]?.estimate_review_note || ''}
                                                    onChange={(e) => updateData(task.id, 'estimate_review_note', e.target.value)}
                                                    placeholder="Why was this value chosen?"
                                                    className="w-full text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus-ring px-3.5 py-2"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 text-right">
                                            <button
                                                onClick={() => handleResolve(task.id)}
                                                disabled={resolving === task.id || !resolutionData[task.id]?.story_points}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark focus-ring disabled:opacity-50 transition-all shadow-sm"
                                            >
                                                {resolving === task.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Lock className="w-4 h-4" />
                                                )}
                                                <span>{resolving === task.id ? 'Resolving...' : 'Lock Estimate'}</span>
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

