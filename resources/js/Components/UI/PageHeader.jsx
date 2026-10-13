import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageHeader — Shared workspace module page header primitive.
 * Matches compact design language across StudioSprint.
 */
export function PageHeader({
    title,
    subtitle,
    action,
    className,
    children,
    ...props
}) {
    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-[18px]',
                className
            )}
            {...props}
        >
            <div className="min-w-0">
                <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
            {action && (
                <div className="flex items-center gap-2 shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

export default PageHeader;
