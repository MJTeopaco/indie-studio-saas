import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function PortaledTooltip({ 
    children, 
    tooltipContent,
    offsetY = 8,
    className = "" 
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: -9999, left: -9999 });
    const [flipped, setFlipped] = useState(false);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!isHovered || !triggerRef?.current) return;

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            
            // For tooltip, default to showing ABOVE the trigger.
            const estimatedHeight = 100;
            const spaceAbove = rect.top;
            const shouldFlip = spaceAbove < estimatedHeight; // flip to show below if no space above
            
            setFlipped(shouldFlip);
            
            setCoords({
                left: rect.left + rect.width / 2, // always center
                top: shouldFlip ? rect.bottom + offsetY : rect.top - offsetY,
            });
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isHovered, offsetY]);

    return (
        <div 
            ref={triggerRef}
            className={`relative inline-flex items-center justify-center ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            
            {isHovered && tooltipContent && createPortal(
                <div 
                    className="fixed z-[9999] pointer-events-none"
                    style={{ 
                        left: coords.left, 
                        top: coords.top,
                        transform: flipped ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                    }}
                >
                    {tooltipContent}
                </div>,
                document.body
            )}
        </div>
    );
}
