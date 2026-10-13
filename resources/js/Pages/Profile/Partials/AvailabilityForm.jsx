import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
    Clock, 
    ShieldAlert, 
    CalendarPlus, 
    Calendar, 
    Building2, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    ArrowRight,
    History,
    RotateCcw
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';
import FileAbsenceModal from './FileAbsenceModal';

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

    const selectedStudio = joinedStudios.find(s => s.id === statusStudioId);

    // Keep currentStatus synchronized with incoming props and scope selection
    useEffect(() => {
        if (statusScope === 'specific' && selectedStudio) {
            setCurrentStatus(selectedStudio.working_status || 'active');
        } else {
            setCurrentStatus(user.working_status || 'active');
        }
    }, [statusScope, statusStudioId, selectedStudio, user.working_status]);

    // Modal state (Single unified modal)
    const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
    const [absenceInitialType, setAbsenceInitialType] = useState('leave');
    const [cancellingRequestId, setCancellingRequestId] = useState(null);

    // Client-side pagination state for ledger
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const totalRecords = leaveHistory.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const paginatedRecords = leaveHistory.slice(
        (currentPage - 1) * pageSize, 
        currentPage * pageSize
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // Detect scheduled upcoming approved leave (starts after today's date)
    const todayStr = new Date().toISOString().split('T')[0];

    const upcomingApprovedLeave = React.useMemo(() => {
        // 1. Look in leaveHistory for approved leave requests that start after today
        const matchingHistory = leaveHistory.find(item => {
            if (item.request_type !== 'leave' || item.status !== 'approved') return false;
            if (!item.leave_start_date) return false;
            if (statusScope === 'specific' && item.studio_id !== statusStudioId) return false;
            return item.leave_start_date > todayStr;
        });

        if (matchingHistory) {
            return {
                id: matchingHistory.id,
                startDate: matchingHistory.leave_start_date,
                endDate: matchingHistory.leave_end_date,
                studioName: matchingHistory.studio_name,
                reason: matchingHistory.reason,
            };
        }

        // 2. Fallback to studio pivot / user model dates
        const targetStart = statusScope === 'specific'
            ? selectedStudio?.leave_start_date
            : user.leave_start_date;
        const targetEnd = statusScope === 'specific'
            ? selectedStudio?.leave_end_date
            : user.leave_end_date;

        if (targetStart && targetStart > todayStr) {
            return {
                id: null,
                startDate: targetStart,
                endDate: targetEnd,
                studioName: statusScope === 'specific' ? selectedStudio?.name : 'All Studios',
                reason: null,
            };
        }

        return null;
    }, [leaveHistory, statusScope, statusStudioId, selectedStudio, user.leave_start_date, user.leave_end_date, todayStr]);

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

    // ── Open Unified Modal Helper ──
    const handleOpenAbsenceModal = (type = 'leave') => {
        setAbsenceInitialType(type);
        setIsAbsenceModalOpen(true);
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
        <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* ── Page Header & Top Primary Action ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800/90">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Availability & Status
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Manage your operational availability, scheduled leaves, and audit history.
                    </p>
                </div>

                {/* Single Primary Action Button */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleOpenAbsenceModal('leave')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-light active:bg-brand-dark text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer"
                    >
                        <CalendarPlus className="w-4 h-4" />
                        <span>File Absence</span>
                    </button>
                </div>
            </div>

            {/* ── Operational Status Card (Read-Only Display) ── */}
            <div className="bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xs p-6 sm:p-7 space-y-5">
                
                {/* Header & Scope Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Operational State
                            </h2>
                            {isUpdatingStatus && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Real-time sprint readiness and availability indicator.
                        </p>
                    </div>

                    {/* Scope Selector */}
                    {joinedStudios.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Scope:
                            </span>
                            <select
                                value={statusScope}
                                onChange={(e) => setStatusScope(e.target.value)}
                                className="text-xs py-1.5 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer focus:ring-1 focus:ring-brand"
                            >
                                <option value="all">All Studios</option>
                                <option value="specific">Specific Studio</option>
                            </select>

                            {statusScope === 'specific' && (
                                <select
                                    value={statusStudioId}
                                    onChange={(e) => setStatusStudioId(e.target.value)}
                                    className="text-xs py-1.5 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer max-w-[170px] truncate focus:ring-1 focus:ring-brand"
                                >
                                    {joinedStudios.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* Read-Only Status Indicator Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            <span className={`w-3 h-3 rounded-full ${
                                currentStatus === 'active' 
                                    ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' 
                                    : currentStatus === 'on_leave'
                                        ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
                                        : 'bg-rose-500 animate-pulse shadow-xs shadow-rose-500/50'
                            }`} />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize">
                                    {currentStatus === 'on_leave' ? 'On Leave' : currentStatus}
                                </span>
                                {currentStatus === 'on_leave' && user.leave_end_date && (
                                    <span className="text-xs font-mono font-medium text-amber-700 dark:text-amber-300">
                                        (until {formatDate(user.leave_end_date)})
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {currentStatus === 'active' && 'Available for sprint assignments and critical path tasks.'}
                                {currentStatus === 'on_leave' && 'Approved scheduled absence. Conclude early whenever ready.'}
                                {currentStatus === 'emergency' && 'Operational emergency active. Sprint leads have been alerted.'}
                            </p>
                        </div>
                    </div>

                    {/* Contextual Action: Return to Active (Only rendered when not active) */}
                    {currentStatus !== 'active' && (
                        <button
                            type="button"
                            onClick={handleInstantActiveToggle}
                            disabled={isUpdatingStatus}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return to Active</span>
                        </button>
                    )}
                </div>

                {/* Upcoming Approved Leave Callout */}
                {upcomingApprovedLeave && currentStatus === 'active' && (
                    <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sky-950 dark:text-sky-200">
                                        Upcoming Approved Leave ({upcomingApprovedLeave.studioName})
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-200/80 dark:bg-sky-800/80 text-sky-800 dark:text-sky-200">
                                        Scheduled
                                    </span>
                                </div>
                                <p className="text-sky-800/80 dark:text-sky-300/80 mt-0.5">
                                    Starts {formatDate(upcomingApprovedLeave.startDate)} → Concludes {formatDate(upcomingApprovedLeave.endDate)}. You remain Active until the leave begins.
                                </p>
                            </div>
                        </div>

                        {upcomingApprovedLeave.id && (
                            <button
                                type="button"
                                disabled={cancellingRequestId === upcomingApprovedLeave.id}
                                onClick={() => handleWithdrawRequest(upcomingApprovedLeave.id, 'leave')}
                                className="font-semibold text-xs px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1 disabled:opacity-50"
                            >
                                {cancellingRequestId === upcomingApprovedLeave.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <XCircle className="w-3 h-3" />
                                )}
                                <span>Cancel Leave</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Pending Request Alert Callouts (If any request is awaiting review) */}
                {(hasPendingEmergency || hasPendingLeave) && (
                    <div className="space-y-2 pt-1">
                        {pendingEmergencyRequests.map(req => (
                            <div key={`pending-em-${req.id}`} className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span className="font-semibold text-rose-950 dark:text-rose-200 truncate">
                                        Emergency Declaration Pending Review ({req.studioName})
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    disabled={cancellingRequestId === req.id}
                                    onClick={() => handleWithdrawRequest(req.id, 'emergency')}
                                    className="font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer shrink-0"
                                >
                                    Withdraw
                                </button>
                            </div>
                        ))}

                        {pendingLeaveRequests.map(req => (
                            <div key={`pending-lv-${req.id}`} className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span className="font-semibold text-amber-950 dark:text-amber-200 truncate">
                                        Leave Request Pending Review ({req.studioName}: {formatDate(req.leave_start_date)} → {formatDate(req.leave_end_date)})
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    disabled={cancellingRequestId === req.id}
                                    onClick={() => handleWithdrawRequest(req.id, 'leave')}
                                    className="font-bold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer shrink-0"
                                >
                                    Withdraw
                                </button>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* ── Availability & Leave Ledger (Paginated) ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <History className="w-4 h-4 text-brand" />
                            <span>Availability & Leave Ledger</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Audit trail of submitted leaves, emergency declarations, and withdrawals.
                        </p>
                    </div>

                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                        {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
                    </span>
                </div>

                {/* Ledger Table Container */}
                <div className="bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xs overflow-hidden">
                    {totalRecords === 0 ? (
                        <div className="py-14 px-6 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                No Ledger Records Found
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                                Submitted leave requests and emergency declarations will appear in this ledger.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                                            <th scope="col" className="py-3 px-4 font-semibold">Type</th>
                                            <th scope="col" className="py-3 px-4 font-semibold">Date Range</th>
                                            <th scope="col" className="py-3 px-4 font-semibold">Studio</th>
                                            <th scope="col" className="py-3 px-4 font-semibold">Reason</th>
                                            <th scope="col" className="py-3 px-4 font-semibold">Routing</th>
                                            <th scope="col" className="py-3 px-4 font-semibold">Status</th>
                                            <th scope="col" className="py-3 px-4 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {paginatedRecords.map((row) => {
                                            const isPending = row.status === 'pending';
                                            const isEmergencyRecord = row.request_type === 'emergency';

                                            return (
                                                <tr 
                                                    key={row.id}
                                                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    {/* Request Type */}
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        {isEmergencyRecord ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                                                <span>Emergency</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                                <Calendar className="w-3 h-3 text-amber-600" />
                                                                <span>Leave</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Date Range */}
                                                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{formatDate(row.leave_start_date)}</span>
                                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                                            <span>{row.leave_end_date ? formatDate(row.leave_end_date) : 'Open / TBD'}</span>
                                                        </div>
                                                        {row.created_at && (
                                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                                {row.created_at}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Studio */}
                                                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 font-medium">
                                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{row.studio_name}</span>
                                                        </div>
                                                    </td>

                                                    {/* Reason & Context */}
                                                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[220px]">
                                                        {row.reason ? (
                                                            <span className="line-clamp-2 leading-relaxed" title={row.reason}>
                                                                "{row.reason}"
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 font-normal">—</span>
                                                        )}
                                                        {row.resolved_at && (
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                                                                ✓ Resolved {row.resolved_at}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Routing */}
                                                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                                                        {row.routing}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        {row.status === 'pending' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                                <Clock className="w-3 h-3 text-amber-600" />
                                                                <span>Pending</span>
                                                            </span>
                                                        )}
                                                        {row.status === 'approved' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                <span>Approved</span>
                                                            </span>
                                                        )}
                                                        {row.status === 'rejected' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                                <XCircle className="w-3 h-3 text-rose-600" />
                                                                <span>Rejected</span>
                                                            </span>
                                                        )}
                                                        {row.status === 'cancelled' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                <span>Withdrawn</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Action Column */}
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        {isPending ? (
                                                            <button
                                                                type="button"
                                                                disabled={cancellingRequestId === row.id}
                                                                onClick={() => handleWithdrawRequest(row.id, row.request_type)}
                                                                className="text-xs font-semibold px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                {cancellingRequestId === row.id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="w-3 h-3" />
                                                                )}
                                                                <span>Withdraw</span>
                                                            </button>
                                                        ) : (row.status === 'approved' && row.request_type === 'leave' && row.leave_start_date && row.leave_start_date > todayStr) ? (
                                                            <button
                                                                type="button"
                                                                disabled={cancellingRequestId === row.id}
                                                                onClick={() => handleWithdrawRequest(row.id, 'leave')}
                                                                className="text-xs font-semibold px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                                                title="Cancel upcoming scheduled leave"
                                                            >
                                                                {cancellingRequestId === row.id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="w-3 h-3" />
                                                                )}
                                                                <span>Cancel</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400 font-semibold">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                    Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
                                </span>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold"
                                        >
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                                        currentPage === page
                                                            ? 'bg-brand text-white shadow-2xs font-bold'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Unified File Absence Modal ── */}
            <FileAbsenceModal
                isOpen={isAbsenceModalOpen}
                onClose={() => setIsAbsenceModalOpen(false)}
                joinedStudios={joinedStudios}
                initialScope={statusScope}
                initialStudioId={statusStudioId}
                initialType={absenceInitialType}
            />

        </div>
    );
}
