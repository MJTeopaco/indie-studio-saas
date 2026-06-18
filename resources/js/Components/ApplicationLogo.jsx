export default function ApplicationLogo(props) {
    return (
        <div {...props} className={`font-bold tracking-tight ${props.className || 'text-2xl'}`}>
            <span className="text-text-primary">Studio</span>
            <span className="text-brand">Sprint</span>
        </div>
    );
}
