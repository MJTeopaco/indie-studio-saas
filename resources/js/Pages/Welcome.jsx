import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome — StudioSprint" />
            <div className="bg-surface text-text-primary min-h-screen font-sans selection:bg-brand selection:text-white flex flex-col relative overflow-hidden">
                {/* Background texture & gradient */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand/10 blur-[150px] rounded-full pointer-events-none"></div>

                <header className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 flex items-center justify-between">
                    <Link href={auth?.user ? route('dashboard') : '/'}>
                        <ApplicationLogo className="text-2xl" />
                    </Link>
                    
                    <nav className="flex items-center gap-6">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="text-sm font-semibold text-text-primary hover:text-brand transition-colors"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                >
                                    <PrimaryButton>Start your studio</PrimaryButton>
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 pt-20 pb-32">
                    <div className="max-w-4xl text-center">
                        <h1 className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Smart Project Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand-dark">Indie Studios</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed">
                            Stop wrestling with generic kanban boards. Manage your team, track skills, and ship games faster with intelligent task routing designed specifically for game development.
                        </p>
                        <div className="flex items-center justify-center gap-6">
                            <Link href={auth?.user ? route('dashboard') : route('login')}>
                                <button className="px-8 py-4 bg-brand hover:bg-brand-light text-white rounded-lg font-heading font-bold text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(0,124,255,0.5)]">
                                    Create Your Studio
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-7xl w-full">
                        <div className="bg-surface-elevated/50 backdrop-blur border border-surface-border p-8 rounded-2xl">
                            <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="font-heading text-xl font-bold mb-4 text-white">Smart Task Matching</h3>
                            <p className="text-text-muted leading-relaxed">
                                Stop guessing who should take the next ticket. Our AI analyzes your team's exact skill matrix to instantly predict the perfect developer for every bug, feature, or asset.
                            </p>
                        </div>

                        <div className="bg-surface-elevated/50 backdrop-blur border border-surface-border p-8 rounded-2xl">
                            <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                            </div>
                            <h3 className="font-heading text-xl font-bold mb-4 text-white">Global Developer Passport</h3>
                            <p className="text-text-muted leading-relaxed">
                                Build your profile once. Carry your dynamically updated tech stack across multiple studio workspaces without ever rewriting your resume.
                            </p>
                        </div>

                        <div className="bg-surface-elevated/50 backdrop-blur border border-surface-border p-8 rounded-2xl">
                            <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="font-heading text-xl font-bold mb-4 text-white">Secure Studio Workspaces</h3>
                            <p className="text-text-muted leading-relaxed">
                                Manage multiple indie projects with absolute peace of mind. Complete database-level isolation guarantees your studio's schedules, tasks, and team data never cross wires.
                            </p>
                        </div>
                    </div>
                </main>

                <footer className="relative z-10 border-t border-surface-border py-8 text-center text-text-muted text-xs font-sans">
                    © {new Date().getFullYear()} Vaultera Labs · StudioSprint. All rights reserved.
                </footer>
            </div>
        </>
    );
}
