import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    // Integrations return plugin arrays with the installed Vite version.
    // Flatten them so Vite executes their build hooks instead of falling back
    // to looking for a standalone index.html entry.
    plugins: [
        ...tailwindcss(),
        ...laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        ...react(),
    ],
    // Keep the Laravel entry explicit. The currently installed Vite/plugin
    // combination otherwise places it in `rolldownOptions`, while this build
    // still resolves entries from Rollup's `rollupOptions`.
    build: {
        rollupOptions: {
            input: 'resources/js/app.jsx',
        },
    },
});
