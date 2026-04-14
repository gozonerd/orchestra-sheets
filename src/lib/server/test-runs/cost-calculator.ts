/**
 * Cost calculation for LLM API calls
 * Pricing data updated 2026-04-14
 */

interface TokenCounts {
	input: number;
	output: number;
}

interface CostBreakdown {
	inputCost: number;
	outputCost: number;
	totalCost: number;
}

// Pricing per 1K tokens (in USD)
const PRICING_MAP: Record<string, { input: number; output: number }> = {
	// OpenAI
	'gpt-4-turbo': { input: 0.01, output: 0.03 },
	'gpt-4o': { input: 0.005, output: 0.015 },
	'gpt-4': { input: 0.03, output: 0.06 },
	'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

	// Anthropic
	'claude-3-opus': { input: 0.015, output: 0.075 },
	'claude-3-sonnet': { input: 0.003, output: 0.015 },
	'claude-3-haiku': { input: 0.00025, output: 0.00125 },
	'claude-3.5-sonnet': { input: 0.003, output: 0.015 },
	'claude-3.5-haiku': { input: 0.00025, output: 0.00125 },

	// Google
	'gemini-pro': { input: 0.000125, output: 0.000375 },
	'gemini-1.5-pro': { input: 0.001, output: 0.003 },

	// Meta
	'llama-2-7b': { input: 0.00075, output: 0.001 },
	'llama-2-13b': { input: 0.00075, output: 0.001 },
	'llama-2-70b': { input: 0.00195, output: 0.00256 }
};

/**
 * Calculate cost for an LLM API call
 * @param model Model name (e.g., "gpt-4-turbo", "claude-3-opus")
 * @param tokens Token counts (input and output)
 * @returns Cost breakdown
 */
export function calculateCost(model: string, tokens: TokenCounts): CostBreakdown {
	const pricing = PRICING_MAP[model.toLowerCase()] || { input: 0, output: 0 };

	// Calculate costs: (tokens / 1000) * price_per_1k
	const inputCost = (tokens.input / 1000) * pricing.input;
	const outputCost = (tokens.output / 1000) * pricing.output;
	const totalCost = inputCost + outputCost;

	return {
		inputCost: parseFloat(inputCost.toFixed(6)),
		outputCost: parseFloat(outputCost.toFixed(6)),
		totalCost: parseFloat(totalCost.toFixed(6))
	};
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
	return `$${cost.toFixed(4)}`;
}

/**
 * Get available models and their estimated costs per 1K tokens
 */
export function getAvailableModels(): Array<{
	name: string;
	inputPrice: string;
	outputPrice: string;
}> {
	return Object.entries(PRICING_MAP).map(([name, pricing]) => ({
		name,
		inputPrice: `$${(pricing.input / 1000).toFixed(6)}/token`,
		outputPrice: `$${(pricing.output / 1000).toFixed(6)}/token`
	}));
}
