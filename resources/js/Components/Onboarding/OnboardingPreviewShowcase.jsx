import React, { useMemo, useState, useEffect } from 'react';
import DriftWall, { STUDIOSPRINT_DEFAULT_TILES } from './DriftWall';

export default function OnboardingPreviewShowcase({ step = 1, data = {}, positions = [], forkMode = 'create', isDark }) {
    // Theme state observer
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof isDark === 'boolean') return isDark;
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    useEffect(() => {
        if (typeof isDark === 'boolean') {
            setDarkMode(isDark);
            return;
        }
        if (typeof document === 'undefined') return;
        const observer = new MutationObserver(() => {
            setDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [isDark]);

    // Generate context-aware tiles if data is present, or fallback to default StudioSprint tiles
    const dynamicTiles = useMemo(() => {
        const tiles = [...STUDIOSPRINT_DEFAULT_TILES];

        // If user entered a studio name in fork, customize tenancy tile
        if (data?.studio_name) {
            tiles[8] = {
                type: 'tenancy',
                idKey: '#TEN-NEW',
                title: data.studio_name,
                sub: 'Isolated Tenant DB Partition',
                tag: 'Provisioning',
                dot: 'emerald',
                assignee: data.studio_name.slice(0, 2).toUpperCase(),
                assigneeName: data.studio_name,
                date: 'Live',
            };
        }

        // If user has selected skills in wizard, personalize the first few tiles
        if (data?.skills && data.skills.length > 0) {
            data.skills.slice(0, 4).forEach((s, idx) => {
                tiles[idx] = {
                    type: 'skill',
                    idKey: `#SKL-0${idx + 1}`,
                    title: s.name,
                    score: `${'★'.repeat(s.proficiency_level || 3)} Level ${s.proficiency_level || 3}`,
                    tag: s.category || 'Skill',
                    dot: 'amber',
                    assignee: 'DEV',
                    assigneeName: 'Developer Passport',
                    date: 'Selected',
                };
            });
        }

        return tiles;
    }, [data, step]);

    return (
        <div className="relative w-full h-full min-h-[600px] flex items-center justify-center bg-slate-100/70 dark:bg-[#070A10] transition-colors duration-300 overflow-hidden select-none">
            {/* Ambient Background Lighting Gradients (Light/Dark Aware) */}
            <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-brand/10 dark:bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none transition-colors duration-300" />
            <div className="absolute -bottom-1/4 -left-1/4 w-[450px] h-[450px] bg-indigo-400/15 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-300" />

            {/* Subtle Grid Lines Background (Occluded by solid cards) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b10_1px,transparent_1px),linear-gradient(to_bottom,#64748b10_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Linear-style React Bits DriftWall Component */}
            <div className="w-full h-full min-h-[650px] flex items-center justify-center">
                <DriftWall
                    items={dynamicTiles}
                    columns={3}
                    tileWidth={230}
                    tileHeight={118}
                    gap={16}
                    radius={12}
                    tilt={16}
                    turn={-14}
                    perspective={1200}
                    depth={120}
                    speed={32}
                    direction="up"
                    variance={0.4}
                    parallax={0.65}
                    lift={60}
                    fade={0.65}
                    dim={1}
                    overlayColor={darkMode ? '#070A10' : '#F1F5F9'}
                />
            </div>
        </div>
    );
}
