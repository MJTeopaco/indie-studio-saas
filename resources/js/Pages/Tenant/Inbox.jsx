import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import MemberTaskDetailModal from '@/Components/Tenant/Tasks/MemberTaskDetailModal';
import {
    Bell,
    MailOpen,
    MessageSquare,
    Sparkles,
    Eye,
    ClipboardList,
    AlertCircle,
    Ban,
    ArrowRight,
    Search,
    Clock,
    Send,
    Hash,
    ShieldCheck,
    Plus,
    Trash2,
    X,
    AlertTriangle,
    ChevronDown,
    FolderGit2,
    Loader2,
    Paperclip,
    Image as ImageIcon,
    FileText,
    Download,
    AtSign,
    Mail,
    Check,
    CornerUpLeft,
    Copy,
    Forward,
    Pin,
    PinOff,
    FolderOpen,
    ExternalLink,
    Link2,
    Grid,
} from 'lucide-react';
import axios from 'axios';

// ── Protected default channels (cannot be deleted) ──────────────────────────
const PROTECTED_IDS = new Set(['ch-general', 'ch-sprint', 'ch-dev']);

const DEFAULT_CHANNELS = [
    { id: 'ch-general', name: 'general', description: 'Studio-wide announcements & discussion' },
    { id: 'ch-sprint', name: 'sprint-room', description: 'Active sprint execution & blocker coordination' },
    { id: 'ch-dev', name: 'dev-help', description: 'Code reviews, technical questions & architecture' },
];

// ── Premium Notification Badge ───────────────────────────────────────────────
function NotifBadge({ count, size = 'md' }) {
    if (!count || count <= 0) return null;
    const label = count > 9 ? '9+' : String(count);
    const sizeCls = size === 'sm'
        ? 'text-[9px] min-w-[1.1rem] h-[1.1rem] px-1'
        : 'text-[10px] min-w-[1.25rem] h-[1.25rem] px-1.5';
    return (
        <span className={`relative inline-flex items-center justify-center ${sizeCls} rounded-full font-extrabold text-white bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm ring-2 ring-rose-400/30 select-none`}>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400 ring-1 ring-white/60" />
            </span>
            {label}
        </span>
    );
}

