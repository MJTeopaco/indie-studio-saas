import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';

const VARIANT_MAP = {
    danger: {
        icon: AlertTriangle,
        iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
        confirmBtn: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/20',
        badge: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
        confirmBtn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20',
        badge: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    },
    brand: {
        icon: Info,
        iconBg: 'bg-brand/15 text-brand',
        confirmBtn: 'bg-gradient-to-r from-brand to-indigo-600 hover:from-brand-dark hover:to-indigo-700 text-white shadow-brand/20',
        badge: 'bg-brand/10 text-brand',
    },
    success: {
        icon: CheckCircle2,
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
        confirmBtn: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20',
        badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    },
};

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'brand',
    loading = false,
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const styling = VARIANT_MAP[variant] || VARIANT_MAP.brand;
    const IconComponent = styling.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${styling.iconBg}`}>
                            <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">SprintStudio System Confirmation</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1 whitespace-pre-line">
                    {message}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 ${styling.confirmBtn}`}
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
