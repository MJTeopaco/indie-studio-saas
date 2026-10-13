import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/Components/UI/card';
import { Badge } from '@/Components/UI/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/UI/avatar';
import PriorityBadge from '@/Components/Tenant/PriorityBadge';
import TaskFlyoutInspector from '@/Components/Tenant/Tasks/TaskFlyoutInspector';
import { showToast } from '@/Components/SystemToast';
import {
    Clock,
    Flame,
    Target,
    MessageSquare,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Activity,
    ExternalLink,
    AlertTriangle,
    Search,
    Star,
    ChevronDown,
    ChevronRight,
    Heart,
    Send,
    Sparkles,
    Check,
    X,
    Filter,
    Loader2,
    Paperclip,
    Info,
    FolderKanban,
    LayoutDashboard,
    User,
    Plus,
    Smile,
    MessageCircle,
    Eye,
    Bell,
    CheckSquare,
    Zap,
    Calendar,
    ChevronUp,
} from 'lucide-react';

/**
 * Authentic SVG Illustration of High-Five Celebration (Monday.com style)
 */
function HighFiveCelebrationSvg({ className = 'w-48 h-36' }) {
    return (
        <svg
            className={className}
            viewBox="0 0 280 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Background celebratory burst */}
            <circle cx="140" cy="115" r="54" fill="#E0F2FE" className="dark:fill-slate-800/80" />
            <path
                d="M140 38L145 52L159 47L149 59L161 68L147 72L152 86L140 76L128 86L133 72L119 68L131 59L121 47L135 52L140 38Z"
                fill="#F59E0B"
                opacity="0.9"
            />
            {/* Sparkles */}
            <circle cx="78" cy="65" r="5" fill="#3B82F6" />
            <circle cx="204" cy="58" r="6" fill="#10B981" />
            <circle cx="68" cy="120" r="4" fill="#F43F5E" />
            <circle cx="218" cy="116" r="4.5" fill="#8B5CF6" />
            <path d="M72 45L74 52L81 54L74 56L72 63L70 56L63 54L70 52L72 45Z" fill="#F59E0B" />
            <path d="M208 80L210 86L216 88L210 90L208 96L206 90L200 88L206 86L208 80Z" fill="#007CFF" />

            {/* Left Hand (Pink / Rose Tone) */}
            <g transform="translate(10, 5)">
                <path
                    d="M112 170L112 125C112 119.5 116.5 115 122 115C127.5 115 132 119.5 132 125L132 165"
                    stroke="#F43F5E"
                    strokeWidth="11"
                    strokeLinecap="round"
                />
                <path
                    d="M125 170L125 106C125 100.5 129.5 96 135 96C140.5 96 145 100.5 145 106L145 165"
                    stroke="#F472B6"
                    strokeWidth="11"
                    strokeLinecap="round"
                />
                <path
                    d="M137 170L137 114C137 108.5 141.5 104 147 104C152.5 104 157 108.5 157 114L157 165"
                    stroke="#FB7185"
                    strokeWidth="11"
                    strokeLinecap="round"
                />
                {/* Thumb */}
                <path
                    d="M102 145C102 138 107 132 114 132L118 132"
                    stroke="#F43F5E"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
                {/* Palm */}
                <path
                    d="M105 152C105 142 114 135 124 135L145 135C155 135 162 143 162 153L158 185C158 191 153 196 147 196L116 196C110 196 105 191 105 185Z"
                    fill="#FDA4AF"
                />
                {/* Sleeve */}
                <path d="M100 186L164 186L160 200L104 200Z" fill="#007CFF" />
            </g>

            {/* Right Hand (Warm Amber / Brown Tone) */}
            <g transform="translate(5, 5)">
                <path
                    d="M165 170L165 125C165 119.5 160.5 115 155 115C149.5 115 145 119.5 145 125L145 165"
                    stroke="#D97706"
                    strokeWidth="11"
                    strokeLinecap="round"
                />
                <path
                    d="M152 170L152 106C152 100.5 147.5 96 142 96C136.5 96 132 100.5 132 106L132 165"
                    stroke="#F59E0B"
                    strokeWidth="11"
                    strokeLinecap="round"
                />
                <path
                    d="M140 170L140 114C140 108.5 135.5 104 130 104C124.5 104 120 108.5 120 114L120 165"
                    stroke="#B45309"
                    strokeWidth="11"
                    strokeLinecap="round"
                />
                {/* Thumb */}
                <path
                    d="M175 145C175 138 170 132 163 132L159 132"
                    stroke="#D97706"
                    strokeWidth="10"
                    strokeLinecap="round"
                />
                {/* Palm */}
                <path
                    d="M172 152C172 142 163 135 153 135L132 135C122 135 115 143 115 153L119 185C119 191 124 196 130 196L161 196C167 196 172 191 172 185Z"
                    fill="#FBBF24"
                />
                {/* Sleeve */}
                <path d="M113 186L177 186L173 200L117 200Z" fill="#10B981" />
            </g>
        </svg>
    );
}

