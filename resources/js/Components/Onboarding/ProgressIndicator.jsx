export default function ProgressIndicator({ currentStep, totalSteps }) {
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

    return (
        <div className="mb-8">
            <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">
                Step {currentStep} of {totalSteps}
            </h3>
            <div className="flex items-center space-x-2">
                {steps.map((step) => (
                    <div
                        key={step}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ease-in-out ${
                            step <= currentStep ? 'bg-brand' : 'bg-surface-border'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
