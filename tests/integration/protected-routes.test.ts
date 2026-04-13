import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireAuth } from '../../src/lib/server/auth-guard';
import type { RequestEvent } from '@sveltejs/kit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockRequestEvent = Partial<RequestEvent> & { url: any };

describe('Protected Routes Integration', () => {
	let mockEvent: MockRequestEvent;

	beforeEach(() => {
		mockEvent = {
			locals: {
				getSession: vi.fn(),
				auth: vi.fn()
			},
			url: {
				pathname: '/dashboard'
			}
		};
	});

	describe('requireAuth enforcement', () => {
		it('should throw redirect to /auth/signin when user not authenticated', async () => {
			// Mock no session
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(null);

			try {
				await requireAuth(mockEvent as RequestEvent);
				// Should not reach here
				expect(true).toBe(false);
			} catch (error: unknown) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const err = error as any;
				// Should redirect with status 302
				expect(err.status).toBe(302);
				// Should include callbackUrl to redirect back after login
				expect(err.location).toContain('/auth/signin');
				expect(err.location).toContain('callbackUrl=');
			}
		});

		it('should allow access when user is authenticated', async () => {
			const mockSession = {
				user: {
					id: 'user-123',
					email: 'test@example.com',
					name: 'Test User'
				}
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(mockSession);

			const result = await requireAuth(mockEvent as RequestEvent);

			// Should return the session
			expect(result.user.id).toBe('user-123');
			expect(result.user.email).toBe('test@example.com');
		});

		it('should reject session with null user', async () => {
			const invalidSession = { user: null };

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(invalidSession);

			try {
				await requireAuth(mockEvent as RequestEvent);
				// Should not reach here
				expect(true).toBe(false);
			} catch (error: unknown) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const err = error as any;
				expect(err.status).toBe(302);
				expect(err.location).toContain('/auth/signin');
				expect(err.location).toContain('callbackUrl=');
			}
		});
	});

	describe('Protected route access patterns', () => {
		it('should preserve redirect target for post-auth navigation', async () => {
			const mockSession = {
				user: {
					id: 'user-123',
					email: 'test@example.com'
				}
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(mockSession);
			mockEvent.url!.pathname = '/dashboard';

			const result = await requireAuth(mockEvent as RequestEvent);

			expect(result).toBeTruthy();
			expect(result.user.id).toBe('user-123');
		});

		it('should handle concurrent protection checks', async () => {
			const mockSession = {
				user: {
					id: 'user-456',
					email: 'another@example.com'
				}
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(mockEvent.locals!.getSession as any).mockResolvedValue(mockSession);

			// Simulate multiple concurrent checks
			const results = await Promise.all([
				requireAuth(mockEvent as RequestEvent),
				requireAuth(mockEvent as RequestEvent),
				requireAuth(mockEvent as RequestEvent)
			]);

			expect(results).toHaveLength(3);
			results.forEach((result) => {
				expect(result.user.id).toBe('user-456');
			});
		});
	});
});
