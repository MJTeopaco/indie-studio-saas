import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function CreateEpicGroupModal({ isOpen, onClose, onSubmit, isSubmitting, validationErrors }) {
    if (!isOpen) return null;

    const [formState, setFormState] = useState({
        name: '',
        goal: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formState);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Create new group</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">Group name</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. Q1 2026, Q2 2026"
                            value={formState.name}
                            onChange={e => setFormState(s => ({ ...s, name: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                        />
                        {validationErrors?.name && <p className="mt-1 text-xs text-red-500">{validationErrors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">Group goal</label>
                        <textarea 
                            rows="3"
                            value={formState.goal}
                            placeholder="Optional high-level goals for this epic group..."
                            onChange={e => setFormState(s => ({ ...s, goal: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                        />
                        {validationErrors?.goal && <p className="mt-1 text-xs text-red-500">{validationErrors.goal[0]}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
