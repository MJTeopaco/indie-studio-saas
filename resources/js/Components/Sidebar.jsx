import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    Bot,
    FolderClosed,
    Network,
    Users,
    Settings,
    HelpCircle,
    Sun,
    Moon,
} from 'lucide-react';

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
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 hover:dark:bg-slate-800/50 hover:text-gray-900 hover:dark:text-slate-200'
            }`}
        >
            <Icon
                className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-900 group-hover:dark:text-slate-200'
                }`}
            />

            {!isCollapsed && (
                <>
                    <span className="truncate flex-1">{label}</span>
                    {badge && (
                        <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md transition-colors ${
                                badge === 'GNN'
                                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
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
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
        </Link>
    );
}

export default function Sidebar({ user: propUser, studioName: propStudioName }) {
    const pageProps = usePage().props || {};
    const { auth, activeWorkspace } = pageProps;
    const currentPath = usePage().url || '';

    const user = propUser || auth?.user || { name: 'Studio Member', role: 'Project Manager' };
    const studioName = propStudioName || activeWorkspace || 'StudioSprint';

    // Mini-Sidebar collapse state
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Interactive theme state synced with document.documentElement
    const [isDark, setIsDark] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return true;
    });

    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [isDark]);

    const toggleTheme = (darkTarget) => {
        setIsDark(darkTarget);
    };

    const baseHref = `/studio/${activeWorkspace || 'default'}`;

    const primaryLinks = [
        {
            label: 'AI Workspace',
            icon: Bot,
            href: `${baseHref}/dashboard`,
            active: currentPath.includes('/dashboard') || currentPath === baseHref || currentPath === '',
        },
        {
            label: 'Projects',
            icon: FolderClosed,
            href: `${baseHref}/projects`,
            active: currentPath.includes('/projects'),
        },
        {
            label: 'Task Network',
            icon: Network,
            href: `${baseHref}/tasks`,
            active: currentPath.includes('/tasks'),
        },
        {
            label: 'Team Capacity',
            icon: Users,
            href: `${baseHref}/team`,
            active: currentPath.includes('/team'),
            badge: 'GNN',
        },
    ];

    const secondaryLinks = [
        {
            label: 'Studio Settings',
            icon: Settings,
            href: `${baseHref}/settings`,
            active: currentPath.includes('/settings'),
        },
        {
            label: 'Documentation',
            icon: HelpCircle,
            href: '/docs',
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
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {!isCollapsed && (
                            <span className="font-bold text-base tracking-tight text-gray-900 dark:text-slate-100 truncate">
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
                            <PanelLeftOpen className="w-4.5 h-4.5" />
                        ) : (
                            <PanelLeftClose className="w-4.5 h-4.5" />
                        )}
                    </button>
                </div>

                {/* Search Bar */}
                {isCollapsed ? (
                    <button
                        type="button"
                        onClick={() => alert('Search (⌘K)')}
                        className="w-full flex items-center justify-center py-2 rounded-xl bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
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
                            className="w-full pl-9 pr-12 py-2 rounded-xl bg-gray-100 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none cursor-pointer transition-all"
                        />
                        <span className="absolute right-2.5 text-[10px] font-mono text-gray-500 dark:text-slate-400 bg-gray-200 dark:bg-slate-700/80 rounded px-1.5 py-0.5 pointer-events-none">
                            ⌘K
                        </span>
                    </div>
                )}
            </div>

            {/* 2. Primary Navigation (Middle, Scrollable) */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

                {/* 3. Secondary Navigation */}
                <div className="pt-4 pb-1">
                    {!isCollapsed ? (
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 px-3 uppercase tracking-wider">
                            Settings & Help
                        </p>
                    ) : (
                        <div className="my-2 h-px bg-gray-200 dark:bg-slate-800 mx-2" />
                    )}
                </div>

                {secondaryLinks.map((item) => (
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
                        {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
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
                            <Moon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Dark</span>
                        </button>
                    </div>
                )}

                {/* User Profile Card */}
                <div
                    title={isCollapsed ? `${user?.name || 'User'} (${user?.role || 'Member'})` : undefined}
                    className={`flex items-center ${
                        isCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2'
                    } rounded-xl hover:bg-gray-100 hover:dark:bg-slate-800/60 cursor-pointer transition-all duration-200`}
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>

                    {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 truncate">
                                {user?.name || 'Studio Member'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                                {user?.role || 'Project Manager'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
