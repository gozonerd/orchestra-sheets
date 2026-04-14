import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173, reuseExistingServer: false },
	testMatch: '**/*.spec.{ts,js}',
	use: { baseURL: 'http://localhost:5173' }
});
