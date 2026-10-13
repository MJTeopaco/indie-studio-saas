import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import OnboardingSplitLayout from '@/Components/Onboarding/OnboardingSplitLayout';
import OnboardingPreviewShowcase from '@/Components/Onboarding/OnboardingPreviewShowcase';
import StepOneIdentity from '@/Components/Onboarding/StepOneIdentity';
import StepTwoSkills from '@/Components/Onboarding/StepTwoSkills';
import StepThreeLogistics from '@/Components/Onboarding/StepThreeLogistics';
import WizardNavigation from '@/Components/Onboarding/WizardNavigation';

export default function Wizard({ positions = [], skills = {} }) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || 'Developer';

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

    const stepHeadings = {
        1: {
            title: `Welcome, ${userName}!`,
            subtitle: (
                <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-brand uppercase tracking-wider font-mono">
                        Core Professional Identity
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Set up your developer passport for AI capacity matching and team coordination.
                    </p>
                </div>
            )
        },
        2: {
            title: "The Vector Skill Matrix",
            subtitle: "Rate your technical proficiency to power GNN recommendation models."
        },
        3: {
            title: "Availability & Logistics",
            subtitle: "Define your weekly capacity and timezone for automated sprint scheduling."
        }
    };

    return (
        <OnboardingSplitLayout
            title={stepHeadings[currentStep].title}
            subtitle={stepHeadings[currentStep].subtitle}
            currentStep={currentStep}
            totalSteps={3}
            showStepper={true}
            rightContent={
                <OnboardingPreviewShowcase
                    step={currentStep}
                    data={data}
                    positions={positions}
                />
            }
        >
            <Head title="Developer Passport Setup — StudioSprint" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="min-h-[280px]">
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
                    canSubmit={Boolean(data.max_hours_per_week && data.timezone)}
                />
            </form>
        </OnboardingSplitLayout>
    );
}
