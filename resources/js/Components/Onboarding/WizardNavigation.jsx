import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function WizardNavigation({ currentStep, totalSteps, onNext, onBack, processing }) {
    return (
        <div className="mt-10 pt-6 border-t border-surface-border flex items-center justify-between">
            {currentStep > 1 ? (
                <SecondaryButton type="button" onClick={onBack}>
                    Back
                </SecondaryButton>
            ) : (
                <div></div> // Empty div for flexbox spacing
            )}

            {currentStep < totalSteps ? (
                <PrimaryButton type="button" onClick={onNext}>
                    Next Step
                </PrimaryButton>
            ) : (
                <PrimaryButton 
                    type="submit" 
                    className="bg-brand hover:bg-brand-light focus:ring-brand py-3 px-6 text-base"
                    disabled={processing}
                >
                    Complete Profile & Enter Dashboard
                </PrimaryButton>
            )}
        </div>
    );
}
