<script lang="ts">
	import { onMount } from 'svelte';

	interface Version {
		versionNumber: number;
		createdAt: string;
		createdBy: string;
		preview: string;
	}

	interface DiffData {
		fromVersion: number;
		toVersion: number;
		diffs: Array<[number, string]>;
		additions: number;
		deletions: number;
	}

	let { data } = $props();
	let versions = $state<Version[]>([]);
	let selectedVersion = $state<number | null>(null);
	let diffVersion = $state<number | null>(null);
	let diffData = $state<DiffData | null>(null);
	let showRollbackDialog = $state(false);
	let rollbackTarget = $state<number | null>(null);
	let isLoading = $state(false);
	let error = $state('');

	onMount(async () => {
		await loadVersions();
	});

	async function loadVersions() {
		try {
			const response = await fetch(`/api/prompts/${data.promptId}/versions`);
			if (!response.ok) throw new Error('Failed to load versions');
			const result = await response.json();
			versions = result.versions;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load versions';
		}
	}

	async function loadDiff(from: number, to: number) {
		try {
			isLoading = true;
			const response = await fetch(`/api/prompts/${data.promptId}/diff?from=${from}&to=${to}`);
			if (!response.ok) throw new Error('Failed to compute diff');
			diffData = await response.json();
			selectedVersion = to;
			diffVersion = from;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load diff';
		} finally {
			isLoading = false;
		}
	}

	function confirmRollback(versionNumber: number) {
		rollbackTarget = versionNumber;
		showRollbackDialog = true;
	}

	async function executeRollback() {
		if (!rollbackTarget) return;

		try {
			isLoading = true;
			const response = await fetch(`/api/prompts/${data.promptId}/rollback`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ versionNumber: rollbackTarget })
			});

			if (!response.ok) throw new Error('Failed to rollback');

			showRollbackDialog = false;
			await loadVersions();
			diffData = null;
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Rollback failed';
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString();
	}

	function escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-6">
			<a href="/editor" class="text-blue-600 hover:text-blue-700">← Back to Editor</a>
			<h1 class="mt-2 text-3xl font-bold">{data.promptName} — Version History</h1>
			{#if data.promptDescription}
				<p class="mt-1 text-gray-600">{data.promptDescription}</p>
			{/if}
		</div>

		{#if error}
			<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
		{/if}

		<div class="grid grid-cols-3 gap-6">
			<!-- Version List -->
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h2 class="mb-4 text-lg font-semibold">All Versions</h2>
				<div class="space-y-2">
					{#each versions as version (version.versionNumber)}
						<div
							class="cursor-pointer rounded border-2 p-3 transition {selectedVersion ===
							version.versionNumber
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'}"
							role="button"
							tabindex="0"
							onclick={() => (selectedVersion = version.versionNumber)}
							onkeydown={(e) => e.key === 'Enter' && (selectedVersion = version.versionNumber)}
							aria-label="Select version {version.versionNumber}"
						>
							<div class="font-mono text-sm font-bold">v{version.versionNumber}</div>
							<div class="text-xs text-gray-600">{formatDate(version.createdAt)}</div>
							<div class="mt-1 truncate text-xs text-gray-700">{version.preview}</div>
							<button
								class="mt-2 w-full rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
								onclick={() => confirmRollback(version.versionNumber)}
								disabled={isLoading}
							>
								Rollback
							</button>
						</div>
					{/each}
				</div>
			</div>

			<!-- Diff Viewer -->
			<div class="col-span-2 rounded-lg border border-gray-200 bg-white p-4">
				{#if selectedVersion && diffVersion && diffData}
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold">
							Diff: v{diffData.fromVersion} → v{diffData.toVersion}
						</h2>
						<div class="text-sm text-gray-600">
							+{diffData.additions} -{diffData.deletions}
						</div>
					</div>

					<div class="space-y-2 rounded bg-gray-50 p-4 font-mono text-sm">
						{#each diffData.diffs as [type, text]}
							{#if type === 0}
								<div class="text-gray-700">{escapeHtml(text)}</div>
							{:else if type === 1}
								<div class="bg-green-100 text-green-900">+ {escapeHtml(text)}</div>
							{:else}
								<div class="bg-red-100 text-red-900">- {escapeHtml(text)}</div>
							{/if}
						{/each}
					</div>

					<button
						class="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
						onclick={() => confirmRollback(diffVersion)}
						disabled={isLoading}
					>
						Rollback to v{diffVersion}
					</button>
				{:else if selectedVersion}
					<div class="text-gray-500">
						<p>Select another version to compare with v{selectedVersion}</p>
						<div class="mt-4 space-y-2">
							{#each versions as version}
								{#if version.versionNumber !== selectedVersion}
									<button
										class="block w-full rounded bg-blue-100 px-3 py-2 text-left text-blue-900 hover:bg-blue-200"
										onclick={() => loadDiff(version.versionNumber, selectedVersion)}
										disabled={isLoading}
									>
										Compare with v{version.versionNumber}
									</button>
								{/if}
							{/each}
						</div>
					</div>
				{:else}
					<div class="text-gray-500">Select a version to view details</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Rollback Confirmation Dialog -->
	{#if showRollbackDialog}
		<div class="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black">
			<div class="rounded-lg bg-white p-6">
				<h3 class="text-lg font-bold">Confirm Rollback</h3>
				<p class="mt-2 text-gray-600">
					Restore to version <span class="font-mono font-bold">v{rollbackTarget}</span>?
				</p>
				<p class="mt-1 text-sm text-gray-500">
					This will create a new version with the restored content.
				</p>
				<div class="mt-6 flex gap-3">
					<button
						class="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
						onclick={() => (showRollbackDialog = false)}
						disabled={isLoading}
					>
						Cancel
					</button>
					<button
						class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
						onclick={executeRollback}
						disabled={isLoading}
					>
						{isLoading ? 'Restoring...' : 'Restore'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>
