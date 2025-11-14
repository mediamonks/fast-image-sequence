import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@mediamonks/fast-image-sequence': resolve(__dirname, '../../src/index.ts'),
            '@mediamonks/fast-image-sequence/react': resolve(__dirname, '../../src/react/index.ts'),
        },
    },
});
