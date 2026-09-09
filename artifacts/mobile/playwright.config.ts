import { defineConfig } from '@playwright/test';
import { execSync } from 'child_process';

function resolveChromiumPath(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  try {
    // `which chromium` is fast (PATH lookup) and works on NixOS where Chromium
    // is installed as a system package.  The Nix store glob `ls /nix/store/*/bin/chromium`
    // hangs because it must stat thousands of directories — do NOT use it.
    const found = execSync('which chromium 2>/dev/null', { encoding: 'utf8', timeout: 3000 }).trim();
    return found || undefined;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:80',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 400, height: 720 },
    launchOptions: {
      executablePath: resolveChromiumPath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { channel: undefined },
    },
  ],
});
