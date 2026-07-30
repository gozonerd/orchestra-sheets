import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, promptVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/prompts/[id]/versions/[versionNumber] - Get specific version content
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const promptId = parseInt(event.params.id);
		const versionNumber = parseInt(event.params.versionNumber);
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

		// Get specific version
		const version = await db
			.select()
			.from(promptVersions)
			.where(
				and(eq(promptVersions.promptId, promptId), eq(promptVersions.versionNumber, versionNumber))
			)
			.limit(1);

		if (version.length === 0) {
			return error(404, 'Version not found');
		}

		return json(version[0]);
	} catch (err) {
		console.error('Version get error:', err);
		return error(500, 'Failed to retrieve version');
	}
}
