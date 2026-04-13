import { json, error } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/db/client';
import { requireAuth } from '$lib/server/auth-guard';
import { encryptKey, hashDEK, generateSecureToken } from '$lib/server/crypto';
import { apiKeys, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

// GET /api/apikeys - List user's API keys
export async function GET(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		// Retrieve keys (encrypted, so safe to return)
		const keys = await db
			.select({
				id: apiKeys.id,
				label: apiKeys.label,
				provider: apiKeys.provider,
				isActive: apiKeys.isActive,
				createdAt: apiKeys.createdAt,
				lastUsedAt: apiKeys.lastUsedAt
			})
			.from(apiKeys)
			.where(eq(apiKeys.userId, userId));

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'list_api_keys',
			resourceType: 'api_keys',
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ keys });
	} catch (err) {
		console.error('API key list error:', err);
		return error(500, 'Failed to list API keys');
	}
}

// POST /api/apikeys - Create new API key
export async function POST(event: RequestEvent) {
	try {
		const session = await requireAuth(event);
		const userId = session.user.id;
		const db = getDatabase();

		// Parse request body
		const { provider, label } = (await event.request.json()) as {
			provider: string;
			label?: string;
		};

		// Validate input
		if (!provider) {
			return error(400, 'Provider is required');
		}

		// Generate encrypted key
		const plainKey = `${provider}-${generateSecureToken(16)}`;
		const encryptedKey = encryptKey(plainKey, userId);
		const dekHash = hashDEK(userId);

		// Store in database
		const result = await db
			.insert(apiKeys)
			.values({
				userId,
				provider,
				encryptedKey,
				dekHash,
				label: label || `${provider} key`,
				isActive: true
			})
			.returning({ id: apiKeys.id });

		// Log audit
		await db.insert(auditLogs).values({
			userId,
			action: 'create_api_key',
			resourceType: 'api_keys',
			resourceId: String(result[0].id),
			details: { provider, label },
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		// Return key only once (not stored plaintext anywhere)
		return json({
			id: result[0].id,
			key: plainKey,
			provider,
			label: label || `${provider} key`,
			message: 'Store this key securely. It will not be shown again.'
		});
	} catch (err) {
		console.error('API key create error:', err);
		return error(500, 'Failed to create API key');
	}
}
