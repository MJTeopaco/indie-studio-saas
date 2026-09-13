import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export function showToast(message, type = 'info') {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sprint:toast', {
            detail: { message: String(message), type }
        }));
    }
}

// Global safety patch: redirect any stray window.alert to in-app toast
if (typeof window !== 'undefined' && !window.__sprintToastPatched) {
    window.__sprintToastPatched = true;
    window.showToast = showToast;
    window.alert = (message) => {
        showToast(message, 'info');
    };
}

export default function SystemToast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (e) => {
            const { message, type = 'info' } = e.detail || {};
            if (!message) return;

            const id = Date.now() + Math.random();
            setToasts(prev => [...prev.slice(-4), { id, message, type }]);

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
        };

        window.addEventListener('sprint:toast', handleToast);
        return () => window.removeEventListener('sprint:toast', handleToast);
    }, []);

    if (toasts.length === 0) return null;

    const ICONS = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
        error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
        info: <Info className="w-4 h-4 text-brand shrink-0" />,
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-2 duration-150 text-xs text-slate-800 dark:text-slate-200"
                >
                    {ICONS[toast.type] || ICONS.info}
                    <div className="flex-1 min-w-0 pr-1 leading-normal font-medium whitespace-pre-wrap">
                        {toast.message}
                    </div>
                    <button
                        type="button"
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
