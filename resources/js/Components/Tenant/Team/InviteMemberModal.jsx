import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/UI/button';
import { IconButton } from '@/Components/UI/IconButton';
import { SectionHeader } from '@/Components/UI/SectionHeader';
import { showToast } from '@/Components/SystemToast';
import { UserPlus, Copy, Check, Mail, KeyRound, Loader2, X } from 'lucide-react';

export default function InviteMemberModal({
    isOpen,
    onClose,
    studio,
}) {
    const [email, setEmail] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [generatingCode, setGeneratingCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const studioId = studio?.id;

    // Fetch or generate an invite code when modal opens if none exists
    useEffect(() => {
        if (isOpen && studioId && !inviteCode) {
            handleGenerateCode(false);
        }
    }, [isOpen, studioId]);

    const handleGenerateCode = async (showSuccessToast = false) => {
        if (!studioId || generatingCode) return;
        setGeneratingCode(true);
        try {
            const response = await axios.post(`/hub/studio/${studioId}/invite`);
            const code = response.data?.code;
            if (code) {
                setInviteCode(code);
                if (showSuccessToast) {
                    showToast('New invite code generated!', 'success');
                }
            }
        } catch (error) {
            console.error('Failed to generate invite code', error);
            if (showSuccessToast) {
                showToast('Failed to generate invite code.', 'error');
            }
        } finally {
            setGeneratingCode(false);
        }
    };

    const handleCopyCode = async () => {
        if (!inviteCode) {
            await handleGenerateCode(false);
        }
        const codeToCopy = inviteCode;
        if (!codeToCopy) return;

        try {
            await navigator.clipboard.writeText(codeToCopy);
            setCopied(true);
            showToast('Invitation code copied to clipboard!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Clipboard copy failed', error);
            showToast('Failed to copy invitation code.', 'error');
        }
    };

    const handleSendEmailInvite = (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            showToast('Please enter an email address.', 'warning');
            return;
        }

        setSendingEmail(true);
        // Simulate sending invite email with current code
        setTimeout(() => {
            setSendingEmail(false);
            showToast(`Invitation sent to ${trimmedEmail}!`, 'success');
            setEmail('');
            onClose();
        }, 600);
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="p-5 bg-[var(--card)] text-[var(--foreground)] rounded-xl border border-[var(--border)]">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 border border-[var(--primary)]/20">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
                                Invite team member
                            </h3>
                            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                                Add contributors to {studio?.name || 'this studio'}
                            </p>
                        </div>
                    </div>
                    <IconButton
                        aria-label="Close modal"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </IconButton>
                </div>

                {/* Section 1: Email Invite */}
                <form onSubmit={handleSendEmailInvite} className="space-y-3 mb-5">
                    <SectionHeader
                        icon={Mail}
                        title="Invite via email"
                        description="Send an onboarding invitation link directly to their inbox."
                    />

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-[var(--foreground)]">
                            Email address
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@studio.com"
                                className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-hidden focus:border-[var(--primary)] transition-colors"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={sendingEmail || !email.trim()}
                                className="h-8 px-3 text-xs font-heading font-semibold"
                            >
                                {sendingEmail ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <span>Send invite</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Section 2: Invitation Code */}
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                    <SectionHeader
                        icon={KeyRound}
                        title="Or share invite code"
                        description="New members can join instantly using this studio code."
                    />

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-[var(--foreground)]">
                            Studio invite code
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--secondary)]/70 border border-[var(--border)] text-xs font-mono font-semibold text-[var(--foreground)] tracking-wider flex items-center justify-between">
                                <span>
                                    {generatingCode
                                        ? 'Generating...'
                                        : inviteCode || 'No code available'}
                                </span>
                                <span className="text-[10px] font-sans font-normal text-[var(--muted-foreground)]">
                                    Valid 7 days
                                </span>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCopyCode}
                                disabled={generatingCode}
                                className="h-8 px-3 text-xs font-heading font-medium gap-1.5 border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)]"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                                        <span className="text-[var(--success)]">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy code</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modal Footer / Actions Row */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-5 border-t border-[var(--border)]">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        className="h-8 px-4 text-xs font-heading font-medium"
                    >
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
