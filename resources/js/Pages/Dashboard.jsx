import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import StudioCard from '@/Components/Hub/StudioCard';
import CreateStudioModal from '@/Components/Hub/CreateStudioModal';
import JoinStudioModal from '@/Components/Hub/JoinStudioModal';

export default function Dashboard({ ownedStudios = [], joinedStudios = [] }) {
    const hasStudios = ownedStudios.length > 0 || joinedStudios.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Your Hub" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-12">
                    
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary">Your Hub</h1>
                            <p className="mt-1 text-sm text-text-muted">Manage and access all your studio workspaces.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <JoinStudioModal triggerText="Join via Code" />
                            <CreateStudioModal triggerText="+ New Studio" />
                        </div>
                    </div>

                    {!hasStudios ? (
                        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-12 text-center shadow-sm">
                            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">No Workspaces Yet</h3>
                            <p className="text-text-muted mb-6 max-w-md mx-auto">
                                You haven't joined or created any studios yet. Create a new studio to get started, or join an existing one using an invitation code.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <JoinStudioModal triggerText="Join via Code" />
                                <CreateStudioModal triggerText="+ New Studio" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Section A: Workspaces You Manage */}
                            {ownedStudios.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        Workspaces You Manage
                                        <span className="bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full font-semibold">
                                            {ownedStudios.length}
                                        </span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {ownedStudios.map(studio => (
                                            <StudioCard key={studio.id} studio={studio} role="Owner" />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Section B: Workspaces You've Joined */}
                            {joinedStudios.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        Workspaces You've Joined
                                        <span className="bg-surface-border text-text-muted text-xs px-2 py-0.5 rounded-full font-semibold">
                                            {joinedStudios.length}
                                        </span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {joinedStudios.map(studio => (
                                            <StudioCard 
                                                key={studio.id} 
                                                studio={studio} 
                                                role={studio.pivot?.role === 'owner' ? 'Owner' : 'Member'} 
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
