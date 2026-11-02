import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Loader2, Sparkles, UserPlus, AlertCircle, Info,
    Ban, CheckCircle2, Cpu, Brain, Activity, User
} from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/Components/SystemToast';
import PortaledTooltip from '@/Components/UI/PortaledTooltip';

function AiScoreBar({ score, rawScore, multiplier, penaltyReason }) {
    const pct = Math.round((score ?? 0) * 100);
    const rawPct = rawScore !== undefined ? Math.round(rawScore * 100) : pct;
    const isPenalized = multiplier !== undefined && multiplier < 1.0;
    const colour = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full ${colour} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-[11px] font-bold ${pct >= 75 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-400'}`}>
                    {pct}% fit
                </span>
            </div>
            {isPenalized && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Raw GNN {rawPct}% · {penaltyReason || 'Capacity adjusted'}</span>
                </div>
            )}
        </div>
    );
}

export default function ManageAssignmentModal({ isOpen, onClose, task, teamMembers = [], onTriggerAi, project, tenantId, onSuccess }) {
    if (!isOpen || !task) return null;

    const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'ai'
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // AI Best Fit tab states
    const [aiLoading, setAiLoading] = useState(false);
    const [aiCandidates, setAiCandidates] = useState([]);
    const [aiExplanation, setAiExplanation] = useState(null);
    const [aiError, setAiError] = useState(null);
    const [aiAssignedIds, setAiAssignedIds] = useState(new Set());
    const [isAiSaving, setIsAiSaving] = useState(false);

    useEffect(() => {
        if (isOpen && task) {
            // Identify members currently on emergency absence
            const emergencyMemberIds = new Set(
                (teamMembers ?? [])
                    .filter(m => m.working_status === 'emergency')
                    .map(m => Number(m.id))
            );

            // Extract existing assignees, excluding members in emergency
            const currentAssignees = Array.isArray(task.assignees) 
                ? task.assignees.map(a => (typeof a === 'object' && a !== null ? a.id : a))
                : (task.assignee ? [task.assignee.id] : (task.assigned_user_id ? [task.assigned_user_id] : []));
            
            const validAssignees = currentAssignees
                .map(Number)
                .filter(id => !isNaN(id) && id > 0 && !emergencyMemberIds.has(id));

            setSelectedMembers(validAssignees);
            setAiAssignedIds(new Set(validAssignees));
            setActiveTab('manual');
            setErrorMessage(null);
            setAiCandidates([]);
            setAiExplanation(null);
            setAiError(null);
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
        const member = teamMembers.find(m => Number(m.id) === id);
        if (member?.working_status === 'emergency') {
            return; // Disabled for emergency absence
        }

        setSelectedMembers(prev => 
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const fetchAiCandidates = async () => {
        setAiLoading(true);
        setAiError(null);
        try {
            const url = route('tenant.ml.best-fit', { tenant: tenantId, task: task.id });
            const response = await axios.post(url, {}, { timeout: 600000 });
            if (response.data.status === 'success') {
                const teamCandidateIds = new Set((teamMembers ?? []).map(m => Number(m.id)));
                const matching = (response.data.results ?? []).filter(c => teamCandidateIds.has(Number(c.user_id)));
                setAiCandidates(matching.length > 0
                    ? matching
                    : (teamMembers ?? []).map(m => ({ user_id: m.id, match_fit_score: 0, source: 'manual' })));
                if (response.data.explanation) {
                    setAiExplanation(response.data.explanation);
                }
            } else {
                setAiError('ML Engine returned an error. Try again.');
            }
        } catch (err) {
            console.error(err);
            setAiError('Error connecting to ML Engine. Make sure it is running on port 8001.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSwitchToAi = () => {
        setActiveTab('ai');
        if (aiCandidates.length === 0 && !aiLoading) {
            fetchAiCandidates();
        }
    };

    const toggleAiAssign = (userId) => {
        const id = Number(userId);
        const candidate = aiCandidates.find(c => Number(c.user_id) === id);
        const member = teamMembers.find(m => Number(m.id) === id);
        const workingStatus = candidate?.working_status || member?.working_status || 'active';
        if (workingStatus === 'emergency') {
            return; // Block picking emergency members
        }

        setAiAssignedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
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

    const handleSaveAiAssignments = async () => {
        setIsAiSaving(true);
        setErrorMessage(null);

        const numericMemberIds = Array.from(aiAssignedIds);
        const resolvedProjectId = project?.id || task.project_id;

        try {
            await axios.patch(route('tenant.projects.tasks.update', {
                tenant: tenantId,
                project: resolvedProjectId,
                task: task.id
            }), {
                assignees: numericMemberIds,
            });

            const newAssignees = numericMemberIds
                .map(id => teamMembers.find(m => Number(m.id) === Number(id)))
                .filter(Boolean);

            showToast('AI best fit assignments saved successfully.', 'success');
            if (onSuccess) {
                onSuccess(task.id, newAssignees);
            }
            router.reload({ only: ['project', 'sprints', 'backlogTasks'] });
            onClose();
        } catch (error) {
            console.error('Error saving AI assignments', error);
            const msg = error.response?.data?.message || 'Failed to save assignments.';
            setErrorMessage(msg);
            showToast(msg, 'error');
        } finally {
            setIsAiSaving(false);
        }
    };

    const getCandidateDetails = (candidate) => {
        const member = teamMembers.find(m => Number(m.id) === Number(candidate.user_id));
        const workingStatus = candidate.working_status || member?.working_status || 'active';
        const health = candidate.health || member?.health || { label: 'Healthy', tone: 'success' };
        const utilizationRate = candidate.utilization_rate !== undefined 
            ? candidate.utilization_rate 
            : (member?.utilization_rate ?? 0);
        return {
            name: member ? member.name : `Member #${candidate.user_id}`,
            initial: (member?.name || 'U').charAt(0).toUpperCase(),
            workingStatus,
            health,
            utilizationRate,
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" onClick={onClose}>
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Manage Assignment</h2>
                        <p className="text-xs text-gray-500 mt-1">#{task.id} {task.title}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800 mb-5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
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
                        onClick={handleSwitchToAi}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all cursor-pointer ${
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
                    <div className="space-y-4">
                        {aiLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                <div className="relative flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Cpu className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="absolute inset-0 rounded-full border-2 border-purple-500/30 border-t-purple-600 animate-spin" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Evaluating Best Fit Candidates</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">GNN graph inference &amp; capacity governor running...</p>
                                </div>
                            </div>
                        ) : aiError ? (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs w-full">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{aiError}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchAiCandidates}
                                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
                                >
                                    Retry Analysis
                                </button>
                            </div>
                        ) : aiCandidates.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-2">Find the best candidate automatically</h3>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 px-4">
                                    Our ML engine will analyze task requirements, developer skills, and workload health to recommend the ideal assignee.
                                </p>
                                <button
                                    type="button"
                                    onClick={fetchAiCandidates}
                                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-purple-700 shadow-xs shadow-purple-500/30 transition-all cursor-pointer"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Run AI Analysis
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* LLM explanation */}
                                {aiExplanation && (
                                    <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
                                        <p className="font-bold text-purple-800 dark:text-purple-200 mb-1 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                            AI Recommendation
                                        </p>
                                        <p className="text-gray-700 dark:text-slate-300">{aiExplanation}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 px-1">
                                    <span className="font-medium text-gray-700 dark:text-slate-300">AI Best Fit Candidates</span>
                                    <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{aiAssignedIds.size} selected</span>
                                </div>

                                <div className="max-h-72 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                    {aiCandidates.map((candidate, idx) => {
                                        const { name, initial, workingStatus, health, utilizationRate } = getCandidateDetails(candidate);
                                        const isEmergency = workingStatus === 'emergency';
                                        const isOnLeave = workingStatus === 'on_leave';
                                        const isUnavailable = isEmergency || isOnLeave;
                                        const isSelected = aiAssignedIds.has(Number(candidate.user_id));

                                        const healthBadgeClasses = health.label === 'At Risk'
                                            ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                                            : health.label === 'Watchlist'
                                            ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';

                                        const utilChipClasses = utilizationRate >= 95
                                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                                            : utilizationRate >= 80
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';

                                        return (
                                            <div
                                                key={candidate.user_id || idx}
                                                className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                                                    isEmergency
                                                        ? 'border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 opacity-75 cursor-not-allowed'
                                                        : isSelected
                                                        ? 'border-purple-500/50 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-800/60 cursor-pointer'
                                                        : 'border-gray-100 hover:bg-gray-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50 cursor-pointer'
                                                }`}
                                                onClick={isEmergency ? undefined : () => toggleAiAssign(candidate.user_id)}
                                            >
                                                {/* Rank badge */}
                                                <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                                    isEmergency ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500' : idx === 0 ? 'bg-amber-400/20 text-amber-600' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                                                }`}>
                                                    {idx + 1}
                                                </div>

                                                {/* Avatar */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                                                    isEmergency ? 'bg-slate-400 dark:bg-slate-700' : isSelected ? 'bg-purple-600' : 'bg-linear-to-br from-purple-500 to-indigo-600 shadow-xs'
                                                }`}>
                                                    {isSelected ? <CheckCircle2 className="w-4 h-4" /> : initial}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className={`block text-xs font-bold truncate ${isEmergency ? 'text-gray-500 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'}`}>
                                                            {name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {isEmergency ? (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1 shadow-2xs">
                                                                    <span>🚨</span>
                                                                    <span>Emergency Absence</span>
                                                                </span>
                                                            ) : isOnLeave ? (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                                                    On Leave
                                                                </span>
                                                            ) : (
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${healthBadgeClasses}`}>
                                                                    {health.label}
                                                                </span>
                                                            )}
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${utilChipClasses}`}>
                                                                {utilizationRate}% util
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <AiScoreBar
                                                        score={candidate.match_fit_score}
                                                        rawScore={candidate.raw_match_fit_score}
                                                        multiplier={candidate.capacity_multiplier}
                                                        penaltyReason={candidate.capacity_penalty_reason}
                                                    />

                                                    {isEmergency && (
                                                        <p className="text-[10px] font-medium text-rose-600 dark:text-rose-400 mt-1">
                                                            Unavailable for assignment due to emergency absence
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Checkbox proxy or Ban Icon */}
                                                {isEmergency ? (
                                                    <div 
                                                        className="w-5 h-5 rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0 cursor-not-allowed"
                                                        title="Cannot assign - declared emergency absence"
                                                    >
                                                        <Ban className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                                                    </div>
                                                ) : (
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                                        isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 dark:border-slate-600'
                                                    }`}>
                                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={fetchAiCandidates}
                                        disabled={aiLoading || isAiSaving}
                                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
                                    >
                                        Re-run Analysis
                                    </button>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={onClose}
                                            disabled={isAiSaving}
                                            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleSaveAiAssignments}
                                            disabled={isAiSaving}
                                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-xs shadow-purple-500/30 cursor-pointer"
                                        >
                                            {isAiSaving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                `Save Assignments (${aiAssignedIds.size})`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                <span className="font-medium text-gray-700 dark:text-slate-300">Assignee Bandwidth &amp; Health</span>
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
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                isEmergency
                                                    ? 'border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 opacity-75 cursor-not-allowed'
                                                    : isSelected
                                                    ? 'border-brand/40 bg-brand/5 dark:border-brand/40 dark:bg-brand/10 cursor-pointer'
                                                    : 'border-gray-100 hover:bg-gray-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50 cursor-pointer'
                                            }`}
                                            onClick={isEmergency ? (e) => e.preventDefault() : undefined}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={isEmergency}
                                                    onChange={() => handleToggleMember(member.id)}
                                                    className={`w-4 h-4 rounded-sm border-gray-300 text-brand focus:ring-brand shrink-0 ${isEmergency ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                />

                                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                                                    isEmergency 
                                                        ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400' 
                                                        : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300'
                                                }`}>
                                                    {initial}
                                                </div>

                                                <div className="min-w-0">
                                                    <span className={`block text-sm font-bold truncate ${isEmergency ? 'text-gray-500 dark:text-slate-400' : isSelected ? 'text-brand dark:text-brand-light' : 'text-gray-900 dark:text-slate-100'}`}>
                                                        {member.name}
                                                    </span>

                                                    <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                                        {isEmergency ? (
                                                            <span className="text-rose-600 dark:text-rose-400 font-medium">Emergency absence declared • Cannot be assigned</span>
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
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-900/60 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1 shadow-2xs">
                                                        <span>🚨</span>
                                                        <span>Emergency Absence</span>
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
                                                {!isEmergency && (
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${healthBadgeClass}`}>
                                                        {health.label}
                                                    </span>
                                                )}
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
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
