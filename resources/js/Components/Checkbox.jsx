export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded-sm border-gray-300 text-brand shadow-xs focus:ring-brand ' +
                className
            }
        />
    );
}
