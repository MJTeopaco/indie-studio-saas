import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, FileText, Edit2, CalendarDays, ExternalLink, Search, Plus, PlayCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { router, usePage } from '@inertiajs/react';

function getContrastColor(hexColor) {
    if (!hexColor) return '#111827';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111827' : '#ffffff';
}

const SPRINT_STATUSES = [
    { value: 'ready_to_start', label: 'Ready to start', color: '#3b82f6' }, // Blue
    { value: 'in_progress', label: 'In progress', color: '#f97316' },      // Orange
    { value: 'waiting_for_review', label: 'Waiting for review', color: '#d97706' }, // Light brown
    { value: 'pending_deploy', label: 'Pending deploy', color: '#eab308' },// Yellow
    { value: 'done', label: 'Done', color: '#10b981' },                    // Bright green
    { value: 'stuck', label: 'Stuck', color: '#ef4444' },                  // Red
];

const SPRINT_PRIORITIES = [
    { value: 'critical', label: 'Critical', color: '#ef4444' }, // Red
    { value: 'high', label: 'High', color: '#eab308' },         // Yellow
    { value: 'medium', label: 'Medium', color: '#3b82f6' },     // Blue
    { value: 'low', label: 'Low', color: '#10b981' },           // Green
];

const TASK_TYPES = [
    { value: 'Feature', label: 'Feature', color: '#10b981' },
    { value: 'Bug', label: 'Bug', color: '#ef4444' },
    { value: 'Research', label: 'Research', color: '#8b5cf6' },
    { value: 'DevOps', label: 'DevOps', color: '#3b82f6' },
    { value: 'Testing', label: 'Testing', color: '#f59e0b' },
    { value: 'Documentation', label: 'Documentation', color: '#6b7280' },
    { value: 'Refactor', label: 'Refactor', color: '#ec4899' },
    { value: 'Quality', label: 'Quality', color: '#f472b6' } // Added from image
];

function InlineSelectEditor({ options, currentValue, onSelect, onClose }) {
    const popoverRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) onClose();
        }
        function handleEscape(event) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div ref={popoverRef} className="absolute z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="max-h-48 overflow-y-auto space-y-1">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => { onSelect(opt.value); onClose(); }}
                        className={`w-full rounded px-2 py-1.5 text-left text-xs font-bold transition-colors flex items-center gap-2 hover:opacity-80`}
                        style={{ backgroundColor: opt.color, color: getContrastColor(opt.color) }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function InlineTextEditor({ initialValue, onSave, onClose, type = 'text', placeholder = '' }) {
    const [val, setVal] = useState(initialValue || '');
    const popoverRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) onClose();
        }
        function handleEscape(event) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div ref={popoverRef} className="absolute z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
                <input
                    type={type}
                    autoFocus
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:border-brand"
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            onSave(val);
                            onClose();
                        }
                    }}
                />
                <button onClick={() => { onSave(val); onClose(); }} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark">
                    Save
                </button>
            </div>
        </div>
    );
}

