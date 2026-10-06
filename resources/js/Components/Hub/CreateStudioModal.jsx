import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Plus } from 'lucide-react';

export default function CreateStudioModal({
    triggerText = 'New studio',
    className = '',
    isOpen: controlledIsOpen,
    setIsOpen: controlledSetIsOpen,
    showTrigger = true,
}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
    const setIsOpen = isControlled ? controlledSetIsOpen : setInternalIsOpen;

    const { data, setData, post, processing, errors, reset } = useForm({
        studio_name: '',
    });

    const openModal = () => setIsOpen(true);
    const closeModal = () => {
        setIsOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('hub.studio.store'), {
            onSuccess: () => closeModal(),
        });
    };

    return (
        <>
            {showTrigger && (
                <button
                    type="button"
                    onClick={openModal}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-brand hover:bg-brand-light active:bg-brand-dark px-4 py-2.5 text-xs sm:text-sm font-heading font-semibold text-white shadow-xs hover:shadow-md transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 cursor-pointer ${className}`}
                >
                    <Plus className="w-4 h-4" />
                    <span>{triggerText}</span>
                </button>
            )}

            <Modal show={isOpen} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6 sm:p-7">
                    <div>
                        <h2 className="font-heading text-xl font-bold text-text-primary tracking-tight">
                            Create a New Studio
                        </h2>
                        <p className="mt-1 text-xs text-text-muted">
                            Provision a new isolated workspace for your team and game development projects.
                        </p>
                    </div>

                    <div className="mt-5">
                        <InputLabel htmlFor="studio_name" value="Studio Name" className="text-xs font-semibold text-text-primary mb-1.5" />
                        <TextInput
                            id="studio_name"
                            type="text"
                            name="studio_name"
                            value={data.studio_name}
                            className="mt-1 block w-full rounded-xl border-surface-border bg-surface text-text-primary focus:border-brand focus:ring-brand shadow-2xs"
                            isFocused={true}
                            onChange={(e) => setData('studio_name', e.target.value)}
                            placeholder="e.g. Pixel Play Studios"
                        />
                        <InputError message={errors.studio_name} className="mt-2 text-xs" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-border/60">
                        <SecondaryButton
                            onClick={closeModal}
                            disabled={processing}
                            className="rounded-xl px-4 py-2 text-xs font-heading font-semibold normal-case tracking-normal hover:bg-surface active:scale-[0.98]"
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing || !data.studio_name.trim()}
                            className="rounded-xl px-4 py-2 text-xs font-heading font-semibold normal-case tracking-normal active:scale-[0.98]"
                        >
                            Create studio
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}
