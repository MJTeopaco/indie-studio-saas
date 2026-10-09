import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, FileText, Edit2, MoreVertical, ChevronsUp, ChevronUp, Minus, Circle, CircleDot, CheckCircle2 } from 'lucide-react';
import PortaledPopover from '@/Components/UI/PortaledPopover';
import PortaledTooltip from '@/Components/UI/PortaledTooltip';
import axios from 'axios';
import CreateEpicGroupModal from './CreateEpicGroupModal';
import CreateEpicModal from './CreateEpicModal';
import { router } from '@inertiajs/react';
function getContrastColor(hexColor) {
    if (!hexColor) return '#111827';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // WCAG relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111827' : '#ffffff';
}

function deriveCalendarDate(startDateStr, hoursOffset) {
    if (!startDateStr || hoursOffset === null || hoursOffset === undefined) return null;
    const daysOffset = Math.floor(Number(hoursOffset) / 8);
    const date = new Date(startDateStr);
    let added = 0;
    while (added < daysOffset) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) {
            added++;
        }
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function InlinePhaseEditor({ epic, phases, onUpdate, onClose, projectId, tenantId, triggerRef }) {
    const [customLabel, setCustomLabel] = useState('');
    const [customColor, setCustomColor] = useState('#8b5cf6');

    const handleSelect = async (phaseId) => {
        onUpdate(epic.id, { phase_id: phaseId });
        onClose();
        try {
            await axios.patch(`/studio/${tenantId}/projects/${projectId}/epics/${epic.id}`, { phase_id: phaseId });
        } catch (e) {
            console.error('Failed to update phase', e);
        }
    };

    const handleAddCustom = async () => {
        if (!customLabel.trim()) return;
        try {
            const res = await axios.post(`/studio/${tenantId}/projects/${projectId}/epic-attributes`, {
                type: 'phase',
                label: customLabel.trim(),
                color: customColor,
            });
            const newPhase = res.data;
            onUpdate(epic.id, { phase_id: newPhase.id }, { type: 'phase', data: newPhase });
            onClose();
            await axios.patch(`/studio/${tenantId}/projects/${projectId}/epics/${epic.id}`, { phase_id: newPhase.id });
        } catch (e) {
            console.error('Failed to add custom phase', e);
        }
    };

    return (
        <PortaledPopover isOpen={true} onClose={onClose} triggerRef={triggerRef} className="w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 text-xs font-bold text-gray-500 uppercase">Select Phase</div>
            <div className="max-h-48 overflow-y-auto space-y-1">
                {phases.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        className="w-full rounded px-2 py-1 text-left text-xs font-medium hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.label}
                    </button>
                ))}
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-slate-800">
                <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Add Custom Phase</div>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        className="h-6 w-6 cursor-pointer border-0 p-0"
                    />
                    <input
                        type="text"
                        placeholder="New phase name"
                        value={customLabel}
                        onChange={e => setCustomLabel(e.target.value)}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <button onClick={handleAddCustom} className="rounded bg-brand px-2 py-1 text-xs font-bold text-white hover:bg-brand-light">Add</button>
                </div>
            </div>
        </PortaledPopover>
    );
}

function InlinePriorityEditor({ epic, priorities, onUpdate, onClose, projectId, tenantId, triggerRef }) {
    const [customLabel, setCustomLabel] = useState('');
    const [customColor, setCustomColor] = useState('#ef4444');

    const handleSelect = async (priorityId) => {
        onUpdate(epic.id, { priority_id: priorityId });
        onClose();
        try {
            await axios.patch(`/studio/${tenantId}/projects/${projectId}/epics/${epic.id}`, { priority_id: priorityId });
        } catch (e) {
            console.error('Failed to update priority', e);
        }
    };

    const handleAddCustom = async () => {
        if (!customLabel.trim()) return;
        try {
            const res = await axios.post(`/studio/${tenantId}/projects/${projectId}/epic-attributes`, {
                type: 'priority',
                label: customLabel.trim(),
                color: customColor,
            });
            const newPri = res.data;
            onUpdate(epic.id, { priority_id: newPri.id }, { type: 'priority', data: newPri });
            onClose();
            await axios.patch(`/studio/${tenantId}/projects/${projectId}/epics/${epic.id}`, { priority_id: newPri.id });
        } catch (e) {
            console.error('Failed to add custom priority', e);
        }
    };

    return (
        <PortaledPopover isOpen={true} onClose={onClose} triggerRef={triggerRef} className="w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 text-xs font-bold text-gray-500 uppercase">Select Priority</div>
            <div className="max-h-48 overflow-y-auto space-y-1">
                {priorities.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        className="w-full rounded px-2 py-1 text-left text-xs font-medium hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.label}
                    </button>
                ))}
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-slate-800">
                <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Add Custom Priority</div>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        className="h-6 w-6 cursor-pointer border-0 p-0"
                    />
                    <input
                        type="text"
                        placeholder="New priority name"
                        value={customLabel}
                        onChange={e => setCustomLabel(e.target.value)}
                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <button onClick={handleAddCustom} className="rounded bg-brand px-2 py-1 text-xs font-bold text-white hover:bg-brand-light">Add</button>
                </div>
            </div>
        </PortaledPopover>
    );
}

function ProductRequirementsModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Product Requirements</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
                </div>
                <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                    No product requirements document attached yet.
                </div>
            </div>
        </div>
    );
}

function EpicRow({ epic, phases, priorities, onUpdateEpic, onEditEpic, projectId, tenantId, projectStartDate }) {
    const [openEditor, setOpenEditor] = useState(null);
    const phaseRef = useRef(null);
    const priorityRef = useRef(null);

    const phase = phases.find(p => p.id === epic.phase_id);
    const priority = priorities.find(p => p.id === epic.priority_id);
    
    let minEs = null;
    let maxEf = null;
    (epic.tasks || []).forEach(t => {
        if (t.es !== null && (minEs === null || t.es < minEs)) minEs = t.es;
        if (t.ef !== null && (maxEf === null || t.ef > maxEf)) maxEf = t.ef;
    });
    
    const startStr = minEs !== null && projectStartDate ? deriveCalendarDate(projectStartDate, minEs) : null;
    const endStr = maxEf !== null && projectStartDate ? deriveCalendarDate(projectStartDate, maxEf) : null;
    let timelineContent = <span className="text-slate-400">TBD</span>;
    if (startStr || endStr) {
        timelineContent = <span className="text-slate-600 dark:text-slate-300 font-medium">{startStr || 'TBD'} – {endStr || 'TBD'}</span>;
    }

    const totalTasks = epic.tasks ? epic.tasks.length : 0;
    let doneCount = 0;
    if (totalTasks > 0) {
        epic.tasks.forEach(task => {
            if (task.status === 'completed') doneCount++;
        });
    }
    const donePct = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;

    const renderPriorityIcon = (label) => {
        const lower = (label || '').toLowerCase();
        if (lower.includes('critical')) return <ChevronsUp className="w-3.5 h-3.5 text-rose-500" />;
        if (lower.includes('high') || lower.includes('must have')) return <ChevronUp className="w-3.5 h-3.5 text-amber-500" />;
        if (lower.includes('low')) return <ChevronDown className="w-3.5 h-3.5 text-slate-400" />;
        return <Minus className="w-3.5 h-3.5 text-slate-400" />;
    };

    const renderPhaseIcon = (label) => {
        const lower = (label || '').toLowerCase();
        if (lower.includes('done') || lower.includes('completed')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
        if (lower.includes('wip') || lower.includes('progress')) return <CircleDot className="w-3.5 h-3.5 text-brand" />;
        return <Circle className="w-3.5 h-3.5 text-slate-400" />;
    };

    return (
        <div 
            onClick={() => onEditEpic(epic)}
            className="group grid grid-cols-[minmax(300px,2fr)_160px_140px_120px_140px_180px_40px] items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
        >
            <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="font-mono text-xs text-slate-400 shrink-0 group-hover:text-slate-500 transition-colors">EPIC-{epic.id}</span>
                <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand transition-colors">{epic.name}</span>
            </div>
            
            <div className="text-xs">
                {timelineContent}
            </div>
            
            <div onClick={(e) => e.stopPropagation()}>
                <button
                    ref={phaseRef}
                    onClick={() => setOpenEditor('phase')}
                    className="flex items-center gap-1.5 w-full truncate rounded py-1 pr-2 text-xs font-semibold transition-opacity hover:opacity-80 text-left text-slate-700 dark:text-slate-300"
                >
                    {renderPhaseIcon(phase?.label)}
                    <span className="truncate">{phase?.label || 'Unassigned'}</span>
                </button>
                {openEditor === 'phase' && (
                    <InlinePhaseEditor epic={epic} phases={phases} onUpdate={onUpdateEpic} onClose={() => setOpenEditor(null)} projectId={projectId} tenantId={tenantId} triggerRef={phaseRef} />
                )}
            </div>
            
            <div onClick={(e) => e.stopPropagation()}>
                <button
                    ref={priorityRef}
                    onClick={() => setOpenEditor('priority')}
                    className="flex items-center gap-1.5 w-full truncate rounded py-1 pr-2 text-xs font-semibold transition-opacity hover:opacity-80 text-left text-slate-700 dark:text-slate-300"
                >
                    {renderPriorityIcon(priority?.label)}
                    <span className="truncate">{priority?.label || 'Unassigned'}</span>
                </button>
                {openEditor === 'priority' && (
                    <InlinePriorityEditor epic={epic} priorities={priorities} onUpdate={onUpdateEpic} onClose={() => setOpenEditor(null)} projectId={projectId} tenantId={tenantId} triggerRef={priorityRef} />
                )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>{epic.tasks_count || 0} tasks</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span>{epic.tasks_sum_story_points || 0} SP</span>
            </div>
            
            <PortaledTooltip
                offsetY={8}
                className="w-full"
                tooltipContent={
                    totalTasks > 0 && (
                        <div className="flex flex-col rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-xl whitespace-nowrap dark:bg-slate-800 border border-slate-700">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand"></span> {doneCount} Done ({Math.round(donePct)}%)</div>
                        </div>
                    )
                }
            >
                <div className="flex items-center w-full gap-3">
                    <div className="flex-1 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                        {donePct > 0 && <div style={{ width: `${donePct}%` }} className="bg-brand transition-all duration-300" />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-8">{Math.round(donePct)}%</span>
                </div>
            </PortaledTooltip>
            
            <div className="flex justify-end pr-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <MoreVertical className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}

function EpicTable({ epics, phases, priorities, onUpdateEpic, onEditEpic, projectId, tenantId, projectStartDate }) {
    
    return (
        <div className="min-w-[1000px] border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-2 mx-4">
            <div className="grid grid-cols-[minmax(300px,2fr)_160px_140px_120px_140px_180px_40px] gap-4 border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <span>Epic Name</span>
                <span>Planned Timeline</span>
                <span>Phase</span>
                <span>Priority</span>
                <span>Scope</span>
                <span>Progress</span>
                <span className="text-right"></span>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {epics.map(epic => (
                    <EpicRow 
                        key={epic.id} 
                        epic={epic} 
                        phases={phases} 
                        priorities={priorities} 
                        onUpdateEpic={onUpdateEpic} 
                        onEditEpic={onEditEpic}
                        projectId={projectId} 
                        tenantId={tenantId} 
                        projectStartDate={projectStartDate} 
                    />
                ))}
                
                {!epics.length && (
                    <div className="py-12 text-center text-sm text-slate-400">
                        No epics found in this group.
                    </div>
                )}
            </div>
        </div>
    );
}

function EpicGroup({ title, epics, defaultOpen = true, phases, priorities, onUpdateEpic, onEditEpic, projectId, tenantId, projectStartDate, colorAccent }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div 
                className="flex cursor-pointer items-center gap-3 bg-gray-50 px-4 py-3 dark:bg-slate-900/50" 
                onClick={() => setIsOpen(!isOpen)}
                style={{ borderLeft: `4px solid ${colorAccent}` }}
            >
                <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <h2 className="text-sm font-extrabold text-gray-800 dark:text-slate-200">{title}</h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600 dark:bg-slate-800 dark:text-slate-400">
                    {epics.length} epics
                </span>
            </div>
            
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {isOpen && (
                    <div className="overflow-x-auto">
                        <EpicTable 
                            epics={epics} 
                            phases={phases} 
                            priorities={priorities} 
                            onUpdateEpic={onUpdateEpic} 
                            onEditEpic={onEditEpic}
                            projectId={projectId} 
                            tenantId={tenantId} 
                            projectStartDate={projectStartDate}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

export default function EpicBreakdown({ epics: initialEpics, epicGroups: initialGroups, epicPhases: initialPhases, epicPriorities: initialPriorities, project, tenantId }) {
    const [epics, setEpics] = useState(initialEpics || []);
    const [phases, setPhases] = useState(initialPhases || []);
    const [priorities, setPriorities] = useState(initialPriorities || []);
    
    useEffect(() => {
        if (initialEpics) setEpics(initialEpics);
    }, [initialEpics]);

    useEffect(() => {
        if (initialPhases) setPhases(initialPhases);
    }, [initialPhases]);

    useEffect(() => {
        if (initialPriorities) setPriorities(initialPriorities);
    }, [initialPriorities]);

    // Support epicGroups from Inertia props
    const epicGroups = initialGroups || [];

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
    const [epicToEdit, setEpicToEdit] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState(null);

    const onUpdateEpic = (epicId, updates, newAttribute = null) => {
        setEpics(current => current.map(e => e.id === epicId ? { ...e, ...updates } : e));
        if (newAttribute) {
            if (newAttribute.type === 'phase') {
                setPhases(current => {
                    if (current.find(p => p.id === newAttribute.data.id)) return current;
                    return [...current, newAttribute.data];
                });
            } else if (newAttribute.type === 'priority') {
                setPriorities(current => {
                    if (current.find(p => p.id === newAttribute.data.id)) return current;
                    return [...current, newAttribute.data];
                });
            }
        }
    };

    const handleCreateGroup = (data) => {
        setIsSubmitting(true);
        setValidationErrors(null);
        router.post(`/studio/${tenantId}/projects/${project.id}/epic-groups`, data, {
            onSuccess: () => {
                setIsGroupModalOpen(false);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                setValidationErrors(errors);
                setIsSubmitting(false);
            },
        });
    };

    const handleSubmitEpic = (data) => {
        setIsSubmitting(true);
        setValidationErrors(null);
        
        if (epicToEdit) {
            router.patch(`/studio/${tenantId}/projects/${project.id}/epics/${epicToEdit.id}`, data, {
                onSuccess: () => {
                    setIsEpicModalOpen(false);
                    setIsSubmitting(false);
                    setEpicToEdit(null);
                },
                onError: (errors) => {
                    setValidationErrors(errors);
                    setIsSubmitting(false);
                },
            });
        } else {
            router.post(`/studio/${tenantId}/projects/${project.id}/epics`, data, {
                onSuccess: () => {
                    setIsEpicModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setValidationErrors(errors);
                    setIsSubmitting(false);
                },
            });
        }
    };

    // If epicGroups prop wasn't provided (e.g. legacy), fallback to default layout
    if (epicGroups.length === 0) {
        const backlogEpics = [];
        const activeEpics = [];

        epics.forEach(epic => {
            const phase = phases.find(p => p.id === epic.phase_id);
            if (phase && phase.label === 'Backlog') {
                backlogEpics.push(epic);
            } else {
                activeEpics.push(epic);
            }
        });

        return (
            <div className="overflow-auto p-6">
                <EpicGroup 
                    title="Epics" 
                    epics={activeEpics} 
                    phases={phases} 
                    priorities={priorities} 
                    onUpdateEpic={onUpdateEpic} 
                    onEditEpic={(epic) => { setEpicToEdit(epic); setIsEpicModalOpen(true); }}
                    projectId={project.id} 
                    tenantId={tenantId}
                    projectStartDate={project.start_date}
                    colorAccent="#3b82f6"
                />
                
                <EpicGroup 
                    title="Epics Backlog" 
                    epics={backlogEpics} 
                    phases={phases} 
                    priorities={priorities} 
                    onUpdateEpic={onUpdateEpic} 
                    onEditEpic={(epic) => { setEpicToEdit(epic); setIsEpicModalOpen(true); }}
                    projectId={project.id} 
                    tenantId={tenantId}
                    projectStartDate={project.start_date}
                    colorAccent="#6b7280"
                />
            </div>
        );
    }

    return (
        <div className="overflow-auto p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Project Horizons</h1>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsGroupModalOpen(true)}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                        Add New Group
                    </button>
                    <button 
                        onClick={() => { setEpicToEdit(null); setIsEpicModalOpen(true); }}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
                    >
                        New Epic
                    </button>
                </div>
            </div>

            {epicGroups.map(group => {
                const groupEpics = epics.filter(e => e.epic_group_id === group.id);
                // Cycle through colors based on display_order
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                const colorAccent = group.is_default ? '#6b7280' : colors[(group.display_order || 0) % colors.length];

                return (
                    <EpicGroup 
                        key={group.id}
                        title={group.name} 
                        epics={groupEpics} 
                        phases={phases} 
                        priorities={priorities} 
                        onUpdateEpic={onUpdateEpic} 
                        onEditEpic={(epic) => { setEpicToEdit(epic); setIsEpicModalOpen(true); }}
                        projectId={project.id} 
                        tenantId={tenantId}
                        projectStartDate={project.start_date}
                        colorAccent={colorAccent}
                    />
                );
            })}

            <CreateEpicGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onSubmit={handleCreateGroup}
                isSubmitting={isSubmitting}
                validationErrors={validationErrors}
            />

            <CreateEpicModal
                isOpen={isEpicModalOpen}
                onClose={() => { setIsEpicModalOpen(false); setEpicToEdit(null); }}
                onSubmit={handleSubmitEpic}
                isSubmitting={isSubmitting}
                validationErrors={validationErrors}
                epicGroups={epicGroups}
                phases={phases}
                priorities={priorities}
                epic={epicToEdit}
            />
        </div>
    );
}
