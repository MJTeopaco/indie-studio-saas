import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';

export default function Fork() {
    const {
        data: createData,
        setData: setCreateData,
        post: postCreate,
        processing: processingCreate,
        errors: createErrors,
    } = useForm({
        studio_name: '',
    });

    const {
        data: joinData,
        setData: setJoinData,
        post: postJoin,
        processing: processingJoin,
        errors: joinErrors,
    } = useForm({
        invitation_code: '',
    });

    const handleCreateStudio = (e) => {
        e.preventDefault();
        postCreate(route('onboarding.studio.store'));
    };

    const handleJoinStudio = (e) => {
        e.preventDefault();
        postJoin(route('onboarding.join.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Welcome to StudioSprint" />

            <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
                        Welcome to StudioSprint. How would you like to start?
                    </h1>
                </div>

                <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch justify-center gap-8 md:gap-0 relative">
                    
                    {/* Path A: Create Studio */}
                    <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 bg-surface-elevated rounded-2xl border border-surface-border shadow-2xl relative z-10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-text-primary">Create a New Studio</h2>
                            <p className="mt-2 text-sm text-text-muted">
                                Start a new workspace for your team and manage projects.
                            </p>
                        </div>
                        
                        <form onSubmit={handleCreateStudio} className="w-full max-w-sm space-y-6">
                            <div>
                                <TextInput
                                    id="studio_name"
                                    type="text"
                                    className="w-full"
                                    placeholder="e.g. Pixel Play Studios"
                                    value={createData.studio_name}
                                    onChange={(e) => setCreateData('studio_name', e.target.value)}
                                    required
                                />
                                <InputError message={createErrors.studio_name} className="mt-2" />
                            </div>

                            <PrimaryButton 
                                type="submit" 
                                className="w-full justify-center py-3 text-lg"
                                disabled={processingCreate}
                            >
                                {processingCreate ? 'Provisioning workspace...' : 'Create Studio →'}
                            </PrimaryButton>
                        </form>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:flex items-center justify-center w-16 relative z-20 -mx-8">
                        <div className="absolute inset-y-0 w-px bg-surface-border" />
                        <div className="relative bg-surface px-3 py-2 rounded-full border border-surface-border text-xs font-bold text-text-muted uppercase tracking-wider">
                            Or
                        </div>
                    </div>

                    <div className="flex md:hidden items-center justify-center w-full relative z-20 py-4 -my-8">
                        <div className="absolute inset-x-0 h-px bg-surface-border" />
                        <div className="relative bg-surface px-3 py-2 rounded-full border border-surface-border text-xs font-bold text-text-muted uppercase tracking-wider">
                            Or
                        </div>
                    </div>

                    {/* Path B: Join Studio */}
                    <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 bg-surface-elevated rounded-2xl border border-surface-border shadow-2xl relative z-10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-text-primary">Join an Existing Studio</h2>
                            <p className="mt-2 text-sm text-text-muted">
                                Got an invite from your team? Enter your code below.
                            </p>
                        </div>
                        
                        <form onSubmit={handleJoinStudio} className="w-full max-w-sm space-y-6">
                            <div>
                                <TextInput
                                    id="invitation_code"
                                    type="text"
                                    className="w-full"
                                    placeholder="Enter 8-character invite code"
                                    value={joinData.invitation_code}
                                    onChange={(e) => setJoinData('invitation_code', e.target.value)}
                                    maxLength={8}
                                    required
                                    autoComplete="off"
                                />
                                <InputError message={joinErrors.invitation_code} className="mt-2" />
                            </div>

                            <PrimaryButton 
                                type="submit" 
                                className="w-full justify-center py-3 text-lg"
                                disabled={processingJoin}
                            >
                                {processingJoin ? 'Joining...' : 'Join Studio →'}
                            </PrimaryButton>
                        </form>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
