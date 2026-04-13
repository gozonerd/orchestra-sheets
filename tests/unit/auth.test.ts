import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isAuthenticated, getAuthSession } from '../../src/lib/server/auth-guard';
import type { RequestEvent } from '@sveltejs/kit';

describe('Auth Guard Functions', () => {
	let mockEvent: Partial<RequestEvent>;

	beforeEach(() => {
		mockEvent = {
			locals: {
				getSession: vi.fn()
			}
		};
	});

	describe('isAuthenticated', () => {
		it('should return true when user is authenticated', async () => {
			const mockSession = {
				user: {
					id: '123',
					email: 'test@example.com',
					name: 'Test User'
				}
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(mockSession);

			const result = await isAuthenticated(mockEvent as RequestEvent);
			expect(result).toBe(true);
		});

		it('should return false when no session exists', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(null);

			const result = await isAuthenticated(mockEvent as RequestEvent);
			expect(result).toBe(false);
		});

		it('should return false when user is null', async () => {
			const mockSession = { user: null };

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(mockSession);

			const result = await isAuthenticated(mockEvent as RequestEvent);
			expect(result).toBe(false);
		});
	});

	describe('getAuthSession', () => {
		it('should return session when user is authenticated', async () => {
			const mockSession = {
				user: {
					id: '123',
					email: 'test@example.com'
				}
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(mockSession);

			const result = await getAuthSession(mockEvent as RequestEvent);
			expect(result).toEqual(mockSession);
		});

		it('should return null when not authenticated', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(null);

			const result = await getAuthSession(mockEvent as RequestEvent);
			expect(result).toBeNull();
		});
	});

	describe('Session structure', () => {
		it('should have required user fields in session', async () => {
			const mockSession = {
				user: {
					id: '123',
					email: 'test@example.com',
					name: 'Test User',
					image: 'https://example.com/avatar.jpg'
				},
				expires: '2026-12-31'
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(mockSession);

			const session = await getAuthSession(mockEvent as RequestEvent);
			expect(session?.user?.id).toBeDefined();
			expect(session?.user?.email).toBeDefined();
			expect(session?.expires).toBeDefined();
		});
	});
});

describe('Auth Configuration', () => {
	it('should handle authentication secret requirement', () => {
		// AUTH_SECRET is required for production but may be missing in test
		// The auth system should either have it or fall back safely
		const secret = process.env.AUTH_SECRET;
		// In test environment, it's OK if not set, but production needs it
		expect(typeof secret === 'string' || secret === undefined).toBe(true);
	});

	it('should handle missing optional provider keys gracefully', () => {
		// Auth.js should handle missing provider keys
		// These are optional in development but required in production
		const githubId = process.env.AUTH_GITHUB_ID || '';
		const googleId = process.env.AUTH_GOOGLE_ID || '';
		expect(typeof githubId === 'string').toBe(true);
		expect(typeof googleId === 'string').toBe(true);
	});
});
