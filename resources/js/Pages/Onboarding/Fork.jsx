import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Fork() {
    return (
        <AuthenticatedLayout>
            <Head title="Welcome to the Platform" />

            <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8 bg-surface-elevated p-8 rounded-2xl border border-surface-border shadow-2xl text-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                            Welcome! What brings you here?
                        </h2>
                        <p className="mt-4 text-sm text-text-muted">
                            To get started, please tell us how you'll be using the platform.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col space-y-4">
                        <Link href={route('onboarding.show')}>
                            <PrimaryButton className="w-full justify-center py-3 text-lg">
                                I am a Developer
                            </PrimaryButton>
                        </Link>
                        
                        <p className="text-xs text-text-muted mt-2">
                            Set up your skills profile and find matching tasks.
                        </p>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-surface-border" />
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-surface-elevated px-6 text-text-muted">Or</span>
                            </div>
                        </div>

                        {/* Note: This button currently doesn't link anywhere functional yet, stub for future */}
                        <SecondaryButton className="w-full justify-center py-3 text-lg" disabled>
                            Start a Studio
                        </SecondaryButton>
                        <p className="text-xs text-text-muted mt-2">
                            (Studio creation coming soon)
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
