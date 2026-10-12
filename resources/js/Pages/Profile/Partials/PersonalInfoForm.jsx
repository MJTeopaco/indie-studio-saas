import React, { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { 
    Camera, 
    Trash2, 
    Pencil, 
    ChevronDown, 
    Loader2, 
    AlertCircle,
    X,
    Sparkles
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
    status 
}) {
    const fileInputRef = useRef(null);

    // Avatar states
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isDeleteAvatarModalOpen, setIsDeleteAvatarModalOpen] = useState(false);
    const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    // Modal & editing states
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);

    // Primary form data (User personal information)
    const { data, setData, patch, errors, processing } = useForm({
        name: user.name || '',
        email: user.email || '',
        position_id: profile?.position_id || '',
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

    // ── Profile Save Handler ──
    const handleSaveProfile = (e) => {
        e.preventDefault();

        // Update personal information
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingEmail(false);
                showToast('Personal information updated successfully!', 'success');
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0] || 'Failed to update personal information. Please check your inputs.';
                showToast(firstErr, 'error');
            },
        });
    };

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
                className="bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/70"
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
                            <div className="w-14 h-14 rounded-full ring-2 ring-slate-200 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-heading font-bold text-base text-slate-700 dark:text-slate-200 shadow-2xs">
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-brand" />
                                ) : user.avatar && !avatarError ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        onError={() => setAvatarError(true)}
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
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-brand hover:border-brand/40 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                        >
                            <span>Manage Skills</span>
                            <span className="text-slate-400">→</span>
                        </button>
                    </div>
                </div>

                {/* Save Changes Footer */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ensure all profile details are saved before navigating away.
                    </p>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Personal Information</span>
                    </button>
                </div>

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
