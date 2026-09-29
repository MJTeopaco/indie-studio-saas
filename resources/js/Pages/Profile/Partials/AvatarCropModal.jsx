import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Loader2 } from 'lucide-react';

export default function AvatarCropModal({
    isOpen,
    imageSrc,
    onClose,
    onSave,
}) {
    if (!isOpen || !imageSrc) return null;

    const canvasRef = useRef(null);
    const [imageObj, setImageObj] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [isProcessing, setIsProcessing] = useState(false);

    // Canvas dimensions
    const CANVAS_SIZE = 340;
    const CROP_RADIUS = 130; // Radius of crop circle

    // Load image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImageObj(img);
            // Center the image initially
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Prevent body scroll when modal is active
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Draw on canvas whenever state changes
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageObj) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const centerX = CANVAS_SIZE / 2;
        const centerY = CANVAS_SIZE / 2;

        ctx.save();
        // Translate to center for rotation & pan
        ctx.translate(centerX + position.x, centerY + position.y);
        ctx.rotate((rotation * Math.PI) / 180);

        // Calculate aspect-ratio fit
        const baseWidth = Math.max(CROP_RADIUS * 2, (imageObj.width / imageObj.height) * (CROP_RADIUS * 2));
        const baseHeight = (baseWidth / imageObj.width) * imageObj.height;
        const drawWidth = baseWidth * scale;
        const drawHeight = baseHeight * scale;

        ctx.drawImage(
            imageObj,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
        ctx.restore();

        // Draw dark vignette overlay with transparent circular hole
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.beginPath();
        ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.arc(centerX, centerY, CROP_RADIUS, 0, Math.PI * 2, true);
        ctx.fill();

        // Draw crisp circular border
        ctx.beginPath();
        ctx.arc(centerX, centerY, CROP_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = '#0284c7'; // brand color
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw delicate alignment crosshairs inside crop circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(centerX - CROP_RADIUS, centerY);
        ctx.lineTo(centerX + CROP_RADIUS, centerY);
        ctx.moveTo(centerX, centerY - CROP_RADIUS);
        ctx.lineTo(centerX, centerY + CROP_RADIUS);
        ctx.stroke();

        ctx.restore();
    }, [imageObj, scale, position, rotation]);

    useEffect(() => {
        draw();
    }, [draw]);

    // Mouse & Touch Drag Handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    // Export cropped image as Blob
    const handleConfirm = () => {
        if (!imageObj) return;
        setIsProcessing(true);

        const exportCanvas = document.createElement('canvas');
        const EXPORT_SIZE = 400; // High resolution square export
        exportCanvas.width = EXPORT_SIZE;
        exportCanvas.height = EXPORT_SIZE;
        const expCtx = exportCanvas.getContext('2d');

        const centerX = EXPORT_SIZE / 2;
        const centerY = EXPORT_SIZE / 2;
        const exportRatio = EXPORT_SIZE / (CROP_RADIUS * 2);

        expCtx.save();
        expCtx.translate(centerX + position.x * exportRatio, centerY + position.y * exportRatio);
        expCtx.rotate((rotation * Math.PI) / 180);

        const baseWidth = Math.max(CROP_RADIUS * 2, (imageObj.width / imageObj.height) * (CROP_RADIUS * 2));
        const baseHeight = (baseWidth / imageObj.width) * imageObj.height;
        const drawWidth = baseWidth * scale * exportRatio;
        const drawHeight = baseHeight * scale * exportRatio;

        expCtx.drawImage(
            imageObj,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
        expCtx.restore();

        exportCanvas.toBlob(
            (blob) => {
                setIsProcessing(false);
                if (blob) {
                    onSave(blob);
                }
            },
            'image/jpeg',
            0.92
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-md bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                            Crop Profile Picture
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Drag to reposition and zoom to adjust your passport avatar.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Canvas Workspace */}
                <div className="p-6 flex flex-col items-center justify-center bg-slate-900/10 dark:bg-slate-950/50 select-none">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="cursor-move rounded-xl shadow-inner bg-slate-950/90 touch-none"
                    />

                    {/* Controls Bar: Zoom & Rotate */}
                    <div className="w-full mt-5 px-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <ZoomOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                                type="range"
                                min="0.8"
                                max="3.0"
                                step="0.05"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand"
                            />
                            <ZoomIn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>

                        <button
                            type="button"
                            onClick={handleRotate}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-brand hover:border-brand/40 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Rotate 90°"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Rotate</span>
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Apply & Upload</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
