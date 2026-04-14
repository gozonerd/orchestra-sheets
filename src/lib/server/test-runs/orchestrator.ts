/**
 * Test Run Orchestrator
 * Coordinates execution of test runs across multiple models
 */

import { getDatabase } from '$lib/server/db/client';
import { prompts, apiKeys } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { executeTestForModel } from './executor';
import { decryptKey } from '$lib/server/crypto';
import { getProviderName } from '$lib/server/providers';

interface TestRunResult {
	model: string;
	status: 'success' | 'error';
	text?: string;
	tokens?: { input: number; output: number };
	cost?: number;
	latency?: number;
	error?: string;
}

/**
 * Run test across multiple models
 * @param testRunId ID for tracking
 * @param promptId Prompt to test
 * @param modelIds Models to test with
 * @param variables Variable substitutions
 * @param userId User ID (for fetching decrypted keys)
 * @returns Array of results for each model
 */
export async function runTestForAllModels(
	testRunId: number,
	promptId: number,
	modelIds: string[],
	variables: Record<string, string>,
	userId: string
): Promise<TestRunResult[]> {
	try {
		const db = getDatabase();

		// Fetch prompt content
		const promptData = await db
			.select()
			.from(prompts)
			.where(eq(prompts.id, promptId))
			.then((rows: any[]) => rows[0]);

		if (!promptData) {
			throw new Error(`Prompt ${promptId} not found`);
		}

		// Fetch and decrypt API keys for each model
		const apiKeyMap: Record<string, string> = {};

		for (const modelId of modelIds) {
			const providerName = getProviderName(modelId);

			// Get API key for this provider
			const apiKeyData = await db
				.select()
				.from(apiKeys)
				.where(
					and(
						eq(apiKeys.userId, userId),
						eq(apiKeys.provider, providerName),
						eq(apiKeys.isActive, true)
					)
				)
				.then((rows: any[]) => rows[0]);

			if (!apiKeyData) {
				throw new Error(`No API key found for provider: ${providerName}`);
			}

			// Decrypt API key using user's DEK
			const decryptedKey = decryptKey(apiKeyData.encryptedKey, userId);
			apiKeyMap[modelId] = decryptedKey;
		}

		// Execute tests for each model in parallel
		const results = await Promise.allSettled(
			modelIds.map((modelId) =>
				executeTestForModel(apiKeyMap[modelId], modelId, promptData.content, variables)
			)
		);

		// Format results
		return results.map((result, index) => {
			if (result.status === 'fulfilled') {
				return result.value;
			} else {
				return {
					model: modelIds[index],
					status: 'error' as const,
					error: result.reason?.message || 'Unknown error'
				};
			}
		});
	} catch (e) {
		const error = e instanceof Error ? e.message : 'Unknown error';
		console.error(`Test run ${testRunId} failed:`, error);

		// Return error result for all models
		return modelIds.map((modelId) => ({
			model: modelId,
			status: 'error' as const,
			error
		}));
	}
}
