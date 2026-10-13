import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Segments — Segmented control tab/pill group primitive.
 * Semantic tokens only, compact 10-11px UI text.
 */
export function Segments({
    options = [],
    value,
    onChange,
    className,
    ...props
}) {
    return (
        <div
            role="tablist"
            className={cn(
                'inline-flex items-center p-1 rounded-xl bg-[var(--secondary)]/80 border border-[var(--border)] text-xs select-none max-w-full overflow-x-auto',
                className
            )}
            {...props}
        >
            {options.map((opt) => {
                const optValue = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                const count = typeof opt === 'object' ? opt.count : undefined;
                const isSelected = value === optValue;

                return (
                    <button
                        key={optValue}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => onChange && onChange(optValue)}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-heading font-medium transition-all cursor-pointer whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--primary)]',
                            isSelected
                                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-2xs font-semibold'
                                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        )}
                    >
                        <span>{optLabel}</span>
                        {count !== undefined && (
                            <span
                                className={cn(
                                    'text-[9px] px-1.5 py-0.2 rounded-full font-mono',
                                    isSelected
                                        ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                                        : 'bg-[var(--secondary)]/60 text-[var(--muted-foreground)]'
                                )}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default Segments;
