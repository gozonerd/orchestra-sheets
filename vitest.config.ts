import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			lines: 80,
			functions: 80,
			branches: 70,
			statements: 80
		},
		include: ['tests/**/*.test.ts']
	},
	resolve: {
		alias: {
			$lib: resolve('./src/lib')
		}
	}
});
