import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { folders, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/folders - List user's folder hierarchy
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		const userFolders = await db
			.select()
			.from(folders)
			.where(eq(folders.userId, userId));

		// Build hierarchy: organize by parent_id
		const rootFolders = userFolders.filter((f) => f.parentId === null);
		const childrenMap = new Map<number, any[]>();

		userFolders.forEach((folder) => {
			if (folder.parentId) {
				if (!childrenMap.has(folder.parentId)) {
					childrenMap.set(folder.parentId, []);
				}
				childrenMap.get(folder.parentId)!.push(folder);
			}
		});

		// Recursively build tree
		function buildTree(folder: any) {
			return {
				id: folder.id,
				name: folder.name,
				parentId: folder.parentId,
				createdAt: folder.createdAt,
				children: (childrenMap.get(folder.id) || []).map(buildTree)
			};
		}

		const hierarchy = rootFolders.map(buildTree);

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'list_folders',
			resourceType: 'folders',
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ folders: hierarchy });
	} catch (err) {
		console.error('Folder list error:', err);
		return error(500, 'Failed to list folders');
	}
}

// POST /api/folders - Create new folder
export async function POST(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		const { name, parentId } = await event.request.json();

		if (!name || name.trim().length === 0) {
			return error(400, 'Folder name is required');
		}

		// Verify parent folder belongs to user (if provided)
		if (parentId) {
			const parentFolder = await db
				.select()
				.from(folders)
				.where(and(eq(folders.id, parentId), eq(folders.userId, userId)))
				.limit(1);

			if (parentFolder.length === 0) {
				return error(404, 'Parent folder not found');
			}
		}

		// Create folder
		const result = await db
			.insert(folders)
			.values({
				userId,
				name: name.trim(),
				parentId: parentId || null
			})
			.returning({ id: folders.id });

		const folderId = result[0].id;

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'create_folder',
			resourceType: 'folders',
			resourceId: String(folderId),
			details: { name, parentId },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ id: folderId, name }, { status: 201 });
	} catch (err) {
		console.error('Folder create error:', err);
		return error(500, 'Failed to create folder');
	}
}
