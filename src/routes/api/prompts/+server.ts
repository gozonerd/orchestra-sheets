import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, auditLogs, promptVersions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/prompts - List user's prompts
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		const userPrompts = await db
			.select({
				id: prompts.id,
				name: prompts.name,
				description: prompts.description,
				status: prompts.status,
				createdAt: prompts.createdAt,
				updatedAt: prompts.updatedAt
			})
			.from(prompts)
			.where(eq(prompts.userId, userId))
			.orderBy(prompts.updatedAt);

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'list_prompts',
			resourceType: 'prompts',
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ prompts: userPrompts });
	} catch (err) {
		console.error('Prompt list error:', err);
		return error(500, 'Failed to list prompts');
	}
}

// POST /api/prompts - Create new prompt
export async function POST(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		const { name, description, content, status } = await event.request.json();

		// Validate required fields
		if (!name || !content) {
			return error(400, 'Name and content are required');
		}

		// Create prompt
		const result = await db
			.insert(prompts)
			.values({
				userId,
				name,
				description: description || '',
				content,
				status: (status as any) || 'draft'
			})
			.returning({ id: prompts.id });

		const promptId = result[0].id;

		// Create initial version
		await db.insert(promptVersions).values({
			promptId,
			versionNumber: 1,
			content,
			createdBy: userId
		});

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'create_prompt',
			resourceType: 'prompts',
			resourceId: String(promptId),
			details: { name, status },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ id: promptId, name, status: status || 'draft' }, { status: 201 });
	} catch (err) {
		console.error('Prompt create error:', err);
		return error(500, 'Failed to create prompt');
	}
}
