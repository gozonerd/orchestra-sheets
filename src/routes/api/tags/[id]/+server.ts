import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { tags, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// PATCH /api/tags/[id] - Update tag
export async function PATCH(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const tagId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify tag belongs to user
		const tag = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
			.limit(1);

		if (tag.length === 0) {
			return error(404, 'Tag not found');
		}

		const { name, color } = await event.request.json();

		// Update tag
		await db
			.update(tags)
			.set({
				...(name && { name: name.trim() }),
				...(color && { color })
			})
			.where(eq(tags.id, tagId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'update_tag',
			resourceType: 'tags',
			resourceId: String(tagId),
			details: { nameChanged: !!name, colorChanged: !!color },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('Tag update error:', err);
		return error(500, 'Failed to update tag');
	}
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const tagId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify tag belongs to user
		const tag = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
			.limit(1);

		if (tag.length === 0) {
			return error(404, 'Tag not found');
		}

		// Delete tag (cascade removes from prompts)
		await db.delete(tags).where(eq(tags.id, tagId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'delete_tag',
			resourceType: 'tags',
			resourceId: String(tagId),
			details: { tagName: tag[0].name },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('Tag delete error:', err);
		return error(500, 'Failed to delete tag');
	}
}
