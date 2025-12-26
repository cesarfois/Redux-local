import { defineConfig } from 'vite';

export default defineConfig({
    root: 'frontend',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        port: 5174,
        proxy: {
            '/api': {
                target: 'http://localhost:3002',
                changeOrigin: true,
            },
        },
    },
});
