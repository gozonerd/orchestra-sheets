import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// TODO: Auth.js initialization temporarily disabled for dev testing
	// Will be re-enabled after auth configuration is complete
	// const session = await event.locals.getSession();
	return { session: null };
};
