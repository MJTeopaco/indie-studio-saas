import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#7C3AED',  // violet-600
                    light: '#8B5CF6',    // violet-500
                    dark: '#6D28D9',     // violet-700
                    muted: '#EDE9FE',    // violet-100
                },
                surface: {
                    DEFAULT: '#0F172A',  // slate-950
                    elevated: '#1E293B', // slate-800
                    border: '#334155',   // slate-700
                },
                text: {
                    primary: '#F1F5F9',  // slate-100
                    muted: '#94A3B8',    // slate-400
                }
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
