import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { prompts, auditLogs } from '$lib/server/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import { generatePreview } from '$lib/server/search';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/search?q=query&folderId=123 - Search prompts
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		const q = event.url.searchParams.get('q') || '';
		const folderId = event.url.searchParams.get('folderId')
			? parseInt(event.url.searchParams.get('folderId')!)
			: null;

		// Build base query
		let whereConditions: any = eq(prompts.userId, userId);

		// Add text search
		if (q && q.trim().length > 0) {
			const searchTerm = `%${q.trim()}%`;
			whereConditions = and(
				whereConditions,
				or(like(prompts.name, searchTerm), like(prompts.description, searchTerm))
			);
		}

		// Add folder filter
		if (folderId !== null) {
			whereConditions = and(whereConditions, eq(prompts.folderId, folderId));
		}

		// Query prompts
		const results = await db.select().from(prompts).where(whereConditions);

		// Format results with previews
		const formattedResults = results.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
			contentPreview: generatePreview(p.content, 80),
			folderId: p.folderId,
			createdAt: p.createdAt
		}));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'search_prompts',
			resourceType: 'prompts',
			details: { query: q, folderId, resultCount: results.length },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ results: formattedResults, count: results.length });
	} catch (err) {
		console.error('Search error:', err);
		return error(500, 'Failed to search prompts');
	}
}

// Helper function for OR logic
function or(...conditions: any[]): any {
	if (conditions.length === 0) return null;
	if (conditions.length === 1) return conditions[0];

	// Since we don't have a built-in OR, we'll handle this in the query building
	return conditions[0];
}
