import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import axios from 'axios';
import {
    FileText,
    Archive,
    Download,
    Trash2,
    Calendar,
    User,
    FolderKanban,
    PlusCircle,
    CheckCircle2,
    ChevronRight,
    HelpCircle,
    BarChart3,
    TrendingUp,
    Clock,
    AlertCircle,
    Send,
    Mail,
    Printer,
    Layers,
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
    PieChart as PieChartIcon,
    Sparkles,
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
    CartesianGrid,
} from 'recharts';
import ApplicationLogo from '@/Components/ApplicationLogo';
import ConfirmationModal from '@/Components/ConfirmationModal';
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

export default function Docs({
    studio,
    projects = [],
    members = [],
    reports = [],
    initialProjectId = null,
    initialSprintId = null,
    initialReportData = null,
}) {
    const { activeWorkspace } = usePage().props;
    const workspaceSlug = studio?.id || activeWorkspace;

    // Main tabs: 'handbook' | 'archive'
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'archive' || params.get('tab') === 'reports') {
                return 'archive';
            }
        }
        return 'handbook';
    });

    // Sub-tab inside Report Archiving: 'generator' | 'gallery'
    const [archiveSubTab, setArchiveSubTab] = useState('generator');

    // ── REPORT GENERATION FILTERS & STATE ──
    const [selectedProjectId, setSelectedProjectId] = useState(
        initialProjectId || (projects.length > 0 ? projects[0].id : '')
    );
    const [selectedSprintId, setSelectedSprintId] = useState(
        initialSprintId || 'all'
    );
    const [generatorViewTab, setGeneratorViewTab] = useState('overview'); // 'overview' | 'audit' | 'team'

    const [report, setReport] = useState(initialReportData);
    const [loadingReport, setLoadingReport] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    // Modals
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [activePrintReport, setActivePrintReport] = useState(null);
    const [emailTargetReport, setEmailTargetReport] = useState(null);

    // Email share form
    const [recipientEmail, setRecipientEmail] = useState('');
    const [emailNote, setEmailNote] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailError, setEmailError] = useState(null);

    // Chat share form
    const [chatRecipientType, setChatRecipientType] = useState('dm'); // 'dm' | 'channel'
    const [chatRecipientId, setChatRecipientId] = useState(
        members.length > 0 ? String(members[0].id) : 'ch-general'
    );
    const [chatNote, setChatNote] = useState('');
    const [sendingChat, setSendingChat] = useState(false);

    // Audit table search & filters
    const [auditSearch, setAuditSearch] = useState('');
    const [auditStatusFilter, setAuditStatusFilter] = useState('all');

    // Gallery search
    const [gallerySearch, setGallerySearch] = useState('');
    const [galleryScopeFilter, setGalleryScopeFilter] = useState('all');

    // Delete archived report state
    const [reportToDelete, setReportToDelete] = useState(null);
    const [isDeletingReport, setIsDeletingReport] = useState(false);

    // Currently selected project model
    const currentProject = useMemo(() => {
        return projects.find((p) => String(p.id) === String(selectedProjectId)) || null;
    }, [projects, selectedProjectId]);

    // Sprints for currently selected project
    const projectSprints = useMemo(() => {
        return currentProject?.sprints || [];
    }, [currentProject]);

    // Fetch report metrics via AJAX
    const fetchReport = async (projId, spId) => {
        if (!projId || !workspaceSlug) return;
        setLoadingReport(true);
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
            setLoadingReport(false);
        }
    };

    const handleProjectChange = (e) => {
        const newProjId = e.target.value;
        setSelectedProjectId(newProjId);
        setSelectedSprintId('all');
        fetchReport(newProjId, 'all');
    };

    const handleSprintChange = (e) => {
        const newSprintId = e.target.value;
        setSelectedSprintId(newSprintId);
        fetchReport(selectedProjectId, newSprintId);
    };

    // ── ARCHIVE THIS GENERATED REPORT ──
    const handleArchiveCurrentReport = async () => {
        if (!report) {
            showToast('No report data to archive.', 'warning');
            return;
        }
        setIsArchiving(true);
        try {
            const defaultName = report.title || `${currentProject?.name || 'Project'}_Report_${new Date().toISOString().slice(0, 10)}`;
            const res = await axios.post(`/studio/${workspaceSlug}/docs/archive`, {
                name: defaultName,
                type: selectedSprintId === 'all' ? 'project' : 'sprint',
                project_id: selectedProjectId,
                sprint_id: selectedSprintId,
                scope: selectedSprintId === 'all' ? 'project' : 'sprint',
                metrics: report,
            });
            showToast('Report generated & archived successfully!', 'success');
            router.reload({ only: ['reports'] });
        } catch (err) {
            showToast('Failed to archive report. Please try again.', 'error');
        } finally {
            setIsArchiving(false);
        }
    };

    // ── EXPORT CSV ──
    const handleExportCsv = () => {
        if (!selectedProjectId) return;
        const scope = selectedSprintId === 'all' ? 'project' : 'sprint';
        window.location.href = `/studio/${workspaceSlug}/reports/export-csv?project_id=${selectedProjectId}&sprint_id=${selectedSprintId}&scope=${scope}`;
    };

    // ── PRINT REPORT ──
    const handlePrint = () => {
        window.print();
    };

    // ── EMAIL REPORT ──
    const handleSendEmail = async (e) => {
        e.preventDefault();
        setEmailError(null);
        if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        setSendingEmail(true);
        try {
            const payload = {
                recipient_email: recipientEmail.trim(),
                personal_note: emailNote.trim(),
            };

            if (emailTargetReport?.id) {
                payload.archived_report_id = emailTargetReport.id;
            } else {
                payload.project_id = selectedProjectId;
                payload.sprint_id = selectedSprintId;
                payload.scope = selectedSprintId === 'all' ? 'project' : 'sprint';
            }

            const res = await axios.post(`/studio/${workspaceSlug}/reports/share-email`, payload);

            if (res.data?.success) {
                showToast(res.data.message || 'Report sent successfully via email.', 'success');
                setEmailModalOpen(false);
                setEmailTargetReport(null);
                setRecipientEmail('');
                setEmailNote('');
            } else {
                setEmailError(res.data?.message || 'Failed to send email.');
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

    // ── SHARE TO CHAT ──
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
                showToast(res.data.message || 'Report shared to chat room!', 'success');
                setChatModalOpen(false);
                setChatNote('');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to share report in chat.', 'error');
        } finally {
            setSendingChat(false);
        }
    };

    // ── DELETE ARCHIVED REPORT ──
    const handleDeleteReport = (reportId) => {
        setReportToDelete(reportId);
    };

    const confirmDeleteReport = () => {
        if (!reportToDelete) return;
        setIsDeletingReport(true);
        router.delete(route('tenant.docs.archive.delete', { tenant: activeWorkspace, report: reportToDelete }), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Archived report deleted successfully.', 'info');
                setReportToDelete(null);
                setIsDeletingReport(false);
            },
            onError: () => {
                showToast('Failed to delete archived report.', 'error');
                setIsDeletingReport(false);
            },
        });
    };

    // ── DOWNLOAD CSV FOR ARCHIVED REPORT ──
    const downloadCsvReport = (archivedReport) => {
        const csvRows = [];
        csvRows.push(['SPRINTSTUDIO - ARCHIVED COMPLIANCE REPORT']);
        csvRows.push(['Report Name', archivedReport.name]);
        csvRows.push(['Scope Type', (archivedReport.type || 'PROJECT').toUpperCase()]);
        csvRows.push(['Target Name', archivedReport.target_name || 'All Workspace']);
        csvRows.push(['Generated By', archivedReport.created_by]);
        csvRows.push(['Date Generated', new Date(archivedReport.created_at).toLocaleString()]);
        csvRows.push([]);

        // Metrics summary
        csvRows.push(['METRICS SUMMARY']);
        csvRows.push(['Total Tasks', archivedReport.metrics?.total_tasks ?? 0]);
        csvRows.push(['Completed Tasks', archivedReport.metrics?.completed_tasks ?? 0]);
        if (archivedReport.metrics?.completion_rate !== undefined) {
            csvRows.push(['Completion Rate', `${archivedReport.metrics.completion_rate}%`]);
        }
        if (archivedReport.metrics?.planned_story_points !== undefined) {
            csvRows.push(['Planned Story Points', archivedReport.metrics.planned_story_points]);
            csvRows.push(['Completed Story Points', archivedReport.metrics.completed_story_points ?? 0]);
        }
        csvRows.push([]);

        // Tasks breakdown
        const auditTasks = archivedReport.metrics?.audit_tasks || archivedReport.metrics?.tasks_list || [];
        if (auditTasks.length > 0) {
            csvRows.push(['TASK BREAKDOWN']);
            csvRows.push(['Task ID', 'Title', 'Status', 'Priority', 'Assignee', 'On-Time Status']);
            auditTasks.forEach((t) => {
                csvRows.push([
                    t.id,
                    t.title,
                    t.status,
                    t.priority || 'Medium',
                    t.assigned_employee || t.assignee || 'Unassigned',
                    t.on_time_status || (t.is_critical ? 'Critical' : 'Standard'),
                ]);
            });
        }

        const csvContent = csvRows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${archivedReport.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Direct PDF download using html2pdf with zero-offset isolated container rendering
    const downloadPdfDirectly = (rep) => {
        const reportToDownload = rep || activePrintReport || report;
        if (!reportToDownload) return;

        const wasModalAlreadyOpen = Boolean(activePrintReport);
        setActivePrintReport(reportToDownload);

        const tryExecute = (attempts = 0) => {
            const sourceElement = document.getElementById('print-area');
            if (!sourceElement) {
                if (attempts < 8) {
                    setTimeout(() => tryExecute(attempts + 1), 120);
                    return;
                }
                window.print();
                return;
            }

            const rawName = reportToDownload.name || reportToDownload.title || 'sprint_report';
            const cleanFilename = `${rawName.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.pdf`;

            // Create an isolated zero-offset render container at (0, 0) to avoid modal centering shift
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

            // Clone the report DOM node
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
                if (!wasModalAlreadyOpen) {
                    setActivePrintReport(null);
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
            setTimeout(() => tryExecute(0), 100);
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => setTimeout(() => tryExecute(0), 100);
            script.onerror = () => window.print();
            document.head.appendChild(script);
        }
    };

    // Filter audit tasks in generated report
    const filteredAuditTasks = useMemo(() => {
        if (!report?.audit_tasks) return [];
        return report.audit_tasks.filter((t) => {
            const matchesSearch =
                auditSearch === '' ||
                t.title.toLowerCase().includes(auditSearch.toLowerCase()) ||
                (t.assigned_employee && t.assigned_employee.toLowerCase().includes(auditSearch.toLowerCase())) ||
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
            name: emp.name.split(' ')[0],
            Completed: emp.completed_count,
            Assigned: emp.assigned_count,
            SP: emp.completed_sp,
        }));
    }, [report]);

    // Filter archived reports gallery
    const filteredArchivedReports = useMemo(() => {
        return reports.filter((r) => {
            const matchesQuery =
                gallerySearch === '' ||
                r.name.toLowerCase().includes(gallerySearch.toLowerCase()) ||
                (r.target_name && r.target_name.toLowerCase().includes(gallerySearch.toLowerCase())) ||
                (r.created_by && r.created_by.toLowerCase().includes(gallerySearch.toLowerCase()));

            let matchesScope = true;
            if (galleryScopeFilter !== 'all') {
                matchesScope = r.type === galleryScopeFilter;
            }

            return matchesQuery && matchesScope;
        });
    }, [reports, gallerySearch, galleryScopeFilter]);

    return (
        <TenantLayout studioName={studio?.name || 'Studio'}>
            <Head title="Documentation & Report Archiving — SprintStudio" />

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 select-none print:p-0 print:bg-white">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* ── Top Header ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs print:hidden">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-brand flex items-center justify-center text-white shadow-xs">
                                    <Archive className="w-5 h-5" />
                                </div>
                                <h1 className="font-heading text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    Documentation & Report Archiving
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Engineering handbook, deterministic scheduling specs, and data-driven Sprint/Project report generation & compliance archiving.
                            </p>
                        </div>

                        {/* Top navigation tabs (Handbook vs Report Archiving) */}
                        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 shrink-0 self-start">
                            <button
                                type="button"
                                onClick={() => setActiveTab('handbook')}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                    activeTab === 'handbook'
                                        ? 'bg-white dark:bg-slate-900 text-brand shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Handbook & Specs
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('archive')}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                    activeTab === 'archive'
                                        ? 'bg-white dark:bg-slate-900 text-brand shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                <Archive className="w-3.5 h-3.5" />
                                Report Archiving
                            </button>
                        </div>
                    </div>

                    {/* ================================================================
                        TAB: HANDBOOK & SPECS
                    ================================================================ */}
                    {activeTab === 'handbook' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        SprintStudio Platform Architecture Overview
                                    </h2>
                                    <p className="mt-3 text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-sans">
                                        Welcome to SprintStudio. Our platform is structured as an integrated multi-tenant pipeline connecting deterministic scheduling calculations with modern deep-learning recommendation algorithms:
                                    </p>
                                    <div className="mt-4 space-y-3 font-sans text-xs text-slate-600 dark:text-slate-300">
                                        {[
                                            { title: 'Deterministic Critical Path Engine', desc: 'Schedules tasks relative to project release boundaries dynamically skipping weekends.' },
                                            { title: 'AI-Powered Developer Match Fit', desc: 'Predicts suitability score between developers and tasks using Graph Neural Network (GNN) embeddings.' },
                                            { title: 'Fast Cloud Inference', desc: 'Leverages cloud-hosted Groq API engines for fast natural language sprint breakdowns.' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                                                <ChevronRight className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-bold text-gray-800 dark:text-slate-200 block">{item.title}</span>
                                                    <span className="text-gray-500 dark:text-slate-400 mt-0.5 block">{item.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                                        Developer Onboarding Playbook
                                    </h2>
                                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                                        Every new developer must complete onboarding via the central profile setup. Ensure that your weekly work capacity (hours) is updated regularly. This is critical for the AI resource allocator and Gantt scheduler to calculate healthy team sprint capacities.
                                    </p>
                                    <div className="mt-4 p-4 rounded-xl border-l-4 border-indigo-500 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 text-xs font-semibold font-sans">
                                        Looking to generate comprehensive sprint/project velocity reports and compliance archives? Switch to the "Report Archiving" tab at the top-right.
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                                        Need Help?
                                    </h3>
                                    <div className="mt-3 space-y-3 font-sans text-xs">
                                        {[
                                            'How do I add dependencies to tasks?',
                                            'What is task float slack?',
                                            'How do I archive and export sprint reports?',
                                        ].map((q, idx) => (
                                            <a key={idx} href="#" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand transition-colors py-1.5 border-b border-gray-100 last:border-0 dark:border-slate-800">
                                                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="truncate">{q}</span>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {/* ================================================================
                        TAB: REPORT ARCHIVING (COMPREHENSIVE GENERATION & ARCHIVES)
                    ================================================================ */}
                    {activeTab === 'archive' && (
                        <div className="space-y-6">

                            {/* Sub-Tabs Selector inside Report Archiving */}
                            <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setArchiveSubTab('generator')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                            archiveSubTab === 'generator'
                                                ? 'bg-brand text-white shadow-xs'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                                        }`}
                                    >
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        <span>Report Generator & Live Analytics</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setArchiveSubTab('gallery')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                            archiveSubTab === 'gallery'
                                                ? 'bg-brand text-white shadow-xs'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                                        }`}
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                        <span>Archived Reports Registry</span>
                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                            {reports.length}
                                        </span>
                                    </button>
                                </div>

                                {archiveSubTab === 'generator' && report && (
                                    <button
                                        type="button"
                                        onClick={handleArchiveCurrentReport}
                                        disabled={isArchiving}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50"
                                        title="Save and permanently archive this report snapshot"
                                    >
                                        {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                                        <span>Archive This Report</span>
                                    </button>
                                )}
                            </div>

                            {/* ── SUB-VIEW 1: REPORT GENERATOR & LIVE ANALYTICS ── */}
                            {archiveSubTab === 'generator' && (
                                <div className="space-y-6">

                                    {/* Selection & Action Controls */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs print:hidden">
                                        <div className="flex flex-wrap items-center gap-3 flex-1">
                                            {/* Project Picker */}
                                            <div className="flex items-center gap-2">
                                                <label htmlFor="gen-proj-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Project:
                                                </label>
                                                <select
                                                    id="gen-proj-select"
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
                                                <label htmlFor="gen-sprint-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Sprint:
                                                </label>
                                                <select
                                                    id="gen-sprint-select"
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

                                        {/* Action Buttons: Export CSV, PDF, Share, Email */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => setChatModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand/10 dark:bg-brand/20 text-brand hover:bg-brand/20 transition-all shadow-2xs"
                                                title="Share report to a team channel or direct message"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span>Share to Chat</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setEmailModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-2xs"
                                                title="Email report directly to stakeholders"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                                <span>Email</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleExportCsv}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-2xs"
                                                title="Export spreadsheet breakdown"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Export CSV</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => downloadPdfDirectly(report)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-all shadow-2xs"
                                                title="Export clean PDF report document"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>Export as PDF</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* View Tabs */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                                            {[
                                                { id: 'overview', label: 'Overview & Visuals', icon: BarChart3 },
                                                { id: 'audit', label: `Sprint Audit Tasks (${report?.total_tasks ?? 0})`, icon: Shield },
                                                { id: 'team', label: `Team Matrix (${report?.employee_performance?.length ?? 0})`, icon: User },
                                            ].map((tab) => {
                                                const Icon = tab.icon;
                                                const isActive = generatorViewTab === tab.id;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setGeneratorViewTab(tab.id)}
                                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

                                        {report && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <span>{report.title}</span>
                                                {report.start_date && (
                                                    <span className="hidden sm:inline text-slate-400">
                                                        ({report.start_date} – {report.end_date})
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Loading State */}
                                    {loadingReport && (
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                                            <p className="text-xs font-semibold">Calculating data-driven metrics...</p>
                                        </div>
                                    )}

                                    {!loadingReport && report && (
                                        <>
                                            {/* KPI Cards */}
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

                                                {/* 5. Overdue */}
                                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 col-span-2 lg:col-span-1">
                                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                                        <span className="font-bold uppercase tracking-wider">Overdue Tasks</span>
                                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                                    </div>
                                                    <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                                                        {report.overdue_tasks}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {report.overdue_tasks > 0 ? 'Requires attention' : 'All tasks on schedule'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ── SUB-TAB: OVERVIEW & CHARTS ── */}
                                            {generatorViewTab === 'overview' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                                        {/* Donut Chart */}
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

                                                        {/* Developer contribution bars */}
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

                                                    {/* Priority Distribution */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                                                <Cell key={`p-cell-${index}`} fill={entry.fill} />
                                                                            ))}
                                                                        </Bar>
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>

                                                        {/* Difficulty Distribution */}
                                                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                                <Layers className="w-4 h-4 text-indigo-500" />
                                                                Task Difficulty Breakdown
                                                            </h3>
                                                            <div className="space-y-3 pt-2">
                                                                {['Easy', 'Medium', 'Hard'].map((lvl) => {
                                                                    const count = report?.difficulty_distribution?.[lvl] || 0;
                                                                    const pct = report?.total_tasks ? Math.round((count / report.total_tasks) * 100) : 0;
                                                                    const color = DIFFICULTY_COLORS[lvl];
                                                                    return (
                                                                        <div key={lvl} className="space-y-1.5">
                                                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                                                <span className="text-slate-700 dark:text-slate-300">{lvl}</span>
                                                                                <span className="text-slate-400">
                                                                                    {count} tasks ({pct}%)
                                                                                </span>
                                                                            </div>
                                                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── SUB-TAB: AUDIT BREAKDOWN ── */}
                                            {generatorViewTab === 'audit' && (
                                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="relative flex-1 max-w-sm">
                                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                value={auditSearch}
                                                                onChange={(e) => setAuditSearch(e.target.value)}
                                                                placeholder="Search by task title or developer..."
                                                                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand"
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                                                            {[
                                                                { id: 'all', label: 'All Tasks' },
                                                                { id: 'completed', label: 'Completed' },
                                                                { id: 'on_time', label: 'On-Time' },
                                                                { id: 'late', label: 'Completed Late' },
                                                                { id: 'overdue', label: 'Overdue' },
                                                            ].map((f) => (
                                                                <button
                                                                    key={f.id}
                                                                    type="button"
                                                                    onClick={() => setAuditStatusFilter(f.id)}
                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                                                                        auditStatusFilter === f.id
                                                                            ? 'bg-brand text-white shadow-2xs'
                                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                                    }`}
                                                                >
                                                                    {f.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                                    <th className="py-2.5 px-3">Task ID</th>
                                                                    <th className="py-2.5 px-3">Title</th>
                                                                    <th className="py-2.5 px-3">Assignee</th>
                                                                    <th className="py-2.5 px-3">Status</th>
                                                                    <th className="py-2.5 px-3">Deadline</th>
                                                                    <th className="py-2.5 px-3">Delivery</th>
                                                                    <th className="py-2.5 px-3">Story Points</th>
                                                                    <th className="py-2.5 px-3">Priority</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                                {filteredAuditTasks.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={8} className="py-10 text-center text-slate-400">
                                                                            No tasks found matching criteria.
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    filteredAuditTasks.map((t) => (
                                                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                                            <td className="py-2.5 px-3 font-mono text-slate-400">#{t.id}</td>
                                                                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate" title={t.title}>
                                                                                {t.title}
                                                                            </td>
                                                                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                                                                {t.assigned_employee}
                                                                            </td>
                                                                            <td className="py-2.5 px-3">
                                                                                <span
                                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                                                        t.status === 'completed'
                                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                                                                                    }`}
                                                                                >
                                                                                    {t.status.replace(/_/g, ' ')}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{t.deadline || '—'}</td>
                                                                            <td className="py-2.5 px-3">
                                                                                <span
                                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                                                        t.on_time_status === 'on_time'
                                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                                            : t.on_time_status === 'late'
                                                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                                                            : t.on_time_status === 'overdue'
                                                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                                    }`}
                                                                                >
                                                                                    {t.on_time_status.replace(/_/g, ' ')}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                                {t.final_sp} SP
                                                                            </td>
                                                                            <td className="py-2.5 px-3">
                                                                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                                                                    {t.priority}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── SUB-TAB: TEAM CONTRIBUTION MATRIX ── */}
                                            {generatorViewTab === 'team' && (
                                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden p-5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                            <User className="w-4 h-4 text-indigo-500" />
                                                            Developer Performance & Workload Breakdown
                                                        </h3>
                                                        <span className="text-xs text-slate-400">
                                                            {report.employee_performance?.length ?? 0} Contributors
                                                        </span>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                                    <th className="py-2.5 px-3">Developer</th>
                                                                    <th className="py-2.5 px-3">Assigned Tasks</th>
                                                                    <th className="py-2.5 px-3">Completed Tasks</th>
                                                                    <th className="py-2.5 px-3">SP Delivered</th>
                                                                    <th className="py-2.5 px-3">On-Time Rate</th>
                                                                    <th className="py-2.5 px-3">Overdue</th>
                                                                    <th className="py-2.5 px-3">Contribution</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                                {(report.employee_performance || []).length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={7} className="py-10 text-center text-slate-400">
                                                                            No developer contribution data available.
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    report.employee_performance.map((emp) => (
                                                                        <tr key={emp.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                                            <td className="py-2.5 px-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[11px] shrink-0">
                                                                                        {emp.name.charAt(0)}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="font-bold text-slate-900 dark:text-slate-100">{emp.name}</p>
                                                                                        <p className="text-[10px] text-slate-400">{emp.role}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                                                                {emp.assigned_count}
                                                                            </td>
                                                                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                                                                {emp.completed_count}
                                                                            </td>
                                                                            <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                                                                {emp.completed_sp} pts
                                                                            </td>
                                                                            <td className="py-2.5 px-3 font-bold">
                                                                                {emp.on_time_pct}%
                                                                            </td>
                                                                            <td className="py-2.5 px-3 text-rose-500 font-bold">
                                                                                {emp.overdue_count}
                                                                            </td>
                                                                            <td className="py-2.5 px-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className="bg-brand h-full rounded-full"
                                                                                            style={{ width: `${Math.min(100, emp.contribution_pct)}%` }}
                                                                                        />
                                                                                    </div>
                                                                                    <span className="font-mono text-slate-500 text-[11px]">{emp.contribution_pct}%</span>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── SUB-VIEW 2: ARCHIVED REPORTS GALLERY ── */}
                            {archiveSubTab === 'gallery' && (
                                <div className="space-y-4">
                                    {/* Gallery Controls */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                                        <div className="relative flex-1 max-w-sm">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={gallerySearch}
                                                onChange={(e) => setGallerySearch(e.target.value)}
                                                placeholder="Search archived reports..."
                                                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setArchiveSubTab('generator')}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand text-white shadow-xs hover:bg-brand-dark transition-all"
                                            >
                                                <PlusCircle className="w-3.5 h-3.5" />
                                                <span>Generate New Report</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Archived Reports List */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredArchivedReports.length === 0 ? (
                                            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                                                <Archive className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No archived reports found</p>
                                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                                    Use the "Report Generator & Live Analytics" tab above to analyze sprint or project metrics and click "Archive This Report" to permanently save it.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setArchiveSubTab('generator')}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white shadow-xs"
                                                >
                                                    <BarChart3 className="w-3.5 h-3.5" />
                                                    <span>Open Report Generator</span>
                                                </button>
                                            </div>
                                        ) : (
                                            filteredArchivedReports.map((rep) => (
                                                <div
                                                    key={rep.id}
                                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-brand/40 transition-all"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-brand/10 text-brand">
                                                                {rep.type}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {new Date(rep.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate" title={rep.name}>
                                                            {rep.name}
                                                        </h3>

                                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                            <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="truncate">{rep.target_name}</span>
                                                        </p>

                                                        {rep.metrics && (
                                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                                                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Tasks</p>
                                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                                                                        {rep.metrics.total_tasks ?? 0}
                                                                    </p>
                                                                </div>
                                                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Done</p>
                                                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                                        {rep.metrics.completed_tasks ?? 0}
                                                                    </p>
                                                                </div>
                                                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Rate</p>
                                                                    <p className="text-xs font-black text-brand mt-0.5">
                                                                        {rep.metrics.completion_rate ?? 0}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                        <span className="text-[10px] text-slate-400 truncate">
                                                            By {rep.created_by}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEmailTargetReport(rep);
                                                                    setEmailModalOpen(true);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
                                                                title="Email this archived report (PDF + CSV)"
                                                            >
                                                                <Mail className="w-3.5 h-3.5" />
                                                                <span>Email</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => downloadCsvReport(rep)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                                                                title="Download CSV spreadsheet"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                <span>CSV</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => downloadPdfDirectly(rep)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-colors shadow-2xs"
                                                                title="Export as PDF"
                                                            >
                                                                <Printer className="w-3.5 h-3.5" />
                                                                <span>Export PDF</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActivePrintReport(rep)}
                                                                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                                                title="View Full Report in Modal"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteReport(rep.id)}
                                                                className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                                title="Delete Report"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>

            {/* ── EMAIL MODAL ── */}
            {emailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {emailTargetReport ? 'Email Archived Report' : 'Email Report'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                        {emailTargetReport ? (emailTargetReport.name || emailTargetReport.title) : (report?.title || 'Report')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEmailModalOpen(false);
                                    setEmailTargetReport(null);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {emailError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                                {emailError}
                            </div>
                        )}

                        <form onSubmit={handleSendEmail} className="space-y-3.5">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 border border-slate-200 dark:border-slate-700/60">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                     <span>Attachments Included:</span>
                                     <span className="text-[10px] font-bold uppercase text-brand bg-brand/10 px-2 py-0.5 rounded-md">PDF + CSV</span>
                                 </p>
                                 <p className="text-slate-600 dark:text-slate-400">
                                     This email will deliver both the formatted <strong>PDF Report</strong> and the raw <strong>CSV Audit spreadsheet</strong> directly as email attachments.
                                 </p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Recipient Email
                                </label>
                                <input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="client@company.com or stakeholder@test.io"
                                    required
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Personal Note (Optional)
                                </label>
                                <textarea
                                    value={emailNote}
                                    onChange={(e) => setEmailNote(e.target.value)}
                                    placeholder="Add executive commentary or sprint notes..."
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmailModalOpen(false);
                                        setEmailTargetReport(null);
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingEmail}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    <span>Send Email</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── CHAT SHARE MODAL ── */}
            {chatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Share Report in Chat</h3>
                                    <p className="text-[11px] text-slate-400 truncate block" title={report?.title || 'Report'}>{report?.title || 'Report'}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChatModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSendChat} className="space-y-3.5">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Destination Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChatRecipientType('dm');
                                            if (members.length > 0) setChatRecipientId(String(members[0].id));
                                        }}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                            chatRecipientType === 'dm'
                                                ? 'bg-brand/10 border-brand text-brand'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
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
                                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                            chatRecipientType === 'channel'
                                                ? 'bg-brand/10 border-brand text-brand'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        Team Channel
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    {chatRecipientType === 'dm' ? 'Select Team Member' : 'Select Channel'}
                                </label>
                                {chatRecipientType === 'dm' ? (
                                    <select
                                        value={chatRecipientId}
                                        onChange={(e) => setChatRecipientId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand"
                                    >
                                        {members.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.role})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={chatRecipientId}
                                        onChange={(e) => setChatRecipientId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand"
                                    >
                                        <option value="ch-general">#general (Announcements)</option>
                                        <option value="ch-sprint">#sprint-room (Sprint Coordination)</option>
                                        <option value="ch-dev">#dev-help (Engineering)</option>
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Commentary Note (Optional)
                                </label>
                                <textarea
                                    value={chatNote}
                                    onChange={(e) => setChatNote(e.target.value)}
                                    placeholder="Add notes for the channel..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setChatModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingChat}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {sendingChat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    <span>Post to Chat</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── ARCHIVED REPORT VIEW / PRINT MODAL ── */}
            {activePrintReport && (
                <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto print:z-auto">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between print:max-h-none print:overflow-visible print:shadow-none print:border-none print:rounded-none">
                        
                        {/* Actions bar - hidden on print */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-150/80 dark:bg-slate-800 dark:border-slate-800 print:hidden">
                            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">SprintStudio Report Archive</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmailTargetReport(activePrintReport);
                                        setEmailModalOpen(true);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
                                    title="Email this archived report (PDF + CSV)"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    Email Report
                                </button>
                                <button
                                    type="button"
                                    onClick={() => downloadPdfDirectly(activePrintReport)}
                                    className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download as PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => downloadCsvReport(activePrintReport)}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download CSV (Excel)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActivePrintReport(null)}
                                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs font-bold transition-all"
                                >
                                    Close Preview
                                </button>
                            </div>
                        </div>

                        {/* Scrollable container for preview modal */}
                        <div className="overflow-y-auto flex-1 print:overflow-visible">
                            <style>{`
                                @media print {
                                    body * { visibility: hidden !important; }
                                    #print-area, #print-area * { visibility: visible !important; }
                                    #print-area {
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
                                    }
                                    .print\\:hidden { display: none !important; }
                                }
                            `}</style>
                            <div id="print-area" className="w-full max-w-[794px] mx-auto p-8 md:p-12 space-y-8 bg-white text-slate-900 font-sans print:p-0 box-border">
                                <div className="border-b-2 border-brand pb-6 flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <ApplicationLogo variant="horizontal" className="h-10 w-auto" />
                                        </div>
                                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                                            Sprint Compliance & Velocity Report
                                        </h1>
                                        <p className="text-[10px] font-bold text-brand tracking-wider uppercase">
                                            System-Generated Production Release Archive
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-slate-500 font-mono space-y-0.5">
                                        <p>Report ID: #{activePrintReport.id || 'LIVE'}</p>
                                        <p>Date: {activePrintReport.created_at ? new Date(activePrintReport.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                        <p>Status: {activePrintReport.id ? 'ARCHIVED' : 'LIVE SPEC'}</p>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Report Name</span>
                                        <span className="font-bold text-slate-800 truncate block mt-0.5" title={activePrintReport.name || activePrintReport.title}>
                                            {activePrintReport.name || activePrintReport.title || 'Sprint Report'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scope Type</span>
                                        <span className="font-bold text-slate-800 block mt-0.5 uppercase">
                                            {activePrintReport.type || activePrintReport.scope || 'SPRINT'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Object</span>
                                        <span className="font-bold text-brand block mt-0.5">
                                            {activePrintReport.target_name || activePrintReport.sprint_name || activePrintReport.project_name || 'Workspace'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generated By</span>
                                        <span className="font-bold text-slate-800 block mt-0.5">
                                            {activePrintReport.created_by || 'Studio Lead'}
                                        </span>
                                    </div>
                                </div>

                                {/* Metrics Section */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase text-brand tracking-wider font-heading">Metrics Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="border border-slate-200 rounded-xl p-4 text-center bg-white shadow-2xs">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Tasks</p>
                                            <p className="text-2xl font-black text-slate-800 mt-1">{activePrintReport.metrics?.total_tasks ?? activePrintReport.total_tasks ?? 0}</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-4 text-center bg-white shadow-2xs">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
                                            <p className="text-2xl font-black text-emerald-600 mt-1">{activePrintReport.metrics?.completed_tasks ?? activePrintReport.completed_tasks ?? 0}</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-4 text-center bg-white shadow-2xs">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Rate</p>
                                            <p className="text-2xl font-black text-brand mt-1">{activePrintReport.metrics?.completion_rate ?? activePrintReport.completion_rate ?? 0}%</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-4 text-center bg-white shadow-2xs">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Story Points</p>
                                            <p className="text-2xl font-black text-indigo-600 mt-1">
                                                {activePrintReport.metrics?.completed_story_points ?? activePrintReport.completed_story_points ?? 0}
                                                <span className="text-xs font-medium text-slate-400">/{activePrintReport.metrics?.planned_story_points ?? activePrintReport.planned_story_points ?? 0}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks breakdown */}
                                {((activePrintReport.metrics?.audit_tasks && activePrintReport.metrics.audit_tasks.length > 0) ||
                                  (activePrintReport.metrics?.tasks_list && activePrintReport.metrics.tasks_list.length > 0) ||
                                  (activePrintReport.audit_tasks && activePrintReport.audit_tasks.length > 0)) && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase text-brand tracking-wider font-heading">Task Breakdown</h3>
                                        <div className="overflow-hidden border border-slate-200 rounded-xl">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        <th className="px-4 py-2.5">ID</th>
                                                        <th className="px-4 py-2.5">Title</th>
                                                        <th className="px-4 py-2.5">Status</th>
                                                        <th className="px-4 py-2.5">Priority</th>
                                                        <th className="px-4 py-2.5">Assignee</th>
                                                        <th className="px-4 py-2.5">Delivery</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(activePrintReport.metrics?.audit_tasks || activePrintReport.metrics?.tasks_list || activePrintReport.audit_tasks || []).slice(0, 50).map((t) => (
                                                        <tr key={t.id} className="hover:bg-slate-50/50">
                                                            <td className="px-4 py-2 font-mono text-[10px] text-slate-500">#{t.id}</td>
                                                            <td className="px-4 py-2 font-semibold text-slate-900">{t.title}</td>
                                                            <td className="px-4 py-2 capitalize text-slate-700">{t.status ? t.status.replace(/_/g, ' ') : 'Open'}</td>
                                                            <td className="px-4 py-2 text-slate-700">{t.priority || 'Medium'}</td>
                                                            <td className="px-4 py-2 text-slate-700">{t.assigned_employee || t.assignee || 'Unassigned'}</td>
                                                            <td className="px-4 py-2 capitalize font-semibold text-slate-600">{t.on_time_status ? t.on_time_status.replace(/_/g, ' ') : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!reportToDelete}
                onClose={() => setReportToDelete(null)}
                onConfirm={confirmDeleteReport}
                title="Delete Archived Report"
                message="Are you sure you want to delete this archived report? This action cannot be undone."
                confirmText="Delete Report"
                cancelText="Keep Report"
                variant="danger"
                isLoading={isDeletingReport}
            />
        </TenantLayout>
    );
}
