import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { 
    Calendar, 
    X, 
    Loader2, 
    Clock, 
    Building2, 
    Crown, 
    UserCheck, 
    ShieldAlert, 
    Send,
    Info,
    CalendarPlus,
    Activity,
    Users,
    Heart,
    Lock,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

const EMERGENCY_CATEGORIES = [
    {
        id: 'medical',
        label: 'Medical / Health Emergency',
        description: 'Sudden illness, medical procedure, or acute healthcare condition',
        icon: Activity,
        badge: 'Medical',
    },
    {
        id: 'family',
        label: 'Family & Dependent Care',
        description: 'Urgent family crisis, dependent care, or immediate family emergency',
        icon: Users,
        badge: 'Family',
    },
    {
        id: 'bereavement',
        label: 'Bereavement / Compassionate',
        description: 'Loss of an immediate family member or loved one',
        icon: Heart,
        badge: 'Compassionate',
    },
    {
        id: 'disaster',
        label: 'Disaster / Infrastructure',
        description: 'Severe weather, power grid blackout, or natural disaster',
        icon: AlertTriangle,
        badge: 'Disaster',
    },
    {
        id: 'other',
        label: 'Other Urgent Operational Emergency',
        description: 'Other unforeseen acute circumstances preventing work',
        icon: ShieldAlert,
        badge: 'Operational',
    },
];

export default function FileAbsenceModal({
    isOpen,
    onClose,
    joinedStudios = [],
    initialScope = 'all',
    initialStudioId = null,
    initialType = 'leave', // 'leave' | 'emergency'
}) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Absence Type: 'leave' | 'emergency'
    const [absenceType, setAbsenceType] = useState(initialType);

    // Shared Scope
    const [scope, setScope] = useState(initialScope);
    const [studioId, setStudioId] = useState(
        initialStudioId || (joinedStudios.length > 0 ? joinedStudios[0].id : '')
    );

    // Leave fields
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');

    // Emergency fields
    const [emergencyCategory, setEmergencyCategory] = useState('medical');
    const [confidentialNote, setConfidentialNote] = useState('');
    const [estimatedReturnDate, setEstimatedReturnDate] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setAbsenceType(initialType);
            setStartDate(todayStr);
            setEndDate('');
            setLeaveReason('');
            setEmergencyCategory('medical');
            setConfidentialNote('');
            setEstimatedReturnDate('');
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, initialType, todayStr]);

    if (!isOpen) return null;

    // Determine governance level for chosen scope/studio
    const activeStudio = scope === 'specific'
        ? (joinedStudios.find(s => String(s.id) === String(studioId)) || joinedStudios[0])
        : joinedStudios[0];
    const isOwner = Boolean(activeStudio?.is_owner || activeStudio?.role === 'owner');
    const isLeader = !isOwner && ['leader', 'manager'].includes(activeStudio?.role);


    const handleApplyPreset = (days) => {
        const start = startDate ? new Date(startDate) : new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (absenceType === 'leave') {
            if (!endDate) {
                showToast('Please specify a return date for your leave.', 'warning');
                return;
            }

            if (endDate < startDate) {
                showToast('Return date must be on or after the start date.', 'warning');
                return;
            }

            setIsSubmitting(true);

            router.post(route('profile.working-status.update'), {
                status: 'on_leave',
                scope,
                studio_id: scope === 'specific' ? studioId : null,
                leave_start_date: startDate,
                leave_end_date: endDate,
                leave_reason: leaveReason.trim() || null,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    if (!isOwner) {
                        showToast(
                            isLeader
                                ? 'Leave request submitted to Studio Owner for authorization.'
                                : 'Leave request submitted to Team Lead or Studio Owner for review.',
                            'info'
                        );
                    } else {
                        showToast('Working status updated to On Leave across selected studio(s).', 'success');
                    }
                    onClose();
                },
                onError: (errs) => {
                    const firstErr = Object.values(errs)[0] || 'Failed to submit leave request. Please check your inputs.';
                    showToast(firstErr, 'error');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } else {
            // Emergency
            if (!emergencyCategory) {
                showToast('Please select an emergency category.', 'warning');
                return;
            }

            setIsSubmitting(true);
            const selectedCatObj = EMERGENCY_CATEGORIES.find(c => c.id === emergencyCategory);
            const categoryLabel = selectedCatObj ? selectedCatObj.label : 'Emergency Absence';

            router.post(route('profile.emergency-status.store'), {
                scope,
                studio_id: scope === 'specific' ? studioId : null,
                emergency_category: emergencyCategory,
                confidential_note: confidentialNote.trim() || null,
                reason: categoryLabel,
                estimated_return_date: estimatedReturnDate || null,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    if (isOwner) {
                        showToast('Emergency status declared and active. Workspace operational lead notified.', 'success');
                    } else {
                        showToast(
                            isLeader
                                ? 'Emergency declaration submitted to Studio Owner for immediate review.'
                                : 'Emergency declaration submitted to Team Lead or Studio Owner for immediate review.',
                            'info'
                        );
                    }
                    onClose();
                },
                onError: (errs) => {
                    const firstErr = Object.values(errs)[0] || 'Failed to submit emergency declaration. Please check your inputs.';
                    showToast(firstErr, 'error');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        }
    };

    const isLeave = absenceType === 'leave';

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-2xl lg:max-w-3xl min-h-[580px] sm:min-h-[620px] bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className={`p-6 sm:p-7 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 transition-colors ${
                    isLeave 
                        ? 'bg-amber-500/5 dark:bg-amber-500/10' 
                        : 'bg-rose-500/5 dark:bg-rose-500/10'
                }`}>
                    <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border transition-colors ${
                            isLeave
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}>
                            {isLeave ? (
                                <CalendarPlus className="w-6 h-6" />
                            ) : (
                                <ShieldAlert className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                                    {isLeave ? 'Request Operational Leave' : 'Declare Operational Emergency'}
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase ${
                                    isLeave
                                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25'
                                }`}>
                                    {isLeave ? 'Scheduled' : 'Urgent'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-normal">
                                {isLeave 
                                    ? 'Submit planned absence for sprint velocity and leadership review.'
                                    : 'Signals urgent absence to protect sprint velocity and critical path tasks.'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
                    
                    {/* Absence Type Switcher */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">
                            Absence Category
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setAbsenceType('leave')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    isLeave
                                        ? 'bg-white dark:bg-[#0B0F17] text-amber-900 dark:text-amber-200 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span>Scheduled Leave</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAbsenceType('emergency')}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    !isLeave
                                        ? 'bg-white dark:bg-[#0B0F17] text-rose-900 dark:text-rose-200 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <span>Urgent Emergency</span>
                            </button>
                        </div>
                    </div>

                    {/* Role Governance Policy Callout */}
                    <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 shadow-2xs transition-colors ${
                        isLeave
                            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30'
                            : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30'
                    }`}>
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isLeave ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}>
                            {isOwner ? (
                                <Crown className="w-5 h-5" />
                            ) : isLeader ? (
                                <Crown className="w-5 h-5 text-purple-500" />
                            ) : (
                                <UserCheck className="w-5 h-5 text-brand" />
                            )}
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                    {isOwner 
                                        ? 'Studio Owner Authority' 
                                        : isLeader 
                                            ? 'Team Leader Governance' 
                                            : 'Team Member Governance'}
                                </span>
                                <span className={`text-xs font-mono px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                                    isOwner 
                                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30' 
                                        : isLeader 
                                            ? 'bg-purple-500/15 text-purple-800 dark:text-purple-200 border border-purple-500/30' 
                                            : isLeave
                                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30'
                                                : 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/30'
                                }`}>
                                    {isOwner 
                                        ? 'Direct Authority' 
                                        : isLeader 
                                            ? 'Owner Approval Required' 
                                            : 'Review Required'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                                {isLeave ? (
                                    isOwner
                                        ? 'Your leave takes effect immediately upon confirmation across project schedules.'
                                        : isLeader
                                            ? 'As a Team Leader, submitting this request routes directly to the Studio Owner. Your status remains Active until approved.'
                                            : 'Submitting creates a formal request sent to your Team Leader and Studio Owner. Your sprint status remains Active until approved.'
                                ) : (
                                    isOwner
                                        ? 'As Studio Owner, emergency status activates immediately across workspace channels.'
                                        : isLeader
                                            ? 'As Team Leader, declaration notifies the Studio Owner for urgent review. You may freely self-withdraw if the incident resolves.'
                                            : 'Declaration routes urgently to your Team Leader and Studio Owner. You may freely self-withdraw if the incident resolves.'
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Scope / Studio Selector */}
                    {joinedStudios.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                <span>Target Studio Scope</span>
                                <span className="text-xs font-mono font-medium uppercase text-slate-500 dark:text-slate-400">Workspace Division</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setScope('all')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                        scope === 'all'
                                            ? 'bg-brand/10 border-brand text-brand dark:text-cyan-400 ring-2 ring-brand/40 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="font-bold text-sm sm:text-base">All Studios</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
                                        Entire organization & active pods
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setScope('specific')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                        scope === 'specific'
                                            ? 'bg-brand/10 border-brand text-brand dark:text-cyan-400 ring-2 ring-brand/40 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="font-bold text-sm sm:text-base">Specific Studio</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
                                        Single project studio workspace
                                    </div>
                                </button>
                            </div>

                            {scope === 'specific' && (
                                <div className="mt-2.5">
                                    <select
                                        value={studioId}
                                        onChange={(e) => setStudioId(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:ring-1 focus:ring-brand"
                                    >
                                        {joinedStudios.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.role || 'Member'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Conflict Notice if Existing Pending Leave Exists (For Leave tab) */}
                    {isLeave && Boolean(scope === 'specific' ? activeStudio?.pending_leave_request : joinedStudios.some(s => s.pending_leave_request)) && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                <span className="font-bold block mb-0.5">Active Request Replacement</span>
                                You have an existing pending leave request {scope === 'specific' ? `for ${activeStudio?.name}` : 'in an active studio'}. Submitting this request will update and supersede your previous pending request.
                            </div>
                        </div>
                    )}

                    {/* DYNAMIC FIELDS: LEAVE MODE */}
                    {isLeave && (
                        <>
                            {/* Dates Range */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-900 dark:text-white block mb-1.5">
                                        Leave Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 font-semibold"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-900 dark:text-white block mb-1.5">
                                        Return to Active Date
                                    </label>
                                    <input
                                        type="date"
                                        min={startDate || todayStr}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="space-y-2">
                                <span className="text-xs uppercase font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 block">
                                    Quick Duration Presets:
                                </span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {[
                                        { label: '3 Days', days: 3 },
                                        { label: '1 Week', days: 7 },
                                        { label: '2 Weeks', days: 14 },
                                        { label: '1 Month', days: 30 },
                                    ].map(preset => (
                                        <button
                                            key={preset.days}
                                            type="button"
                                            onClick={() => handleApplyPreset(preset.days)}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer shadow-2xs"
                                        >
                                            +{preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reason & Handover Note */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-900 dark:text-white block">
                                    Reason & Handover Note <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">(Optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={leaveReason}
                                    onChange={(e) => setLeaveReason(e.target.value)}
                                    placeholder="e.g., Annual family leave, handed over sprint tasks to @Sarah..."
                                    className="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 font-medium"
                                />
                            </div>
                        </>
                    )}

                    {/* DYNAMIC FIELDS: EMERGENCY MODE */}
                    {/* DYNAMIC FIELDS: EMERGENCY MODE */}
                    {!isLeave && (
                        <>
                            {/* Privacy Notice */}
                            <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3 shadow-2xs">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <div className="space-y-0.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                                    <strong className="text-slate-900 dark:text-white block font-bold">
                                        Standardized Category Privacy Protection
                                    </strong>
                                    <span>
                                        To protect your health and personal privacy, notification feeds and activity logs only display your standardized category label. Any private notes are strictly restricted to leadership.
                                    </span>
                                </div>
                            </div>

                            {/* Emergency Category Selector */}
                            <div className="space-y-2.5">
                                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>Emergency Category <span className="text-rose-500">*</span></span>
                                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Broad classification</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {EMERGENCY_CATEGORIES.map((cat) => {
                                        const IconComponent = cat.icon;
                                        const isSelected = emergencyCategory === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setEmergencyCategory(cat.id)}
                                                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                                                    isSelected
                                                        ? 'bg-rose-500/10 border-rose-500 text-slate-900 dark:text-white ring-2 ring-rose-500/40 shadow-xs'
                                                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div className={`p-2 rounded-xl shrink-0 ${
                                                    isSelected 
                                                        ? 'bg-rose-500 text-white' 
                                                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-xs sm:text-sm">
                                                        {cat.label}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                                        {cat.description}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Confidential Note for Leadership (Optional) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Confidential Note for Leadership</span>
                                        <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(Optional)</span>
                                    </label>
                                    <span className="text-[11px] font-mono text-slate-400">
                                        {confidentialNote.length} / 500 chars
                                    </span>
                                </div>
                                <textarea
                                    rows={3}
                                    maxLength={500}
                                    value={confidentialNote}
                                    onChange={(e) => setConfidentialNote(e.target.value)}
                                    placeholder="Optional private message for leadership/manager review only (e.g. key handoff links or emergency contact info)..."
                                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-rose-500 font-medium"
                                />
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                    Never published to public dashboards or notifications. Only accessible to the Studio Owner.
                                </p>
                            </div>

                            {/* Estimated Return Date (Optional) */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>Estimated Return Date</span>
                                    <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">Optional</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        min={todayStr}
                                        value={estimatedReturnDate}
                                        onChange={(e) => setEstimatedReturnDate(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Leave blank if return date is currently unknown.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || (!isLeave && !emergencyCategory)}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-xs hover:shadow-md disabled:opacity-50 transition-all cursor-pointer ${
                                isLeave
                                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                                    : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                            }`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>
                                {isLeave ? (
                                    isOwner 
                                        ? 'Confirm & Set Leave' 
                                        : isLeader 
                                            ? 'Submit Request to Owner' 
                                            : 'Submit Leave Request'
                                ) : (
                                    isOwner 
                                        ? 'Confirm & Declare Emergency' 
                                        : 'Submit Emergency Declaration'
                                )}
                            </span>
                        </button>
                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
}
