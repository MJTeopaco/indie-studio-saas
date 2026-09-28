import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Sun, Moon } from 'lucide-react';

export default function OnboardingSplitLayout({
    title,
    subtitle,
    children,
    currentStep = 1,
    totalSteps = 3,
    showStepper = true,
    rightContent = null,
}) {
    // Theme toggle state synced with document.documentElement and localStorage
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
        }
        return false;
    });

    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col lg:grid lg:grid-cols-2 selection:bg-brand selection:text-white">
            
            {/* ── Left Pane: Interactive Form Area (Matches Reference Look) ── */}
            <div className="relative flex flex-col justify-between min-h-screen px-6 sm:px-12 lg:px-16 py-8 sm:py-12 z-10">
                
                {/* Top Utility Header (Logo & Theme Toggle) */}
                <div className="flex items-center justify-between w-full max-w-lg mx-auto">
                    <Link href="/" className="flex items-center gap-3 group focus:outline-none">
                        <ApplicationLogo variant="symbol" className="w-8 h-8 rounded-lg shadow-sm" />
                        <span className="font-heading font-extrabold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                            StudioSprint
                        </span>
                    </Link>

                    {/* Minimal Theme Switcher */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-xs"
                    >
                        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                    </button>
                </div>

                {/* Center Form Container */}
                <div className="w-full max-w-lg mx-auto my-auto py-8">
                    {/* Header Typography matching reference image */}
                    <div className="mb-8">
                        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            typeof subtitle === 'string' ? (
                                <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                    {subtitle}
                                </p>
                            ) : (
                                <div className="mt-2">{subtitle}</div>
                            )
                        )}
                    </div>

                    {/* Main Form Fields */}
                    {children}
                </div>

                {/* Bottom Pagination / Stepper (Matches Reference Pill Stepper) */}
                <div className="w-full max-w-lg mx-auto pt-6 flex items-center justify-center">
                    {showStepper && totalSteps > 1 ? (
                        <div className="flex items-center gap-2" aria-label={`Step ${currentStep} of ${totalSteps}`}>
                            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
                                const isActive = step === currentStep;
                                const isPast = step < currentStep;
                                return (
                                    <div
                                        key={step}
                                        className={`transition-all duration-300 ease-out rounded-full ${
                                            isActive
                                                ? 'w-6 h-1.5 bg-brand shadow-xs shadow-brand/40'
                                                : isPast
                                                ? 'w-1.5 h-1.5 bg-slate-400 dark:bg-slate-600'
                                                : 'w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-400 dark:text-slate-600 font-mono tracking-wider">
                            VAULTERA LABS INC.
                        </p>
                    )}
                </div>
            </div>

            {/* ── Right Pane: Atmospheric 3D Perspective Showcase (Theme-Aware) ── */}
            <div className="hidden lg:flex relative items-center justify-center bg-slate-100/70 dark:bg-[#070A10] border-l border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-colors duration-300">
                {React.isValidElement(rightContent)
                    ? React.cloneElement(rightContent, { isDark })
                    : rightContent}
            </div>

        </div>
    );
}
