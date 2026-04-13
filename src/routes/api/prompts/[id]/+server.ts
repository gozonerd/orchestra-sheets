import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, auditLogs, promptVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/prompts/[id] - Get specific prompt
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const promptId = parseInt(event.params.id);
		const db = getDatabase();

		const prompt = await db
			.select()
			.from(prompts)
			.where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)))
			.limit(1);

		if (prompt.length === 0) {
			return error(404, 'Prompt not found');
		}

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'view_prompt',
			resourceType: 'prompts',
			resourceId: String(promptId),
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json(prompt[0]);
	} catch (err) {
		console.error('Prompt get error:', err);
		return error(500, 'Failed to retrieve prompt');
	}
}

// PATCH /api/prompts/[id] - Update prompt
export async function PATCH(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const promptId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify prompt belongs to user
		const existing = await db
			.select()
			.from(prompts)
			.where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)))
			.limit(1);

		if (existing.length === 0) {
			return error(404, 'Prompt not found');
		}

		const { name, description, content, status } = await event.request.json();

		// Update prompt
		await db
			.update(prompts)
			.set({
				...(name && { name }),
				...(description !== undefined && { description }),
				...(content && { content }),
				...(status && { status })
			})
			.where(eq(prompts.id, promptId));

		// Create new version if content changed
		if (content && content !== existing[0].content) {
			const versions = await db
				.select({ versionNumber: promptVersions.versionNumber })
				.from(promptVersions)
				.where(eq(promptVersions.promptId, promptId))
				.orderBy(promptVersions.versionNumber);

			const nextVersion =
				(versions.length > 0 ? versions[versions.length - 1].versionNumber || 0 : 0) + 1;

			await db.insert(promptVersions).values({
				promptId,
				versionNumber: nextVersion,
				content,
				createdBy: userId
			});
		}

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'update_prompt',
			resourceType: 'prompts',
			resourceId: String(promptId),
			details: { name, status, contentChanged: content !== existing[0].content },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('Prompt update error:', err);
		return error(500, 'Failed to update prompt');
	}
}

// DELETE /api/prompts/[id] - Delete prompt
export async function DELETE(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const promptId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify prompt belongs to user
		const existing = await db
			.select()
			.from(prompts)
			.where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)))
			.limit(1);

		if (existing.length === 0) {
			return error(404, 'Prompt not found');
		}

		// Delete prompt (cascade will delete versions)
		await db.delete(prompts).where(eq(prompts.id, promptId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'delete_prompt',
			resourceType: 'prompts',
			resourceId: String(promptId),
			details: { name: existing[0].name },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('Prompt delete error:', err);
		return error(500, 'Failed to delete prompt');
	}
}
