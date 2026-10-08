import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import StudioCard from '@/Components/Hub/StudioCard';
import CreateStudioModal from '@/Components/Hub/CreateStudioModal';
import JoinStudioModal from '@/Components/Hub/JoinStudioModal';
import { Plus, Users, Layers } from 'lucide-react';

export default function Dashboard({ ownedStudios = [], joinedStudios = [], ...props }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    // Authorization derivation:
    // Derives from explicit backend permission flag or user capability if available.
    // If not provided (current backend state), default to false (hiding creation entry points).
    const canCreateStudio = Boolean(
        props.canCreateStudio ?? auth?.user?.can_create_studio ?? false
    );

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const hasStudios = ownedStudios.length > 0 || joinedStudios.length > 0;
    const managedCount = ownedStudios.length;
    const joinedCount = joinedStudios.length;

    // Show managed section if user manages at least one studio OR is authorized to create studios
    const showManagedSection = managedCount > 0 || canCreateStudio;
    const showJoinedSection = joinedCount > 0;

    const firstName = user?.name ? user.name.trim().split(' ')[0] : null;
    const greeting = firstName ? `Welcome back, ${firstName}` : 'Welcome back';
    const subtitle = canCreateStudio
        ? 'Open a studio or start a new one.'
        : 'Open a studio or join one with a code.';

    return (
        <AuthenticatedLayout>
            <Head title="Your Hub" />

            <div className="relative py-8 sm:py-12 overflow-hidden">
                {/* Subtle ambient lighting - provides grounding without AI slop gradients */}
                <div
                    className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand/5 blur-[120px] rounded-full dark:bg-brand/10"
                    aria-hidden="true"
                />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">

                    {/* Welcome Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase bg-brand/10 text-brand border border-brand/20 mb-3 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                Studio Workspaces
                            </div>
                            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
                                {greeting}
                            </h1>
                            <p className="mt-1.5 text-sm sm:text-base text-text-muted leading-relaxed max-w-xl">
                                {subtitle}
                            </p>
                        </div>

                        {/* Actions block:
                            - "Join via code": always shown.
                              Takes secondary outline style if "New studio" is present,
                              or primary filled style if user is unauthorized.
                            - "New studio": shown ONLY if authorized. Primary filled style.
                            - Button visual order: Join via code, then New studio.
                        */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <JoinStudioModal
                                triggerText="Join via code"
                                variant={canCreateStudio ? 'secondary' : 'primary'}
                                className="w-full sm:w-auto"
                            />

                            {canCreateStudio && (
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-brand hover:bg-brand-light active:bg-brand-dark px-4 py-2.5 text-xs sm:text-sm font-heading font-semibold text-white shadow-xs hover:shadow-md transition-all duration-150 active:scale-[0.98] focus-ring cursor-pointer w-full sm:w-auto"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>New studio</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Section: Managed by you */}
                    {showManagedSection && (
                        <section aria-labelledby="managed-by-you-heading">
                            <div className="flex items-center justify-between pb-3 mb-6 border-b border-surface-border/60">
                                <div className="flex items-center gap-3">
                                    <h2
                                        id="managed-by-you-heading"
                                        className="font-heading font-semibold text-lg sm:text-xl text-text-primary tracking-tight"
                                    >
                                        Managed by you
                                    </h2>
                                    <span
                                        className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface border border-surface-border text-text-muted shadow-2xs"
                                        aria-label={`${managedCount} ${managedCount === 1 ? 'studio' : 'studios'}`}
                                    >
                                        {managedCount}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ownedStudios.map((studio) => (
                                    <StudioCard key={studio.id} studio={studio} role="Owner" />
                                ))}

                                {/* Create studio card — shown ONLY if user is authorized to create studios */}
                                {canCreateStudio && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="group relative flex flex-col items-center justify-center p-6 min-h-[190px] rounded-2xl border-2 border-dashed border-surface-border/90 hover:border-brand/60 bg-surface/30 hover:bg-surface-elevated/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md cursor-pointer text-center focus-ring"
                                        aria-label="Create a new studio"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-brand/10 border border-brand/20 group-hover:bg-brand/20 group-hover:border-brand/40 group-hover:scale-105 flex items-center justify-center text-brand mb-3.5 transition-all duration-200 shadow-2xs">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="font-heading font-semibold text-sm text-text-primary group-hover:text-brand transition-colors">
                                            Create studio
                                        </span>
                                        <span className="text-xs text-text-muted mt-1">
                                            Start a new workspace
                                        </span>
                                    </button>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Section: Joined */}
                    {showJoinedSection && (
                        <section aria-labelledby="joined-heading">
                            <div className="flex items-center justify-between pb-3 mb-6 border-b border-surface-border/60">
                                <div className="flex items-center gap-3">
                                    <h2
                                        id="joined-heading"
                                        className="font-heading font-semibold text-lg sm:text-xl text-text-primary tracking-tight"
                                    >
                                        Joined
                                    </h2>
                                    <span
                                        className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface border border-surface-border text-text-muted shadow-2xs"
                                        aria-label={`${joinedCount} ${joinedCount === 1 ? 'studio' : 'studios'}`}
                                    >
                                        {joinedCount}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {joinedStudios.map((studio) => (
                                    <StudioCard
                                        key={studio.id}
                                        studio={studio}
                                        role={
                                            studio.pivot?.role
                                                ? studio.pivot.role.charAt(0).toUpperCase() +
                                                  studio.pivot.role.slice(1)
                                                : 'Member'
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Clean empty state fallback when user has no studios and cannot create */}
                    {!hasStudios && !canCreateStudio && (
                        <div className="bg-surface-elevated/90 border border-surface-border rounded-2xl p-10 sm:p-14 text-center shadow-xs">
                            <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand shadow-2xs">
                                <Layers className="w-7 h-7" />
                            </div>
                            <h2 className="font-heading text-lg sm:text-xl font-bold text-text-primary mb-2 tracking-tight">
                                No workspaces yet
                            </h2>
                            <p className="text-sm text-text-muted mb-6 max-w-md mx-auto leading-relaxed">
                                You haven't joined any studios yet. Join an existing studio workspace using an invitation code.
                            </p>
                            <div className="flex justify-center">
                                <JoinStudioModal triggerText="Join via code" variant="primary" />
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Controlled CreateStudioModal instance for authorized users */}
            {canCreateStudio && (
                <CreateStudioModal
                    isOpen={isCreateModalOpen}
                    setIsOpen={setIsCreateModalOpen}
                    showTrigger={false}
                />
            )}
        </AuthenticatedLayout>
    );
}
