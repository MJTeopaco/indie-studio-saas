import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {
    const { activeWorkspace } = usePage().props;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError('Project title is required.');
            return;
        }
        if (trimmedTitle.length > 255) {
            setError('Project title cannot exceed 255 characters.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        const payload = {
            name: trimmedTitle,
            description: description.trim(),
        };

        if (activeWorkspace) {
            router.post(`/studio/${activeWorkspace}/projects`, payload, {
                onSuccess: () => {
                    setTitle('');
                    setDescription('');
                    setIsSubmitting(false);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                    setError('Failed to create project.');
                },
            });
        } else {
            setTimeout(() => {
                onCreate({
                    id: Date.now(),
                    name: trimmedTitle,
                    description: description.trim(),
                    status: 'planning',
                    members_count: 1,
                    tasks_count: 0,
                });
                setTitle('');
                setDescription('');
                setIsSubmitting(false);
                onClose();
            }, 250);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setError('');
        setTitle('');
        setDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <div
                className="fixed inset-0 bg-gray-900/70 dark:bg-black/80 backdrop-blur-md transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Dialog Content */}
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-surface-elevated border border-gray-200 dark:border-surface-border shadow-2xl overflow-hidden z-10 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-surface-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand">
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
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-text-primary">
                                Create New Project
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-text-muted">
                                Launch a new workspace to organize tasks and assign team members.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-text-muted dark:hover:text-text-primary transition-colors p-1 rounded-lg"
                    >
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
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-600 dark:text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Project Title Input */}
                    <div>
                        <label
                            htmlFor="project-title"
                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-text-primary mb-2"
                        >
                            Project Title <span className="text-brand">*</span>
                        </label>
                        <input
                            id="project-title"
                            type="text"
                            required
                            maxLength={255}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Autonomous NPC AI Agent Engine"
                            className="w-full rounded-xl border border-gray-300 dark:border-surface-border bg-gray-50 dark:bg-surface px-4 py-3 text-sm text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
                        />
                    </div>

                    {/* Description Textarea */}
                    <div>
                        <label
                            htmlFor="project-description"
                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-text-primary mb-2"
                        >
                            Description <span className="text-gray-400 dark:text-text-muted font-normal">(Optional)</span>
                        </label>
                        <textarea
                            id="project-description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe the project goals, target domains, and scope..."
                            className="w-full rounded-xl border border-gray-300 dark:border-surface-border bg-gray-50 dark:bg-surface px-4 py-3 text-sm text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors resize-none"
                        />
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-surface-border">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-text-muted hover:bg-gray-100 dark:hover:bg-surface dark:hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand via-indigo-600 to-purple-600 hover:from-brand-light hover:to-purple-500 shadow-lg shadow-brand/20 disabled:opacity-50 transition-all transform active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Create Project
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
