import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import axios from 'axios';
import {
    BarChart3,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    Send,
    Mail,
    Download,
    Printer,
    Layers,
    User,
    ChevronDown,
    Search,
    Filter,
    Shield,
    Flame,
    Zap,
    MessageSquare,
    ExternalLink,
    X,
    Check,
    Loader2,
    RefreshCw,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from 'recharts';
import { showToast } from '@/Components/SystemToast';

const PIE_COLORS = {
    completed: '#10b981', // emerald
    in_progress: '#6366f1', // indigo
    overdue: '#f43f5e', // rose
    todo: '#94a3b8', // slate
};

const PRIORITY_COLORS = {
    Low: '#94a3b8',
    Medium: '#3b82f6',
    High: '#f59e0b',
    Critical: '#ef4444',
};

const DIFFICULTY_COLORS = {
    Easy: '#10b981',
    Medium: '#6366f1',
    Hard: '#ec4899',
};

export default function ReportsIndex({
    studio,
    projects = [],
    teamMembers = [],
    initialProjectId = null,
    initialSprintId = null,
    initialReportData = null,
}) {
    const { activeWorkspace, auth } = usePage().props;
    const workspaceSlug = studio?.id || activeWorkspace;

    // Filters
    const [selectedProjectId, setSelectedProjectId] = useState(
        initialProjectId || (projects.length > 0 ? projects[0].id : '')
    );
    const [selectedSprintId, setSelectedSprintId] = useState(
        initialSprintId || 'all'
    );
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'audit' | 'team'

    // Report data & loading
    const [report, setReport] = useState(initialReportData);
    const [loading, setLoading] = useState(false);

    // Modals
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [chatModalOpen, setChatModalOpen] = useState(false);

    // Email share form
    const [recipientEmail, setRecipientEmail] = useState('');
    const [emailNote, setEmailNote] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailError, setEmailError] = useState(null);

    // Chat share form
    const [chatRecipientType, setChatRecipientType] = useState('dm'); // 'dm' | 'channel'
    const [chatRecipientId, setChatRecipientId] = useState(
        teamMembers.length > 0 ? String(teamMembers[0].id) : 'ch-general'
    );
    const [chatNote, setChatNote] = useState('');
    const [sendingChat, setSendingChat] = useState(false);

    // Audit table search & filters
    const [auditSearch, setAuditSearch] = useState('');
    const [auditStatusFilter, setAuditStatusFilter] = useState('all');

    // Currently selected project model
    const currentProject = useMemo(() => {
        return projects.find((p) => String(p.id) === String(selectedProjectId)) || null;
    }, [projects, selectedProjectId]);

    // Available sprints for the selected project
    const projectSprints = useMemo(() => {
        return currentProject?.sprints || [];
    }, [currentProject]);

    // Fetch report metrics
    const fetchReport = async (projId, spId) => {
        if (!projId || !workspaceSlug) return;
        setLoading(true);
        try {
            const scope = spId === 'all' || !spId ? 'project' : 'sprint';
            const res = await axios.get(`/studio/${workspaceSlug}/reports/data`, {
                params: {
                    project_id: projId,
                    sprint_id: spId,
                    scope,
                },
            });
            if (res.data?.data) {
                setReport(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load report data:', err);
            showToast('Failed to load report data. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // When project changes, reset sprint selection if needed
    const handleProjectChange = (e) => {
        const newProjId = e.target.value;
        setSelectedProjectId(newProjId);
        setSelectedSprintId('all');
        fetchReport(newProjId, 'all');
    };

    // When sprint changes
    const handleSprintChange = (e) => {
        const newSprintId = e.target.value;
        setSelectedSprintId(newSprintId);
        fetchReport(selectedProjectId, newSprintId);
    };

    // Send via Email
    const handleSendEmail = async (e) => {
        e.preventDefault();
        setEmailError(null);
        if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        setSendingEmail(true);
        try {
            const res = await axios.post(`/studio/${workspaceSlug}/reports/share-email`, {
                recipient_email: recipientEmail.trim(),
                project_id: selectedProjectId,
                sprint_id: selectedSprintId,
                scope: selectedSprintId === 'all' ? 'project' : 'sprint',
                personal_note: emailNote.trim(),
            });

            if (res.data?.success) {
                showToast(res.data.message || 'Report sent successfully via email!', 'success');
                setEmailModalOpen(false);
                setRecipientEmail('');
                setEmailNote('');
            } else {
                setEmailError(res.data?.message || 'Failed to send report.');
            }
        } catch (err) {
            const rawError = err.response?.data?.message || err.response?.data?.errors?.recipient_email?.[0] || '';
            const isTechnicalError = !rawError || rawError.includes('scheme') || rawError.includes('log mode') || rawError.includes('MAIL_') || rawError.includes('Exception') || rawError.includes('Symfony');
            const userFriendlyMsg = isTechnicalError ? 'Unable to send email right now. Please check the recipient address and try again.' : rawError;
            setEmailError(userFriendlyMsg);
        } finally {
            setSendingEmail(false);
        }
    };

    // Send via In-System Chat
    const handleSendChat = async (e) => {
        e.preventDefault();
        setSendingChat(true);
        try {
            const res = await axios.post(`/studio/${workspaceSlug}/reports/share-chat`, {
                recipient_type: chatRecipientType,
                recipient_id: chatRecipientId,
                project_id: selectedProjectId,
                sprint_id: selectedSprintId,
                scope: selectedSprintId === 'all' ? 'project' : 'sprint',
                personal_note: chatNote.trim(),
            });

            if (res.data?.success) {
                showToast('Report shared in chat successfully!', 'success');
                setChatModalOpen(false);
                setChatNote('');
            }
        } catch (err) {
            console.error('Failed to share in chat:', err);
            showToast('Failed to share report in chat.', 'error');
        } finally {
            setSendingChat(false);
        }
    };

    // Export CSV
    const handleExportCsv = () => {
        if (!selectedProjectId) return;
        const url = `/studio/${workspaceSlug}/reports/export-csv?project_id=${selectedProjectId}&sprint_id=${selectedSprintId}&scope=${selectedSprintId === 'all' ? 'project' : 'sprint'}`;
        window.open(url, '_blank');
    };

    // Direct PDF download using html2pdf with zero-offset isolated container rendering
    const downloadPdfDirectly = () => {
        if (!report) {
            showToast('No report data available to export.', 'warning');
            return;
        }

        const executeDownload = () => {
            const sourceElement = document.getElementById('report-print-sheet');
            if (!sourceElement || !window.html2pdf) {
                window.print();
                return;
            }

            const rawName = report.title || `${currentProject?.name || 'project'}_report`;
            const cleanFilename = `${rawName.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.pdf`;

            // Create an isolated zero-offset render container at (0, 0) to avoid screen offset / clipping
            const exportContainer = document.createElement('div');
            exportContainer.id = 'html2pdf-render-stage';
            exportContainer.style.position = 'fixed';
            exportContainer.style.left = '0px';
            exportContainer.style.top = '0px';
            exportContainer.style.width = '794px';
            exportContainer.style.minWidth = '794px';
            exportContainer.style.maxWidth = '794px';
            exportContainer.style.margin = '0px';
            exportContainer.style.padding = '0px';
            exportContainer.style.backgroundColor = '#ffffff';
            exportContainer.style.zIndex = '999999';
            exportContainer.style.overflow = 'visible';

            const clone = sourceElement.cloneNode(true);
            clone.id = 'pdf-render-clone';
            clone.style.margin = '0px';
            clone.style.width = '794px';
            clone.style.minWidth = '794px';
            clone.style.maxWidth = '794px';
            clone.style.padding = '32px';
            clone.style.boxSizing = 'border-box';
            clone.style.backgroundColor = '#ffffff';
            clone.style.color = '#0f172a';
            clone.style.transform = 'none';

            exportContainer.appendChild(clone);
            document.body.appendChild(exportContainer);

            const opt = {
                margin: [0.25, 0.25, 0.25, 0.25],
                filename: cleanFilename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: 794,
                    windowWidth: 794,
                    x: 0,
                    y: 0,
                    scrollX: 0,
                    scrollY: 0,
                },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            };

            const cleanup = () => {
                if (document.body.contains(exportContainer)) {
                    document.body.removeChild(exportContainer);
                }
            };

            window.html2pdf()
                .set(opt)
                .from(clone)
                .save()
                .then(() => {
                    cleanup();
                })
                .catch((err) => {
                    console.error('html2pdf generation error:', err);
                    cleanup();
                    window.print();
                });
        };

        if (window.html2pdf) {
            executeDownload();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = executeDownload;
            script.onerror = () => window.print();
            document.head.appendChild(script);
        }
    };

    // Audit Tasks Filtered
    const filteredAuditTasks = useMemo(() => {
        if (!report?.audit_tasks) return [];
        return report.audit_tasks.filter((t) => {
            const matchesSearch =
                auditSearch === '' ||
                t.title.toLowerCase().includes(auditSearch.toLowerCase()) ||
                t.assigned_employee.toLowerCase().includes(auditSearch.toLowerCase()) ||
                (t.completed_by_employee && t.completed_by_employee.toLowerCase().includes(auditSearch.toLowerCase()));

            let matchesStatus = true;
            if (auditStatusFilter === 'completed') matchesStatus = t.status === 'completed';
            else if (auditStatusFilter === 'on_time') matchesStatus = t.on_time_status === 'on_time';
            else if (auditStatusFilter === 'late') matchesStatus = t.on_time_status === 'late';
            else if (auditStatusFilter === 'overdue') matchesStatus = t.on_time_status === 'overdue';
            else if (auditStatusFilter === 'in_progress') matchesStatus = t.status !== 'completed';

            return matchesSearch && matchesStatus;
        });
    }, [report, auditSearch, auditStatusFilter]);

    // Donut chart data: Completed vs In Progress vs Overdue
    const taskStatusPieData = useMemo(() => {
        if (!report) return [];
        return [
            { name: 'Completed', value: report.completed_tasks, color: PIE_COLORS.completed },
            { name: 'In Progress', value: Math.max(0, report.unfinished_tasks - report.overdue_tasks), color: PIE_COLORS.in_progress },
            { name: 'Overdue', value: report.overdue_tasks, color: PIE_COLORS.overdue },
        ].filter((item) => item.value > 0);
    }, [report]);

    // Priority chart data
    const priorityBarData = useMemo(() => {
        if (!report?.priority_distribution) return [];
        return Object.entries(report.priority_distribution).map(([key, val]) => ({
            name: key,
            count: val,
            fill: PRIORITY_COLORS[key] || '#6366f1',
        }));
    }, [report]);

    // Employee tasks & SP chart data
    const employeeChartData = useMemo(() => {
        if (!report?.employee_performance) return [];
        return report.employee_performance.slice(0, 8).map((emp) => ({
            name: emp.name.split(' ')[0], // First name for neat labels
            Completed: emp.completed_count,
            Assigned: emp.assigned_count,
            SP: emp.completed_sp,
        }));
    }, [report]);

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title={`Reports & Analytics — ${studio?.name || 'Studio'}`} />

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 select-none print:p-0 print:bg-white">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* ── Top Header & Action Controls ── */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs print:border-none print:shadow-none">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-brand flex items-center justify-center text-white shadow-xs">
                                    <BarChart3 className="w-4 h-4" />
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    Reports & Analytics
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Real-time, data-driven Sprint performance audits, delivery timelines, and employee contributions.
                            </p>
                        </div>

                        {/* Action buttons (hidden when printing) */}
                        <div className="flex items-center gap-2 flex-wrap print:hidden">
                            <button
                                type="button"
                                onClick={() => setChatModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand/10 dark:bg-brand/20 text-brand hover:bg-brand/20 transition-all shadow-2xs"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Share to Chat</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setEmailModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-2xs"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Email Report</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleExportCsv}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-2xs"
                                title="Export spreadsheet data"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export CSV</span>
                            </button>

                            <button
                                type="button"
                                onClick={downloadPdfDirectly}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-all shadow-2xs"
                                title="Export clean, executive PDF document"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Export as PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Selection & Scope Bar ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs print:hidden">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            {/* Project Picker */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="project-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Project:
                                </label>
                                <select
                                    id="project-select"
                                    value={selectedProjectId}
                                    onChange={handleProjectChange}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none focus:ring-2 focus:ring-brand cursor-pointer"
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Scope / Sprint Picker */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="sprint-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Sprint:
                                </label>
                                <select
                                    id="sprint-select"
                                    value={selectedSprintId}
                                    onChange={handleSprintChange}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none focus:ring-2 focus:ring-brand cursor-pointer"
                                >
                                    <option value="all">Entire Project (Aggregate)</option>
                                    {projectSprints.map((sp) => (
                                        <option key={sp.id} value={sp.id}>
                                            {sp.name} {sp.status === 'active' ? '⚡ (Active)' : `(${sp.status})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* View Tabs */}
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                            {[
                                { id: 'overview', label: 'Overview & Charts', icon: BarChart3 },
                                { id: 'audit', label: `Sprint Audit (${report?.total_tasks ?? 0})`, icon: Shield },
                                { id: 'team', label: `Team Matrix (${report?.employee_performance?.length ?? 0})`, icon: User },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            isActive
                                                ? 'bg-white dark:bg-slate-900 text-brand shadow-xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Report Metadata Banner ── */}
                    {report && (
                        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                                    {report.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                                    {report.scope === 'sprint' ? 'Sprint Report' : 'Project Aggregate'}
                                </span>
                                {report.start_date && (
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {report.start_date} – {report.end_date}
                                    </span>
                                )}
                            </div>
                            <span className="text-slate-400 text-[11px]">
                                Generated: {report.generated_at}
                            </span>
                        </div>
                    )}

                    {/* ── Loading Spinner State ── */}
                    {loading && (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                            <p className="text-xs font-semibold">Calculating data-driven metrics...</p>
                        </div>
                    )}

                    {!loading && report && (
                        <div id="report-print-sheet" className="space-y-6 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800">
                            {/* ── High-Level KPI Summary Cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* 1. Completion Rate */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-bold uppercase tracking-wider">Completion</span>
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                                        {report.completion_rate}%
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, report.completion_rate)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* 2. Tasks Ratio */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-bold uppercase tracking-wider">Tasks Done</span>
                                        <CheckCircle2 className="w-4 h-4 text-brand" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                                        {report.completed_tasks} <span className="text-sm font-medium text-slate-400">/ {report.total_tasks}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {report.unfinished_tasks} unfinished remaining
                                    </p>
                                </div>

                                {/* 3. Story Points Burned */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-bold uppercase tracking-wider">Story Points</span>
                                        <Flame className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                                        {report.completed_story_points} <span className="text-sm font-medium text-slate-400">/ {report.planned_story_points} pts</span>
                                    </div>
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                        {report.sp_completion_rate}% SP burned
                                    </p>
                                </div>

                                {/* 4. Delivery Status */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-bold uppercase tracking-wider">On-Time vs Late</span>
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                                        {report.on_time_tasks} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">on-time</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {report.late_tasks} completed late
                                    </p>
                                </div>

                                {/* 5. Overdue / At Risk */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 col-span-2 lg:col-span-1">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-bold uppercase tracking-wider">Overdue Tasks</span>
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                                        {report.overdue_tasks}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {report.overdue_tasks > 0 ? 'Requires team attention' : 'All tasks on schedule'}
                                    </p>
                                </div>
                            </div>

                            {/* ================================================================
                                TAB 1: OVERVIEW & VISUALIZATIONS
                            ================================================================ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Visual Charts Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                        {/* Chart 1: Donut Chart - Completion Status */}
                                        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <PieChartIcon className="w-4 h-4 text-brand" />
                                                    Task Status Distribution
                                                </h3>
                                                <span className="text-xs text-slate-400">{report.total_tasks} Total</span>
                                            </div>

                                            {taskStatusPieData.length === 0 ? (
                                                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                                                    No tasks recorded for this sprint/project.
                                                </div>
                                            ) : (
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={taskStatusPieData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={55}
                                                                outerRadius={85}
                                                                paddingAngle={4}
                                                                dataKey="value"
                                                            >
                                                                {taskStatusPieData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value, name) => [`${value} tasks`, name]}
                                                                contentStyle={{
                                                                    backgroundColor: '#0f172a',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    color: '#fff',
                                                                }}
                                                            />
                                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chart 2: Employee Contribution Bar Chart */}
                                        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-indigo-500" />
                                                    Tasks & Story Points by Developer
                                                </h3>
                                                <span className="text-xs text-slate-400">Completed vs Assigned</span>
                                            </div>

                                            {employeeChartData.length === 0 ? (
                                                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                                                    No employee assignments found.
                                                </div>
                                            ) : (
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={employeeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                            <YAxis tick={{ fontSize: 11 }} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#0f172a',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    color: '#fff',
                                                                }}
                                                            />
                                                            <Legend verticalAlign="bottom" height={36} />
                                                            <Bar dataKey="Assigned" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                                            <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                            <Bar dataKey="SP" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Priority & Difficulty Distributions */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Priority Distribution */}
                                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-amber-500" />
                                                Priority Distribution
                                            </h3>
                                            <div className="h-52">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={priorityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                        <YAxis tick={{ fontSize: 11 }} />
                                                        <Tooltip
                                                            formatter={(value) => [`${value} tasks`, 'Count']}
                                                            contentStyle={{
                                                                backgroundColor: '#0f172a',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                            }}
                                                        />
                                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                            {priorityBarData.map((entry, index) => (
                                                                <Cell key={`pcell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Sprint-by-Sprint breakdown for Project Scope OR Difficulty Breakdown */}
                                        {report.scope === 'project' && report.sprints_breakdown?.length > 0 ? (
                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-brand" />
                                                    Sprint-by-Sprint Progress
                                                </h3>
                                                <div className="h-52">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={report.sprints_breakdown.map((s) => ({
                                                                name: s.name,
                                                                Completed: s.completed_tasks,
                                                                Remaining: s.unfinished_tasks,
                                                            }))}
                                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                            <YAxis tick={{ fontSize: 11 }} />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#0f172a',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    color: '#fff',
                                                                }}
                                                            />
                                                            <Legend verticalAlign="bottom" height={36} />
                                                            <Bar dataKey="Completed" stackId="a" fill="#10b981" />
                                                            <Bar dataKey="Remaining" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <Flame className="w-4 h-4 text-pink-500" />
                                                    Difficulty Distribution
                                                </h3>
                                                <div className="space-y-4 pt-2">
                                                    {Object.entries(report.difficulty_distribution || {}).map(([diff, count]) => {
                                                        const pct = report.total_tasks > 0 ? Math.round((count / report.total_tasks) * 100) : 0;
                                                        const color = DIFFICULTY_COLORS[diff] || '#6366f1';
                                                        return (
                                                            <div key={diff} className="space-y-1.5">
                                                                <div className="flex items-center justify-between text-xs font-semibold">
                                                                    <span className="text-slate-700 dark:text-slate-300">{diff}</span>
                                                                    <span className="text-slate-500">{count} tasks ({pct}%)</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{ width: `${pct}%`, backgroundColor: color }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ================================================================
                                TAB 2: SPRINT AUDIT TABLE
                            ================================================================ */}
                            {activeTab === 'audit' && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
                                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                Sprint Task Audit Breakdown
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Detailed audit of assignment timelines, completion status, deadline adherence, and Story Points delta.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Search */}
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={auditSearch}
                                                    onChange={(e) => setAuditSearch(e.target.value)}
                                                    placeholder="Search task or employee..."
                                                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand"
                                                />
                                            </div>

                                            {/* Status filter */}
                                            <select
                                                value={auditStatusFilter}
                                                onChange={(e) => setAuditStatusFilter(e.target.value)}
                                                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="completed">Completed Only</option>
                                                <option value="on_time">On Time</option>
                                                <option value="late">Completed Late</option>
                                                <option value="overdue">Currently Overdue</option>
                                                <option value="in_progress">Unfinished</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="p-3 pl-5">Task</th>
                                                    <th className="p-3">Assigned To</th>
                                                    <th className="p-3">Completed By</th>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3">Assigned</th>
                                                    <th className="p-3">Deadline</th>
                                                    <th className="p-3">Completed</th>
                                                    <th className="p-3">On-Time?</th>
                                                    <th className="p-3 text-center">Est. SP</th>
                                                    <th className="p-3 text-center">Final SP</th>
                                                    <th className="p-3 text-center">SP Δ</th>
                                                    <th className="p-3 pr-5">Priority</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                                {filteredAuditTasks.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={12} className="py-12 text-center text-slate-400">
                                                            No matching audit records found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredAuditTasks.map((t) => {
                                                        const isDiffPos = t.sp_difference > 0;
                                                        const isDiffNeg = t.sp_difference < 0;

                                                        return (
                                                            <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                                <td className="p-3 pl-5 max-w-xs truncate">
                                                                    <div className="font-bold text-slate-900 dark:text-slate-100">
                                                                        #{t.id} {t.title}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400">
                                                                        {t.classification}
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap font-semibold">
                                                                    {t.assigned_employee}
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap text-slate-500">
                                                                    {t.completed_by_employee || '—'}
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wider ${
                                                                            t.status === 'completed'
                                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                                                : t.status === 'review'
                                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                        }`}
                                                                    >
                                                                        {t.status}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                                                                    {t.assigned_date}
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                                                                    {t.deadline}
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                                                                    {t.completed_date}
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap">
                                                                    {t.on_time_status === 'on_time' && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                                                            <Check className="w-2.5 h-2.5" /> On Time
                                                                        </span>
                                                                    )}
                                                                    {t.on_time_status === 'late' && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                                                            <Clock className="w-2.5 h-2.5" /> Late ({t.delay_days}d)
                                                                        </span>
                                                                    )}
                                                                    {t.on_time_status === 'overdue' && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                                                                            <AlertCircle className="w-2.5 h-2.5" /> Overdue ({t.delay_days}d)
                                                                        </span>
                                                                    )}
                                                                    {t.on_time_status === 'in_progress' && (
                                                                        <span className="text-slate-400 text-[10px]">
                                                                            In Progress
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-center font-mono font-bold">
                                                                    {t.original_sp}
                                                                </td>
                                                                <td className="p-3 text-center font-mono font-bold">
                                                                    {t.final_sp}
                                                                </td>
                                                                <td className="p-3 text-center font-mono font-bold">
                                                                    <span
                                                                        className={
                                                                            isDiffPos
                                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                                : isDiffNeg
                                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                                : 'text-slate-400'
                                                                        }
                                                                    >
                                                                        {isDiffPos ? `+${t.sp_difference}` : t.sp_difference}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 pr-5 whitespace-nowrap">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                                                            t.priority === 'Critical'
                                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                                                                : t.priority === 'High'
                                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                        }`}
                                                                    >
                                                                        {t.priority}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ================================================================
                                TAB 3: TEAM PERFORMANCE MATRIX
                            ================================================================ */}
                            {activeTab === 'team' && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
                                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            Factual Employee Performance Matrix
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Objective performance and contribution metrics. No subjective employee ranking is performed.
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                                    <th className="p-3 pl-5">Team Member</th>
                                                    <th className="p-3 text-center">Assigned</th>
                                                    <th className="p-3 text-center">Completed</th>
                                                    <th className="p-3 text-center">Unfinished</th>
                                                    <th className="p-3 text-center">Completion Rate</th>
                                                    <th className="p-3 text-center">SP Completed</th>
                                                    <th className="p-3 text-center">Avg SP / Task</th>
                                                    <th className="p-3 text-center">On-Time</th>
                                                    <th className="p-3 text-center">Overdue</th>
                                                    <th className="p-3 pr-5 text-right">Sprint Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                                {report.employee_performance?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="py-12 text-center text-slate-400">
                                                            No team contributions recorded for this scope.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    report.employee_performance.map((emp) => (
                                                        <tr key={emp.user_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                            <td className="p-3 pl-5 whitespace-nowrap">
                                                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                                                    {emp.name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400">
                                                                    {emp.role}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center font-mono font-bold">
                                                                {emp.assigned_count}
                                                            </td>
                                                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                {emp.completed_count}
                                                            </td>
                                                            <td className="p-3 text-center font-mono font-bold text-slate-500">
                                                                {emp.unfinished_count}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                                                                    {emp.completion_rate}%
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-center font-mono font-bold text-brand">
                                                                {emp.completed_sp} pts
                                                            </td>
                                                            <td className="p-3 text-center font-mono text-slate-500">
                                                                {emp.avg_sp_per_task}
                                                            </td>
                                                            <td className="p-3 text-center font-mono font-bold text-emerald-600">
                                                                {emp.on_time_count}
                                                            </td>
                                                            <td className="p-3 text-center font-mono font-bold text-rose-600">
                                                                {emp.overdue_count}
                                                            </td>
                                                            <td className="p-3 pr-5 text-right font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                                                                {emp.contribution_pct}%
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* =========================================================================
                EMAIL REPORT MODAL
            ========================================================================= */}
            {emailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    Email Performance Report
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEmailModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSendEmail} className="space-y-3">
                            <div className="space-y-1">
                                <label htmlFor="recipient-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Recipient Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="recipient-email"
                                    type="email"
                                    required
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="client@organization.com"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="email-note" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Personal Note (Optional)
                                </label>
                                <textarea
                                    id="email-note"
                                    rows={3}
                                    value={emailNote}
                                    onChange={(e) => setEmailNote(e.target.value)}
                                    placeholder="Add executive highlights or context..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand"
                                />
                            </div>

                            {emailError && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{emailError}</span>
                                </div>
                            )}

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 border border-slate-200 dark:border-slate-700/60">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>Attachments Included:</span>
                                    <span className="text-[10px] font-bold uppercase text-brand bg-brand/10 px-2 py-0.5 rounded-md">PDF + CSV</span>
                                </p>
                                <p className="text-slate-600 dark:text-slate-400">
                                    This email will deliver both the formatted <strong>PDF Report</strong> and the raw <strong>CSV Audit spreadsheet</strong> directly as email attachments.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEmailModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingEmail}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark transition-all disabled:opacity-50"
                                >
                                    {sendingEmail ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Sending Email...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Send Report</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================================
                CHAT SHARE MODAL
            ========================================================================= */}
            {chatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand shrink-0">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                        Share Report in Chat
                                    </h3>
                                    <p className="text-[11px] text-slate-400 truncate block" title={report?.title || 'Report'}>
                                        {report?.title || 'Report'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChatModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSendChat} className="space-y-3">
                            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChatRecipientType('dm');
                                        if (teamMembers.length > 0) setChatRecipientId(String(teamMembers[0].id));
                                    }}
                                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                                        chatRecipientType === 'dm'
                                            ? 'bg-white dark:bg-slate-900 text-brand shadow-xs'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    Direct Message
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChatRecipientType('channel');
                                        setChatRecipientId('ch-general');
                                    }}
                                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                                        chatRecipientType === 'channel'
                                            ? 'bg-white dark:bg-slate-900 text-brand shadow-xs'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    Channel
                                </button>
                            </div>

                            {/* Recipient Picker */}
                            <div className="space-y-1">
                                <label htmlFor="chat-recipient" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {chatRecipientType === 'dm' ? 'Select Team Member' : 'Select Channel'}
                                </label>
                                {chatRecipientType === 'dm' ? (
                                    <select
                                        id="chat-recipient"
                                        value={chatRecipientId}
                                        onChange={(e) => setChatRecipientId(e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand cursor-pointer"
                                    >
                                        {teamMembers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.role})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        id="chat-recipient"
                                        value={chatRecipientId}
                                        onChange={(e) => setChatRecipientId(e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand cursor-pointer"
                                    >
                                        <option value="ch-general">#general</option>
                                        <option value="ch-sprint">#sprint-room</option>
                                        <option value="ch-dev">#dev-help</option>
                                    </select>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="chat-note" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Message Note (Optional)
                                </label>
                                <textarea
                                    id="chat-note"
                                    rows={2}
                                    value={chatNote}
                                    onChange={(e) => setChatNote(e.target.value)}
                                    placeholder="Check out our latest sprint progress and audit..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand"
                                />
                            </div>

                            {/* Preview Card */}
                            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
                                    <BarChart3 className="w-3.5 h-3.5 text-brand" />
                                    <span>Interactive Report Card</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                    Recipients will see an interactive card in chat with live metrics and a button to view the full audit.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setChatModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingChat}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark transition-all disabled:opacity-50"
                                >
                                    {sendingChat ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Sharing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Share in Chat</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ── High-Fidelity Print & PDF Export Area ── */}
            {report && (
                <div className="hidden print:block">
                    <style>{`
                        @media print {
                            body * { visibility: hidden !important; }
                            #report-print-sheet, #report-print-sheet * { visibility: visible !important; }
                            #report-print-sheet {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                max-width: 100% !important;
                                padding: 32px !important;
                                margin: 0 !important;
                                background: #ffffff !important;
                                color: #0f172a !important;
                                box-sizing: border-box !important;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                            }
                            .print\\:hidden { display: none !important; }
                        }
                    `}</style>
                    <div id="report-print-sheet" className="w-full max-w-[794px] mx-auto p-8 space-y-6 bg-white text-slate-900 font-sans">
                        {/* Header */}
                        <div className="border-b-2 border-indigo-600 pb-4 flex items-start justify-between">
                            <div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                    {report.title || 'Sprint Performance & Velocity Audit'}
                                </h1>
                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                                    {report.scope === 'sprint' ? 'Sprint Report' : 'Project Aggregate Report'} • {studio?.name || 'SprintStudio'}
                                </p>
                                {report.start_date && (
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Duration: {report.start_date} to {report.end_date}
                                    </p>
                                )}
                            </div>
                            <div className="text-right text-xs text-slate-500 font-mono">
                                <p>Generated: {report.generated_at}</p>
                                <p>Completion: <strong className="text-slate-900">{report.completion_rate}%</strong></p>
                            </div>
                        </div>

                        {/* Executive KPI Summary */}
                        <div className="grid grid-cols-4 gap-3 text-center">
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-[10px] uppercase font-bold text-slate-500">Total Tasks</p>
                                <p className="text-lg font-black text-slate-900 mt-0.5">{report.total_tasks}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-[10px] uppercase font-bold text-slate-500">Tasks Completed</p>
                                <p className="text-lg font-black text-emerald-600 mt-0.5">{report.completed_tasks}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-[10px] uppercase font-bold text-slate-500">Story Points</p>
                                <p className="text-lg font-black text-indigo-600 mt-0.5">
                                    {report.completed_story_points} / {report.planned_story_points}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-[10px] uppercase font-bold text-slate-500">On-Time Delivery</p>
                                <p className="text-lg font-black text-slate-900 mt-0.5">{report.on_time_tasks}</p>
                            </div>
                        </div>

                        {/* Task Audit Table */}
                        {report.audit_tasks && report.audit_tasks.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <h3 className="text-xs font-black uppercase text-indigo-700 tracking-wider">
                                    Task Breakdown & Audit Log
                                </h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                                <th className="px-3 py-2">ID</th>
                                                <th className="px-3 py-2">Title</th>
                                                <th className="px-3 py-2">Status</th>
                                                <th className="px-3 py-2">Priority</th>
                                                <th className="px-3 py-2">Assignee</th>
                                                <th className="px-3 py-2">Delivery</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {report.audit_tasks.slice(0, 60).map((t) => (
                                                <tr key={t.id}>
                                                    <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">#{t.id}</td>
                                                    <td className="px-3 py-1.5 font-semibold text-slate-900">{t.title}</td>
                                                    <td className="px-3 py-1.5 capitalize text-slate-700">{t.status?.replace(/_/g, ' ')}</td>
                                                    <td className="px-3 py-1.5 text-slate-700">{t.priority}</td>
                                                    <td className="px-3 py-1.5 text-slate-700">{t.assigned_employee || 'Unassigned'}</td>
                                                    <td className="px-3 py-1.5 capitalize text-slate-700">{t.on_time_status?.replace(/_/g, ' ') || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
