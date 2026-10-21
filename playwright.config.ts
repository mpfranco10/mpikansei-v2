import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4321/mpikansei/', headless: true },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --ignore-lock', url: 'http://127.0.0.1:4321/mpikansei/', reuseExistingServer: !process.env.CI },
});
