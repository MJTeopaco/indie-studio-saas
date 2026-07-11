import React, { useState, useEffect, useRef } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import { Cpu, Calendar, CheckSquare, Search, Filter, Clock, Users, Database, ArrowRight, Star, BarChart3, ShieldCheck, Sun, Moon, Terminal, Palette, Layers } from 'lucide-react';

/**
 * ScrollReveal — A lightweight, IntersectionObserver-based wrapper to animates children
 * when they enter the viewport, slide up, and fade in smoothly.
 */
function ScrollReveal({ children, delay = 0 }) {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.05 }
        );

        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-[900ms] ease-out transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export default function Welcome({ auth }) {
    // Interactive theme state synced with document.documentElement and localStorage
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark';
        }
        return false;
    });

    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [isDark]);

    return (
        <>
            <Head title="Welcome — StudioSprint" />
            <div className="bg-surface text-text-primary min-h-screen font-sans selection:bg-brand selection:text-white flex flex-col relative overflow-x-hidden transition-colors duration-300">
                {/* Premium Background Orbs and Grid Overlays */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] pointer-events-none"></div>
                <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-brand/5 dark:bg-brand/10 blur-[130px] rounded-full pointer-events-none animate-pulse-glow"></div>
                <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-brand/5 dark:bg-brand/5 blur-[160px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }}></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-brand/5 dark:bg-brand/8 blur-[140px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDelay: '6s' }}></div>

                {/* 1. Elevated Navigation Bar */}
                <header className="relative z-20 mx-auto w-full max-w-7xl px-6 py-6 flex items-center justify-between">
                    <Link href={auth?.user ? route('dashboard') : '/'} className="transition-transform hover:scale-[1.02]">
                        <ApplicationLogo variant="horizontal" className="h-8" />
                    </Link>

                    {/* Internal Navigation links for employee guidance */}
                    <nav className="hidden md:flex items-center gap-10 text-xs uppercase tracking-wider font-heading font-semibold text-text-muted">
                        <a href="#features" className="hover:text-brand transition-colors">Features</a>
                        <a href="#architecture" className="hover:text-brand transition-colors">Architecture</a>
                        <a href="#ml-engines" className="hover:text-brand transition-colors">ML Engines</a>
                        <a href="#how-it-works" className="hover:text-brand transition-colors">How It Works</a>
                    </nav>
                    
                    <nav className="flex items-center gap-6">
                        {/* Theme Toggle option */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-muted hover:text-text-primary border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                            aria-label="Toggle Night Theme"
                        >
                            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                        </button>

                        {auth.user ? (
                            <Link href={route('dashboard')}>
                                <PrimaryButton className="shadow-md shadow-brand/10">Dashboard</PrimaryButton>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link href={route('register')}>
                                    <PrimaryButton className="shadow-md shadow-brand/10">Get Started</PrimaryButton>
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                {/* 2. Hero Section */}
                <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 pt-20 pb-32">
                    <div className="max-w-6xl text-center flex flex-col items-center">
                        {/* Cascading animations using delay styles */}
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.25 rounded-full text-[10px] uppercase tracking-widest font-heading font-bold bg-brand-10 text-brand border border-brand-30/60 mb-8 shadow-sm opacity-0 animate-hero-fade">
                            <Cpu className="w-3.5 h-3.5 animate-pulse" />
                            <span>Vaultera Labs Internal Platform</span>
                        </span>
                        
                        <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-5xl leading-[1.1] text-slate-900 dark:text-white opacity-0 animate-hero-fade" style={{ animationDelay: '150ms' }}>
                            Smart Workforce Optimization Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand-dark">Vaultera Labs</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-text-muted mb-12 max-w-3xl leading-relaxed opacity-0 animate-hero-fade" style={{ animationDelay: '300ms' }}>
                            A unified internal workspace utilizing Graph Neural Networks (GNNs) and evolutionary optimization to dynamically match engineers to sprint tasks and balance team capacity.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24 w-full opacity-0 animate-hero-fade" style={{ animationDelay: '450ms' }}>
                            <Link href={auth?.user ? route('dashboard') : route('register')} className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-9 py-4 bg-brand hover:bg-brand-light text-white rounded-2xl font-heading font-bold text-base transition-all hover:scale-105 shadow-[0_0_50px_-10px_rgba(0,124,255,0.6)]">
                                    Access Platform Hub
                                </button>
                            </Link>
                            <a href="#features" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-9 py-4 bg-transparent border border-surface-border text-text-primary hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl font-heading font-bold text-base transition-colors">
                                    Explore Core Engines
                                </button>
                            </a>
                        </div>

                        {/* Interactive-looking CSS-Based Dashboard Mockup with Floating Labels */}
                        <div className="w-full max-w-5xl relative opacity-0 animate-hero-fade" style={{ animationDelay: '600ms' }}>
                            {/* Floating Annotation 1: GNN Predictor */}
                            <div className="hidden lg:flex absolute left-[-80px] top-[150px] items-center gap-2 z-20 animate-float">
                                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-brand-30/60 shadow-lg text-[10px] font-heading font-bold text-brand dark:text-brand-light backdrop-blur-sm">
                                    GNN Match Predictor
                                </div>
                                <div className="w-12 border-t border-dashed border-slate-300 dark:border-brand-30/80"></div>
                            </div>

                            {/* Floating Annotation 2: Gantt Scheduler */}
                            <div className="hidden lg:flex absolute right-[-80px] top-[80px] items-center gap-2 z-20 animate-float-delayed">
                                <div className="w-12 border-t border-dashed border-slate-300 dark:border-brand-30/80"></div>
                                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-brand-30/60 shadow-lg text-[10px] font-heading font-bold text-brand dark:text-brand-light backdrop-blur-sm">
                                    Resource Gantt
                                </div>
                            </div>

                            {/* Main Mockup Window */}
                            <div className="border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 rounded-2xl shadow-2xl p-6 backdrop-blur-md overflow-hidden relative text-left">
                                {/* Window Header */}
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-surface-border pb-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                                        <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                                        <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                                        <span className="ml-2 font-heading text-xs font-semibold text-text-muted">StudioSprint Workspace :: Pixel Play Studio</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex items-center">
                                            <Search className="w-3 h-3 absolute left-2.5 text-slate-400 dark:text-slate-500" />
                                            <div className="pl-7 pr-3 py-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-400 dark:text-slate-500 w-32">Search tasks...</div>
                                        </div>
                                        <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-400 dark:text-slate-500">
                                            <Filter className="w-3 h-3" />
                                            <span>Filters</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Kanban Board Columns Mockup */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Column 1: Backlog */}
                                    <div className="flex flex-col gap-3.5 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900">
                                        <div className="flex items-center justify-between text-xs font-bold font-heading text-slate-400">
                                            <span>Backlog</span>
                                            <span className="px-1.5 py-0.25 bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded">2</span>
                                        </div>
                                        <div className="rounded-xl bg-white dark:bg-[#0F172A]/90 border border-slate-200 dark:border-slate-800/60 p-3.5 space-y-2.5 shadow-sm">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400 border border-slate-500/20 uppercase tracking-wider">LOW</span>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">Stripe Webhook Resiliency</h4>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500">
                                                <span>Unassigned</span>
                                                <span>18h</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: To Do */}
                                    <div className="flex flex-col gap-3.5 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900">
                                        <div className="flex items-center justify-between text-xs font-bold font-heading text-sky-500 dark:text-sky-400">
                                            <span>To Do</span>
                                            <span className="px-1.5 py-0.25 bg-sky-500/10 rounded">2</span>
                                        </div>
                                        <div className="rounded-xl bg-white dark:bg-[#0F172A]/90 border border-slate-200 dark:border-slate-800/60 p-3.5 space-y-2.5 shadow-sm">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase tracking-wider">HIGH</span>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">CPA Scheduling Engine</h4>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-bold">M</div>
                                                    <span className="text-slate-700 dark:text-slate-300">Maya Lin</span>
                                                </div>
                                                <span>32h</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: In Progress */}
                                    <div className="flex flex-col gap-3.5 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900">
                                        <div className="flex items-center justify-between text-xs font-bold font-heading text-brand">
                                            <span>In Progress</span>
                                            <span className="px-1.5 py-0.25 bg-brand-10 rounded">2</span>
                                        </div>
                                        <div className="rounded-xl bg-white dark:bg-[#0F172A] border border-brand-30/45 p-3.5 space-y-2.5 relative overflow-hidden shadow-sm dark:shadow-[0_0_20px_-5px_rgba(0,124,255,0.25)]">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">CRITICAL</span>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">NPC AI Agent Core</h4>
                                            <div className="flex items-center justify-between gap-1 mt-1">
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Model Training</span>
                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.25 rounded bg-brand-10 text-brand border border-brand-30 shrink-0">
                                                    <Cpu className="w-2.5 h-2.5" />
                                                    96% Fit
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-bold">A</div>
                                                    <span className="text-slate-700 dark:text-slate-300">Alex Chen</span>
                                                </div>
                                                <span>40h</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 4: Completed */}
                                    <div className="flex flex-col gap-3.5 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-900">
                                        <div className="flex items-center justify-between text-xs font-bold font-heading text-emerald-500 dark:text-emerald-400">
                                            <span>Done</span>
                                            <span className="px-1.5 py-0.25 bg-emerald-500/10 rounded">1</span>
                                        </div>
                                        <div className="rounded-xl bg-white dark:bg-[#0F172A]/90 border border-slate-200 dark:border-slate-800/60 p-3.5 space-y-2.5 shadow-sm">
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">LOW</span>
                                            <h4 className="text-xs font-bold text-slate-400 line-through leading-snug">Passport Schema Migrations</h4>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold">M</div>
                                                    <span className="text-slate-400 dark:text-slate-500">Marcus Vance</span>
                                                </div>
                                                <span>8h</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Division Endorsements Row (Left-aligned text, Right-aligned logos) */}
                        <div className="mt-24 w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 border-t border-b border-surface-border/50 py-8 text-left select-none">
                            <div className="max-w-xs md:max-w-sm shrink-0">
                                <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-text-muted leading-relaxed">
                                    Optimizing sprint workloads across internal divisions
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 md:gap-10">
                                {/* Division 1: Engineering */}
                                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                                    <Terminal className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
                                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-300">Engineering</span>
                                </div>

                                {/* Division 2: Design */}
                                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                                    <Palette className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
                                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-300">Design</span>
                                </div>

                                {/* Division 3: Production */}
                                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                                    <Layers className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
                                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-300">Production</span>
                                </div>

                                {/* Division 4: QA */}
                                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                                    <ShieldCheck className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
                                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-300">QA</span>
                                </div>

                                {/* Division 5: AI Labs */}
                                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                                    <Cpu className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors" />
                                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-300">AI Labs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Bento Grid Features Section */}
                    <section id="features" className="mt-48 max-w-7xl w-full">
                        <ScrollReveal>
                            <div className="text-center mb-20">
                                <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
                                    Unlock Efficiency With Advanced Features
                                </h2>
                                <p className="text-lg text-text-muted max-w-2xl mx-auto">
                                    The core capabilities matching developer talent with critical project tasks.
                                </p>
                            </div>
                        </ScrollReveal>

                        {/* Bento Grid Layout with ScrollReveal wrapping */}
                        <ScrollReveal delay={150}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Card 1: GNN Task Matcher */}
                                <div className="bg-white dark:bg-[#0F172A]/60 backdrop-blur border border-surface-border p-8 rounded-3xl flex flex-col justify-between h-[360px] md:col-span-2 group hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,124,255,0.06)] hover:border-brand-30 transition-all duration-300 shadow-sm">
                                    <div>
                                        <div className="w-12 h-12 bg-brand/10 border border-brand-30/40 rounded-xl flex items-center justify-center mb-6">
                                            <Cpu className="w-6 h-6 text-brand" />
                                        </div>
                                        <h3 className="font-heading text-xl font-bold mb-3 text-slate-900 dark:text-white">Smart Task Matching</h3>
                                        <p className="text-text-muted text-sm leading-relaxed max-w-xl">
                                            Analyze task requirements against employee skill matrices. Bipartite Heterogeneous GNN graphs calculate compatibility fits in real-time, matching structural embeddings of skills to incoming sprints.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-2xl flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-brand animate-ping"></div>
                                            <span>GNN Inference Engine Online</span>
                                        </div>
                                        <span className="text-brand dark:text-brand-light font-bold">96% Compatibility Match</span>
                                    </div>
                                </div>

                                {/* Card 2: Isolated Database Clusters */}
                                <div id="architecture" className="bg-white dark:bg-[#0F172A]/60 backdrop-blur border border-surface-border p-8 rounded-3xl flex flex-col justify-between h-[360px] group hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,124,255,0.06)] hover:border-brand-30 transition-all duration-300 shadow-sm">
                                    <div>
                                        <div className="w-12 h-12 bg-brand/10 border border-brand-30/40 rounded-xl flex items-center justify-center mb-6">
                                            <Database className="w-6 h-6 text-brand" />
                                        </div>
                                        <h3 className="font-heading text-xl font-bold mb-3 text-slate-900 dark:text-white">Secure Data Isolation</h3>
                                        <p className="text-text-muted text-sm leading-relaxed">
                                            Run multiple workspace teams on completely isolated database clusters. Relational-level tenant separation keeps your tasks secure.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-3 py-2 rounded-xl w-fit">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Isolated Connection</span>
                                    </div>
                                </div>

                                {/* Card 3: Capacity Timeline */}
                                <div className="bg-white dark:bg-[#0F172A]/60 backdrop-blur border border-surface-border p-8 rounded-3xl flex flex-col justify-between h-[360px] group hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,124,255,0.06)] hover:border-brand-30 transition-all duration-300 shadow-sm">
                                    <div>
                                        <div className="w-12 h-12 bg-brand/10 border border-brand-30/40 rounded-xl flex items-center justify-center mb-6">
                                            <Calendar className="w-6 h-6 text-brand" />
                                        </div>
                                        <h3 className="font-heading text-xl font-bold mb-3 text-slate-900 dark:text-white">Gantt Capacity Tracking</h3>
                                        <p className="text-text-muted text-sm leading-relaxed">
                                            Monitor daily capacity on Gantt schedulers to balance task hours across departments (Engineering, Product, Design, QA).
                                        </p>
                                    </div>
                                    <div className="flex items-center -space-x-1.5">
                                        {['A', 'M', 'T', 'K'].map((char, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold border border-white dark:border-slate-900 shadow-sm">{char}</div>
                                        ))}
                                        <span className="text-[10px] text-text-muted ml-3 font-semibold">+ 12 collaborators</span>
                                    </div>
                                </div>

                                {/* Card 4: Automated Sprints */}
                                <div className="bg-white dark:bg-[#0F172A]/60 backdrop-blur border border-surface-border p-8 rounded-3xl flex flex-col justify-between h-[360px] md:col-span-2 group hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,124,255,0.06)] hover:border-brand-30 transition-all duration-300 shadow-sm">
                                    <div>
                                        <div className="w-12 h-12 bg-brand/10 border border-brand-30/40 rounded-xl flex items-center justify-center mb-6">
                                            <BarChart3 className="w-6 h-6 text-brand" />
                                        </div>
                                        <h3 className="font-heading text-xl font-bold mb-3 text-slate-900 dark:text-white">Automated Workflows</h3>
                                        <p className="text-text-muted text-sm leading-relaxed max-w-xl">
                                            Balance workload distribution automatically. Our Genetic Algorithm scheduler predicts success rates and models optimal task allocations to prevent timeline bottlenecks.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-2xl flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                            <span>Optimization Framework Active (DEAP)</span>
                                        </div>
                                        <span className="text-emerald-400 font-bold">Bottlenecks Mitigated</span>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </section>

                    {/* 4. Benchmarks Section */}
                    <section id="ml-engines" className="mt-48 max-w-7xl w-full border-t border-b border-surface-border py-24 bg-slate-500/5">
                        <ScrollReveal>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-brand absolute top-0 left-[45%]"></div>
                                    <h4 className="text-5xl md:text-6xl font-heading font-extrabold text-brand mb-3">96%</h4>
                                    <p className="text-xs uppercase tracking-widest text-text-muted font-heading font-bold">GNN Match Accuracy</p>
                                </div>
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-brand absolute top-0 left-[45%]"></div>
                                    <h4 className="text-5xl md:text-6xl font-heading font-extrabold text-brand mb-3">3x</h4>
                                    <p className="text-xs uppercase tracking-widest text-text-muted font-heading font-bold">Timeline Acceleration</p>
                                </div>
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-brand absolute top-0 left-[45%]"></div>
                                    <h4 className="text-5xl md:text-6xl font-heading font-extrabold text-brand mb-3">100%</h4>
                                    <p className="text-xs uppercase tracking-widest text-text-muted font-heading font-bold">Schema Isolation</p>
                                </div>
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-brand absolute top-0 left-[45%]"></div>
                                    <h4 className="text-5xl md:text-6xl font-heading font-extrabold text-brand mb-3">96</h4>
                                    <p className="text-xs uppercase tracking-widest text-text-muted font-heading font-bold">Cataloged Skills</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </section>

                    {/* 5. How It Works Steps with Left Mockup */}
                    <section id="how-it-works" className="mt-48 max-w-7xl w-full">
                        <ScrollReveal>
                            <div className="text-center mb-20">
                                <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
                                    Get Started In 3 Easy Steps
                                </h2>
                                <p className="text-lg text-text-muted max-w-xl mx-auto">
                                    Guided onboarding flow designed for Vaultera Labs employees.
                                </p>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={150}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                {/* Left Side: Mockup Preview */}
                                <div className="border border-surface-border bg-white/40 dark:bg-slate-900/30 rounded-2xl shadow-xl p-5 relative overflow-hidden backdrop-blur-sm group hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                        <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                        <span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="h-28 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900 p-3 space-y-2">
                                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                                <div className="h-10 bg-white/60 dark:bg-slate-900/60 rounded border border-slate-100 dark:border-slate-800/40"></div>
                                            </div>
                                            <div className="h-28 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900 p-3 space-y-2">
                                                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                                <div className="h-10 bg-white/60 dark:bg-slate-900/60 rounded border border-slate-100 dark:border-slate-800/40"></div>
                                            </div>
                                            <div className="h-28 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-brand-30/20 p-3 space-y-2">
                                                <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                                <div className="h-10 bg-brand-10 border border-brand-30/30 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Step details list */}
                                <div className="space-y-6">
                                    <div className="flex items-start gap-5 p-5 bg-white/80 dark:bg-[#0F172A]/50 border border-surface-border rounded-2xl hover:border-brand-30 transition-colors shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-heading font-bold text-sm shrink-0">
                                            01
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-1">Create Developer Passport</h3>
                                            <p className="text-text-muted text-sm leading-relaxed">
                                                Access the onboarding wizard to catalog your position, weekly capacity, and rate your skills across 96 dimensions.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-5 p-5 bg-white/80 dark:bg-[#0F172A]/50 border border-surface-border rounded-2xl hover:border-brand-30 transition-colors shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-heading font-bold text-sm shrink-0">
                                            02
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-1">Choose Onboarding Fork</h3>
                                            <p className="text-text-muted text-sm leading-relaxed">
                                                Select to create a new studio workspace or input a valid invitation code to join an existing development project.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-5 p-5 bg-white/80 dark:bg-[#0F172A]/50 border border-surface-border rounded-2xl hover:border-brand-30 transition-colors shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-heading font-bold text-sm shrink-0">
                                            03
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-1">Collaborate and Balance</h3>
                                            <p className="text-text-muted text-sm leading-relaxed">
                                                Manage sprint boards, query GNN developer task fit predictions, and balance schedules on interactive Gantt timelines.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </section>
                </main>

                {/* 6. Premium Footer */}
                <footer className="relative z-10 border-t border-surface-border py-16 px-6 flex flex-col items-center gap-8 bg-slate-100/30 dark:bg-slate-950/20">
                    <ApplicationLogo variant="horizontal" className="h-7" />
                    <nav className="flex items-center gap-8 text-xs uppercase tracking-wider font-heading font-semibold text-text-muted">
                        <a href="#features" className="hover:text-brand transition-colors">Features</a>
                        <a href="#architecture" className="hover:text-brand transition-colors">Architecture</a>
                        <a href="#ml-engines" className="hover:text-brand transition-colors">ML Engines</a>
                        <a href="#how-it-works" className="hover:text-brand transition-colors">How It Works</a>
                    </nav>
                    <div className="w-full max-w-7xl border-t border-surface-border my-2"></div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans text-center">
                        © {new Date().getFullYear()} Vaultera Labs · StudioSprint. All rights reserved. Internal workforce optimization system.
                    </p>
                </footer>
            </div>
        </>
    );
}
