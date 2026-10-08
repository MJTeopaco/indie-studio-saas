import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FolderPlus, X, Loader2 } from 'lucide-react';

const MAX_DESCRIPTION_LENGTH = 500;

export default function CreateProjectModal({ isOpen, onClose, onCreate, onCreated, initialTitle = '', initialDescription = '', planCount = 0 }) {
    const { activeWorkspace } = usePage().props;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [targetEndDate, setTargetEndDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setDescription(initialDescription);
            setStartDate(new Date().toISOString().split('T')[0]);
            setTargetEndDate('');
            setError('');
        }
    }, [isOpen, initialTitle, initialDescription]);

    // Handle Escape key to dismiss dialog
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isSubmitting) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (isSubmitting) return;
        setError('');
        setTitle('');
        setDescription('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError('Project title is required.');
            return;
        }

        // Chronological validation
        if (targetEndDate && startDate && targetEndDate < startDate) {
            setError('Target deadline cannot be earlier than start date.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        const payload = {
            name: trimmedTitle,
            description: description.trim(),
            start_date: startDate || new Date().toISOString().split('T')[0],
            target_end_date: targetEndDate || null,
        };

        if (activeWorkspace) {
            try {
                const { data } = await axios.post(`/studio/${activeWorkspace}/projects`, payload, {
                    headers: { Accept: 'application/json' },
                });
                setTitle('');
                setDescription('');
                setIsSubmitting(false);
                if (onCreated) {
                    onCreated(data.project);
                } else {
                    router.reload({ only: ['projects'] });
                }
                onClose();
            } catch (err) {
                setIsSubmitting(false);
                setError(err.response?.data?.message || 'Failed to create project.');
            }
        } else {
            setTimeout(() => {
                if (onCreate) {
                    onCreate({
                        id: Date.now(),
                        name: trimmedTitle,
                        title: trimmedTitle,
                        description: description.trim(),
                        status: 'planning',
                        start_date: startDate || new Date().toISOString().split('T')[0],
                        target_end_date: targetEndDate || null,
                        members_count: 1,
                        tasks_count: 0,
                    });
                }
                setTitle('');
                setDescription('');
                setIsSubmitting(false);
                onClose();
            }, 250);
        }
    };

    const descLength = description.length;
    const descPct = (descLength / MAX_DESCRIPTION_LENGTH) * 100;
    const descCounterColor = descPct >= 95 ? 'text-rose-500 font-bold' : descPct >= 80 ? 'text-amber-500 font-semibold' : 'text-text-muted';

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
        >
            {/* Glassmorphic Backdrop */}
            <div
                className="fixed inset-0 backdrop-blur-md bg-black/60 transition-opacity"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Content */}
            <div className="relative w-full max-w-lg rounded-2xl bg-surface-elevated border border-surface-border shadow-2xl overflow-hidden z-10 transform transition-all my-8 animate-in fade-in-50 zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-surface-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                            <FolderPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="create-project-title" className="font-heading text-lg font-bold text-text-primary">
                                Create New Project
                            </h2>
                            <p className="text-xs text-text-muted mt-0.5">
                                Launch a new workspace to organize tasks and anchor CPA schedules.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close dialog"
                        className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface focus-ring cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div 
                            role="alert"
                            aria-live="polite"
                            className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3.5 text-xs text-rose-700 dark:text-rose-400 font-medium"
                        >
                            {error}
                        </div>
                    )}

                    {/* Title Input */}
                    <div>
                        <label
                            htmlFor="project-title"
                            className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-2"
                        >
                            Title <span className="text-brand">*</span>
                        </label>
                        <input
                            id="project-title"
                            type="text"
                            required
                            maxLength={255}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Autonomous NPC AI Agent Engine"
                            className="w-full rounded-xl border border-surface-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/60 focus-ring transition-colors"
                        />
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="project-start-date"
                                className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-2"
                            >
                                Start Date
                            </label>
                            <input
                                id="project-start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus-ring transition-colors"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="project-target-end-date"
                                className="block text-xs font-semibold uppercase tracking-wider text-text-primary mb-2"
                            >
                                Target Deadline <span className="text-text-muted font-normal">(CPA Anchor)</span>
                            </label>
                            <input
                                id="project-target-end-date"
                                type="date"
                                min={startDate}
                                value={targetEndDate}
                                onChange={(e) => setTargetEndDate(e.target.value)}
                                className="w-full rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus-ring transition-colors"
                            />
                        </div>
                    </div>

                    {/* Description Textarea with Live Counter */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label
                                htmlFor="project-description"
                                className="block text-xs font-semibold uppercase tracking-wider text-text-primary"
                            >
                                Description <span className="text-text-muted font-normal">(Optional)</span>
                            </label>
                            <span className={`text-[10px] font-mono ${descCounterColor}`}>
                                {descLength} / {MAX_DESCRIPTION_LENGTH}
                            </span>
                        </div>
                        <textarea
                            id="project-description"
                            rows={3}
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe the project goals, target domains, and scope..."
                            className="w-full rounded-xl border border-surface-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/60 focus-ring transition-colors resize-none"
                        />
                    </div>

                    {planCount > 0 && (
                        <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand font-medium">
                            Your AI draft is ready with {planCount} tasks. Give this project a name to continue to the plan review.
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface transition-colors focus-ring disabled:opacity-50 cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand-light shadow-2xs hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer focus-ring"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <span>Create Project</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
