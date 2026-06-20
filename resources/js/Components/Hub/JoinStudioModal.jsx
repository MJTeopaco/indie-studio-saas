import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function JoinStudioModal({ triggerText = "Join via Code" }) {
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
            <SecondaryButton onClick={openModal}>{triggerText}</SecondaryButton>

            <Modal show={isOpen} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-xl font-bold text-text-primary mb-4">
                        Join a Studio
                    </h2>
                    <p className="text-sm text-text-muted mb-4">
                        Enter the invitation code provided by the studio owner.
                    </p>

                    <div className="mt-4">
                        <InputLabel htmlFor="invitation_code" value="Invitation Code" />
                        <TextInput
                            id="invitation_code"
                            type="text"
                            name="invitation_code"
                            value={data.invitation_code}
                            className="mt-1 block w-full uppercase tracking-widest font-mono"
                            isFocused={true}
                            onChange={(e) => setData('invitation_code', e.target.value.toUpperCase())}
                            placeholder="ABC-123"
                        />
                        <InputError message={errors.invitation_code} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal} disabled={processing}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={processing || !data.invitation_code}>
                            Join Studio
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}
