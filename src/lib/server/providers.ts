/**
 * LLM Provider Client Factory
 * Abstracts provider-specific clients (OpenAI, Anthropic, etc.)
 * Uses Vercel AI SDK which provides unified interface
 */

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

interface ProviderClient {
	model: ReturnType<typeof openai | typeof anthropic | typeof google>;
	options?: Record<string, unknown>;
}

/**
 * Get provider client based on model identifier
 * @param model Model name (e.g., "gpt-4-turbo", "claude-3-opus", "gemini-pro")
 * @param apiKey Decrypted API key for the provider
 * @returns Provider client for Vercel AI SDK
 */
export function getProvider(model: string, apiKey: string): ProviderClient {
	const lowerModel = model.toLowerCase();

	// OpenAI models
	if (lowerModel.startsWith('gpt-')) {
		return {
			model: openai(model, { apiKey })
		};
	}

	// Anthropic models
	if (lowerModel.startsWith('claude-')) {
		return {
			model: anthropic(model, { apiKey })
		};
	}

	// Google Gemini models
	if (lowerModel.startsWith('gemini-')) {
		return {
			model: google(model, { apiKey })
		};
	}

	// Default to OpenAI if unclear
	console.warn(`Unknown model prefix: ${model}, defaulting to OpenAI`);
	return {
		model: openai(model, { apiKey })
	};
}

/**
 * Get provider name from model identifier
 */
export function getProviderName(model: string): string {
	const lowerModel = model.toLowerCase();

	if (lowerModel.startsWith('gpt-')) return 'openai';
	if (lowerModel.startsWith('claude-')) return 'anthropic';
	if (lowerModel.startsWith('gemini-')) return 'google';
	if (lowerModel.startsWith('llama-')) return 'meta';

	return 'unknown';
}

/**
 * Validate model name is recognized
 */
export function isValidModel(model: string): boolean {
	return (
		/^gpt-/.test(model) ||
		/^claude-/.test(model) ||
		/^gemini-/.test(model) ||
		/^llama-/.test(model)
	);
}
