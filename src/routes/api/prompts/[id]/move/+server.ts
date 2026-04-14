import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, folders, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// POST /api/prompts/[id]/move - Move prompt to folder
export async function POST(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const promptId = parseInt(event.params.id);
		const db = getDatabase();

		const { folderId } = await event.request.json();

		// Verify prompt belongs to user
		const prompt = await db
			.select()
			.from(prompts)
			.where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)))
			.limit(1);

		if (prompt.length === 0) {
			return error(404, 'Prompt not found');
		}

		// Verify folder belongs to user (if provided)
		if (folderId !== null && folderId !== undefined) {
			const folder = await db
				.select()
				.from(folders)
				.where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
				.limit(1);

			if (folder.length === 0) {
				return error(404, 'Folder not found');
			}
		}

		// Update prompt's folder
		await db
			.update(prompts)
			.set({ folderId: folderId || null })
			.where(eq(prompts.id, promptId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'move_prompt',
			resourceType: 'prompts',
			resourceId: String(promptId),
			details: { toFolderId: folderId },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('Move prompt error:', err);
		return error(500, 'Failed to move prompt');
	}
}
