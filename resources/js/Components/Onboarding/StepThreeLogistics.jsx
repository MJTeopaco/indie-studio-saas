import React from 'react';
import InputError from '@/Components/InputError';
import { Clock, Globe, ChevronDown, Zap } from 'lucide-react';

export default function StepThreeLogistics({ data, setData, errors }) {
    const commonTimezones = [
        "UTC",
        "Asia/Manila",
        "Asia/Tokyo",
        "Asia/Singapore",
        "Asia/Kolkata",
        "Asia/Dubai",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "America/Sao_Paulo",
        "Australia/Sydney",
        "Pacific/Auckland"
    ];

    const capacityOptions = [10, 20, 30, 40, 50, 60];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Weekly Capacity Hours */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Weekly Availability Capacity <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">For CPM & Gantt planning</span>
                </div>

                {/* Segmented Pill Selector for Hours */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {capacityOptions.map((hours) => {
                        const isSelected = Number(data.max_hours_per_week) === hours;
                        return (
                            <button
                                key={hours}
                                type="button"
                                onClick={() => setData('max_hours_per_week', hours)}
                                className={`py-3 px-2 rounded-xl text-center font-heading text-sm font-bold border transition-all duration-200 ${
                                    isSelected
                                        ? 'bg-brand text-white border-brand shadow-sm shadow-brand/30'
                                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand/60'
                                }`}
                            >
                                <span className="block">{hours}h</span>
                                <span className="block text-[10px] font-normal font-sans opacity-70">/ week</span>
                            </button>
                        );
                    })}
                </div>
                <InputError message={errors.max_hours_per_week} className="mt-1" />
            </div>

            {/* Timezone Selector */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="timezone" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Primary Timezone <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Coordinates team standups</span>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Globe className="w-4 h-4" />
                    </div>
                    <select
                        id="timezone"
                        value={data.timezone}
                        onChange={(e) => setData('timezone', e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs appearance-none transition-all cursor-pointer"
                    >
                        <option value="" disabled>Select your timezone...</option>
                        {commonTimezones.map((tz) => (
                            <option key={tz} value={tz} className="dark:bg-slate-900 dark:text-white">
                                {tz}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                <InputError message={errors.timezone} className="mt-1" />
            </div>

            {/* Helpful CPM Note Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Your availability is used by StudioSprint's <strong className="text-brand dark:text-brand-light">Critical Path Engine (CPA)</strong> to dynamically distribute sprint tasks and avoid developer burnout.
                </p>
            </div>
        </div>
    );
}
