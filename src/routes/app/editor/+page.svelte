<script lang="ts">
	import {
		parseVariables,
		getUniqueVariableNames,
		validatePrompt
	} from '$lib/prompts/variables';

	let promptName = $state('');
	let promptContent = $state('');
	let promptDescription = $state('');
	let promptStatus = $state<'draft' | 'active' | 'archived'>('draft');
	let promptFolderId = $state<number | null>(null);
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
					status: promptStatus,
					folderId: promptFolderId
				})
			});

			if (response.ok) {
				saveMessage = 'Prompt saved successfully!';
				promptName = '';
				promptContent = '';
				promptDescription = '';
				promptStatus = 'draft';
				promptFolderId = null;
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

<div class="mx-auto max-w-4xl">
	<h1 class="text-4xl font-bold text-gray-900">Create Prompt</h1>

	<!-- Form Section -->
	<div class="mt-8 space-y-6">
		<!-- Prompt Name -->
		<div>
			<label for="prompt-name" class="block text-sm font-medium text-gray-900">
				Prompt Name <span class="text-red-600" aria-label="required">*</span>
			</label>
			<input
				id="prompt-name"
				bind:value={promptName}
				type="text"
				placeholder="e.g., Customer Support Response"
				required
				class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				aria-describedby="prompt-name-help"
			/>
			<p id="prompt-name-help" class="mt-1 text-sm text-gray-600">
				Give your prompt a descriptive name for easy identification
			</p>
		</div>

		<!-- Prompt Description -->
		<div>
			<label for="prompt-description" class="block text-sm font-medium text-gray-900">
				Description <span class="text-gray-500 text-xs">(optional)</span>
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
				Prompt Content <span class="text-red-600" aria-label="required">*</span>
			</label>
			<p class="mt-1 text-xs text-gray-600">
				Use <code class="font-mono bg-gray-100 px-1 py-0.5 rounded">{'{{variable}}'}</code> syntax for
				placeholders. Example:
				<code class="font-mono bg-gray-100 px-1 py-0.5 rounded">{'{{name}}'}</code>
				or with default:
				<code class="font-mono bg-gray-100 px-1 py-0.5 rounded">{'{{name|User}}'}</code>
			</p>
			<textarea
				id="prompt-content"
				bind:value={promptContent}
				placeholder="Enter your prompt template here..."
				required
				rows="12"
				class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
				aria-describedby="variable-help"
			></textarea>
		</div>

		<!-- Status Selector -->
		<div>
			<label for="prompt-status" class="block text-sm font-medium text-gray-900">Status</label>
			<select
				id="prompt-status"
				bind:value={promptStatus}
				class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			>
				<option value="draft">Draft</option>
				<option value="active">Active</option>
				<option value="archived">Archived</option>
			</select>
		</div>

		<!-- Save Button -->
		<button
			onclick={savePrompt}
			disabled={isSaving || !promptName || !promptContent}
			class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
		>
			{isSaving ? 'Saving...' : 'Save Prompt'}
		</button>

		{#if saveMessage}
			<div
				class="rounded-lg bg-green-50 p-4 text-green-800 border border-green-200"
				role="status"
				aria-live="polite"
			>
				{saveMessage}
			</div>
		{/if}
	</div>

	<!-- Variables Panel -->
	<div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Validation Info -->
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="font-semibold text-gray-900 text-lg">Validation</h2>
			{#if validation.valid}
				<div class="mt-3 flex items-center gap-2 text-green-600">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
					</svg>
					<span class="text-sm font-medium">Template is valid</span>
				</div>
			{:else}
				<div class="mt-3 space-y-2">
					{#each validation.errors as error}
						<div class="flex items-start gap-2 text-red-600">
							<svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
							</svg>
							<span class="text-sm">{error}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Variables Summary -->
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="font-semibold text-gray-900 text-lg">Variables Detected</h2>
			<p class="mt-3 text-sm text-gray-600">
				Found <strong>{variables.length}</strong>
				variable{variables.length !== 1 ? 's' : ''} ({uniqueVars.length} unique)
			</p>
			{#if uniqueVars.length > 0}
				<div class="mt-3 space-y-2">
					{#each uniqueVars as varName}
						<div class="rounded-lg bg-blue-50 px-3 py-2 font-mono text-sm text-blue-900 border border-blue-200">
							<code>{'{{' + varName + '}}'}</code>
						</div>
					{/each}
				</div>
			{:else}
				<p class="mt-3 text-sm text-gray-500">No variables defined yet</p>
			{/if}
		</div>
	</div>

	<!-- Keyboard Navigation Help -->
	<div class="mt-8 rounded-lg bg-blue-50 border border-blue-200 p-6" id="variable-help">
		<h3 class="font-semibold text-blue-900 text-lg">Keyboard Navigation</h3>
		<ul class="mt-3 space-y-2 text-sm text-blue-900">
			<li class="flex gap-2">
				<kbd class="font-mono bg-white px-2 py-1 rounded border border-blue-300 flex-shrink-0">Tab</kbd>
				<span>Move between fields</span>
			</li>
			<li class="flex gap-2">
				<kbd class="font-mono bg-white px-2 py-1 rounded border border-blue-300 flex-shrink-0">Shift+Tab</kbd>
				<span>Move to previous field</span>
			</li>
			<li class="flex gap-2">
				<kbd class="font-mono bg-white px-2 py-1 rounded border border-blue-300 flex-shrink-0">Ctrl+S</kbd>
				<span>Save prompt</span>
			</li>
			<li class="flex gap-2">
				<kbd class="font-mono bg-white px-2 py-1 rounded border border-blue-300 flex-shrink-0">Ctrl+Enter</kbd>
				<span>Save prompt from content field</span>
			</li>
		</ul>
	</div>
</div>

<style>
	code {
		background-color: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}
</style>
