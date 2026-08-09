import { defineConfig } from 'vite';

export default defineConfig({
  // Use the repo root's port neighbor so the rest of the Python files aren't disturbed.
  server: {
    port: 5173,
    open: false,
  },
});
