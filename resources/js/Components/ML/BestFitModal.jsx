import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
    X, Cpu, Loader2, Trophy, ArrowRight,
    CheckCircle2, Brain, Sparkles, AlertCircle, User, Activity, Ban
} from 'lucide-react';

// ─── Animated loading state for BestFit GNN + LLM inference ─────────────────
function GNNLoadingView() {
    const steps = [
        { icon: Brain,    label: 'Vectorising task requirements' },
        { icon: Cpu,      label: 'Running GNN inference'         },
        { icon: Activity, label: 'Evaluating workload & health'  },
        { icon: Sparkles, label: 'Synthesising explanation'      },
    ];
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep(s => (s < steps.length - 1 ? s + 1 : s));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-10 gap-6">
            {/* Pulsing GNN node graphic */}
            <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
                    <Cpu className="w-9 h-9 text-brand" />
                </div>
                <span className="absolute inset-0 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
                <span
                    className="absolute inset-0 rounded-full border-2 border-brand/10 border-b-brand animate-spin"
                    style={{ animationDuration: '2s', animationDirection: 'reverse' }}
                />
            </div>

            <div className="text-center">
                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Finding Best Fit Candidates</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Running GNN + operational governor + LLM analysis on your team…</p>
            </div>

            <div className="w-full max-w-xs space-y-2">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const done    = idx < activeStep;
                    const active  = idx === activeStep;
                    return (
                        <div
                            key={idx}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-all duration-300 ${
                                done   ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400'
                                       : active ? 'border-brand/40 bg-brand/5 dark:bg-brand/10 text-brand dark:text-brand-light'
                                               : 'border-gray-100 dark:border-slate-800 text-gray-300 dark:text-slate-600 opacity-50'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500/20' : active ? 'bg-brand/20' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                {done   ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        : active ? <Loader2 className="w-3 h-3 animate-spin text-brand" />
                                                 : <Icon className="w-3 h-3" />}
                            </div>
                            <span className="font-medium">{step.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score, rawScore, multiplier, penaltyReason }) {
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function BestFitModal({ isOpen, onClose, task, teamMembers, tenantId, onSuccess }) {
    const [isLoading,     setIsLoading]     = useState(false);
    const [candidates,    setCandidates]    = useState([]);
    const [explanation,   setExplanation]   = useState(null);
    const [error,         setError]         = useState(null);
    const [assignedUserIds, setAssignedUserIds] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage,   setCurrentPage]   = useState(1);
    const itemsPerPage = 3;

    useEffect(() => {
        if (isOpen && task) {
            setIsLoading(true);
            setCandidates([]);
            setExplanation(null);
            setError(null);
            // Preserve existing assignments, but exclude any member currently in emergency
            const emergencyMemberIds = new Set(
                (teamMembers ?? [])
                    .filter(m => m.working_status === 'emergency')
                    .map(m => Number(m.id))
            );

            const existingIds = new Set((task.assignees?.length ? task.assignees : [task.assignee])
                .filter(Boolean)
                .map(member => Number(member.id))
                .filter(id => !emergencyMemberIds.has(id)));
            setAssignedUserIds(existingIds);
            setCurrentPage(1);
            fetchBestFit();
        }
    }, [isOpen, task]);

    if (!isOpen || !task) return null;

    const fetchBestFit = async () => {
        setIsLoading(true);
        try {
            const url = route('tenant.ml.best-fit', { tenant: tenantId, task: task.id });
            const response = await axios.post(url, {}, { timeout: 600000 });
            if (response.data.status === 'success') {
                const teamCandidateIds = new Set((teamMembers ?? []).map(member => Number(member.id)));
                const matchingCandidates = (response.data.results ?? []).filter(candidate => teamCandidateIds.has(Number(candidate.user_id)));
                setCandidates(matchingCandidates.length > 0
                    ? matchingCandidates
                    : (teamMembers ?? []).map(member => ({ user_id: member.id, match_fit_score: 0, source: 'manual' })));
                if (response.data.explanation) {
                    setExplanation(response.data.explanation);
                }
            } else {
                setError('ML Engine returned an error. Try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Error connecting to ML Engine. Make sure it is running on port 8001.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAssign = (candidateId) => {
        const id = Number(candidateId);
        const candidate = candidates.find(c => Number(c.user_id) === id);
        const workingStatus = candidate ? getCandidateWorkingStatus(candidate) : null;
        if (workingStatus === 'emergency') {
            return; // Candidate is in emergency, picking disabled
        }

        setAssignedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSaveAssignments = async () => {
        setIsSaving(true);
        try {
            const url = route('tenant.tasks.assign', { tenant: tenantId, task: task.id });
            await axios.post(url, {
                employee_user_ids: Array.from(assignedUserIds),
                // Since this is a bulk assign, we default the source to GNN or Manual
                assigned_by: 'manual',
            });
            
            // Trigger optimistic real-time update in UI
            const newAssignees = Array.from(assignedUserIds).map(id => teamMembers?.find(m => m.id === id)).filter(Boolean);
            if (onSuccess) onSuccess(task.id, newAssignees);
            
            // Refresh the project data quietly in background
            setTimeout(() => {
                router.reload({ only: ['project', 'sprints', 'backlogTasks'] });
                onClose();
            }, 100);
        } catch (err) {
            console.error(err);
            setError('Failed to save assignments. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const getMemberName = (userId) => {
        const m = teamMembers?.find(m => Number(m.id) === Number(userId));
        return m ? m.name : `Team Member #${userId}`;
    };

    const getMemberInitial = (userId) => getMemberName(userId).charAt(0).toUpperCase();

    const getCandidateHealth = (candidate) => {
        if (candidate.health) return candidate.health;
        const m = teamMembers?.find(item => Number(item.id) === Number(candidate.user_id));
        return m?.health || { label: 'Healthy', tone: 'success' };
    };

    const getCandidateUtil = (candidate) => {
        if (candidate.utilization_rate !== undefined) return candidate.utilization_rate;
        const m = teamMembers?.find(item => Number(item.id) === Number(candidate.user_id));
        return m?.utilization_rate ?? 0;
    };

    const getCandidateWorkingStatus = (candidate) => {
        if (candidate.working_status) return candidate.working_status;
        const m = teamMembers?.find(item => Number(item.id) === Number(candidate.user_id));
        return m?.working_status || 'active';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">

                {/* ── Header ── */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-brand/5 dark:bg-brand/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center">
                            <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                AI Best Fit Candidates
                            </h2>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[260px]">
                                #{task.id}: {task.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <GNNLoadingView />
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm w-full">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={fetchBestFit}
                                className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-light transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* LLM explanation */}
                            {explanation && (
                                <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 dark:bg-brand/10">
                                    <p className="text-xs font-semibold text-brand mb-1 uppercase tracking-wider">AI Recommendation</p>
                                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{explanation}</p>
                                </div>
                            )}

                            {/* Candidates list */}
                            {candidates.length > 0 ? (
                                <>
                                    <div className="space-y-2">
                                        {candidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((candidate, idx) => {
                                            const originalIdx = (currentPage - 1) * itemsPerPage + idx;
                                            const isSelected = assignedUserIds.has(Number(candidate.user_id));

                                            const health = getCandidateHealth(candidate);
                                            const utilizationRate = getCandidateUtil(candidate);
                                            const workingStatus = getCandidateWorkingStatus(candidate);
                                            const isEmergency = workingStatus === 'emergency';
                                            const isUnavailable = ['on_leave', 'emergency'].includes(workingStatus);

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
                                                    key={originalIdx}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                                                        isEmergency
                                                            ? 'border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 opacity-75 cursor-not-allowed'
                                                            : isSelected
                                                            ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10 cursor-pointer'
                                                            : 'border-gray-200 dark:border-slate-700 hover:border-brand/40 bg-white dark:bg-slate-800/50 cursor-pointer'
                                                    }`}
                                                    onClick={isEmergency ? undefined : () => toggleAssign(candidate.user_id)}
                                                >
                                                    {/* Rank badge */}
                                                    <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                                        isEmergency ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500' : originalIdx === 0 ? 'bg-amber-400/20 text-amber-600' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                                                    }`}>
                                                        {originalIdx + 1}
                                                    </div>

                                                    {/* Avatar */}
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                                                        isEmergency ? 'bg-slate-400 dark:bg-slate-700' : isSelected ? 'bg-emerald-500' : 'bg-linear-to-br from-brand to-brand-dark shadow-xs'
                                                    }`}>
                                                        {isSelected ? <CheckCircle2 className="w-5 h-5" /> : getMemberInitial(candidate.user_id)}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <p className={`text-sm font-bold truncate ${isEmergency ? 'text-gray-600 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'}`}>
                                                                {getMemberName(candidate.user_id)}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {isEmergency ? (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1 shadow-2xs">
                                                                        <span>🚨</span>
                                                                        <span>Emergency Absence</span>
                                                                    </span>
                                                                ) : isUnavailable ? (
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
                                                        <ScoreBar
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

                                                    {/* Checkbox proxy / Ban indicator */}
                                                    {isEmergency ? (
                                                        <div 
                                                            className="w-5 h-5 rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0 cursor-not-allowed"
                                                            title="Cannot assign - declared emergency absence"
                                                        >
                                                            <Ban className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                                            isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-slate-600'
                                                        }`}>
                                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {candidates.length > itemsPerPage && (
                                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-4 mt-4 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                                                Page {currentPage} of {Math.ceil(candidates.length / itemsPerPage)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(candidates.length / itemsPerPage), p + 1))}
                                                disabled={currentPage === Math.ceil(candidates.length / itemsPerPage)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-10 text-center">
                                    <User className="w-10 h-10 text-gray-200 dark:text-slate-700" />
                                    <p className="text-sm text-gray-400 dark:text-slate-500">
                                        No candidates returned. Make sure your team members have profiles set up.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Save Button */}
                {!isLoading && !error && candidates.length > 0 && (
                    <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 shrink-0 flex justify-end">
                        <button
                            onClick={handleSaveAssignments}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-dark transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : (
                                <>Save assignments ({assignedUserIds.size})</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
