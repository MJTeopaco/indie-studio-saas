import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionHeader — Compact modal & panel section header primitive.
 */
export function SectionHeader({
    title,
    description,
    action,
    className,
    icon: Icon,
    ...props
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)]',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-2 min-w-0">
                {Icon && <Icon className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />}
                <div>
                    <h4 className="font-heading text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                        {title}
                    </h4>
                    {description && (
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

export default SectionHeader;
