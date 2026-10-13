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
    FileText, 
    Sparkles, 
    Send,
    CheckCircle2
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

export default function RequestLeaveModal({
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
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setStartDate(todayStr);
            setEndDate('');
            setReason('');
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine governance level for the chosen scope/studio
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
            leave_reason: reason.trim() || null,
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
    };

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-2xl lg:max-w-3xl min-h-[580px] sm:min-h-[620px] bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 sm:p-7 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-amber-500/5 dark:bg-amber-500/10">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-2xs">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                                Request Operational Leave
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-normal">
                                Submit scheduled absence for sprint planning and leadership review.
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
                    
                    {/* Role Governance Policy Callout */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-3.5 shadow-2xs">
                        <div className="p-2 rounded-xl bg-amber-500/20 shrink-0 mt-0.5 text-amber-700 dark:text-amber-300">
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
                                            : 'bg-brand/15 text-brand dark:text-cyan-300 border border-brand/30'
                                }`}>
                                    {isOwner ? 'Direct Authority' : isLeader ? 'Owner Approval Required' : 'Review Required'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                                {isOwner
                                    ? 'Your leave takes effect immediately upon confirmation across project schedules.'
                                    : isLeader
                                        ? 'As a Team Leader, submitting this request routes directly to the Studio Owner. Your status remains Active until approved.'
                                        : 'Submitting creates a formal request sent to your Team Leader and Studio Owner. Your sprint status remains Active until approved.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Scope / Studio Selector (if multiple studios) */}
                    {joinedStudios.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                <span>Target Studio Scope</span>
                                <span className="text-xs font-mono font-medium uppercase text-slate-500 dark:text-slate-400">Vaultera Labs division</span>
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
                                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:ring-1 focus:ring-amber-500"
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

                    {/* Conflict Notice if Existing Pending Leave Exists */}
                    {Boolean(scope === 'specific' ? activeStudio?.pending_leave_request : joinedStudios.some(s => s.pending_leave_request)) && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                <span className="font-bold block mb-0.5">Active Request Replacement</span>
                                You have an existing pending leave request {scope === 'specific' ? `for ${activeStudio?.name}` : 'in an active studio'}. Submitting this request will update and supersede your previous pending request.
                            </div>
                        </div>
                    )}

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
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Annual family leave, handed over sprint tasks to @Sarah..."
                            className="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400 font-medium"
                        />
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
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-bold shadow-xs hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>
                                {isOwner 
                                    ? 'Confirm & Set Leave' 
                                    : isLeader 
                                        ? 'Submit Request to Owner' 
                                        : 'Submit Leave Request'}
                            </span>
                        </button>
                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
}
