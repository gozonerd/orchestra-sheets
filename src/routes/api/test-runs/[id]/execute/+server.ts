import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase } from '$lib/server/db/client';
import { testRuns, auditLogs } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '$lib/server/auth-guard';
import { runTestForAllModels } from '$lib/server/test-runs/orchestrator';

export const POST: RequestHandler = async (event) => {
	const { user } = await requireAuth(event);
	const testRunId = parseInt(event.params.id);
	const db = getDatabase();

	if (!testRunId) {
		throw error(400, 'Invalid test run ID');
	}

	try {
		// Verify test run exists and belongs to user
		const testRun = await db
			.select()
			.from(testRuns)
			.where(and(eq(testRuns.id, testRunId), eq(testRuns.userId, user.id)))
			.then((rows: any[]) => rows[0]);

		if (!testRun) {
			throw error(404, 'Test run not found');
		}

		if (testRun.status !== 'pending') {
			throw error(400, 'Test run is not in pending status');
		}

		// Update status to running
		await db.update(testRuns).set({ status: 'running' }).where(eq(testRuns.id, testRunId));

		// Parse stored data
		const modelIds = testRun.models ? JSON.parse(testRun.models as string) : [];
		const variables = testRun.testInputs ? JSON.parse(testRun.testInputs as string) : {};

		// Execute test for all models
		const results = await runTestForAllModels(
			testRunId,
			testRun.promptId,
			modelIds,
			variables,
			user.id
		);

		// Calculate total cost
		const totalCost = results.reduce((sum: number, r: any) => sum + (r.cost || 0), 0);

		// Update test run with results
		await db
			.update(testRuns)
			.set({
				status: 'completed',
				results: JSON.stringify(results),
				totalCost,
				completedAt: new Date()
			})
			.where(eq(testRuns.id, testRunId));

		// Audit log
		await db.insert(auditLogs).values({
			userId: user.id,
			action: 'test_run_executed',
			resourceType: 'test_run',
			resourceId: String(testRunId),
			details: JSON.stringify({
				modelCount: modelIds.length,
				totalCost: parseFloat(totalCost.toFixed(4))
			}),
			ipAddress: event.request.headers.get('x-forwarded-for') || 'unknown',
			userAgent: event.request.headers.get('user-agent') || undefined
		});

		return json({
			id: testRunId,
			status: 'completed',
			results,
			totalCost
		});
	} catch (e) {
		if (e instanceof Error) {
			if (e.message.includes('not found')) {
				throw error(404, 'Test run not found');
			}
			if (e.message.includes('not in pending')) {
				throw error(400, 'Test run is not in pending status');
			}
		}

		console.error('Failed to execute test run:', e);

		// Mark as failed
		try {
			await db.update(testRuns).set({ status: 'failed' }).where(eq(testRuns.id, testRunId));
		} catch {
			// Ignore error updating status
		}

		throw error(500, 'Failed to execute test run');
	}
};
