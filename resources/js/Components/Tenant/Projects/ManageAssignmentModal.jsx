import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Sparkles, UserPlus, AlertCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/Components/SystemToast';

export default function ManageAssignmentModal({ isOpen, onClose, task, teamMembers = [], onTriggerAi, project, tenantId, onSuccess }) {
    if (!isOpen || !task) return null;

    const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'ai'
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        if (isOpen && task) {
            // Extract existing assignees
            const currentAssignees = Array.isArray(task.assignees) 
                ? task.assignees.map(a => (typeof a === 'object' && a !== null ? a.id : a))
                : (task.assignee ? [task.assignee.id] : (task.assigned_user_id ? [task.assigned_user_id] : []));
            
            setSelectedMembers(currentAssignees.map(Number).filter(id => !isNaN(id) && id > 0));
            setActiveTab('manual');
            setErrorMessage(null);
        }
    }, [isOpen, task]);

    // Arrange members alphabetically A-Z, placing selected members at the top
    const sortedTeamMembers = useMemo(() => {
        if (!Array.isArray(teamMembers)) return [];

        return [...teamMembers].sort((a, b) => {
            const aSelected = selectedMembers.includes(Number(a.id));
            const bSelected = selectedMembers.includes(Number(b.id));

            if (aSelected !== bSelected) {
                return aSelected ? -1 : 1;
            }

            return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
    }, [teamMembers, selectedMembers]);

    const handleToggleMember = (memberId) => {
        const id = Number(memberId);
        setSelectedMembers(prev => 
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleAiClick = () => {
        onClose();
        onTriggerAi(task);
    };

    const handleSaveManual = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);
        
        const numericMemberIds = selectedMembers.map(Number);
        const resolvedProjectId = project?.id || task.project_id;

        try {
            await axios.patch(route('tenant.projects.tasks.update', {
                tenant: tenantId,
                project: resolvedProjectId,
                task: task.id
            }), {
                assignees: numericMemberIds,
            });
            
            // Map selected IDs back to member objects for UI update
            const newAssignees = numericMemberIds
                .map(id => teamMembers.find(m => Number(m.id) === Number(id)))
                .filter(Boolean);
            
            showToast('Assignments saved successfully.', 'success');
            if (onSuccess) {
                onSuccess(task.id, newAssignees);
            }
            router.reload({ only: ['project', 'sprints', 'backlogTasks'] });
            onClose();
        } catch (error) {
            console.error('Error saving manual assignments', error);
            const msg = error.response?.data?.message || 'Failed to save assignments. Please try again.';
            setErrorMessage(msg);
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Manage Assignment</h2>
                        <p className="text-xs text-gray-500 mt-1">#{task.id} {task.title}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800 mb-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                            activeTab === 'manual'
                                ? 'bg-white text-brand shadow-xs dark:bg-slate-700 dark:text-brand-light'
                                : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <UserPlus className="h-4 w-4" />
                        Manual
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                            activeTab === 'ai'
                                ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-700 dark:text-purple-400'
                                : 'text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <Sparkles className="h-4 w-4" />
                        AI Best Fit
                    </button>
                </div>
                
                {activeTab === 'ai' ? (
                    <div className="text-center py-6">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-2">Find the best candidate automatically</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 px-4">
                            Our ML engine will analyze task requirements, developer skills, and current workload to recommend the ideal assignee.
                        </p>
                        <button
                            type="button"
                            onClick={handleAiClick}
                            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700 shadow-xs shadow-purple-500/30 transition-all cursor-pointer"
                        >
                            <Sparkles className="h-4 w-4" />
                            Run AI Analysis
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSaveManual} className="space-y-4">
                        {errorMessage && (
                            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 rounded-lg dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 mb-3">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                            {sortedTeamMembers.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-4">No team members available.</p>
                            ) : (
                                sortedTeamMembers.map(member => {
                                    const isSelected = selectedMembers.includes(Number(member.id));
                                    return (
                                        <label
                                            key={member.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'border-brand/40 bg-brand/5 dark:border-brand/40 dark:bg-brand/10'
                                                    : 'border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleMember(member.id)}
                                                    className="w-4 h-4 rounded-sm border-gray-300 text-brand focus:ring-brand cursor-pointer"
                                                />
                                                <div className="ml-3">
                                                    <span className={`block text-sm font-bold ${isSelected ? 'text-brand dark:text-brand-light' : 'text-gray-900 dark:text-slate-100'}`}>
                                                        {member.name}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <span className="text-[11px] font-semibold text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/20 px-2 py-0.5 rounded-full">
                                                    Selected
                                                </span>
                                            )}
                                        </label>
                                    );
                                })
                            )}
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
                                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-xs shadow-brand/30 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Assignments'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
