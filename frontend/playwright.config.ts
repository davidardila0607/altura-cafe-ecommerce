import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas e2e de Altura (Playwright).
 * Requisitos: la API corriendo en http://localhost:5031 (backend) con los productos de ejemplo cargados.
 * ng serve se arranca solo si no está ya corriendo en el puerto 4200.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
