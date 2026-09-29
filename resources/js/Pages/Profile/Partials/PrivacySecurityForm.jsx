import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from '@inertiajs/react';
import { 
    KeyRound, 
    Check, 
    ShieldCheck, 
    AlertTriangle, 
    Loader2, 
    Eye, 
    EyeOff, 
    Lock, 
    Trash2, 
    X 
} from 'lucide-react';
import InputError from '@/Components/InputError';
import { showToast } from '@/Components/SystemToast';

export default function PrivacySecurityForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const deletePasswordInput = useRef();

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password form
    const {
        data: pwData,
        setData: setPwData,
        errors: pwErrors,
        put: updatePasswordPut,
        reset: resetPw,
        processing: pwProcessing,
        recentlySuccessful: pwRecentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Delete account form
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const {
        data: delData,
        setData: setDelData,
        delete: destroyAccount,
        processing: delProcessing,
        reset: resetDel,
        errors: delErrors,
        clearErrors: clearDelErrors,
    } = useForm({
        password: '',
    });

    const handleUpdatePassword = (e) => {
        e.preventDefault();

        updatePasswordPut(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                resetPw();
                showToast('Password updated successfully!', 'success');
            },
            onError: (errs) => {
                if (errs.password) {
                    resetPw('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    resetPw('current_password');
                    currentPasswordInput.current?.focus();
                }
                const firstErr = Object.values(errs)[0] || 'Failed to update password. Please check your credentials.';
                showToast(firstErr, 'error');
            },
        });
    };

    const handleDeleteAccount = (e) => {
        e.preventDefault();

        destroyAccount(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                closeDeleteModal();
                showToast('Account deleted successfully.', 'info');
            },
            onError: (errs) => {
                deletePasswordInput.current?.focus();
                const firstErr = errs?.password || 'Failed to delete account. Incorrect password.';
                showToast(firstErr, 'error');
            },
            onFinish: () => resetDel(),
        });
    };

    const closeDeleteModal = () => {
        setConfirmingDeletion(false);
        clearDelErrors();
        resetDel();
    };

    // Password criteria helpers
    const hasMinLength = pwData.password.length >= 8;
    const hasNumber = /\d/.test(pwData.password);
    const passwordsMatch = pwData.password && pwData.password === pwData.password_confirmation;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Privacy and Security
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage your authentication credentials, password strength, and account deletion.
                </p>
            </div>

            {/* 1. Password Update Card — Uniform structure with Personal Info */}
            <form 
                onSubmit={handleUpdatePassword} 
                className="bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/70"
            >
                {/* Header Row */}
                <div className="p-6 sm:p-7 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                                Update Password
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Ensure your account uses a secure password to maintain studio integrity.
                            </p>
                        </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                        Credentials
                    </span>
                </div>

                {/* Current Password Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label htmlFor="current_password" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Current Password
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Verify your existing password to authorize changes.
                        </p>
                    </div>

                    <div className="sm:w-80 relative">
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={pwData.current_password}
                            onChange={(e) => setPwData('current_password', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand focus:ring-1 focus:ring-brand font-medium placeholder:text-slate-400"
                            autoComplete="current-password"
                            placeholder="Enter current password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2"
                            title={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <InputError message={pwErrors.current_password} className="mt-1" />
                    </div>
                </div>

                {/* New Password Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label htmlFor="new_password" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            New Password
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Minimum 8 characters with numbers or symbols.
                        </p>
                    </div>

                    <div className="sm:w-80 relative">
                        <input
                            id="new_password"
                            ref={passwordInput}
                            type={showNewPassword ? 'text' : 'password'}
                            value={pwData.password}
                            onChange={(e) => setPwData('password', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand focus:ring-1 focus:ring-brand font-medium placeholder:text-slate-400"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2"
                            title={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <InputError message={pwErrors.password} className="mt-1" />

                        {/* Password rules feedback */}
                        {pwData.password && (
                            <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                                <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    8+ chars
                                </span>
                                <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-500 font-semibold' : 'text-slate-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    number
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirm Password Row */}
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <label htmlFor="password_confirmation" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Confirm Password
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Re-type your new password to verify.
                        </p>
                    </div>

                    <div className="sm:w-80 relative">
                        <input
                            id="password_confirmation"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={pwData.password_confirmation}
                            onChange={(e) => setPwData('password_confirmation', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand focus:ring-1 focus:ring-brand font-medium placeholder:text-slate-400"
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2"
                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <InputError message={pwErrors.password_confirmation} className="mt-1" />

                        {pwData.password_confirmation && (
                            <div className="mt-2 text-[11px] font-mono">
                                <span className={`flex items-center gap-1 ${passwordsMatch ? 'text-emerald-500 font-semibold' : 'text-amber-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Save Row */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={pwProcessing}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {pwProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Password</span>
                    </button>
                </div>
            </form>

            {/* 2. Danger Zone Container — High-end destructive container */}
            <div className="bg-white dark:bg-[#0B0F17] border border-rose-200/90 dark:border-rose-900/40 rounded-2xl shadow-xs overflow-hidden divide-y divide-rose-100 dark:divide-rose-950/40">
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="font-heading text-sm font-bold text-rose-700 dark:text-rose-400">
                                Delete Account
                            </h2>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
                                Permanently delete your central passport profile, authentication credentials, and studio memberships. Once deleted, this data cannot be recovered.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setConfirmingDeletion(true)}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Frontend Account Deletion Modal (Portaled) */}
            {confirmingDeletion && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div 
                        className="relative w-full max-w-md bg-white dark:bg-[#0B0F17] border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                                        Delete StudioSprint Account
                                    </h3>
                                    <p className="text-xs text-rose-500 font-medium mt-0.5">
                                        Irreversible permanent action
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                            Please enter your account password to confirm deletion. Once confirmed, all associated project roles, task assignments, and passport skills will be immediately erased.
                        </p>

                        <form onSubmit={handleDeleteAccount} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Confirm with Password
                                </label>
                                <input
                                    ref={deletePasswordInput}
                                    type="password"
                                    value={delData.password}
                                    onChange={(e) => setDelData('password', e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                                    placeholder="Enter your password"
                                    required
                                />
                                <InputError message={delErrors.password} className="mt-1" />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={delProcessing}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={delProcessing}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    {delProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Confirm Account Deletion</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
