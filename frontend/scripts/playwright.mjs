import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const selectedProject = process.argv.find((arg) => arg.startsWith('--project='))?.split('=')[1];
const child = spawn(process.execPath, [require.resolve('@playwright/test/cli'), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    ORVIO_TEST_SUITE: selectedProject || 'all',
    PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || resolve(root, '.playwright-browsers'),
  },
});
child.on('error', (error) => {
  console.error(`Playwright could not start: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
