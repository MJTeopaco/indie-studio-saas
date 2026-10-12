import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { 
    AlertTriangle, 
    X, 
    Loader2, 
    Building2, 
    Crown, 
    UserCheck, 
    ShieldAlert, 
    Calendar,
    Send,
    CheckCircle2,
    Info
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

export default function EmergencyModal({
    isOpen,
    onClose,
    joinedStudios = [],
    initialScope = 'all',
    initialStudioId = null,
}) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [scope, setScope] = useState(initialScope);
    const [studioId, setStudioId] = useState(
        initialStudioId || (joinedStudios.length > 0 ? joinedStudios[0].id : '')
    );
    const [reason, setReason] = useState('');
    const [estimatedReturnDate, setEstimatedReturnDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setReason('');
            setEstimatedReturnDate('');
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine governance level for chosen scope/studio
    const activeStudio = scope === 'specific'
        ? (joinedStudios.find(s => String(s.id) === String(studioId)) || joinedStudios[0])
        : joinedStudios[0];
    const isOwner = Boolean(activeStudio?.is_owner || activeStudio?.role === 'owner');
    const isLeader = !isOwner && ['leader', 'manager'].includes(activeStudio?.role);

    const minChars = 15;
    const reasonLength = reason.trim().length;
    const isReasonValid = reasonLength >= minChars;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isReasonValid) {
            showToast(`Emergency reason must be at least ${minChars} characters for operational context.`, 'warning');
            return;
        }

        setIsSubmitting(true);

        router.post(route('profile.emergency-status.store'), {
            scope,
            studio_id: scope === 'specific' ? studioId : null,
            reason: reason.trim(),
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
    };

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-2xl lg:max-w-3xl min-h-[580px] sm:min-h-[620px] bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 sm:p-7 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-rose-500/5 dark:bg-rose-500/10">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-2xs">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                                    Declare Operational Emergency
                                </h3>
                                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                                    Critical
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-normal">
                                Signals urgent absence to protect sprint velocity and critical path tasks.
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
                    
                    {/* Operational Safety Notice */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 shadow-2xs">
                        <Info className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                        <div className="space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong className="text-slate-900 dark:text-white block font-bold text-sm sm:text-base">
                                Independent Operational State
                            </strong>
                            <span className="text-xs sm:text-sm font-normal block">
                                Declaring an emergency documents an audit trail and alerts leadership. Any existing pending or future scheduled leave requests remain safely preserved.
                            </span>
                        </div>
                    </div>

                    {/* Role Governance Policy Callout */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 flex items-start gap-3.5 shadow-2xs">
                        <div className="p-2 rounded-xl bg-rose-500/20 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400">
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
                                            : 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/30'
                                }`}>
                                    {isOwner ? 'Direct Authority' : isLeader ? 'Owner Review Required' : 'Leadership Review'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                                {isOwner
                                    ? 'As Studio Owner, emergency status activates immediately across workspace channels.'
                                    : isLeader
                                        ? 'As Team Leader, declaration notifies the Studio Owner for urgent review. You may freely self-withdraw if the incident resolves.'
                                        : 'Declaration routes urgently to your Team Leader and Studio Owner. You may freely self-withdraw if the incident resolves.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Scope / Studio Selector */}
                    {joinedStudios.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                <span>Emergency Scope</span>
                                <span className="text-xs font-mono font-medium uppercase text-slate-500 dark:text-slate-400">Affected studios</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setScope('all')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                        scope === 'all'
                                            ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/40 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="font-bold text-sm sm:text-base">All Studios</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
                                        Flag total operational downtime
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setScope('specific')}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                        scope === 'specific'
                                            ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/40 shadow-xs'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="font-bold text-sm sm:text-base">Specific Studio</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
                                        Target single project workspace
                                    </div>
                                </button>
                            </div>

                            {scope === 'specific' && (
                                <div className="mt-2.5">
                                    <select
                                        value={studioId}
                                        onChange={(e) => setStudioId(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:ring-1 focus:ring-rose-500"
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

                    {/* Emergency Reason (Required, min 15 chars) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-900 dark:text-white">
                                Emergency Nature & Context <span className="text-rose-500">*</span>
                            </label>
                            <span className={`text-xs font-mono font-bold ${
                                isReasonValid 
                                    ? 'text-emerald-600 dark:text-emerald-400' 
                                    : 'text-amber-600 dark:text-amber-400'
                            }`}>
                                {reasonLength} / {minChars} min chars
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Severe power outage in sector, unable to connect until morning..."
                            className={`w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 font-medium ${
                                reason && !isReasonValid 
                                    ? 'border-amber-400 dark:border-amber-500 focus:ring-amber-500' 
                                    : 'border-slate-300 dark:border-slate-700 focus:ring-rose-500'
                            }`}
                            required
                        />
                        {reason && !isReasonValid && (
                            <p className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">
                                Please provide at least {minChars - reasonLength} more character{minChars - reasonLength === 1 ? '' : 's'} of actionable context for sprint leads.
                            </p>
                        )}
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
                            disabled={isSubmitting || !isReasonValid}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-bold shadow-xs hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>
                                {isOwner 
                                    ? 'Confirm & Declare Emergency' 
                                    : 'Submit Emergency Declaration'}
                            </span>
                        </button>
                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
}
