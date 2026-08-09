import { useState, useMemo } from 'react';
import InputError from '@/Components/InputError';

export default function StepTwoSkills({ data, setData, errors, skills }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Flat list of all skills for searching
    const allSkills = useMemo(() => {
        let flat = [];
        Object.values(skills).forEach(categorySkills => {
            flat = [...flat, ...categorySkills];
        });
        return flat;
    }, [skills]);

    // Filtered skills grouped by category
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return skills;
        
        const filtered = {};
        Object.entries(skills).forEach(([category, categorySkills]) => {
            const matches = categorySkills.filter(skill => 
                skill.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (matches.length > 0) {
                filtered[category] = matches;
            }
        });
        return filtered;
    }, [skills, searchTerm]);

    const handleToggleSkill = (skill) => {
        const isSelected = data.skills.some(s => s.id === skill.id);
        
        if (isSelected) {
            setData('skills', data.skills.filter(s => s.id !== skill.id));
        } else {
            setData('skills', [...data.skills, { 
                id: skill.id, 
                name: skill.name, 
                category: skill.category,
                proficiency_level: 3 // Default intermediate
            }]);
        }
    };

    const handleProficiencyChange = (skillId, level) => {
        setData('skills', data.skills.map(s => 
            s.id === skillId ? { ...s, proficiency_level: parseInt(level) } : s
        ));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">The Vector Skill Matrix</h2>
                <p className="mt-1 text-text-muted">Select your skills and set your proficiency to help us match you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[500px]">
                {/* Left Column: Discovery */}
                <div className="flex flex-col border border-surface-border rounded-xl bg-surface overflow-hidden">
                    <div className="p-4 border-b border-surface-border">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border-surface-border bg-surface-elevated py-2 pl-10 pr-3 text-text-primary focus:border-brand focus:ring-brand sm:text-sm"
                                placeholder="Search skills..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {Object.entries(filteredCategories).map(([category, categorySkills]) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 sticky top-0 bg-surface py-1">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {categorySkills.map(skill => {
                                        const isSelected = data.skills.some(s => s.id === skill.id);
                                        return (
                                            <label key={skill.id} className="flex items-center space-x-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSkill(skill)}
                                                    className="h-4 w-4 rounded border-surface-border bg-surface text-brand focus:ring-brand focus:ring-offset-surface"
                                                />
                                                <span className={`text-sm transition-colors ${isSelected ? 'text-text-primary font-medium' : 'text-text-muted group-hover:text-text-primary'}`}>
                                                    {skill.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {Object.keys(filteredCategories).length === 0 && (
                            <div className="text-center py-8 text-text-muted text-sm">
                                No skills found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: The Matrix (Selected Skills) */}
                <div className="flex flex-col border border-surface-border rounded-xl bg-surface-elevated overflow-hidden">
                    <div className="p-4 border-b border-surface-border bg-surface">
                        <h3 className="font-semibold text-text-primary">Selected Skills ({data.skills.length})</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {data.skills.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm text-center px-4">
                                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                Select skills from the left to set your proficiency levels.
                            </div>
                        ) : (
                            data.skills.map(skill => (
                                <div key={skill.id} className="bg-surface p-4 rounded-lg border border-surface-border">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="font-medium text-text-primary">{skill.name}</div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleToggleSkill(skill)}
                                            className="text-text-muted hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="1"
                                            value={skill.proficiency_level}
                                            onChange={(e) => handleProficiencyChange(skill.id, e.target.value)}
                                            className="w-full accent-brand"
                                        />
                                        <div className="flex justify-between text-xs text-text-muted mt-2">
                                            <span>1 - Beginner</span>
                                            <span className="font-medium text-brand">{skill.proficiency_level}</span>
                                            <span>5 - Expert</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            <InputError message={errors.skills} className="mt-2" />
        </div>
    );
}
