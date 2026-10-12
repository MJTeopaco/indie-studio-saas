import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { 
    Activity, 
    Clock, 
    ShieldAlert, 
    CalendarPlus, 
    Calendar, 
    Building2, 
    AlertCircle, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Lock, 
    ArrowRight,
    History,
    Sparkles,
    AlertTriangle,
    RotateCcw,
    FileText
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';
import RequestLeaveModal from './RequestLeaveModal';
import EmergencyModal from './EmergencyModal';

export default function AvailabilityForm({
    user = {},
    joinedStudios = [],
    leaveHistory = [],
}) {
    // Current user operational status
    const [currentStatus, setCurrentStatus] = useState(user.working_status || 'active');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusScope, setStatusScope] = useState('all');
    const [statusStudioId, setStatusStudioId] = useState(
        joinedStudios.length > 0 ? joinedStudios[0].id : ''
    );

    // Modal states
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [cancellingRequestId, setCancellingRequestId] = useState(null);

    // Extract pending leave and emergency requests from studios
    const pendingLeaveRequests = joinedStudios
        .filter(s => s.pending_leave_request)
        .map(s => ({
            ...s.pending_leave_request,
            studioName: s.name,
            studioId: s.id,
        }));

    const pendingEmergencyRequests = joinedStudios
        .filter(s => s.pending_emergency_request)
        .map(s => ({
            ...s.pending_emergency_request,
            studioName: s.name,
            studioId: s.id,
        }));

    const hasPendingEmergency = pendingEmergencyRequests.length > 0;
    const hasPendingLeave = pendingLeaveRequests.length > 0;
    const isOnLeave = currentStatus === 'on_leave';
    const isEmergency = currentStatus === 'emergency';

    // ── Instant Active Toggle / Break Leave Early / Resolve Emergency ──
    const handleInstantActiveToggle = () => {
        if (currentStatus === 'active') return;

        const previousStatus = currentStatus;
        setCurrentStatus('active'); // Optimistic UI update
        setIsUpdatingStatus(true);

        router.post(route('profile.working-status.instant'), {
            status: 'active',
            scope: statusScope,
            studio_id: statusScope === 'specific' ? statusStudioId : null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (previousStatus === 'on_leave') {
                    showToast('Leave concluded early. Operational status restored to Active.', 'success');
                } else if (previousStatus === 'emergency') {
                    showToast('Emergency resolved. Status set to Active and sprint leads notified.', 'success');
                } else {
                    showToast('Operational status set to Active.', 'success');
                }
            },
            onError: (errs) => {
                setCurrentStatus(previousStatus); // Revert optimistic state
                const firstErr = Object.values(errs)[0] || 'Failed to update operational status.';
                showToast(firstErr, 'error');
            },
            onFinish: () => {
                setIsUpdatingStatus(false);
            }
        });
    };

    // ── Segmented Control Click Dispatcher ──
    const handleSegmentClick = (type) => {
        if (type === 'active') {
            handleInstantActiveToggle();
        } else if (type === 'on_leave') {
            setIsLeaveModalOpen(true);
        } else if (type === 'emergency') {
            if (isEmergency) {
                showToast('Your status is already set to Emergency. Click Active when the incident is resolved.', 'info');
                return;
            }
            setIsEmergencyModalOpen(true);
        }
    };

    // ── Direct One-Click Withdraw Request (Leave or Emergency) ──
    const handleWithdrawRequest = (requestId, requestType = 'leave') => {
        setCancellingRequestId(requestId);

        router.delete(route('profile.leave-requests.cancel', requestId), {
            preserveScroll: true,
            onSuccess: () => {
                const label = requestType === 'emergency' ? 'Emergency declaration' : 'Leave request';
                showToast(`${label} withdrawn successfully.`, 'info');
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Failed to withdraw request.';
                showToast(msg, 'error');
            },
            onFinish: () => {
                setCancellingRequestId(null);
            }
        });
    };

    // Date formatting helper
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* ── Page Header & Top Primary Actions ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <span>Availability & Status</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-brand/10 text-brand dark:text-cyan-400 border border-brand/20">
                            Vaultera Ops
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Real-time deployment readiness, emergency governance, and audit ledger.
                    </p>
                </div>

                {/* Primary Actions: "Request Leave" and "Declare Emergency" */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setIsEmergencyModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/25 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]"
                    >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Declare Emergency</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-light active:bg-brand-dark text-white text-xs font-semibold shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98]"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        <span>Request Leave</span>
                    </button>
                </div>
            </div>

            {/* ── Operational Status Control Card ── */}
            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xs p-6 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>Operational State</span>
                            {isUpdatingStatus && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                            )}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Real-time sprint readiness indicator with governed transitions.
                        </p>
                    </div>

                    {/* Scope Selector */}
                    {joinedStudios.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">Scope:</span>
                            <select
                                value={statusScope}
                                onChange={(e) => setStatusScope(e.target.value)}
                                className="text-xs py-1.5 pl-2.5 pr-7 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                            >
                                <option value="all">All Studios</option>
                                <option value="specific">Specific Studio</option>
                            </select>

                            {statusScope === 'specific' && (
                                <select
                                    value={statusStudioId}
                                    onChange={(e) => setStatusStudioId(e.target.value)}
                                    className="text-xs py-1.5 pl-2.5 pr-7 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer max-w-[150px] truncate"
                                >
                                    {joinedStudios.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* ── High-Velocity Segmented Control ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
                    
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#070A10] border border-slate-200 dark:border-slate-800 shadow-2xs">
                        
                        {/* 1. Active Segment (Instant toggle / restores normal state) */}
                        <button
                            type="button"
                            onClick={() => handleSegmentClick('active')}
                            disabled={isUpdatingStatus}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                currentStatus === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-500/50" />
                            <span>Active</span>
                            {(isOnLeave || isEmergency) && (
                                <span className="ml-1 text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    Resume
                                </span>
                            )}
                        </button>

                        {/* 2. On Leave Segment (Modal trigger or Active State pill) */}
                        {isOnLeave ? (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500/40 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-xs shadow-amber-500/50" />
                                <span>On Leave</span>
                                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                {user.leave_end_date && (
                                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 ml-0.5">
                                        (until {formatDate(user.leave_end_date)})
                                    </span>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleSegmentClick('on_leave')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-150 cursor-pointer"
                            >
                                <span className="w-2 h-2 rounded-full bg-amber-400/60 shrink-0" />
                                <span>On Leave</span>
                            </button>
                        )}

                        {/* 3. Emergency Segment (Governed Modal Trigger) */}
                        <button
                            type="button"
                            onClick={() => handleSegmentClick('emergency')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                isEmergency
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/40 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full bg-rose-500 shrink-0 ${isEmergency ? 'animate-ping' : ''}`} />
                            <span>Emergency</span>
                            {hasPendingEmergency && !isEmergency && (
                                <span className="ml-1 text-[10px] font-mono uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">
                                    Pending
                                </span>
                            )}
                        </button>

                    </div>

                    {/* Operational explanation note */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2">
                        {currentStatus === 'active' && (
                            <span>🟢 Available for sprint assignments and critical path tasks.</span>
                        )}
                        {currentStatus === 'emergency' && (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                                🔴 Emergency active. Incident audit logged and sprint leads notified. Click "Active" to resolve.
                            </span>
                        )}
                        {currentStatus === 'on_leave' && (
                            <span className="text-amber-600 dark:text-amber-400">
                                🟡 Approved scheduled absence. Click "Active" anytime to conclude leave early.
                            </span>
                        )}
                    </div>
                </div>

            </div>

            {/* ── Operational Callouts Panel: Pending Emergencies & Leave Requests ── */}
            {(hasPendingEmergency || hasPendingLeave) && (
                <div className="space-y-3">
                    
                    {/* Pending Emergency Callout */}
                    {hasPendingEmergency && pendingEmergencyRequests.map(req => (
                        <div 
                            key={`emergency-${req.id}`}
                            className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <ShieldAlert className="w-4 h-4 animate-bounce" />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-heading font-bold text-rose-900 dark:text-rose-200">
                                            Emergency Declaration Pending Review
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300">
                                            {req.studioName}
                                        </span>
                                        {req.created_at && (
                                            <span className="text-[11px] text-slate-400 font-normal">
                                                ({req.created_at})
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-rose-500/5 px-2.5 py-1 rounded-md border border-rose-500/15">
                                        "{req.reason}"
                                    </p>
                                    <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                                        Routing: {req.requester_role === 'leader' ? 'Studio Owner' : 'Team Lead or Studio Owner'}. If the emergency has passed, you may self-withdraw.
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center justify-end">
                                <button
                                    type="button"
                                    disabled={cancellingRequestId === req.id}
                                    onClick={() => handleWithdrawRequest(req.id, 'emergency')}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {cancellingRequestId === req.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <XCircle className="w-3.5 h-3.5" />
                                    )}
                                    <span>Withdraw Declaration</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pending Leave Callout */}
                    {hasPendingLeave && pendingLeaveRequests.map(req => (
                        <div 
                            key={`leave-${req.id}`}
                            className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock className="w-4 h-4 animate-pulse" />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-heading font-bold text-amber-900 dark:text-amber-200">
                                            Leave Request Pending Review
                                        </h3>
                                        <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                            {formatDate(req.leave_start_date)} → {formatDate(req.leave_end_date)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                            {req.studioName}
                                        </span>
                                        {req.created_at && (
                                            <span className="text-[11px] text-slate-400 font-normal">
                                                ({req.created_at})
                                            </span>
                                        )}
                                    </div>
                                    {req.reason && (
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/15">
                                            "{req.reason}"
                                        </p>
                                    )}
                                    <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                                        Routing: {req.requester_role === 'leader' ? 'Studio Owner' : 'Team Lead or Studio Owner'}. Your sprint availability remains active until approved.
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center justify-end">
                                <button
                                    type="button"
                                    disabled={cancellingRequestId === req.id}
                                    onClick={() => handleWithdrawRequest(req.id, 'leave')}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-amber-500/20 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {cancellingRequestId === req.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <XCircle className="w-3.5 h-3.5" />
                                    )}
                                    <span>Withdraw Request</span>
                                </button>
                            </div>
                        </div>
                    ))}

                </div>
            )}

            {/* ── Leave History Ledger ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-500" />
                            <span>Availability & Leave Ledger</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Comprehensive audit trail of operational emergencies, planned leaves, and withdrawals.
                        </p>
                    </div>

                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {leaveHistory.length} {leaveHistory.length === 1 ? 'record' : 'records'}
                    </span>
                </div>

                {/* Ledger Table Container */}
                <div className="bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xs overflow-hidden">
                    {leaveHistory.length === 0 ? (
                        <div className="py-14 px-6 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-heading font-semibold text-slate-800 dark:text-slate-200">
                                    No Ledger Records Found
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-0.5">
                                    Submitted leave requests and operational emergency declarations will appear in this ledger.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLeaveModalOpen(true)}
                                    className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                                >
                                    Request leave →
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <button
                                    type="button"
                                    onClick={() => setIsEmergencyModalOpen(true)}
                                    className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                                >
                                    Declare emergency →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                                        <th scope="col" className="py-3 px-4 font-semibold">Type</th>
                                        <th scope="col" className="py-3 px-4 font-semibold">Date Range / Duration</th>
                                        <th scope="col" className="py-3 px-4 font-semibold">Studio</th>
                                        <th scope="col" className="py-3 px-4 font-semibold">Reason & Context</th>
                                        <th scope="col" className="py-3 px-4 font-semibold">Routing</th>
                                        <th scope="col" className="py-3 px-4 font-semibold">Status</th>
                                        <th scope="col" className="py-3 px-4 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {leaveHistory.map((row) => {
                                        const isPending = row.status === 'pending';
                                        const isEmergencyRecord = row.request_type === 'emergency';

                                        return (
                                            <tr 
                                                key={row.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                                            >
                                                {/* Request Type */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {isEmergencyRecord ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                                                            <ShieldAlert className="w-2.5 h-2.5" />
                                                            <span>Emergency</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                                            <Calendar className="w-2.5 h-2.5" />
                                                            <span>Leave</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Date Range */}
                                                <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{formatDate(row.leave_start_date)}</span>
                                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                                        <span>{row.leave_end_date ? formatDate(row.leave_end_date) : 'Open / TBD'}</span>
                                                    </div>
                                                    {row.created_at && (
                                                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                            {row.created_at}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Studio */}
                                                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{row.studio_name}</span>
                                                    </div>
                                                </td>

                                                {/* Reason & Context */}
                                                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-[220px]">
                                                    {row.reason ? (
                                                        <span className="italic truncate block" title={row.reason}>
                                                            "{row.reason}"
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                    {row.resolved_at && (
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                                                            Resolved {row.resolved_at}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Routing */}
                                                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium text-[11px]">
                                                    {row.routing}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {row.status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            <span>Pending</span>
                                                        </span>
                                                    )}
                                                    {row.status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                            <span>Approved</span>
                                                        </span>
                                                    )}
                                                    {row.status === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                                            <XCircle className="w-2.5 h-2.5" />
                                                            <span>Rejected</span>
                                                        </span>
                                                    )}
                                                    {row.status === 'cancelled' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                                                            <span>Withdrawn</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Direct Action Column: Instant Muted "Withdraw" button for pending rows */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    {isPending ? (
                                                        <button
                                                            type="button"
                                                            disabled={cancellingRequestId === row.id}
                                                            onClick={() => handleWithdrawRequest(row.id, row.request_type)}
                                                            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            {cancellingRequestId === row.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : null}
                                                            <span>Withdraw</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Request Leave Modal (Portaled) ── */}
            <RequestLeaveModal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                joinedStudios={joinedStudios}
                initialScope={statusScope}
                initialStudioId={statusStudioId}
            />

            {/* ── Emergency Declaration Modal (Portaled) ── */}
            <EmergencyModal
                isOpen={isEmergencyModalOpen}
                onClose={() => setIsEmergencyModalOpen(false)}
                joinedStudios={joinedStudios}
                initialScope={statusScope}
                initialStudioId={statusStudioId}
            />

        </div>
    );
}
