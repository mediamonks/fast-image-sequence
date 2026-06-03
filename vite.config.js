import {defineConfig} from 'vite'
import {resolve} from 'path'
import dts from "vite-plugin-dts";

export default defineConfig({
    target: 'esnext',
    plugins: [
        dts({
            include: ['src/**/*'],
            exclude: ['**/*.spec.ts', '**/*.test.ts'],
            // Strip the `src/` prefix from emitted declarations so they land at
            // dist/index.d.ts, dist/react/index.d.ts, dist/lib/*.d.ts — the layout the
            // package.json `exports` map (and preparePublish re-rooting) expect. Without
            // this, the plugin derives the entry root as the project root and emits to
            // dist/src/..., which breaks type resolution for consumers.
            entryRoot: 'src',
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
            formats: ['es'],
        },
        rolldownOptions: {
            // Externalize react/react-dom AND all their subpaths. The exact-string form
            // ['react', 'react-dom'] does NOT match 'react/jsx-runtime', which the automatic
            // JSX transform ("jsx": "react-jsx") emits. Leaving it unmatched makes rolldown
            // inline React's CommonJS jsx-runtime, whose internal require("react") is rewritten
            // to a shim that throws ("Calling `require` for \"react\" ...") when the ESM output
            // is loaded without a bundler (e.g. a Vite dev server). The regexes keep every
            // react / react-dom import — bare or subpath — external.
            external: [/^react($|\/)/, /^react-dom($|\/)/],
        },
    }
})