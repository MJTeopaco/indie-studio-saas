import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CreateEpicModal({ isOpen, onClose, onSubmit, isSubmitting, validationErrors, epicGroups, phases, priorities, epic = null }) {
    if (!isOpen) return null;

    const defaultGroup = epicGroups?.find(g => g.is_default);
    
    const [formState, setFormState] = useState({
        name: '',
        epic_group_id: defaultGroup ? defaultGroup.id : (epicGroups?.[0]?.id || ''),
        phase_id: phases?.[0]?.id || '',
        priority_id: priorities?.[0]?.id || '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (epic) {
                setFormState({
                    name: epic.name || '',
                    epic_group_id: epic.epic_group_id || defaultGroup?.id || epicGroups?.[0]?.id || '',
                    phase_id: epic.phase_id || phases?.[0]?.id || '',
                    priority_id: epic.priority_id || priorities?.[0]?.id || '',
                    start_date: epic.start_date ? String(epic.start_date).split('T')[0] : '',
                    end_date: epic.end_date ? String(epic.end_date).split('T')[0] : '',
                });
            } else {
                setFormState({
                    name: '',
                    epic_group_id: defaultGroup ? defaultGroup.id : (epicGroups?.[0]?.id || ''),
                    phase_id: phases?.[0]?.id || '',
                    priority_id: priorities?.[0]?.id || '',
                    start_date: '',
                    end_date: '',
                });
            }
        }
    }, [epic, isOpen, defaultGroup, epicGroups, phases, priorities]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formState);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{epic ? 'Update Epic' : 'Create new epic'}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">Epic name</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. User Authentication"
                            value={formState.name}
                            onChange={e => setFormState(s => ({ ...s, name: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                        />
                        {validationErrors?.name && <p className="mt-1 text-xs text-red-500">{validationErrors.name[0]}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">Group / Horizon</label>
                            <select 
                                value={formState.epic_group_id}
                                onChange={e => setFormState(s => ({ ...s, epic_group_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                            >
                                {epicGroups?.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                            {validationErrors?.epic_group_id && <p className="mt-1 text-xs text-red-500">{validationErrors.epic_group_id[0]}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">Phase</label>
                            <select 
                                required
                                value={formState.phase_id}
                                onChange={e => setFormState(s => ({ ...s, phase_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                            >
                                {phases?.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                            {validationErrors?.phase_id && <p className="mt-1 text-xs text-red-500">{validationErrors.phase_id[0]}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">Priority</label>
                            <select 
                                required
                                value={formState.priority_id}
                                onChange={e => setFormState(s => ({ ...s, priority_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                            >
                                {priorities?.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                            {validationErrors?.priority_id && <p className="mt-1 text-xs text-red-500">{validationErrors.priority_id[0]}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">Start Date (Optional)</label>
                            <input 
                                type="date" 
                                value={formState.start_date}
                                onChange={e => setFormState(s => ({ ...s, start_date: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                            />
                            {validationErrors?.start_date && <p className="mt-1 text-xs text-red-500">{validationErrors.start_date[0]}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">End Date (Optional)</label>
                            <input 
                                type="date" 
                                value={formState.end_date}
                                min={formState.start_date}
                                onChange={e => setFormState(s => ({ ...s, end_date: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800"
                            />
                            {validationErrors?.end_date && <p className="mt-1 text-xs text-red-500">{validationErrors.end_date[0]}</p>}
                        </div>
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
                            {isSubmitting ? (epic ? 'Updating...' : 'Creating...') : (epic ? 'Update Epic' : 'Create Epic')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
