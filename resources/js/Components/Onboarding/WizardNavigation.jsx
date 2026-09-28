import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function WizardNavigation({ currentStep, totalSteps, onNext, onBack, processing, canSubmit = true }) {
    return (
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            {currentStep > 1 ? (
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors px-2 py-1.5 focus:outline-none"
                >
                    ← Back
                </button>
            ) : (
                <div /> // Flex spacer
            )}

            {currentStep < totalSteps ? (
                <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 bg-brand hover:bg-brand-dark dark:hover:bg-brand-light text-white text-sm font-semibold shadow-md shadow-brand/25 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-[#0B0F17]"
                >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={processing || !canSubmit}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-2.5 bg-brand hover:bg-brand-dark dark:hover:bg-brand-light text-white text-sm font-semibold shadow-lg shadow-brand/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-[#0B0F17]"
                >
                    {processing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Completing Profile...</span>
                        </>
                    ) : (
                        <>
                            <span>Complete Passport</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
