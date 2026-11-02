import React, { useState, useMemo, useEffect, Component } from 'react';
import axios from 'axios';
import {
    X, Download, Loader2, BarChart3, FileText, CheckCircle2,
    Calendar, Clock, Shield, AlertTriangle, User, Users,
    FolderKanban, Sparkles, ExternalLink
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell,
    AreaChart, Area
} from 'recharts';
import { showToast } from '@/Components/SystemToast';

// ── Error Boundary to prevent any chart or render error from turning screen white ──
class ReportModalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('SharedReportModal Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xl w-full max-w-lg p-6 space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Unable to Display Report Preview
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                An unexpected issue occurred while rendering the interactive report charts.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    this.props.onClose?.();
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ── Main Shared Report Modal Component ──────────────────────────────────────────
export default function SharedReportModal(props) {
    return (
        <ReportModalErrorBoundary onClose={props.onClose}>
            <SharedReportModalInner {...props} />
        </ReportModalErrorBoundary>
    );
}

function SharedReportModalInner({
    isOpen,
    onClose,
    reportAttachment,
    workspaceSlug = 'indiecraft-studios',
    studioName = 'SprintStudio',
}) {
    // ── ALL HOOKS MUST RUN UNCONDITIONALLY AT THE TOP BEFORE ANY EARLY RETURN ──
    const [isDownloading, setIsDownloading] = useState(false);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Defensive resolution of payload
    const rawData = useMemo(() => {
        if (!reportAttachment) return {};
        return reportAttachment.report_data || reportAttachment || {};
    }, [reportAttachment]);

    const reportTitle = useMemo(() => {
        const raw = rawData.title || rawData.report_title || reportAttachment?.report_title || reportAttachment?.name?.replace(/\.pdf$/i, '');
        return typeof raw === 'string' && raw.trim().length > 0 ? raw : 'Executive Performance Report';
    }, [rawData, reportAttachment]);

    const reportType = useMemo(() => {
        const t = rawData.type || rawData.scope || reportAttachment?.scope;
        return typeof t === 'string' ? t : 'project_summary';
    }, [rawData, reportAttachment]);

    const projectName = useMemo(() => {
        if (typeof rawData.project_name === 'string' && rawData.project_name.trim().length > 0) {
            return rawData.project_name;
        }
        if (typeof reportAttachment?.project_name === 'string' && reportAttachment.project_name.trim().length > 0) {
            return reportAttachment.project_name;
        }
        if (rawData.employee && typeof rawData.employee === 'object' && rawData.employee.name) {
            return `${rawData.employee.name}'s Scope`;
        }
        return 'Project';
    }, [rawData, reportAttachment]);

    const sprintName = useMemo(() => {
        return rawData.sprint_name || reportAttachment?.sprint_name || null;
    }, [rawData, reportAttachment]);

    const completionRate = Number(rawData.completion_rate ?? reportAttachment?.completion_rate ?? 0);
    const totalTasks = Number(rawData.total_tasks ?? reportAttachment?.total_tasks ?? 0);
    const completedTasks = Number(rawData.completed_tasks ?? reportAttachment?.completed_tasks ?? 0);
    const unfinishedTasks = Number(rawData.unfinished_tasks ?? Math.max(0, totalTasks - completedTasks));
    const overdueTasks = Number(rawData.overdue_tasks ?? 0);
    const completedSP = Number(rawData.completed_story_points ?? reportAttachment?.completed_story_points ?? 0);
    const plannedSP = Number(rawData.planned_story_points ?? reportAttachment?.planned_story_points ?? completedSP);
    const orientation = String(rawData.orientation || reportAttachment?.orientation || 'portrait');
    const reportingPeriod = String(rawData.reporting_period || 'Current Evaluation Period');
    const generatedAt = rawData.generated_at ? new Date(rawData.generated_at).toLocaleDateString() : new Date().toLocaleDateString();

    const documentRef = useMemo(() => {
        if (rawData.id) return String(rawData.id);
        if (reportAttachment?.report_id) return String(reportAttachment.report_id);
        return String(Math.abs(String(reportTitle).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))).slice(0, 6);
    }, [rawData, reportAttachment, reportTitle]);

    const reportSummary = useMemo(() => {
        if (typeof rawData.summary === 'string' && rawData.summary.trim().length > 0) {
            return rawData.summary;
        }
        if (typeof rawData.executive_insight === 'string' && rawData.executive_insight.trim().length > 0) {
            return rawData.executive_insight;
        }
        return 'Standardized performance intelligence report compiled for team review and governance.';
    }, [rawData]);

    // Compute status distribution for donut chart
    const statusDistribution = useMemo(() => {
        if (!reportAttachment) return [];

        let completed = 0;
        let inProgress = 0;
        let review = 0;
        let todo = 0;

        if (Array.isArray(rawData.audit_tasks) && rawData.audit_tasks.length > 0) {
            rawData.audit_tasks.forEach(t => {
                const st = String(t.status || '').toLowerCase();
                if (st === 'completed' || st === 'done') completed++;
                else if (st === 'in_progress') inProgress++;
                else if (st === 'review' || st === 'in_review') review++;
                else todo++;
            });
        } else {
            completed = completedTasks;
            inProgress = Number(rawData.in_progress_tasks ?? Math.max(0, totalTasks - completed - overdueTasks));
            review = Number(rawData.review_tasks ?? 0);
            todo = Number(rawData.todo_tasks ?? Math.max(0, totalTasks - completed - inProgress - review));
        }

        const items = [
            { name: 'Completed', value: completed, color: '#059669' },
            { name: 'In Progress', value: inProgress, color: '#2563eb' },
            { name: 'In Review', value: review, color: '#d97706' },
            { name: 'To Do', value: todo, color: '#94a3b8' },
        ].filter(item => item.value > 0);

        return items.length > 0 ? items : [{ name: 'Resolved', value: completedTasks || 1, color: '#059669' }];
    }, [reportAttachment, rawData, totalTasks, completedTasks, overdueTasks]);

    // Trend trajectory data
    const deliveryTrendData = useMemo(() => {
        if (!reportAttachment) return [];

        const comparisons = rawData.sprint_comparison || rawData.sprints_comparison || rawData.sprint_trends;
        if (Array.isArray(comparisons) && comparisons.length > 0) {
            let cumPlanned = 0;
            let cumDelivered = 0;
            return comparisons.map((item, idx) => {
                cumPlanned += Number(item.planned_sp ?? item.planned ?? item.assigned_sp ?? 0);
                cumDelivered += Number(item.completed_sp ?? item.delivered ?? item.actual_sp ?? 0);
                return {
                    name: String(item.name || item.sprint_name || `Sprint ${idx + 1}`),
                    planned: cumPlanned,
                    delivered: cumDelivered,
                };
            });
        }
        return [
            { name: 'Start', planned: 0, delivered: 0 },
            { name: 'Mid', planned: Math.round(plannedSP * 0.5), delivered: Math.round(completedSP * 0.4) },
            { name: 'Current', planned: Math.max(0, plannedSP), delivered: Math.max(0, completedSP) },
        ];
    }, [reportAttachment, rawData, plannedSP, completedSP]);

    // Download PDF Action
    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const downloadPayload = {
                metrics: {
                    ...rawData,
                    title: reportTitle,
                    project_name: projectName,
                    sprint_name: sprintName,
                    completion_rate: completionRate,
                    total_tasks: totalTasks,
                    completed_tasks: completedTasks,
                    completed_story_points: completedSP,
                    planned_story_points: plannedSP,
                    orientation,
                },
                orientation,
            };

            const response = await axios.post(
                `/studio/${workspaceSlug}/reports/download-pdf`,
                downloadPayload,
                { responseType: 'blob' }
            );

            let filename = `${reportTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.pdf`;
            const disposition = response.headers['content-disposition'];
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            showToast('Executive PDF downloaded successfully.', 'success');
        } catch (error) {
            console.error('PDF Download Error:', error);
            showToast('Failed to download report PDF. Please try again.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    // ── SAFE EARLY RETURN: NOW GUARANTEED TO RUN AFTER ALL HOOKS ──
    if (!isOpen || !reportAttachment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
            {/* Modal Dialog Card - Beautifully sized to max-w-4xl, with clean border radius and shadow */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                
                {/* Modal Top Header Toolbar */}
                <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand flex items-center justify-center shrink-0 shadow-2xs">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {reportTitle}
                                </h2>
                                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light">
                                    {reportType.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {projectName} {sprintName ? `• ${sprintName}` : ''} • Shared in WorkSync Chat
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark flex items-center gap-1.5 shadow-sm shadow-brand/20 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Download as PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Close Modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Scrollable Body - Seamlessly aligned cards spanning the container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7 space-y-5 bg-slate-50/40 dark:bg-slate-950/40">
                    
                    {/* 1. Header Banner & Document Meta */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                    WS
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                                    {studioName} &bull; Executive Engineering Operations
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                                {reportTitle}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {reportSummary}
                            </p>
                        </div>

                        <div className="border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2.5 text-left sm:text-right space-y-1 text-[11px] min-w-[180px] shrink-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Document Control
                            </div>
                            <div className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                REF: WS-RPT-{documentRef}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                                {generatedAt}
                            </div>
                            <div className="text-[10px] text-brand dark:text-brand-light font-semibold">
                                {reportingPeriod}
                            </div>
                        </div>
                    </div>

                    {/* 2. Metadata Ribbon */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Scope / Target</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block mt-0.5 text-xs">
                                {projectName}
                            </strong>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Report Type</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block capitalize mt-0.5 text-xs">
                                {reportType.replace(/_/g, ' ')}
                            </strong>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Delivery Adherence</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block font-mono mt-0.5 text-xs">
                                {completionRate}% Resolved
                            </strong>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Status</span>
                            <span className={`inline-flex items-center gap-1 font-bold text-[11px] mt-0.5 ${
                                overdueTasks > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                                {overdueTasks > 0 ? 'Action Required' : 'On Track'}
                            </span>
                        </div>
                    </div>

                    {/* 3. Executive KPI Scorecard */}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                            Executive Performance Summary
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            <div className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                                    Delivery Adherence
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                                    {completionRate}%
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    {completedTasks} of {totalTasks} tasks resolved
                                </div>
                            </div>

                            <div className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                                    Velocity Delivered
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                                    {completedSP} <span className="text-xs font-normal text-slate-400">SP</span>
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    of {plannedSP} SP planned
                                </div>
                            </div>

                            <div className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                                    Unresolved Scope
                                </div>
                                <div className={`text-2xl font-bold font-mono ${
                                    overdueTasks > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                                }`}>
                                    {unfinishedTasks}
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    {overdueTasks > 0 ? `${overdueTasks} overdue items` : '0 overdue items'}
                                </div>
                            </div>

                            <div className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs">
                                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                                    Total Scope
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                                    {totalTasks}
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    Tracked work units
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Visual Charts: Scope Donut & Trajectory Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Scope & Status Allocation Donut */}
                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between">
                            <div className="mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                    Scope &amp; Status Allocation
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Workflow distribution across {totalTasks} total tasks
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-1">
                                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                                    {statusDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                                <Pie
                                                    data={statusDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={38}
                                                    outerRadius={56}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="#ffffff"
                                                    strokeWidth={2}
                                                >
                                                    {statusDistribution.map((entry, index) => (
                                                        <Cell key={`status-cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #cbd5e1' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-xs text-slate-400">No data</div>
                                    )}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-white leading-none">
                                            {completionRate}%
                                        </span>
                                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                                            Done
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2">
                                    {statusDistribution.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className="text-slate-600 dark:text-slate-300 truncate text-[11px] font-medium">{item.name}</span>
                                            </div>
                                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                                                {item.value} <span className="text-slate-400 text-[10px] font-normal">({totalTasks ? Math.round((item.value / totalTasks) * 100) : 0}%)</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cumulative Trajectory Area Chart */}
                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between">
                            <div className="mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                    Delivery Trajectory
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Planned target curve vs. actual story points delivered
                                </p>
                            </div>

                            <div className="h-44 w-full pt-1">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <AreaChart
                                        data={deliveryTrendData}
                                        margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="deliveryFillGradShared" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.16} />
                                                <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 'auto']} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #cbd5e1' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="planned"
                                            name="Planned SP"
                                            stroke="#94a3b8"
                                            strokeWidth={1.5}
                                            strokeDasharray="4 4"
                                            fill="none"
                                            dot={{ r: 2, fill: '#94a3b8' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="delivered"
                                            name="Delivered SP"
                                            stroke="#0f172a"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#deliveryFillGradShared)"
                                            dot={{ r: 3, fill: '#0f172a' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 5. Sprint Velocity Comparison Bar Chart (if multi-sprint or sprint data present) */}
                    {((rawData.sprint_comparison?.length > 0) || (rawData.sprints_comparison?.length > 0)) && (
                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                    Sprint Velocity &amp; Commitment Adherence
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Planned vs. Delivered Story Points across evaluated sprints
                                </p>
                            </div>
                            <div className="h-48 w-full pt-1">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <BarChart
                                        data={rawData.sprint_comparison || rawData.sprints_comparison}
                                        barCategoryGap="30%"
                                        margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #cbd5e1' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                        <Bar dataKey="planned_sp" name="Planned SP" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="completed_sp" name="Delivered SP" fill="#1e293b" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* 6. Itemized Task Breakdown Table (if audit_tasks present) */}
                    {Array.isArray(rawData.audit_tasks) && rawData.audit_tasks.length > 0 && (
                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                    Detailed Task Audit Log
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Itemized breakdown of scope items ({rawData.audit_tasks.length} total tasks)
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                                            <th className="py-2.5 px-3.5">Key</th>
                                            <th className="py-2.5 px-3.5">Summary</th>
                                            <th className="py-2.5 px-3.5">Assignee</th>
                                            <th className="py-2.5 px-3.5">Status</th>
                                            <th className="py-2.5 px-3.5">Due Date</th>
                                            <th className="py-2.5 px-3.5 text-right">SP</th>
                                            <th className="py-2.5 px-3.5 text-right">Delivery Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {rawData.audit_tasks.map((t, idx) => {
                                            const assigneeName = typeof t.assigned_employee === 'object'
                                                ? (t.assigned_employee?.name || 'Unassigned')
                                                : (t.assigned_employee || 'Unassigned');
                                            const onTimeText = typeof t.on_time_status === 'string'
                                                ? t.on_time_status.replace(/_/g, ' ')
                                                : 'Normal';

                                            return (
                                                <tr key={t.id || idx} className={idx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-850/30' : 'bg-white dark:bg-slate-900'}>
                                                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                        WS-{t.id}
                                                    </td>
                                                    <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-white max-w-[220px] truncate" title={t.title}>
                                                        {t.title}
                                                    </td>
                                                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                                                        {assigneeName}
                                                    </td>
                                                    <td className="py-2.5 px-3.5">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            t.status === 'completed'
                                                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                                                : t.status === 'in_progress'
                                                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                        }`}>
                                                            {String(t.status || 'todo')}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                                                        {t.deadline || '—'}
                                                    </td>
                                                    <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300 text-right font-semibold">
                                                        {t.final_sp ?? 0}
                                                    </td>
                                                    <td className={`py-2.5 px-3.5 font-semibold text-[10px] uppercase text-right ${
                                                        t.on_time_status === 'on_time'
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : t.on_time_status === 'late'
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : t.on_time_status === 'overdue'
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : 'text-slate-500'
                                                    }`}>
                                                        {onTimeText}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 7. Sign-off Governance Footer */}
                    <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 gap-2 px-1">
                        <div>
                            WorkSync Project Intelligence System &bull; Confidential &bull; For Authorized Studio Eyes Only
                        </div>
                        <div className="font-mono">
                            Verified: {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
