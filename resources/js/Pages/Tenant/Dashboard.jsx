import TenantLayout from '@/Layouts/TenantLayout';
import { Head } from '@inertiajs/react';

export default function TenantDashboard({ studio }) {
    return (
        <TenantLayout studioName={studio.name}>
            <Head title={`${studio.name} — Dashboard`} />

            <div className="flex flex-col py-10 px-8 space-y-8">

                {/* Welcome Banner */}
                <div className="bg-surface-elevated rounded-2xl border border-surface-border shadow-2xl p-8">
                    <div className="flex items-center gap-4">
                        {/* Studio Avatar */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-brand/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-brand">
                                {studio.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-text-muted font-medium uppercase tracking-widest">
                                Studio Workspace
                            </p>
                            <h1 className="text-3xl font-bold text-text-primary">
                                {studio.name}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Placeholder Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { label: 'Active Projects', value: '—', hint: 'Coming soon' },
                        { label: 'Team Members',    value: '—', hint: 'Coming soon' },
                        { label: 'Open Tasks',      value: '—', hint: 'Coming soon' },
                    ].map(({ label, value, hint }) => (
                        <div
                            key={label}
                            className="bg-surface-elevated rounded-2xl border border-surface-border shadow p-6 text-center"
                        >
                            <p className="text-sm text-text-muted">{label}</p>
                            <p className="mt-1 text-4xl font-bold text-text-primary">{value}</p>
                            <p className="mt-1 text-xs text-text-muted">{hint}</p>
                        </div>
                    ))}
                </div>

            </div>
        </TenantLayout>
    );
}
