import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import OnboardingSplitLayout from '@/Components/Onboarding/OnboardingSplitLayout';
import OnboardingPreviewShowcase from '@/Components/Onboarding/OnboardingPreviewShowcase';
import InputError from '@/Components/InputError';
import { Building2, KeyRound, ArrowRight, Loader2, Sparkles, HelpCircle } from 'lucide-react';

export default function Fork() {
    // Mode switcher: 'create' | 'join'
    const [mode, setMode] = useState('create');

    const {
        data: createData,
        setData: setCreateData,
        post: postCreate,
        processing: processingCreate,
        errors: createErrors,
    } = useForm({
        studio_name: '',
    });

    const {
        data: joinData,
        setData: setJoinData,
        post: postJoin,
        processing: processingJoin,
        errors: joinErrors,
    } = useForm({
        invitation_code: '',
    });

    const handleCreateStudio = (e) => {
        e.preventDefault();
        postCreate(route('onboarding.studio.store'));
    };

    const handleJoinStudio = (e) => {
        e.preventDefault();
        postJoin(route('onboarding.join.store'));
    };

    return (
        <OnboardingSplitLayout
            title={mode === 'create' ? "Create a Studio Workspace" : "Join an Existing Studio"}
            subtitle={
                mode === 'create'
                    ? "Start a dedicated multi-tenant workspace for your game studio and projects."
                    : "Enter the 8-character invitation code provided by your studio owner or lead."
            }
            showStepper={false}
            rightContent={
                <OnboardingPreviewShowcase
                    step="fork"
                    forkMode={mode}
                    data={mode === 'create' ? createData : joinData}
                />
            }
        >
            <Head title="Choose Workspace Path — StudioSprint" />

            <div className="space-y-8 animate-in fade-in duration-300">
                {/* Segmented Mode Selector (Linear-Style Pill Switch) */}
                <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center shadow-xs">
                    <button
                        type="button"
                        onClick={() => setMode('create')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                            mode === 'create'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <Building2 className="w-4 h-4 text-brand" />
                        <span>Create New Studio</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode('join')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                            mode === 'join'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        <KeyRound className="w-4 h-4 text-brand" />
                        <span>Join with Code</span>
                    </button>
                </div>

                {/* Form Option A: Create Studio */}
                {mode === 'create' && (
                    <form onSubmit={handleCreateStudio} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="studio_name" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Studio Name <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">e.g., Pixel Play Games</span>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <input
                                    id="studio_name"
                                    type="text"
                                    placeholder="Enter your studio workspace name..."
                                    value={createData.studio_name}
                                    onChange={(e) => setCreateData('studio_name', e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs transition-all"
                                />
                            </div>
                            <InputError message={createErrors.studio_name} className="mt-1" />
                        </div>

                        {/* Tenancy Feature Callout */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Creating a studio automatically configures your isolated PostgreSQL tenant partition, default GNN matching models, and sprint chat room.
                            </p>
                        </div>

                        <div className="pt-4 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={processingCreate}
                                className="inline-flex items-center gap-2 rounded-full px-7 py-3 bg-brand hover:bg-brand-dark dark:hover:bg-brand-light text-white text-sm font-semibold shadow-lg shadow-brand/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-[#0B0F17]"
                            >
                                {processingCreate ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Provisioning Workspace...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Studio Workspace</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Form Option B: Join Existing Studio */}
                {mode === 'join' && (
                    <form onSubmit={handleJoinStudio} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="invitation_code" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Invitation Code <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">8-character code</span>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <input
                                    id="invitation_code"
                                    type="text"
                                    maxLength={8}
                                    placeholder="e.g., A8K9X2M4"
                                    value={joinData.invitation_code}
                                    onChange={(e) => setJoinData('invitation_code', e.target.value.toUpperCase())}
                                    required
                                    autoComplete="off"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono tracking-widest text-base font-bold placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs transition-all uppercase"
                                />
                            </div>
                            <InputError message={joinErrors.invitation_code} className="mt-1" />
                        </div>

                        {/* Helper info banner */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Don't have a code? Ask your studio owner or team lead to copy their invitation code from the Team Directory page.
                            </p>
                        </div>

                        <div className="pt-4 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={processingJoin}
                                className="inline-flex items-center gap-2 rounded-full px-7 py-3 bg-brand hover:bg-brand-dark dark:hover:bg-brand-light text-white text-sm font-semibold shadow-lg shadow-brand/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-[#0B0F17]"
                            >
                                {processingJoin ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Joining Studio...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Join Studio Workspace</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </OnboardingSplitLayout>
    );
}
