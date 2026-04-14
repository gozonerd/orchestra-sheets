import { generateText } from 'ai';
import { calculateCost, formatCost } from './cost-calculator';
import { substituteVariables } from '$lib/server/prompts/variables';
import { getProvider } from '$lib/server/providers';

interface ExecutionResult {
	model: string;
	status: 'success' | 'error';
	text?: string;
	tokens?: { input: number; output: number };
	cost?: number;
	latency?: number; // milliseconds
	error?: string;
}

/**
 * Execute test run for a single model
 * @param apiKey Decrypted API key for the provider
 * @param model Model identifier (e.g., "gpt-4-turbo")
 * @param prompt Prompt template with {{variables}}
 * @param variables Variable substitutions
 * @returns Execution result with output, cost, and latency
 */
export async function executeTestForModel(
	apiKey: string,
	model: string,
	prompt: string,
	variables: Record<string, string>
): Promise<ExecutionResult> {
	const startTime = Date.now();

	try {
		// Substitute variables in prompt
		const substitutedPrompt = substituteVariables(prompt, variables);

		// Get provider client (OpenAI, Anthropic, etc. based on model)
		const client = getProvider(model, apiKey);

		// Execute LLM call
		const response = await generateText({
			model: client.model,
			prompt: substitutedPrompt,
			// Add any provider-specific options
			...(client.options || {})
		});

		const latency = Date.now() - startTime;

		// Extract token counts (structure varies by provider)
		const tokens = {
			input: response.usage?.inputTokens || 0,
			output: response.usage?.outputTokens || 0
		};

		// Calculate cost
		const costBreakdown = calculateCost(model, tokens);

		return {
			model,
			status: 'success',
			text: response.text,
			tokens,
			cost: costBreakdown.totalCost,
			latency
		};
	} catch (e) {
		const latency = Date.now() - startTime;
		const errorMessage = e instanceof Error ? e.message : 'Unknown error';

		return {
			model,
			status: 'error',
			error: errorMessage,
			latency
		};
	}
}

/**
 * Execute test for multiple models in parallel
 * @param models List of model identifiers
 * @param apiKeys Map of model -> decrypted API key
 * @param prompt Prompt template
 * @param variables Variable substitutions
 * @returns Array of execution results
 */
export async function executeTestForMultipleModels(
	models: string[],
	apiKeys: Record<string, string>,
	prompt: string,
	variables: Record<string, string>
): Promise<ExecutionResult[]> {
	// Execute in parallel using Promise.allSettled for robustness
	const promises = models.map((model) =>
		executeTestForModel(apiKeys[model], model, prompt, variables)
	);

	const results = await Promise.allSettled(promises);

	return results.map((result, index) => {
		if (result.status === 'fulfilled') {
			return result.value;
		} else {
			return {
				model: models[index],
				status: 'error' as const,
				error: result.reason?.message || 'Unknown error'
			};
		}
	});
}
