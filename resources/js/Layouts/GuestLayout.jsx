import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-surface relative overflow-hidden pt-6 sm:justify-center sm:pt-0">
            {/* Background gradient orb */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 mb-2">
                <Link href="/">
                    <ApplicationLogo className="text-4xl" />
                </Link>
            </div>

            <div className="relative z-10 mt-6 w-full overflow-hidden bg-surface-elevated/80 backdrop-blur-xl border border-surface-border px-6 py-8 shadow-2xl sm:max-w-md sm:rounded-2xl">
                {children}
            </div>
        </div>
    );
}
