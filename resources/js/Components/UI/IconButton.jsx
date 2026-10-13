import React from 'react';
import { cn } from '@/lib/utils';

/**
 * IconButton — Compact accessible button primitive for icon actions.
 */
export function IconButton({
    className,
    variant = 'ghost',
    size = 'sm',
    disabled = false,
    type = 'button',
    children,
    ...props
}) {
    const variantStyles = {
        ghost: 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
        outline: 'border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
        secondary: 'bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--secondary)]/80',
        primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90',
    }[variant] || '';

    const sizeStyles = {
        xs: 'h-6 w-6 rounded-md text-[11px]',
        sm: 'h-7 w-7 rounded-lg text-xs',
        md: 'h-8 w-8 rounded-lg text-sm',
    }[size] || 'h-7 w-7 rounded-lg text-xs';

    return (
        <button
            type={type}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[var(--ring)]',
                sizeStyles,
                variantStyles,
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export default IconButton;
