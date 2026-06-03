import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        // The library is consumed here through a local `file:../..` link and lists
        // react/react-dom as externalized peer dependencies. Without deduping, react
        // could be resolved twice (from the repo root and from this example), which
        // breaks hooks at runtime ("Invalid hook call"). Force a single copy.
        dedupe: ['react', 'react-dom'],
    },
});
