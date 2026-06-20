export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-md border border-transparent bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-all duration-150 ease-in-out hover:bg-brand-light hover:scale-[1.02] focus:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:bg-brand-dark ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
