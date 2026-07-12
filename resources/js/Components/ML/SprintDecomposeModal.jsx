import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
    X, Sparkles, Loader2, Save, Trash2,
    CheckCircle2, Clock, Zap, Brain, ListChecks,
    ChevronRight, AlertCircle
} from 'lucide-react';

// ─── Progress stage config ────────────────────────────────────────────────────
const STAGES = [
    { key: 'intent',   icon: Brain,      label: 'Analysing Description' },
    { key: 'llm',      icon: Zap,        label: 'AI Generating Tasks'   },
    { key: 'validate', icon: ListChecks, label: 'Validating Output'     },
];

function StageIndicator({ stages, currentStage, pct }) {
    const currentIdx = stages.findIndex(s => s.key === currentStage);
    return (
        <div className="flex flex-col gap-4">
            {/* Pulsing headline */}
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10">
                    <Brain className="w-5 h-5 text-brand animate-pulse" />
                    {/* spinning ring */}
                    <span className="absolute inset-0 rounded-xl border-2 border-brand/30 border-t-brand animate-spin" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                        AI Sprint Decomposition in Progress
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Running local LLM — this takes 1–3 minutes on your machine
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Stage steps */}
            <div className="flex flex-col gap-2 mt-1">
                {stages.map((stage, idx) => {
                    const done    = idx < currentIdx;
                    const active  = idx === currentIdx;
                    const pending = idx > currentIdx;
                    const Icon = stage.icon;
                    return (
                        <div
                            key={stage.key}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-300 ${
                                active
                                    ? 'border-brand/40 bg-brand/5 dark:bg-brand/10'
                                    : done
                                    ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10'
                                    : 'border-gray-100 dark:border-slate-800 opacity-40'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                done
                                    ? 'bg-emerald-500/20'
                                    : active
                                    ? 'bg-brand/20'
                                    : 'bg-gray-200 dark:bg-slate-700'
                            }`}>
                                {done ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : active ? (
                                    <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                                ) : (
                                    <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                                )}
                            </div>
                            <span className={`text-xs font-semibold ${
                                done ? 'text-emerald-600 dark:text-emerald-400'
                                    : active ? 'text-brand dark:text-brand-light'
                                    : 'text-gray-400 dark:text-slate-500'
                            }`}>
                                {stage.label}
                            </span>
                            {done && (
                                <span className="ml-auto text-[10px] font-medium text-emerald-500">Done</span>
                            )}
                            {active && (
                                <span className="ml-auto flex gap-0.5">
                                    {[0, 1, 2].map(i => (
                                        <span
                                            key={i}
                                            className="w-1 h-1 rounded-full bg-brand animate-bounce"
                                            style={{ animationDelay: `${i * 150}ms` }}
                                        />
                                    ))}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Patience note */}
            <p className="text-[11px] text-gray-400 dark:text-slate-600 flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3" />
                The result will appear automatically when the AI finishes. Don't close this window.
            </p>
        </div>
    );
}

// ─── Priority badge colours ───────────────────────────────────────────────────
const PRIORITY_COLOURS = {
    Critical: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    High:     'bg-amber-500/15 text-amber-500 border-amber-500/30',
    Medium:   'bg-sky-500/15 text-sky-500 border-sky-500/30',
    Low:      'bg-slate-500/15 text-slate-400 border-slate-400/30',
};

function PriorityBadge({ priority }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${PRIORITY_COLOURS[priority] || PRIORITY_COLOURS.Medium}`}>
            {priority}
        </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SprintDecomposeModal({
    isOpen,
    onClose,
    projectId,
    tenantId,
    initialDescription = '',
    initialDraftTasks = null,
    embedded = false,
    autoStart = false,
    onSaveSuccess = null,
}) {
    const [description, setDescription] = useState('');
    const [phase, setPhase]             = useState('input');   // input | loading | review
    const [progress, setProgress]       = useState({ stage: null, message: '', pct: 0 });
    const [draftTasks, setDraftTasks]   = useState(null);
    const [isSaving, setIsSaving]       = useState(false);
    const [error, setError]             = useState(null);

    const abortRef = useRef(null);
    const hasAutoStartedRef = useRef(false);

    useEffect(() => {
        if (isOpen && initialDescription) {
            setDescription(initialDescription);
        }
    }, [isOpen, initialDescription]);

    useEffect(() => {
        if (isOpen && initialDraftTasks) {
            setDraftTasks(initialDraftTasks);
            setPhase('review');
            setError(null);
        }
    }, [isOpen, initialDraftTasks]);

    useEffect(() => {
        if (!isOpen) {
            hasAutoStartedRef.current = false;
            return;
        }

        if (autoStart && initialDescription && !hasAutoStartedRef.current) {
            hasAutoStartedRef.current = true;
            handleDecompose(initialDescription);
        }
    }, [isOpen, initialDescription, autoStart]);

    if (!isOpen) return null;

    // ── Decompose via SSE stream directly to FastAPI ──────────────────────────
    const handleDecompose = async (promptOverride = null) => {
        const promptText = promptOverride ?? description;
        if (!promptText.trim()) return;

        setPhase('loading');
        setError(null);
        setProgress({ stage: 'intent', message: 'Analysing project description...', pct: 10 });

        const ML_URL = 'http://127.0.0.1:8001/api/llm/decompose-project/stream';

        try {
            const controller = new AbortController();
            abortRef.current = controller;

            const response = await fetch(ML_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: promptText }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`ML Engine returned HTTP ${response.status}`);
            }

            const reader  = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer    = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse complete SSE messages (delimited by \n\n)
                const messages = buffer.split('\n\n');
                buffer = messages.pop() ?? ''; // keep incomplete tail

                for (const msg of messages) {
                    if (!msg.trim()) continue;
                    const lines = msg.split('\n');
                    let event = 'message';
                    let data  = '';
                    for (const line of lines) {
                        if (line.startsWith('event:')) event = line.slice(6).trim();
                        if (line.startsWith('data:'))  data  = line.slice(5).trim();
                    }
                    if (!data) continue;
                    const payload = JSON.parse(data);

                    if (event === 'progress') {
                        setProgress({ stage: payload.stage, message: payload.message, pct: payload.pct });
                    } else if (event === 'done') {
                        setProgress(p => ({ ...p, pct: 100 }));
                        setDraftTasks(payload.tasks);
                        setPhase('review');
                    } else if (event === 'error') {
                        throw new Error(payload.message || 'Unknown error from ML Engine');
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return; // user cancelled
            console.error(err);
            setError(err.message || 'Error connecting to ML Engine. Make sure it is running on port 8001.');
            setPhase('input');
        } finally {
            abortRef.current = null;
        }
    };

    const handleCancel = () => {
        abortRef.current?.abort();
        setPhase('input');
        setError(null);
    };

    // ── Save confirmed draft to DB ────────────────────────────────────────────
    const handleSaveDraft = async () => {
        if (!draftTasks?.length) return;
        setIsSaving(true);
        setError(null);
        try {
            const url = route('tenant.projects.tasks.bulk', { tenant: tenantId, project: projectId });
            await axios.post(url, { tasks: draftTasks }, {
                headers: { Accept: 'application/json' },
            });
            if (onSaveSuccess) {
                onSaveSuccess();
            } else {
                router.reload({ only: ['project'] });
            }
            setDraftTasks(null);
            setDescription('');
            setPhase('input');
            onClose();
        } catch (err) {
            console.error(err);
            setError('Error saving tasks to the database.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateTask = (index, field, value) => {
        const updated = [...draftTasks];
        updated[index][field] = value;
        setDraftTasks(updated);
    };

    const handleRemoveTask = (index) => {
        setDraftTasks(draftTasks.filter((_, i) => i !== index));
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className={embedded ? 'mx-auto w-full max-w-3xl pt-6' : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">

                {/* ── Header ── */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                AI Sprint Decomposition
                            </h2>
                            {phase === 'review' && (
                                <p className="text-xs text-emerald-500 font-semibold mt-0.5">
                                    ✓ {draftTasks?.length} tasks generated — review before saving
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={phase === 'loading' ? handleCancel : onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        title={phase === 'loading' ? 'Cancel generation' : 'Close'}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* INPUT PHASE */}
                    {phase === 'input' && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Describe the Sprint Goals
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="E.g. We need to build a new telemetry dashboard, add a user profile page, and secure the webhook endpoint..."
                                    rows={5}
                                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-sm resize-none outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400"
                                />
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={handleDecompose}
                                    disabled={!description.trim()}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-light transition-colors shadow-md shadow-brand/20"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Generate Draft
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LOADING PHASE */}
                    {phase === 'loading' && (
                        <div className="space-y-6 py-4">
                            <StageIndicator
                                stages={STAGES}
                                currentStage={progress.stage}
                                pct={progress.pct}
                            />

                            {/* Cancel button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={handleCancel}
                                    className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-400 dark:hover:text-red-400 transition-colors underline"
                                >
                                    Cancel generation
                                </button>
                            </div>
                        </div>
                    )}

                    {/* REVIEW PHASE */}
                    {phase === 'review' && draftTasks && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Review and edit the AI-generated tasks below. Remove any you don't need, then click <strong>Confirm &amp; Save</strong> to add them to the Kanban board.
                            </p>

                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                {draftTasks.map((task, idx) => (
                                    <div
                                        key={idx}
                                        className="group p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-brand/40 transition-colors"
                                    >
                                        <div className="flex gap-3">
                                            {/* Index badge */}
                                            <div className="w-6 h-6 rounded-full bg-brand/10 text-brand text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>

                                            <div className="flex-1 space-y-2.5">
                                                {/* Title */}
                                                <input
                                                    type="text"
                                                    value={task.title}
                                                    onChange={e => handleUpdateTask(idx, 'title', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-900 dark:text-slate-100 outline-none focus:border-brand"
                                                />

                                                {/* Objective */}
                                                <textarea
                                                    value={task.objective || task.description || ''}
                                                    onChange={e => handleUpdateTask(idx, 'objective', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs h-14 resize-none outline-none focus:border-brand text-gray-700 dark:text-slate-300"
                                                    placeholder="Task objective..."
                                                />

                                                {/* Meta row */}
                                                <div className="flex items-center flex-wrap gap-3">
                                                    <PriorityBadge priority={task.priority} />
                                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 font-medium">
                                                        {task.task_classification || 'Feature'}
                                                    </span>
                                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 font-medium">
                                                        {task.task_difficulty || 'Medium'}
                                                    </span>
                                                    {task.days_until_deadline !== undefined && task.days_until_deadline !== null && (
                                                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-brand/10 text-brand border border-brand/20 font-medium">
                                                            Due in {task.days_until_deadline} days
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1.5">
                                                        <label className="text-[11px] text-gray-400">Hours</label>
                                                        <input
                                                            type="number"
                                                            value={task.estimated_hours || 0}
                                                            onChange={e => handleUpdateTask(idx, 'estimated_hours', parseFloat(e.target.value))}
                                                            className="w-16 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs text-center outline-none focus:border-brand"
                                                            min={0}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Skills */}
                                                {task.required_skills?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {task.required_skills.map((s, si) => (
                                                            <span key={si} className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-medium">
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => handleRemoveTask(idx)}
                                                className="p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors self-start opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer (review only) ── */}
                {phase === 'review' && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3 shrink-0">
                        <button
                            onClick={() => { setDraftTasks(null); setPhase('input'); }}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            ← Try Again
                        </button>
                        <button
                            onClick={handleSaveDraft}
                            disabled={isSaving || !draftTasks?.length}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand text-white font-semibold shadow-md shadow-brand/20 disabled:opacity-50 hover:bg-brand-light transition-colors"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Confirm &amp; Save {draftTasks?.length ? `(${draftTasks.length} tasks)` : ''}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