function EpicLinkModal({ isOpen, onClose, epics, currentEpicId, onSelect }) {
    const [search, setSearch] = useState('');
    
    if (!isOpen) return null;

    const filtered = epics.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-900 border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">Link to Epic</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>
                </div>
                
                <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        autoFocus
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800 outline-none focus:border-brand"
                        placeholder="Search epics..."
                    />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 ${currentEpicId === null ? 'bg-brand/10 text-brand' : 'text-gray-600 dark:text-slate-400'}`}
                    >
                        None (Unlink)
                    </button>
                    {filtered.map(epic => (
                        <button
                            key={epic.id}
                            onClick={() => { onSelect(epic.id); onClose(); }}
                            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 ${currentEpicId === epic.id ? 'bg-brand/10 text-brand' : 'text-gray-700 dark:text-slate-300'}`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: epic.color || '#9ca3af' }} />
                            {epic.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Minimal implementation of X since it was not imported
const X = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

// TaskAssignee component extracted from Show.jsx for reuse
function SprintTaskAssignee({ task, onFindFit, canManage }) {
    const assignees = Array.isArray(task.assignees) ? task.assignees : (task.assignee ? [task.assignee] : []);

    if (!assignees.length) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800/50">
                    <Search className="h-3 w-3" />
                </div>
                {canManage && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onFindFit(task); }}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand hover:text-brand-dark transition-colors"
                    >
                        Assign Member
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex -space-x-1.5 overflow-hidden">
            {assignees.map((assignee, idx) => (
                <div key={idx} className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-indigo-500 text-[10px] font-bold text-white shadow-sm dark:border-slate-900" title={assignee.name}>
                    {assignee.name.charAt(0).toUpperCase()}
                </div>
            ))}
            {canManage && (
                <button onClick={(e) => { e.stopPropagation(); onFindFit(task); }} className="relative z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] text-gray-500 hover:bg-gray-200 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" title="Manage assignment">
                    <Plus className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

function SprintTable({ tasks, epics, onUpdateTask, onFindFit, canManage, projectId, tenantId, currentUserId, currentSprintStatus }) {
    const [openPopover, setOpenPopover] = useState({ taskId: null, field: null });
    const [openEpicModal, setOpenEpicModal] = useState(null);

    // Close popovers if sprint status changes (mid-edit concurrent flip)
    useEffect(() => {
        setOpenPopover({ taskId: null, field: null });
    }, [currentSprintStatus]);

    const canEditTask = (task) => {
        if (canManage) return true;
        const assignees = Array.isArray(task.assignees) ? task.assignees : (task.assignee ? [task.assignee] : []);
        return assignees.some(a => Number(a.id) === Number(currentUserId));
    };

    return (
        <div className="min-w-[1200px] border-t border-gray-100 dark:border-slate-800">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr_0.6fr_1fr] gap-4 border-b border-gray-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:border-slate-800">
                <span>Task</span>
                <span>Owner</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Type</span>
                <span>Estimate SP</span>
                <span>Actual SP</span>
                <span>GitHub Link</span>
                <span>Task ID</span>
                <span>Epic</span>
            </div>
            
            {tasks.map(task => {
                const sStatus = SPRINT_STATUSES.find(s => s.value === (task.sprint_status || 'ready_to_start')) || SPRINT_STATUSES[0];
                const sPriority = SPRINT_PRIORITIES.find(p => p.value === (task.sprint_priority || 'medium')) || SPRINT_PRIORITIES[2];
                const typeObj = TASK_TYPES.find(t => t.value === task.task_classification) || TASK_TYPES.find(t => t.value === 'Feature');
                const isEditable = canEditTask(task);
                const isDone = (task.sprint_status === 'done');

                return (
                    <div key={task.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr_0.6fr_1fr] items-center gap-4 border-b border-gray-100 px-4 py-2.5 last:border-0 hover:bg-gray-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30">
                        {/* Task Title */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100" title={task.title}>{task.title}</span>
                        </div>
                        
                        {/* Owner */}
                        <div>
                            <SprintTaskAssignee task={task} onFindFit={onFindFit} canManage={canManage} />
                        </div>
                        
                        {/* Status */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); isEditable && setOpenPopover({ taskId: task.id, field: 'status' }); }}
                                className={`w-full truncate rounded px-2 py-1.5 text-xs font-bold text-center transition-opacity ${isEditable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                                style={{ backgroundColor: sStatus.color, color: getContrastColor(sStatus.color) }}
                            >
                                {sStatus.label}
                            </button>
                            {openPopover.taskId === task.id && openPopover.field === 'status' && (
                                <InlineSelectEditor 
                                    options={SPRINT_STATUSES} 
                                    currentValue={sStatus.value} 
                                    onSelect={(val) => onUpdateTask(task.id, { sprint_status: val })} 
                                    onClose={() => setOpenPopover({ taskId: null, field: null })} 
                                />
                            )}
                        </div>
                        
                        {/* Priority */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); isEditable && setOpenPopover({ taskId: task.id, field: 'priority' }); }}
                                className={`w-full truncate rounded px-2 py-1.5 text-xs font-bold text-center transition-opacity ${isEditable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                                style={{ backgroundColor: sPriority.color, color: getContrastColor(sPriority.color) }}
                            >
                                {sPriority.label}
                            </button>
                            {openPopover.taskId === task.id && openPopover.field === 'priority' && (
                                <InlineSelectEditor 
                                    options={SPRINT_PRIORITIES} 
                                    currentValue={sPriority.value} 
                                    onSelect={(val) => onUpdateTask(task.id, { sprint_priority: val })} 
                                    onClose={() => setOpenPopover({ taskId: null, field: null })} 
                                />
                            )}
                        </div>

                        {/* Type */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); isEditable && setOpenPopover({ taskId: task.id, field: 'type' }); }}
                                className={`w-full truncate rounded px-2 py-1.5 text-xs font-bold text-center transition-opacity ${isEditable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                                style={{ backgroundColor: typeObj?.color || '#6b7280', color: getContrastColor(typeObj?.color || '#6b7280') }}
                            >
                                {task.task_classification || 'Unclassified'}
                            </button>
                            {openPopover.taskId === task.id && openPopover.field === 'type' && (
                                <InlineSelectEditor 
                                    options={TASK_TYPES} 
                                    currentValue={task.task_classification} 
                                    onSelect={(val) => onUpdateTask(task.id, { task_classification: val })} 
                                    onClose={() => setOpenPopover({ taskId: null, field: null })} 
                                />
                            )}
                        </div>

                        {/* Estimate SP */}
                        <div className="relative text-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); canManage && setOpenPopover({ taskId: task.id, field: 'est_sp' }); }}
                                className={`w-full rounded px-2 py-1 font-mono text-xs ${canManage ? 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300' : 'text-gray-500 cursor-default'}`}
                            >
                                {task.story_points ? `${task.story_points} SP` : '-'}
                            </button>
                            {openPopover.taskId === task.id && openPopover.field === 'est_sp' && (
                                <InlineTextEditor 
                                    type="number"
                                    initialValue={task.story_points} 
                                    onSave={(val) => onUpdateTask(task.id, { story_points: val ? parseInt(val) : null })} 
                                    onClose={() => setOpenPopover({ taskId: null, field: null })} 
                                />
                            )}
                        </div>

                        {/* Actual SP */}
                        <div className="relative text-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); isEditable && isDone && setOpenPopover({ taskId: task.id, field: 'actual_sp' }); }}
                                disabled={!isDone}
                                className={`w-full rounded px-2 py-1 font-mono text-xs ${!isDone ? 'opacity-30 cursor-not-allowed' : (isEditable ? 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-900 dark:text-slate-100 font-bold' : 'text-gray-700 dark:text-slate-300')}`}
                                title={!isDone ? "Task must be 'Done' to set Actual SP" : ""}
                            >
                                {task.actual_story_points ? `${task.actual_story_points} SP` : '-'}
                            </button>
                            {openPopover.taskId === task.id && openPopover.field === 'actual_sp' && (
                                <InlineTextEditor 
                                    type="number"
                                    initialValue={task.actual_story_points} 
                                    onSave={(val) => onUpdateTask(task.id, { actual_story_points: val ? parseInt(val) : null })} 
                                    onClose={() => setOpenPopover({ taskId: null, field: null })} 
                                />
                            )}
                        </div>

                        {/* GitHub Link */}
                        <div className="relative flex justify-center items-center group">
                            {task.github_link ? (
                                <a href={task.github_link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand transition-colors p-1" onClick={e => e.stopPropagation()}>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            ) : (
                                <span className="text-gray-300 dark:text-slate-700">-</span>
                            )}
                            {isEditable && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setOpenPopover({ taskId: task.id, field: 'github' }); }}
                                    className="absolute right-0 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 transition-all bg-white dark:bg-slate-900 rounded-full shadow-sm"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            )}
                            {openPopover.taskId === task.id && openPopover.field === 'github' && (
                                <InlineTextEditor 
                                    type="url"
                                    placeholder="https://github.com/..."
                                    initialValue={task.github_link} 
                                    onSave={(val) => onUpdateTask(task.id, { github_link: val })} 
                                    onClose={() => setOpenPopover({ taskId: null, field: null })} 
                                />
                            )}
                        </div>

                        {/* Task ID */}
                        <div>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                                TALP-{task.id}
                            </span>
                        </div>

                        {/* Epic */}
                        <div>
                            {task.epic ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); canManage && setOpenEpicModal(task.id); }}
                                    className={`truncate max-w-[120px] rounded-full px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1.5 border transition-colors ${canManage ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800' : 'cursor-default'}`}
                                    style={{ borderColor: task.epic.color || '#e5e7eb', color: task.epic.color || '#6b7280' }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.epic.color || '#9ca3af' }} />
                                    {task.epic.name}
                                </button>
                            ) : (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); canManage && setOpenEpicModal(task.id); }}
                                    className={`text-[10px] font-bold text-gray-400 border border-dashed border-gray-300 dark:border-slate-700 rounded-full px-2 py-0.5 ${canManage ? 'hover:border-gray-400 hover:text-gray-500 cursor-pointer' : 'cursor-default'}`}
                                >
                                    + Link Epic
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {!tasks.length && (
                <div className="py-8 text-center text-xs text-gray-400">No tasks in this group.</div>
            )}

            <EpicLinkModal 
                isOpen={openEpicModal !== null} 
                onClose={() => setOpenEpicModal(null)}
                epics={epics}
                currentEpicId={tasks.find(t => t.id === openEpicModal)?.epic_id || null}
                onSelect={(epicId) => onUpdateTask(openEpicModal, { epic_id: epicId })}
            />
        </div>
    );
}

