import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { KeyRound, Loader2 } from 'lucide-react';

export default function JoinStudioModal({
    triggerText = 'Join via code',
    variant = 'secondary',
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        invitation_code: '',
    });

    const openModal = () => setIsOpen(true);
    const closeModal = () => {
        setIsOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('hub.join.store'), {
            onSuccess: () => closeModal(),
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className={
                    variant === 'primary'
                        ? `inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-brand hover:bg-brand-light active:bg-brand-dark px-4 py-2.5 text-xs sm:text-sm font-heading font-semibold text-white shadow-xs hover:shadow-md transition-all duration-150 active:scale-[0.98] focus-ring cursor-pointer ${className}`
                        : `inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-elevated/80 hover:bg-surface-elevated hover:border-slate-400/50 dark:hover:border-slate-600 px-4 py-2.5 text-xs sm:text-sm font-heading font-semibold text-text-primary shadow-xs hover:shadow-sm transition-all duration-150 active:scale-[0.98] focus-ring cursor-pointer ${className}`
                }
            >
                <KeyRound className="w-4 h-4 opacity-75" />
                <span>{triggerText}</span>
            </button>

            <Modal show={isOpen} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6 sm:p-7">
                    <div>
                        <h2 className="font-heading text-xl font-bold text-text-primary tracking-tight">
                            Join a Studio
                        </h2>
                        <p className="mt-1 text-xs text-text-muted">
                            Enter the 8-character invitation code provided by the studio owner.
                        </p>
                    </div>

                    <div className="mt-5">
                        <InputLabel htmlFor="invitation_code" value="Invitation Code" className="text-xs font-semibold text-text-primary mb-1.5" />
                        <TextInput
                            id="invitation_code"
                            type="text"
                            name="invitation_code"
                            value={data.invitation_code}
                            className="mt-1 block w-full rounded-xl border-surface-border bg-surface text-text-primary uppercase tracking-widest font-mono text-center text-base focus-ring shadow-2xs"
                            isFocused={true}
                            onChange={(e) => setData('invitation_code', e.target.value.toUpperCase())}
                            placeholder="ABC-123"
                            maxLength={12}
                        />
                        <InputError message={errors.invitation_code} className="mt-2 text-xs" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-border/60">
                        <SecondaryButton
                            onClick={closeModal}
                            disabled={processing}
                            className="rounded-xl px-4 py-2 text-xs font-heading font-semibold normal-case tracking-normal hover:bg-surface active:scale-[0.98] focus-ring"
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing || !data.invitation_code.trim()}
                            className="rounded-xl px-4 py-2 text-xs font-heading font-semibold normal-case tracking-normal active:scale-[0.98] focus-ring inline-flex items-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Joining...</span>
                                </>
                            ) : (
                                <span>Join studio</span>
                            )}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}
