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

    const TOAST_THEMES = {
        success: {
            container: 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-950/20',
            icon: <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />,
            close: 'text-white/80 hover:text-white hover:bg-white/15',
        },
        error: {
            container: 'bg-rose-600 border-rose-500 text-white shadow-rose-950/20',
            icon: <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />,
            close: 'text-white/80 hover:text-white hover:bg-white/15',
        },
        warning: {
            container: 'bg-amber-500 border-amber-400 text-amber-950 shadow-amber-950/20',
            icon: <AlertTriangle className="w-4 h-4 text-amber-950 shrink-0 mt-0.5" />,
            close: 'text-amber-950/70 hover:text-amber-950 hover:bg-amber-950/15',
        },
        alert: {
            container: 'bg-amber-500 border-amber-400 text-amber-950 shadow-amber-950/20',
            icon: <AlertTriangle className="w-4 h-4 text-amber-950 shrink-0 mt-0.5" />,
            close: 'text-amber-950/70 hover:text-amber-950 hover:bg-amber-950/15',
        },
        info: {
            container: 'bg-sky-600 border-sky-500 text-white shadow-sky-950/20',
            icon: <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />,
            close: 'text-white/80 hover:text-white hover:bg-white/15',
        },
    };

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
            {toasts.map(toast => {
                const theme = TOAST_THEMES[toast.type] || TOAST_THEMES.info;

                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl border shadow-xl animate-in slide-in-from-top-2 duration-150 text-xs font-medium ${theme.container}`}
                    >
                        {theme.icon}
                        <div className="flex-1 min-w-0 pr-1 leading-normal whitespace-pre-wrap">
                            {toast.message}
                        </div>
                        <button
                            type="button"
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${theme.close}`}
                            aria-label="Dismiss notification"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
