import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { 
    Building2, 
    Users, 
    KeyRound, 
    Copy, 
    Check, 
    ShieldCheck, 
    Crown, 
    User, 
    Calendar, 
    Loader2, 
    Sparkles, 
    Shield, 
    Activity,
    Clock,
    ShieldAlert,
    Layers,
    Save
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

export default function Settings({
    studio = {},
    members = [],
    invitations = [],
    canManage = false,
    isOwner = false,
    currentUserRole = 'member',
}) {
    const { activeWorkspace } = usePage().props;
    const [copiedToken, setCopiedToken] = useState(null);
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

    // Form for studio name update
    const { data, setData, patch, processing } = useForm({
        name: studio.name || '',
    });

    const handleUpdateDetails = (e) => {
        e.preventDefault();
        patch(route('tenant.settings.update', { tenant: activeWorkspace }), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Studio name updated successfully!', 'success');
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Failed to update studio name.';
                showToast(msg, 'error');
            },
        });
    };

    const handleGenerateInvite = () => {
        setIsGeneratingInvite(true);
        router.post(route('tenant.settings.invite', { tenant: activeWorkspace }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                showToast('New invite code generated!', 'success');
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Failed to generate invite code.';
                showToast(msg, 'error');
            },
            onFinish: () => {
                setIsGeneratingInvite(false);
            },
        });
    };

    const handleCopyCode = (token) => {
        if (!navigator?.clipboard) {
            showToast(`Code: ${token}`, 'info');
            return;
        }
        navigator.clipboard.writeText(token).then(() => {
            setCopiedToken(token);
            showToast(`Invite code ${token} copied to clipboard!`, 'success');
            setTimeout(() => setCopiedToken(null), 2500);
        });
    };

    const roleBadge = (role) => {
        switch (role) {
            case 'owner':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Crown className="w-3 h-3 text-amber-500" />
                        Owner
                    </span>
                );
            case 'leader':
            case 'manager':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <Shield className="w-3 h-3 text-indigo-500" />
                        Leader
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <User className="w-3 h-3 text-slate-400" />
                        Member
                    </span>
                );
        }
    };

    const statusIndicator = (status) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        Active
                    </span>
                );
            case 'on_leave':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        On Leave
                    </span>
                );
            case 'emergency':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        Emergency
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        Active
                    </span>
                );
        }
    };

    return (
        <TenantLayout studioName={studio.name || 'Studio'}>
            <Head title={`Settings — ${studio.name || 'Studio'}`} />

            <div className="flex-1 overflow-y-auto bg-surface text-text-primary p-6 sm:p-10 lg:p-12">
                <div className="max-w-5xl mx-auto space-y-10">
                    
                    {/* Page Header */}
                    <div>
                        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
                            Studio Settings
                        </h1>
                        <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Configure workspace metadata, manage team access, and generate member invite codes.
                        </p>
                    </div>

                    {/* Section 1: Studio Details */}
                    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                        <div className="p-6 sm:p-7 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                                        Studio Workspace Details
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Primary identification and routing slug
                                    </p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                ID: {studio.id}
                            </span>
                        </div>

                        <form onSubmit={handleUpdateDetails} className="p-6 sm:p-7 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Studio Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        disabled={!isOwner}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-brand disabled:opacity-75 disabled:cursor-not-allowed"
                                        placeholder="Studio Name"
                                        required
                                    />
                                    {!isOwner && (
                                        <p className="text-[11px] text-slate-400 mt-1.5">
                                            Only the studio owner can change the workspace name.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Workspace Slug (URL Prefix)
                                    </label>
                                    <input
                                        type="text"
                                        value={`/studio/${studio.id}`}
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-sm font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        Deterministic URL path used for team routing and project access.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Studio Owner
                                    </label>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200/60 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                            {studio.owner?.name?.charAt(0) || 'O'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                                                {studio.owner?.name || 'Unknown Owner'}
                                            </p>
                                            <p className="text-[11px] text-slate-400 truncate">
                                                {studio.owner?.email || 'No email registered'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Workspace Created
                                    </label>
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200/60 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>{studio.created_at || 'Active Studio'}</span>
                                    </div>
                                </div>
                            </div>

                            {isOwner && (
                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        <span>Save Studio Changes</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Section 2: Invitations & Member Onboarding */}
                    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                        <div className="p-6 sm:p-7 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <KeyRound className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                                        Studio Invite Codes
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Share codes with developers to allow them to join this workspace via Central Hub.
                                    </p>
                                </div>
                            </div>

                            {canManage && (
                                <button
                                    type="button"
                                    onClick={handleGenerateInvite}
                                    disabled={isGeneratingInvite}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-2xs"
                                >
                                    {isGeneratingInvite ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <KeyRound className="w-4 h-4" />
                                    )}
                                    <span>Generate New Invite Code</span>
                                </button>
                            )}
                        </div>

                        <div className="p-6 sm:p-7 space-y-4">
                            {invitations.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                                    {invitations.map((inv) => (
                                        <div
                                            key={inv.id}
                                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm font-extrabold tracking-wider px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                                    {inv.token}
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            inv.status === 'Active'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : inv.status === 'Used'
                                                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                                        }`}>
                                                            {inv.status}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {inv.created_at ? `Created ${inv.created_at}` : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {inv.expires_at ? `Expires ${inv.expires_at}` : '7 days validity'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCode(inv.token)}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand/40 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                >
                                                    {copiedToken === inv.token ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                            <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>Copy Code</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                                    <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        No active invite codes generated yet.
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Click "Generate New Invite Code" to invite team members into this workspace.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Studio Members */}
                    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                        <div className="p-6 sm:p-7 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">
                                        Active Workspace Members ({members.length})
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Developers and leads authorized in this studio
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-brand text-white font-bold text-sm flex items-center justify-center shrink-0 ring-2 ring-slate-100 dark:ring-slate-800">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <span>{member.name ? member.name.charAt(0).toUpperCase() : 'U'}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                                                    {member.name}
                                                </p>
                                                {roleBadge(member.role)}
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 self-end sm:self-center shrink-0">
                                        {statusIndicator(member.working_status)}
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            {member.joined_at}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Architectural Integration Notes */}
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                        <div className="p-2 rounded-xl bg-brand/10 text-brand shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-xs space-y-1">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100">
                                GNN Recommendation & Capacity Preferences
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                Workspace members automatically participate in graph neural network task matching. Sprint lengths and team capacity thresholds are determined by real-time working status and availability logged under user profiles.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </TenantLayout>
    );
}
