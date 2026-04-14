import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, promptVersions, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// POST /api/prompts/[id]/rollback - Restore a previous version as new version
export async function POST(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const promptId = parseInt(event.params.id);
		const { versionNumber } = await event.request.json();

		if (!versionNumber) {
			return error(400, 'versionNumber is required');
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

		// Get the version to restore
		const versionToRestore = await db
			.select()
			.from(promptVersions)
			.where(and(eq(promptVersions.promptId, promptId), eq(promptVersions.versionNumber, versionNumber)))
			.limit(1);

		if (versionToRestore.length === 0) {
			return error(404, 'Version not found');
		}

		// Get next version number
		const versions = await db
			.select({ versionNumber: promptVersions.versionNumber })
			.from(promptVersions)
			.where(eq(promptVersions.promptId, promptId))
			.orderBy(promptVersions.versionNumber);

		const nextVersion =
			(versions.length > 0 ? versions[versions.length - 1].versionNumber || 0 : 0) + 1;

		// Create new version with restored content
		await db.insert(promptVersions).values({
			promptId,
			versionNumber: nextVersion,
			content: versionToRestore[0].content,
			createdBy: userId
		});

		// Update prompt with restored content
		await db
			.update(prompts)
			.set({
				content: versionToRestore[0].content
			})
			.where(eq(prompts.id, promptId));

		// Log audit event
		await db.insert(auditLogs).values({
			userId,
			action: 'rollback_prompt',
			resourceType: 'prompts',
			resourceId: String(promptId),
			details: { restoredFromVersion: versionNumber, newVersion: nextVersion },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true, newVersion: nextVersion });
	} catch (err) {
		console.error('Rollback error:', err);
		return error(500, 'Failed to rollback prompt');
	}
}
