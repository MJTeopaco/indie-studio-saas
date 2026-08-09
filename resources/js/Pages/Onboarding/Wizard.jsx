import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import WizardCard from '@/Components/Onboarding/WizardCard';
import ProgressIndicator from '@/Components/Onboarding/ProgressIndicator';
import StepOneIdentity from '@/Components/Onboarding/StepOneIdentity';
import StepTwoSkills from '@/Components/Onboarding/StepTwoSkills';
import StepThreeLogistics from '@/Components/Onboarding/StepThreeLogistics';
import WizardNavigation from '@/Components/Onboarding/WizardNavigation';

export default function Wizard({ positions, skills }) {
    const [currentStep, setCurrentStep] = useState(1);

    const { data, setData, post, processing, errors, clearErrors, setError } = useForm({
        position_id: '',
        experience_years: '',
        open_to_invitations: true,
        skills: [],
        max_hours_per_week: '',
        timezone: '',
    });

    const handleNext = () => {
        clearErrors();
        let hasErrors = false;

        if (currentStep === 1) {
            if (!data.position_id) {
                setError('position_id', 'Please select a primary role.');
                hasErrors = true;
            }
            if (data.experience_years === '' || data.experience_years === null) {
                setError('experience_years', 'Please enter your experience in years.');
                hasErrors = true;
            } else if (data.experience_years < 0 || data.experience_years > 40) {
                setError('experience_years', 'Experience must be between 0 and 40 years.');
                hasErrors = true;
            }
        } else if (currentStep === 2) {
            if (data.skills.length === 0) {
                setError('skills', 'Please select at least one skill.');
                hasErrors = true;
            } else {
                const invalidSkill = data.skills.find(s => s.proficiency_level < 1 || s.proficiency_level > 5);
                if (invalidSkill) {
                    setError('skills', 'All selected skills must have a valid proficiency rating.');
                    hasErrors = true;
                }
            }
        }

        if (!hasErrors) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        
        // Final client validation for Step 3
        let hasErrors = false;
        if (!data.max_hours_per_week) {
            setError('max_hours_per_week', 'Please select your weekly capacity.');
            hasErrors = true;
        }
        if (!data.timezone) {
            setError('timezone', 'Please select your timezone.');
            hasErrors = true;
        }

        if (!hasErrors) {
            post(route('onboarding.store'));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Developer Passport Setup" />

            <div className="py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
                <WizardCard currentStep={currentStep}>
                    <ProgressIndicator currentStep={currentStep} totalSteps={3} />
                    
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="min-h-[300px]">
                            {currentStep === 1 && (
                                <StepOneIdentity 
                                    data={data} 
                                    setData={setData} 
                                    errors={errors} 
                                    positions={positions} 
                                />
                            )}
                            {currentStep === 2 && (
                                <StepTwoSkills 
                                    data={data} 
                                    setData={setData} 
                                    errors={errors} 
                                    skills={skills} 
                                />
                            )}
                            {currentStep === 3 && (
                                <StepThreeLogistics 
                                    data={data} 
                                    setData={setData} 
                                    errors={errors} 
                                />
                            )}
                        </div>

                        <WizardNavigation 
                            currentStep={currentStep} 
                            totalSteps={3}
                            onNext={handleNext}
                            onBack={handleBack}
                            processing={processing}
                        />
                    </form>
                </WizardCard>
            </div>
        </AuthenticatedLayout>
    );
}
