import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { tags, auditLogs } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/tags - List user's tags
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		const userTags = await db.select().from(tags).where(eq(tags.userId, userId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'list_tags',
			resourceType: 'tags',
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ tags: userTags });
	} catch (err) {
		console.error('Tag list error:', err);
		return error(500, 'Failed to list tags');
	}
}

// POST /api/tags - Create new tag
export async function POST(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		const { name, color } = await event.request.json();

		if (!name || name.trim().length === 0) {
			return error(400, 'Tag name is required');
		}

		// Check for duplicate tag names
		const existingTag = await db
			.select()
			.from(tags)
			.where(eq(tags.userId, userId))
			.then((results) => results.find((t) => t.name.toLowerCase() === name.toLowerCase()));

		if (existingTag) {
			return error(400, 'Tag already exists');
		}

		// Create tag
		const result = await db
			.insert(tags)
			.values({
				userId,
				name: name.trim(),
				color: color || '#3B82F6' // Default blue
			})
			.returning({ id: tags.id });

		const tagId = result[0].id;

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'create_tag',
			resourceType: 'tags',
			resourceId: String(tagId),
			details: { name, color },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ id: tagId, name }, { status: 201 });
	} catch (err) {
		console.error('Tag create error:', err);
		return error(500, 'Failed to create tag');
	}
}
