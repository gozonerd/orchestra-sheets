import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run dev',
		port: 5173,
		reuseExistingServer: true
	},
	testMatch: '**/*.spec.{ts,js}',
	use: { baseURL: 'http://localhost:5173' }
});