// ── Delete Channel Confirmation Modal ────────────────────────────────────────
function DeleteChannelModal({ channel, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-full max-w-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Delete Channel</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            This will remove <span className="font-semibold text-slate-700 dark:text-slate-200">#{channel.name}</span> and all its messages.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                    <button type="button" onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm}
                        className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 transition-all shadow-sm">
                        Delete Channel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Email Chat Modal ─────────────────────────────────────────────────────────
function EmailChatModal({ isOpen, onClose, channelTitle, teamMembers, onSendEmail, sendingEmail }) {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [sentSuccess, setSentSuccess] = useState(false);

    const handleSelectMember = (e) => {
        const id = e.target.value;
        setSelectedMemberId(id);
        const member = teamMembers.find(m => String(m.id) === String(id));
        if (member && member.email) {
            setRecipientEmail(member.email);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recipientEmail) return;
        const ok = await onSendEmail(recipientEmail, customNote);
        if (ok) {
            setSentSuccess(true);
            setTimeout(() => {
                setSentSuccess(false);
                setRecipientEmail('');
                setCustomNote('');
                setSelectedMemberId('');
                onClose();
            }, 1800);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Email Chat Notification</h3>
                            <p className="text-[11px] text-slate-400">Send an email alert for {channelTitle}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {sentSuccess ? (
                    <div className="py-8 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                            <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Email Sent Successfully!</p>
                        <p className="text-xs text-slate-400">Recipient will receive the message notification in their inbox.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {teamMembers.length > 0 && (
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Team Member</label>
                                <select value={selectedMemberId} onChange={handleSelectMember}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand">
                                    <option value="">-- Choose team member or type below --</option>
                                    {teamMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.email || 'No email'})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Recipient Email Address *</label>
                            <input type="email" required value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                                placeholder="developer@studio.io"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand" />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Custom Note / Context (Optional)</label>
                            <textarea rows={3} value={customNote} onChange={e => setCustomNote(e.target.value)}
                                placeholder="Add a note or message context for this email..."
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand resize-none" />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button type="button" onClick={onClose}
                                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={!recipientEmail.trim() || sendingEmail}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand to-indigo-600 text-white hover:from-brand-dark hover:to-indigo-700 transition-all shadow-sm disabled:opacity-40">
                                {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                <span>Send Email</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

// ── Forward Message Modal ───────────────────────────────────────────────────
function ForwardMessageModal({ isOpen, onClose, message, channels, teamMembers, currentUserId, onForward, forwarding }) {
    const [selectedTarget, setSelectedTarget] = useState('');
    const [targetType, setTargetType] = useState('channel');

    if (!isOpen || !message) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedTarget) return;
        const targetTitle = targetType === 'channel'
            ? (channels.find(c => c.id === selectedTarget)?.name ? `#${channels.find(c => c.id === selectedTarget).name}` : selectedTarget)
            : (teamMembers.find(m => getDmChannelId(currentUserId, m.id) === selectedTarget)?.name || 'Direct Chat');
        onForward(selectedTarget, targetTitle);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                            <Forward className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Forward Message</h3>
                            <p className="text-[11px] text-slate-400">Share this message to another channel or direct message</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Message preview snippet */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] mb-1">{message.sender}:</p>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-3 italic">"{message.text || '[Attachment / Photo]'}"</p>
                    {message.attachments?.length > 0 && (
                        <p className="text-[10px] text-brand font-semibold mt-1">📎 {message.attachments.length} attachment(s) included</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Destination</label>
                        <select
                            value={selectedTarget}
                            onChange={(e) => {
                                setSelectedTarget(e.target.value);
                                setTargetType(e.target.selectedOptions[0]?.dataset?.type || 'channel');
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand">
                            <option value="">-- Choose Channel or Teammate --</option>
                            <optgroup label="Channels">
                                {channels.map(ch => (
                                    <option key={ch.id} value={ch.id} data-type="channel">#{ch.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Direct Messages">
                                {teamMembers.filter(m => Number(m.id) !== Number(currentUserId)).map(m => (
                                    <option key={m.id} value={getDmChannelId(currentUserId, m.id)} data-type="dm">{m.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={!selectedTarget || forwarding}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand hover:bg-brand-dark text-white transition-all shadow-sm disabled:opacity-40">
                            {forwarding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Forward className="w-3.5 h-3.5" />}
                            <span>Forward</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Pinned Messages Drawer ───────────────────────────────────────────────────
function PinnedDrawer({ isOpen, onClose, pinnedMessages, onJumpToMessage, onUnpin }) {
    if (!isOpen) return null;

    return (
        <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/50 flex flex-col gap-2 shrink-0 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                    <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Pinned Messages ({pinnedMessages.length})</span>
                </div>
                <button type="button" onClick={onClose} className="p-0.5 rounded text-amber-700 dark:text-amber-300 hover:text-amber-900">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pinnedMessages.length === 0 ? (
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 italic">No pinned messages in this channel.</p>
                ) : (
                    pinnedMessages.map(pm => (
                        <div key={pm.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/40 text-xs">
                            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onJumpToMessage(pm.id)}>
                                <span className="font-bold text-slate-800 dark:text-slate-200 mr-1.5">{pm.sender}:</span>
                                <span className="text-slate-600 dark:text-slate-400 truncate">{pm.text || '[Attachment]'}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button type="button" onClick={() => onJumpToMessage(pm.id)} title="Jump to message"
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200">
                                    Jump
                                </button>
                                <button type="button" onClick={() => onUnpin(pm)} title="Unpin message"
                                    className="p-1 rounded text-slate-400 hover:text-rose-500">
                                    <PinOff className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ── Unsend Message Modal (Everyone vs For Me) ────────────────────────────────
function UnsendModal({ isOpen, onClose, message, onConfirmUnsend, currentUserId }) {
    if (!isOpen || !message) return null;

    const isAuthor = Boolean(
        message.isSelf ||
        (currentUserId && Number(message.user_id) === Number(currentUserId))
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {isAuthor ? 'Unsend Message' : 'Unsend for You'}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                {isAuthor ? 'Choose who to unsend this message for' : 'Remove this message from your personal chat view'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Message preview */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{message.sender}</span>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                        "{message.text || (message.attachments?.length > 0 ? '[Attachment]' : 'Message')}"
                    </p>
                </div>

                {/* Options / Action */}
                {isAuthor && !message.is_unsent ? (
                    <div className="space-y-2 pt-1">
                        {/* Option 1: Unsend for everyone */}
                        <button
                            type="button"
                            onClick={() => onConfirmUnsend('everyone')}
                            className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-100 text-left transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                    Unsend for Everyone
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                                    All Members
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                                Replaces this message with an unsent notice for everyone in this chat. Content and attachments will be permanently removed.
                            </p>
                        </button>

                        {/* Option 2: Unsend for you */}
                        <button
                            type="button"
                            onClick={() => onConfirmUnsend('for_me')}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-all text-slate-900 dark:text-slate-100 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    Unsend for You (Delete for me)
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    Your View Only
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                                Hides this message from your chat only. Other participants in the channel or DM will still be able to see it.
                            </p>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 pt-1">
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                                <span className="flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    Unsend for you only
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    Your View Only
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                {!isAuthor
                                    ? 'You cannot unsend another member\'s message for everyone. This will remove the message from your chat only; other participants will still see it.'
                                    : 'This message has already been unsent for everyone. You can remove it from your chat view.'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    {(!isAuthor || message.is_unsent) && (
                        <button
                            type="button"
                            onClick={() => onConfirmUnsend('for_me')}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 transition-all shadow-sm flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" />
                            Unsend for You
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Channel Assets Drawer (Media, Files, Links, Pinned) ──────────────────────
function ChannelAssetsDrawer({ isOpen, onClose, channelTitle, assets, loading, onOpenImage, pinnedMessages = [], onJumpToMessage, onUnpin }) {
    const [tab, setTab] = useState('media');
    const [query, setQuery] = useState('');

    if (!isOpen) return null;

    const mediaList = assets?.media || [];
    const filesList = assets?.files || [];
    const linksList = assets?.links || [];
    const pinnedList = (assets?.pinned && assets.pinned.length > 0) ? assets.pinned : pinnedMessages;

    const filteredMedia = mediaList.filter(m => !query || (m.name && m.name.toLowerCase().includes(query.toLowerCase())) || (m.sender && m.sender.toLowerCase().includes(query.toLowerCase())));
    const filteredFiles = filesList.filter(f => !query || (f.name && f.name.toLowerCase().includes(query.toLowerCase())) || (f.sender && f.sender.toLowerCase().includes(query.toLowerCase())));
    const filteredLinks = linksList.filter(l => !query || (l.url && l.url.toLowerCase().includes(query.toLowerCase())) || (l.domain && l.domain.toLowerCase().includes(query.toLowerCase())) || (l.sender && l.sender.toLowerCase().includes(query.toLowerCase())));
    const filteredPinned = pinnedList.filter(p => !query || (p.text && p.text.toLowerCase().includes(query.toLowerCase())) || (p.sender && p.sender.toLowerCase().includes(query.toLowerCase())));

    return (
        <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-brand" />
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Channel Assets</h4>
                        <p className="text-[10px] text-slate-400 truncate max-w-[170px]">{channelTitle}</p>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search media, files, links, pinned…"
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 p-1.5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 gap-1 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setTab('media')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${tab === 'media' ? 'bg-white dark:bg-slate-800 text-brand shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                    <ImageIcon className="w-3 h-3" />
                    <span>Media ({mediaList.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setTab('files')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${tab === 'files' ? 'bg-white dark:bg-slate-800 text-brand shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                    <FileText className="w-3 h-3" />
                    <span>Files ({filesList.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setTab('links')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${tab === 'links' ? 'bg-white dark:bg-slate-800 text-brand shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                    <Link2 className="w-3 h-3" />
                    <span>Links ({linksList.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setTab('pinned')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${tab === 'pinned' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                    <Pin className="w-3 h-3 text-amber-500" />
                    <span>Pinned ({pinnedList.length})</span>
                </button>
            </div>

            {/* Tab Contents */}
            <div className={`${SCROLL_CLS} flex-1 p-3 space-y-2`}>
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                        <Loader2 className="w-5 h-5 animate-spin text-brand" />
                        <span>Loading shared assets…</span>
                    </div>
                ) : tab === 'media' ? (
                    filteredMedia.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                            <ImageIcon className="w-8 h-8 mx-auto opacity-30" />
                            <p className="font-semibold">No media photos found</p>
                            <p className="text-[10px]">Images sent in this chat appear here</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {filteredMedia.map((m, idx) => (
                                <div key={idx}
                                    onClick={() => onOpenImage(m)}
                                    className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                    <img src={m.url} alt={m.name || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-1.5 opacity-0 group-hover:opacity-100">
                                        <p className="text-[9px] text-white truncate font-medium">{m.sender || 'Photo'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : tab === 'files' ? (
                    filteredFiles.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                            <FileText className="w-8 h-8 mx-auto opacity-30" />
                            <p className="font-semibold">No documents or files</p>
                            <p className="text-[10px]">PDFs, code & files sent in chat show up here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredFiles.map((f, idx) => {
                                const ext = (f.extension || f.name?.split('.').pop() || 'FILE').toUpperCase();
                                return (
                                    <a key={idx} href={f.url} download={f.name} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-xs group">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                                            {ext.slice(0, 4)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{f.name}</p>
                                            <p className="text-[10px] text-slate-400">{formatBytes(f.size)} • {f.sender}</p>
                                        </div>
                                        <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand shrink-0" />
                                    </a>
                                );
                            })}
                        </div>
                    )
                ) : tab === 'links' ? (
                    filteredLinks.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                            <Link2 className="w-8 h-8 mx-auto opacity-30" />
                            <p className="font-semibold">No links detected</p>
                            <p className="text-[10px]">Web links sent in chat appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredLinks.map((l, idx) => (
                                <a key={idx} href={l.url} target="_blank" rel="noreferrer"
                                    className="block p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors text-xs group space-y-1">
                                    <div className="flex items-center justify-between gap-1 text-slate-400 text-[10px]">
                                        <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded text-[9px] text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[160px]">{l.domain}</span>
                                        <span className="flex items-center gap-1 group-hover:text-brand">Open <ExternalLink className="w-2.5 h-2.5" /></span>
                                    </div>
                                    <p className="text-brand font-semibold truncate leading-tight">{l.url}</p>
                                    <p className="text-[10px] text-slate-400">Shared by {l.sender} • {l.created_at}</p>
                                </a>
                            ))}
                        </div>
                    )
                ) : (
                    filteredPinned.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                            <Pin className="w-8 h-8 mx-auto opacity-30 text-amber-500" />
                            <p className="font-semibold">No pinned messages</p>
                            <p className="text-[10px]">Pinned messages in this channel show up here for all members</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredPinned.map((pm) => (
                                <div key={pm.id} className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{pm.sender}</span>
                                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold">{pm.role || 'Member'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {onJumpToMessage && (
                                                <button type="button" onClick={() => onJumpToMessage(pm.id)} className="text-[10px] text-brand hover:underline font-bold">
                                                    Jump
                                                </button>
                                            )}
                                            {onUnpin && (
                                                <button type="button" onClick={() => onUnpin(pm)} title="Unpin message" className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors">
                                                    <PinOff className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 line-clamp-3 whitespace-pre-wrap leading-relaxed text-[11px]">
                                        {pm.text || (pm.attachments?.length > 0 ? `[${pm.attachments.length} attachment(s)]` : 'Pinned message')}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-amber-200/40 dark:border-amber-800/30">
                                        <span>{pm.time}</span>
                                        <span className="text-amber-700 dark:text-amber-400 font-medium">Pinned for all</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

// ── Image Lightbox Modal with Zoom & Download ────────────────────────────────
function ImageLightboxModal({ isOpen, imageUrl, imageName, onClose }) {
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        setZoom(1);
    }, [imageUrl]);

    if (!isOpen || !imageUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 select-none"
            onClick={onClose}>
            <div className="relative max-w-5xl max-h-[92vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                {/* Controls Bar */}
                <div className="w-full flex items-center justify-between pb-3 text-white px-2">
                    <div className="flex items-center gap-2 max-w-sm truncate text-xs font-semibold">
                        <ImageIcon className="w-4 h-4 text-brand-400 shrink-0" />
                        <span className="truncate">{imageName || 'Photo Preview'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Zoom Out"
                            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold px-2.5">
                            -
                        </button>
                        <span className="text-[11px] text-slate-300 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                        <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Zoom In"
                            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold px-2.5">
                            +
                        </button>
                        <a href={imageUrl} download={imageName || 'image.png'} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-bold transition-all shadow-sm ml-2">
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                        </a>
                        <button type="button" onClick={onClose}
                            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors ml-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scaled Image Viewport */}
                <div className="overflow-auto max-h-[80vh] flex items-center justify-center p-2 rounded-2xl bg-black/40">
                    <img src={imageUrl} alt={imageName || 'Attachment'}
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
                        className="max-h-[76vh] max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10" />
                </div>
            </div>
        </div>
    );
}

// ── Scrollbar utility class string ───────────────────────────────────────────
const SCROLL_CLS = `overflow-y-auto
    [&::-webkit-scrollbar]:w-1.5
    [&::-webkit-scrollbar-track]:rounded-full
    [&::-webkit-scrollbar-track]:bg-slate-100
    dark:[&::-webkit-scrollbar-track]:bg-slate-800/60
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb]:bg-brand/40
    hover:[&::-webkit-scrollbar-thumb]:bg-brand/70
    [scrollbar-width:thin]`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDmChannelId(userAId, userBId) {
    const a = Number(userAId);
    const b = Number(userBId);
    if (!isNaN(a) && !isNaN(b)) {
        return `dm-${Math.min(a, b)}_${Math.max(a, b)}`;
    }
    return `dm-${userAId}_${userBId}`;
}

function buildApiUrl(workspace, channelId, afterId = null) {
    const base = `/studio/${workspace}/channels/${channelId}/messages`;
    return afterId ? `${base}?after_id=${afterId}` : base;
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function renderFormattedText(text, isSelf) {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_\.\-]+)/g);
    return parts.map((part, idx) => {
        if (part.startsWith('@')) {
            return (
                <span key={idx}
                    className={`inline-flex items-center px-1.5 py-0.2 rounded font-bold text-[11px] ${
                        isSelf
                            ? 'bg-white/20 text-white ring-1 ring-white/30'
                            : 'bg-brand/10 text-brand dark:bg-brand/25 dark:text-brand-300 ring-1 ring-brand/30'
                    }`}>
                    {part}
                </span>
            );
        }
        return part;
    });
}

export default function Inbox({
    studio,
    notifications: initialNotifications = [],
    myTasks = [],
    teamMembers = [],
    pendingEstimatesCount = 0,
}) {
    const { auth, activeWorkspace, canManage = false } = usePage().props;
    const currentUser = auth?.user;
    const isLeader = Boolean(canManage);
    const workspaceSlug = studio?.id || activeWorkspace || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : 'indiecraft-studios');

    // ── TABS ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('notifications');

    // ── NOTIFICATIONS ────────────────────────────────────────────────────────
    const [notificationsList, setNotificationsList] = useState(initialNotifications);
    const [notifFilter, setNotifFilter] = useState('all');
    const [notifSearch, setNotifSearch] = useState('');
    const [selectedNotifId, setSelectedNotifId] = useState(
        () => initialNotifications.length > 0 ? initialNotifications[0].id : null
    );
    const [selectedTask, setSelectedTask] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [quickReplyText, setQuickReplyText] = useState('');
    const [quickReplySuccess, setQuickReplySuccess] = useState(false);

    const unreadCount = useMemo(() => notificationsList.filter(n => !n.read).length, [notificationsList]);

    const markAsRead = (id) => setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const markAllAsRead = () => setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));

    const filteredNotifications = useMemo(() => notificationsList.filter(item => {
        const matchesSearch = notifSearch === '' ||
            item.title.toLowerCase().includes(notifSearch.toLowerCase()) ||
            item.body.toLowerCase().includes(notifSearch.toLowerCase()) ||
            (item.project_name && item.project_name.toLowerCase().includes(notifSearch.toLowerCase()));
        let matchesFilter = true;
        if (notifFilter === 'unread') matchesFilter = !item.read;
        else if (notifFilter === 'messages') matchesFilter = item.type === 'direct_message' || item.type === 'channel_mention';
        else if (notifFilter === 'reviews') matchesFilter = item.type === 'review_request';
        else if (notifFilter === 'assignments') matchesFilter = item.type === 'task_assigned';
        else if (notifFilter === 'alerts') matchesFilter = item.type === 'overdue' || item.type === 'stuck';
        return matchesSearch && matchesFilter;
    }), [notificationsList, notifSearch, notifFilter]);

    const activeNotification = useMemo(
        () => notificationsList.find(n => n.id === selectedNotifId) || filteredNotifications[0] || null,
        [notificationsList, selectedNotifId, filteredNotifications]
    );

    const activeTask = useMemo(() => {
        if (!activeNotification?.task_id) return null;
        return myTasks.find(t => t.id === activeNotification.task_id) || activeNotification.task || null;
    }, [activeNotification, myTasks]);

    // ── CHANNELS STATE ───────────────────────────────────────────────────────
    const [channels, setChannels] = useState(DEFAULT_CHANNELS);
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelDesc, setNewChannelDesc] = useState('');
    const [channelToDelete, setChannelToDelete] = useState(null);

    const [selectedChat, setSelectedChat] = useState({
        id: 'ch-general',
        title: '#general',
        subtitle: 'Studio-wide announcements & discussion',
        type: 'channel',
    });

    // ── MESSAGES STATE ───────────────────────────────────────────────────────
    const [messages, setMessages] = useState([]);
    const [lastId, setLastId] = useState(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [inputMessage, setInputMessage] = useState('');

    // Attachments, Drag-and-Drop, Mentions & Email State
    const [stagedFiles, setStagedFiles] = useState([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [mentionQuery, setMentionQuery] = useState(null);
    const [mentionCursorPos, setMentionCursorPos] = useState(0);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Reply, Forward, Pin, Copy & Assets State
    const [replyingTo, setReplyingTo] = useState(null);
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [showAssetsPanel, setShowAssetsPanel] = useState(false);
    const [assetsData, setAssetsData] = useState({ media: [], files: [], links: [] });
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [copiedMsgId, setCopiedMsgId] = useState(null);
    const [highlightedMsgId, setHighlightedMsgId] = useState(null);
    const [channelActivity, setChannelActivity] = useState({});
    const [unsendTarget, setUnsendTarget] = useState(null);

    // Refs
    const fileInputRef = useRef(null);
    const photoInputRef = useRef(null);
    const chatEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const pollingRef = useRef(null);

    const pinnedMessages = useMemo(() => messages.filter(m => m.is_pinned && !m.is_unsent), [messages]);

    // Sort team members: members with active conversations are above all other direct messages
    const sortedTeamMembers = useMemo(() => {
        return [...teamMembers].sort((a, b) => {
            const aDmId = getDmChannelId(currentUser?.id, a.id);
            const bDmId = getDmChannelId(currentUser?.id, b.id);

            const aAct = channelActivity[aDmId];
            const bAct = channelActivity[bDmId];

            const aIsCurrentWithMsgs = selectedChat?.id === aDmId && messages.length > 0;
            const bIsCurrentWithMsgs = selectedChat?.id === bDmId && messages.length > 0;

            const aHasMsgs = Boolean(a.has_conversation || aAct || aIsCurrentWithMsgs || (unreadCounts[aDmId] > 0));
            const bHasMsgs = Boolean(b.has_conversation || bAct || bIsCurrentWithMsgs || (unreadCounts[bDmId] > 0));

            if (aHasMsgs && !bHasMsgs) return -1;
            if (!aHasMsgs && bHasMsgs) return 1;

            const aTime = aAct?.latest_message?.raw_time || a.last_message_at || 0;
            const bTime = bAct?.latest_message?.raw_time || b.last_message_at || 0;

            if (aTime && bTime) {
                return new Date(bTime) - new Date(aTime);
            }
            if (aTime) return -1;
            if (bTime) return 1;

            return a.name.localeCompare(b.name);
        });
    }, [teamMembers, currentUser, channelActivity, selectedChat, messages, unreadCounts]);

    // ── Poll channel activity & unread counts across all channels & DMs ───────
    const pollActivity = useCallback(async () => {
        if (!workspaceSlug) return;
        try {
            const res = await axios.get(`/studio/${workspaceSlug}/channels-activity`);
            if (res.data?.unread_counts) {
                setUnreadCounts(res.data.unread_counts);
            }
            if (res.data?.activity) {
                setChannelActivity(res.data.activity);
            }
            if (res.data?.notifications && Array.isArray(res.data.notifications)) {
                setNotificationsList(prev => {
                    const map = new Map(prev.map(n => [n.id, n]));
                    res.data.notifications.forEach(n => {
                        if (!map.has(n.id)) {
                            map.set(n.id, n);
                        }
                    });
                    return Array.from(map.values()).sort((a, b) => (b.id > a.id ? 1 : -1));
                });
            }
        } catch {
            // ignore activity poll error
        }
    }, [workspaceSlug]);

    useEffect(() => {
        pollActivity();
        const interval = setInterval(pollActivity, 3500);
        return () => clearInterval(interval);
    }, [pollActivity]);

    // ── Load messages when channel changes ───────────────────────────────────
    const loadMessages = useCallback(async (channelId, reset = false) => {
        if (!workspaceSlug || !channelId) return;
        if (reset) setLoadingMessages(true);
        try {
            const url = buildApiUrl(workspaceSlug, channelId);
            const res = await axios.get(url);
            setMessages(res.data.messages ?? []);
            setLastId(res.data.last_id ?? null);
        } catch (err) {
            console.error('Failed to load channel messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    }, [workspaceSlug]);

    // Poll for new messages only (after_id incremental fetch)
    const pollMessages = useCallback(async () => {
        if (!workspaceSlug || !selectedChat.id) return;
        try {
            const url = buildApiUrl(workspaceSlug, selectedChat.id, lastId);
            const res = await axios.get(url);
            const incoming = res.data.messages ?? [];
            if (incoming.length > 0) {
                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newItems = incoming.filter(m => !existingIds.has(m.id));
                    return newItems.length > 0 ? [...prev, ...newItems] : prev;
                });
                setLastId(res.data.last_id ?? lastId);
            }
        } catch {
            // polling failure — ignore
        }
    }, [workspaceSlug, selectedChat.id, lastId]);

    // On channel switch: load fresh and reset active states
    useEffect(() => {
        setMessages([]);
        setLastId(null);
        setReplyingTo(null);
        setShowPinnedDrawer(false);
        setShowAssetsPanel(false);
        setUnreadCounts(prev => ({ ...prev, [selectedChat.id]: 0 }));
        loadMessages(selectedChat.id, true);
    }, [selectedChat.id]);

    // Start polling (3s interval) while messages tab is open
    useEffect(() => {
        if (activeTab !== 'messages') {
            clearInterval(pollingRef.current);
            return;
        }
        pollingRef.current = setInterval(() => {
            pollMessages();
        }, 3000);
        return () => clearInterval(pollingRef.current);
    }, [activeTab, pollMessages]);

    // Auto-scroll to bottom on new message
    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distFromBottom < 150) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleChatScroll = () => {
        const el = chatContainerRef.current;
        if (!el) return;
        setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
    };

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // ── Load Channel Shared Assets ───────────────────────────────────────────
    const loadAssets = useCallback(async (channelId) => {
        if (!workspaceSlug || !channelId) return;
        setLoadingAssets(true);
        try {
            const res = await axios.get(`/studio/${workspaceSlug}/channels/${channelId}/assets`);
            setAssetsData(res.data || { media: [], files: [], links: [], pinned: [] });
        } catch {
            const media = [];
            const files = [];
            const links = [];
            const pinned = [];
            messages.forEach(m => {
                if (m.is_pinned) pinned.push(m);
                (m.attachments || []).forEach(att => {
                    if (att.type === 'image') media.push({ ...att, sender: m.sender });
                    else files.push({ ...att, sender: m.sender });
                });
                if (m.text) {
                    const urls = m.text.match(/https?:\/\/[^\s<]+/g) || [];
                    urls.forEach(u => links.push({ url: u, domain: 'link', sender: m.sender }));
                }
            });
            setAssetsData({ media, files, links, pinned });
        } finally {
            setLoadingAssets(false);
        }
    }, [workspaceSlug, messages]);

    const toggleAssetsPanel = () => {
        if (!showAssetsPanel) {
            loadAssets(selectedChat.id);
        }
        setShowAssetsPanel(v => !v);
    };

    // ── Message Actions: Reply, Copy, Pin, Unsend, Forward ───────────────────
    const handleReply = (msg) => {
        setReplyingTo(msg);
    };

    const handleCopy = (msg) => {
        const textToCopy = msg.text || (msg.attachments?.[0]?.url ? window.location.origin + msg.attachments[0].url : '');
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopiedMsgId(msg.id);
        setTimeout(() => setCopiedMsgId(null), 1500);
    };

    const handleTogglePin = async (msg) => {
        try {
            const res = await axios.post(`/studio/${workspaceSlug}/channels/${selectedChat.id}/messages/${msg.id}/pin`);
            const updated = res.data?.message;
            if (updated) {
                setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, is_pinned: updated.is_pinned } : m));
                setAssetsData(prev => {
                    const currentPinned = prev?.pinned || [];
                    if (updated.is_pinned) {
                        return { ...prev, pinned: [updated, ...currentPinned.filter(p => p.id !== updated.id)] };
                    } else {
                        return { ...prev, pinned: currentPinned.filter(p => p.id !== updated.id) };
                    }
                });
            }
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const handleRequestUnsend = (msg) => {
        setUnsendTarget(msg);
    };

    const handleConfirmUnsend = async (scope) => {
        if (!unsendTarget) return;
        const targetId = unsendTarget.id;
        try {
            const res = await axios.delete(`/studio/${workspaceSlug}/channels/${selectedChat.id}/messages/${targetId}?scope=${scope}`);
            if (scope === 'everyone') {
                const updatedItem = res.data?.item;
                setMessages(prev => prev.map(m => {
                    if (m.id === targetId) {
                        return updatedItem || {
                            ...m,
                            is_unsent: true,
                            text: 'You unsent a message',
                            attachments: [],
                            mentions: [],
                            reply_to: null,
                            reply_to_id: null,
                            is_pinned: false,
                            forwarded_from: null,
                        };
                    }
                    return m;
                }));
            } else {
                setMessages(prev => prev.filter(m => m.id !== targetId));
            }
            setAssetsData(prev => ({
                ...prev,
                media: (prev.media || []).filter(m => m.message_id !== targetId),
                files: (prev.files || []).filter(f => f.message_id !== targetId),
                links: (prev.links || []).filter(l => l.message_id !== targetId),
                pinned: (prev.pinned || []).filter(p => p.id !== targetId),
            }));
            setUnsendTarget(null);
            pollActivity();
        } catch (err) {
            console.error('Failed to unsend message:', err);
        }
    };

    const handleOpenForward = (msg) => {
        setForwardingMessage(msg);
    };

    const handleConfirmForward = async (targetId, targetTitle) => {
        if (!forwardingMessage || !targetId) return;
        setSending(true);
        try {
            const url = buildApiUrl(workspaceSlug, targetId);
            const payload = {
                body: forwardingMessage.text || '',
                forwarded_from: {
                    channel_id: selectedChat.id,
                    channel_name: selectedChat.title,
                    sender: forwardingMessage.sender,
                },
            };
            await axios.post(url, payload);
            setForwardingMessage(null);
            pollActivity();
        } catch (err) {
            console.error('Failed to forward message:', err);
        } finally {
            setSending(false);
        }
    };

    const jumpToMessage = (msgId) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMsgId(msgId);
            setTimeout(() => setHighlightedMsgId(null), 2200);
        }
    };

    // ── Channel create/delete ────────────────────────────────────────────────
    const handleCreateChannel = (e) => {
        e?.preventDefault();
        const slug = newChannelName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!slug) return;
        const id = `ch-custom-${Date.now()}`;
        const ch = { id, name: slug, description: newChannelDesc.trim() || 'Team channel' };
        setChannels(prev => [...prev, ch]);
        setSelectedChat({ id, title: `#${slug}`, subtitle: ch.description, type: 'channel' });
        setNewChannelName('');
        setNewChannelDesc('');
        setShowCreateChannel(false);
    };

    const handleConfirmDelete = () => {
        if (!channelToDelete) return;
        const { id } = channelToDelete;
        setChannels(prev => prev.filter(c => c.id !== id));
        if (selectedChat.id === id) {
            setSelectedChat({ id: 'ch-general', title: '#general', subtitle: DEFAULT_CHANNELS[0].description, type: 'channel' });
        }
        setChannelToDelete(null);
    };

    // ── Mentions Input Handler ───────────────────────────────────────────────
    const handleInputChange = (e) => {
        const text = e.target.value;
        const pos = e.target.selectionStart;
        setInputMessage(text);
        setMentionCursorPos(pos);

        const textBeforeCursor = text.slice(0, pos);
        const match = textBeforeCursor.match(/@([a-zA-Z0-9_\s]*)$/);
        if (match && !match[1].includes('\n')) {
            setMentionQuery(match[1]);
        } else {
            setMentionQuery(null);
        }
    };

    const handleSelectMention = (member) => {
        const textBeforeCursor = inputMessage.slice(0, mentionCursorPos);
        const textAfterCursor = inputMessage.slice(mentionCursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        if (atIndex !== -1) {
            const newText = textBeforeCursor.slice(0, atIndex) + `@${member.name} ` + textAfterCursor;
            setInputMessage(newText);
        }
        setMentionQuery(null);
    };

    const filteredMentionMembers = useMemo(() => {
        if (mentionQuery === null) return [];
        const q = mentionQuery.toLowerCase();
        return teamMembers.filter(m =>
            m.name.toLowerCase().includes(q) || (m.role && m.role.toLowerCase().includes(q))
        ).slice(0, 5);
    }, [mentionQuery, teamMembers]);

    // ── File & Photo Staging, Drag & Drop, Clipboard Paste ───────────────────
    const stageIncomingFiles = (files) => {
        const newStaged = files.map(file => {
            const isImage = file.type.startsWith('image/');
            return {
                file,
                name: file.name || (isImage ? `photo_${Date.now()}.png` : `file_${Date.now()}`),
                size: file.size,
                type: isImage ? 'image' : 'file',
                previewUrl: isImage ? URL.createObjectURL(file) : null,
            };
        });
        setStagedFiles(prev => [...prev, ...newStaged]);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        stageIncomingFiles(files);
        e.target.value = '';
    };

    const removeStagedFile = (index) => {
        setStagedFiles(prev => {
            const copy = [...prev];
            if (copy[index]?.previewUrl) URL.revokeObjectURL(copy[index].previewUrl);
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            stageIncomingFiles(files);
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const pastedFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }
        if (pastedFiles.length > 0) {
            stageIncomingFiles(pastedFiles);
        }
    };

    // ── Send message (with optional reply_to_id) ─────────────────────────────
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const body = inputMessage.trim();
        const hasFiles = stagedFiles.length > 0;
        if ((!body && !hasFiles) || sending) return;

        setInputMessage('');
        const currentStaged = [...stagedFiles];
        const currentReply = replyingTo;
        setStagedFiles([]);
        setReplyingTo(null);
        setMentionQuery(null);
        setSending(true);

        try {
            const url = buildApiUrl(workspaceSlug, selectedChat.id);
            let res;

            if (hasFiles) {
                const formData = new FormData();
                if (body) formData.append('body', body);
                if (currentReply?.id) formData.append('reply_to_id', currentReply.id);
                currentStaged.forEach(sf => {
                    formData.append('files[]', sf.file);
                });
                res = await axios.post(url, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                const payload = { body };
                if (currentReply?.id) payload.reply_to_id = currentReply.id;
                res = await axios.post(url, payload);
            }

            const newMsg = res.data.message;
            if (newMsg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                setLastId(newMsg.id);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setInputMessage(body);
            setStagedFiles(currentStaged);
            setReplyingTo(currentReply);
        } finally {
            setSending(false);
        }
    };

    // ── Send Email Chat Notification ─────────────────────────────────────────
    const handleSendEmailNotification = async (recipientEmail, customNote) => {
        setSendingEmail(true);
        try {
            const url = `/studio/${workspaceSlug}/channels/${selectedChat.id}/email`;
            const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            await axios.post(url, {
                recipient_email: recipientEmail,
                message_text: customNote || latestMessage?.text || `Notification from #${selectedChat.title}`,
                message_id: latestMessage?.id ?? null,
            });
            return true;
        } catch (err) {
            console.error('Failed to send email notification:', err);
            return false;
        } finally {
            setSendingEmail(false);
        }
    };

    // ── Jump to chat from notification ───────────────────────────────────────
    const handleOpenNotificationChat = (notif) => {
        if (!notif?.channel_id) return;
        setActiveTab('messages');
        const isDm = notif.channel_id.startsWith('dm-');
        if (isDm) {
            setSelectedChat({
                id: notif.channel_id,
                title: notif.sender_name || 'Direct Message',
                subtitle: 'Direct chat conversation',
                type: 'dm',
            });
        } else {
            const chName = notif.channel_id.startsWith('ch-') ? notif.channel_id.replace('ch-', '') : notif.channel_id;
            setSelectedChat({
                id: notif.channel_id,
                title: `#${chName}`,
                subtitle: 'Channel discussion',
                type: 'channel',
            });
        }
        markAsRead(notif.id);
    };

    // ── Notification handlers ────────────────────────────────────────────────
    const handleSendQuickReply = () => {
        if (!quickReplyText.trim()) return;
        setQuickReplySuccess(true);
        setTimeout(() => { setQuickReplySuccess(false); setQuickReplyText(''); }, 2000);
    };

    const handleOpenTaskDetail = (task) => { if (!task) return; setSelectedTask(task); setDetailModalOpen(true); };
    const handleTaskUpdated = () => { if (activeNotification) markAsRead(activeNotification.id); };

    const iconMap = {
        eye: Eye,
        clipboard: ClipboardList,
        alert: AlertCircle,
        ban: Ban,
        sparkles: Sparkles,
        message: MessageSquare,
        'message-square': MessageSquare,
        mail: Mail,
    };
    const colorMap = {
        blue: { bg: 'bg-blue-50/80 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900/50', icon: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' },
        indigo: { bg: 'bg-indigo-50/80 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-900/50', icon: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' },
        rose: { bg: 'bg-rose-50/80 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-900/50', icon: 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' },
        amber: { bg: 'bg-amber-50/80 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900/50', icon: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' },
        emerald: { bg: 'bg-emerald-50/80 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900/50', icon: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
    };

    return (
        <TenantLayout studioName={studio.name}>
            <Head title="Inbox • SprintStudio" />

            {channelToDelete && (
                <DeleteChannelModal
                    channel={channelToDelete}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setChannelToDelete(null)}
                />
            )}

            <EmailChatModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                channelTitle={selectedChat.title}
                teamMembers={teamMembers}
                onSendEmail={handleSendEmailNotification}
                sendingEmail={sendingEmail}
            />

            <ImageLightboxModal
                isOpen={Boolean(lightboxImage)}
                imageUrl={lightboxImage?.url}
                imageName={lightboxImage?.name}
                onClose={() => setLightboxImage(null)}
            />

            <ForwardMessageModal
                isOpen={Boolean(forwardingMessage)}
                onClose={() => setForwardingMessage(null)}
                message={forwardingMessage}
                channels={channels}
                teamMembers={teamMembers}
                currentUserId={currentUser?.id}
                onForward={handleConfirmForward}
                forwarding={sending}
            />

            <div className="flex flex-col min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100">

                {/* ── Top Header ── */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-2xs">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand to-indigo-600 text-white shadow-md shadow-brand/20">
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5">
                                            <NotifBadge count={unreadCount} size="sm" />
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Inbox</h1>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Live Feed
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                        Personal notifications, team chat rooms, files & mentions
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Navigation Tabs */}
                                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('notifications')}
                                        className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'notifications' ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                        <Bell className="w-3.5 h-3.5" />
                                        <span>Notifications</span>
                                        {unreadCount > 0 && <NotifBadge count={unreadCount} size="sm" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('messages')}
                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'messages' ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Team Messages</span>
                                    </button>
                                </div>

                                {activeTab === 'notifications' && unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllAsRead}
                                        className="text-xs font-semibold text-slate-500 hover:text-brand dark:text-slate-400 transition-colors">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main View Area ── */}
                <div className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 flex flex-col">

                    {/* ================================================================
                        NOTIFICATIONS TAB
                    ================================================================ */}
                    {activeTab === 'notifications' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 items-start">
                            {/* Left — Feed */}
                            <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden h-full max-h-[calc(100vh-180px)]">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={notifSearch}
                                            onChange={e => setNotifSearch(e.target.value)}
                                            placeholder="Search notifications..."
                                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                                        {[
                                            { id: 'all', label: 'All' },
                                            { id: 'unread', label: `Unread (${unreadCount})` },
                                            { id: 'messages', label: 'Messages & Mentions' },
                                            { id: 'reviews', label: 'Reviews' },
                                            { id: 'assignments', label: 'Assigned' },
                                            { id: 'alerts', label: 'Alerts' },
                                        ].map(f => (
                                            <button key={f.id} type="button" onClick={() => setNotifFilter(f.id)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${notifFilter === f.id ? 'bg-brand text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}`}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
                                    {filteredNotifications.length === 0 ? (
                                        <div className="py-20 px-6 text-center flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><MailOpen className="w-6 h-6" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No notifications found</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{notifFilter !== 'all' || notifSearch ? 'Try adjusting your filters' : 'You are completely caught up!'}</p>
                                            </div>
                                        </div>
                                    ) : filteredNotifications.map(notif => {
                                        const NIcon = iconMap[notif.icon] || Bell;
                                        const c = colorMap[notif.color] || colorMap.indigo;
                                        const isSelected = selectedNotifId === notif.id;
                                        const isChatNotif = notif.type === 'direct_message' || notif.type === 'channel_mention';

                                        return (
                                            <div key={notif.id}
                                                onClick={() => {
                                                    setSelectedNotifId(notif.id);
                                                    markAsRead(notif.id);
                                                }}
                                                className={`p-4 cursor-pointer transition-all border-l-3 relative flex items-start gap-3.5 ${isSelected ? 'bg-brand/5 dark:bg-brand/10 border-l-brand' : !notif.read ? `${c.bg} border-l-rose-500 hover:brightness-95` : 'bg-white dark:bg-slate-900 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${c.icon}`}>
                                                    <NIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${c.badge} px-2 py-0.2 rounded-md`}>{notif.type.replace('_', ' ')}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{notif.created_at_human}</span>
                                                    </div>
                                                    <h4 className={`text-xs font-bold truncate leading-tight ${!notif.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{notif.title}</h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.body}</p>
                                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                        {notif.project_name && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><FolderGit2 className="w-2.5 h-2.5" />{notif.project_name}</span>}
                                                        {notif.priority && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.badge}`}>{notif.priority}</span>}
                                                        {isChatNotif && (
                                                            <button type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenNotificationChat(notif);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-brand/10 text-brand hover:bg-brand/20 transition-colors">
                                                                <span>Open Chat</span>
                                                                <ArrowRight className="w-2.5 h-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {!notif.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right — Detail */}
                            <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden h-full max-h-[calc(100vh-180px)]">
                                {activeNotification ? (
                                    <div className="flex flex-col h-full overflow-y-auto">
                                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/20">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-brand/10 text-brand">{activeNotification.type.replace('_', ' ')}</span>
                                                        {activeNotification.project_name && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{activeNotification.project_name}</span>}
                                                        {activeNotification.priority && <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">{activeNotification.priority}</span>}
                                                    </div>
                                                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">{activeNotification.title}</h2>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Received {activeNotification.created_at_human}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {activeNotification.channel_id && (
                                                        <button type="button" onClick={() => handleOpenNotificationChat(activeNotification)}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all shadow-xs shrink-0">
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            <span>Open Chat</span>
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {activeTask && (
                                                        <button type="button" onClick={() => handleOpenTaskDetail(activeTask)}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark transition-all shadow-xs shrink-0">
                                                            <span>Open Task</span><ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed shadow-2xs">
                                                {activeNotification.body}
                                            </div>
                                        </div>

                                        {activeNotification.channel_id && (
                                            <div className="p-6 space-y-4">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Chat Thread Action</h3>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            Sender: {activeNotification.sender_name || 'Team Member'}
                                                        </span>
                                                        <span className="text-slate-400 font-medium">
                                                            Room: {activeNotification.channel_id}
                                                        </span>
                                                    </div>
                                                    <button type="button" onClick={() => handleOpenNotificationChat(activeNotification)}
                                                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand to-indigo-600 text-white hover:from-brand-dark hover:to-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span>Jump to Active Chat Room</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTask && (
                                            <div className="p-6 space-y-4">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Associated Task Context</h3>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeTask.title}</h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{activeTask.description || 'No additional description provided.'}</p>
                                                        </div>
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                                                            {(activeTask.sprint_status || activeTask.status || 'todo').replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                                        {[
                                                            { label: 'Assignee', value: activeTask.assignee || 'Unassigned' },
                                                            { label: 'Reviewer', value: activeTask.reviewer || 'None assigned' },
                                                            { label: 'Story Points', value: activeTask.story_points ? `${activeTask.story_points} SP` : 'Unestimated' },
                                                            { label: 'Priority', value: activeTask.priority || 'Normal', cls: 'text-rose-600 dark:text-rose-400 uppercase' },
                                                        ].map(({ label, value, cls }) => (
                                                            <div key={label}>
                                                                <span className="text-[10px] text-slate-400 uppercase font-bold">{label}</span>
                                                                <p className={`text-xs font-bold mt-0.5 truncate ${cls || 'text-slate-800 dark:text-slate-200'}`}>{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap">
                                                        <button type="button" onClick={() => handleOpenTaskDetail(activeTask)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                            <Eye className="w-3.5 h-3.5 text-brand" /><span>Review Full Task</span>
                                                        </button>
                                                        {activeNotification.type === 'estimate_pending' && (
                                                            <Link href={`/studio/${activeWorkspace}/estimates/pending`}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs">
                                                                <Sparkles className="w-3.5 h-3.5" /><span>Vote Story Points Now</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Quick Note or Reply</label>
                                                    <div className="relative">
                                                        <textarea rows={2} value={quickReplyText} onChange={e => setQuickReplyText(e.target.value)}
                                                            placeholder="Add a comment or follow-up note..."
                                                            className="w-full p-3 pr-24 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand resize-none" />
                                                        <button type="button" onClick={handleSendQuickReply} disabled={!quickReplyText.trim()}
                                                            className="absolute right-2 bottom-2.5 px-3 py-1 rounded-lg text-xs font-bold bg-brand text-white disabled:opacity-40 hover:bg-brand-dark transition-all">
                                                            {quickReplySuccess ? 'Saved!' : 'Reply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                        <MailOpen className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Select a notification to view details</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">Choose an item from the left pane to see its full context, assigned task, and actions.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================================================================
                        TEAM MESSAGES TAB
                    ================================================================ */}
                    {activeTab === 'messages' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 items-start">

                            {/* Left — Sidebar */}
                            <div className="lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden h-full max-h-[calc(100vh-180px)]">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Team Messages</h3>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live
                                    </span>
                                </div>

                                <div className={`${SCROLL_CLS} flex-1 p-3 space-y-4`}>

                                    {/* Channels */}
                                    <div>
                                        <div className="flex items-center justify-between px-2 mb-1.5">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Channels</p>
                                            {isLeader && (
                                                <button type="button" onClick={() => setShowCreateChannel(v => !v)} title="Create new channel"
                                                    className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {isLeader && showCreateChannel && (
                                            <form onSubmit={handleCreateChannel}
                                                className="mb-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <input type="text" value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                                                        placeholder="channel-name" maxLength={32} autoFocus
                                                        className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none" />
                                                    <button type="button" onClick={() => setShowCreateChannel(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <input type="text" value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)}
                                                    placeholder="Short description (optional)" maxLength={80}
                                                    className="w-full bg-transparent text-[11px] text-slate-500 dark:text-slate-400 placeholder-slate-400 focus:outline-none" />
                                                <button type="submit" disabled={!newChannelName.trim()}
                                                    className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-brand text-white disabled:opacity-40 hover:bg-brand-dark transition-all">
                                                    Create Channel
                                                </button>
                                            </form>
                                        )}

                                        <div className="space-y-0.5">
                                            {channels.map(ch => {
                                                const isActive = selectedChat.id === ch.id;
                                                const isProtected = PROTECTED_IDS.has(ch.id);
                                                return (
                                                    <div key={ch.id} className="group relative">
                                                        <button type="button"
                                                            onClick={() => setSelectedChat({ id: ch.id, title: `#${ch.name}`, subtitle: ch.description, type: 'channel' })}
                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${isActive ? 'bg-brand text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                            <Hash className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                                            <span className="truncate flex-1">{ch.name}</span>
                                                            {unreadCounts[ch.id] > 0 && selectedChat.id !== ch.id && (
                                                                <NotifBadge count={unreadCounts[ch.id]} size="sm" />
                                                            )}
                                                            {isProtected && <ShieldCheck className={`w-3 h-3 shrink-0 ${isActive ? 'opacity-70' : 'opacity-30'}`} />}
                                                        </button>
                                                        {isLeader && !isProtected && (
                                                            <button type="button" onClick={() => setChannelToDelete(ch)} title={`Delete #${ch.name}`}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Direct Messages */}
                                    <div>
                                        <div className="flex items-center justify-between px-2 mb-1.5">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direct Messages</p>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {sortedTeamMembers.filter(m => m.has_conversation || channelActivity[getDmChannelId(currentUser?.id, m.id)] || (selectedChat.id === getDmChannelId(currentUser?.id, m.id) && messages.length > 0)).length} active
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {sortedTeamMembers.map(member => {
                                                const isCurrentUser = currentUser && Number(member.id) === Number(currentUser.id);
                                                const dmId = getDmChannelId(currentUser?.id, member.id);
                                                const isActive = selectedChat.id === dmId;
                                                const hasConv = Boolean(member.has_conversation || channelActivity[dmId] || (selectedChat.id === dmId && messages.length > 0));
                                                const latestSnippet = channelActivity[dmId]?.latest_message?.body;

                                                return (
                                                    <button key={member.id} type="button"
                                                        onClick={() => setSelectedChat({
                                                            id: dmId,
                                                            title: isCurrentUser ? `${member.name} (You)` : member.name,
                                                            subtitle: `${member.position || 'Developer'} • ${member.role}`,
                                                            type: 'dm',
                                                        })}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${isActive ? 'bg-brand text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                                        <div className="relative shrink-0">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-900 ${hasConv ? 'bg-emerald-500 ring-emerald-300' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="truncate leading-tight">
                                                                    {member.name} {isCurrentUser && <span className="text-[10px] opacity-70 font-normal">(You)</span>}
                                                                </p>
                                                                {hasConv && !isActive && (
                                                                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-90 shrink-0">
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-normal opacity-70 truncate">
                                                                {latestSnippet || member.position || 'Developer'}
                                                            </p>
                                                        </div>
                                                        {unreadCounts[dmId] > 0 && selectedChat.id !== dmId && (
                                                            <NotifBadge count={unreadCounts[dmId]} size="sm" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                            {teamMembers.length === 0 && (
                                                <p className="text-[11px] text-slate-400 px-3 py-2">No team members yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right — Chat window (With Drag-and-Drop & Paste Support) */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onPaste={handlePaste}
                                className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden h-[calc(100vh-180px)] relative">

                                {/* Drag-and-Drop Overlay */}
                                {isDraggingOver && (
                                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-brand/10 dark:bg-brand/20 backdrop-blur-xs border-2 border-dashed border-brand rounded-2xl p-6 pointer-events-none animate-in fade-in duration-100">
                                        <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/30 animate-bounce">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <p className="mt-3 text-sm font-bold text-brand dark:text-brand-300">Drop photos or files to attach</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Files will be staged for sending</p>
                                    </div>
                                )}

                                {/* Chat Header */}
                                <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black text-xs">
                                            {selectedChat.type === 'channel' ? '#' : selectedChat.title.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedChat.title}</h3>
                                            <p className="text-[11px] text-slate-400">{selectedChat.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Pinned Messages Button (Always accessible to all users) */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPinnedDrawer(v => !v)}
                                            title="View Pinned Messages"
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shadow-2xs border ${
                                                showPinnedDrawer
                                                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                                                    : pinnedMessages.length > 0
                                                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}>
                                            <Pin className={`w-3.5 h-3.5 ${pinnedMessages.length > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                                            <span className="hidden sm:inline">Pinned {pinnedMessages.length > 0 ? `(${pinnedMessages.length})` : ''}</span>
                                        </button>

                                        {/* Channel Shared Assets Button */}
                                        <button
                                            type="button"
                                            onClick={toggleAssetsPanel}
                                            title="View Medias, Files, Links & Pinned"
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shadow-2xs border ${
                                                showAssetsPanel
                                                    ? 'bg-brand text-white border-brand'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}>
                                            <FolderOpen className="w-3.5 h-3.5 text-brand" />
                                            <span className="hidden sm:inline">Assets</span>
                                        </button>

                                        {/* Email Thread Button */}
                                        <button
                                            type="button"
                                            onClick={() => setEmailModalOpen(true)}
                                            title="Email notification / thread copy"
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all shadow-2xs">
                                            <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="hidden sm:inline">Email Thread</span>
                                        </button>

                                        {selectedChat.type === 'channel' && PROTECTED_IDS.has(selectedChat.id) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                <ShieldCheck className="w-3 h-3" />Default
                                            </span>
                                        )}
                                        {/* Live poll indicator */}
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Live
                                        </span>
                                    </div>
                                </div>

                                {/* Pinned Messages Drawer */}
                                <PinnedDrawer
                                    isOpen={showPinnedDrawer}
                                    onClose={() => setShowPinnedDrawer(false)}
                                    pinnedMessages={pinnedMessages}
                                    onJumpToMessage={jumpToMessage}
                                    onUnpin={handleTogglePin}
                                />

                                {/* Channel Assets Slide-over Drawer (Includes Pinned) */}
                                <ChannelAssetsDrawer
                                    isOpen={showAssetsPanel}
                                    onClose={() => setShowAssetsPanel(false)}
                                    channelTitle={selectedChat.title}
                                    assets={assetsData}
                                    loading={loadingAssets}
                                    onOpenImage={(img) => setLightboxImage({ url: img.url, name: img.name })}
                                    pinnedMessages={pinnedMessages}
                                    onJumpToMessage={(id) => {
                                        setShowAssetsPanel(false);
                                        jumpToMessage(id);
                                    }}
                                    onUnpin={handleTogglePin}
                                />

                                {/* Pinned Messages Channel Banner (visible to all users in the channel) */}
                                {pinnedMessages.length > 0 && (
                                    <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-800/50 px-4 py-2 flex items-center justify-between gap-3 shrink-0 text-xs animate-in slide-in-from-top-1 duration-150">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-5 h-5 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Pin className="w-3 h-3" />
                                            </div>
                                            <div className="min-w-0 flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs">
                                                <span className="font-bold shrink-0 text-amber-900 dark:text-amber-200">Pinned:</span>
                                                <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">{pinnedMessages[pinnedMessages.length - 1].sender}:</span>
                                                <span className="truncate italic text-slate-600 dark:text-slate-300 max-w-[360px]">
                                                    {pinnedMessages[pinnedMessages.length - 1].text || '[Attachment]'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => jumpToMessage(pinnedMessages[pinnedMessages.length - 1].id)}
                                                className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline">
                                                Jump
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowPinnedDrawer(v => !v)}
                                                className="px-2 py-0.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-bold hover:bg-amber-300 transition-colors">
                                                View all ({pinnedMessages.length})
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Messages Feed */}
                                <div ref={chatContainerRef} onScroll={handleChatScroll}
                                    className={`${SCROLL_CLS} flex-1 p-6 space-y-4`}>

                                    {loadingMessages ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin text-brand" />
                                            <span className="text-xs">Loading conversation...</span>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 text-center py-12">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <MessageSquare className="w-6 h-6 opacity-40" />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No messages in this chat yet</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">Say hi to start the conversation!</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, idx) => (
                                                <div
                                                    key={msg.id || idx}
                                                    id={`msg-${msg.id}`}
                                                    className={`flex gap-3 group relative transition-colors duration-500 ${msg.isSelf ? 'flex-row-reverse' : ''}`}
                                                >
                                                    {/* Hover Floating Actions Toolbar */}
                                                    {!msg.is_unsent ? (
                                                        <div className={`absolute -top-3.5 ${msg.isSelf ? 'right-6' : 'left-6'} z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 px-1 py-0.5 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400`}>
                                                            <button type="button" onClick={() => handleReply(msg)} title="Reply to message"
                                                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand transition-colors">
                                                                <CornerUpLeft className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button type="button" onClick={() => handleCopy(msg)} title="Copy message text"
                                                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand transition-colors">
                                                                {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button type="button" onClick={() => handleOpenForward(msg)} title="Forward message"
                                                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand transition-colors">
                                                                <Forward className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button type="button" onClick={() => handleTogglePin(msg)} title={msg.is_pinned ? 'Unpin message' : 'Pin message'}
                                                                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${msg.is_pinned ? 'text-amber-500 font-bold' : 'hover:text-amber-500'}`}>
                                                                {msg.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button type="button" onClick={() => handleRequestUnsend(msg)} title={msg.isSelf ? 'Unsend message' : 'Unsend for you'}
                                                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className={`absolute -top-3.5 ${msg.isSelf ? 'right-6' : 'left-6'} z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 px-1 py-0.5 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400`}>
                                                            <button type="button" onClick={() => handleRequestUnsend(msg)} title="Unsend for you"
                                                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Avatar */}
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xs font-bold shrink-0 text-slate-700 dark:text-slate-300">
                                                        {msg.sender.charAt(0)}
                                                    </div>

                                                    {/* Bubble Container */}
                                                    <div className={`max-w-md space-y-1.5 ${msg.isSelf ? 'items-end' : ''}`}>
                                                        {/* Pinned & Forwarded badges */}
                                                        {msg.is_pinned && !msg.is_unsent && (
                                                            <div className={`flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold ${msg.isSelf ? 'justify-end' : ''}`}>
                                                                <Pin className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                                                <span>Pinned</span>
                                                            </div>
                                                        )}
                                                        {msg.forwarded_from && !msg.is_unsent && (
                                                            <div className={`flex items-center gap-1 text-[10px] text-slate-400 font-medium ${msg.isSelf ? 'justify-end' : ''}`}>
                                                                <Forward className="w-2.5 h-2.5 text-slate-400" />
                                                                <span>Forwarded from {msg.forwarded_from.channel_name || 'chat'}</span>
                                                            </div>
                                                        )}

                                                        <div className={`flex items-baseline gap-2 ${msg.isSelf ? 'justify-end' : ''}`}>
                                                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{msg.sender}</span>
                                                            {msg.role && <span className="text-[10px] text-slate-400 font-normal">({msg.role})</span>}
                                                            <span className="text-[10px] text-slate-400">{msg.time}</span>
                                                        </div>

                                                        {/* If unsent, show elegant placeholder bubble */}
                                                        {msg.is_unsent ? (
                                                            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850/60 text-slate-400 dark:text-slate-500 text-xs italic select-none shadow-2xs ${
                                                                msg.isSelf ? 'rounded-tr-xs' : 'rounded-tl-xs'
                                                            }`}>
                                                                <Ban className="w-3.5 h-3.5 shrink-0 opacity-60 text-slate-400 dark:text-slate-500" />
                                                                <span>
                                                                    {msg.isSelf
                                                                        ? 'You unsent a message'
                                                                        : (msg.text || `${msg.sender} unsent a message`)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Quoted Reply Preview */}
                                                                {msg.reply_to && (
                                                                    <div onClick={() => jumpToMessage(msg.reply_to.id)}
                                                                        className={`p-2 rounded-xl text-[11px] cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 border-l-2 shadow-2xs ${
                                                                            msg.isSelf
                                                                                ? 'bg-white/20 text-white/90 border-white'
                                                                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-brand'
                                                                        }`}>
                                                                        <CornerUpLeft className="w-3 h-3 shrink-0 opacity-70" />
                                                                        <div className="min-w-0">
                                                                            <span className="font-bold mr-1">{msg.reply_to.sender}:</span>
                                                                            <span className="italic truncate">{msg.reply_to.text}</span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Text Bubble */}
                                                                {msg.text && (
                                                                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                                                        msg.is_pinned ? 'ring-1 ring-amber-400/80' : ''
                                                                    } ${msg.isSelf ? 'bg-gradient-to-br from-brand to-indigo-600 text-white rounded-tr-xs shadow-sm shadow-brand/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'}`}>
                                                                        {renderFormattedText(msg.text, msg.isSelf)}
                                                                    </div>
                                                                )}

                                                        {/* Enhanced Attachments & Photos */}
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className={`space-y-2 pt-0.5 ${msg.isSelf ? 'flex flex-col items-end' : ''}`}>
                                                                {msg.attachments.map((att, aIdx) => {
                                                                    if (att.type === 'image') {
                                                                        return (
                                                                            <div key={aIdx} className="space-y-1">
                                                                                <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-sm bg-slate-100 dark:bg-slate-800/80"
                                                                                    onClick={() => setLightboxImage({ url: att.url, name: att.name })}>
                                                                                    <img
                                                                                        src={att.url}
                                                                                        alt={att.name || 'Photo'}
                                                                                        loading="lazy"
                                                                                        className="max-h-64 max-w-xs sm:max-w-sm rounded-2xl object-cover group-hover:scale-101 transition-transform duration-150"
                                                                                        onError={(e) => {
                                                                                            e.target.onerror = null;
                                                                                            e.target.style.display = 'none';
                                                                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                                                        }}
                                                                                    />
                                                                                    <div style={{ display: 'none' }} className="p-4 items-center gap-2 text-xs text-rose-500">
                                                                                        <AlertTriangle className="w-4 h-4" />
                                                                                        <span>Image preview unavailable</span>
                                                                                    </div>
                                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                                        <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                                                                                            <Eye className="w-3.5 h-3.5" /> View Photo
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {att.name && (
                                                                                    <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 px-1 ${msg.isSelf ? 'justify-end' : ''}`}>
                                                                                        <span className="truncate max-w-[160px]">{att.name}</span>
                                                                                        {att.size && <span>• {formatBytes(att.size)}</span>}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    const ext = (att.extension || att.name?.split('.').pop() || 'FILE').toUpperCase();
                                                                    return (
                                                                        <a key={aIdx} href={att.url} download={att.name} target="_blank" rel="noreferrer"
                                                                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-xs group shadow-2xs ${
                                                                                msg.isSelf
                                                                                    ? 'bg-white/15 dark:bg-slate-800/90 border-white/20 text-white hover:bg-white/25'
                                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
                                                                            }`}>
                                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-brand text-white flex items-center justify-center font-extrabold text-[9px] shrink-0 shadow-xs">
                                                                                {ext.slice(0, 4)}
                                                                            </div>
                                                                            <div className="min-w-0 pr-2">
                                                                                <p className="font-bold truncate max-w-[190px] leading-tight">{att.name}</p>
                                                                                <p className="text-[10px] opacity-70 mt-0.5">{formatBytes(att.size)} • Click to download</p>
                                                                            </div>
                                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:text-brand transition-colors shrink-0 ml-auto">
                                                                                <Download className="w-3.5 h-3.5" />
                                                                            </div>
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Scroll-to-bottom button */}
                                {showScrollDown && (
                                    <div className="absolute bottom-24 right-6 z-10">
                                        <button type="button" onClick={scrollToBottom}
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark transition-all">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Mention Suggestions Popover */}
                                {filteredMentionMembers.length > 0 && (
                                    <div className="absolute bottom-16 left-6 z-20 w-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-1 space-y-0.5 animate-in fade-in duration-100">
                                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Mention Team Member
                                        </div>
                                        {filteredMentionMembers.map(m => (
                                            <button key={m.id} type="button"
                                                onClick={() => handleSelectMention(m)}
                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand/10 hover:text-brand transition-colors text-left">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                    {m.name.charAt(0)}
                                                </div>
                                                <span className="truncate flex-1">{m.name}</span>
                                                <span className="text-[10px] opacity-60 truncate">{m.role}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Hidden file inputs */}
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
                                <input type="file" ref={photoInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />

                                {/* Staged Files Preview Bar with Thumbnails */}
                                {stagedFiles.length > 0 && (
                                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center gap-2 overflow-x-auto">
                                        {stagedFiles.map((sf, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs shrink-0">
                                                {sf.type === 'image' && sf.previewUrl ? (
                                                    <img src={sf.previewUrl} alt={sf.name} className="w-6 h-6 rounded-md object-cover border border-slate-200 dark:border-slate-700" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center">
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 pr-1">
                                                    <p className="truncate max-w-[130px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">{sf.name}</p>
                                                    <p className="text-[9px] text-slate-400">{formatBytes(sf.size)}</p>
                                                </div>
                                                <button type="button" onClick={() => removeStagedFile(idx)}
                                                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Replying-to Preview Bar */}
                                {replyingTo && (
                                    <div className="flex items-center justify-between px-4 py-1.5 bg-brand/10 dark:bg-brand/20 border-t border-slate-200 dark:border-slate-800 text-xs animate-in slide-in-from-bottom duration-150">
                                        <div className="flex items-center gap-2 text-brand font-medium truncate">
                                            <CornerUpLeft className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">Replying to <strong className="font-bold">{replyingTo.sender}</strong>: <span className="italic opacity-80 truncate">"{replyingTo.text || '[Attachment]'}"</span></span>
                                        </div>
                                        <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                {/* Composer with Attachment Triggers & Paste */}
                                <form onSubmit={handleSendMessage}
                                    className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0">

                                    {/* Photo upload button */}
                                    <button type="button" onClick={() => photoInputRef.current?.click()}
                                        title="Attach Photo / Image"
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0">
                                        <ImageIcon className="w-4 h-4" />
                                    </button>

                                    {/* File attachment button */}
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        title="Attach Document / File"
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0">
                                        <Paperclip className="w-4 h-4" />
                                    </button>

                                    {/* Mention button */}
                                    <button type="button" onClick={() => {
                                        setInputMessage(prev => prev + '@');
                                        setMentionQuery('');
                                    }}
                                        title="Mention someone (@)"
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0">
                                        <AtSign className="w-4 h-4" />
                                    </button>

                                    <input type="text"
                                        value={inputMessage}
                                        onChange={handleInputChange}
                                        onPaste={handlePaste}
                                        placeholder="Message"
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand" />

                                    <button type="submit"
                                        disabled={(!inputMessage.trim() && stagedFiles.length === 0) || sending}
                                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-indigo-600 text-white disabled:opacity-40 hover:shadow-md hover:shadow-brand/30 transition-all shadow-xs shrink-0">
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedTask && (
                <MemberTaskDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    task={selectedTask}
                    tenantId={activeWorkspace}
                    currentUserId={currentUser?.id}
                    onTaskUpdated={handleTaskUpdated}
                />
            )}

            {/* Unsend Modal (Everyone vs For Me) */}
            <UnsendModal
                isOpen={Boolean(unsendTarget)}
                onClose={() => setUnsendTarget(null)}
                message={unsendTarget}
                onConfirmUnsend={handleConfirmUnsend}
                currentUserId={currentUser?.id}
                isAdmin={isLeader}
            />
        </TenantLayout>
    );
}
