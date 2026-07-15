import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
    X, Sparkles, Loader2, Save, Trash2,
    CheckCircle2, Clock, Zap, Brain, ListChecks,
    ChevronRight, AlertCircle, Plus, Layers, User, Users, ChevronDown
} from 'lucide-react';

// ─── Canonical Skills Dictionary ──────────────────────────────────────────────
export const CANONICAL_SKILLS_LIST = [
    // Languages
    { name: 'PHP', category: 'Language' },
    { name: 'Python', category: 'Language' },
    { name: 'JavaScript', category: 'Language' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Go', category: 'Language' },
    { name: 'Rust', category: 'Language' },
    { name: 'C#', category: 'Language' },
    { name: 'C++', category: 'Language' },
    { name: 'Java', category: 'Language' },
    { name: 'Kotlin', category: 'Language' },
    { name: 'Swift', category: 'Language' },
    { name: 'Ruby', category: 'Language' },
    { name: 'Dart', category: 'Language' },
    { name: 'Lua', category: 'Language' },
    { name: 'R', category: 'Language' },
    // Frameworks
    { name: 'Laravel', category: 'Framework' },
    { name: 'React', category: 'Framework' },
    { name: 'Vue.js', category: 'Framework' },
    { name: 'Next.js', category: 'Framework' },
    { name: 'Nuxt.js', category: 'Framework' },
    { name: 'Angular', category: 'Framework' },
    { name: 'Svelte', category: 'Framework' },
    { name: 'Django', category: 'Framework' },
    { name: 'FastAPI', category: 'Framework' },
    { name: 'Flask', category: 'Framework' },
    { name: 'Spring Boot', category: 'Framework' },
    { name: 'Ruby on Rails', category: 'Framework' },
    { name: 'Express.js', category: 'Framework' },
    { name: 'NestJS', category: 'Framework' },
    // Mobile
    { name: 'Flutter', category: 'Mobile' },
    { name: 'React Native', category: 'Mobile' },
    { name: 'Android (Native)', category: 'Mobile' },
    { name: 'iOS (Native)', category: 'Mobile' },
    // Databases
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MySQL', category: 'Database' },
    { name: 'SQLite', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Redis', category: 'Database' },
    { name: 'Elasticsearch', category: 'Database' },
    { name: 'Firebase', category: 'Database' },
    { name: 'Supabase', category: 'Database' },
    { name: 'Pinecone', category: 'Database' },
    { name: 'Milvus', category: 'Database' },
    { name: 'ChromaDB', category: 'Database' },
    // DevOps
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
    { name: 'Git', category: 'DevOps' },
    { name: 'AWS', category: 'DevOps' },
    { name: 'Google Cloud', category: 'DevOps' },
    { name: 'Azure', category: 'DevOps' },
    { name: 'Cloudflare', category: 'DevOps' },
    { name: 'Terraform', category: 'DevOps' },
    { name: 'Nginx', category: 'DevOps' },
    { name: 'Linux', category: 'DevOps' },
    { name: 'MLflow', category: 'DevOps' },
    { name: 'Ollama', category: 'DevOps' },
    // Game Engines
    { name: 'Unity', category: 'Game Engine' },
    { name: 'Unreal Engine', category: 'Game Engine' },
    { name: 'Godot', category: 'Game Engine' },
    { name: 'Figma', category: 'Design' },
    { name: 'Adobe XD', category: 'Design' },
    { name: 'Blender', category: 'Design' },
    { name: 'Photoshop', category: 'Design' },
    // Testing
    { name: 'PHPUnit', category: 'Testing' },
    { name: 'Jest', category: 'Testing' },
    { name: 'Cypress', category: 'Testing' },
    { name: 'Selenium', category: 'Testing' },
    { name: 'Pest', category: 'Testing' },
    // Data & ML
    { name: 'TensorFlow', category: 'Data & ML' },
    { name: 'PyTorch', category: 'Data & ML' },
    { name: 'scikit-learn', category: 'Data & ML' },
    { name: 'Pandas', category: 'Data & ML' },
    { name: 'NumPy', category: 'Data & ML' },
    { name: 'LangChain', category: 'Data & ML' },
    { name: 'LlamaIndex', category: 'Data & ML' },
    { name: 'Hugging Face', category: 'Data & ML' },
    { name: 'Keras', category: 'Data & ML' },
    // Professional
    { name: 'Strategic Leadership', category: 'Professional' },
    { name: 'Business Development', category: 'Professional' },
    { name: 'Financial Management', category: 'Professional' },
    { name: 'Project Management', category: 'Professional' },
    { name: 'Academic Research', category: 'Professional' },
    { name: 'Partnership Management', category: 'Professional' },
    { name: 'Digital Marketing', category: 'Professional' },
    { name: 'Legal & Compliance', category: 'Professional' },
    // API & Integration
    { name: 'REST APIs', category: 'API & Integration' },
    { name: 'GraphQL', category: 'API & Integration' },
    { name: 'gRPC', category: 'API & Integration' },
    { name: 'WebSockets', category: 'API & Integration' },
    { name: 'OpenAI API', category: 'API & Integration' },
    { name: 'Anthropic API', category: 'API & Integration' },
    { name: 'ElevenLabs API', category: 'API & Integration' },
    { name: 'Hugging Face APIs', category: 'API & Integration' },
    { name: 'Stripe API', category: 'API & Integration' },
    { name: 'Twilio API', category: 'API & Integration' },
    { name: 'OAuth / Auth0', category: 'API & Integration' },
];

// Group skills by category for optgroup rendering
const SKILL_CATEGORIES = CANONICAL_SKILLS_LIST.reduce((acc, skill) => {
    acc[skill.category] = acc[skill.category] || [];
    acc[skill.category].push(skill.name);
    return acc;
}, {});

// ─── Progress Stage Indicator ────────────────────────────────────────────────
const STAGES = [
    { key: 'intent',   icon: Brain,      label: 'Analysing Description' },
    { key: 'llm',      icon: Zap,        label: 'AI Generating Tasks'   },
    { key: 'validate', icon: ListChecks, label: 'Validating Output'     },
];

function StageIndicator({ stages, currentStage, pct }) {
    const currentIdx = stages.findIndex(s => s.key === currentStage);
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10">
                    <Brain className="w-5 h-5 text-brand animate-pulse" />
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

            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-brand via-brand-light to-brand rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="-mt-2 text-right text-[10px] font-semibold text-brand tabular-nums">{pct}%</p>

            <div className="flex flex-col gap-2 mt-1">
                {stages.map((stage, idx) => {
                    const done    = idx < currentIdx;
                    const active  = idx === currentIdx;
                    const Icon    = stage.icon;
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

            <p className="text-[11px] text-gray-400 dark:text-slate-600 flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3" />
                The result will appear automatically when the AI finishes. Don't close this window.
            </p>
        </div>
    );
}

// ─── Skill Pill Editor Sub-Component ──────────────────────────────────────────
function SkillPillEditor({ skills = [], onChange }) {
    const [isAdding, setIsAdding] = useState(false);

    const handleLevelChange = (index, newLevel) => {
        const updated = skills.map((skill, i) =>
            i === index ? { ...skill, level: Number(newLevel) } : skill
        );
        onChange(updated);
    };

    const handleRemove = (index) => {
        const updated = skills.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleAddSkill = (skillName) => {
        if (!skillName) return;
        const exists = skills.some(s => s.name.toLowerCase() === skillName.toLowerCase());
        if (!exists) {
            onChange([...skills, { name: skillName, level: 3 }]);
        }
        setIsAdding(false);
    };

    const existingNames = new Set(skills.map(s => s.name.toLowerCase()));

    return (
        <div className="flex flex-wrap items-center gap-2 pt-1">
            {skills.map((skill, idx) => (
                <div
                    key={`${skill.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm transition-all"
                >
                    <span>{skill.name}</span>

                    {/* Level selector */}
                    <div className="flex items-center border-l border-indigo-500/30 pl-1.5">
                        <span className="text-[10px] text-indigo-500/80 mr-0.5">Lv</span>
                        <select
                            value={skill.level || 3}
                            onChange={(e) => handleLevelChange(idx, e.target.value)}
                            className="bg-transparent border-0 py-0 pl-0 pr-3 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 focus:ring-0 cursor-pointer"
                            aria-label={`Proficiency level for ${skill.name}`}
                        >
                            {[1, 2, 3, 4, 5].map(lvl => (
                                <option key={lvl} value={lvl} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                                    {lvl}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Remove button */}
                    <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="p-0.5 rounded-full hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors"
                        title={`Remove ${skill.name}`}
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}

            {/* Add Skill section */}
            {isAdding ? (
                <div className="inline-flex items-center gap-1">
                    <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => handleAddSkill(e.target.value)}
                        onBlur={() => setIsAdding(false)}
                        className="text-xs rounded-full px-3 py-1 bg-white dark:bg-slate-800 border border-indigo-500 text-gray-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    >
                        <option value="" disabled>Select canonical skill...</option>
                        {Object.entries(SKILL_CATEGORIES).map(([category, names]) => (
                            <optgroup key={category} label={category}>
                                {names
                                    .filter(name => !existingNames.has(name.toLowerCase()))
                                    .map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-medium transition-all"
                >
                    <Plus className="w-3 h-3" />
                    <span>Add Skill</span>
                </button>
            )}
        </div>
    );
}

// ─── Priority colour classes ──────────────────────────────────────────────────
function getPriorityColorClass(priority) {
    switch (priority) {
        case 'Critical':
            return 'text-rose-500 dark:text-rose-400';
        case 'High':
            return 'text-amber-500 dark:text-amber-400';
        case 'Medium':
            return 'text-sky-500 dark:text-sky-400';
        case 'Low':
            return 'text-slate-400 dark:text-slate-400';
        default:
            return 'text-sky-500 dark:text-sky-400';
    }
}

// ─── Inline Assignment Section ────────────────────────────────────────────────
function InlineAssignment({ taskIndex, teamMembers = [], fitState, onAssign, onRemove, onClear }) {
    const { loading, candidates, error, assignedUserIds } = fitState;
    const [showAll, setShowAll] = useState(false);

    const getMember = (userId) => teamMembers.find(m => Number(m.id) === Number(userId));
    const getMemberName = (userId) => getMember(userId)?.name ?? null;
    const getInitial  = (userId) => getMemberName(userId)?.charAt(0).toUpperCase() ?? '?';

    const topCandidate = candidates[0] ?? null;
    const pct = (score) => Math.round((score ?? 0) * 100);

    return (
        <div className="border-t border-gray-100 dark:border-slate-800/80 pt-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Assignment
                </span>
                {assignedUserIds.length > 0 && (
                    <button type="button" onClick={onClear}
                        className="text-[10px] text-gray-400 hover:text-rose-500 transition-colors">
                        Leave unassigned
                    </button>
                )}
            </div>

            {/* Currently assigned pills */}
            {assignedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {assignedUserIds.filter(uid => getMember(uid)).map(uid => (
                        <div key={uid} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold flex items-center justify-center">{getInitial(uid)}</span>
                            {getMemberName(uid)}
                            <button type="button" onClick={() => onRemove(uid)}
                                className="text-emerald-400 hover:text-rose-500 transition-colors">
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex items-center gap-2 py-1">
                    <span className="flex gap-0.5">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-1 h-1 rounded-full bg-brand animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">Finding best fit…</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <p className="text-[11px] text-amber-500">{error}</p>
            )}

            {/* Top suggestion chip (when not yet assigned) */}
            {!loading && !error && topCandidate && getMember(topCandidate.user_id) && assignedUserIds.length === 0 && (
                <div className="flex items-center gap-2 p-2 rounded-xl border border-brand/25 bg-brand/5 dark:bg-brand/10">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {getInitial(topCandidate.user_id)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{getMemberName(topCandidate.user_id)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${pct(topCandidate.match_fit_score)}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500">{pct(topCandidate.match_fit_score)}% fit</span>
                        </div>
                    </div>
                    <button type="button"
                        onClick={() => onAssign([topCandidate.user_id])}
                        className="px-2.5 py-1 rounded-lg bg-brand text-white text-[11px] font-bold hover:bg-brand-dark transition-colors shrink-0">
                        Accept
                    </button>
                </div>
            )}

            {/* Dropdown to change / add from all candidates */}
            {!loading && candidates.length > 0 && (
                <div className="flex items-center gap-2">
                    <select
                        defaultValue=""
                        onChange={e => {
                            const id = Number(e.target.value);
                            if (id && !assignedUserIds.includes(id)) {
                                onAssign([...assignedUserIds, id]);
                            }
                            e.target.value = '';
                        }}
                        className="flex-1 text-[11px] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-gray-700 dark:text-slate-300 outline-none focus:border-brand"
                    >
                        <option value="">{assignedUserIds.length === 0 ? '↕ Change suggestion…' : '+ Add another person…'}</option>
                        {candidates.filter(c => getMember(c.user_id)).map(c => (
                            <option key={c.user_id} value={c.user_id}
                                disabled={assignedUserIds.includes(Number(c.user_id))}>
                                {getMemberName(c.user_id)} ({pct(c.match_fit_score)}%)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* When no candidates and not loading, show manual picker from teamMembers */}
            {!loading && candidates.length === 0 && teamMembers.length > 0 && (
                <select
                    defaultValue=""
                    onChange={e => {
                        const id = Number(e.target.value);
                        if (id && !assignedUserIds.includes(id)) {
                            onAssign([...assignedUserIds, id]);
                        }
                        e.target.value = '';
                    }}
                    className="w-full text-[11px] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-gray-700 dark:text-slate-300 outline-none focus:border-brand"
                >
                    <option value="">Assign manually…</option>
                    {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            )}
        </div>
    );
}

// ─── Editable Task Card Sub-Component ─────────────────────────────────────────
function EditableTaskCard({ task, index, updateTask, removeTask, teamMembers, fitState, onAssign, onRemoveMember, onClear }) {
    const handlePriorityChange = (e) => {
        updateTask(index, 'priority', e.target.value);
    };

    const handleClassificationChange = (e) => {
        updateTask(index, 'task_classification', e.target.value);
    };

    const handleDifficultyChange = (e) => {
        updateTask(index, 'task_difficulty', e.target.value);
    };

    const handleHoursChange = (e) => {
        const val = parseFloat(e.target.value);
        const clamped = isNaN(val) ? 1 : Math.max(1, Math.min(100, val));
        updateTask(index, 'estimated_hours', clamped);
    };

    const handleSkillsChange = (newSkills) => {
        updateTask(index, 'required_skills', newSkills);
    };

    return (
        <div className="group p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm hover:border-indigo-500/40 dark:hover:border-indigo-500/40 hover:shadow-md transition-all duration-300 space-y-4">
            {/* Title Row */}
            <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-inner">
                    {index + 1}
                </div>

                <input
                    type="text"
                    value={task.title || ''}
                    onChange={(e) => updateTask(index, 'title', e.target.value)}
                    placeholder="Task Title..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-400 dark:placeholder-slate-500"
                />

                <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove Task"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Description Textarea */}
            <div>
                <textarea
                    rows={3}
                    value={task.objective || task.description || ''}
                    onChange={(e) => {
                        updateTask(index, 'objective', e.target.value);
                        updateTask(index, 'description', e.target.value);
                    }}
                    placeholder="Describe the task objective and requirements..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder-gray-400 dark:placeholder-slate-500 leading-relaxed"
                />
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
                {/* Priority Selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Priority
                    </span>
                    <select
                        value={task.priority || 'Medium'}
                        onChange={handlePriorityChange}
                        className={`bg-transparent border-0 py-0 pl-1 pr-6 text-xs font-bold focus:ring-0 cursor-pointer ${getPriorityColorClass(task.priority)}`}
                    >
                        <option value="Low" className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">LOW</option>
                        <option value="Medium" className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">MEDIUM</option>
                        <option value="High" className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">HIGH</option>
                        <option value="Critical" className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">CRITICAL</option>
                    </select>
                </div>

                {/* Classification / Type Selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Type
                    </span>
                    <select
                        value={task.task_classification || 'Feature'}
                        onChange={handleClassificationChange}
                        className="bg-transparent border-0 py-0 pl-1 pr-6 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
                    >
                        <option value="Feature" className="bg-white dark:bg-slate-900">Feature</option>
                        <option value="Bug" className="bg-white dark:bg-slate-900">Bug</option>
                        <option value="Model Training" className="bg-white dark:bg-slate-900">Model Training</option>
                        <option value="UI/UX" className="bg-white dark:bg-slate-900">UI/UX</option>
                        <option value="Refactor" className="bg-white dark:bg-slate-900">Refactor</option>
                        <option value="Documentation" className="bg-white dark:bg-slate-900">Documentation</option>
                        <option value="DevOps" className="bg-white dark:bg-slate-900">DevOps</option>
                    </select>
                </div>

                {/* Difficulty Selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Difficulty
                    </span>
                    <select
                        value={task.task_difficulty || 'Medium'}
                        onChange={handleDifficultyChange}
                        className="bg-transparent border-0 py-0 pl-1 pr-6 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
                    >
                        <option value="Easy" className="bg-white dark:bg-slate-900">Easy</option>
                        <option value="Medium" className="bg-white dark:bg-slate-900">Medium</option>
                        <option value="Hard" className="bg-white dark:bg-slate-900">Hard</option>
                    </select>
                </div>

                {/* Estimated Hours Input */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Hours
                    </span>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={task.estimated_hours ?? 4}
                        onChange={handleHoursChange}
                        className="w-14 bg-transparent border-0 p-0 text-xs font-bold text-center text-gray-900 dark:text-slate-100 focus:ring-0"
                    />
                </div>

                {task.days_until_deadline !== undefined && task.days_until_deadline !== null && (
                    <span className="text-[11px] px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-medium">
                        Due in {task.days_until_deadline} days
                    </span>
                )}
            </div>

            {/* Required Skills Editor */}
            <div className="border-t border-gray-100 dark:border-slate-800/80 pt-3">
                <span className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Required Skills &amp; Proficiency
                </span>
                <SkillPillEditor
                    skills={task.required_skills || []}
                    onChange={handleSkillsChange}
                />
            </div>

            {/* Inline Assignment Section */}
            {fitState && (
                <InlineAssignment
                    taskIndex={index}
                    teamMembers={teamMembers}
                    fitState={fitState}
                    onAssign={onAssign}
                    onRemove={onRemoveMember}
                    onClear={onClear}
                />
            )}
        </div>
    );
}

function TaskAssignmentCard({ task, index, teamMembers, fitState, onAssign, onRemoveMember, onClear }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">{task.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">{task.objective || task.description || 'No description provided.'}</p>
                </div>
            </div>
            <InlineAssignment taskIndex={index} teamMembers={teamMembers} fitState={fitState} onAssign={onAssign} onRemove={onRemoveMember} onClear={onClear} />
        </div>
    );
}

// ─── Main SprintDecomposeModal Component ──────────────────────────────────────
export default function SprintDecomposeModal({
    isOpen,
    onClose,
    projectId,
    tenantId,
    teamMembers = [],
    initialDescription = '',
    initialDraftTasks = null,
    embedded = false,
    autoStart = false,
    onSaveSuccess = null,
}) {
    const [description, setDescription] = useState('');
    const [phase, setPhase]             = useState('input');   // input | loading | review | assign
    const [progress, setProgress]       = useState({ stage: null, message: '', pct: 0 });
    const [editableTasks, setEditableTasks] = useState(null);
    const [isSaving, setIsSaving]       = useState(false);
    const [error, setError]             = useState(null);
    // Per-task fit suggestion state: { loading, candidates, error, assignedUserIds }
    const [taskFits, setTaskFits]       = useState([]);

    const abortRef = useRef(null);
    const hasAutoStartedRef = useRef(false);

    // ── Fetch preview best-fit for all tasks in parallel ─────────────────────
    const fetchAllFits = useCallback(async (tasks) => {
        if (!tenantId) return;
        // Initialize loading state for every task
        setTaskFits(tasks.map(() => ({ loading: true, candidates: [], error: null, assignedUserIds: [] })));

        const previewUrl = route('tenant.ml.preview-best-fit', { tenant: tenantId });

        // Fire all requests in parallel — results show as they come in
        tasks.forEach(async (task, idx) => {
            try {
                const res = await axios.post(previewUrl, {
                    title:               task.title,
                    required_skills:     task.required_skills ?? [],
                    estimated_hours:     task.estimated_hours ?? 4,
                    task_difficulty:     task.task_difficulty ?? 'Medium',
                    task_classification: task.task_classification ?? 'Feature',
                    priority:            task.priority ?? 'Medium',
                }, { timeout: 300000 });

                const eligibleIds = new Set(teamMembers.map(member => Number(member.id)));
                const rankedCandidates = res.data.status === 'success'
                    ? (res.data.results ?? []).filter(candidate => eligibleIds.has(Number(candidate.user_id)))
                    : [];
                const candidates = rankedCandidates.length > 0
                    ? rankedCandidates
                    : teamMembers.map(member => ({
                        user_id: member.id,
                        match_fit_score: 0,
                        match_source: 'manual_fallback',
                    }));
                setTaskFits(prev => {
                    const next = [...prev];
                    next[idx] = { loading: false, candidates, error: null, assignedUserIds: [] };
                    return next;
                });
            } catch {
                setTaskFits(prev => {
                    const next = [...prev];
                    next[idx] = { loading: false, candidates: [], error: 'ML Engine unavailable', assignedUserIds: [] };
                    return next;
                });
            }
        });
    }, [tenantId, teamMembers]);

    const setTaskFitAssignment = (taskIndex, userIds) => {
        setTaskFits(prev => {
            const next = [...prev];
            if (next[taskIndex]) {
                next[taskIndex] = { ...next[taskIndex], assignedUserIds: userIds };
            }
            return next;
        });
    };

    const removeTaskFitMember = (taskIndex, userId) => {
        setTaskFits(prev => {
            const next = [...prev];
            if (next[taskIndex]) {
                next[taskIndex] = { ...next[taskIndex], assignedUserIds: next[taskIndex].assignedUserIds.filter(id => id !== userId) };
            }
            return next;
        });
    };

    const clearTaskFitAssignment = (taskIndex) => {
        setTaskFits(prev => {
            const next = [...prev];
            if (next[taskIndex]) {
                next[taskIndex] = { ...next[taskIndex], assignedUserIds: [] };
            }
            return next;
        });
    };

    useEffect(() => {
        if (isOpen && initialDescription) {
            setDescription(initialDescription);
        }
    }, [isOpen, initialDescription]);

    useEffect(() => {
        if (isOpen && initialDraftTasks) {
            setEditableTasks(initialDraftTasks);
            setPhase('review');
            setError(null);
            setTaskFits([]);
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
                const messages = buffer.split('\n\n');
                buffer = messages.pop() ?? '';

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
                        setEditableTasks(payload.tasks);
                        setPhase('review');
                        setTaskFits([]);
                    } else if (event === 'error') {
                        throw new Error(payload.message || 'Unknown error from ML Engine');
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
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

    const handleSaveDraft = async () => {
        if (!editableTasks?.length) return;
        setIsSaving(true);
        setError(null);
        try {
            // Merge inline assignment choices into each task payload
            const tasksWithAssignments = editableTasks.map((task, idx) => ({
                ...task,
                assigned_user_ids: taskFits[idx]?.assignedUserIds ?? [],
            }));
            const url = route('tenant.projects.tasks.bulk', { tenant: tenantId, project: projectId });
            await axios.post(url, { tasks: tasksWithAssignments }, {
                headers: { Accept: 'application/json' },
            });
            if (onSaveSuccess) {
                onSaveSuccess();
            } else {
                router.reload({ only: ['project'] });
            }
            setEditableTasks(null);
            setTaskFits([]);
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

    const updateTask = (index, field, value) => {
        setEditableTasks(currentTasks => {
            const updated = [...currentTasks];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const removeTask = (index) => {
        setEditableTasks(currentTasks => currentTasks.filter((_, i) => i !== index));
        setTaskFits(currentFits => currentFits.filter((_, i) => i !== index));
    };

    const handleProceedToAssignments = () => {
        if (!editableTasks?.length) return;
        setPhase('assign');
        fetchAllFits(editableTasks);
    };

    return (
        <div className={embedded ? 'mx-auto w-full max-w-4xl pt-6' : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md'}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/70 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shadow-inner">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                AI Sprint Decomposition
                            </h2>
                            {phase === 'review' && (
                                <p className="text-xs text-emerald-500 font-semibold mt-0.5 flex items-center gap-1">
                                    <span>✓ {editableTasks?.length || 0} task cards ready to review</span>
                                </p>
                            )}
                            {phase === 'assign' && (
                                <p className="text-xs text-emerald-500 font-semibold mt-0.5">Step 2 of 2 — choose one or more members for each task</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={phase === 'loading' ? handleCancel : onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                        title={phase === 'loading' ? 'Cancel generation' : 'Close'}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
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
                                    className="w-full p-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none outline-none text-gray-900 dark:text-slate-100 placeholder-gray-400"
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
                                    type="button"
                                    onClick={() => handleDecompose()}
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

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-400 dark:hover:text-red-400 transition-colors underline"
                                >
                                    Cancel generation
                                </button>
                            </div>
                        </div>
                    )}

                    {/* REVIEW PHASE */}
                    {phase === 'review' && editableTasks && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Review and tweak the AI's task cards below. Every field is inline-editable including skills and proficiency levels.
                            </p>

                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                {editableTasks.map((task, idx) => (
                                    <EditableTaskCard
                                        key={idx}
                                        task={task}
                                        index={idx}
                                        updateTask={updateTask}
                                        removeTask={removeTask}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {phase === 'assign' && editableTasks && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Assign the team</p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Select the recommended member or add as many additional members as needed. Tasks are saved only after this step.</p>
                            </div>
                            <div className="space-y-4">
                                {editableTasks.map((task, idx) => (
                                    <TaskAssignmentCard
                                        key={idx}
                                        task={task}
                                        index={idx}
                                        teamMembers={teamMembers}
                                        fitState={taskFits[idx] ?? { loading: true, candidates: [], error: null, assignedUserIds: [] }}
                                        onAssign={(userIds) => setTaskFitAssignment(idx, userIds)}
                                        onRemoveMember={(uid) => removeTaskFitMember(idx, uid)}
                                        onClear={() => clearTaskFitAssignment(idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (review and assignment) */}
                {(phase === 'review' || phase === 'assign') && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/70 flex items-center justify-between gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => phase === 'assign' ? setPhase('review') : (setEditableTasks(null), setTaskFits([]), setPhase('input'))}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {phase === 'assign' ? '← Back to task review' : '← Try Again'}
                        </button>
                        <button
                            type="button"
                            onClick={phase === 'assign' ? handleSaveDraft : handleProceedToAssignments}
                            disabled={isSaving || !editableTasks?.length}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white font-semibold shadow-md shadow-brand/20 disabled:opacity-50 hover:bg-brand-light transition-all"
                        >
                            {phase === 'assign' && isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : phase === 'assign' ? <Save className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            {phase === 'assign' ? `Confirm & Save${editableTasks?.length ? ` (${editableTasks.length} tasks)` : ''}` : 'Continue to member assignment'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
