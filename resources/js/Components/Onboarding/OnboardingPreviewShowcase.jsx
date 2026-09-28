import React, { useMemo, useState, useEffect } from 'react';
import DriftWall, { STUDIOSPRINT_DEFAULT_TILES } from './DriftWall';

function areShowcasePropsEqual(prevProps, nextProps) {
    if (prevProps.isDark !== nextProps.isDark) return false;
    if (prevProps.forkMode !== nextProps.forkMode) return false;
    if (prevProps.step !== nextProps.step) return false;

    // Compare studio_name
    if (prevProps.data?.studio_name !== nextProps.data?.studio_name) return false;

    // Compare skills
    const prevSkills = prevProps.data?.skills || [];
    const nextSkills = nextProps.data?.skills || [];
    if (prevSkills.length !== nextSkills.length) return false;
    for (let i = 0; i < prevSkills.length; i++) {
        if (
            prevSkills[i]?.id !== nextSkills[i]?.id ||
            prevSkills[i]?.name !== nextSkills[i]?.name ||
            prevSkills[i]?.proficiency_level !== nextSkills[i]?.proficiency_level
        ) {
            return false;
        }
    }

    return true;
}

function OnboardingPreviewShowcase({ step = 1, data = {}, positions = [], forkMode = 'create', isDark }) {
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

    const studioName = data?.studio_name || '';
    const skillsList = data?.skills || [];
    const skillsKey = useMemo(() => {
        return skillsList.map(s => `${s.id || s.name}-${s.proficiency_level || 3}`).join('|');
    }, [skillsList]);

    // Generate context-aware tiles only when studio_name or selected skills actually change
    const dynamicTiles = useMemo(() => {
        const tiles = [...STUDIOSPRINT_DEFAULT_TILES];

        // If user entered a studio name in fork, customize tenancy tile
        if (studioName) {
            tiles[8] = {
                type: 'tenancy',
                idKey: '#TEN-NEW',
                title: studioName,
                sub: 'Isolated Tenant DB Partition',
                tag: 'Provisioning',
                dot: 'emerald',
                assignee: studioName.slice(0, 2).toUpperCase(),
                assigneeName: studioName,
                date: 'Live',
            };
        }

        // If user has selected skills in wizard, personalize the first few tiles
        if (skillsList.length > 0) {
            skillsList.slice(0, 4).forEach((s, idx) => {
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
    }, [studioName, skillsKey]);

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

export default React.memo(OnboardingPreviewShowcase, areShowcasePropsEqual);
