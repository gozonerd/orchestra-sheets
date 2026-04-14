import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, promptVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { computeDiff } from '$lib/server/prompts/diff';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/prompts/[id]/diff?from=v1&to=v2 - Compute diff between versions
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const promptId = parseInt(event.params.id);
		const fromVersion = parseInt(event.url.searchParams.get('from') || '');
		const toVersion = parseInt(event.url.searchParams.get('to') || '');

		if (!fromVersion || !toVersion) {
			return error(400, 'Missing from and to version parameters');
		}

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

		// Get both versions
		const [fromVersionData, toVersionData] = await Promise.all([
			db
				.select()
				.from(promptVersions)
				.where(and(eq(promptVersions.promptId, promptId), eq(promptVersions.versionNumber, fromVersion)))
				.limit(1),
			db
				.select()
				.from(promptVersions)
				.where(and(eq(promptVersions.promptId, promptId), eq(promptVersions.versionNumber, toVersion)))
				.limit(1)
		]);

		if (fromVersionData.length === 0 || toVersionData.length === 0) {
			return error(404, 'One or both versions not found');
		}

		// Compute diff
		const diffResult = computeDiff(fromVersionData[0].content, toVersionData[0].content);

		return json({
			fromVersion,
			toVersion,
			fromContent: fromVersionData[0].content,
			toContent: toVersionData[0].content,
			diffs: diffResult.diffs,
			additions: diffResult.additions,
			deletions: diffResult.deletions
		});
	} catch (err) {
		console.error('Diff compute error:', err);
		return error(500, 'Failed to compute diff');
	}
}
