import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function PortaledPopover({ 
    isOpen, 
    onClose, 
    triggerRef, 
    children, 
    align = 'left', // left, center, right
    offsetY = 8,
    className = "" 
}) {
    const [coords, setCoords] = useState({ top: -9999, left: -9999 });
    const [flipped, setFlipped] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !triggerRef?.current) return;

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            
            // Assume dropdown height approx 250px
            const estimatedHeight = 250;
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldFlip = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
            
            setFlipped(shouldFlip);
            
            let left = rect.left;
            if (align === 'center') left = rect.left + rect.width / 2;
            else if (align === 'right') left = rect.right;
            
            setCoords({
                left,
                top: shouldFlip ? rect.top - offsetY : rect.bottom + offsetY,
            });
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, triggerRef, align, offsetY]);

    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target) &&
                triggerRef.current && !triggerRef.current.contains(event.target)) {
                onClose();
            }
        }
        function handleEscape(event) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen) return null;

    let transform = 'none';
    if (align === 'center') {
        transform = flipped ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
    } else if (align === 'right') {
        transform = flipped ? 'translate(-100%, -100%)' : 'translate(-100%, 0)';
    } else {
        transform = flipped ? 'translateY(-100%)' : 'none';
    }

    return createPortal(
        <div 
            ref={popoverRef}
            className={`fixed z-[9999] ${className}`}
            style={{ 
                left: coords.left, 
                top: coords.top,
                transform,
            }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
}
