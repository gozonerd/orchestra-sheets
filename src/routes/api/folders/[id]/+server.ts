import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { folders, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// PATCH /api/folders/[id] - Rename or move folder
export async function PATCH(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const folderId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify folder belongs to user
		const folder = await db
			.select()
			.from(folders)
			.where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
			.limit(1);

		if (folder.length === 0) {
			return error(404, 'Folder not found');
		}

		const { name, parentId } = await event.request.json();

		// Validate new parent (if moving)
		if (parentId !== undefined && parentId !== null) {
			const parentFolder = await db
				.select()
				.from(folders)
				.where(and(eq(folders.id, parentId), eq(folders.userId, userId)))
				.limit(1);

			if (parentFolder.length === 0) {
				return error(404, 'Parent folder not found');
			}

			// Prevent moving folder into itself or its descendants
			if (parentId === folderId) {
				return error(400, 'Cannot move folder into itself');
			}
		}

		// Update folder
		await db
			.update(folders)
			.set({
				...(name && { name: name.trim() }),
				...(parentId !== undefined && { parentId: parentId })
			})
			.where(eq(folders.id, folderId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'update_folder',
			resourceType: 'folders',
			resourceId: String(folderId),
			details: { nameChanged: !!name, parentIdChanged: parentId !== undefined },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('Folder update error:', err);
		return error(500, 'Failed to update folder');
	}
}

// DELETE /api/folders/[id] - Delete folder
export async function DELETE(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const folderId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify folder belongs to user
		const folder = await db
			.select()
			.from(folders)
			.where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
			.limit(1);

		if (folder.length === 0) {
			return error(404, 'Folder not found');
		}

		// Delete folder (cascade deletes prompts in this folder)
		await db.delete(folders).where(eq(folders.id, folderId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'delete_folder',
			resourceType: 'folders',
			resourceId: String(folderId),
			details: { folderName: folder[0].name },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('Folder delete error:', err);
		return error(500, 'Failed to delete folder');
	}
}
