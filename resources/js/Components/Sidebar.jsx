import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    Sun,
    Moon,
    LogOut,
} from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

// =============================================================================
// Premium Custom SVG Icons
// =============================================================================

const PremiumDashboardIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PremiumTasksIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 9L9.5 11.5L13.5 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="7" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        <line x1="16" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>
);

const PremiumScheduleIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 2V6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 2V6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="15" r="2" fill="currentColor" className="text-brand dark:text-brand-light" />
        <line x1="7" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        <line x1="7" y1="17" x2="9" y2="17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>
);

const PremiumAutomationIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.6" />
        <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.6" />
        <circle cx="12" cy="20" r="2" stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.6" />
        <circle cx="20" cy="12" r="2" stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.6" />
        <path d="M12 6V9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />
        <path d="M12 15V18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />
        <path d="M6 12H9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />
        <path d="M15 12H18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />
    </svg>
);

const PremiumTeamIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21V19C22.9993 18.1137 22.6905 17.2532 22.1215 16.5714C21.5525 15.8895 20.7571 15.4261 19.88 15.26" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        <path d="M16 3.13C16.8833 3.28789 17.6836 3.76612 18.2573 4.47893C18.831 5.19174 19.1417 6.09172 19.1417 7.02C19.1417 7.94828 18.831 8.84826 18.2573 9.56107C17.6836 10.2739 16.8833 10.7521 16 10.91" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>
);

const PremiumProjectsIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 19V9C22 7.89543 21.1046 7 20 7H12L10.4142 5.41421C9.66401 4.66401 8.64673 4.24264 7.58579 4.24264H4C2.89543 4.24264 2 5.13807 2 6.24264V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="6" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        <line x1="6" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>
);

const PremiumSettingsIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" />
    </svg>
);

const PremiumDocsIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5V15c0-4.142 3.358-7.5 7.5-7.5H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V21H6.5A2.5 2.5 0 0 1 4 19.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 2H20V17H6C4.89543 17 4 16.1046 4 15V4.24264C4 3.00401 5.09706 2 6.5 2H6Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
        <line x1="9" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
    </svg>
);

const PremiumEstimatesIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/**
 * Reusable NavItem sub-component handling both expanded (w-64) and collapsed (w-16) states.
 */
function NavItem({ icon: Icon, label, href = '#', active = false, badge = null, isCollapsed = false }) {
    return (
        <Link
            href={href}
            title={isCollapsed ? label : undefined}
            className={`group relative flex items-center ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.25'
            } rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                    ? 'bg-brand-10 text-brand font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 hover:dark:bg-slate-800/50 hover:text-gray-900 hover:dark:text-slate-200'
            }`}
        >
            <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    active ? 'text-brand' : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-900 group-hover:dark:text-slate-200'
                }`}
            />

            {!isCollapsed && (
                <>
                    <span className="truncate flex-1">{label}</span>
                    {badge && (
                        <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors ${
                                badge === 'GNN'
                                    ? 'bg-brand-10 text-brand border border-brand-30'
                                    : 'bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-700'
                            }`}
                        >
                            {badge}
                        </span>
                    )}
                </>
            )}

            {/* Collapsed floating indicator dot for active state */}
            {isCollapsed && active && (
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand" />
            )}
        </Link>
    );
}

