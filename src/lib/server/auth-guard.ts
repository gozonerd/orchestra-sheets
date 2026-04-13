import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

/**
 * Middleware to protect routes - requires authentication
 * @param event SvelteKit RequestEvent
 * @throws Redirect to /auth/signin if not authenticated
 */
export async function requireAuth(event: RequestEvent) {
	const session = await event.locals.getSession();

	if (!session?.user) {
		throw redirect(302, '/auth/signin?callbackUrl=' + event.url.pathname);
	}

	return session;
}

/**
 * Get current user session safely
 * @param event SvelteKit RequestEvent
 * @returns User session or null if not authenticated
 */
export async function getAuthSession(event: RequestEvent) {
	return await event.locals.getSession();
}

/**
 * Check if user is authenticated (for conditional rendering, etc.)
 * @param event SvelteKit RequestEvent
 * @returns true if user is authenticated, false otherwise
 */
export async function isAuthenticated(event: RequestEvent): Promise<boolean> {
	const session = await event.locals.getSession();
	return !!session?.user;
}
