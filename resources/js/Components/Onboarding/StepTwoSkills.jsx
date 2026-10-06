import React, { useState, useMemo } from 'react';
import InputError from '@/Components/InputError';
import { 
    Search, 
    X, 
    Check, 
    ArrowLeft, 
    ChevronRight, 
    Layers, 
    Code2, 
    Palette, 
    Gamepad2, 
    Volume2, 
    Sparkles
} from 'lucide-react';

export default function StepTwoSkills({ data, setData, errors, skills = {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);

    // Available category names
    const categoryNames = useMemo(() => Object.keys(skills), [skills]);

    // Category Icon Mapper
    const getCategoryIcon = (category) => {
        const cat = category.toLowerCase();
        if (cat.includes('program') || cat.includes('code') || cat.includes('engine')) return Code2;
        if (cat.includes('art') || cat.includes('animation') || cat.includes('visual')) return Palette;
        if (cat.includes('design') || cat.includes('mechanic')) return Gamepad2;
        if (cat.includes('sound') || cat.includes('audio') || cat.includes('music')) return Volume2;
        return Layers;
    };

    // Flat list of all skills for searching
    const allSkills = useMemo(() => {
        let flat = [];
        Object.entries(skills).forEach(([category, categorySkills]) => {
            if (Array.isArray(categorySkills)) {
                categorySkills.forEach(s => {
                    flat.push({ ...s, category });
                });
            }
        });
        return flat;
    }, [skills]);

    // Search filtered skills
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return allSkills.filter(skill => 
            skill.name.toLowerCase().includes(term) || 
            skill.category.toLowerCase().includes(term)
        );
    }, [allSkills, searchTerm]);

    // Skill toggle handler (defaults to level 3)
    const handleToggleSkill = (skill) => {
        const isSelected = data.skills.some(s => s.id === skill.id);
        if (isSelected) {
            setData('skills', data.skills.filter(s => s.id !== skill.id));
        } else {
            setData('skills', [...data.skills, { 
                id: skill.id, 
                name: skill.name, 
                category: skill.category,
                proficiency_level: 3 // Default Intermediate
            }]);
        }
    };

    // Inline proficiency rating change
    const handleProficiencyChange = (skillId, level) => {
        setData('skills', data.skills.map(s => 
            s.id === skillId ? { ...s, proficiency_level: parseInt(level, 10) } : s
        ));
    };

    // Calculate count of selected skills per category
    const selectedCountByCategory = useMemo(() => {
        const counts = {};
        data.skills.forEach(s => {
            counts[s.category] = (counts[s.category] || 0) + 1;
        });
        return counts;
    }, [data.skills]);

    // Average rating
    const avgProficiency = useMemo(() => {
        if (!data.skills.length) return '0.0';
        const sum = data.skills.reduce((acc, s) => acc + (s.proficiency_level || 3), 0);
        return (sum / data.skills.length).toFixed(1);
    }, [data.skills]);

    // Proficiency level definitions
    const proficiencyLabels = {
        1: 'Novice (Foundational)',
        2: 'Beginner (Practical basics)',
        3: 'Intermediate (Autonomous)',
        4: 'Advanced (Specialized)',
        5: 'Master (Domain authority)'
    };

    // Skills in the currently selected category drill-down
    const activeCategorySkills = useMemo(() => {
        if (!selectedCategory) return [];
        return skills[selectedCategory] || [];
    }, [skills, selectedCategory]);

    const activeSelectedCount = selectedCategory ? (selectedCountByCategory[selectedCategory] || 0) : 0;
    const ActiveCategoryIcon = selectedCategory ? getCategoryIcon(selectedCategory) : Layers;

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Global Search Bar with Live Match Counter */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    placeholder="Search 96 skills (e.g. Unity, C#, Vulkan, Blender, PyTorch)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-24 py-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs transition-all"
                />
                {searchTerm ? (
                    <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                ) : (
                    <span className="absolute inset-y-0 right-3 flex items-center text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 my-auto h-6 rounded-md">
                        {allSkills.length} total
                    </span>
                )}
            </div>

            {/* Selected Skills Summary Banner & Quick Review Switch */}
            {data.skills.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {data.skills.length} {data.skills.length === 1 ? 'Skill' : 'Skills'} Selected
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-mono text-amber-500 font-semibold">
                            Avg {avgProficiency} ★
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowSelectedOnly(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            showSelectedOnly
                                ? 'bg-brand text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-brand'
                        }`}
                    >
                        {showSelectedOnly ? 'Back to Selection' : 'Review Selected'}
                    </button>
                </div>
            )}

            {/* Mode A: Selected Skills Review View */}
            {showSelectedOnly ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Your Selected Stack ({data.skills.length})
                        </span>
                        <button
                            type="button"
                            onClick={() => setData('skills', [])}
                            className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                        {data.skills.map((skill) => (
                            <div
                                key={skill.id}
                                className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-brand/40 dark:border-brand/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                            {skill.name}
                                        </p>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {skill.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Inline 1-5 Segmented Rating */}
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                                        Level:
                                    </span>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                        {[1, 2, 3, 4, 5].map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => handleProficiencyChange(skill.id, lvl)}
                                                title={proficiencyLabels[lvl]}
                                                className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-bold transition-all ${
                                                    skill.proficiency_level >= lvl
                                                        ? 'bg-brand text-white shadow-xs'
                                                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleToggleSkill(skill)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                        title="Remove skill"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : searchTerm ? (
                /* Mode B: Instant Search Filter Results Across All Categories */
                <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Search Results ({searchResults.length})
                        </span>
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="text-xs text-brand hover:underline font-medium"
                        >
                            Reset search
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                        {searchResults.map((skill) => {
                            const selectedEntry = data.skills.find(s => s.id === skill.id);
                            const isSelected = !!selectedEntry;
                            const level = selectedEntry ? selectedEntry.proficiency_level : 3;

                            return (
                                <div
                                    key={skill.id}
                                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        isSelected
                                            ? 'bg-brand/5 dark:bg-brand/10 border-brand/40 dark:border-brand/40 shadow-xs'
                                            : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div 
                                        className="flex items-center gap-2.5 cursor-pointer select-none"
                                        onClick={() => handleToggleSkill(skill)}
                                    >
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                            isSelected 
                                                ? 'bg-brand text-white shadow-2xs' 
                                                : 'border border-slate-300 dark:border-slate-600 text-transparent'
                                        }`}>
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                {skill.name}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                {skill.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Inline Proficiency Pill */}
                                    {isSelected && (
                                        <div className="flex items-center gap-2 self-end sm:self-auto animate-in fade-in zoom-in-95 duration-150">
                                            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                                                Level:
                                            </span>
                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                {[1, 2, 3, 4, 5].map((lvl) => (
                                                    <button
                                                        key={lvl}
                                                        type="button"
                                                        onClick={() => handleProficiencyChange(skill.id, lvl)}
                                                        title={proficiencyLabels[lvl]}
                                                        className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-bold transition-all ${
                                                            level >= lvl
                                                                ? 'bg-brand text-white shadow-xs'
                                                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {searchResults.length === 0 && (
                            <div className="py-12 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    No skills matching "{searchTerm}"
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Check for typos or try searching another game engine, language, or tool.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : selectedCategory ? (
                /* Mode C-2: Category Skills Drill-Down View (Inside the SAME Container) */
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
                    {/* Top Navigation Bar with Back Option */}
                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory(null)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Back to Categories</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                {activeCategorySkills.length} skills
                            </span>
                            {activeSelectedCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand text-white shadow-2xs">
                                    {activeSelectedCount} selected
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Active Category Header */}
                    <div className="px-4 pt-3.5 pb-2 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <ActiveCategoryIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {selectedCategory}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                Select skills that match your experience and rate proficiency (1–5)
                            </p>
                        </div>
                    </div>

                    {/* Skill List with Instant Selection & Inline 1-5 Rating */}
                    <div className="p-3.5 pt-1 space-y-2 max-h-72 overflow-y-auto pr-1">
                        {activeCategorySkills.map((skill) => {
                            const selectedEntry = data.skills.find(s => s.id === skill.id);
                            const isSelected = !!selectedEntry;
                            const level = selectedEntry ? selectedEntry.proficiency_level : 3;

                            return (
                                <div
                                    key={skill.id}
                                    className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                        isSelected
                                            ? 'bg-brand/5 dark:bg-brand/10 border-brand/50 dark:border-brand/40 shadow-xs'
                                            : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    {/* Skill Click Toggle */}
                                    <div
                                        className="flex items-center gap-2.5 cursor-pointer select-none grow"
                                        onClick={() => handleToggleSkill(skill)}
                                    >
                                        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                                            isSelected
                                                ? 'bg-brand text-white shadow-2xs'
                                                : 'border border-slate-300 dark:border-slate-600 text-transparent'
                                        }`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            {skill.name}
                                        </span>
                                    </div>

                                    {/* Inline Tactile 1-5 Rating Selector */}
                                    {isSelected && (
                                        <div className="flex items-center gap-1.5 self-end sm:self-auto animate-in fade-in duration-150">
                                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                                Lvl:
                                            </span>
                                            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                                                {[1, 2, 3, 4, 5].map((lvl) => (
                                                    <button
                                                        key={lvl}
                                                        type="button"
                                                        onClick={() => handleProficiencyChange(skill.id, lvl)}
                                                        title={proficiencyLabels[lvl]}
                                                        className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                                                            level >= lvl
                                                                ? 'bg-brand text-white shadow-2xs'
                                                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Mode C-1: Category Directory View (First Display - Uses the ENTIRE Container) */
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
                                Skill Categories
                            </span>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                Click a category below to configure your technical skills
                            </p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                            {categoryNames.length} categories
                        </span>
                    </div>

                    {/* Full Container Category Cards List */}
                    <div className="p-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                        {categoryNames.map((cat) => {
                            const IconComponent = getCategoryIcon(cat);
                            const catSkills = skills[cat] || [];
                            const selectedInThisCat = selectedCountByCategory[cat] || 0;

                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className="w-full p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-brand/50 dark:hover:border-brand/40 flex items-center justify-between text-left transition-all duration-150 cursor-pointer group shadow-2xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                            selectedInThisCat > 0 
                                                ? 'bg-brand/10 text-brand' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-brand/10 group-hover:text-brand'
                                        }`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors truncate">
                                                {cat}
                                            </p>
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                                {catSkills.length} skills available
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {selectedInThisCat > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand text-white shadow-2xs">
                                                {selectedInThisCat} selected
                                            </span>
                                        )}
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Proficiency Levels Legend Guide */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>Rating Scale: 1 Novice → 3 Intermediate → 5 Master</span>
                <span className="font-mono text-[10px]">HeteroGNN Ready</span>
            </div>

            <InputError message={errors.skills} className="mt-1" />
        </div>
    );
}
