import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

// Shared utility to compute text contrast based on background color
function getContrastColor(hexColor) {
    if (!hexColor) return '#111827';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111827' : '#ffffff';
}

const SPRINT_STATUSES = [
    { value: 'ready_to_start', label: 'Ready to start', color: '#3b82f6', kanban: 'todo' },
    { value: 'in_progress', label: 'In progress', color: '#f97316', kanban: 'in_progress' },
    { value: 'waiting_for_review', label: 'Waiting for review', color: '#d97706', kanban: 'review' },
    { value: 'pending_deploy', label: 'Pending deploy', color: '#eab308', kanban: 'in_progress' },
    { value: 'done', label: 'Done', color: '#10b981', kanban: 'completed' },
    { value: 'stuck', label: 'Stuck', color: '#ef4444', kanban: 'in_progress' },
];

export default function UpdateTaskStatusModal({ isOpen, onClose, task, project, tenantId, onSuccess }) {
    if (!isOpen || !task) return null;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(task.sprint_status || 'ready_to_start');

    useEffect(() => {
        if (isOpen && task) {
            setSelectedStatus(task.sprint_status || 'ready_to_start');
        }
    }, [isOpen, task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const mappedStatus = SPRINT_STATUSES.find(s => s.value === selectedStatus);
        
        try {
            await axios.patch(route('tenant.projects.tasks.update', { tenant: tenantId, project: project.id, task: task.id }), {
                sprint_status: selectedStatus,
                status: mappedStatus ? mappedStatus.kanban : task.status, // Sync Kanban board status
            }, {
                headers: { 'X-Inertia': 'true' }
            });
            onSuccess(task.id, selectedStatus, mappedStatus ? mappedStatus.kanban : task.status);
            onClose();
        } catch (error) {
            console.error('Error updating task status', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Update Status</h2>
                        <p className="text-xs text-gray-500 mt-1">#{task.id} {task.title}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        {SPRINT_STATUSES.map((status) => (
                            <button
                                key={status.value}
                                type="button"
                                onClick={() => setSelectedStatus(status.value)}
                                className={`w-full rounded-lg px-4 py-3 text-sm font-bold text-left transition-all border-2 ${selectedStatus === status.value ? 'ring-2 ring-brand ring-offset-2' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                style={{ 
                                    backgroundColor: status.color, 
                                    color: getContrastColor(status.color),
                                    borderColor: selectedStatus === status.value ? getContrastColor(status.color) : 'transparent'
                                }}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button 
                            type="button" 
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm shadow-brand/30"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Status'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
