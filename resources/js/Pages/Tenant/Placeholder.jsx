import React from 'react';
import TenantLayout from '@/Layouts/TenantLayout';
import { Head } from '@inertiajs/react';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';

export default function Placeholder({ title, description, status }) {
    return (
        <TenantLayout>
            <Head title={`${title} — StudioSprint`} />

            <div className="flex-1 overflow-y-auto bg-surface text-text-primary p-6 sm:p-10 lg:p-12 select-none">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="font-heading text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
                            {title}
                        </h1>
                        <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Workspace feature module & division coordination space.
                        </p>
                    </div>

                    {/* Feature Card */}
                    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl p-8 lg:p-10">
                        {/* Decorative background grid pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#007cff04_1px,transparent_1px),linear-gradient(to_bottom,#007cff04_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4 max-w-xl">
                                {/* Status Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-10 text-brand border border-brand-30/45 dark:bg-brand/10 dark:text-brand-light">
                                    <Bot className="w-3.5 h-3.5" />
                                    <span>{status || 'Integration Pending'}</span>
                                </div>

                                <h2 className="font-heading text-xl font-bold text-gray-800 dark:text-slate-100">
                                    System Status & Architecture Roadmap
                                </h2>

                                <p className="font-sans text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    {description || 'This feature is currently being integrated with the central Graph Neural Network (GNN) capacity planning service and agent workflows.'}
                                </p>

                                <div className="pt-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                        <AlertCircle className="w-4.5 h-4.5" />
                                    </div>
                                    <span className="font-sans text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                        Note: Requires active credentials for Vaultera Labs division microservices.
                                    </span>
                                </div>
                            </div>

                            {/* visual placeholder element */}
                            <div className="shrink-0 flex items-center justify-center w-36 h-36 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 shadow-inner relative group">
                                <div className="absolute inset-0 bg-brand-light/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl duration-300" />
                                <div className="flex flex-col items-center justify-center text-center p-4">
                                    <Sparkles className="w-8 h-8 text-brand animate-pulse" />
                                    <span className="font-heading text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-2.5">
                                        Active Sync
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Architecture Bento Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-md">
                            <h3 className="font-heading text-sm font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                                GNN Capacity Pipeline
                            </h3>
                            <p className="font-sans text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Automate task assignment based on developer skills (ChEMBL datasets, React/Vue frontends, Django/Laravel backends) and active hours to optimize division velocity.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-md">
                            <h3 className="font-heading text-sm font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                                Agentic CI/CD Coordination
                            </h3>
                            <p className="font-sans text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Trigger automated codebase refactors, branch audits, and test coverages during sprint allocation events for maximum QA guarantees.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </TenantLayout>
    );
}
