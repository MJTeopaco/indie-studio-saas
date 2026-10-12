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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <span>Availability & Status</span>
                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-brand/10 text-brand dark:text-cyan-400 border border-brand/25">
                            Vaultera Ops
                        </span>
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-normal mt-1.5">
                        Real-time deployment readiness, emergency governance, and audit ledger.
                    </p>
                </div>

                {/* Primary Actions: "Declare Emergency" and "Request Leave" */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setIsEmergencyModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 active:bg-rose-200/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 text-xs sm:text-sm font-bold shadow-2xs transition-all duration-150 cursor-pointer active:scale-[0.98]"
                    >
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Declare Emergency</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-brand hover:bg-brand-light active:bg-brand-dark text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98]"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        <span>Request Leave</span>
                    </button>
                </div>
            </div>

            {/* ── Operational Status Control Card ── */}
            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-7 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <span>Operational State</span>
                            {isUpdatingStatus && (
                                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                            )}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                            Real-time sprint readiness indicator with governed transitions.
                        </p>
                    </div>

                    {/* Scope Selector */}
                    {joinedStudios.length > 0 && (
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                                Scope:
                            </span>
                            <select
                                value={statusScope}
                                onChange={(e) => setStatusScope(e.target.value)}
                                className="text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold cursor-pointer focus:ring-1 focus:ring-brand"
                            >
                                <option value="all">All Studios</option>
                                <option value="specific">Specific Studio</option>
                            </select>

                            {statusScope === 'specific' && (
                                <select
                                    value={statusStudioId}
                                    onChange={(e) => setStatusStudioId(e.target.value)}
                                    className="text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold cursor-pointer max-w-[180px] truncate focus:ring-1 focus:ring-brand"
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                    
                    <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-[#070A10] border border-slate-200 dark:border-slate-800 shadow-xs flex-wrap">
                        
                        {/* 1. Active Segment (Instant toggle / restores normal state) */}
                        <button
                            type="button"
                            onClick={() => handleSegmentClick('active')}
                            disabled={isUpdatingStatus}
                            className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                                currentStatus === 'active'
                                    ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/40 shadow-xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-500/50" />
                            <span>Active</span>
                            {(isOnLeave || isEmergency) && (
                                <span className="ml-1 text-[11px] font-mono font-bold uppercase text-emerald-800 dark:text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                                    <RotateCcw className="w-3 h-3" />
                                    Resume
                                </span>
                            )}
                        </button>

                        {/* 2. On Leave Segment (Modal trigger or Active State pill) */}
                        {isOnLeave ? (
                            <div className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/40 shadow-xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-xs shadow-amber-500/50" />
                                <span>On Leave</span>
                                <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                                {user.leave_end_date && (
                                    <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200 ml-1">
                                        (until {formatDate(user.leave_end_date)})
                                    </span>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleSegmentClick('on_leave')}
                                className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-150 cursor-pointer"
                            >
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                                <span>On Leave</span>
                            </button>
                        )}

                        {/* 3. Emergency Segment (Governed Modal Trigger) */}
                        <button
                            type="button"
                            onClick={() => handleSegmentClick('emergency')}
                            className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                                isEmergency
                                    ? 'bg-rose-500/20 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500/40 shadow-xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold'
                            }`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 ${isEmergency ? 'animate-ping' : ''}`} />
                            <span>Emergency</span>
                            {hasPendingEmergency && !isEmergency && (
                                <span className="ml-1 text-[11px] font-mono font-bold uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                                    Pending
                                </span>
                            )}
                        </button>

                    </div>

                    {/* Operational explanation note */}
                    <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium px-2 leading-relaxed">
                        {currentStatus === 'active' && (
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span>Available for sprint assignments and critical path tasks.</span>
                            </span>
                        )}
                        {currentStatus === 'emergency' && (
                            <span className="text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                                <span>Emergency active. Leads alerted. Click "Active" to resolve and resume.</span>
                            </span>
                        )}
                        {currentStatus === 'on_leave' && (
                            <span className="text-amber-800 dark:text-amber-200 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span>Approved scheduled absence. Click "Active" anytime to conclude leave early.</span>
                            </span>
                        )}
                    </div>
                </div>

            </div>

            {/* ── Operational Callouts Panel: Pending Emergencies & Leave Requests ── */}
            {(hasPendingEmergency || hasPendingLeave) && (
                <div className="space-y-4">
                    
                    {/* Pending Emergency Callout */}
                    {hasPendingEmergency && pendingEmergencyRequests.map(req => (
                        <div 
                            key={`emergency-${req.id}`}
                            className="p-5 rounded-2xl border-2 border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm shadow-xs"
                        >
                            <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <ShieldAlert className="w-5 h-5 animate-bounce" />
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="font-heading font-extrabold text-sm sm:text-base text-rose-950 dark:text-rose-100">
                                            Emergency Declaration Pending Review
                                        </h3>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                                            {req.studioName}
                                        </span>
                                        {req.created_at && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                ({req.created_at})
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 inline-block shadow-2xs">
                                        "{req.reason}"
                                    </p>
                                    <p className="text-xs text-rose-900 dark:text-rose-200 font-semibold">
                                        Routing: {req.requester_role === 'leader' ? 'Studio Owner' : 'Team Lead or Studio Owner'}. If the emergency has passed, you may self-withdraw.
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center justify-end">
                                <button
                                    type="button"
                                    disabled={cancellingRequestId === req.id}
                                    onClick={() => handleWithdrawRequest(req.id, 'emergency')}
                                    className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl text-rose-700 dark:text-rose-200 bg-white dark:bg-slate-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-700 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-2xs"
                                >
                                    {cancellingRequestId === req.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-rose-600" />
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
                            className="p-5 rounded-2xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm shadow-xs"
                        >
                            <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock className="w-5 h-5 animate-pulse" />
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="font-heading font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                                            Leave Request Pending Review
                                        </h3>
                                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-amber-600" />
                                            {formatDate(req.leave_start_date)} → {formatDate(req.leave_end_date)}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                            {req.studioName}
                                        </span>
                                        {req.created_at && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                ({req.created_at})
                                            </span>
                                        )}
                                    </div>
                                    {req.reason && (
                                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 inline-block shadow-2xs">
                                            "{req.reason}"
                                        </p>
                                    )}
                                    <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                                        Routing: {req.requester_role === 'leader' ? 'Studio Owner' : 'Team Lead or Studio Owner'}. Your sprint availability remains active until approved.
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center justify-end">
                                <button
                                    type="button"
                                    disabled={cancellingRequestId === req.id}
                                    onClick={() => handleWithdrawRequest(req.id, 'leave')}
                                    className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-300 dark:border-slate-700 hover:border-rose-300 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-2xs"
                                >
                                    {cancellingRequestId === req.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-slate-400 hover:text-rose-500" />
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <History className="w-5 h-5 text-brand" />
                            <span>Availability & Leave Ledger</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                            Comprehensive audit trail of operational emergencies, planned leaves, and withdrawals.
                        </p>
                    </div>

                    <span className="text-xs sm:text-sm font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                        {leaveHistory.length} {leaveHistory.length === 1 ? 'record' : 'records'}
                    </span>
                </div>

                {/* Ledger Table Container */}
                <div className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    {leaveHistory.length === 0 ? (
                        <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Calendar className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-base font-heading font-bold text-slate-900 dark:text-white">
                                    No Ledger Records Found
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mt-1">
                                    Submitted leave requests and operational emergency declarations will appear in this ledger.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLeaveModalOpen(true)}
                                    className="text-xs sm:text-sm font-bold text-brand hover:underline cursor-pointer"
                                >
                                    Request leave →
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <button
                                    type="button"
                                    onClick={() => setIsEmergencyModalOpen(true)}
                                    className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                >
                                    Declare emergency →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 font-mono text-xs uppercase tracking-wider font-bold">
                                        <th scope="col" className="py-4 px-4 font-bold">Type</th>
                                        <th scope="col" className="py-4 px-4 font-bold">Date Range / Duration</th>
                                        <th scope="col" className="py-4 px-4 font-bold">Studio</th>
                                        <th scope="col" className="py-4 px-4 font-bold">Reason & Context</th>
                                        <th scope="col" className="py-4 px-4 font-bold">Routing</th>
                                        <th scope="col" className="py-4 px-4 font-bold">Status</th>
                                        <th scope="col" className="py-4 px-4 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {leaveHistory.map((row) => {
                                        const isPending = row.status === 'pending';
                                        const isEmergencyRecord = row.request_type === 'emergency';

                                        return (
                                            <tr 
                                                key={row.id}
                                                className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group"
                                            >
                                                {/* Request Type */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    {isEmergencyRecord ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs">
                                                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                                            <span>Emergency</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs">
                                                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                                            <span>Leave</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Date Range */}
                                                <td className="py-4 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span>{formatDate(row.leave_start_date)}</span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{row.leave_end_date ? formatDate(row.leave_end_date) : 'Open / TBD'}</span>
                                                    </div>
                                                    {row.created_at && (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                                            Submitted {row.created_at}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Studio */}
                                                <td className="py-4 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 font-bold text-sm">
                                                        <Building2 className="w-4 h-4 text-slate-500" />
                                                        <span>{row.studio_name}</span>
                                                    </div>
                                                </td>

                                                {/* Reason & Context */}
                                                <td className="py-4 px-4 text-slate-800 dark:text-slate-200 max-w-[240px]">
                                                    {row.reason ? (
                                                        <span className="font-medium text-xs sm:text-sm line-clamp-2 block leading-relaxed" title={row.reason}>
                                                            "{row.reason}"
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-normal">—</span>
                                                    )}
                                                    {row.resolved_at && (
                                                        <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold font-mono block mt-1">
                                                            ✓ Resolved {row.resolved_at}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Routing */}
                                                <td className="py-4 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap font-bold text-xs sm:text-sm">
                                                    {row.routing}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    {row.status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-400/60 dark:border-amber-600/60 shadow-2xs">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span>Pending</span>
                                                        </span>
                                                    )}
                                                    {row.status === 'approved' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-400/60 dark:border-emerald-600/60 shadow-2xs">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                            <span>Approved</span>
                                                        </span>
                                                    )}
                                                    {row.status === 'rejected' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-400/60 dark:border-rose-600/60 shadow-2xs">
                                                            <XCircle className="w-3 h-3 text-rose-600" />
                                                            <span>Rejected</span>
                                                        </span>
                                                    )}
                                                    {row.status === 'cancelled' && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                                                            <span>Withdrawn</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Direct Action Column: Single-click prominent Withdraw button */}
                                                <td className="py-4 px-4 text-right whitespace-nowrap">
                                                    {isPending ? (
                                                        <button
                                                            type="button"
                                                            disabled={cancellingRequestId === row.id}
                                                            onClick={() => handleWithdrawRequest(row.id, row.request_type)}
                                                            className="text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                                                        >
                                                            {cancellingRequestId === row.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>Withdraw</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 font-semibold text-xs">—</span>
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
