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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-lg bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4 bg-rose-500/5 dark:bg-rose-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                                    Declare Operational Emergency
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                                    Critical
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Signals urgent absence to protect sprint velocity and critical path tasks.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
                    
                    {/* Operational Safety Notice */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs">
                        <Info className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                        <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="text-slate-800 dark:text-slate-200 block font-semibold">
                                Independent Operational State
                            </strong>
                            <span>
                                Declaring an emergency documents an audit trail and alerts leadership. Any existing pending or future scheduled leave requests remain safely preserved.
                            </span>
                        </div>
                    </div>

                    {/* Role Governance Policy Callout */}
                    <div className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-rose-500/15 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400">
                            {isOwner ? (
                                <Crown className="w-4 h-4" />
                            ) : isLeader ? (
                                <Crown className="w-4 h-4 text-purple-500" />
                            ) : (
                                <UserCheck className="w-4 h-4 text-brand" />
                            )}
                        </div>
                        <div className="text-xs space-y-1 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {isOwner 
                                        ? 'Studio Owner Authority' 
                                        : isLeader 
                                            ? 'Team Leader Governance' 
                                            : 'Team Member Governance'}
                                </span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                    isOwner 
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                                        : isLeader 
                                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20' 
                                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                }`}>
                                    {isOwner ? 'Direct Authority' : isLeader ? 'Owner Review Required' : 'Leadership Review'}
                                </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
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
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                <span>Emergency Scope</span>
                                <span className="text-[11px] font-normal text-slate-400">Affected studios</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setScope('all')}
                                    className={`p-2.5 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                                        scope === 'all'
                                            ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/40'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="font-semibold">All Studios</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        Flag total operational downtime
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setScope('specific')}
                                    className={`p-2.5 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                                        scope === 'specific'
                                            ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/40'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="font-semibold">Specific Studio</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        Target single project workspace
                                    </div>
                                </button>
                            </div>

                            {scope === 'specific' && (
                                <div className="mt-2">
                                    <select
                                        value={studioId}
                                        onChange={(e) => setStudioId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-rose-500"
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
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Emergency Nature & Context <span className="text-rose-500">*</span>
                            </label>
                            <span className={`text-[10px] font-mono ${
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
                            className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 ${
                                reason && !isReasonValid 
                                    ? 'border-amber-400 dark:border-amber-500 focus:ring-amber-500' 
                                    : 'border-slate-200 dark:border-slate-800 focus:ring-rose-500'
                            }`}
                            required
                        />
                        {reason && !isReasonValid && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                Please provide at least {minChars - reasonLength} more character{minChars - reasonLength === 1 ? '' : 's'} of actionable context for sprint leads.
                            </p>
                        )}
                    </div>

                    {/* Estimated Return Date (Optional) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                            <span>Estimated Return Date</span>
                            <span className="text-slate-400 font-normal text-[11px]">Optional</span>
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                min={todayStr}
                                value={estimatedReturnDate}
                                onChange={(e) => setEstimatedReturnDate(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-rose-500 font-medium"
                            />
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Leave blank if return date is currently unknown.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || !isReasonValid}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-2xs hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
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
