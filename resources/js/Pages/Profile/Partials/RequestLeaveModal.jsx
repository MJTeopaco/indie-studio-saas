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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-lg bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                                Request Operational Leave
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Submit scheduled absence for sprint planning and leadership review.
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
                    
                    {/* Role Governance Policy Callout */}
                    <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/15 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
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
                                            : 'bg-brand/10 text-brand dark:text-cyan-400 border border-brand/20'
                                }`}>
                                    {isOwner ? 'Direct Authority' : isLeader ? 'Owner Approval Required' : 'Review Required'}
                                </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
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
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                <span>Target Studio Scope</span>
                                <span className="text-[11px] font-normal text-slate-400">Vaultera Labs division</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setScope('all')}
                                    className={`p-2.5 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                                        scope === 'all'
                                            ? 'bg-brand/10 border-brand text-brand dark:text-cyan-400 ring-1 ring-brand/40'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="font-semibold">All Studios</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        Entire organization & active pods
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setScope('specific')}
                                    className={`p-2.5 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                                        scope === 'specific'
                                            ? 'bg-brand/10 border-brand text-brand dark:text-cyan-400 ring-1 ring-brand/40'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="font-semibold">Specific Studio</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                        Single project studio workspace
                                    </div>
                                </button>
                            </div>

                            {scope === 'specific' && (
                                <div className="mt-2">
                                    <select
                                        value={studioId}
                                        onChange={(e) => setStudioId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-brand"
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
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                                <span className="font-semibold block">Active Request Replacement</span>
                                You have an existing pending leave request {scope === 'specific' ? `for ${activeStudio?.name}` : 'in an active studio'}. Submitting this request will update and supersede your previous pending request.
                            </div>
                        </div>
                    )}

                    {/* Dates Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                                Leave Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                                Return to Active Date
                            </label>
                            <input
                                type="date"
                                min={startDate || todayStr}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 block">
                            Quick Duration Presets:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer"
                                >
                                    +{preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason & Handover Note */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                            Reason & Handover Note <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Annual family leave, handed over sprint tasks to @Sarah..."
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400"
                        />
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
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold shadow-2xs hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
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
