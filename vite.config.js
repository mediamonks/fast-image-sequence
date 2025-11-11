import {defineConfig} from 'vite'
import {resolve} from 'path'
import dts from "vite-plugin-dts";

export default defineConfig({
    target: 'esnext',
    plugins: [
        dts({
            include: ['src/**/*'],
            exclude: ['**/*.spec.ts', '**/*.test.ts'],
        })
    ],
    build: {
        assetsInlineLimit: 409600,
        target: 'esnext',
        lib: {
            assetsInlineLimit: 409600,
            entry: {
                'fast-image-sequence': resolve(__dirname, 'src/index.ts'),
                'fast-image-sequence-react': resolve(__dirname, 'src/react/index.ts'),
            },
            name: "FastImageSequence",
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    }
})