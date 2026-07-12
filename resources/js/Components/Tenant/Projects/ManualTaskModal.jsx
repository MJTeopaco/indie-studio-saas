import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, X } from 'lucide-react';

const STATUSES = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'completed', label: 'Done' },
];

export default function ManualTaskModal({ isOpen, onClose, project, tenantId, teamMembers = [] }) {
    const [form, setForm] = useState({ title: '', description: '', assigned_user_id: '', estimated_hours: 1, priority: 'Medium', status: 'todo' });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));

    const submit = (event) => {
        event.preventDefault();
        setIsSaving(true);
        setErrors({});
        router.post(route('tenant.projects.tasks.store', { tenant: tenantId, project: project.id }), {
            ...form,
            assigned_user_id: form.assigned_user_id || null,
            estimated_hours: Number(form.estimated_hours),
        }, {
            preserveScroll: true,
            onError: setErrors,
            onSuccess: () => {
                setForm({ title: '', description: '', assigned_user_id: '', estimated_hours: 1, priority: 'Medium', status: 'todo' });
                onClose();
            },
            onFinish: () => setIsSaving(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="font-heading text-base font-bold text-gray-900 dark:text-slate-100">New Task</h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Add a task to {project.name}.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4 px-6 py-5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Task title
                        <input autoFocus value={form.title} onChange={event => updateField('title', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
                        {errors.title && <span className="mt-1 block text-xs text-rose-500">{errors.title}</span>}
                    </label>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Description
                        <textarea value={form.description} onChange={event => updateField('description', event.target.value)} rows="3" className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Assignee
                            <select value={form.assigned_user_id} onChange={event => updateField('assigned_user_id', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950"><option value="">Unassigned</option>{teamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
                        </label>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Estimated hours
                            <input type="number" min="0" step="0.5" value={form.estimated_hours} onChange={event => updateField('estimated_hours', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
                        </label>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Priority
                            <select value={form.priority} onChange={event => updateField('priority', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">{['Low', 'Medium', 'High', 'Critical'].map(priority => <option key={priority}>{priority}</option>)}</select>
                        </label>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Status
                            <select value={form.status} onChange={event => updateField('status', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">{STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-slate-800"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button><button disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}Create task</button></div>
            </form>
        </div>
    );
}
