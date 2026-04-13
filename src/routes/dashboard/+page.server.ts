import { requireAuth } from '$lib/server/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// This route requires authentication
	const session = await requireAuth(event);

	return {
		user: session.user
	};
};
