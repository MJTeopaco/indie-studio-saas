import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Sparkles, UserPlus, AlertCircle, Info } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/Components/SystemToast';
import PortaledTooltip from '@/Components/UI/PortaledTooltip';

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
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Manage Assignment</h2>
                        <p className="text-xs text-gray-500 mt-1">#{task.id} {task.title}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800 mb-5">
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

                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 px-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium text-gray-700 dark:text-slate-300">Assignee Bandwidth & Health</span>
                                <PortaledTooltip
                                    tooltipContent={
                                        <div className="rounded-xl bg-slate-900 p-3 text-xs text-slate-200 shadow-2xl border border-slate-700 max-w-xs leading-relaxed z-50 text-left">
                                            <p className="font-bold text-white mb-1">
                                                Understanding Utilization Rate
                                            </p>
                                            <p className="text-slate-300 text-[11px]">
                                                Measures active sprint workload against weekly contract limits to prevent developer fatigue and bottlenecking.
                                            </p>
                                            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                                    <span><strong className="text-slate-100">&lt; 80%: Healthy</strong> (Available bandwidth)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                                                    <span><strong className="text-slate-100">80% – 94%: Watchlist</strong> (Near full capacity)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
                                                    <span><strong className="text-slate-100">≥ 95%: At Risk</strong> (Overloaded / high burnout)</span>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                >
                                    <button 
                                        type="button" 
                                        onClick={(e) => e.stopPropagation()} 
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-help p-0.5 inline-flex items-center"
                                        aria-label="Utilization info"
                                    >
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                </PortaledTooltip>
                            </div>
                            <span className="font-mono text-gray-500">{selectedMembers.length} selected</span>
                        </div>

                        <div className="max-h-72 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                            {sortedTeamMembers.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-4">No team members available.</p>
                            ) : (
                                sortedTeamMembers.map(member => {
                                    const isSelected = selectedMembers.includes(Number(member.id));
                                    const initial = (member.name || 'U').charAt(0).toUpperCase();
                                    const activeTasks = member.active_tasks_count ?? 0;
                                    const activeHours = Number(member.active_load_hours ?? 0);
                                    const maxHours = Number(member.max_hours_per_week ?? 40);
                                    const utilRate = member.utilization_rate ?? (maxHours > 0 ? Math.round((activeHours / maxHours) * 100) : 0);

                                    const health = member.health || { label: 'Healthy', tone: 'success' };
                                    const isEmergency = member.working_status === 'emergency';
                                    const isOnLeave = member.working_status === 'on_leave';
                                    const isLeavePending = member.leave_request_status === 'pending' && !isOnLeave;
                                    const isUnavailable = isEmergency || isOnLeave;

                                    const healthBadgeClass =
                                        health.tone === 'danger'
                                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400'
                                            : health.tone === 'warning'
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400';

                                    const utilPillClass =
                                        utilRate >= 95
                                            ? 'text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/40'
                                            : utilRate >= 80
                                            ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                                            : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40';

                                    return (
                                        <label
                                            key={member.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-brand/40 bg-brand/5 dark:border-brand/40 dark:bg-brand/10'
                                                    : 'border-gray-100 hover:bg-gray-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50'
                                            } ${isUnavailable ? 'opacity-80' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleMember(member.id)}
                                                    className="w-4 h-4 rounded-sm border-gray-300 text-brand focus:ring-brand cursor-pointer shrink-0"
                                                />

                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold font-mono text-gray-700 dark:text-slate-300 shrink-0">
                                                    {initial}
                                                </div>

                                                <div className="min-w-0">
                                                    <span className={`block text-sm font-bold truncate ${isSelected ? 'text-brand dark:text-brand-light' : 'text-gray-900 dark:text-slate-100'}`}>
                                                        {member.name}
                                                    </span>

                                                    <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                                        {isEmergency ? (
                                                            <span className="text-red-600 dark:text-red-400 font-medium">Emergency absence declared</span>
                                                        ) : isOnLeave ? (
                                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                                On leave {member.leave_end_date ? `until ${member.leave_end_date}` : ''}
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span className="font-medium text-gray-700 dark:text-slate-300">
                                                                    {activeTasks} active {activeTasks === 1 ? 'task' : 'tasks'}
                                                                </span>
                                                                <span className="text-gray-300 dark:text-slate-600">•</span>
                                                                <PortaledTooltip
                                                                    tooltipContent={
                                                                        <div className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 shadow-xl border border-slate-700 whitespace-nowrap z-50 text-left">
                                                                            <span className="font-semibold text-white">{activeHours}h</span> assigned of <span className="font-semibold text-white">{maxHours}h</span> weekly capacity
                                                                        </div>
                                                                    }
                                                                >
                                                                    <span className={`inline-flex items-center font-semibold cursor-help px-1.5 py-0.2 rounded text-[10px] border ${utilPillClass}`}>
                                                                        {utilRate}% utilization
                                                                    </span>
                                                                </PortaledTooltip>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                                {/* Exception badges */}
                                                {isEmergency && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                                                        Emergency
                                                    </span>
                                                )}
                                                {isOnLeave && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                                                        On Leave
                                                    </span>
                                                )}
                                                {isLeavePending && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                                                        Leave Pending
                                                    </span>
                                                )}

                                                {/* Health badge */}
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${healthBadgeClass}`}>
                                                    {health.label}
                                                </span>
                                            </div>
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
