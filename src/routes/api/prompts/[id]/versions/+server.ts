import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, promptVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/prompts/[id]/versions - List all versions for a prompt
export async function GET(event: RequestEvent) {
	try {
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

		// Get all versions ordered by version number descending
		const versions = await db
			.select({
				versionNumber: promptVersions.versionNumber,
				content: promptVersions.content,
				createdAt: promptVersions.createdAt,
				createdBy: promptVersions.createdBy,
				contentPreview: promptVersions.content
			})
			.from(promptVersions)
			.where(eq(promptVersions.promptId, promptId))
			.orderBy(promptVersions.versionNumber);

		// Add preview (first 100 chars) to each version
		const versionsWithPreview = versions.map((v) => ({
			versionNumber: v.versionNumber,
			createdAt: v.createdAt,
			createdBy: v.createdBy,
			preview: v.contentPreview.substring(0, 100) + (v.contentPreview.length > 100 ? '...' : '')
		}));

		return json({ versions: versionsWithPreview });
	} catch (err) {
		console.error('Version list error:', err);
		return error(500, 'Failed to list versions');
	}
}
