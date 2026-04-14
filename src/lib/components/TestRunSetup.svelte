<script lang="ts">
	import type { Prompt } from '$lib/types';

	interface Props {
		prompts?: Prompt[];
		availableModels?: string[];
		isLoading?: boolean;
		onSubmit?: (data: {
			promptId: number;
			modelIds: string[];
			variables: Record<string, string>;
		}) => void;
	}

	let {
		prompts = [],
		availableModels = [],
		isLoading = false,
		onSubmit = undefined
	}: Props = $props();

	let selectedPromptId: number | null = $state(null);
	let selectedModels: Set<string> = $state(new Set());
	let variables: Record<string, string> = $state({});
	let promptVariables: string[] = $state([]);

	// Extract variables from prompt template
	function extractVariables(template: string): string[] {
		const matches = template.match(/\{\{(\w+)\}\}/g) || [];
		return matches
			.map((m) => m.replace(/[{}]/g, ''))
			.filter((v, i, arr) => arr.indexOf(v) === i);
	}

	// Update variables when prompt changes
	function handlePromptChange() {
		if (selectedPromptId !== null) {
			const prompt = prompts.find((p) => p.id === selectedPromptId);
			if (prompt) {
				promptVariables = extractVariables(prompt.content || '');
				// Reset variables
				variables = {};
				promptVariables.forEach((v) => {
					variables[v] = '';
				});
			}
		}
		selectedModels = new Set();
	}

	// Toggle model selection
	function toggleModel(model: string) {
		if (selectedModels.has(model)) {
			selectedModels.delete(model);
		} else {
			selectedModels.add(model);
		}
		selectedModels = selectedModels; // Trigger reactivity
	}

	// Check if form is valid
	function isFormValid(): boolean {
		return (
			selectedPromptId !== null &&
			selectedModels.size >= 2 &&
			promptVariables.every((v) => variables[v]?.trim())
		);
	}

	// Submit form
	function handleSubmit() {
		if (!isFormValid()) return;

		onSubmit?.({
			promptId: selectedPromptId!,
			modelIds: Array.from(selectedModels),
			variables
		});
	}
</script>

<div class="test-run-setup space-y-6">
	<!-- Prompt Selection -->
	<div class="form-group">
		<label for="prompt-select" class="block text-sm font-medium mb-2">
			Select Prompt
		</label>
		<select
			id="prompt-select"
			bind:value={selectedPromptId}
			onchange={handlePromptChange}
			class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value={null}>-- Choose a prompt --</option>
			{#each prompts as prompt (prompt.id)}
				<option value={prompt.id}>
					{prompt.name}
				</option>
			{/each}
		</select>
	</div>

	<!-- Model Selection -->
	{#if selectedPromptId !== null}
		<div class="form-group">
			<label class="block text-sm font-medium mb-2">
				Select Models (minimum 2 required)
			</label>
			<div class="grid grid-cols-2 gap-3">
				{#each availableModels as model (model)}
					<label class="flex items-center space-x-2 cursor-pointer">
						<input
							type="checkbox"
							checked={selectedModels.has(model)}
							onchange={() => toggleModel(model)}
							class="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
						/>
						<span class="text-sm">{model}</span>
					</label>
				{/each}
			</div>
			{#if selectedModels.size < 2}
				<p class="text-sm text-red-600 mt-2">
					Select at least 2 models
				</p>
			{/if}
		</div>
	{/if}

	<!-- Variables Input -->
	{#if promptVariables.length > 0}
		<div class="form-group">
			<label class="block text-sm font-medium mb-3">
				Prompt Variables
			</label>
			<div class="space-y-3">
				{#each promptVariables as varName (varName)}
					<div>
						<label for={`var-${varName}`} class="block text-sm font-medium mb-1">
							{varName}
						</label>
						<input
							id={`var-${varName}`}
							type="text"
							bind:value={variables[varName]}
							placeholder={`Enter value for ${varName}`}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Submit Button -->
	<button
		onclick={handleSubmit}
		disabled={!isFormValid() || isLoading}
		class="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
	>
		{isLoading ? 'Running Test...' : 'Run A/B Test'}
	</button>
</div>

<style>
	.test-run-setup {
		width: 100%;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}
</style>
