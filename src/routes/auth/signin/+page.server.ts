import { signIn } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.getSession();

	// Redirect to home if already signed in
	if (session) {
		return { redirect: '/', status: 302 };
	}

	return {};
};

export const actions = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	github: async (_event) => {
		return await signIn('github', { redirectTo: '/' });
	},
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	google: async (_event) => {
		return await signIn('google', { redirectTo: '/' });
	}
} satisfies Actions;
