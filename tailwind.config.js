import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                // Vaultera Labs brand blue — #007CFF with full opacity tint scale
                brand: {
                    DEFAULT: '#007CFF',
                    light:   '#3396FF',  // hover state
                    dark:    '#0062CC',  // active / pressed
                    muted:   'rgba(0, 124, 255, 0.1)',
                    90: 'rgba(0, 124, 255, 0.9)',
                    80: 'rgba(0, 124, 255, 0.8)',
                    70: 'rgba(0, 124, 255, 0.7)',
                    60: 'rgba(0, 124, 255, 0.6)',
                    50: 'rgba(0, 124, 255, 0.5)',
                    40: 'rgba(0, 124, 255, 0.4)',
                    30: 'rgba(0, 124, 255, 0.3)',
                    20: 'rgba(0, 124, 255, 0.2)',
                    10: 'rgba(0, 124, 255, 0.1)',
                },
                // Dark slate surface system — mapped to CSS variables
                surface: {
                    DEFAULT: 'var(--color-surface-bg)',
                    elevated: 'var(--color-surface-elevated)',
                    border: 'var(--color-surface-border)',
                },
                text: {
                    primary: 'var(--color-text-primary)',
                    muted: 'var(--color-text-muted)',
                },
            },
            fontFamily: {
                // Montserrat — body / paragraphs / form help text
                sans:    ['Montserrat', ...defaultTheme.fontFamily.sans],
                // Poppins — headings / buttons / nav labels
                heading: ['Poppins',    ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms, typography],
};
