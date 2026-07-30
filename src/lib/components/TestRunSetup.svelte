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
		return matches.map((m) => m.replace(/[{}]/g, '')).filter((v, i, arr) => arr.indexOf(v) === i);
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
		<label for="prompt-select" class="mb-2 block text-sm font-medium"> Select Prompt </label>
		<select
			id="prompt-select"
			bind:value={selectedPromptId}
			onchange={handlePromptChange}
			class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
			<label class="mb-2 block text-sm font-medium"> Select Models (minimum 2 required) </label>
			<div class="grid grid-cols-2 gap-3">
				{#each availableModels as model (model)}
					<label class="flex cursor-pointer items-center space-x-2">
						<input
							type="checkbox"
							checked={selectedModels.has(model)}
							onchange={() => toggleModel(model)}
							class="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
						/>
						<span class="text-sm">{model}</span>
					</label>
				{/each}
			</div>
			{#if selectedModels.size < 2}
				<p class="mt-2 text-sm text-red-600">Select at least 2 models</p>
			{/if}
		</div>
	{/if}

	<!-- Variables Input -->
	{#if promptVariables.length > 0}
		<div class="form-group">
			<label class="mb-3 block text-sm font-medium"> Prompt Variables </label>
			<div class="space-y-3">
				{#each promptVariables as varName (varName)}
					<div>
						<label for={`var-${varName}`} class="mb-1 block text-sm font-medium">
							{varName}
						</label>
						<input
							id={`var-${varName}`}
							type="text"
							bind:value={variables[varName]}
							placeholder={`Enter value for ${varName}`}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
		class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
