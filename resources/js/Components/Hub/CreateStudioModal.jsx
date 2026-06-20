import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function CreateStudioModal({ triggerText = "+ New Studio" }) {
    const [isOpen, setIsOpen] = useState(false);

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
            <PrimaryButton onClick={openModal}>{triggerText}</PrimaryButton>

            <Modal show={isOpen} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-xl font-bold text-text-primary mb-4">
                        Create a New Studio
                    </h2>

                    <div className="mt-4">
                        <InputLabel htmlFor="studio_name" value="Studio Name" />
                        <TextInput
                            id="studio_name"
                            type="text"
                            name="studio_name"
                            value={data.studio_name}
                            className="mt-1 block w-full"
                            isFocused={true}
                            onChange={(e) => setData('studio_name', e.target.value)}
                            placeholder="e.g. Pixel Play Studios"
                        />
                        <InputError message={errors.studio_name} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal} disabled={processing}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={processing || !data.studio_name}>
                            Create Studio
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </>
    );
}
