import type { PageServerLoad } from './$types';
import { getDatabase } from '$lib/server/db/client';
import { prompts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const db = getDatabase();

	// Fetch prompts for the user
	const userPrompts = await db
		.select()
		.from(prompts)
		.where(eq(prompts.userId, session.user.id));

	// Available models for A/B testing
	const availableModels = [
		'gpt-4-turbo',
		'gpt-4o',
		'gpt-3.5-turbo',
		'claude-3-opus',
		'claude-3-sonnet',
		'claude-3-haiku',
		'claude-3.5-sonnet',
		'claude-3.5-haiku',
		'gemini-pro',
		'gemini-1.5-pro',
		'llama-2-7b',
		'llama-2-13b',
		'llama-2-70b'
	];

	return {
		prompts: userPrompts,
		availableModels
	};
};
