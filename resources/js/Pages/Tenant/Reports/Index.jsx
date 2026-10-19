import React, { useState, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import axios from 'axios';
import {
    FileText, Archive, Download, Trash2, Calendar,
    User, Users, FolderKanban, BarChart3, Clock,
    Send, Mail, Search, Shield, Eye, X, Check,
    Loader2, ArrowLeft, ArrowRight, CheckCircle2,
    SlidersHorizontal, Sparkles, ChevronRight,
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell,
    AreaChart, Area, LineChart, Line,
} from 'recharts';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { showToast } from '@/Components/SystemToast';

export default function ReportsIndex({
    studio = {},
    currentUser = {},
    isLeader = false,
    projects = [],
    teamMembers = [],
    availableReportTypes = [],
    archivedReports: initialArchivedReports = [],
    initialType = 'project_summary',
    initialProjectId = null,
    initialSprintId = null,
}) {
    const { activeWorkspace } = usePage().props || {};
    const studioName = studio?.name || 'WorkSync Studio';

    // Primary tabs: 'generate' | 'archive'
    const [activeTab, setActiveTab] = useState('generate');

    // Wizard step: ALWAYS starts strictly at Step 1
    // 1 = Choose Report Type, 2 = Configure Report, 3 = Preview & Export
    const [wizardStep, setWizardStep] = useState(1);
    const [maxStep, setMaxStep] = useState(1);
    const [stepDirection, setStepDirection] = useState('forward'); // 'forward' | 'backward'

    // Filter configuration
    const [selectedTypeKey, setSelectedTypeKey] = useState(initialType || 'project_summary');
    const [selectedProjectId, setSelectedProjectId] = useState(
        initialProjectId ? String(initialProjectId) : (projects[0]?.id ? String(projects[0].id) : '')
    );
    const [selectedSprintId, setSelectedSprintId] = useState(initialSprintId ? String(initialSprintId) : '');
    const [selectedSprintIds, setSelectedSprintIds] = useState(initialSprintId ? [Number(initialSprintId)] : []);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(
        isLeader ? (teamMembers[0]?.id ? String(teamMembers[0].id) : '') : String(currentUser?.id || '')
    );
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orientation, setOrientation] = useState('portrait');

    // Generated report preview state — starts null
    const [report, setReport] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // Archive state — strictly scoped to reports created by current user
    const [archivedReports, setArchivedReports] = useState(() => {
        const list = initialArchivedReports || [];
        if (!currentUser?.id) return list;
        return list.filter(r => !r.created_by_user_id || Number(r.created_by_user_id) === Number(currentUser.id));
    });
    const [archiveSearch, setArchiveSearch] = useState('');
    const [archiveTypeFilter, setArchiveTypeFilter] = useState('all');
    const [archiveProjectFilter, setArchiveProjectFilter] = useState('all');
    const [archiveDeleteTarget, setArchiveDeleteTarget] = useState(null);
    const [isDeletingArchive, setIsDeletingArchive] = useState(false);

    // Share modals
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState('');
    const [emailNote, setEmailNote] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [chatRecipientType, setChatRecipientType] = useState('dm');
    const [chatRecipientId, setChatRecipientId] = useState('');
    const [chatNote, setChatNote] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);

    // Derived project & sprint data
    const currentProject = useMemo(() =>
        projects.find(p => String(p.id) === String(selectedProjectId)) || null,
    [projects, selectedProjectId]);

    const availableSprints = useMemo(() => currentProject?.sprints || [], [currentProject]);

    const selectedReportType = useMemo(() =>
        availableReportTypes.find(t => t.key === selectedTypeKey) || availableReportTypes[0] || {},
    [availableReportTypes, selectedTypeKey]);

    // Status and workflow allocation distribution (for executive donut chart)
    const statusDistribution = useMemo(() => {
        if (!report) return [];

        let completed = 0;
        let inProgress = 0;
        let review = 0;
        let todo = 0;

        if (Array.isArray(report.audit_tasks) && report.audit_tasks.length > 0) {
            report.audit_tasks.forEach(t => {
                const st = String(t.status || '').toLowerCase();
                if (st === 'completed' || st === 'done') completed++;
                else if (st === 'in_progress') inProgress++;
                else if (st === 'review') review++;
                else todo++;
            });
        } else {
            completed = Number(report.completed_tasks ?? 0);
            inProgress = Number(report.in_progress_tasks ?? 0);
            review = Number(report.review_tasks ?? 0);
            todo = Number(report.todo_tasks ?? Math.max(0, (report.total_tasks ?? 0) - completed - inProgress - review));
        }

        const items = [
            { name: 'Completed', value: completed, color: '#059669' },
            { name: 'In Progress', value: inProgress, color: '#2563eb' },
            { name: 'In Review', value: review, color: '#d97706' },
            { name: 'To Do', value: todo, color: '#94a3b8' },
        ].filter(item => item.value > 0);

        return items.length > 0 ? items : [{ name: 'Pending Tasks', value: 1, color: '#94a3b8' }];
    }, [report]);

    // Cumulative delivery and velocity trend (planned target vs delivered actual)
    const deliveryTrendData = useMemo(() => {
        if (!report) return [];

        const comparisons = report.sprint_comparison || report.sprints_comparison || report.sprints_breakdown;
        if (Array.isArray(comparisons) && comparisons.length > 1) {
            let cumPlanned = 0;
            let cumDelivered = 0;
            return comparisons.map(item => {
                cumPlanned += Number(item.planned_sp ?? item.total_tasks ?? 0);
                cumDelivered += Number(item.completed_sp ?? item.completed_tasks ?? 0);
                return {
                    name: item.name || `Sprint ${item.id}`,
                    planned: cumPlanned,
                    delivered: cumDelivered,
                };
            });
        }

        // Single sprint or milestone trajectory fallback
        const totalPlanned = Number(report.planned_story_points ?? 0) || Number(report.total_tasks ?? 0) || 10;
        const totalDelivered = Number(report.completed_story_points ?? 0) || Number(report.completed_tasks ?? 0);

        return [
            { name: 'Kickoff', planned: 0, delivered: 0 },
            { name: 'Milestone 1', planned: Math.round(totalPlanned * 0.3), delivered: Math.round(totalDelivered * 0.25) },
            { name: 'Midpoint', planned: Math.round(totalPlanned * 0.6), delivered: Math.round(totalDelivered * 0.65) },
            { name: 'Review', planned: Math.round(totalPlanned * 0.85), delivered: Math.round(totalDelivered * 0.9) },
            { name: 'Target', planned: totalPlanned, delivered: totalDelivered },
        ];
    }, [report]);

    // Tab switching handler — always resets wizard to Step 1
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'generate') {
            setWizardStep(1);
            setMaxStep(1);
            setReport(null);
            setStepDirection('forward');
        }
    };

    // Step navigation helpers
    const goToStep = (step) => {
        if (step > maxStep) return;
        setStepDirection(step < wizardStep ? 'backward' : 'forward');
        setWizardStep(step);
    };

    const proceedToStep2 = () => {
        if (!selectedTypeKey) {
            showToast('Please select a report type first.', 'warning');
            return;
        }
        if (selectedReportType?.recommended_orientation) {
            setOrientation(selectedReportType.recommended_orientation);
        }
        setStepDirection('forward');
        setWizardStep(2);
        setMaxStep(prev => Math.max(prev, 2));
    };

    const handleGeneratePreview = async (overrideParams = {}) => {
        setIsLoadingPreview(true);
        try {
            const targetOrientation = overrideParams.orientation || orientation;
            const payload = {
                type: selectedTypeKey,
                project_id: selectedProjectId ? Number(selectedProjectId) : null,
                sprint_id: selectedSprintId ? Number(selectedSprintId) : null,
                sprint_ids: selectedSprintIds,
                employee_user_id: selectedEmployeeId ? Number(selectedEmployeeId) : (currentUser?.id || null),
                start_date: startDate || null,
                end_date: endDate || null,
                orientation: targetOrientation,
            };

            const response = await axios.get(route('tenant.reports.data', { tenant: activeWorkspace }), {
                params: payload,
            });

            if (response.data?.success && response.data?.data) {
                const archivedId = response.data.archived_report?.id;
                setReport({
                    ...response.data.data,
                    id: archivedId || response.data.data.id,
                    archived_id: archivedId,
                });
                if (response.data.archived_report) {
                    setArchivedReports(prev => [
                        response.data.archived_report,
                        ...prev.filter(r => r.id !== response.data.archived_report.id),
                    ]);
                }
                setStepDirection('forward');
                setWizardStep(3);
                setMaxStep(3);
                showToast('Executive report preview generated and saved to archive.', 'success');
            } else {
                showToast('Unable to compile report data for the selected parameters.', 'warning');
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Error compiling report data. Please check parameters.', 'error');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    // Download PDF handler - direct server download without print dialog popup
    const handleDownloadPdf = async (targetReport = report, targetOrientation = orientation) => {
        if (!targetReport) {
            showToast('No report available to download.', 'warning');
            return;
        }

        try {
            showToast('Generating executive PDF report...', 'info');

            const params = {
                tenant: activeWorkspace,
                orientation: targetOrientation,
            };

            if (targetReport.archived_id) {
                params.archived_id = targetReport.archived_id;
            } else if (targetReport.id && (targetReport.metrics || typeof targetReport.id === 'number')) {
                params.archived_id = targetReport.id;
            } else {
                params.type = targetReport.type || selectedTypeKey;
                if (selectedProjectId) params.project_id = selectedProjectId;
                if (selectedSprintId) params.sprint_id = selectedSprintId;
                if (selectedSprintIds && selectedSprintIds.length > 0) params.sprint_ids = selectedSprintIds;
                if (selectedEmployeeId) params.employee_user_id = selectedEmployeeId;
                if (startDate) params.start_date = startDate;
                if (endDate) params.end_date = endDate;
            }

            const downloadUrl = route('tenant.reports.download-pdf', params);

            const response = await axios.get(downloadUrl, {
                responseType: 'blob',
            });

            // Extract filename from Content-Disposition header if present
            let filename = `${(targetReport.title || 'report').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.pdf`;
            const disposition = response.headers['content-disposition'];
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            // Create download link and trigger direct file download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            showToast('Executive report PDF downloaded successfully.', 'success');
        } catch (error) {
            console.error('PDF download error:', error);
            showToast(error.response?.data?.message || 'Failed to download report PDF.', 'error');
        }
    };


    // Email sharing handler
    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!emailRecipient) {
            showToast('Please enter a recipient email address.', 'warning');
            return;
        }
        setIsSendingEmail(true);
        try {
            const payload = {
                recipient_email: emailRecipient,
                personal_note: emailNote,
                type: selectedTypeKey,
                project_id: selectedProjectId ? Number(selectedProjectId) : null,
                orientation,
                metrics: report,
            };
            const response = await axios.post(route('tenant.reports.share-email', { tenant: activeWorkspace }), payload);
            if (response.data?.success) {
                showToast(response.data.message || 'Report sent successfully via email.', 'success');
                setEmailModalOpen(false);
                setEmailRecipient('');
                setEmailNote('');
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to dispatch report email.', 'error');
        } finally {
            setIsSendingEmail(false);
        }
    };

    // In-app chat sharing handler
    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatRecipientId) {
            showToast('Please choose a recipient destination.', 'warning');
            return;
        }
        setIsSendingChat(true);
        try {
            const payload = {
                recipient_type: chatRecipientType,
                recipient_id: chatRecipientId,
                report_title: report?.title || selectedReportType.name,
                metrics: report,
                personal_note: chatNote,
            };
            const response = await axios.post(route('tenant.reports.share-chat', { tenant: activeWorkspace }), payload);
            if (response.data?.success) {
                showToast('Report delivered into WorkSync chat channel.', 'success');
                setChatModalOpen(false);
                setChatRecipientId('');
                setChatNote('');
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to deliver report in chat.', 'error');
        } finally {
            setIsSendingChat(false);
        }
    };

    // Delete archived report handler
    const confirmDeleteArchive = async () => {
        if (!archiveDeleteTarget) return;
        setIsDeletingArchive(true);
        try {
            await axios.delete(route('tenant.reports.archive.delete', {
                tenant: activeWorkspace,
                report: archiveDeleteTarget.id,
            }));
            setArchivedReports(prev => prev.filter(r => r.id !== archiveDeleteTarget.id));
            showToast('Archived report permanently removed.', 'success');
            setArchiveDeleteTarget(null);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete archived record.', 'error');
        } finally {
            setIsDeletingArchive(false);
        }
    };

    // Filtered archive list
    const filteredArchivedReports = useMemo(() =>
        archivedReports.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                (item.target_name && item.target_name.toLowerCase().includes(archiveSearch.toLowerCase())) ||
                (item.created_by && item.created_by.toLowerCase().includes(archiveSearch.toLowerCase()));
            const matchesType = archiveTypeFilter === 'all' || item.type === archiveTypeFilter;
            const matchesProject = archiveProjectFilter === 'all' || String(item.project_id) === String(archiveProjectFilter);
            return matchesSearch && matchesType && matchesProject;
        }),
    [archivedReports, archiveSearch, archiveTypeFilter, archiveProjectFilter]);

    // Helper icon selector
    const getTypeIcon = (t) => {
        if (!t) return <FolderKanban className="w-5 h-5" />;
        if (t.category === 'sprint') return <Clock className="w-5 h-5" />;
        if (t.category === 'people') return <Users className="w-5 h-5" />;
        if (t.category === 'audit') return <Shield className="w-5 h-5" />;
        if (t.category === 'analytics') return <BarChart3 className="w-5 h-5" />;
        return <FolderKanban className="w-5 h-5" />;
    };

    // Group report types logically
    const groupedTypes = useMemo(() => {
        const groups = {
            'Project & Sprint Velocity': [],
            'Team & Resource Allocation': [],
            'Audit & Governance': [],
            'Personal Telemetry': [],
        };
        availableReportTypes.forEach(t => {
            if (['project_summary', 'sprint_performance'].includes(t.key)) {
                groups['Project & Sprint Velocity'].push(t);
            } else if (['team_performance', 'workload_assignment'].includes(t.key)) {
                groups['Team & Resource Allocation'].push(t);
            } else if (['task_audit', 'compliance_audit'].includes(t.key)) {
                groups['Audit & Governance'].push(t);
            } else {
                groups['Personal Telemetry'].push(t);
            }
        });
        return groups;
    }, [availableReportTypes]);

    const stepAnimationClass = stepDirection === 'backward' ? 'step-enter-backward' : 'step-enter-forward';

    return (
        <TenantLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Report Center
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isLeader
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                    : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}>
                                {isLeader ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                {isLeader ? 'Lead & Executive View' : 'Member View'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Configure, preview, and distribute standardized project intelligence reports.
                        </p>
                    </div>

                    {/* Primary Tab Switcher */}
                    <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-inner">
                        <button
                            type="button"
                            onClick={() => handleTabChange('generate')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'generate'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Generate Report</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('archive')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'archive'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Archive className="w-4 h-4" />
                            <span>Report Archive</span>
                            {archivedReports.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                    {archivedReports.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Report Center — ${studioName}`} />

            {/* Print Styles for Executive Report Export */}
            <style>{`
                @media print {
                    body, html {
                        background: #ffffff !important;
                        color: #0f172a !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Hide outer layouts, headers, sidebars, buttons, alerts */
                    aside, nav, header, footer, button, .no-print, [role="navigation"] {
                        display: none !important;
                    }
                    /* Hide everything inside body except the print sheet */
                    body * {
                        visibility: hidden;
                    }
                    #report-preview-sheet, #report-preview-sheet * {
                        visibility: visible;
                    }
                    #report-preview-sheet {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        min-width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 1.5rem !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: #ffffff !important;
                    }
                    @page {
                        margin: 0.5in;
                        size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
                    }
                }
            `}</style>

            {/* Scrollable Container with high-visibility custom scrollbar */}
            <div className="flex-1 w-full h-full min-h-0 overflow-y-auto custom-scrollbar [scrollbar-gutter:stable] bg-slate-50/50 dark:bg-slate-950/40">
                <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ======================================================== */}
                    {/* GENERATE TAB: True Step-by-Step with Animated Progression */}
                    {/* ======================================================== */}
                    {activeTab === 'generate' && (
                        <div className="space-y-6">

                            {/* Stepper Progress Bar */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                                <div className="flex items-center justify-between max-w-2xl mx-auto">
                                    {/* Step 1 Pill */}
                                    <button
                                        type="button"
                                        onClick={() => goToStep(1)}
                                        className={`flex items-center gap-2 text-left transition-all ${
                                            wizardStep === 1
                                                ? 'cursor-default'
                                                : maxStep >= 1
                                                ? 'cursor-pointer hover:opacity-80'
                                                : 'cursor-not-allowed opacity-50'
                                        }`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                            wizardStep > 1
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : wizardStep === 1
                                                ? 'bg-brand text-white ring-4 ring-brand/15 shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            {wizardStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                                        </span>
                                        <div className="hidden sm:block">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1</div>
                                            <div className={`text-xs font-bold leading-tight ${wizardStep === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                Report Type
                                            </div>
                                        </div>
                                    </button>

                                    {/* Connector 1 */}
                                    <div className={`flex-1 mx-3 sm:mx-6 h-0.5 rounded transition-all ${
                                        maxStep >= 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                    }`} />

                                    {/* Step 2 Pill */}
                                    <button
                                        type="button"
                                        disabled={maxStep < 2}
                                        onClick={() => goToStep(2)}
                                        className={`flex items-center gap-2 text-left transition-all ${
                                            wizardStep === 2
                                                ? 'cursor-default'
                                                : maxStep >= 2
                                                ? 'cursor-pointer hover:opacity-80'
                                                : 'cursor-not-allowed opacity-40'
                                        }`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                            wizardStep > 2
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : wizardStep === 2
                                                ? 'bg-brand text-white ring-4 ring-brand/15 shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            {wizardStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                                        </span>
                                        <div className="hidden sm:block">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2</div>
                                            <div className={`text-xs font-bold leading-tight ${wizardStep === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                Configure Scope
                                            </div>
                                        </div>
                                    </button>

                                    {/* Connector 2 */}
                                    <div className={`flex-1 mx-3 sm:mx-6 h-0.5 rounded transition-all ${
                                        maxStep >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                    }`} />

                                    {/* Step 3 Pill */}
                                    <button
                                        type="button"
                                        disabled={maxStep < 3}
                                        onClick={() => goToStep(3)}
                                        className={`flex items-center gap-2 text-left transition-all ${
                                            wizardStep === 3
                                                ? 'cursor-default'
                                                : maxStep >= 3
                                                ? 'cursor-pointer hover:opacity-80'
                                                : 'cursor-not-allowed opacity-40'
                                        }`}
                                    >
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                            wizardStep === 3
                                                ? 'bg-brand text-white ring-4 ring-brand/15 shadow-xs'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            3
                                        </span>
                                        <div className="hidden sm:block">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3</div>
                                            <div className={`text-xs font-bold leading-tight ${wizardStep === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                Preview &amp; Export
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* ======================================================== */}
                            {/* STEP 1 VIEW ONLY: CHOOSE REPORT TYPE                     */}
                            {/* ======================================================== */}
                            {wizardStep === 1 && (
                                <div key="step-1" className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden ${stepAnimationClass}`}>
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand text-white shrink-0">
                                                1
                                            </span>
                                            <div>
                                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Choose Report Type
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Select the report template matching your operational or executive audience.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 sm:p-6 space-y-6">
                                        {Object.entries(groupedTypes).map(([categoryName, types]) => {
                                            if (types.length === 0) return null;
                                            return (
                                                <div key={categoryName} className="space-y-3">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                        {categoryName}
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                        {types.map((t) => {
                                                            const isSelected = selectedTypeKey === t.key;
                                                            return (
                                                                <button
                                                                    key={t.key}
                                                                    type="button"
                                                                    onClick={() => setSelectedTypeKey(t.key)}
                                                                    className={`group p-4 rounded-xl border text-left flex gap-3.5 items-start transition-all cursor-pointer ${
                                                                        isSelected
                                                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md ring-2 ring-slate-900 dark:ring-white'
                                                                            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                                                                    }`}
                                                                >
                                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                                        isSelected
                                                                            ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200'
                                                                    }`}>
                                                                        {getTypeIcon(t)}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className={`text-xs font-bold leading-tight ${
                                                                                isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'
                                                                            }`}>
                                                                                {t.name}
                                                                            </span>
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                                                                isSelected
                                                                                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                                            }`}>
                                                                                {t.badge || 'Executive'}
                                                                            </span>
                                                                        </div>
                                                                        <p className={`mt-1.5 text-xs leading-relaxed line-clamp-2 ${
                                                                            isSelected ? 'text-slate-200 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'
                                                                        }`}>
                                                                            {t.description}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Action Bar */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="text-xs text-slate-500">
                                                Selected: <strong className="text-slate-900 dark:text-white">{selectedReportType?.name}</strong>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={proceedToStep2}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/20 transition-all cursor-pointer hover:translate-x-0.5"
                                            >
                                                <span>Proceed to Configuration</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ======================================================== */}
                            {/* STEP 2 VIEW ONLY: CONFIGURE SCOPE & FILTERS              */}
                            {/* ======================================================== */}
                            {wizardStep === 2 && (
                                <div key="step-2" className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden ${stepAnimationClass}`}>
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-brand text-white shrink-0">
                                                2
                                            </span>
                                            <div>
                                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Configure Scope &amp; Filters
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Tune the target workspace scope, sprint iterations, and document layout parameters.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {getTypeIcon(selectedReportType)}
                                            <span>{selectedReportType.name}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 sm:p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                                            {/* Project Selection */}
                                            {(selectedReportType.requires_project || ['project', 'sprint'].includes(selectedReportType.category) || ['team_performance', 'task_audit', 'workload_assignment'].includes(selectedReportType.key)) && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                        <span>Target Project {selectedReportType.requires_project ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}</span>
                                                    </label>
                                                    <select
                                                        value={selectedProjectId}
                                                        onChange={e => setSelectedProjectId(e.target.value)}
                                                        className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-brand focus:border-brand py-2.5 px-3 shadow-2xs"
                                                    >
                                                        {!selectedReportType.requires_project && (
                                                            <option value="">All Workspace Projects</option>
                                                        )}
                                                        {projects.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({p.status})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Sprint Multi-Selection */}
                                            {selectedReportType.requires_sprint && (
                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                                                        <span>Sprint Inclusion <span className="text-rose-500">*</span></span>
                                                        <span className="text-[11px] text-slate-400 font-normal">Select one or multiple iterations</span>
                                                    </label>
                                                    {availableSprints.length === 0 ? (
                                                        <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                                                            No active or completed sprints found for this project.
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {availableSprints.map(s => {
                                                                const isChecked = selectedSprintIds.includes(s.id);
                                                                return (
                                                                    <button
                                                                        key={s.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isChecked) {
                                                                                if (selectedSprintIds.length > 1) {
                                                                                    setSelectedSprintIds(prev => prev.filter(id => id !== s.id));
                                                                                }
                                                                            } else {
                                                                                setSelectedSprintIds(prev => [...prev, s.id]);
                                                                            }
                                                                            setSelectedSprintId(String(s.id));
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                            isChecked
                                                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                                                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                                                        }`}
                                                                    >
                                                                        {isChecked && <Check className="w-3.5 h-3.5" />}
                                                                        <span>{s.name}</span>
                                                                        <span className="text-[10px] opacity-70 uppercase tracking-tight">({s.status})</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Employee / Team Member Filter */}
                                            {selectedReportType.requires_employee && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        Team Member <span className="text-rose-500">*</span>
                                                    </label>
                                                    {isLeader ? (
                                                        <select
                                                            value={selectedEmployeeId}
                                                            onChange={e => setSelectedEmployeeId(e.target.value)}
                                                            className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-brand focus:border-brand py-2.5 px-3 shadow-2xs"
                                                        >
                                                            {teamMembers.map(m => (
                                                                <option key={m.id} value={m.id}>
                                                                    {m.name} ({m.email})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="text-xs py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                            {currentUser?.name} (Your Authorized Account)
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Date Range Filters */}
                                            {selectedReportType.supports_date_range && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            Start Date <span className="text-slate-400 font-normal">(Optional)</span>
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={startDate}
                                                            onChange={e => setStartDate(e.target.value)}
                                                            className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-brand focus:border-brand py-2.5 px-3 shadow-2xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            End Date <span className="text-slate-400 font-normal">(Optional)</span>
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={endDate}
                                                            onChange={e => setEndDate(e.target.value)}
                                                            className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-brand focus:border-brand py-2.5 px-3 shadow-2xs"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Orientation Selection */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
                                                    <span>Document Page Layout</span>
                                                    <span className="text-[10px] text-slate-400 font-normal">
                                                        {selectedReportType.recommended_orientation === 'landscape' ? 'Landscape Recommended' : 'Portrait Standard'}
                                                    </span>
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['portrait', 'landscape'].map(o => (
                                                        <button
                                                            key={o}
                                                            type="button"
                                                            onClick={() => setOrientation(o)}
                                                            className={`py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all border cursor-pointer ${
                                                                orientation === o
                                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                                            }`}
                                                        >
                                                            {o}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => { setStepDirection('backward'); setWizardStep(1); }}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5" />
                                                <span>Back to Report Type</span>
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isLoadingPreview || (selectedReportType.requires_project && !selectedProjectId)}
                                                onClick={() => handleGeneratePreview()}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/20 transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {isLoadingPreview ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Compiling Preview...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Generate Preview</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ======================================================== */}
                            {/* STEP 3 VIEW ONLY: PREVIEW & EXPORT                      */}
                            {/* ======================================================== */}
                            {wizardStep === 3 && report && (
                                <div key="step-3" className={`space-y-4 ${stepAnimationClass}`}>

                                    {/* Action Toolbar */}
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setStepDirection('backward'); setWizardStep(2); }}
                                                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5" />
                                                <span>Adjust Scope &amp; Filters</span>
                                            </button>
                                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                            {/* Live Orientation switch */}
                                            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                                                {['portrait', 'landscape'].map(o => (
                                                    <button
                                                        key={o}
                                                        type="button"
                                                        onClick={() => {
                                                            setOrientation(o);
                                                            handleGeneratePreview({ orientation: o });
                                                        }}
                                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md capitalize transition-colors cursor-pointer ${
                                                            orientation === o
                                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action buttons (Cleaned: NO Save to Archive, NO Export CSV) */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEmailModalOpen(true)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                            >
                                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Email Report</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setChatModalOpen(true)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                            >
                                                <Send className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Send in Chat</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadPdf()}
                                                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark flex items-center gap-2 shadow-sm shadow-brand/20 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Download PDF</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Document Canvas (Jira / Linear Standard) */}
                                    <div className="py-8 px-2 sm:px-6 bg-slate-200/80 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 flex justify-center overflow-x-auto shadow-inner">
                                        <div
                                            id="report-preview-sheet"
                                            className={`bg-white text-slate-900 shadow-xl transition-all border border-slate-200/90 rounded-sm box-border overflow-hidden ${
                                                orientation === 'landscape'
                                                    ? 'w-[960px] min-w-[960px] max-w-[960px]'
                                                    : 'w-[720px] min-w-[720px] max-w-[720px]'
                                            }`}
                                            style={{
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                                                color: '#0f172a',
                                            }}
                                        >
                                            <div className="p-7 space-y-6">

                                                {/* Formal PM Header: Organization Branding & Document Classification */}
                                                <div className="pb-5 border-b border-slate-300 flex items-start justify-between">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                                                WS
                                                            </div>
                                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                                                {studioName} &bull; Executive Engineering Operations
                                                            </span>
                                                        </div>
                                                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                                                            {report.title || selectedReportType.name}
                                                        </h1>
                                                        <p className="text-xs text-slate-500 max-w-xl">
                                                            {report.summary || selectedReportType.description}
                                                        </p>
                                                    </div>

                                                    {/* Document Control Box */}
                                                    <div className="border border-slate-200 bg-slate-50/80 rounded px-3 py-2 text-right space-y-0.5 text-[11px] min-w-[180px]">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            Document Control
                                                        </div>
                                                        <div className="font-mono text-[11px] text-slate-800">
                                                            REF: WS-RPT-{(report.id || String(Date.now()).slice(-6))}
                                                        </div>
                                                        <div className="text-slate-600">
                                                            {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : new Date().toLocaleDateString()}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-semibold">
                                                            Period: {report.reporting_period || 'Current Iteration'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Metadata Details Ribbon */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Scope / Target</span>
                                                        <strong className="text-slate-800 font-semibold truncate block">
                                                            {currentProject?.name || 'All Workspace Projects'}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Report Type</span>
                                                        <strong className="text-slate-800 font-semibold truncate block capitalize">
                                                            {(report.type || selectedTypeKey).replace(/_/g, ' ')}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Generated By</span>
                                                        <strong className="text-slate-800 font-semibold truncate block">
                                                            {currentUser?.name || 'Authorized Lead'}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Status</span>
                                                        <span className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                                                            (report.overdue_tasks ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
                                                        }`}>
                                                            {(report.overdue_tasks ?? 0) > 0 ? 'Action Required' : 'On Track'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Executive KPI Scorecard (Clean Atlassian / Linear Style) */}
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                        Executive Performance Summary
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="border border-slate-200 bg-white p-3.5 rounded">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                                                                Delivery Adherence
                                                            </div>
                                                            <div className="text-2xl font-bold text-slate-900 font-mono">
                                                                {report.completion_rate ?? 0}%
                                                            </div>
                                                            <div className="mt-1 text-[11px] text-slate-500">
                                                                {report.completed_tasks ?? 0} of {report.total_tasks ?? 0} tasks resolved
                                                            </div>
                                                        </div>

                                                        <div className="border border-slate-200 bg-white p-3.5 rounded">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                                                                Velocity Delivered
                                                            </div>
                                                            <div className="text-2xl font-bold text-slate-900 font-mono">
                                                                {report.completed_story_points ?? 0} <span className="text-xs font-normal text-slate-400">SP</span>
                                                            </div>
                                                            <div className="mt-1 text-[11px] text-slate-500">
                                                                of {report.planned_story_points ?? 0} SP planned
                                                            </div>
                                                        </div>

                                                        <div className="border border-slate-200 bg-white p-3.5 rounded">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                                                                Unresolved Scope
                                                            </div>
                                                            <div className={`text-2xl font-bold font-mono ${
                                                                (report.overdue_tasks ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
                                                            }`}>
                                                                {report.unfinished_tasks ?? ((report.total_tasks ?? 0) - (report.completed_tasks ?? 0))}
                                                            </div>
                                                            <div className="mt-1 text-[11px] text-slate-500">
                                                                {(report.overdue_tasks ?? 0) > 0 ? `${report.overdue_tasks} overdue items` : '0 overdue items'}
                                                            </div>
                                                        </div>

                                                        <div className="border border-slate-200 bg-white p-3.5 rounded">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                                                                Resource Allocation
                                                            </div>
                                                            <div className="text-2xl font-bold text-slate-900 font-mono">
                                                                {report.members_performance?.length || teamMembers.length || 1}
                                                            </div>
                                                            <div className="mt-1 text-[11px] text-slate-500">
                                                                Active contributing members
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Executive Visual Intelligence: Scope Allocation Donut & Delivery Trajectory Trend */}
                                                <div className="pt-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Chart 1: Status & Workflow Scope Allocation (Donut Chart) */}
                                                        <div className="border border-slate-200 rounded p-3.5 bg-white flex flex-col justify-between">
                                                            <div className="mb-2">
                                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                                                    Scope &amp; Status Allocation
                                                                </h3>
                                                                <p className="text-[11px] text-slate-500">
                                                                    Workflow distribution across {report.total_tasks ?? 0} total tasks
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center justify-between min-h-[155px]">
                                                                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <PieChart>
                                                                            <Pie
                                                                                data={statusDistribution}
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
                                                                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                                                        </PieChart>
                                                                    </ResponsiveContainer>
                                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                                        <span className="text-sm font-bold font-mono text-slate-900 leading-none">
                                                                            {report.completion_rate ?? 0}%
                                                                        </span>
                                                                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                                                                            Resolved
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Status Breakdown Legend */}
                                                                <div className="flex-1 pl-3 space-y-1.5">
                                                                    {statusDistribution.map((item, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between text-xs">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                                                                                <span className="text-slate-600 truncate text-[11px]">{item.name}</span>
                                                                            </div>
                                                                            <span className="font-mono font-semibold text-slate-800 text-[11px]">
                                                                                {item.value} <span className="text-slate-400 text-[10px] font-normal">({report.total_tasks ? Math.round((item.value / report.total_tasks) * 100) : 0}%)</span>
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Chart 2: Cumulative Delivery & Burndown Trajectory (Area & Target Line) */}
                                                        <div className="border border-slate-200 rounded p-3.5 bg-white flex flex-col justify-between">
                                                            <div className="mb-2">
                                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                                                    Cumulative Delivery Trajectory
                                                                </h3>
                                                                <p className="text-[11px] text-slate-500">
                                                                    Planned target curve vs. actual story points delivered
                                                                </p>
                                                            </div>
                                                            <div className="h-36 w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <AreaChart
                                                                        data={deliveryTrendData}
                                                                        margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                                                                    >
                                                                        <defs>
                                                                            <linearGradient id="deliveryFillGrad" x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.16} />
                                                                                <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                                                                            </linearGradient>
                                                                        </defs>
                                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                                                                        <Area
                                                                            type="monotone"
                                                                            dataKey="planned"
                                                                            name="Planned Target"
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
                                                                            fill="url(#deliveryFillGrad)"
                                                                            dot={{ r: 3, fill: '#0f172a' }}
                                                                        />
                                                                    </AreaChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sprint Velocity Comparison Chart (Monochrome / Slate Palette) */}
                                                {((report.sprint_comparison?.length > 0) || (report.sprints_comparison?.length > 0)) && (
                                                    <div className="pt-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                                                    Sprint Velocity &amp; Commitment Adherence
                                                                </h3>
                                                                <p className="text-[11px] text-slate-500">
                                                                    Planned vs. Delivered Story Points across evaluated sprints
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="h-52 w-full border border-slate-200 rounded p-3 bg-white">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart
                                                                    data={report.sprint_comparison || report.sprints_comparison}
                                                                    barCategoryGap="30%"
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                                                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                                                    <Bar dataKey="planned_sp" name="Planned SP" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                                                                    <Bar dataKey="completed_sp" name="Delivered SP" fill="#1e293b" radius={[2, 2, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Team Workload & Task Distribution */}
                                                {report.members_performance?.length > 0 && (
                                                    <div className="pt-2">
                                                        <div className="mb-2">
                                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                                                Team Workload &amp; Delivery Breakdown
                                                            </h3>
                                                            <p className="text-[11px] text-slate-500">
                                                                Assigned vs. Completed Task Distribution by Member
                                                            </p>
                                                        </div>
                                                        <div className="h-48 w-full border border-slate-200 rounded p-3 bg-white">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart
                                                                    data={report.members_performance}
                                                                    layout="vertical"
                                                                    barCategoryGap="25%"
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={120} axisLine={false} tickLine={false} />
                                                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                                                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                                                                    <Bar dataKey="assigned_count" name="Assigned Tasks" fill="#cbd5e1" radius={[0, 2, 2, 0]} />
                                                                    <Bar dataKey="completed_count" name="Completed Tasks" fill="#0f172a" radius={[0, 2, 2, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Detailed Jira-Style Task Breakdown Table */}
                                                {report.audit_tasks?.length > 0 && (
                                                    <div className="pt-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                                                    Detailed Task Audit Log
                                                                </h3>
                                                                <p className="text-[11px] text-slate-500">
                                                                    Itemized breakdown of scope items ({report.audit_tasks.length} total tasks)
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="border border-slate-200 rounded overflow-hidden">
                                                            <table className="w-full text-left text-xs border-collapse">
                                                                <thead>
                                                                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                                                                        <th className="py-2.5 px-3">Key</th>
                                                                        <th className="py-2.5 px-3">Summary</th>
                                                                        <th className="py-2.5 px-3">Assignee</th>
                                                                        <th className="py-2.5 px-3">Status</th>
                                                                        <th className="py-2.5 px-3">Due Date</th>
                                                                        <th className="py-2.5 px-3 text-right">SP</th>
                                                                        <th className="py-2.5 px-3 text-right">Delivery Variance</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {report.audit_tasks.map((t, idx) => (
                                                                        <tr key={t.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                                                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                                                                WS-{t.id}
                                                                            </td>
                                                                            <td className="py-2 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                                                                                {t.title}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-slate-600">
                                                                                {t.assigned_employee || 'Unassigned'}
                                                                            </td>
                                                                            <td className="py-2 px-3">
                                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                                    t.status === 'completed'
                                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                                        : t.status === 'in_progress'
                                                                                        ? 'bg-blue-100 text-blue-800'
                                                                                        : 'bg-slate-100 text-slate-700'
                                                                                }`}>
                                                                                    {t.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                                                                                {t.deadline || '—'}
                                                                            </td>
                                                                            <td className="py-2 px-3 font-mono text-slate-700 text-right">
                                                                                {t.final_sp ?? 0}
                                                                            </td>
                                                                            <td className={`py-2 px-3 font-semibold text-[10px] uppercase text-right ${
                                                                                t.on_time_status === 'on_time'
                                                                                    ? 'text-emerald-700'
                                                                                    : t.on_time_status === 'late'
                                                                                    ? 'text-amber-700'
                                                                                    : t.on_time_status === 'overdue'
                                                                                    ? 'text-rose-700'
                                                                                    : 'text-slate-500'
                                                                            }`}>
                                                                                {t.on_time_status?.replace(/_/g, ' ') || 'Normal'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Formal Governance & Sign-Off Footer */}
                                                <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
                                                    <div>
                                                        WorkSync Project Intelligence System &bull; Confidential &bull; For Authorized Studio Eyes Only
                                                    </div>
                                                    <div className="font-mono">
                                                        Generated: {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* ARCHIVE TAB: Searchable Record Directory                 */}
                    {/* ======================================================== */}
                    {activeTab === 'archive' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            {/* Filter bar */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search archive by report title, project, or author..."
                                        value={archiveSearch}
                                        onChange={e => setArchiveSearch(e.target.value)}
                                        className="w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2 focus:ring-brand focus:border-brand"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <select
                                        value={archiveTypeFilter}
                                        onChange={e => setArchiveTypeFilter(e.target.value)}
                                        className="text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-3 focus:ring-brand focus:border-brand"
                                    >
                                        <option value="all">All Report Types</option>
                                        <option value="project_summary">Project Summary</option>
                                        <option value="sprint_performance">Sprint Performance</option>
                                        <option value="individual_performance">Individual Performance</option>
                                        <option value="team_performance">Team Performance</option>
                                        <option value="task_audit">Task Audit</option>
                                        <option value="my_performance">My Performance</option>
                                    </select>
                                    <select
                                        value={archiveProjectFilter}
                                        onChange={e => setArchiveProjectFilter(e.target.value)}
                                        className="text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-3 focus:ring-brand focus:border-brand"
                                    >
                                        <option value="all">All Projects</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Archive table */}
                            {filteredArchivedReports.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                        <Archive className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            No archived reports found
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                            Historic audit documents and sprint sign-offs will appear here for compliance review.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTabChange('generate')}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-all cursor-pointer"
                                    >
                                        Generate New Report
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                                                    <th className="py-3 px-4">Report Title</th>
                                                    <th className="py-3 px-4">Type</th>
                                                    <th className="py-3 px-4">Scope</th>
                                                    <th className="py-3 px-4">Layout</th>
                                                    <th className="py-3 px-4">Created By</th>
                                                    <th className="py-3 px-4">Date</th>
                                                    <th className="py-3 px-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredArchivedReports.map(r => (
                                                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-[240px] truncate">
                                                            {r.name}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                                {r.type.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                                                            {r.target_name || 'Workspace'}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                                                                r.orientation === 'landscape'
                                                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                            }`}>
                                                                {r.orientation || 'portrait'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                                                            {r.created_by}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                                                            {new Date(r.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    title="Open Preview"
                                                                    onClick={() => {
                                                                        setReport(r.metrics);
                                                                        setOrientation(r.orientation || 'portrait');
                                                                        setSelectedTypeKey(r.type);
                                                                        setActiveTab('generate');
                                                                        setMaxStep(3);
                                                                        setWizardStep(3);
                                                                        setStepDirection('forward');
                                                                    }}
                                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Download PDF"
                                                                    onClick={() => handleDownloadPdf(r, r.orientation || 'portrait')}
                                                                    className="p-1.5 rounded-lg text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Delete"
                                                                    onClick={() => setArchiveDeleteTarget(r)}
                                                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Email Sharing Modal */}
            {emailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-brand" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Email Executive Report
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEmailModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSendEmail} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Recipient Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="stakeholder@company.com"
                                    value={emailRecipient}
                                    onChange={e => setEmailRecipient(e.target.value)}
                                    className="w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2.5 px-3 focus:ring-brand focus:border-brand"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Personal Note (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Add context or executive commentary for the recipient..."
                                    value={emailNote}
                                    onChange={e => setEmailNote(e.target.value)}
                                    className="w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2.5 px-3 focus:ring-brand focus:border-brand"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEmailModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSendingEmail}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-brand/20"
                                >
                                    {isSendingEmail ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                    <span>Send Report</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat Sharing Modal */}
            {chatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Send className="w-5 h-5 text-brand" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Send in WorkSync Chat
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChatModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSendChat} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Delivery Destination
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[['dm', 'Direct Message'], ['channel', 'Team Channel']].map(([val, label]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                                setChatRecipientType(val);
                                                setChatRecipientId(val === 'channel' ? 'ch-general' : '');
                                            }}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                                                chatRecipientType === val
                                                    ? 'bg-brand text-white border-brand'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {chatRecipientType === 'dm' ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Team Member <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={chatRecipientId}
                                        onChange={e => setChatRecipientId(e.target.value)}
                                        className="w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2.5 px-3 focus:ring-brand focus:border-brand"
                                    >
                                        <option value="">Select a member...</option>
                                        {teamMembers.filter(m => String(m.id) !== String(currentUser?.id)).map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.email})
                                            </option>
                                        ))}
                                    </select>
                                    {teamMembers.filter(m => String(m.id) !== String(currentUser?.id)).length === 0 && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                            No other team members found in this studio.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Team Channel <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={chatRecipientId}
                                        onChange={e => setChatRecipientId(e.target.value)}
                                        className="w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2.5 px-3 focus:ring-brand focus:border-brand"
                                    >
                                        <option value="ch-general">#general — Studio-wide announcements & discussion</option>
                                        <option value="ch-sprint">#sprint-room — Active sprint execution & blocker coordination</option>
                                        <option value="ch-dev">#dev-help — Code reviews, technical questions & architecture</option>
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Note (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Add context or notes for the chat..."
                                    value={chatNote}
                                    onChange={e => setChatNote(e.target.value)}
                                    className="w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2.5 px-3 focus:ring-brand focus:border-brand"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setChatModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSendingChat}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-brand/20"
                                >
                                    {isSendingChat ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                    <span>Share in Chat</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permanent Archive Deletion Modal */}
            <ConfirmationModal
                isOpen={Boolean(archiveDeleteTarget)}
                onClose={() => setArchiveDeleteTarget(null)}
                onConfirm={confirmDeleteArchive}
                title="Delete Archived Report"
                message={`Are you sure you want to permanently delete '${archiveDeleteTarget?.name}'? This cannot be undone.`}
                confirmText="Delete Report"
                variant="danger"
                loading={isDeletingArchive}
            />
        </TenantLayout>
    );
}
