import React, { useState } from 'react';
import {
    MoreHorizontal,
    Sparkles,
    Bot,
    Plus,
    MessageSquare,
    X,
    Loader2
} from 'lucide-react';

function ChatHistoryItem({ session, isActive, onSelect, onDelete }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        setIsDeleting(true);
        await onDelete(session.id);
        setIsDeleting(false); // only reached if delete fails or confirm is cancelled
    };

    // Format relative time roughly
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const diffHours = (new Date() - d) / (1000 * 60 * 60);
        
        if (diffHours < 24) return 'Today';
        if (diffHours < 48) return 'Yesterday';
        return d.toLocaleDateString();
    };

    return (
        <div
            onClick={() => onSelect(session.id)}
            className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                isActive 
                    ? 'bg-brand/10 dark:bg-brand/20' 
                    : 'hover:bg-gray-100 dark:hover:bg-slate-800/60'
            }`}
        >
            {/* Active Indicator Border */}
            {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand" />
            )}

            <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
                <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'}`} />
                <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-sm truncate ${isActive ? 'font-semibold text-brand dark:text-brand-light' : 'font-medium text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100'}`}>
                        {session.title || 'New Chat'}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-500 truncate mt-0.5">
                        {formatTime(session.updated_at)}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={`p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${isActive ? 'opacity-100' : ''}`}
            >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" /> : <X className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

export default function RightSidebar({
    sessions = [],
    activeSessionId,
    isLoading,
    onNewChat,
    onSelectChat,
    onDeleteChat
}) {
    return (
        <aside className="w-80 lg:w-96 border-l border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/50 hidden lg:flex flex-col flex-shrink-0 h-full">
            {/* Sidebar Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand dark:text-brand-light" />
                    <h3 className="font-heading text-sm sm:text-base font-bold text-gray-900 dark:text-slate-200">
                        AI Workspace
                    </h3>
                </div>

                <button
                    type="button"
                    title="More options"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* New Chat Button Container */}
            <div className="px-6 pb-4">
                <button
                    type="button"
                    onClick={onNewChat}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand text-white font-semibold text-sm shadow-sm hover:bg-brand-dark transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    )}
                    <span>New Chat</span>
                </button>
            </div>

            {/* Section Divider */}
            <div className="px-6 pb-2">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">Chats</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800"></div>
                </div>
            </div>

            {/* Scrollable List Container */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {sessions.length > 0 ? (
                    sessions.map((session) => (
                        <ChatHistoryItem 
                            key={session.id} 
                            session={session} 
                            isActive={activeSessionId === session.id}
                            onSelect={onSelectChat}
                            onDelete={onDeleteChat}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-slate-500 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center mb-4 shadow-sm">
                            <Bot className="w-6 h-6 text-brand/60" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-1">No chats yet</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                            Start a new conversation to see your history appear here.
                        </p>
                    </div>
                )}

                {/* Truncation notice: shown when the list is at the server-imposed 50-session cap */}
                {sessions.length >= 50 && (
                    <p className="text-center text-[10px] text-gray-400 dark:text-slate-600 pt-3 pb-1 select-none">
                        Showing 50 most recent chats
                    </p>
                )}
            </div>
        </aside>
    );
}
