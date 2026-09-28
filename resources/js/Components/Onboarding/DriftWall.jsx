import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './DriftWall.css';

// Default StudioSprint interface tiles
export const STUDIOSPRINT_DEFAULT_TILES = [
    {
        type: 'task',
        idKey: '#SP-104',
        title: 'Physics Collision Sweep',
        dot: 'rose',
        tag: 'Critical Path',
        assignee: 'MV',
        assigneeName: 'Marcus V.',
        date: 'Oct 9',
    },
    {
        type: 'bug',
        idKey: '#ENG-438',
        title: 'Vulkan Memory Allocator Leak',
        dot: 'rose',
        tag: 'Bug',
        assignee: 'DK',
        assigneeName: 'David K.',
        date: 'Oct 9',
    },
    {
        type: 'status',
        idKey: '#SYS-202',
        title: 'Working on Navigation Mesh...',
        dot: 'emerald',
        tag: 'Active',
        assignee: 'SL',
        assigneeName: 'Sarah L.',
        date: 'Oct 10',
    },
    {
        type: 'gnn',
        idKey: '#GNN-92',
        title: 'GNN Link Prediction Match',
        score: '98.4%',
        tag: 'GraphSAGE',
        assignee: 'ER',
        assigneeName: 'Elena R.',
        date: 'Live',
    },
    {
        type: 'task',
        idKey: '#AI-219',
        title: 'Bipartite Task Assignment',
        dot: 'cyan',
        tag: 'Recommendation',
        assignee: 'AM',
        assigneeName: 'Alex M.',
        date: 'Oct 11',
    },
    {
        type: 'milestone',
        idKey: '#MS-01',
        title: 'Alpha Release (Zero Float)',
        dot: 'amber',
        tag: 'Milestone',
        assignee: 'PL',
        assigneeName: 'Project Lead',
        date: 'Nov 1',
    },
    {
        type: 'capacity',
        idKey: '#CAP-04',
        title: 'Physics Team Capacity',
        score: '38h / 40h',
        tag: '95% Fit',
        assignee: 'CW',
        assigneeName: 'Core Work',
        date: 'Sprint 4',
    },
    {
        type: 'pr',
        idKey: 'PR #89',
        title: 'HeteroGNN Edge Embedding',
        dot: 'emerald',
        tag: 'Merged',
        assignee: 'CT',
        assigneeName: 'Chris T.',
        date: 'Oct 8',
    },
    {
        type: 'tenancy',
        idKey: '#TEN-09',
        title: 'Pixel Play Studios',
        sub: 'Tenant DB Partition',
        tag: 'Online',
        dot: 'emerald',
        assignee: 'SS',
        assigneeName: 'Studio Lead',
        date: 'v2.4',
    },
    {
        type: 'skill',
        idKey: '#SKL-05',
        title: 'Unity C# & Shader HLSL',
        score: '5★ Master',
        tag: 'Affinity',
        dot: 'amber',
        assignee: 'TS',
        assigneeName: 'Top Skill',
        date: 'Verified',
    },
    {
        type: 'task',
        idKey: '#NET-502',
        title: 'Rollback Netcode Client',
        dot: 'indigo',
        tag: 'Multiplayer',
        assignee: 'LW',
        assigneeName: 'Liam W.',
        date: 'Oct 12',
    },
    {
        type: 'bug',
        idKey: '#SHD-109',
        title: 'PBR Specular Glitch in Bloom',
        dot: 'amber',
        tag: 'Shader',
        assignee: 'SN',
        assigneeName: 'Sophia N.',
        date: 'Oct 9',
    },
    {
        type: 'status',
        idKey: '#RET-03',
        title: 'Sprint Retrospective Ready',
        dot: 'emerald',
        tag: 'Review',
        assignee: 'AL',
        assigneeName: 'Agile Lead',
        date: 'Oct 13',
    },
    {
        type: 'affinity',
        idKey: '#AFF-88',
        title: 'Developer Affinity Vector',
        score: 'Top 5%',
        tag: 'AI Match',
        dot: 'cyan',
        assignee: 'NN',
        assigneeName: 'Neural Net',
        date: 'Matched',
    },
    {
        type: 'task',
        idKey: '#UI-331',
        title: 'HUD Canvas Batch Optimizer',
        dot: 'cyan',
        tag: 'UI/UX Core',
        assignee: 'JP',
        assigneeName: 'Jordan P.',
        date: 'Oct 14',
    }
];

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index, variance) => {
    const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
    return 1 + variance * pseudo;
};

