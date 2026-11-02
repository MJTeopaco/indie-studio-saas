import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { showToast } from '@/Components/SystemToast';

const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 21, 34];

export default function FlagComplexityModal({
    isOpen,
    onClose,
    task,
    tenantId,
    onComplexityFlagged,
}) {
    if (!isOpen || !task) return null;

    const currentSp = task.story_points ?? null;
    const [selectedSp, setSelectedSp] = useState(task.suggested_story_points ?? (currentSp ? (FIBONACCI_VALUES.find(v => v > currentSp) || currentSp) : 5));
    const [feedback, setFeedback] = useState(task.estimate_review_note ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (task) {
            setSelectedSp(task.suggested_story_points ?? (task.story_points ? (FIBONACCI_VALUES.find(v => v > task.story_points) || task.story_points) : 5));
            setFeedback(task.estimate_review_note ?? '');
            setErrorMsg(null);
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSp) {
            setErrorMsg('Please select a suggested Fibonacci story point value.');
            return;
        }
        if (!feedback.trim() || feedback.trim().length < 3) {
            setErrorMsg('Please provide a comment or explanation for the manager.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const url = route('tenant.tasks.flag-complexity', {
                tenant: tenantId,
                task: task.id,
            });

            const res = await axios.post(url, {
                suggested_story_points: Number(selectedSp),
                feedback: feedback.trim(),
            });

            showToast(res.data?.message || 'Manager has been notified of the complexity flag.', 'success');

            if (onComplexityFlagged) {
                onComplexityFlagged(res.data.task);
            }
            onClose();
        } catch (err) {
            console.error('Failed to flag complexity', err);
            const msg = err.response?.data?.message || 'Could not flag complexity. Please try again.';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-900/50 shadow-2xs">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Flag Complexity Issue
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Propose an adjusted Story Point estimate for manager review
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    {/* Task Context Card */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Task Context</span>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                #{task.id} — {task.title}
                            </h4>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Current SP</span>
                            <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                {task.story_points !== null ? `${task.story_points} SP` : 'Unestimated'}
                            </p>
                        </div>
                    </div>

                    {/* Fibonacci Sequence Selector */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Suggested Story Points (Fibonacci)</span>
                            </label>
                            <span className="text-[11px] font-mono text-slate-400">
                                Selected: <strong className="text-brand font-bold">{selectedSp} SP</strong>
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                            Select what you think the realistic story points should be based on real task complexity:
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {FIBONACCI_VALUES.map((val) => {
                                const isCurrent = task.story_points === val;
                                const isSelected = selectedSp === val;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setSelectedSp(val)}
                                        className={`relative py-3 rounded-xl font-mono text-sm font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                                            isSelected
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50 scale-[1.03]'
                                                : isCurrent
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                                                : 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-600'
                                        }`}
                                    >
                                        <span>{val}</span>
                                        {isCurrent && (
                                            <span className="text-[8px] font-sans font-semibold opacity-75 uppercase">Current</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback and Comment Textbox */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            Reason & Feedback for Manager <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Detail why this task is harder than expected (e.g. unknown external API hurdles, hidden technical debt, expanded scope, or blocker dependencies)..."
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                        />
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                            <span>Be specific so the manager can make an informed decision.</span>
                            <span>{feedback.length}/1000</span>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                            {errorMsg}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !feedback.trim()}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Notifying Manager…</span>
                                </>
                            ) : (
                                <>
                                    <span>Confirm & Notify Manager</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
