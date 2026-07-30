<script lang="ts">
	import type { TestRun, TestRunResult } from '$lib/types';

	interface Props {
		testRun?: TestRun;
		results?: TestRunResult[];
		isLoading?: boolean;
	}

	let { testRun, results = [], isLoading = false }: Props = $props();

	let selectedModel: string | null = $state(null);

	// Initialize selected model
	$effect(() => {
		if (results.length > 0 && !selectedModel) {
			selectedModel = results[0].model;
		}
	});

	// Get result for selected model
	function getSelectedResult(): TestRunResult | undefined {
		return results.find((r) => r.model === selectedModel);
	}

	// Format cost as currency
	function formatCost(cost?: number): string {
		if (!cost) return '$0.00';
		return `$${cost.toFixed(4)}`;
	}

	// Format latency
	function formatLatency(latency?: number): string {
		if (!latency) return '0ms';
		return `${latency}ms`;
	}
</script>

<div class="test-run-results flex h-full flex-col">
	<!-- Results Header -->
	{#if testRun}
		<div class="flex items-center justify-between border-b bg-gray-50 p-4">
			<div>
				<h2 class="text-lg font-semibold">Test Run Results</h2>
				<p class="text-sm text-gray-600">
					Total Cost: {formatCost(testRun.totalCost)}
				</p>
			</div>
			{#if isLoading}
				<div class="flex items-center space-x-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
					></div>
					<span class="text-sm text-gray-600">Running...</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Main Content Area -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Model Tabs (Left Pane) -->
		<div class="w-32 overflow-y-auto border-r bg-gray-100">
			{#each results as result (result.model)}
				<button
					onclick={() => (selectedModel = result.model)}
					class="w-full border-b px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-gray-200"
					class:bg-white={selectedModel === result.model}
					class:bg-gray-100={selectedModel !== result.model}
				>
					<div class="truncate font-semibold">{result.model}</div>
					<div class="mt-1 text-xs text-gray-600">
						{#if result.status === 'success'}
							<span class="text-green-600">✓ Success</span>
						{:else}
							<span class="text-red-600">✗ Error</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		<!-- Result Display (Right Pane) -->
		<div class="flex-1 overflow-y-auto p-6">
			{#if selectedModel}
				{@const result = getSelectedResult()}
				{#if result}
					{#if result.status === 'success'}
						<!-- Success State -->
						<div class="space-y-6">
							<!-- Metrics -->
							<div class="grid grid-cols-3 gap-4">
								<div class="rounded-lg bg-blue-50 p-4">
									<p class="text-xs text-gray-600 uppercase">Cost</p>
									<p class="mt-1 text-2xl font-bold text-blue-600">
										{formatCost(result.cost)}
									</p>
								</div>
								<div class="rounded-lg bg-green-50 p-4">
									<p class="text-xs text-gray-600 uppercase">Latency</p>
									<p class="mt-1 text-2xl font-bold text-green-600">
										{formatLatency(result.latency)}
									</p>
								</div>
								<div class="rounded-lg bg-purple-50 p-4">
									<p class="text-xs text-gray-600 uppercase">Tokens</p>
									<p class="mt-1 text-sm text-gray-700">
										{#if result.tokens}
											{result.tokens.input + result.tokens.output} total
										{:else}
											N/A
										{/if}
									</p>
								</div>
							</div>

							<!-- Output -->
							<div>
								<h3 class="mb-3 text-sm font-semibold">Output</h3>
								<div
									class="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm break-words whitespace-pre-wrap"
								>
									{result.text || 'No output'}
								</div>
							</div>

							<!-- Token Details -->
							{#if result.tokens}
								<div class="border-t pt-4">
									<h3 class="mb-2 text-sm font-semibold">Token Breakdown</h3>
									<div class="grid grid-cols-2 gap-4 text-sm">
										<div>
											<p class="text-gray-600">Input Tokens</p>
											<p class="font-semibold">{result.tokens.input}</p>
										</div>
										<div>
											<p class="text-gray-600">Output Tokens</p>
											<p class="font-semibold">{result.tokens.output}</p>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<!-- Error State -->
						<div class="rounded-lg border border-red-200 bg-red-50 p-4">
							<p class="text-sm font-medium text-red-800">Error</p>
							<p class="mt-1 text-sm text-red-700">{result.error || 'Unknown error'}</p>
						</div>
					{/if}
				{/if}
			{:else}
				<p class="text-gray-500">Select a model to view results</p>
			{/if}
		</div>
	</div>

	<!-- Results Comparison Table (Bottom) -->
	{#if results.length > 0}
		<div class="overflow-x-auto border-t bg-gray-50 p-4">
			<h3 class="mb-3 text-sm font-semibold">Comparison Summary</h3>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b">
						<th class="px-2 py-2 text-left font-semibold">Model</th>
						<th class="px-2 py-2 text-right font-semibold">Cost</th>
						<th class="px-2 py-2 text-right font-semibold">Latency</th>
						<th class="px-2 py-2 text-right font-semibold">Tokens</th>
						<th class="px-2 py-2 text-center font-semibold">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each results as result (result.model)}
						<tr class="border-b transition-colors hover:bg-white">
							<td class="px-2 py-2 font-medium">{result.model}</td>
							<td class="px-2 py-2 text-right">{formatCost(result.cost)}</td>
							<td class="px-2 py-2 text-right">{formatLatency(result.latency)}</td>
							<td class="px-2 py-2 text-right">
								{#if result.tokens}
									{result.tokens.input + result.tokens.output}
								{:else}
									—
								{/if}
							</td>
							<td class="px-2 py-2 text-center">
								{#if result.status === 'success'}
									<span class="font-medium text-green-600">✓</span>
								{:else}
									<span class="font-medium text-red-600">✗</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.test-run-results {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
</style>
