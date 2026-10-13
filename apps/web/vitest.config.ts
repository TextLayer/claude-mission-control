import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Node 25+ ships its own global localStorage/sessionStorage, which is unusable
// without --localstorage-file and shadows happy-dom's (vitest only replaces
// pre-existing globals on its allowlist). Turn it off in test workers when the
// running Node knows the flag (22.4+).
const noNodeWebStorage = '--no-experimental-webstorage'

// Date-grouping assertions assume UTC. Set it here, in the main process, so it
// reaches every pool: forked workers inherit it, worker threads share it.
process.env.TZ = 'UTC'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    testTimeout: 10_000,
    hookTimeout: 10_000,
    setupFiles: ['./src/test-setup.ts'],
    execArgv: process.allowedNodeEnvironmentFlags.has(noNodeWebStorage) ? [noNodeWebStorage] : [],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.claude/**', '**/.worktrees/**'],
    server: {
      deps: {
        // @lobehub/fluent-emoji ships ESM with bare directory imports
        // (e.g., `export { default } from "./FluentEmoji"` pointing to a directory).
        // Node's ESM resolver rejects these. Inlining lets Vite resolve them.
        inline: ['@lobehub/fluent-emoji', '@lobehub/ui'],
      },
    },
  },
})
