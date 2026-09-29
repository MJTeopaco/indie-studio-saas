import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    User, 
    ShieldCheck, 
    ArrowLeft, 
    LogOut, 
    Sparkles 
} from 'lucide-react';
import SystemToast from '@/Components/SystemToast';
import PersonalInfoForm from './Partials/PersonalInfoForm';
import PrivacySecurityForm from './Partials/PrivacySecurityForm';

export default function Edit({
    user = {},
    profile = null,
    positions = [],
    availableSkills = {},
    joinedStudios = [],
    status,
}) {
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'security'

    const userInitials = user.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const navTabs = [
        {
            id: 'personal',
            label: 'Personal Information',
            desc: 'Avatar, skills & working status',
            icon: User,
        },
        {
            id: 'security',
            label: 'Privacy and Security',
            desc: 'Password & account security',
            icon: ShieldCheck,
        },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070A10] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased selection:bg-brand selection:text-white">
            <Head title="Profile & Preferences — StudioSprint" />

            {/* ── Left Sidebar (No Top Navbar Displayed) ── */}
            <aside className="w-full md:w-72 lg:w-80 shrink-0 border-b md:border-b-0 md:border-r border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B0F17]/90 backdrop-blur-md flex flex-col justify-between p-5 md:p-6 lg:p-7 md:h-screen md:sticky md:top-0">
                
                {/* Top Section: Back Link & Navigation */}
                <div className="space-y-6">
                    {/* Return to Dashboard Action */}
                    <div>
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-150 group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span>Return to Dashboard</span>
                        </Link>
                    </div>

                    {/* Sidebar Section Heading */}
                    <div className="px-3">
                        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Settings
                        </h2>
                    </div>

                    {/* Navigation Tab Links */}
                    <nav className="space-y-1.5" aria-label="Profile navigation">
                        {navTabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const IconComponent = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                                        isActive
                                            ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-semibold shadow-xs ring-1 ring-slate-200 dark:ring-slate-700/80'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                    }`}
                                >
                                    <IconComponent className={`w-4 h-4 mt-0.5 shrink-0 ${
                                        isActive ? 'text-brand' : 'text-slate-400 dark:text-slate-500'
                                    }`} />
                                    <div className="min-w-0">
                                        <div className="text-xs font-heading font-medium leading-none">
                                            {tab.label}
                                        </div>
                                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                                            {tab.desc}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section: User Identity & Log Out */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 md:mt-0 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{userInitials}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {user.name}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Log out"
                    >
                        <LogOut className="w-4 h-4" />
                    </Link>
                </div>

            </aside>

            {/* ── Right Content Area ── */}
            <main className="flex-1 overflow-y-auto px-5 sm:px-10 lg:px-14 py-8 sm:py-12">
                <div className="max-w-3xl mx-auto">
                    {activeTab === 'personal' && (
                        <div className="animate-in fade-in duration-200">
                            <PersonalInfoForm
                                user={user}
                                profile={profile}
                                positions={positions}
                                availableSkills={availableSkills}
                                joinedStudios={joinedStudios}
                                status={status}
                            />
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="animate-in fade-in duration-200">
                            <PrivacySecurityForm />
                        </div>
                    )}
                </div>
            </main>

            <SystemToast />
        </div>
    );
}
