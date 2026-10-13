import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { 
    Activity, 
    Clock, 
    ShieldAlert, 
    Building2, 
    Calendar, 
    X, 
    Loader2, 
    Crown, 
    Shield, 
    Info, 
    CalendarDays,
    CheckCircle2
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

export default function WorkingStatusForm({ user = {}, joinedStudios = [] }) {
    const [isCancellingLeave, setIsCancellingLeave] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        status: user.working_status || 'active',
        scope: 'all', // 'all' | 'specific'
        studio_id: joinedStudios.length > 0 ? joinedStudios[0].id : '',
        leave_start_date: user.leave_start_date || new Date().toISOString().split('T')[0],
        leave_end_date: user.leave_end_date || '',
        leave_reason: '',
    });

    const activeStudio = data.scope === 'specific'
        ? (joinedStudios.find(s => String(s.id) === String(data.studio_id)) || joinedStudios[0])
        : joinedStudios[0];
    const isOwner = Boolean(activeStudio?.is_owner || activeStudio?.role === 'owner');
    const isLeader = !isOwner && ['leader', 'manager'].includes(activeStudio?.role);

    const pendingLeaveRequests = joinedStudios
        .filter(s => s.pending_leave_request)
        .map(s => ({
            ...s.pending_leave_request,
            studioName: s.name,
            studioId: s.id,
        }));

    const handleCancelLeaveRequest = (requestId) => {
        setIsCancellingLeave(true);
        router.post(route('profile.leave-request.cancel', { id: requestId }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Leave request cancelled successfully.', 'success');
            },
            onError: () => {
                showToast('Failed to cancel leave request.', 'error');
            },
            onFinish: () => {
                setIsCancellingLeave(false);
            },
        });
    };

    const handleSaveWorkingStatus = (e) => {
        e.preventDefault();

        if (data.status === 'on_leave' && !data.leave_end_date) {
            showToast('Please select a leave end date.', 'warning');
            return;
        }

        router.post(route('profile.working-status.update'), {
            status: data.status,
            scope: data.scope,
            studio_id: data.scope === 'specific' ? data.studio_id : null,
            leave_start_date: data.status === 'on_leave' ? data.leave_start_date : null,
            leave_end_date: data.status === 'on_leave' ? data.leave_end_date : null,
            leave_reason: data.status === 'on_leave' ? data.leave_reason : null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (data.status === 'on_leave' && !isOwner) {
                    showToast(
                        isLeader
                            ? 'Leave request submitted to Studio Owner for authorization.'
                            : 'Leave request submitted to Team Lead or Studio Owner for review.',
                        'info'
                    );
                } else {
                    showToast('Working status updated successfully!', 'success');
                }
            },
            onError: (statusErrs) => {
                const firstErr = Object.values(statusErrs)[0] || 'Failed to update working status.';
                showToast(firstErr, 'error');
            },
        });
    };

    const workingStatusOptions = [
        {
            id: 'active',
            title: 'Active',
            desc: 'Available for sprint tasks & critical path assignment.',
            dotClass: 'bg-emerald-500 shadow-emerald-500/50',
            activeClass: 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500/40 text-emerald-900 dark:text-emerald-300',
            icon: Activity,
            iconClass: 'text-emerald-500',
        },
        {
            id: 'on_leave',
            title: 'On Leave',
            desc: 'Scheduled absence. Automatically reverts to Active once timeline ends.',
            dotClass: 'bg-amber-500 shadow-amber-500/50',
            activeClass: 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 ring-1 ring-amber-500/40 text-amber-900 dark:text-amber-300',
            icon: Clock,
            iconClass: 'text-amber-500',
        },
        {
            id: 'emergency',
            title: 'Emergency',
            desc: 'Urgent absence. Flags leads and protects sprint path.',
            dotClass: 'bg-rose-500 shadow-rose-500/50',
            activeClass: 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 ring-1 ring-rose-500/40 text-rose-900 dark:text-rose-300',
            icon: ShieldAlert,
            iconClass: 'text-rose-500',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Availability & Leave Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Set your working status and manage scheduled absences across your studio workspaces.
                </p>
            </div>

            <form onSubmit={handleSaveWorkingStatus} className="space-y-6">
                <div className="bg-white dark:bg-[#0B0F17] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80">
                    
                    {/* Header with Scope Selection */}
                    <div className="p-6 sm:p-7 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                    Current Working Status
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Real-time presence state used for sprint allocations and task reassignment safeguards.
                                </p>
                            </div>

                            {/* Scope Selector if user belongs to multiple studios */}
                            {joinedStudios.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono text-slate-400">Scope:</span>
                                    <select
                                        value={data.scope}
                                        onChange={(e) => setData('scope', e.target.value)}
                                        className="text-xs py-1.5 pl-2.5 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                                    >
                                        <option value="all">All Workspaces</option>
                                        <option value="specific">Specific Studio</option>
                                    </select>

                                    {data.scope === 'specific' && (
                                        <select
                                            value={data.studio_id}
                                            onChange={(e) => setData('studio_id', e.target.value)}
                                            className="text-xs py-1.5 pl-2.5 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer max-w-[140px] truncate"
                                        >
                                            {joinedStudios.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pending Leave Requests Banner */}
                        {pendingLeaveRequests.length > 0 && (
                            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4 animate-pulse" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-heading font-bold text-amber-900 dark:text-amber-200">
                                                    Leave Request Pending Review
                                                </h4>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                                    Pending
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                                                Your sprint availability remains active until your request is reviewed by leadership.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {pendingLeaveRequests.map(req => (
                                        <div 
                                            key={req.id} 
                                            className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                        {req.studioName}
                                                    </span>
                                                    <span className="text-slate-400">•</span>
                                                    <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                                        {req.leave_start_date} → {req.leave_end_date}
                                                    </span>
                                                    {req.created_at && (
                                                        <span className="text-[11px] text-slate-400">
                                                            ({req.created_at})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                    <span>Routing:</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {req.requester_role === 'leader' ? 'Studio Owner Approval' : 'Team Leader or Studio Owner'}
                                                    </span>
                                                </div>
                                                {req.reason && (
                                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10 inline-block">
                                                        "{req.reason}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={isCancellingLeave}
                                                    onClick={() => handleCancelLeaveRequest(req.id)}
                                                    className="px-3 py-1.5 rounded-lg border border-rose-300/60 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                    {isCancellingLeave ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>Cancel Request</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3 Status Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {workingStatusOptions.map((opt) => {
                                const isSelected = data.status === opt.id;
                                const IconComponent = opt.icon;

                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setData('status', opt.id)}
                                        className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? opt.activeClass
                                                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${opt.dotClass} shrink-0`} />
                                                    <span className="font-heading font-bold text-xs">
                                                        {opt.title}
                                                    </span>
                                                </div>
                                                <IconComponent className={`w-3.5 h-3.5 ${opt.iconClass} shrink-0`} />
                                            </div>

                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                                {opt.desc}
                                            </p>

                                            {opt.id === 'on_leave' && !isOwner && (
                                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        {isLeader ? 'Owner Approval Required' : 'Approval Required'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* On Leave Details */}
                        {data.status === 'on_leave' && (
                            <div className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-500/20 flex items-start gap-3">
                                    <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0 mt-0.5">
                                        {isOwner ? (
                                            <Crown className="w-4 h-4 text-emerald-500" />
                                        ) : isLeader ? (
                                            <Shield className="w-4 h-4 text-amber-500" />
                                        ) : (
                                            <Info className="w-4 h-4 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="text-xs space-y-0.5">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                            {isOwner ? (
                                                'Studio Owner Authorization'
                                            ) : isLeader ? (
                                                'Team Leader Notice'
                                            ) : (
                                                'Member Leave Governance'
                                            )}
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                                            {isOwner
                                                ? 'As Studio Owner, your status updates immediately without required approvals.'
                                                : isLeader
                                                ? 'Leader absences are routed directly to Studio Owners for review to protect sprint delivery.'
                                                : 'Member absences require approval from your Team Leader or Studio Owner.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.leave_start_date}
                                            onChange={(e) => setData('leave_start_date', e.target.value)}
                                            className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                            End Date <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            min={data.leave_start_date}
                                            value={data.leave_end_date}
                                            onChange={(e) => setData('leave_end_date', e.target.value)}
                                            required
                                            className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                        Reason or Handover Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.leave_reason}
                                        onChange={(e) => setData('leave_reason', e.target.value)}
                                        placeholder="e.g. Annual PTO, family event, medical leave..."
                                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Bar */}
                    <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span>{data.status === 'on_leave' && !isOwner ? 'Submit Leave Request' : 'Update Availability'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
