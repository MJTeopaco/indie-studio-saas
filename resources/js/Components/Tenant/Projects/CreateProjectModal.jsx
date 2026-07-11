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
                if (onCreate) {
                    onCreate({
                        id: Date.now(),
                        name: trimmedTitle,
                        title: trimmedTitle,
                        description: description.trim(),
                        status: 'planning',
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

    const handleClose = () => {
        if (isSubmitting) return;
        setError('');
        setTitle('');
        setDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Glassmorphic Backdrop */}
            <div
                className="fixed inset-0 backdrop-blur-md bg-black/50 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Dialog Content */}
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden z-10 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-10 dark:bg-brand-20 flex items-center justify-center text-brand dark:text-brand-light">
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
                            <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100">
                                Create New Project
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Launch a new workspace to organize tasks and assign team members.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-lg"
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
                        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3.5 text-xs text-red-700 dark:text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Title Input */}
                    <div>
                        <label
                            htmlFor="project-title"
                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200 mb-2"
                        >
                            Title <span className="text-brand dark:text-brand-light">*</span>
                        </label>
                        <input
                            id="project-title"
                            type="text"
                            required
                            maxLength={255}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Autonomous NPC AI Agent Engine"
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
                        />
                    </div>

                    {/* Description Textarea */}
                    <div>
                        <label
                            htmlFor="project-description"
                            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200 mb-2"
                        >
                            Description <span className="text-gray-400 dark:text-gray-500 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            id="project-description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe the project goals, target domains, and scope..."
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-light shadow-md shadow-brand/20 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
