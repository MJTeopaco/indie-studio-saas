import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, X, Trash2, Cpu, Check, Users, ArrowRight, Sparkles } from 'lucide-react';

const STATUSES = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'completed', label: 'Done' },
];

const TASK_CLASSIFICATIONS = [
    'Engineering',
    'Feature',
    'Bug Fix',
    'Research',
    'DevOps',
    'Testing',
    'Documentation',
    'Design',
];

const POSITIONS = [
    "Technical Product Manager",
    "Business Analyst",
    "Solutions Architect",
    "Data Scientist",
    "Full Stack Developer",
    "Backend Developer",
    "Frontend Developer",
    "Mobile Developer",
    "Game Developer",
    "AI / ML Engineer",
    "Data Engineer",
    "DevOps Engineer",
    "DevSecOps",
    "MLOps Engineer",
    "QA Automation Engineer",
    "Research Scientist",
    "Research Analyst",
    "Product Design Engineer",
    "Project Manager",
    "AI Solutions Architect",
    "Product Engineer",
    "Hardware / Embedded Engineer",
    "Hardware-in-the-Loop (HIL) Engineer"
];

const MACRO_DOMAINS = [
    "Product Strategy & Management",
    "Web & SaaS Platforms",
    "Data Science & Predictive Modeling",
    "DevOps & IT Infrastructure",
    "Hardware Prototyping & Embedded Systems",
    "UI/UX & Digital Asset Design",
    "Mobile Application Development",
    "Game Development & Interactive Media"
];

// Circular progress ring helper for Fit Percentage
function FitRing({ percent, size = 44 }) {
    const stroke = 4;
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    
    // Choose color based on score
    const color = percent >= 80 ? 'text-emerald-500' : percent >= 60 ? 'text-indigo-500' : 'text-amber-500';
    const trackColor = percent >= 80 ? 'stroke-emerald-100 dark:stroke-emerald-950' : percent >= 60 ? 'stroke-indigo-100 dark:stroke-indigo-950' : 'stroke-amber-100 dark:stroke-amber-950';

    return (
        <div className="relative shrink-0 select-none" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" className={trackColor} strokeWidth={stroke} />
                <circle cx={size/2} cy={size/2} r={r} fill="none" className={`${color} transition-all duration-700`}
                    strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-gray-800 dark:text-slate-200">
                {percent}%
            </span>
        </div>
    );
}

