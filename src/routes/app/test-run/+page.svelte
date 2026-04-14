<script lang="ts">
	import TestRunSetup from '$lib/components/TestRunSetup.svelte';
	import TestRunResults from '$lib/components/TestRunResults.svelte';
	import type { TestRun, Prompt } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let prompts: Prompt[] = $state(data.prompts);
	let availableModels: string[] = $state(data.availableModels);
	let currentTestRun: TestRun | null = $state(null);
	let testResults: any[] = $state([]);
	let isLoading: boolean = $state(false);
	let error: string | null = $state(null);
	let activeTab: 'setup' | 'history' = $state('setup');

	// Handle test run submission
	async function handleTestRunSubmit(data: {
		promptId: number;
		modelIds: string[];
		variables: Record<string, string>;
	}) {
		isLoading = true;
		error = null;
		testResults = [];

		try {
			// Create test run
			const createResponse = await fetch('/api/test-runs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!createResponse.ok) {
				throw new Error('Failed to create test run');
			}

			const { id: testRunId } = await createResponse.json();
			currentTestRun = {
				id: testRunId,
				userId: '', // Will be set on server
				promptId: data.promptId,
				status: 'pending',
				models: data.modelIds,
				testInputs: data.variables,
				totalCost: 0,
				createdAt: new Date()
			};

			// Execute test run
			const executeResponse = await fetch(`/api/test-runs/${testRunId}/execute`, {
				method: 'POST'
			});

			if (!executeResponse.ok) {
				throw new Error('Failed to execute test run');
			}

			const result = await executeResponse.json();
			currentTestRun = {
				...currentTestRun,
				status: result.status,
				results: result.results,
				totalCost: result.totalCost,
				completedAt: new Date()
			};
			testResults = result.results;
		} catch (e) {
			error = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error(e);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="h-screen flex flex-col bg-white">
	<!-- Header -->
	<div class="bg-blue-600 text-white shadow">
		<div class="max-w-6xl mx-auto px-6 py-4">
			<h1 class="text-2xl font-bold">A/B Test Models</h1>
			<p class="text-blue-100 text-sm mt-1">
				Compare prompts across multiple LLM models with real-time cost and latency metrics
			</p>
		</div>
	</div>

	<!-- Tab Navigation -->
	<div class="border-b bg-gray-50">
		<div class="max-w-6xl mx-auto px-6 flex space-x-4">
			<button
				onclick={() => (activeTab = 'setup')}
				class="px-4 py-3 font-medium border-b-2 transition-colors"
				class:border-blue-600={activeTab === 'setup'}
				class:text-blue-600={activeTab === 'setup'}
				class:border-transparent={activeTab !== 'setup'}
				class:text-gray-600={activeTab !== 'setup'}
			>
				New Test Run
			</button>
			<button
				onclick={() => (activeTab = 'history')}
				class="px-4 py-3 font-medium border-b-2 transition-colors"
				class:border-blue-600={activeTab === 'history'}
				class:text-blue-600={activeTab === 'history'}
				class:border-transparent={activeTab !== 'history'}
				class:text-gray-600={activeTab !== 'history'}
			>
				History
			</button>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 overflow-hidden">
		<div class="max-w-6xl mx-auto px-6 py-6 h-full">
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p class="text-red-800 font-medium">{error}</p>
				</div>
			{/if}

			{#if activeTab === 'setup'}
				<div class="grid grid-cols-2 gap-8 h-full">
					<!-- Setup Form (Left) -->
					<div class="bg-white border rounded-lg p-6">
						<h2 class="text-lg font-semibold mb-4">Test Configuration</h2>
						<TestRunSetup
							{prompts}
							{availableModels}
							isLoading={isLoading}
							onSubmit={handleTestRunSubmit}
						/>
					</div>

					<!-- Results (Right) -->
					<div class="bg-white border rounded-lg overflow-hidden flex flex-col">
						{#if currentTestRun && testResults.length > 0}
							<TestRunResults
								testRun={currentTestRun}
								results={testResults}
								isLoading={isLoading}
							/>
						{:else if isLoading}
							<div class="flex items-center justify-center h-full">
								<div class="text-center">
									<div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
									<p class="text-gray-600">Running test...</p>
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-center h-full text-gray-500">
								<p>Results will appear here</p>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div class="bg-white border rounded-lg p-6">
					<h2 class="text-lg font-semibold mb-4">Test Run History</h2>
					<p class="text-gray-600">History feature coming soon</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
