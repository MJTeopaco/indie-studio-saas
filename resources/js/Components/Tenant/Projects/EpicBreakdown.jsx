import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, FileText, Edit2 } from 'lucide-react';
import PortaledPopover from '@/Components/UI/PortaledPopover';
import PortaledTooltip from '@/Components/UI/PortaledTooltip';
import axios from 'axios';

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

function EpicRow({ epic, phases, priorities, onUpdateEpic, projectId, tenantId, projectStartDate, setOpenPrdModal }) {
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
    
    const startStr = minEs !== null && projectStartDate ? deriveCalendarDate(projectStartDate, minEs) : '—';
    const endStr = maxEf !== null && projectStartDate ? deriveCalendarDate(projectStartDate, maxEf) : '—';
    const timelineStr = (startStr !== '—' || endStr !== '—') ? `${startStr} – ${endStr}` : '—';

    const totalTasks = epic.tasks ? epic.tasks.length : 0;
    let doneCount = 0;
    let wipCount = 0;
    let todoCount = 0;
    if (totalTasks > 0) {
        epic.tasks.forEach(task => {
            if (task.status === 'completed') doneCount++;
            else if (task.status === 'in_progress' || task.status === 'review') wipCount++;
            else todoCount++;
        });
    }
    const donePct = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;
    const wipPct = totalTasks > 0 ? (wipCount / totalTasks) * 100 : 0;
    const todoPct = totalTasks > 0 ? (todoCount / totalTasks) * 100 : 0;

    return (
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto_1fr_1fr_1.5fr_auto_auto] items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30">
            <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: epic.color || '#9ca3af' }} />
                <span className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">{epic.name}</span>
            </div>
            
            <div className="text-xs text-gray-600 dark:text-slate-300">
                {timelineStr}
            </div>
            
            <div>
                <button
                    ref={phaseRef}
                    onClick={(e) => { e.stopPropagation(); setOpenEditor('phase'); }}
                    className="w-full truncate rounded px-2 py-1 text-xs font-bold transition-opacity hover:opacity-80 text-left"
                    style={{ backgroundColor: phase?.color || '#e5e7eb', color: getContrastColor(phase?.color || '#e5e7eb') }}
                >
                    {phase?.label || 'Unassigned'}
                </button>
                {openEditor === 'phase' && (
                    <InlinePhaseEditor epic={epic} phases={phases} onUpdate={onUpdateEpic} onClose={() => setOpenEditor(null)} projectId={projectId} tenantId={tenantId} triggerRef={phaseRef} />
                )}
            </div>
            
            <div>
                <button
                    ref={priorityRef}
                    onClick={(e) => { e.stopPropagation(); setOpenEditor('priority'); }}
                    className="w-full truncate rounded px-2 py-1 text-xs font-bold transition-opacity hover:opacity-80 text-left"
                    style={{ backgroundColor: priority?.color || '#e5e7eb', color: getContrastColor(priority?.color || '#e5e7eb') }}
                >
                    {priority?.label || 'Unassigned'}
                </button>
                {openEditor === 'priority' && (
                    <InlinePriorityEditor epic={epic} priorities={priorities} onUpdate={onUpdateEpic} onClose={() => setOpenEditor(null)} projectId={projectId} tenantId={tenantId} triggerRef={priorityRef} />
                )}
            </div>
            
            <div className="flex justify-center">
                <button onClick={() => setOpenPrdModal(true)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-200">
                    <FileText className="h-4 w-4" />
                </button>
            </div>
            
            <PortaledTooltip 
                offsetY={4}
                tooltipContent={
                    epic.tasks && epic.tasks.length > 0 && (
                        <div className="w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {epic.tasks.map(t => (
                                    <div key={t.id} className="flex flex-col truncate text-xs text-gray-700 dark:text-slate-300">
                                        <span>#{t.id} {t.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
            >
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300 cursor-pointer">
                    {epic.tasks_count || 0} tasks
                </span>
            </PortaledTooltip>
            
            <div className="font-mono text-xs text-gray-600 dark:text-slate-300">
                {epic.tasks_sum_story_points != null
                    ? <span className="inline-flex items-center gap-1 font-bold">
                          {epic.tasks_sum_story_points} <span className="text-[10px] text-gray-400 font-normal">SP</span>
                      </span>
                    : <span className="text-gray-400 italic text-[11px]">—</span>}
            </div>
            
            <PortaledTooltip
                offsetY={8}
                className="w-full"
                tooltipContent={
                    totalTasks > 0 && (
                        <div className="flex flex-col rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl whitespace-nowrap dark:bg-slate-800 border border-gray-700">
                            <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {doneCount} Done ({Math.round(donePct)}%)</div>
                            <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> {wipCount} Dev WIP ({Math.round(wipPct)}%)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span> {todoCount} Ready ({Math.round(todoPct)}%)</div>
                        </div>
                    )
                }
            >
                <div className="flex items-center w-full">
                    {totalTasks > 0 ? (
                        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                            {donePct > 0 && <div style={{ width: `${donePct}%` }} className="bg-emerald-500 hover:opacity-80 transition-opacity" />}
                            {wipPct > 0 && <div style={{ width: `${wipPct}%` }} className="bg-indigo-500 hover:opacity-80 transition-opacity" />}
                            {todoPct > 0 && <div style={{ width: `${todoPct}%` }} className="bg-slate-400 hover:opacity-80 transition-opacity" />}
                        </div>
                    ) : (
                        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800/50" />
                    )}
                </div>
            </PortaledTooltip>
            
            <div>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                    EPIC-{epic.id}
                </span>
            </div>
            
            <div className="text-center">
                <button 
                    className="flex items-center justify-center gap-1.5 w-full rounded px-2 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80 cursor-not-allowed shadow-sm bg-blue-500"
                    title="Update function coming soon"
                >
                    <Edit2 className="h-3.5 w-3.5" />
                    Update
                </button>
            </div>
        </div>
    );
}

function EpicTable({ epics, phases, priorities, onUpdateEpic, projectId, tenantId, projectStartDate }) {
    
    const [openPrdModal, setOpenPrdModal] = useState(false);

    return (
        <div className="min-w-[1000px] border-t border-gray-100 dark:border-slate-800">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto_1fr_1fr_1.5fr_auto_auto] gap-4 border-b border-gray-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:border-slate-800">
                <span>Epic Name</span>
                <span>Planned Timeline</span>
                <span>Phase</span>
                <span>Priority</span>
                <span>PRD</span>
                <span>Tasks</span>
                <span>Estimated Effort</span>
                <span>Tasks Progress</span>
                <span>Epic ID</span>
                <span>Update</span>
            </div>
            
            {epics.map(epic => (
                <EpicRow 
                    key={epic.id} 
                    epic={epic} 
                    phases={phases} 
                    priorities={priorities} 
                    onUpdateEpic={onUpdateEpic} 
                    projectId={projectId} 
                    tenantId={tenantId} 
                    projectStartDate={projectStartDate} 
                    setOpenPrdModal={setOpenPrdModal}
                />
            ))}
            
            {!epics.length && (
                <div className="py-8 text-center text-xs text-gray-400">No epics found in this group.</div>
            )}
            
            <ProductRequirementsModal isOpen={openPrdModal} onClose={() => setOpenPrdModal(false)} />
        </div>
    );
}

function EpicGroup({ title, epics, defaultOpen = true, phases, priorities, onUpdateEpic, projectId, tenantId, projectStartDate, colorAccent }) {
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

export default function EpicBreakdown({ epics: initialEpics, epicPhases: initialPhases, epicPriorities: initialPriorities, project, tenantId }) {
    const [epics, setEpics] = useState(initialEpics || []);
    const [phases, setPhases] = useState(initialPhases || []);
    const [priorities, setPriorities] = useState(initialPriorities || []);

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
                projectId={project.id} 
                tenantId={tenantId}
                projectStartDate={project.start_date}
                colorAccent="#6b7280"
            />
        </div>
    );
}
