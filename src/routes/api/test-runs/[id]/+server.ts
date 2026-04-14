import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { testRuns, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';

export const GET: RequestHandler = async (event) => {
	const { user } = await requireAuth(event);
	const testRunId = parseInt(event.params.id);

	if (!testRunId) {
		throw error(400, 'Invalid test run ID');
	}

	try {
		const testRun = await db
			.select()
			.from(testRuns)
			.where(and(eq(testRuns.id, testRunId), eq(testRuns.userId, user.id)))
			.then((rows) => rows[0]);

		if (!testRun) {
			throw error(404, 'Test run not found');
		}

		// Parse stored JSON fields
		const response = {
			...testRun,
			models: testRun.models ? JSON.parse(testRun.models as string) : [],
			testInputs: testRun.testInputs ? JSON.parse(testRun.testInputs as string) : {},
			results: testRun.results ? JSON.parse(testRun.results as string) : []
		};

		return json(response);
	} catch (e) {
		if (e instanceof Error && e.message.includes('not found')) {
			throw e;
		}
		console.error('Failed to fetch test run:', e);
		throw error(500, 'Failed to fetch test run');
	}
};

export const DELETE: RequestHandler = async (event) => {
	const { user } = await requireAuth(event);
	const testRunId = parseInt(event.params.id);

	if (!testRunId) {
		throw error(400, 'Invalid test run ID');
	}

	try {
		// Verify ownership
		const testRun = await db
			.select()
			.from(testRuns)
			.where(and(eq(testRuns.id, testRunId), eq(testRuns.userId, user.id)))
			.then((rows) => rows[0]);

		if (!testRun) {
			throw error(404, 'Test run not found');
		}

		// Archive instead of hard delete
		await db
			.update(testRuns)
			.set({ status: 'archived' })
			.where(eq(testRuns.id, testRunId));

		// Audit log
		await db.insert(auditLogs).values({
			userId: user.id,
			action: 'test_run_archived',
			resourceType: 'test_run',
			resourceId: String(testRunId),
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({ success: true });
	} catch (e) {
		if (e instanceof Error && e.message.includes('not found')) {
			throw e;
		}
		console.error('Failed to delete test run:', e);
		throw error(500, 'Failed to archive test run');
	}
};