// StudioSprint UI Tile Component
const StudioSprintTileContent = React.memo(function StudioSprintTileContent({ item }) {
    const dotColors = {
        rose: 'bg-rose-500 shadow-rose-500/60',
        emerald: 'bg-emerald-500 shadow-emerald-500/60 dark:bg-emerald-400 dark:shadow-emerald-400/60',
        amber: 'bg-amber-500 shadow-amber-500/60 dark:bg-amber-400 dark:shadow-amber-400/60',
        indigo: 'bg-indigo-500 shadow-indigo-500/60 dark:bg-indigo-400 dark:shadow-indigo-400/60',
        cyan: 'bg-brand shadow-brand/60 dark:bg-cyan-400 dark:shadow-cyan-400/60',
    };

    const dotClass = dotColors[item.dot] || dotColors.cyan;

    return (
        <div className="w-full h-full p-3.5 flex flex-col justify-between bg-white dark:bg-[#0B0F17] border border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-[inherit] text-slate-800 dark:text-slate-200 select-none shadow-md shadow-slate-900/5 dark:shadow-black/70 transition-colors">
            {/* Top row: Issue / ID Key + Tag Badge */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    {item.dot && (
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shadow-xs shrink-0`} />
                    )}
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.idKey || '#TASK'}
                    </span>
                </div>

                {item.tag && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 shrink-0">
                        {item.tag}
                    </span>
                )}
            </div>

            {/* Middle row: Title / Description */}
            <div className="my-auto py-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 tracking-tight">
                    {item.title}
                </p>
                {item.score && (
                    <span className="inline-block mt-0.5 text-[10px] font-mono text-brand dark:text-cyan-400 font-bold">
                        {item.score}
                    </span>
                )}
            </div>

            {/* Bottom row: Assignee Avatar + Date stamp */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[8px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        {item.assignee || 'SS'}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[90px]">
                        {item.assigneeName || 'StudioSprint'}
                    </span>
                </div>
                {item.date && (
                    <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                        {item.date}
                    </span>
                )}
            </div>
        </div>
    );
});

const DriftWall = ({
    items = STUDIOSPRINT_DEFAULT_TILES,
    columns = 3,
    tileWidth = 230,
    tileHeight = 120,
    gap = 16,
    radius = 12,
    tilt = 16,
    turn = -14,
    roll = 0,
    perspective = 1200,
    depth = 120,
    speed = 36,
    direction = 'up',
    variance = 0.45,
    parallax = 0.6,
    pauseOnHover = false,
    lift = 60,
    fade = 0.65,
    dim = 0.5,
    grayscale = false,
    overlayColor = '#060010',
    className = '',
    style
}) => {
    const containerRef = useRef(null);
    const planeRef = useRef(null);
    const trackRefs = useRef([]);
    const rafRef = useRef(null);

    const offsetsRef = useRef([]);
    const velocitiesRef = useRef([]);
    const hoveredColRef = useRef(-1);
    const wallHoveredRef = useRef(false);
    const pointerRef = useRef({ x: 0, y: 0 });
    const pointerDampedRef = useRef({ x: 0, y: 0 });
    const lastTsRef = useRef(null);

    const [containerHeight, setContainerHeight] = useState(600);
    const [activeId, setActiveId] = useState(null);
    const activeIdRef = useRef(null);
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        setReduced(prefersReducedMotion());
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = e => setReduced(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const columnItems = useMemo(() => {
        const cols = Array.from({ length: columns }, () => []);
        items.forEach((item, i) => cols[i % columns].push(item));
        return cols.map(col => (col.length ? col : items.slice(0, 1)));
    }, [items, columns]);

    const columnMeta = useMemo(() => {
        const unit = tileHeight + gap;
        return columnItems.map(col => {
            const copyHeight = Math.max(unit, col.length * unit);
            const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
            return { copyHeight, copies };
        });
    }, [columnItems, tileHeight, gap, containerHeight]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(([entry]) => {
            setContainerHeight(entry.contentRect.height || 600);
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const baseVelocities = useMemo(() => {
        const dirSign = direction === 'up' ? 1 : -1;
        return columnItems.map((_, c) => {
            const altSign = c % 2 === 0 ? 1 : -1;
            return speed * columnFactor(c, variance) * dirSign * altSign;
        });
    }, [columnItems, speed, direction, variance]);

    const columnMetaRef = useRef(columnMeta);
    columnMetaRef.current = columnMeta;

    const baseVelocitiesRef = useRef(baseVelocities);
    baseVelocitiesRef.current = baseVelocities;

    const pauseOnHoverRef = useRef(pauseOnHover);
    pauseOnHoverRef.current = pauseOnHover;

    const parallaxRef = useRef(parallax);
    parallaxRef.current = parallax;

    const applyPlaneTransform = useCallback(
        (px, py) => {
            const plane = planeRef.current;
            if (!plane) return;
            plane.style.transform =
                `translate(-50%, -50%) scale(1.18) ` +
                `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
                `translateZ(${-depth}px)`;
        },
        [tilt, turn, roll, depth]
    );

    const applyPlaneTransformRef = useRef(applyPlaneTransform);
    applyPlaneTransformRef.current = applyPlaneTransform;

    useEffect(() => {
        if (!offsetsRef.current || offsetsRef.current.length !== columnMeta.length) {
            offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
        } else {
            // Preserve running offset position across re-renders/prop updates
            offsetsRef.current = columnMeta.map((meta, c) => {
                const prev = offsetsRef.current[c] ?? 0;
                return meta.copyHeight > 0 ? ((prev % meta.copyHeight) + meta.copyHeight) % meta.copyHeight : 0;
            });
        }

        if (!velocitiesRef.current || velocitiesRef.current.length !== columnItems.length) {
            velocitiesRef.current = columnItems.map((_, c) => velocitiesRef.current?.[c] ?? 0);
        }
    }, [columnMeta, columnItems]);

    useEffect(() => {
        const animate = ts => {
            if (lastTsRef.current === null) lastTsRef.current = ts;
            const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
            lastTsRef.current = ts;

            const currentParallax = parallaxRef.current ?? 0;
            const maxTilt = currentParallax * 8;
            const targetX = pointerRef.current.x * maxTilt;
            const targetY = -pointerRef.current.y * maxTilt;
            const damp = 1 - Math.exp(-dt / 0.12);
            pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
            pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
            if (applyPlaneTransformRef.current) {
                applyPlaneTransformRef.current(pointerDampedRef.current.x, pointerDampedRef.current.y);
            }

            if (!reduced) {
                const currentMeta = columnMetaRef.current;
                const currentVelocities = baseVelocitiesRef.current;
                const isPausedOnHover = pauseOnHoverRef.current;

                for (let c = 0; c < trackRefs.current.length; c++) {
                    const meta = currentMeta[c];
                    if (!meta) continue;
                    const paused = wallHoveredRef.current && isPausedOnHover;
                    const factor = paused || hoveredColRef.current === c ? 0 : 1;
                    const target = (currentVelocities[c] ?? 0) * factor;

                    const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
                    velocitiesRef.current[c] = (velocitiesRef.current[c] ?? 0) + (target - (velocitiesRef.current[c] ?? 0)) * ease;
                    let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
                    next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
                    offsetsRef.current[c] = next;

                    const el = trackRefs.current[c];
                    if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
                }
            } else {
                const currentMeta = columnMetaRef.current;
                for (let c = 0; c < trackRefs.current.length; c++) {
                    const el = trackRefs.current[c];
                    const meta = currentMeta[c];
                    if (el && meta) el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
                }
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            lastTsRef.current = null;
        };
    }, [reduced]);

    const activate = useCallback((id, index) => {
        activeIdRef.current = id;
        hoveredColRef.current = index;
        setActiveId(id);
    }, []);

    const release = useCallback(() => {
        activeIdRef.current = null;
        hoveredColRef.current = -1;
        setActiveId(null);
    }, []);

    const handlePointerMove = useCallback(
        e => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            if (parallax > 0 && !reduced) {
                pointerRef.current = {
                    x: (e.clientX - rect.left) / rect.width - 0.5,
                    y: (e.clientY - rect.top) / rect.height - 0.5
                };
            }
            const hit = document.elementFromPoint(e.clientX, e.clientY);
            const tile = hit && hit.closest ? hit.closest('[data-tile-id]') : null;
            if (!tile) return;
            const id = tile.dataset.tileId;
            if (id === activeIdRef.current) return;
            activeIdRef.current = id;
            hoveredColRef.current = Number(tile.dataset.col);
            setActiveId(id);
        },
        [parallax, reduced]
    );

    const handlePointerLeaveWall = useCallback(() => {
        wallHoveredRef.current = false;
        pointerRef.current = { x: 0, y: 0 };
        release();
    }, [release]);

    const cssVars = useMemo(
        () => ({
            '--dw-tile-w': `${tileWidth}px`,
            '--dw-tile-h': `${tileHeight}px`,
            '--dw-gap': `${gap}px`,
            '--dw-radius': `${radius}px`,
            '--dw-perspective': `${perspective}px`,
            '--dw-lift': `${lift}px`,
            '--dw-dim': dim,
            '--dw-gray': grayscale ? 1 : 0,
            '--dw-overlay': overlayColor,
            '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
            ...style
        }),
        [tileWidth, tileHeight, gap, radius, perspective, lift, dim, grayscale, overlayColor, fade, style]
    );

    const renderTile = (item, id, colIndex) => {
        const inner = (
            <span className="drift-wall__inner">
                {item.content ? (
                    item.content
                ) : item.image ? (
                    <img src={item.image} alt={item.title ?? ''} loading="lazy" decoding="async" draggable={false} />
                ) : (
                    <StudioSprintTileContent item={item} />
                )}
                <span className="drift-wall__overlay" aria-hidden="true" />
            </span>
        );

        const commonProps = {
            className: `drift-wall__tile${activeId === id ? ' is-active' : ''}`,
            'data-tile-id': id,
            'data-col': colIndex,
            onFocus: () => activate(id, colIndex),
            onBlur: release
        };

        if (item.href) {
            return (
                <a key={id} href={item.href} target="_blank" rel="noreferrer noopener" {...commonProps}>
                    {inner}
                </a>
            );
        }
        return (
            <div key={id} tabIndex={0} role="button" aria-label={item.title ?? 'tile'} {...commonProps}>
                {inner}
            </div>
        );
    };

    const rootClass = ['drift-wall', reduced ? 'drift-wall--reduced' : '', className].filter(Boolean).join(' ');

    return (
        <div
            ref={containerRef}
            className={rootClass}
            style={cssVars}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => {
                wallHoveredRef.current = true;
            }}
            onPointerLeave={handlePointerLeaveWall}
            role="group"
            aria-label="StudioSprint Drifting Interface Wall"
        >
            <div ref={planeRef} className="drift-wall__plane">
                {columnItems.map((col, c) => {
                    const meta = columnMeta[c];
                    const copies = Array.from({ length: meta.copies });
                    return (
                        <div className="drift-wall__col" key={`col-${c}`}>
                            <div className="drift-wall__track" ref={el => (trackRefs.current[c] = el)}>
                                {copies.map((_, copyIndex) =>
                                    col.map((item, itemIndex) => renderTile(item, `${c}-${copyIndex}-${itemIndex}`, c))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(DriftWall);