export default function Sidebar({ user: propUser, studioName: propStudioName }) {
    const pageProps = usePage().props || {};
    const { auth, activeWorkspace, workspaceProjects = [], currentUserRole, pendingEstimatesCount } = pageProps;
    const currentPath = usePage().url || '';

    const user = propUser || auth?.user || { name: 'Studio Member', role: 'Project Manager' };
    const studioName = propStudioName || activeWorkspace || 'StudioSprint';

    // Mini-Sidebar collapse state
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Interactive theme state synced with document.documentElement and localStorage
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark';
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

    const toggleTheme = (darkTarget) => {
        setIsDark(darkTarget);
    };

    const baseHref = `/studio/${activeWorkspace || 'default'}`;

    const dashboardLinks = [
        {
            label: 'Overview',
            icon: PremiumDashboardIcon,
            href: `${baseHref}/overview`,
            active: currentPath.includes('/overview'),
        },
    ];

    const primaryLinks = [
        {
            label: 'Tasks',
            icon: PremiumTasksIcon,
            href: `${baseHref}/tasks`,
            active: currentPath.includes('/tasks'),
        },
        {
            label: 'Schedule',
            icon: PremiumScheduleIcon,
            href: `${baseHref}/schedule`,
            active: currentPath.includes('/schedule'),
        },
        {
            label: 'Team',
            icon: PremiumTeamIcon,
            href: `${baseHref}/team`,
            active: currentPath.includes('/team'),
            badge: 'GNN',
        },
        {
            label: 'Estimates',
            icon: PremiumEstimatesIcon,
            href: `${baseHref}/estimates/pending`,
            active: currentPath.includes('/estimates'),
            badge: pendingEstimatesCount > 0 ? String(pendingEstimatesCount) : null,
        },
        {
            label: 'Burndown',
            icon: PremiumDashboardIcon,
            href: `${baseHref}/burndown`,
            active: currentPath.includes('/burndown'),
        },
    ];

    const automationLinks = [
        {
            label: 'AI Workspace',
            icon: PremiumAutomationIcon,
            href: `${baseHref}/dashboard`,
            active: currentPath.includes('/dashboard') || currentPath === baseHref || currentPath === '',
        },
    ];

    const projectLinks = [
        {
            label: 'Projects',
            icon: PremiumProjectsIcon,
            href: `${baseHref}/projects`,
            active: currentPath === `${baseHref}/projects`,
        },
    ];

    const utilityLinks = [
        {
            label: 'Settings',
            icon: PremiumSettingsIcon,
            href: `${baseHref}/settings`,
            active: currentPath.includes('/settings'),
        },
        {
            label: 'Documentation',
            icon: PremiumDocsIcon,
            href: `${baseHref}/docs`,
            active: currentPath.includes('/docs'),
        },
    ];

    return (
        <aside
            className={`hidden md:flex flex-col h-screen shrink-0 bg-white dark:bg-slate-900/95 border-r border-gray-200 dark:border-slate-800/80 transition-all duration-200 z-40 select-none ${
                isCollapsed ? 'w-16' : 'w-64'
            }`}
        >
            {/* 1. Brand Header & Quick Search */}
            <div className="p-4 flex flex-col gap-3 border-b border-gray-100 dark:border-slate-800/50">
                {/* Brand Row */}
                <div className="flex items-center justify-between">
                    <Link
                        href={`${baseHref}/dashboard`}
                        className="flex items-center gap-2.5 overflow-hidden focus:outline-none"
                        title={studioName}
                    >
                        {/* Vaultera Labs symbol logo — collapses to symbol only */}
                        <ApplicationLogo
                            variant="symbol"
                            className="w-8 h-8 shrink-0"
                        />
                        {!isCollapsed && (
                            <span className="font-heading font-bold text-base tracking-tight text-gray-900 dark:text-slate-100 truncate">
                                StudioSprint
                            </span>
                        )}
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {isCollapsed ? (
                            <PanelLeftOpen className="w-5 h-5" />
                        ) : (
                            <PanelLeftClose className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Search Bar */}
                {isCollapsed ? (
                    <button
                        type="button"
                        onClick={() => alert('Search (⌘K)')}
                        className="w-full flex items-center justify-center py-2 rounded-xl bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 hover:text-brand dark:hover:text-brand hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                        title="Search (⌘K)"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="relative flex items-center">
                        <Search className="w-4 h-4 absolute left-3 text-gray-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search..."
                            readOnly
                            onClick={() => alert('Quick Search (⌘K)')}
                            className="w-full pl-9 pr-12 py-2 rounded-xl bg-gray-100 dark:bg-slate-800/50 border border-transparent focus:border-brand dark:focus:border-brand text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none cursor-pointer transition-all"
                        />
                        <span className="absolute right-2.5 text-[10px] font-mono text-gray-500 dark:text-slate-400 bg-gray-200 dark:bg-slate-700/80 rounded px-1.5 py-0.5 pointer-events-none">
                            ⌘K
                        </span>
                    </div>
                )}
            </div>

            {/* 2. Primary Navigation (Middle, Scrollable) */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Dashboard Group */}
                <div className="pb-1">
                    {!isCollapsed ? (
                        <p className="font-heading text-[11px] font-semibold text-gray-400 dark:text-slate-500 px-3 uppercase tracking-wider">
                            Dashboard
                        </p>
                    ) : (
                        <div className="my-2 h-px bg-gray-200 dark:bg-slate-800 mx-2" />
                    )}
                </div>

                {dashboardLinks.map((item) => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={item.active}
                        badge={item.badge}
                        isCollapsed={isCollapsed}
                    />
                ))}

                {/* Core Workspace Group */}
                <div className="pt-4 pb-1">
                    {!isCollapsed ? (
                        <p className="font-heading text-[11px] font-semibold text-gray-400 dark:text-slate-500 px-3 uppercase tracking-wider">
                            Core Workspace
                        </p>
                    ) : (
                        <div className="my-2 h-px bg-gray-200 dark:bg-slate-800 mx-2" />
                    )}
                </div>

                {primaryLinks.map((item) => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={item.active}
                        badge={item.badge}
                        isCollapsed={isCollapsed}
                    />
                ))}

                {/* Automation Group */}
                <div className="pt-4 pb-1">
                    {!isCollapsed ? (
                        <p className="font-heading text-[11px] font-semibold text-gray-400 dark:text-slate-500 px-3 uppercase tracking-wider">
                            Automation
                        </p>
                    ) : (
                        <div className="my-2 h-px bg-gray-200 dark:bg-slate-800 mx-2" />
                    )}
                </div>

                {automationLinks.map((item) => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={item.active}
                        badge={item.badge}
                        isCollapsed={isCollapsed}
                    />
                ))}

                {/* Projects Group */}
                <div className="pt-4 pb-1">
                    {!isCollapsed ? (
                        <p className="font-heading text-[11px] font-semibold text-gray-400 dark:text-slate-500 px-3 uppercase tracking-wider">
                            Projects
                        </p>
                    ) : (
                        <div className="my-2 h-px bg-gray-200 dark:bg-slate-800 mx-2" />
                    )}
                </div>

                {projectLinks.map((item) => (
                    <div key={item.label} className="space-y-1">
                        <NavItem
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={item.active}
                            isCollapsed={isCollapsed}
                        />
                        
                        {/* Sub-projects list */}
                        {!isCollapsed && workspaceProjects && workspaceProjects.length > 0 && (
                            <div className="mt-1 space-y-1">
                                {workspaceProjects.map((p) => {
                                    const projectHref = `${baseHref}/projects/${p.id}`;
                                    const isProjectActive = currentPath === projectHref;
                                    return (
                                        <Link
                                            key={p.id}
                                            href={projectHref}
                                            className={`flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border-l-2 ${
                                                isProjectActive
                                                    ? 'border-brand text-brand bg-brand-10/40 font-semibold'
                                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:bg-gray-50 hover:dark:bg-slate-800/30 hover:text-gray-900 hover:dark:text-slate-200'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                p.status === 'active'
                                                    ? 'bg-emerald-500'
                                                    : p.status === 'planning'
                                                    ? 'bg-amber-500'
                                                    : 'bg-gray-400'
                                            }`} />
                                            <span className="truncate">{p.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                {/* Settings & Help Group */}
                <div className="pt-4 pb-1">
                    {!isCollapsed ? (
                        <p className="font-heading text-[11px] font-semibold text-gray-400 dark:text-slate-500 px-3 uppercase tracking-wider">
                            Settings & Help
                        </p>
                    ) : (
                        <div className="my-2 h-px bg-gray-200 dark:bg-slate-800 mx-2" />
                    )}
                </div>

                {utilityLinks.map((item) => (
                    <NavItem
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={item.active}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </div>

            {/* 4. Pinned Footer (Theme Toggle & User Profile Card) */}
            <div className="p-3 border-t border-gray-200 dark:border-slate-800/80 mt-auto flex flex-col gap-3">
                {/* Theme Toggle Segmented Control */}
                {isCollapsed ? (
                    <button
                        type="button"
                        onClick={() => toggleTheme(!isDark)}
                        className="w-full flex items-center justify-center py-2 rounded-xl bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDark ? <Moon className="w-4 h-4 text-brand" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    </button>
                ) : (
                    <div className="flex items-center rounded-full bg-gray-100 dark:bg-slate-800/50 p-1 border border-gray-200/60 dark:border-slate-700/50">
                        <button
                            type="button"
                            onClick={() => toggleTheme(false)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                !isDark
                                    ? 'bg-white text-gray-900 shadow-sm font-semibold'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <span>Light</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleTheme(true)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                isDark
                                    ? 'bg-slate-700 text-slate-100 shadow-sm font-semibold'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Moon className="w-3.5 h-3.5 text-brand" />
                            <span>Dark</span>
                        </button>
                    </div>
                )}

                {/* User Profile Card & Log Out */}
                {isCollapsed ? (
                    <div className="flex flex-col gap-3 items-center">
                        <div
                            title={`${user?.name || 'User'} (${currentUserRole || user?.role || 'Member'})`}
                            className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                        >
                            {(user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 border border-red-500/20"
                            title="Log Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/40">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                                {(user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-heading text-sm font-semibold text-gray-900 dark:text-slate-200 truncate">
                                    {user?.name || 'Studio Member'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-500 truncate uppercase">
                                    {currentUserRole || user?.role || 'Member'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 shrink-0 ml-2 border border-red-500/20"
                            title="Log Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
