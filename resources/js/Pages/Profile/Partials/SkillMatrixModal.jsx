import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { 
    X, 
    Search, 
    Star, 
    Check, 
    Plus, 
    Trash2, 
    Layers, 
    Code2, 
    Palette, 
    Gamepad2, 
    Volume2, 
    Sparkles, 
    Loader2 
} from 'lucide-react';
import { showToast } from '@/Components/SystemToast';

export default function SkillMatrixModal({ 
    isOpen, 
    onClose, 
    currentSkills = [], 
    availableSkills = {} 
}) {
    if (!isOpen) return null;

    const [selectedSkills, setSelectedSkills] = useState(() => 
        currentSkills.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category || 'General',
            proficiency_level: s.proficiency_level || 3,
        }))
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [saving, setSaving] = useState(false);

    // Prevent background scrolling when modal is active
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Available categories
    const categories = useMemo(() => {
        const cats = Object.keys(availableSkills);
        return ['All', ...cats];
    }, [availableSkills]);

    // Flat list of all available skills
    const flatSkillsList = useMemo(() => {
        let list = [];
        Object.entries(availableSkills).forEach(([cat, skills]) => {
            if (Array.isArray(skills)) {
                skills.forEach(s => {
                    list.push({ ...s, category: cat });
                });
            }
        });
        return list;
    }, [availableSkills]);

    // Category icon mapper
    const getCategoryIcon = (cat) => {
        const c = (cat || '').toLowerCase();
        if (c.includes('program') || c.includes('code') || c.includes('engine')) return Code2;
        if (c.includes('art') || c.includes('animation') || c.includes('visual')) return Palette;
        if (c.includes('design') || c.includes('mechanic')) return Gamepad2;
        if (c.includes('sound') || c.includes('audio') || c.includes('music')) return Volume2;
        return Layers;
    };

    // Filtered skills based on search and category
    const filteredAvailableSkills = useMemo(() => {
        return flatSkillsList.filter(s => {
            const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
            const matchesSearch = !searchTerm.trim() || 
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.category.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [flatSkillsList, selectedCategory, searchTerm]);

    const handleToggleSkill = (skill) => {
        const exists = selectedSkills.some(s => s.id === skill.id);
        if (exists) {
            setSelectedSkills(prev => prev.filter(s => s.id !== skill.id));
        } else {
            setSelectedSkills(prev => [...prev, {
                id: skill.id,
                name: skill.name,
                category: skill.category,
                proficiency_level: 3,
            }]);
        }
    };

    const handleLevelChange = (skillId, level) => {
        setSelectedSkills(prev => prev.map(s => 
            s.id === skillId ? { ...s, proficiency_level: Math.max(1, Math.min(5, level)) } : s
        ));
    };

    const handleSave = () => {
        setSaving(true);
        router.post(route('profile.skills.update'), {
            skills: selectedSkills.map(s => ({
                id: s.id,
                proficiency_level: s.proficiency_level,
            })),
        }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => {
                showToast('Member developer skill matrix saved successfully!', 'success');
                onClose();
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0] || 'Failed to save skill matrix. Please try again.';
                showToast(firstErr, 'error');
            },
        });
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-3xl bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-white dark:bg-[#0B0F17]">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand" />
                            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                                Edit Member Developer Skill Matrix
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Configure your technical proficiencies for Critical Path task assignment.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Category Filter (Clean wrapping without ugly scrollbars) */}
                <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800/80 space-y-3 bg-slate-50/70 dark:bg-slate-900/40 shrink-0">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search skills (e.g., Unity C#, HLSL, Blender, C++)..."
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-slate-400 shadow-xs"
                        />
                    </div>

                    {/* Category Filter Pills — Flex Wrap eliminates horizontal scrollbar completely */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-brand text-white shadow-xs font-semibold'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-brand/40 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body Content (Scrollable list of selected skills & available library) */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                    
                    {/* 1. Selected Skills List with 1-5 Star Ratings */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Selected Skills ({selectedSkills.length})
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Click stars to rate (1–5)
                            </span>
                        </div>

                        {selectedSkills.length === 0 ? (
                            <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                                <p className="text-xs text-slate-400">No skills selected yet. Click skills below to add to your matrix.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {selectedSkills.map(skill => (
                                    <div
                                        key={skill.id}
                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center justify-between gap-3 group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                {skill.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {skill.category}
                                            </p>
                                        </div>

                                        {/* Star Rating & Remove */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => handleLevelChange(skill.id, star)}
                                                        className="p-0.5 text-slate-300 dark:text-slate-600 hover:text-amber-400 transition-colors"
                                                        title={`Level ${star} of 5`}
                                                    >
                                                        <Star 
                                                            className={`w-3.5 h-3.5 ${
                                                                star <= skill.proficiency_level
                                                                    ? 'text-amber-400 fill-amber-400'
                                                                    : 'text-slate-300 dark:text-slate-700'
                                                            }`} 
                                                        />
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleSkill(skill)}
                                                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                title="Remove skill"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Available Skills Library */}
                    <div className="pt-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Available Skills Library
                            </span>
                            <span className="text-[11px] text-slate-400">
                                {filteredAvailableSkills.length} matches
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {filteredAvailableSkills.map(skill => {
                                const isSelected = selectedSkills.some(s => s.id === skill.id);
                                const IconComponent = getCategoryIcon(skill.category);

                                return (
                                    <button
                                        key={skill.id}
                                        type="button"
                                        onClick={() => handleToggleSkill(skill)}
                                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-brand/10 border-brand text-brand dark:text-cyan-400 font-semibold ring-1 ring-brand/30'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand/40 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <IconComponent className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                            <span className="truncate">{skill.name}</span>
                                        </div>

                                        <div className="shrink-0">
                                            {isSelected ? (
                                                <Check className="w-3.5 h-3.5 text-brand" />
                                            ) : (
                                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {selectedSkills.length} skills will be saved to your Passport.
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Save Skill Matrix</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
