import { error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await requireAuth(event);
	const userId = session.user.id;
	const promptId = parseInt(event.params.id);
	const db = getDatabase();

	// Verify prompt belongs to user
	const prompt = await db
		.select()
		.from(prompts)
		.where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)))
		.limit(1);

	if (prompt.length === 0) {
		return error(404, 'Prompt not found');
	}

	return {
		promptId,
		promptName: prompt[0].name,
		promptDescription: prompt[0].description
	};
};