/**
 * Monday.com Board Miniature Graphic for Recently Visited Cards
 */
function MiniBoardGraphic({ type = 'sprints' }) {
    if (type === 'sprints') {
        return (
            <div className="w-full h-24 bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-slate-800 dark:to-slate-900 rounded-lg p-2.5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 select-none">
                <div className="flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                    <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="ml-auto h-1.5 w-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-10 rounded bg-indigo-500" />
                        <span className="h-2 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
                        <span className="h-2 w-6 rounded bg-emerald-500" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-10 rounded bg-amber-500" />
                        <span className="h-2 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
                        <span className="h-2 w-6 rounded bg-[#007CFF]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-10 rounded bg-emerald-500" />
                        <span className="h-2 flex-1 rounded bg-slate-200 dark:bg-slate-700" />
                        <span className="h-2 w-6 rounded bg-emerald-500" />
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'tasks') {
        return (
            <div className="w-full h-24 bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-slate-800 dark:to-slate-900 rounded-lg p-2.5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 select-none">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                    <span className="h-1.5 w-14 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded border border-slate-300 dark:border-slate-600" />
                        <span className="h-2 w-16 rounded bg-slate-300 dark:bg-slate-600" />
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">Done</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded border border-slate-300 dark:border-slate-600" />
                        <span className="h-2 w-20 rounded bg-slate-300 dark:bg-slate-600" />
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded border border-slate-300 dark:border-slate-600" />
                        <span className="h-2 w-12 rounded bg-slate-300 dark:bg-slate-600" />
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">To Do</span>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'epics') {
        return (
            <div className="w-full h-24 bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-slate-800 dark:to-slate-900 rounded-lg p-2.5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 select-none">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                    <span className="h-1.5 w-16 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="h-1.5 w-8 rounded-full bg-indigo-200 dark:bg-indigo-800" />
                </div>
                <div className="space-y-2 py-0.5">
                    <div className="w-3/4 ml-2 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-2xs" />
                    <div className="w-1/2 ml-8 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-2xs" />
                    <div className="w-2/3 ml-4 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-2xs" />
                </div>
            </div>
        );
    }

    // Default / Retrospectives / Reports
    return (
        <div className="w-full h-24 bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-slate-800 dark:to-slate-900 rounded-lg p-2.5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 select-none">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="h-1.5 w-14 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-end justify-between gap-1.5 h-12 pt-2 px-1">
                <div className="w-1/4 h-1/2 rounded-t bg-slate-300 dark:bg-slate-700" />
                <div className="w-1/4 h-3/4 rounded-t bg-indigo-400 dark:bg-indigo-600" />
                <div className="w-1/4 h-full rounded-t bg-brand" />
                <div className="w-1/4 h-2/3 rounded-t bg-emerald-400 dark:bg-emerald-600" />
            </div>
        </div>
    );
}

export default function MemberDashboard({
    studio,
    metrics = {},
    charts = {},
    tables = {},
    projects = [],
    activeSprint = null,
    recentBoards = [],
    updateFeed = [],
    unreadFeedCount = 0,
}) {
    const { auth, activeWorkspace } = usePage().props;
    const user = auth?.user;
    const studioName = studio?.name || 'SprintStudio';

    // Time of day greeting
    const greetingText = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const userFirstName = useMemo(() => {
        if (!user?.name) return 'Teammate';
        return user.name.split(' ')[0];
    }, [user?.name]);

    // Section collapse state
    const [recentlyVisitedOpen, setRecentlyVisitedOpen] = useState(true);
    const [updateFeedOpen, setUpdateFeedOpen] = useState(true);
    const [showAllBoards, setShowAllBoards] = useState(false);


    // Favorites persistence in localStorage
    const [favorites, setFavorites] = useState(() => {
        try {
            const raw = localStorage.getItem('home_favorited_boards');
            return raw ? JSON.parse(raw) : ['sprints', 'tasks'];
        } catch {
            return ['sprints', 'tasks'];
        }
    });

    const toggleFavorite = (boardId, e) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorites(prev => {
            const updated = prev.includes(boardId)
                ? prev.filter(id => id !== boardId)
                : [...prev, boardId];
            try {
                localStorage.setItem('home_favorited_boards', JSON.stringify(updated));
            } catch {
                // Ignore
            }
            return updated;
        });
    };

    // Feed state
    const [feedItems, setFeedItems] = useState(updateFeed || []);
    const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'mentions' | 'unread'
    const [feedSearch, setFeedSearch] = useState('');
    const [replyingItemId, setReplyingItemId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [likedItemIds, setLikedItemIds] = useState([]);

    useEffect(() => {
        setFeedItems(updateFeed || []);
    }, [updateFeed]);

    // Side panel inspector preview for tasks
    const [selectedTask, setSelectedTask] = useState(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    const handleTaskClick = (task) => {
        if (!task) return;
        setSelectedTask(task);
        setIsInspectorOpen(true);
    };

    // Update task status from side panel
    const handleUpdateTaskStatus = async (task, newStatus, note) => {
        return new Promise((resolve, reject) => {
            router.patch(
                route('tenant.tasks.update-status', {
                    tenant: studio?.id || activeWorkspace,
                    task: task.id,
                }),
                {
                    status: newStatus,
                    completion_notes: note,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        showToast(`Task #${task.id} updated to ${newStatus}`, 'success');
                        resolve();
                    },
                    onError: (err) => {
                        console.error('Task status update failed:', err);
                        showToast('Failed to update task status.', 'error');
                        reject(new Error('Failed to update task status'));
                    },
                }
            );
        });
    };

    // Quick Reply to a feed item (channel or direct message)
    const handleSendQuickReply = async (item) => {
        if (!replyText.trim() || !item?.channel_id) return;
        setIsSubmittingReply(true);
        try {
            await axios.post(
                route('tenant.channels.messages.store', {
                    tenant: activeWorkspace,
                    channelId: item.channel_id,
                }),
                {
                    body: replyText.trim(),
                }
            );

            showToast('Reply dispatched into message channel.', 'success');
            setReplyText('');
            setReplyingItemId(null);

            // Mark item as read optimistically
            setFeedItems(prev =>
                prev.map(f => (f.id === item.id ? { ...f, is_read: true } : f))
            );
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to dispatch reply.', 'error');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Toggle like on a feed item
    const handleToggleLike = (itemId) => {
        setLikedItemIds(prev => {
            const isLiked = prev.includes(itemId);
            const updated = isLiked ? prev.filter(id => id !== itemId) : [...prev, itemId];
            setFeedItems(items =>
                items.map(item => {
                    if (item.id === itemId) {
                        return {
                            ...item,
                            is_liked: !isLiked,
                            likes_count: (item.likes_count || 0) + (isLiked ? -1 : 1),
                        };
                    }
                    return item;
                })
            );
            return updated;
        });
    };

    // Mark single notification read
    const handleMarkItemRead = async (item) => {
        try {
            await axios.post(
                route('tenant.notifications.read', {
                    tenant: activeWorkspace,
                    id: item.id,
                })
            );
            setFeedItems(prev =>
                prev.map(f => (f.id === item.id ? { ...f, is_read: true } : f))
            );
            showToast('Update marked as read.', 'success');
        } catch (error) {
            // Optimistic fallback
            setFeedItems(prev =>
                prev.map(f => (f.id === item.id ? { ...f, is_read: true } : f))
            );
        }
    };

    // Mark all notifications read
    const handleMarkAllRead = async () => {
        try {
            await axios.post(route('tenant.notifications.read-all', { tenant: activeWorkspace }));
            setFeedItems(prev => prev.map(f => ({ ...f, is_read: true })));
            showToast('All feed updates marked as read.', 'success');
        } catch (error) {
            setFeedItems(prev => prev.map(f => ({ ...f, is_read: true })));
        }
    };

    // Filtered feed computation
    const filteredFeedItems = useMemo(() => {
        return feedItems.filter(item => {
            // Tab filter
            if (feedFilter === 'unread' && item.is_read) return false;
            if (feedFilter === 'mentions' && !item.is_mention) return false;

            // Search filter
            if (feedSearch.trim()) {
                const q = feedSearch.toLowerCase();
                const matchesAuthor = item.author?.name?.toLowerCase().includes(q);
                const matchesTitle = item.title?.toLowerCase().includes(q);
                const matchesBody = item.body?.toLowerCase().includes(q);
                const matchesContext = item.context_name?.toLowerCase().includes(q);
                return matchesAuthor || matchesTitle || matchesBody || matchesContext;
            }

            return true;
        });
    }, [feedItems, feedFilter, feedSearch]);

    // Unread count
    const liveUnreadCount = useMemo(() => {
        return feedItems.filter(f => !f.is_read).length;
    }, [feedItems]);


    // Quick Search modal state
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchModalOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Filtered quick search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        const results = [];

        // Boards
        (recentBoards || []).forEach(b => {
            if (b.title.toLowerCase().includes(q) || b.breadcrumb.toLowerCase().includes(q)) {
                results.push({ type: 'Board', title: b.title, desc: b.breadcrumb, url: b.url });
            }
        });

        // Tasks
        (tables.my_tasks || []).forEach(t => {
            if (t.title.toLowerCase().includes(q) || String(t.id).includes(q)) {
                results.push({
                    type: 'Task',
                    title: `#${t.id} ${t.title}`,
                    desc: `${t.project_name || 'Project'} • ${t.status}`,
                    url: route('tenant.tasks', { tenant: activeWorkspace }),
                });
            }
        });

        return results.slice(0, 8);
    }, [searchQuery, recentBoards, tables.my_tasks, activeWorkspace]);

    // Primary project reference
    const primaryProject = projects[0] || null;

    return (
        <TenantLayout studioName={studioName}>
            <Head title={`Home — ${studioName}`} />

            {/* Scrollable Container with stable gutter */}
            <div className="flex-1 w-full h-full min-h-0 overflow-y-auto custom-scrollbar [scrollbar-gutter:stable] bg-slate-50/60 dark:bg-slate-950/60">
                <div className="max-w-[1400px] mx-auto py-7 px-4 sm:px-6 lg:px-8 space-y-7">

                    {/* ======================================================== */}
                    {/* GREETING & ACTION HEADER (Monday.com Standard)           */}
                    {/* ======================================================== */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {greetingText}, {userFirstName}!
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Quickly access your recent boards, update feed inbox, and project workspaces.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">

                            <button
                                type="button"
                                onClick={() => setSearchModalOpen(true)}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-brand hover:bg-brand-dark shadow-sm shadow-brand/20 transition-all cursor-pointer"
                            >
                                <Zap className="w-3.5 h-3.5 text-white fill-white" />
                                <span>Quick Search</span>
                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono bg-white/20 rounded text-white">
                                    Ctrl K
                                </kbd>
                            </button>
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* TWO-COLUMN GRID: Left (Main Feed & Boards) | Right (Widgets) */}
                    {/* ======================================================== */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

                        {/* LEFT COLUMN (approx 70%) */}
                        <div className="lg:col-span-8 space-y-7">

                            {/* ── SECTION 1: Recently Visited Boards ──────────────── */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setRecentlyVisitedOpen(prev => !prev)}
                                        className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white hover:text-brand transition-colors cursor-pointer"
                                    >
                                        {recentlyVisitedOpen ? (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        )}
                                        <span>Recently visited</span>
                                    </button>

                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {(recentBoards || []).length} boards
                                    </span>
                                </div>

                                {recentlyVisitedOpen && (
                                    <div className="space-y-3 animate-in fade-in duration-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                                            {(recentBoards || []).map((board) => {
                                                const isFavorited = favorites.includes(board.id);
                                                return (
                                                    <Link
                                                        key={board.id}
                                                        href={board.url}
                                                        className="group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand/40 dark:hover:border-brand/40 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
                                                    >
                                                        {/* Mini Graphic Preview */}
                                                        <MiniBoardGraphic type={board.type} />

                                                        {/* Card Footer: Title & Star */}
                                                        <div className="pt-2.5 flex items-start justify-between gap-1.5">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-brand transition-colors" />
                                                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                        {board.title}
                                                                    </h3>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                                    {board.breadcrumb}
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                                                                onClick={(e) => toggleFavorite(board.id, e)}
                                                                className="p-1 rounded-md text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                                                            >
                                                                <Star className={`w-3.5 h-3.5 ${isFavorited ? 'text-amber-400 fill-amber-400' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>

                                        <div className="pt-1 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowAllBoards(prev => !prev)}
                                                className="text-xs font-semibold text-slate-500 hover:text-brand dark:hover:text-brand-light transition-colors cursor-pointer"
                                            >
                                                {showAllBoards ? 'Show Less' : 'Show All Boards'}
                                            </button>
                                        </div>

                                        {showAllBoards && (
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {(projects || []).map(p => (
                                                    <Link
                                                        key={p.id}
                                                        href={route('tenant.projects.show', { tenant: activeWorkspace, project: p.id })}
                                                        className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 truncate flex items-center gap-1.5"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                                                        <span className="truncate">{p.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── SECTION 2: Update Feed (Inbox) ─────────────────── */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setUpdateFeedOpen(prev => !prev)}
                                            className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white hover:text-brand transition-colors cursor-pointer"
                                        >
                                            {updateFeedOpen ? (
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            )}
                                            <span>Update Feed (Inbox)</span>
                                        </button>

                                        {liveUnreadCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500 text-white shadow-2xs">
                                                {liveUnreadCount}
                                            </span>
                                        )}

                                        <span
                                            title="Real-time notifications, direct mentions, task assignments, and channel messages"
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
                                        >
                                            <Info className="w-3.5 h-3.5" />
                                        </span>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        type="button"
                                        onClick={handleMarkAllRead}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1"
                                    >
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Mark All as Read</span>
                                    </button>
                                </div>

                                {updateFeedOpen && (
                                    <div className="space-y-4 animate-in fade-in duration-200">

                                        {/* Feed Filter Bar & Search */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                            {/* Filter Tabs */}
                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                                {[
                                                    { key: 'all', label: 'All Updates' },
                                                    { key: 'mentions', label: 'I Was Mentioned' },
                                                    { key: 'unread', label: 'Unread Only' },
                                                ].map(tab => (
                                                    <button
                                                        key={tab.key}
                                                        type="button"
                                                        onClick={() => setFeedFilter(tab.key)}
                                                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                                            feedFilter === tab.key
                                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Live Search in Feed */}
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter feed..."
                                                    value={feedSearch}
                                                    onChange={e => setFeedSearch(e.target.value)}
                                                    className="w-full sm:w-48 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pl-8 pr-7 py-1.5 focus:ring-brand focus:border-brand"
                                                />
                                                {feedSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFeedSearch('')}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Feed Items or Empty Celebration */}
                                        {filteredFeedItems.length === 0 ? (
                                            /* ── EXACT MONDAY.COM HIGH-FIVE CELEBRATION EMPTY STATE ── */
                                            <div className="py-12 px-4 text-center space-y-4">
                                                <div className="flex justify-center">
                                                    <HighFiveCelebrationSvg className="w-44 h-32 sm:w-52 sm:h-36" />
                                                </div>

                                                <div className="space-y-1.5 max-w-md mx-auto">
                                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                        No Unread Updates
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        To revisit updates you've already read, change the filter at the top left corner of your feed.
                                                    </p>
                                                </div>

                                                {feedFilter !== 'all' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFeedFilter('all')}
                                                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                                    >
                                                        View All Updates
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            /* ── RICH INTERACTIVE FEED CARDS ── */
                                            <div className="space-y-3.5">
                                                {filteredFeedItems.map(item => {
                                                    const isLiked = likedItemIds.includes(item.id) || item.is_liked;
                                                    const isReplying = replyingItemId === item.id;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all duration-200 ${
                                                                !item.is_read
                                                                    ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs'
                                                                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                            }`}
                                                        >
                                                            {/* Card Header */}
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-start gap-3 min-w-0">
                                                                    <Avatar className="w-8 h-8 rounded-full shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                                                                        <AvatarImage src={item.author?.avatar} />
                                                                        <AvatarFallback className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                                                            {item.author?.initials || 'U'}
                                                                        </AvatarFallback>
                                                                    </Avatar>

                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                                {item.author?.name || 'Studio Teammate'}
                                                                            </span>
                                                                            {item.author?.role && (
                                                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                                    {item.author.role}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-slate-400 text-xs">•</span>
                                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                                {item.created_at_human}
                                                                            </span>
                                                                        </div>

                                                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                                                                            <span>{item.title}</span>
                                                                            {item.context_name && (
                                                                                <span className="font-semibold text-brand truncate">
                                                                                    ({item.context_name})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Unread dot or Mark read */}
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    {!item.is_read ? (
                                                                        <button
                                                                            type="button"
                                                                            title="Mark as read"
                                                                            onClick={() => handleMarkItemRead(item)}
                                                                            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                                        >
                                                                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />
                                                                            <span>New</span>
                                                                        </button>
                                                                    ) : (
                                                                        <span title="Read" className="text-slate-300 dark:text-slate-600">
                                                                            <Check className="w-3.5 h-3.5" />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Card Body */}
                                                            <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 pl-11 whitespace-pre-wrap leading-relaxed">
                                                                {item.body}
                                                            </div>

                                                            {/* Action Footer */}
                                                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 pl-11 flex items-center justify-between gap-3 text-xs">
                                                                <div className="flex items-center gap-4">
                                                                    {/* Like / React button */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleLike(item.id)}
                                                                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                                                                            isLiked
                                                                                ? 'text-rose-500 font-bold'
                                                                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                                        }`}
                                                                    >
                                                                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                                        <span>{item.likes_count || (isLiked ? 1 : 0) || 'Like'}</span>
                                                                    </button>

                                                                    {/* Quick Reply toggle button */}
                                                                    {item.channel_id && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (replyingItemId === item.id) {
                                                                                    setReplyingItemId(null);
                                                                                } else {
                                                                                    setReplyingItemId(item.id);
                                                                                    setReplyText('');
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-1.5 text-slate-500 hover:text-brand transition-colors cursor-pointer"
                                                                        >
                                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                                            <span>Reply</span>
                                                                        </button>
                                                                    )}

                                                                    {/* Inspect task */}
                                                                    {item.task_id && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleTaskClick(item.task)}
                                                                            className="flex items-center gap-1.5 text-slate-500 hover:text-brand transition-colors cursor-pointer"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                            <span>Inspect Task</span>
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Jump direct link */}
                                                                <Link
                                                                    href={item.context_url || route('tenant.inbox', { tenant: activeWorkspace })}
                                                                    className="text-slate-400 hover:text-brand font-semibold text-[11px] flex items-center gap-1"
                                                                >
                                                                    <span>Open in Inbox</span>
                                                                    <ArrowRight className="w-3 h-3" />
                                                                </Link>
                                                            </div>

                                                            {/* Inline Quick Reply Expandable Area */}
                                                            {isReplying && (
                                                                <div className="mt-3 pl-11 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                                                                    <div className="flex items-start gap-2.5">
                                                                        <Avatar className="w-7 h-7 rounded-full shrink-0">
                                                                            <AvatarImage src={user?.avatar} />
                                                                            <AvatarFallback className="text-[10px] font-bold bg-brand text-white">
                                                                                {userFirstName[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>

                                                                        <div className="flex-1 space-y-2">
                                                                            <textarea
                                                                                rows={2}
                                                                                value={replyText}
                                                                                onChange={e => setReplyText(e.target.value)}
                                                                                placeholder={`Write a quick reply to ${item.author?.name}...`}
                                                                                className="w-full text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 focus:ring-brand focus:border-brand resize-none"
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                                        e.preventDefault();
                                                                                        handleSendQuickReply(item);
                                                                                    }
                                                                                }}
                                                                            />

                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-[10px] text-slate-400">
                                                                                    Press Enter to send
                                                                                </span>

                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setReplyingItemId(null)}
                                                                                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>

                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={!replyText.trim() || isSubmittingReply}
                                                                                        onClick={() => handleSendQuickReply(item)}
                                                                                        className="px-3 py-1 text-xs font-bold rounded-lg bg-brand text-white hover:bg-brand-dark transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                                                                    >
                                                                                        {isSubmittingReply ? (
                                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                                        ) : (
                                                                                            <Send className="w-3 h-3" />
                                                                                        )}
                                                                                        <span>Send</span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Sidebar Widgets (approx 30%) */}
                        <div className="lg:col-span-4 space-y-6">



                            {/* ── WIDGET 2: My Priority Tasks ─────────────────────── */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare className="w-4 h-4 text-brand" />
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            My Priority Work
                                        </h3>
                                    </div>
                                    <Link
                                        href={route('tenant.tasks', { tenant: activeWorkspace })}
                                        className="text-[11px] font-bold text-brand hover:underline"
                                    >
                                        View All
                                    </Link>
                                </div>

                                {(tables.up_next || []).length === 0 ? (
                                    <p className="text-xs text-slate-400 py-3 text-center">
                                        All tasks completed! Enjoy your day.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {(tables.up_next || []).map(task => (
                                            <button
                                                key={task.id}
                                                type="button"
                                                onClick={() => handleTaskClick(task)}
                                                className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer space-y-1.5"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                        {task.title}
                                                    </span>
                                                    <PriorityBadge priority={task.priority} />
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                    <span className="truncate">{task.project_name || 'Task'}</span>
                                                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                                        {task.due_date || (task.days_until_deadline !== null ? `${task.days_until_deadline}d left` : 'Active')}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── WIDGET 3: Active Sprint Milestone ──────────────── */}
                            {activeSprint && (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-emerald-500" />
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Active Sprint
                                            </h3>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase">
                                            {activeSprint.status}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                            {activeSprint.name}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Target: {activeSprint.end_date || 'In progress'}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 font-medium">Story Points</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                {activeSprint.done_points || 0} / {activeSprint.total_points || 0}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                style={{ width: `${activeSprint.percent || 0}%` }}
                                                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── WIDGET 4: Quick Workflow Boosters ──────────────── */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Quick Shortcuts
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <Link
                                        href={route('tenant.tasks', { tenant: activeWorkspace })}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FolderKanban className="w-4 h-4 text-brand" />
                                            <span className="font-semibold">All Tasks Board</span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>

                                    <Link
                                        href={route('tenant.reports', { tenant: activeWorkspace })}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-indigo-500" />
                                            <span className="font-semibold">My Performance Report</span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>

                                    <Link
                                        href={route('tenant.inbox', { tenant: activeWorkspace })}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                                            <span className="font-semibold">Team Discussions</span>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>

            {/* Quick Search Spotlight Modal (Ctrl+K) */}
            {searchModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
                    <div
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <Search className="w-5 h-5 text-slate-400 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search boards, tasks, or sprints..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full text-sm bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 p-0"
                            />
                            <button
                                type="button"
                                onClick={() => setSearchModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-72 overflow-y-auto p-2">
                            {searchResults.length === 0 ? (
                                <p className="text-xs text-slate-400 py-6 text-center">
                                    {searchQuery ? 'No matching boards or tasks found.' : 'Type to search across SprintStudio boards and tasks.'}
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {searchResults.map((r, i) => (
                                        <Link
                                            key={i}
                                            href={r.url}
                                            onClick={() => setSearchModalOpen(false)}
                                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {r.title}
                                                </div>
                                                <div className="text-[10px] text-slate-400">{r.desc}</div>
                                            </div>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {r.type}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Task Flyout Inspector in-place */}
            {selectedTask && (
                <TaskFlyoutInspector
                    task={selectedTask}
                    isOpen={isInspectorOpen}
                    onClose={() => {
                        setIsInspectorOpen(false);
                        setSelectedTask(null);
                    }}
                    onUpdateStatus={handleUpdateTaskStatus}
                />
            )}
        </TenantLayout>
    );
}
