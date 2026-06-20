export default function WizardCard({ children, currentStep }) {
    // Step 2 is wider to accommodate the two-column layout
    const maxWidthClass = currentStep === 2 ? 'max-w-4xl' : 'max-w-2xl';

    return (
        <div className={`w-full ${maxWidthClass} transition-all duration-300 ease-in-out`}>
            <div className="bg-surface-elevated border border-surface-border rounded-2xl shadow-2xl p-8 sm:p-10">
                {children}
            </div>
        </div>
    );
}
