export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-md border border-brand-30 bg-transparent px-4 py-2 text-xs font-heading font-semibold uppercase tracking-widest text-brand shadow-sm transition duration-150 ease-in-out hover:bg-brand-10 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
