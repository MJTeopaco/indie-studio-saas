import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [agreed, setAgreed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Create Account — StudioSprint" />

            <div className="mb-6 text-center">
                <h2 className="font-heading text-2xl font-bold text-text-primary">Create free account</h2>
                <p className="font-sans text-sm text-text-muted mt-1">Sign up to manage your team and projects</p>
            </div>

            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => alert('Google authentication placeholder')}
                    className="w-full flex items-center justify-center rounded-lg border border-surface-border bg-transparent px-4 py-2.5 text-sm font-heading font-semibold text-text-primary hover:bg-brand-10 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.16-3.16C17.47 1.7 14.94 1 12 1 7.24 1 3.2 3.73 1.24 7.74l3.77 2.92C5.9 7.6 8.7 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.98 3.39-4.89 3.39-8.54z" />
                        <path fill="#FBBC05" d="M5.01 10.66C4.77 11.39 4.63 12.18 4.63 13s.14 1.61.38 2.34l-3.77 2.92C.44 16.71 0 14.91 0 13s.44-3.71 1.24-5.26l3.77 2.92z" />
                        <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.08-4.3 1.08-3.3 0-6.1-2.56-7.09-5.62L1.24 16.63C3.2 20.27 7.24 23 12 23z" />
                    </svg>
                    Sign up with Google
                </button>
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface-elevated px-2 text-text-muted">or</span>
                </div>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full text-sm font-sans"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        placeholder="Your Name"
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full text-sm font-sans"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        placeholder="Email address"
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <div className="relative mt-1">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="block w-full pr-10 text-sm font-sans"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            placeholder="Password (min. 8 characters)"
                        />
                        <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-brand" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <div className="relative mt-1">
                        <TextInput
                            id="password_confirmation"
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="block w-full pr-10 text-sm font-sans"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                            placeholder="Confirm Password"
                        />
                        <button type="button" onClick={() => setShowPasswordConfirmation(value => !value)} className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-brand" aria-label={showPasswordConfirmation ? 'Hide password' : 'Show password'}>
                            {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4 flex items-center">
                    <Checkbox
                        name="terms"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        required
                    />
                    <span className="ms-2 text-sm text-text-muted font-sans">
                        I agree to the{' '}
                        <a
                            href="#"
                            className="text-brand hover:underline font-semibold"
                            onClick={(e) => e.preventDefault()}
                        >
                            Privacy Policy & Terms and Conditions
                        </a>
                    </span>
                </div>

                <div className="mt-6">
                    <PrimaryButton className="w-full justify-center py-2.5 text-xs font-heading font-semibold uppercase tracking-widest" disabled={processing || !agreed}>
                        Sign up
                    </PrimaryButton>
                </div>

                <div className="mt-6 text-center text-sm font-sans text-text-muted">
                    Already have an account?{' '}
                    <Link
                        href={route('login')}
                        className="text-brand hover:underline font-semibold"
                    >
                        Login now
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