export default function ManualTaskModal({ isOpen, onClose, project, tenantId, sprints = [], teamMembers = [], skills = [], positions = [], editingTask = null }) {
    const { canManage, auth } = usePage().props;
    const currentUserId = auth?.user?.id;
    const safeSkills = Array.isArray(skills) ? skills : [];
    const safePositions = Array.isArray(positions) ? positions : [];
    const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];

    const defaultForm = {
        title: '',
        description: '',
        assigned_user_id: '',
        sprint_id: null,
        estimated_hours: 8,
        hard_constraint_date: '',
        priority: 'Medium',
        status: 'todo',
        task_classification: 'Engineering',
        required_position: 'Backend Developer',
        minimum_experience_years: 1,
        task_difficulty: 'Medium',
        macro_domains: [0, 0, 0, 0, 0, 0, 0, 0], // array of 8 bits
        required_skills: [], // array of { name: 'React', level: 3 }
        depends_on: [], // array of predecessor task IDs
    };

    const [form, setForm] = useState(defaultForm);
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [skillSearch, setSkillSearch] = useState('');

    // Flow stages: 'form' | 'recommendations'
    const [step, setStep] = useState('form');
    const [createdTask, setCreatedTask] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [explanation, setExplanation] = useState('');
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [assigningId, setAssigningId] = useState(null);

    const positionsList = safePositions.length > 0 ? safePositions.map(p => p.name) : POSITIONS;

    React.useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                setForm({
                    title: editingTask.title || '',
                    description: editingTask.description || '',
                    assigned_user_id: editingTask.assigned_user_id || '',
                    sprint_id: editingTask.sprint_id || null,
                    estimated_hours: editingTask.estimated_hours || 8,
                    hard_constraint_date: editingTask.hard_constraint_date ? editingTask.hard_constraint_date.split('T')[0] : '',
                    priority: editingTask.priority || 'Medium',
                    status: editingTask.status || 'todo',
                    task_classification: editingTask.task_classification || 'Engineering',
                    required_position: editingTask.required_position || 'Backend Developer',
                    minimum_experience_years: editingTask.minimum_experience_years || 1,
                    task_difficulty: editingTask.task_difficulty || 'Medium',
                    macro_domains: editingTask.target_macro_domains || [0, 0, 0, 0, 0, 0, 0, 0],
                    required_skills: editingTask.required_skills || [],
                    depends_on: Array.isArray(editingTask.depends_on) ? editingTask.depends_on : (editingTask.predecessors?.map(p => p.id) || []),
                });
            } else {
                setForm(defaultForm);
            }
            setErrors({});
            setStep('form');
            setCreatedTask(null);
            setRecommendations([]);
            setExplanation('');
        }
    }, [isOpen, editingTask]);

    // Skills autocomplete search results
    const filteredSkills = useMemo(() => {
        if (!skillSearch.trim()) return [];
        const term = skillSearch.toLowerCase();
        const selectedNames = new Set(form.required_skills.map(s => s.name.toLowerCase()));
        return safeSkills.filter(s => s.name.toLowerCase().includes(term) && !selectedNames.has(s.name.toLowerCase())).slice(0, 5);
    }, [safeSkills, skillSearch, form.required_skills]);

    if (!isOpen || !project) return null;

    const updateField = (field, value) => setForm(current => ({ ...current, [field]: value }));

    const handleMacroDomainChange = (index, checked) => {
        const nextDomains = [...form.macro_domains];
        nextDomains[index] = checked ? 1 : 0;
        updateField('macro_domains', nextDomains);
    };

    const addSkill = (skillName) => {
        const updated = [...form.required_skills, { name: skillName, level: 3 }];
        updateField('required_skills', updated);
        setSkillSearch('');
    };

    const removeSkill = (index) => {
        const updated = form.required_skills.filter((_, i) => i !== index);
        updateField('required_skills', updated);
    };

    const updateSkillLevel = (index, val) => {
        const updated = [...form.required_skills];
        updated[index] = { ...updated[index], level: Number(val) };
        updateField('required_skills', updated);
    };

    const handlePredecessorToggle = (taskId, checked) => {
        const updated = checked 
            ? [...form.depends_on, taskId]
            : form.depends_on.filter(id => id !== taskId);
        updateField('depends_on', updated);
    };

    // Submits the task form and shifts to GNN recommended members view
    const submitTask = (event) => {
        event.preventDefault();
        setIsSaving(true);
        setErrors({});

        if (!canManage && !editingTask) {
            setErrors({ title: 'Only managers can create tasks.' });
            setIsSaving(false);
            return;
        }

        const payload = {
            ...(canManage
                ? {
                    ...form,
                    assigned_user_id: form.assigned_user_id || null,
                    sprint_id: form.sprint_id,
                    estimated_hours: Number(form.estimated_hours),
                    hard_constraint_date: form.hard_constraint_date || null,
                    minimum_experience_years: Number(form.minimum_experience_years),
                    target_macro_domains: form.macro_domains,
                }
                : {
                    status: form.status,
                }),
        };

        const requestPromise = editingTask
            ? axios.patch(route('tenant.projects.tasks.update', { tenant: tenantId, project: project.id, task: editingTask.id }), payload)
            : axios.post(route('tenant.projects.tasks.store', { tenant: tenantId, project: project.id }), payload);

        requestPromise
        .then(response => {
            if (!editingTask && response.data?.status === 'success' && response.data?.task) {
                const newTask = response.data.task;
                setCreatedTask(newTask);
                setStep('recommendations');
                fetchRecommendations(newTask.id);
            } else {
                router.reload();
                handleClose();
            }
        })
        .catch(err => {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ title: 'An error occurred while saving.' });
            }
        })
        .finally(() => setIsSaving(false));
    };

    // Fetches GNN recommended members for the created task
    const fetchRecommendations = (taskId) => {
        setLoadingRecs(true);
        axios.post(route('tenant.ml.best-fit', { tenant: tenantId, task: taskId }))
            .then(res => {
                if (res.data?.status === 'success') {
                    setRecommendations(res.data.results || []);
                    setExplanation(res.data.explanation || '');
                }
            })
            .catch(err => console.error('GNN Recommendation failed:', err))
            .finally(() => setLoadingRecs(false));
    };

    // Assigns task to selected developer and completes modal flow
    const assignDeveloper = (developerUserId, fitScore) => {
        if (!createdTask) return;
        setAssigningId(developerUserId);

        axios.post(route('tenant.tasks.assign', { tenant: tenantId, task: createdTask.id }), {
            employee_user_id: developerUserId,
            match_fit_score: fitScore,
            assigned_by: 'gnn',
        })
        .then(res => {
            if (res.data?.status === 'success') {
                router.reload();
                handleClose();
            }
        })
        .catch(err => console.error('Assignment failed:', err))
        .finally(() => setAssigningId(null));
    };

    const handleClose = () => {
        setForm(defaultForm);
        setActiveTab('general');
        setStep('form');
        setCreatedTask(null);
        setRecommendations([]);
        setExplanation('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm select-none">
            <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800 shrink-0">
                    <div>
                        <h2 className="font-heading text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-brand animate-pulse" /> 
                            {step === 'form' ? (editingTask ? 'Edit Task Requirements & CPA Anchor' : 'Create Task Requirements') : 'GNN Developer Recommendation Routing'}
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                            {step === 'form' 
                                ? (editingTask ? `Updating specifications for #${editingTask.id} in ${project.name}.` : `Configure task specifications for ${project.name}.`) 
                                : `Routing optimal matches for: ${createdTask?.title}.`}
                        </p>
                    </div>
                    <button type="button" onClick={handleClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Sub-tabs (Form Step only) */}
                {step === 'form' && canManage && (
                    <div className="flex border-b border-gray-100 dark:border-slate-800 px-6 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
                        {[
                            { id: 'general', label: 'General Info' },
                            { id: 'gnn',     label: 'GNN Requirements' },
                            { id: 'skills',  label: 'Required Skills' },
                            { id: 'cpa',     label: 'Dependencies (CPA)' },
                        ].map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={`py-3 text-xs font-semibold border-b-2 transition-all mr-6 ${
                                    activeTab === t.id
                                        ? 'border-brand text-brand dark:text-brand-light'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                    
                    {step === 'form' ? (
                        /* ── STEP 1: FORM WIZARD ── */
                        <div className="space-y-4">
                            
                             {/* General Tab */}
                             {(activeTab === 'general' || !canManage) && (
                                 <div className="space-y-4">
                                     {canManage ? (
                                         <>
                                             <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Task title *
                                                 <input autoFocus value={form.title} onChange={event => updateField('title', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" placeholder="e.g. Implement user authentication endpoints" />
                                                 {errors.title && <span className="mt-1 block text-xs text-rose-500">{errors.title}</span>}
                                             </label>
                                             
                                             <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Description
                                                 <textarea value={form.description} onChange={event => updateField('description', event.target.value)} rows="3" className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" placeholder="Fully describe details and objective of the task..." />
                                             </label>

                                             <div className="grid grid-cols-2 gap-4">
                                                 <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Estimated hours *
                                                     <input type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={event => updateField('estimated_hours', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
                                                 </label>
                                                 <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Priority *
                                                     <select value={form.priority} onChange={event => updateField('priority', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">{['Low', 'Medium', 'High', 'Critical'].map(priority => <option key={priority}>{priority}</option>)}</select>
                                                 </label>
                                             </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                 <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Hard Constraint Date <span className="font-normal text-gray-400 dark:text-gray-500">(Fixed Deadline)</span>
                                                     <input type="date" value={form.hard_constraint_date} onChange={event => updateField('hard_constraint_date', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
                                                 </label>
                                                 <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Status *
                                                     <select value={form.status} onChange={event => updateField('status', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">{STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
                                                 </label>
                                             </div>
                                             
                                             <div className="grid grid-cols-2 gap-4">
                                                 <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Sprint
                                                     <select value={form.sprint_id || ''} onChange={event => updateField('sprint_id', event.target.value ? Number(event.target.value) : null)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">
                                                         <option value="">Backlog (No Sprint)</option>
                                                         {sprints.map(sprint => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                                                     </select>
                                                 </label>
                                                 <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Assignee (Quick Manual)
                                                     <select value={form.assigned_user_id} onChange={event => updateField('assigned_user_id', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950"><option value="">Unassigned</option>{safeTeamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
                                                 </label>
                                             </div>
                                         </>
                                     ) : (
                                         <>
                                             <div className="mb-4 space-y-2 pb-4 border-b border-gray-100 dark:border-slate-800">
                                                 <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{form.title}</h3>
                                                 {form.description && (
                                                     <p className="text-xs text-gray-500 dark:text-slate-400">{form.description}</p>
                                                 )}
                                             </div>
                                             <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Status *
                                                 <select 
                                                     value={form.status} 
                                                     onChange={event => updateField('status', event.target.value)} 
                                                     disabled={Number(editingTask?.assigned_user_id) !== Number(currentUserId)}
                                                     className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950 disabled:opacity-50"
                                                 >
                                                     {STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                                                 </select>
                                             </label>
                                         </>
                                     )}
                                 </div>
                             )}

                            {/* GNN Tab */}
                            {activeTab === 'gnn' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Task Classification
                                            <select value={form.task_classification} onChange={event => updateField('task_classification', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">
                                                {TASK_CLASSIFICATIONS.map(classification => (
                                                    <option key={classification} value={classification}>{classification}</option>
                                                ))}
                                            </select>
                                        </label>
                                        
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Required Position
                                            <select value={form.required_position} onChange={event => updateField('required_position', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">
                                                {positionsList.map(pos => (
                                                    <option key={pos} value={pos}>{pos}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Min Experience (Years)
                                            <input type="number" min="0" max="20" step="0.5" value={form.minimum_experience_years} onChange={event => updateField('minimum_experience_years', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" />
                                        </label>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Task Difficulty
                                            <select value={form.task_difficulty} onChange={event => updateField('task_difficulty', event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950">{['Easy', 'Medium', 'Hard'].map(diff => <option key={diff}>{diff}</option>)}</select>
                                        </label>
                                    </div>

                                    {/* Macro Domains */}
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Target Macro Domains</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {MACRO_DOMAINS.map((domain, index) => (
                                                <label key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 p-2 border border-gray-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50/50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.macro_domains[index] === 1}
                                                        onChange={e => handleMacroDomainChange(index, e.target.checked)}
                                                        className="rounded border-gray-300 text-brand focus:ring-brand"
                                                    />
                                                    <span className="truncate">{domain}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Skills Tab */}
                            {activeTab === 'skills' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Search Skills to Add
                                            <input 
                                                type="text" 
                                                value={skillSearch}
                                                onChange={e => setSkillSearch(e.target.value)}
                                                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-950" 
                                                placeholder="Type to search e.g. React, Python..."
                                            />
                                        </label>
                                        
                                        {filteredSkills.length > 0 && (
                                            <div className="absolute z-10 w-full max-w-[500px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 mt-1 rounded-xl shadow-lg overflow-hidden">
                                                {filteredSkills.map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => addSkill(s.name)}
                                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-brand hover:text-white transition-colors"
                                                    >
                                                        {s.name} ({s.category})
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Skills List */}
                                    <div className="space-y-2">
                                        <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Required Skill Level (1-5)</span>
                                        {form.required_skills.length === 0 ? (
                                            <p className="text-xs text-gray-400 dark:text-slate-500 italic">No skills added yet.</p>
                                        ) : (
                                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                                {form.required_skills.map((s, idx) => (
                                                    <div key={s.name} className="flex items-center justify-between gap-4 p-3 border border-gray-150 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/20">
                                                        <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{s.name}</span>
                                                        <div className="flex items-center gap-4 flex-1 justify-end">
                                                            <input 
                                                                type="range" 
                                                                min="1" 
                                                                max="5" 
                                                                value={s.level} 
                                                                onChange={e => updateSkillLevel(idx, e.target.value)}
                                                                className="w-24 accent-brand"
                                                            />
                                                            <span className="text-xs font-bold font-mono w-4">{s.level}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeSkill(idx)}
                                                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Predecessors Tab */}
                            {activeTab === 'cpa' && (
                                <div className="space-y-4">
                                    <span className="block text-xs font-semibold text-gray-700 dark:text-slate-300">Task Predecessors (Depends On)</span>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Select tasks that must be completed before this task can begin.</p>
                                    
                                    {project.tasks && project.tasks.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                                            {project.tasks.map(task => (
                                                <label key={task.id} className="flex items-center gap-2.5 p-3 border border-gray-150 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-gray-50/50 transition-colors">
                                                    <input 
                                                        type="checkbox"
                                                        checked={form.depends_on.includes(task.id)}
                                                        onChange={e => handlePredecessorToggle(task.id, e.target.checked)}
                                                        className="rounded border-gray-300 text-brand focus:ring-brand"
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="block text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{task.title}</span>
                                                        <span className="block text-[10px] text-gray-400 dark:text-slate-500 font-mono">#{task.id}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 dark:text-slate-500 italic">No other tasks in this project to link as dependencies.</p>
                                    )}
                                </div>
                            )}

                        </div>
                    ) : (
                        /* ── STEP 3: GNN RECOMMENDATIONS & ASSIGNMENT ── */
                        <div className="space-y-5">
                            
                            {loadingRecs ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                                    <p className="text-xs font-bold text-gray-600 dark:text-slate-400">Computing GNN developer fit probabilities...</p>
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Mapping skill alignments &amp; scheduling constraints.</p>
                                </div>
                            ) : (
                                <>
                                    {/* LLM Synthesis Explanation Card */}
                                    {explanation && (
                                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                                            <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                AI Synthesis Insights
                                            </h4>
                                            <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-slate-350">
                                                {explanation}
                                            </p>
                                        </div>
                                    )}

                                    {/* Recommendations List */}
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-extrabold text-gray-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-brand" /> Match Recommendations
                                        </h3>

                                        {recommendations.length === 0 ? (
                                            <p className="text-xs text-gray-400 dark:text-slate-500 italic py-4">No candidates matched task qualifications.</p>
                                        ) : (
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                                {recommendations.map(candidate => {
                                                    const pct = Math.round((candidate.score ?? 0.5) * 100);
                                                    const isAssigning = assigningId === candidate.user_id;

                                                    return (
                                                        <div 
                                                            key={candidate.user_id} 
                                                            className="flex items-center justify-between gap-4 p-4 border border-gray-150 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-center gap-3.5 min-w-0">
                                                                {/* Circular progress meter with score */}
                                                                <FitRing percent={pct} />
                                                                
                                                                <div className="min-w-0">
                                                                    <span className="block text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                                                                        {candidate.display_name}
                                                                    </span>
                                                                    <span className="block text-xs text-gray-400 dark:text-slate-500 truncate capitalize">
                                                                        {candidate.position || 'Developer'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                disabled={assigningId !== null}
                                                                onClick={() => assignDeveloper(candidate.user_id, candidate.score)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 shadow-sm"
                                                            >
                                                                {isAssigning ? (
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-3.5 h-3.5" />
                                                                )}
                                                                <span>Assign</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-slate-800 shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
                    {step === 'form' ? (
                        <>
                            <button type="button" onClick={handleClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-850">
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={submitTask}
                                disabled={isSaving || !form.title || (!canManage && Number(editingTask?.assigned_user_id) !== Number(currentUserId))} 
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-dark transition-all shadow-md"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                <span>{editingTask ? (canManage ? 'Update Task Specifications' : 'Update Task Status') : 'Create Task'}</span>
                            </button>
                        </>
                    ) : (
                        <button 
                            type="button" 
                            onClick={() => {
                                router.reload();
                                handleClose();
                            }} 
                            className="rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 px-4 py-2 text-sm font-bold transition-colors"
                        >
                            Skip &amp; Finish
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
