import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn('animate-pulse rounded-xl bg-muted/80', className)}
            {...props}
        />
    );
}

export { Skeleton };
