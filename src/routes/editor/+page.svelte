<script lang="ts">
	import { parseVariables, getUniqueVariableNames, validatePrompt } from '$lib/prompts/variables';

	let promptName = $state('');
	let promptContent = $state('');
	let promptDescription = $state('');
	let promptStatus = $state<'draft' | 'active' | 'archived'>('draft');
	let isSaving = $state(false);
	let saveMessage = $state('');

	let variables = $derived(parseVariables(promptContent));
	let uniqueVars = $derived(getUniqueVariableNames(promptContent));
	let validation = $derived(validatePrompt(promptContent));

	async function savePrompt() {
		if (!promptName || !promptContent) {
			alert('Please fill in name and content');
			return;
		}

		isSaving = true;
		try {
			const response = await fetch('/api/prompts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: promptName,
					description: promptDescription,
					content: promptContent,
					status: promptStatus
				})
			});

			if (response.ok) {
				saveMessage = 'Prompt saved successfully!';
				setTimeout(() => (saveMessage = ''), 3000);
			} else {
				saveMessage = 'Error saving prompt';
			}
		} catch (err) {
			saveMessage = 'Failed to save prompt';
			console.error(err);
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-8">
		<h1 class="text-4xl font-bold">Prompt Editor</h1>

		<!-- Form Section -->
		<div class="mt-8 space-y-6">
			<!-- Prompt Name -->
			<div>
				<label for="prompt-name" class="block text-sm font-medium text-gray-900">
					Prompt Name
				</label>
				<input
					id="prompt-name"
					bind:value={promptName}
					type="text"
					placeholder="e.g., Customer Support Response"
					class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<!-- Prompt Description -->
			<div>
				<label for="prompt-description" class="block text-sm font-medium text-gray-900">
					Description (optional)
				</label>
				<textarea
					id="prompt-description"
					bind:value={promptDescription}
					placeholder="Describe what this prompt does..."
					rows="2"
					class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				></textarea>
			</div>

			<!-- Prompt Content Editor -->
			<div>
				<label for="prompt-content" class="block text-sm font-medium text-gray-900">
					Prompt Content
				</label>
				<p class="mt-1 text-xs text-gray-600">
					Use <code class="font-mono">{'{{variable}}'}</code> syntax for placeholders. Example:
					<code class="font-mono">{'{{name}}'}</code>
					or with default:
					<code class="font-mono">{'{{name|User}}'}</code>
				</p>
				<textarea
					id="prompt-content"
					bind:value={promptContent}
					placeholder="Enter your prompt template here..."
					rows="12"
					class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					aria-describedby="variable-help"
				></textarea>
			</div>

			<!-- Status Selector -->
			<div>
				<label for="prompt-status" class="block text-sm font-medium text-gray-900"> Status </label>
				<select
					id="prompt-status"
					bind:value={promptStatus}
					class="mt-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				>
					<option value="draft">Draft</option>
					<option value="active">Active</option>
					<option value="archived">Archived</option>
				</select>
			</div>

			<!-- Save Button -->
			<button
				onclick={savePrompt}
				disabled={isSaving}
				class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400"
			>
				{isSaving ? 'Saving...' : 'Save Prompt'}
			</button>

			{#if saveMessage}
				<div class="rounded-lg bg-green-50 p-4 text-green-800">
					{saveMessage}
				</div>
			{/if}
		</div>

		<!-- Variables Panel -->
		<div class="mt-8 grid grid-cols-2 gap-6">
			<!-- Validation Info -->
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h2 class="font-semibold text-gray-900">Validation</h2>
				{#if validation.valid}
					<p class="mt-2 text-sm text-green-600">✓ Template is valid</p>
				{:else}
					<div class="mt-2 space-y-1">
						{#each validation.errors as error}
							<p class="text-sm text-red-600">✗ {error}</p>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Variables Summary -->
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h2 class="font-semibold text-gray-900">Variables</h2>
				<p class="mt-2 text-sm text-gray-600">
					Found <strong>{variables.length}</strong> variable{variables.length !== 1 ? 's' : ''} ({uniqueVars.length}
					unique)
				</p>
				{#if uniqueVars.length > 0}
					<div class="mt-3 space-y-1">
						{#each uniqueVars as varName}
							<div class="rounded bg-blue-50 px-2 py-1 font-mono text-sm text-blue-900">
								{'{{'}
								{varName}
								{'}}'}
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-3 text-sm text-gray-500">No variables defined</p>
				{/if}
			</div>
		</div>

		<!-- Keyboard Navigation Help -->
		<div class="mt-8 rounded-lg bg-blue-50 p-4" id="variable-help">
			<h3 class="font-semibold text-blue-900">Keyboard Navigation</h3>
			<ul class="mt-2 space-y-1 text-sm text-blue-900">
				<li><kbd class="font-mono">Tab</kbd> - Move between fields</li>
				<li><kbd class="font-mono">Shift+Tab</kbd> - Move to previous field</li>
				<li>
					<kbd class="font-mono">Ctrl+S</kbd> or <kbd class="font-mono">Cmd+S</kbd> - Save prompt
				</li>
				<li><kbd class="font-mono">Ctrl+Enter</kbd> in content - Save prompt</li>
			</ul>
		</div>
	</div>
</div>

<style>
	code {
		background-color: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}
</style>
