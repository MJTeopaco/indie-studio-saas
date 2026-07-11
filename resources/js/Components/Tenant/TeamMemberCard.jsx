import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * TeamMemberCard — Renders a styled profile card for a team member.
 */
export default function TeamMemberCard({ member, index, status, badgeClass, department }) {
    const phone = `(${201 + index}) 555-010${index}`;

    return (
        <div className="group rounded-2xl bg-white dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg transition-all duration-200 relative flex flex-col justify-between">
            <div>
                {/* Header avatar & Status badge */}
                <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shadow-sm">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`rounded-full text-[10px] px-2 py-0.5 font-bold uppercase ${badgeClass}`}>
                        {status}
                    </span>
                </div>

                {/* Names */}
                <div className="mt-4">
                    <h4 className="font-heading text-base font-bold text-gray-900 dark:text-slate-100 truncate group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                        {member.name}
                    </h4>
                    <p className="text-xs text-text-muted font-sans mt-0.5 truncate">
                        {member.position}
                    </p>
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-gray-100 dark:border-slate-800/50"></div>

                {/* Department & Join Date */}
                <div className="grid grid-cols-2 gap-2 text-xs font-sans text-text-muted">
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
                            Department
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-slate-200">
                            {department}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
                            Joining
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-slate-200">
                            {member.joined_at}
                        </span>
                    </div>
                </div>

                {/* Email & Phone */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800/50 space-y-1 text-xs font-sans">
                    <p className="text-text-muted truncate hover:text-brand dark:hover:text-brand-light cursor-pointer">
                        {member.email}
                    </p>
                    <p className="text-text-muted">
                        {phone}
                    </p>
                </div>
            </div>

            {/* Action Link Arrow */}
            <div className="absolute bottom-4 right-4 text-slate-400 dark:text-slate-500 group-hover:text-brand dark:group-hover:text-brand-light transition-colors">
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </div>
        </div>
    );
}
