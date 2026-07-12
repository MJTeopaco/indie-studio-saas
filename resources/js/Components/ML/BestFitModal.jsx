import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
    X, Cpu, Loader2, Trophy, ArrowRight,
    CheckCircle2, Brain, Sparkles, AlertCircle, User
} from 'lucide-react';

// ─── Animated loading state for BestFit GNN + LLM inference ─────────────────
function GNNLoadingView() {
    const steps = [
        { icon: Brain,    label: 'Vectorising task requirements' },
        { icon: Cpu,      label: 'Running GNN inference'         },
        { icon: Sparkles, label: 'Synthesising explanation'      },
    ];
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep(s => (s < steps.length - 1 ? s + 1 : s));
        }, 4000);
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
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Running GNN + LLM analysis on your team…</p>
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
function ScoreBar({ score }) {
    const pct = Math.round(score * 100);
    const colour = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full ${colour} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-[11px] font-bold ${pct >= 75 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-400'}`}>
                {pct}%
            </span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BestFitModal({ isOpen, onClose, task, teamMembers, tenantId }) {
    const [isLoading,     setIsLoading]     = useState(false);
    const [candidates,    setCandidates]    = useState([]);
    const [explanation,   setExplanation]   = useState(null);
    const [error,         setError]         = useState(null);
    const [assigning,     setAssigning]     = useState(null);  // userId being assigned
    const [assignedTo,    setAssignedTo]    = useState(null);  // successfully assigned userId

    useEffect(() => {
        if (isOpen && task) {
            setCandidates([]);
            setExplanation(null);
            setError(null);
            setAssignedTo(null);
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

    const handleAssign = async (candidate) => {
        setAssigning(candidate.user_id);
        try {
            const url = route('tenant.tasks.assign', { tenant: tenantId, task: task.id });
            await axios.post(url, {
                employee_user_id: candidate.user_id,
                match_fit_score:  candidate.match_fit_score,
                assigned_by:      candidate.source ?? 'gnn',
            });
            setAssignedTo(candidate.user_id);
            // Refresh the project data after a short delay so the Kanban card updates
            setTimeout(() => {
                router.reload({ only: ['project'] });
                onClose();
            }, 800);
        } catch (err) {
            console.error(err);
            setError('Failed to save assignment. Please try again.');
        } finally {
            setAssigning(null);
        }
    };

    const getMemberName = (userId) => {
        const m = teamMembers?.find(m => Number(m.id) === Number(userId));
        return m ? m.name : `Team Member #${userId}`;
    };

    const getMemberInitial = (userId) => getMemberName(userId).charAt(0).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
                <div className="p-6">
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
                                <div className="space-y-2">
                                    {candidates.map((candidate, idx) => {
                                        const isAssigning = assigning === candidate.user_id;
                                        const wasAssigned = assignedTo === candidate.user_id;
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                                                    wasAssigned
                                                        ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10'
                                                        : 'border-gray-200 dark:border-slate-700 hover:border-brand/40 bg-white dark:bg-slate-800/50'
                                                }`}
                                            >
                                                {/* Rank badge */}
                                                <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                                    idx === 0 ? 'bg-amber-400/20 text-amber-600' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                                                }`}>
                                                    {idx + 1}
                                                </div>

                                                {/* Avatar */}
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                                                    wasAssigned ? 'bg-emerald-500' : 'bg-gradient-to-br from-brand to-brand-dark shadow-sm'
                                                }`}>
                                                    {wasAssigned ? <CheckCircle2 className="w-5 h-5" /> : getMemberInitial(candidate.user_id)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                                                        {getMemberName(candidate.user_id)}
                                                    </p>
                                                    <ScoreBar score={candidate.match_fit_score} />
                                                </div>

                                                {/* Assign button */}
                                                <button
                                                    onClick={() => handleAssign(candidate)}
                                                    disabled={isAssigning || !!assignedTo}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 ${
                                                        wasAssigned
                                                            ? 'bg-emerald-500 text-white cursor-default'
                                                            : 'bg-gray-100 dark:bg-slate-700 hover:bg-brand hover:text-white dark:text-slate-200 dark:hover:bg-brand disabled:opacity-50 disabled:cursor-not-allowed'
                                                    }`}
                                                >
                                                    {isAssigning ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : wasAssigned ? (
                                                        <><CheckCircle2 className="w-3.5 h-3.5" /> Assigned</>
                                                    ) : (
                                                        <>Assign <ArrowRight className="w-3.5 h-3.5" /></>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
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
            </div>
        </div>
    );
}
