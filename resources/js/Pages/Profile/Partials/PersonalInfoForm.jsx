import React, { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { 
    Camera, 
    Trash2, 
    Pencil, 
    Check, 
    X, 
    Sparkles, 
    ChevronDown, 
    Loader2, 
    Activity, 
    Clock, 
    ShieldAlert, 
    Calendar, 
    Building2,
    Crown,
    UserCheck,
    FileText,
    Send,
    AlertCircle
} from 'lucide-react';
import InputError from '@/Components/InputError';
import { showToast } from '@/Components/SystemToast';
import SkillMatrixModal from './SkillMatrixModal';
import AvatarCropModal from './AvatarCropModal';
import DeleteAvatarModal from './DeleteAvatarModal';

export default function PersonalInfoForm({ 
    user = {}, 
    profile = null, 
    positions = [], 
    availableSkills = {}, 
    joinedStudios = [], 
    status 
}) {
    const fileInputRef = useRef(null);

    // Avatar states
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isDeleteAvatarModalOpen, setIsDeleteAvatarModalOpen] = useState(false);
    const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
    const [isCancellingLeave, setIsCancellingLeave] = useState(false);

    // Modal & editing states
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

    // Primary form data (User personal information + working status)
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
        position_id: profile?.position_id || '',
        working_status: user.working_status || 'active',
        leave_start_date: user.leave_start_date || new Date().toISOString().split('T')[0],
        leave_end_date: user.leave_end_date || '',
        leave_reason: '',
        status_scope: 'all', // 'all' | 'specific'
        status_studio_id: joinedStudios.length > 0 ? joinedStudios[0].id : '',
    });

    const userInitials = user.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    // ── Avatar Handlers ──
    const handleAvatarFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Read file into data URL for the Cropper
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result);
            setIsCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveCroppedAvatar = (blob) => {
        setIsCropModalOpen(false);
        setIsUploadingAvatar(true);

        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        router.post(route('profile.avatar.update'), formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                showToast('Profile picture uploaded successfully!', 'success');
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0] || 'Failed to upload profile picture. Please try again.';
                showToast(firstErr, 'error');
            },
            onFinish: () => {
                setIsUploadingAvatar(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const handleConfirmDeleteAvatar = () => {
        setIsDeletingAvatar(true);
        router.delete(route('profile.avatar.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Profile picture removed successfully.', 'info');
            },
            onError: () => {
                showToast('Failed to remove profile picture. Please try again.', 'error');
            },
            onFinish: () => {
                setIsDeletingAvatar(false);
                setIsDeleteAvatarModalOpen(false);
            },
        });
    };

    // ── Working Status Preset Handlers ──
    const handleApplyLeavePreset = (days) => {
        const start = data.leave_start_date ? new Date(data.leave_start_date) : new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        setData('leave_end_date', end.toISOString().split('T')[0]);
    };

    // ── Working Status Cancel & Submit Handlers ──
    const handleCancelLeaveRequest = (requestId) => {
        if (!confirm('Are you sure you want to cancel this pending leave request?')) return;
        setIsCancellingLeave(true);
        router.delete(route('profile.leave-requests.cancel', requestId), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Leave request cancelled successfully.', 'info');
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] || 'Failed to cancel leave request.';
                showToast(msg, 'error');
            },
            onFinish: () => {
                setIsCancellingLeave(false);
            }
        });
    };

    // ── Profile Save Handler ──
    const handleSaveProfile = (e) => {
        e.preventDefault();

        if (data.working_status === 'on_leave' && !data.leave_end_date) {
            showToast('Please specify a return date for your leave.', 'warning');
            return;
        }

        // Active role check for contextual feedback
        const activeStudio = data.status_scope === 'specific'
            ? (joinedStudios.find(s => String(s.id) === String(data.status_studio_id)) || joinedStudios[0])
            : joinedStudios[0];
        const isOwner = Boolean(activeStudio?.is_owner || activeStudio?.role === 'owner');
        const isLeader = !isOwner && ['leader', 'manager'].includes(activeStudio?.role);

        // 1. Update personal information
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingEmail(false);

                // 2. Sync working status
                router.post(route('profile.working-status.update'), {
                    status: data.working_status,
                    scope: data.status_scope,
                    studio_id: data.status_scope === 'specific' ? data.status_studio_id : null,
                    leave_start_date: data.working_status === 'on_leave' ? data.leave_start_date : null,
                    leave_end_date: data.working_status === 'on_leave' ? data.leave_end_date : null,
                    leave_reason: data.working_status === 'on_leave' ? data.leave_reason : null,
                }, {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (data.working_status === 'on_leave' && !isOwner) {
                            showToast(
                                isLeader
                                    ? 'Leave request submitted to Studio Owner for authorization.'
                                    : 'Leave request submitted to Team Lead or Studio Owner for review.',
                                'info'
                            );
                        } else {
                            showToast('Personal information & working status updated successfully!', 'success');
                        }
                    },
                    onError: (statusErrs) => {
                        const firstErr = Object.values(statusErrs)[0] || 'Failed to update working status.';
                        showToast(firstErr, 'error');
                    },
                });
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0] || 'Failed to update personal information. Please check your inputs.';
                showToast(firstErr, 'error');
            },
        });
    };

    const workingStatusOptions = [
        {
            id: 'active',
            title: 'Active',
            desc: 'Available for sprint tasks & critical path assignment.',
            dotClass: 'bg-emerald-500 shadow-emerald-500/50',
            activeClass: 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500/40 text-emerald-900 dark:text-emerald-300',
            icon: Activity,
            iconClass: 'text-emerald-500',
        },
        {
            id: 'on_leave',
            title: 'On Leave',
            desc: 'Scheduled absence. Automatically reverts to Active once timeline ends.',
            dotClass: 'bg-amber-500 shadow-amber-500/50',
            activeClass: 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 ring-1 ring-amber-500/40 text-amber-900 dark:text-amber-300',
            icon: Clock,
            iconClass: 'text-amber-500',
        },
        {
            id: 'emergency',
            title: 'Emergency',
            desc: 'Urgent absence. Flags leads and protects sprint path.',
            dotClass: 'bg-rose-500 shadow-rose-500/50',
            activeClass: 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 ring-1 ring-rose-500/40 text-rose-900 dark:text-rose-300',
            icon: ShieldAlert,
            iconClass: 'text-rose-500',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Personal Information
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage your identity, technical matrix, and real-time availability.
                </p>
            </div>

            {/* Main Information Card */}
            <form 
                onSubmit={handleSaveProfile} 
                className="bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/70"
            >
                
                {/* 1. Profile Picture Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Profile picture
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            PNG, JPG or WEBP. Crop and adjust before upload.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="w-14 h-14 rounded-full ring-2 ring-slate-200 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-heading font-bold text-base text-slate-700 dark:text-slate-200 shadow-xs">
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-brand" />
                                ) : user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span>{userInitials}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleAvatarFileChange}
                                className="hidden"
                                id="avatar_file_input"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-brand hover:border-brand/40 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                                Change
                            </button>

                            {user.avatar && (
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteAvatarModalOpen(true)}
                                    disabled={isUploadingAvatar}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                    title="Remove profile picture"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Email Address Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Email
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Your primary contact address
                        </p>
                    </div>

                    <div className="sm:w-80 flex items-center justify-end gap-2">
                        {isEditingEmail ? (
                            <div className="w-full flex items-center gap-2">
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand focus:ring-1 focus:ring-brand font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsEditingEmail(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    title="Cancel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">
                                    {data.email}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingEmail(true)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Edit email"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <InputError message={errors.email} className="mt-1" />
                    </div>
                </div>

                {/* 3. Full Name Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label htmlFor="full_name" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Full name
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Your display name across all joined studios.
                        </p>
                    </div>

                    <div className="sm:w-80">
                        <input
                            id="full_name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand focus:ring-1 focus:ring-brand font-medium placeholder:text-slate-400"
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                </div>

                {/* 4. Title / Role Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label htmlFor="position_title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Title
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Your job title or role
                        </p>
                    </div>

                    <div className="sm:w-80 relative">
                        <select
                            id="position_title"
                            value={data.position_id}
                            onChange={(e) => setData('position_id', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand focus:ring-1 focus:ring-brand font-medium appearance-none cursor-pointer"
                        >
                            <option value="">Select your role...</option>
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <InputError message={errors.position_id} className="mt-1" />
                    </div>
                </div>

                {/* 5. Edit Member Developer Skill Matrix Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Edit skill matrix
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Technical competencies & ratings powering GNN matching
                        </p>
                    </div>

                    <div className="sm:w-80 flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {profile?.skills && profile.skills.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand/10 text-brand dark:text-cyan-400 text-xs font-mono font-medium">
                                    <Sparkles className="w-3 h-3" />
                                    {profile.skills.length} skills active
                                </span>
                            ) : (
                                <span className="text-xs text-slate-400">
                                    No skills added
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsSkillModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                            <span>Manage Skills</span>
                            <span className="text-slate-400">→</span>
                        </button>
                    </div>
                </div>

                {/* 6. Merged Working Status Section (Directly below Edit Skill Matrix) */}
                {(() => {
                    const activeStudio = data.status_scope === 'specific'
                        ? (joinedStudios.find(s => String(s.id) === String(data.status_studio_id)) || joinedStudios[0])
                        : joinedStudios[0];
                    const isOwner = Boolean(activeStudio?.is_owner || activeStudio?.role === 'owner');
                    const isLeader = !isOwner && ['leader', 'manager'].includes(activeStudio?.role);
                    const isMember = !isOwner && !isLeader;

                    const pendingLeaveRequests = joinedStudios
                        .filter(s => s.pending_leave_request)
                        .map(s => ({
                            ...s.pending_leave_request,
                            studioName: s.name,
                            studioId: s.id,
                        }));

                    return (
                        <div className="p-6 sm:p-7 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                                        Working status & availability
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Set real-time availability to keep sprint task allocations synchronized.
                                    </p>
                                </div>

                                {/* Optional Scope Selector if user belongs to studios */}
                                {joinedStudios.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-slate-400">Scope:</span>
                                        <select
                                            value={data.status_scope}
                                            onChange={(e) => setData('status_scope', e.target.value)}
                                            className="text-xs py-1.5 pl-2.5 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                                        >
                                            <option value="all">All Workspaces</option>
                                            <option value="specific">Specific Studio</option>
                                        </select>

                                        {data.status_scope === 'specific' && (
                                            <select
                                                value={data.status_studio_id}
                                                onChange={(e) => setData('status_studio_id', e.target.value)}
                                                className="text-xs py-1.5 pl-2.5 pr-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer max-w-[140px] truncate"
                                            >
                                                {joinedStudios.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pending Leave Request Banner */}
                            {pendingLeaveRequests.length > 0 && (
                                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                                <Clock className="w-4 h-4 animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-heading font-bold text-amber-900 dark:text-amber-200">
                                                        Leave Request Pending Review
                                                    </h4>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                                        Pending
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                                                    Your sprint availability remains active until your request is reviewed by leadership.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {pendingLeaveRequests.map(req => (
                                            <div 
                                                key={req.id} 
                                                className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                            {req.studioName}
                                                        </span>
                                                        <span className="text-slate-400">•</span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                                                            {req.leave_start_date} → {req.leave_end_date}
                                                        </span>
                                                        {req.created_at && (
                                                            <span className="text-[11px] text-slate-400">
                                                                ({req.created_at})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span>Routing:</span>
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {req.requester_role === 'leader' ? 'Studio Owner Approval' : 'Team Leader or Studio Owner'}
                                                        </span>
                                                    </div>
                                                    {req.reason && (
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10 inline-block">
                                                            "{req.reason}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={isCancellingLeave}
                                                        onClick={() => handleCancelLeaveRequest(req.id)}
                                                        className="px-3 py-1.5 rounded-lg border border-rose-300/60 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isCancellingLeave ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <X className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>Cancel Request</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Clean 3-Option Segmented Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {workingStatusOptions.map((opt) => {
                                    const isSelected = data.working_status === opt.id;
                                    const IconComponent = opt.icon;

                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setData('working_status', opt.id)}
                                            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                                                isSelected
                                                    ? opt.activeClass
                                                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${opt.dotClass} shrink-0`} />
                                                        <span className="font-heading font-bold text-xs">
                                                            {opt.title}
                                                        </span>
                                                    </div>
                                                    <IconComponent className={`w-3.5 h-3.5 ${opt.iconClass} shrink-0`} />
                                                </div>

                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                                    {opt.desc}
                                                </p>

                                                {opt.id === 'on_leave' && !isOwner && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400">
                                                            <ShieldAlert className="w-3 h-3" />
                                                            {isLeader ? 'Owner Approval Required' : 'Approval Required'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* On Leave Timeline Expander (Only visible when On Leave is selected) */}
                            {data.working_status === 'on_leave' && (
                                <div className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    
                                    {/* Role Governance Banner */}
                                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-amber-500/20 flex items-start gap-3">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0 mt-0.5">
                                            {isOwner ? (
                                                <Crown className="w-4 h-4 text-emerald-500" />
                                            ) : isLeader ? (
                                                <Crown className="w-4 h-4 text-purple-500" />
                                            ) : (
                                                <UserCheck className="w-4 h-4 text-brand" />
                                            )}
                                        </div>
                                        <div className="text-xs space-y-0.5 flex-1">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {isOwner 
                                                        ? 'Studio Owner Direct Authority' 
                                                        : isLeader 
                                                            ? 'Team Leader Leave Governance' 
                                                            : 'Team Member Leave Governance'}
                                                </span>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                                    isOwner 
                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                                                        : isLeader 
                                                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20' 
                                                            : 'bg-brand/10 text-brand dark:text-cyan-400 border border-brand/20'
                                                }`}>
                                                    {isOwner ? 'Direct Authority' : isLeader ? 'Owner Approval Required' : 'Leader / Owner Approval'}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                                {isOwner
                                                    ? 'Your leave takes effect immediately across all project schedules and sprint pipelines.'
                                                    : isLeader
                                                        ? 'As a Team Leader, submitting "On Leave" creates a request routed directly to the Studio Owner. Your status remains Active until approved.'
                                                        : 'Selecting "On Leave" creates a formal request sent to your Team Leader and Studio Owner. Your status remains Active until approved.'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Dates & Timeline */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                Leave Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={data.leave_start_date}
                                                onChange={(e) => setData('leave_start_date', e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-amber-300/60 dark:border-amber-500/40 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                Return to Active Date (End Date)
                                            </label>
                                            <input
                                                type="date"
                                                min={data.leave_start_date || new Date().toISOString().split('T')[0]}
                                                value={data.leave_end_date}
                                                onChange={(e) => setData('leave_end_date', e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-amber-300/60 dark:border-amber-500/40 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500"
                                                required={data.working_status === 'on_leave'}
                                            />
                                        </div>
                                    </div>

                                    {/* Quick Presets */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] uppercase font-mono text-amber-600 dark:text-amber-400 mr-1">
                                            Quick presets:
                                        </span>
                                        {[
                                            { label: '3 Days', days: 3 },
                                            { label: '1 Week', days: 7 },
                                            { label: '2 Weeks', days: 14 },
                                            { label: '1 Month', days: 30 },
                                        ].map(preset => (
                                            <button
                                                key={preset.days}
                                                type="button"
                                                onClick={() => handleApplyLeavePreset(preset.days)}
                                                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer"
                                            >
                                                +{preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Reason & Handover Note */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                            Reason & Handover Note (Optional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.leave_reason}
                                            onChange={(e) => setData('leave_reason', e.target.value)}
                                            placeholder="e.g., Annual family leave, handed over sprint tasks to @Sarah..."
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-amber-300/60 dark:border-amber-500/40 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Save Row Footer */}
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {data.working_status === 'on_leave' && !isOwner ? (
                                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            Leave request will be submitted for review upon saving
                                        </span>
                                    ) : (
                                        <span>Ensure all changes are saved before navigating away.</span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer ${
                                        data.working_status === 'on_leave' && !isOwner
                                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                                            : 'bg-brand hover:bg-brand-dark'
                                    }`}
                                >
                                    {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {data.working_status === 'on_leave' ? (
                                        isOwner ? (
                                            <span>Save Changes & Set Leave</span>
                                        ) : isLeader ? (
                                            <span>Submit Leave Request to Owner</span>
                                        ) : (
                                            <span>Submit Leave Request for Approval</span>
                                        )
                                    ) : (
                                        <span>Save Personal Information</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })()}

            </form>

            {/* Interactive Skill Matrix Modal (Portaled) */}
            <SkillMatrixModal
                isOpen={isSkillModalOpen}
                onClose={() => setIsSkillModalOpen(false)}
                currentSkills={profile?.skills || []}
                availableSkills={availableSkills}
            />

            {/* Avatar Cropping Modal (Portaled) */}
            <AvatarCropModal
                isOpen={isCropModalOpen}
                imageSrc={cropImageSrc}
                onClose={() => {
                    setIsCropModalOpen(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                onSave={handleSaveCroppedAvatar}
            />

            {/* Avatar Delete Confirmation Modal (Frontend Component) */}
            <DeleteAvatarModal
                isOpen={isDeleteAvatarModalOpen}
                onClose={() => setIsDeleteAvatarModalOpen(false)}
                onConfirm={handleConfirmDeleteAvatar}
                isDeleting={isDeletingAvatar}
            />
        </div>
    );
}
