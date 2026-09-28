import React from 'react';
import InputError from '@/Components/InputError';
import { Briefcase, Calendar, Globe, ChevronDown } from 'lucide-react';

export default function StepOneIdentity({ data, setData, errors, positions = [] }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Primary Role Selector */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="position_id" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Primary Role <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Core discipline</span>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                        id="position_id"
                        value={data.position_id}
                        onChange={(e) => setData('position_id', e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs appearance-none transition-all cursor-pointer"
                    >
                        <option value="" disabled>Select your primary role...</option>
                        {positions.map((pos) => (
                            <option key={pos.id} value={pos.id} className="dark:bg-slate-900 dark:text-white">
                                {pos.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                <InputError message={errors.position_id} className="mt-1" />
            </div>

            {/* Experience Years */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="experience_years" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Experience in Years <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Continuous value (e.g. 3.5)</span>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <input
                        id="experience_years"
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={data.experience_years}
                        onChange={(e) => setData('experience_years', e.target.value)}
                        placeholder="e.g., 3.5"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs transition-all"
                    />
                </div>
                <InputError message={errors.experience_years} className="mt-1" />
            </div>

            {/* Availability Status Switch */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                    <div className="space-y-0.5 pr-4">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-brand" />
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                                Global Availability
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Allow studios to discover and invite you via GNN matching.
                        </p>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={data.open_to_invitations}
                        onClick={() => setData('open_to_invitations', !data.open_to_invitations)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-[#0B0F17] ${
                            data.open_to_invitations ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                data.open_to_invitations ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
                <InputError message={errors.open_to_invitations} className="mt-1" />
            </div>
        </div>
    );
}
