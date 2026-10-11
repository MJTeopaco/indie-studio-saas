import React, { useState, useEffect } from 'react';
import { AlertDialog } from '@/Components/ui/alert-dialog';
import { Calendar, User, Clock, AlertTriangle, FileText } from 'lucide-react';

/**
 * Reusable Leave Approval / Decline Confirmation Dialog.
 * Displays formatted leave request details (employee name, leave type, dates, notes)
 * and supports approve (brand) and decline (destructive) actions with loading states.
 */
export default function LeaveApprovalConfirmDialog({
    isOpen,
    onClose,
    leaveRequest,
    onConfirm,
    mode = 'approve', // 'approve' | 'reject'
    isLoading = false,
}) {
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRejectionReason('');
        }
    }, [isOpen]);

    if (!leaveRequest) return null;

    const isApprove = mode === 'approve';
    const title = isApprove ? 'Approve Leave Request' : 'Decline Leave Request';
    const description = isApprove
        ? 'Please review the employee leave request details before granting approval.'
        : 'Please confirm declining this leave request. You can optionally include feedback or recommended alternative dates.';

    const confirmText = isApprove
        ? (isLoading ? 'Approving...' : 'Approve Request')
        : (isLoading ? 'Declining...' : 'Decline Request');

    const handleConfirm = () => {
        if (isApprove) {
            onConfirm(leaveRequest);
        } else {
            onConfirm(leaveRequest.id, rejectionReason);
        }
    };

    const startDate = leaveRequest.leave_start_formatted || leaveRequest.leave_start_date || 'Start Date';
    const endDate = leaveRequest.leave_end_formatted || leaveRequest.leave_end_date || 'End Date';
    const leaveType = leaveRequest.leave_type || leaveRequest.type_label || 'Leave of Absence';
    const employeeName = leaveRequest.user_name || leaveRequest.employee_name || 'Team Member';
    const duration = leaveRequest.duration_days ? `${leaveRequest.duration_days} day(s)` : null;
    const hasConflicts = leaveRequest.conflicting_tasks && leaveRequest.conflicting_tasks.length > 0;

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            confirmText={confirmText}
            cancelText="Cancel"
            onConfirm={handleConfirm}
            variant={isApprove ? 'primary' : 'destructive'}
            isLoading={isLoading}
        >
            {/* Request Details Summary Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light flex items-center justify-center font-bold text-xs shrink-0">
                            {employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {employeeName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                                {leaveType}
                            </p>
                        </div>
                    </div>

                    {duration && (
                        <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {duration}
                        </span>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span><strong>Dates:</strong> {startDate} → {endDate}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span><strong>Submitted:</strong> {leaveRequest.created_at_human || 'Recently'}</span>
                    </div>
                </div>

                {leaveRequest.reason && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                            Employee Reason / Note:
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                            "{leaveRequest.reason}"
                        </p>
                    </div>
                )}

                {hasConflicts && isApprove && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                            Notice: {leaveRequest.conflicting_tasks.length} sprint task(s) have deadlines during this leave window. Approving will require reassigning or rescheduling those tasks.
                        </span>
                    </div>
                )}
            </div>

            {/* Optional Rejection Reason Input when declining */}
            {!isApprove && (
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Reason or Guidance (Optional)
                    </label>
                    <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain reason for declining or suggest alternative dates..."
                        disabled={isLoading}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 resize-none transition-colors"
                    />
                </div>
            )}
        </AlertDialog>
    );
}
