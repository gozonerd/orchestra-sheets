import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { apiKeys, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/apikeys/[id] - Get specific API key details
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const keyId = parseInt(event.params.id);

		const db = getDatabase();

		// Retrieve key (must be user's key)
		const key = await db
			.select({
				id: apiKeys.id,
				label: apiKeys.label,
				provider: apiKeys.provider,
				isActive: apiKeys.isActive,
				createdAt: apiKeys.createdAt,
				lastUsedAt: apiKeys.lastUsedAt
			})
			.from(apiKeys)
			.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
			.limit(1);

		if (key.length === 0) {
			return error(404, 'API key not found');
		}

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'view_api_key',
			resourceType: 'api_keys',
			resourceId: String(keyId),
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json(key[0]);
	} catch (err) {
		console.error('API key get error:', err);
		return error(500, 'Failed to retrieve API key');
	}
}

// PATCH /api/apikeys/[id] - Update API key
export async function PATCH(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const keyId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify key belongs to user
		const existing = await db
			.select()
			.from(apiKeys)
			.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
			.limit(1);

		if (existing.length === 0) {
			return error(404, 'API key not found');
		}

		// Parse request body
		const { label, isActive } = await event.request.json();

		// Update key
		await db
			.update(apiKeys)
			.set({
				...(label !== undefined && { label }),
				...(isActive !== undefined && { isActive })
			})
			.where(eq(apiKeys.id, keyId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'update_api_key',
			resourceType: 'api_keys',
			resourceId: String(keyId),
			details: { label, isActive },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('API key update error:', err);
		return error(500, 'Failed to update API key');
	}
}

// DELETE /api/apikeys/[id] - Delete API key
export async function DELETE(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const keyId = parseInt(event.params.id);
		const db = getDatabase();

		// Verify key belongs to user before deletion
		const existing = await db
			.select()
			.from(apiKeys)
			.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
			.limit(1);

		if (existing.length === 0) {
			return error(404, 'API key not found');
		}

		// Delete key
		await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'delete_api_key',
			resourceType: 'api_keys',
			resourceId: String(keyId),
			details: { provider: existing[0].provider, label: existing[0].label },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (err) {
		console.error('API key delete error:', err);
		return error(500, 'Failed to delete API key');
	}
}
