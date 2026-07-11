/**
 * ApplicationLogo — Vaultera Labs brand logo component.
 *
 * Props:
 *   variant  "symbol" | "vertical" | "horizontal"  (default: "symbol")
 *   className  Additional CSS classes for sizing (e.g. "h-8", "h-12")
 *
 * SVG files live in /public/brand/ and are PLACEHOLDER assets.
 * <!-- PLACEHOLDER: Replace SVG files in public/brand/ with final Vaultera Labs assets -->
 */
export default function ApplicationLogo({ variant = 'symbol', className = 'h-8', ...props }) {
    const srcMap = {
        symbol:     '/brand/vaultera-symbol.svg',
        vertical:   '/brand/vaultera-logo-vertical.svg',
        horizontal: '/brand/vaultera-logo-horizontal.svg',
    };

    const altMap = {
        symbol:     'Vaultera Labs',
        vertical:   'Vaultera Labs',
        horizontal: 'Vaultera Labs',
    };

    const src = srcMap[variant] ?? srcMap.symbol;
    const alt = altMap[variant] ?? 'Vaultera Labs';

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            {...props}
        />
    );
}
