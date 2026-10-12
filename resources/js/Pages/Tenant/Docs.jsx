import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { FileText, ArrowRight, Sparkles, Archive, Shield } from 'lucide-react';

export default function Docs({ studio, projects = [], reports = [], initialReportData = null }) {
    const { activeWorkspace } = usePage().props || {};
    const studioName = studio?.name || 'WorkSync Studio';

    return (
        <TenantLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Workspace Documentation & Reports
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Central resource hub for {studioName} workspace specifications and reports.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Documentation — ${studioName}`} />

            <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Notice banner directing to the new Report Center */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-8 border border-indigo-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand text-white shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" /> WorkSync Report Center
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
                            The Report Center is now available
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Report generation and archiving has been completely refactored into a dedicated, role-based Report Center with live PDF preview, landscape formatting, and granular filters.
                        </p>
                        <div className="pt-2">
                            <Link
                                href={`/studio/${activeWorkspace}/reports`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5"
                            >
                                <span>Open Report Center</span>
                                <ArrowRight className="w-4 h-4 text-brand" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Information cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-brand flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Role-Based Reports
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Team leaders can generate full sprint burndowns, project analytics, and cross-team workload comparisons. Members have access to their own performance telemetry and authorized projects.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                            <Archive className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Compliance Archiving
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Previously generated reports are securely stored in the Report Archive with role-based access checks, downloadable in portrait and landscape PDF layouts or raw CSV spreadsheets.
                        </p>
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