function SprintGroup({ sprint, tasks, epics, defaultOpen = true, onUpdateTask, onUpdateSprintStatus, onFindFit, canManage, projectId, tenantId, currentUserId }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const isCompleted = sprint.status === 'completed';
    const isActive = sprint.status === 'active';

    const renderHeaderStatus = () => {
        if (isCompleted) return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
        if (isActive) return <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> Active Sprint</span>;
        return null; // Planned
    };

    return (
        <section className={`mb-6 overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 transition-colors ${isActive ? 'border-brand shadow-sm shadow-brand/10' : 'border-gray-200 dark:border-slate-800'}`}>
            <div 
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${isActive ? 'bg-brand/5 dark:bg-brand/10' : 'bg-gray-50 dark:bg-slate-900/50'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <button className={`hover:text-gray-700 transition-colors ${isActive ? 'text-brand' : 'text-gray-400 dark:text-gray-500'}`}>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <h2 className={`text-sm font-extrabold ${isActive ? 'text-brand-dark dark:text-brand-light' : 'text-gray-800 dark:text-slate-200'}`}>
                    {sprint.name}
                </h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600 dark:bg-slate-800 dark:text-slate-400">
                    {tasks.length} tasks
                </span>

                <div className="ml-auto flex items-center gap-4" onClick={e => e.stopPropagation()}>
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-slate-400 hover:dark:text-slate-200" title="Change dates (Manager only)">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {sprint.start_date && sprint.end_date ? (
                            <span>{new Date(sprint.start_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})} - {new Date(sprint.end_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
                        ) : 'Set Dates'}
                    </button>
                    
                    {renderHeaderStatus()}

                    {canManage && !isCompleted && (
                        <button 
                            onClick={() => onUpdateSprintStatus(sprint.id, isActive ? 'completed' : 'active')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${isActive ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            {isActive ? <><CheckCircle2 className="w-3.5 h-3.5" /> Complete Sprint</> : <><PlayCircle className="w-3.5 h-3.5 text-brand" /> Start Sprint</>}
                        </button>
                    )}
                </div>
            </div>
            
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {isOpen && (
                    <div className="overflow-x-auto">
                        <SprintTable 
                            tasks={tasks} 
                            epics={epics} 
                            onUpdateTask={onUpdateTask}
                            onFindFit={onFindFit}
                            canManage={canManage}
                            projectId={projectId}
                            tenantId={tenantId}
                            currentUserId={currentUserId}
                            currentSprintStatus={sprint.status}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

function BacklogGroup({ tasks, epics, defaultOpen = true, onUpdateTask, onFindFit, canManage, projectId, tenantId, currentUserId }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 opacity-80 hover:opacity-100 transition-opacity">
            <div 
                className="flex cursor-pointer items-center gap-3 bg-gray-50 px-4 py-3 dark:bg-slate-900/50" 
                onClick={() => setIsOpen(!isOpen)}
            >
                <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <h2 className="text-sm font-extrabold text-gray-800 dark:text-slate-200">Backlog</h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600 dark:bg-slate-800 dark:text-slate-400">
                    {tasks.length} tasks
                </span>
            </div>
            
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {isOpen && (
                    <div className="overflow-x-auto">
                        <SprintTable 
                            tasks={tasks} 
                            epics={epics} 
                            onUpdateTask={onUpdateTask}
                            onFindFit={onFindFit}
                            canManage={canManage}
                            projectId={projectId}
                            tenantId={tenantId}
                            currentUserId={currentUserId}
                            currentSprintStatus={null}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

export default function SprintBreakdown({ sprints: initialSprints, backlogTasks: initialBacklog, epics, project, tenantId, canManage, onNewTask, onFindFit }) {
    const [sprints, setSprints] = useState(initialSprints || []);
    const [backlogTasks, setBacklogTasks] = useState(initialBacklog || []);
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    // Optimistic background task update
    const handleUpdateTaskInline = async (taskId, updates) => {
        // Optimistic update
        const applyUpdates = (tasks) => tasks.map(t => {
            if (t.id === taskId) {
                const updated = { ...t, ...updates };
                // If epic changed, find and attach the epic object
                if ('epic_id' in updates) {
                    updated.epic = updates.epic_id ? epics.find(e => e.id === updates.epic_id) : null;
                }
                return updated;
            }
            return t;
        });

        setSprints(current => current.map(s => ({ ...s, tasks: applyUpdates(s.tasks) })));
        setBacklogTasks(current => applyUpdates(current));

        try {
            await axios.patch(route('tenant.projects.tasks.inline-update', { tenant: tenantId, project: project.id, task: taskId }), updates);
        } catch (e) {
            console.error('Failed to update task inline', e);
            // Revert changes could be implemented here if needed by keeping original state copy
            alert(e.response?.data?.message || 'Failed to update task.');
        }
    };

    // Optimistic background sprint status update
    const handleUpdateSprintStatus = async (sprintId, newStatus) => {
        setSprints(current => current.map(s => {
            if (s.id === sprintId) return { ...s, status: newStatus };
            if (newStatus === 'active' && s.status === 'active') return { ...s, status: 'completed' };
            return s;
        }));

        try {
            await axios.patch(route('tenant.projects.sprints.update', { tenant: tenantId, project: project.id, sprint: sprintId }), { status: newStatus });
        } catch (e) {
            console.error('Failed to update sprint', e);
            router.reload(); // Revert on failure
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onNewTask}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-dark"
                    >
                        <Plus className="h-4 w-4" />
                        New Task
                    </button>
                    <button 
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm opacity-50 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                        Create Sprint
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input type="text" placeholder="Search tasks..." className="w-64 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-800" />
                    </div>
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-950">
                {sprints.map(sprint => (
                    <SprintGroup 
                        key={sprint.id}
                        sprint={sprint}
                        tasks={sprint.tasks || []}
                        epics={epics}
                        onUpdateTask={handleUpdateTaskInline}
                        onUpdateSprintStatus={handleUpdateSprintStatus}
                        onFindFit={onFindFit}
                        canManage={canManage}
                        projectId={project.id}
                        tenantId={tenantId}
                        currentUserId={currentUserId}
                    />
                ))}

                <BacklogGroup 
                    tasks={backlogTasks}
                    epics={epics}
                    onUpdateTask={handleUpdateTaskInline}
                    onFindFit={onFindFit}
                    canManage={canManage}
                    projectId={project.id}
                    tenantId={tenantId}
                    currentUserId={currentUserId}
                />
            </div>
        </div>
    );
}
