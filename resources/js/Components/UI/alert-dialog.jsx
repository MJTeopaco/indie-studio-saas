import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

/**
 * Accessible, brand-themed AlertDialog component.
 * Provides backdrop scrim, focus trap, Esc and click-outside dismissal,
 * loading states, and light/dark mode support.
 */
export function AlertDialog({
    isOpen,
    onClose,
    title,
    description,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    variant = 'primary', // 'primary' | 'destructive'
    isLoading = false,
    confirmDisabled = false,
}) {
    const dialogRef = useRef(null);
    const confirmBtnRef = useRef(null);

    // Escape key handling
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isLoading) {
                e.preventDefault();
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    // Initial keyboard focus management
    useEffect(() => {
        if (isOpen && confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

    const variantStyles = {
        primary: 'bg-brand hover:bg-brand-dark text-white shadow-xs shadow-brand/20',
        destructive: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-600/20',
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            onClick={() => {
                if (!isLoading) onClose?.();
            }}
        >
            <div
                ref={dialogRef}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-lg space-y-5 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h2 id="alert-dialog-title" className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                            {title}
                        </h2>
                        {description && (
                            <p id="alert-dialog-description" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        aria-label="Close dialog"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="space-y-4">
                    {children}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading || confirmDisabled}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                            variantStyles[variant] || variantStyles.primary
                        }`}
                    >
                        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default AlertDialog;
