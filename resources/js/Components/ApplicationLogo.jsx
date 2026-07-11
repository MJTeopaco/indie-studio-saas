/**
 * ApplicationLogo — Vaultera Labs brand logo component.
 *
 * Props:
 *   variant    "symbol" | "vertical" | "horizontal"  (default: "symbol")
 *   className  Additional CSS classes for sizing (e.g. "h-8", "h-12")
 */
export default function ApplicationLogo({ variant = 'symbol', className = 'h-8', ...props }) {
    // If the variant is 'symbol', we wrap the image and use CSS to display only the left-most square portion (the hexagon symbol)
    if (variant === 'symbol') {
        return (
            <div 
                className={`overflow-hidden relative flex items-center justify-start ${className}`} 
                {...props}
            >
                <img
                    src="/brand/vaultera-logo.png"
                    alt="Vaultera Labs"
                    className="h-full max-w-none object-cover object-left"
                    style={{ aspectRatio: '1024 / 278' }}
                />
            </div>
        );
    }

    // Otherwise, we show the full horizontal brand logo
    return (
        <img
            src="/brand/vaultera-logo.png"
            alt="Vaultera Labs"
            className={className}
            style={{ aspectRatio: '1024 / 278' }}
            {...props}
        />
    );
}
