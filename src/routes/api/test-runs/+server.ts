import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '$lib/server/db/client';
import { testRuns, auditLogs } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';

export const POST: RequestHandler = async (event) => {
	const { user } = await requireAuth(event);
	const { promptId, modelIds, variables } = await event.request.json();
	const db = getDatabase();

	// Validate inputs
	if (!promptId || !Array.isArray(modelIds) || modelIds.length < 2) {
		throw error(400, 'promptId required, modelIds must be array with 2+ items');
	}

	if (!variables || typeof variables !== 'object') {
		throw error(400, 'variables must be an object');
	}

	try {
		// Create test run
		const result = await db
			.insert(testRuns)
			.values({
				userId: user.id,
				promptId,
				status: 'pending',
				models: JSON.stringify(modelIds),
				testInputs: JSON.stringify(variables),
				results: JSON.stringify([]),
				totalCost: 0
			})
			.returning({ id: testRuns.id });

		const testRunId = result[0].id;

		// Audit log
		await db.insert(auditLogs).values({
			userId: user.id,
			action: 'test_run_created',
			resourceType: 'test_run',
			resourceId: String(testRunId),
			details: JSON.stringify({
				promptId,
				modelCount: modelIds.length,
				variableKeys: Object.keys(variables)
			}),
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ id: testRunId, status: 'pending' }, { status: 201 });
	} catch (e) {
		console.error('Failed to create test run:', e);
		throw error(500, 'Failed to create test run');
	}
};

export const GET: RequestHandler = async (event) => {
	const { user } = await requireAuth(event);
	const db = getDatabase();

	try {
		// Get all test runs for user
		const runs = await db.select().from(testRuns).where(eq(testRuns.userId, user.id));

		// Format response
		const formatted = runs.map((run: any) => ({
			id: run.id,
			promptId: run.promptId,
			status: run.status,
			totalCost: run.totalCost,
			createdAt: run.createdAt,
			completedAt: run.completedAt
		}));

		return json(formatted);
	} catch (e) {
		console.error('Failed to fetch test runs:', e);
		throw error(500, 'Failed to fetch test runs');
	}
};
