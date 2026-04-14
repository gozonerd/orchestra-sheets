<script lang="ts">
	import FolderTree from '$lib/components/FolderTree.svelte';
	import TagModal from '$lib/components/TagModal.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import type { Folder, Tag } from '$lib/types';

	let showTagModal = $state(false);

	// Mock data for testing
	const mockFolders: Folder[] = [
		{
			id: 1,
			name: 'General',
			userId: 'test-user',
			parentId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			children: [
				{
					id: 2,
					name: 'Customer Support',
					userId: 'test-user',
					parentId: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					children: []
				},
				{
					id: 3,
					name: 'Content Creation',
					userId: 'test-user',
					parentId: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					children: []
				}
			]
		},
		{
			id: 4,
			name: 'Archive',
			userId: 'test-user',
			parentId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			children: []
		}
	];

	const mockTags: Tag[] = [
		{
			id: 1,
			name: 'High Priority',
			color: '#EF4444',
			userId: 'test-user',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 2,
			name: 'Review Needed',
			color: '#F59E0B',
			userId: 'test-user',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: 3,
			name: 'Completed',
			color: '#10B981',
			userId: 'test-user',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	let selectedFolderId = $state<number | null>(null);
	let selectedTagIds = $state<number[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let isSearching = $state(false);

	function handleSearch(query: string, folderId: number | null, tagIds: number[]) {
		isSearching = true;
		// Simulate search delay
		setTimeout(() => {
			searchResults = [
				{
					id: 1,
					name: 'Example Prompt 1',
					description: 'This is a test prompt',
					contentPreview: 'You are a helpful assistant that...',
					folderId,
					createdAt: new Date()
				},
				{
					id: 2,
					name: 'Example Prompt 2',
					description: 'Another test prompt',
					contentPreview: 'Generate a response to the following...',
					folderId,
					createdAt: new Date()
				}
			];
			isSearching = false;
		}, 500);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-7xl px-4 py-8">
		<h1 class="text-4xl font-bold text-gray-900 mb-2">UI Component Test Suite</h1>
		<p class="text-gray-600 mb-8">Testing Stage 07 UI components for accessibility and functionality</p>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Folder Tree Test -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-1">
				<h2 class="mb-4 text-xl font-bold text-gray-900">Folder Tree Component</h2>
				<div class="h-96 overflow-hidden rounded-lg border border-gray-200">
					<FolderTree
						folders={mockFolders}
						{selectedFolderId}
						onSelectFolder={(id) => {
							selectedFolderId = id;
							handleSearch(searchQuery, id, selectedTagIds);
						}}
						onMoveFolder={(folderId, targetFolderId) => {
							console.log(`Moving folder ${folderId} to ${targetFolderId}`);
						}}
					/>
				</div>
				<div class="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
					<p><strong>Selected Folder:</strong> {selectedFolderId ? `ID: ${selectedFolderId}` : 'None'}</p>
					<p class="mt-2 text-xs">💡 Tip: Use arrow keys to expand/collapse, Enter to select, drag handles to reorder</p>
				</div>
			</div>

			<!-- Search Bar Test -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2">
				<h2 class="mb-4 text-xl font-bold text-gray-900">Search Bar Component</h2>
				<SearchBar
					query={searchQuery}
					{selectedFolderId}
					{selectedTagIds}
					folders={mockFolders}
					tags={mockTags}
					results={searchResults}
					isLoading={isSearching}
					onSearch={(q, fId, tIds) => {
						searchQuery = q;
						selectedFolderId = fId;
						selectedTagIds = tIds;
						handleSearch(q, fId, tIds);
					}}
					onFolderSelect={(fId) => {
						selectedFolderId = fId;
						handleSearch(searchQuery, fId, selectedTagIds);
					}}
					onTagSelect={(tId) => {
						selectedTagIds = [...selectedTagIds, tId];
						handleSearch(searchQuery, selectedFolderId, selectedTagIds);
					}}
					onTagDeselect={(tId) => {
						selectedTagIds = selectedTagIds.filter((id) => id !== tId);
						handleSearch(searchQuery, selectedFolderId, selectedTagIds);
					}}
					onResultSelect={(result) => {
						console.log('Selected result:', result);
					}}
				/>

				<div class="mt-6 rounded-lg bg-green-50 p-4">
					<h3 class="font-semibold text-green-900 mb-2">Search State:</h3>
					<ul class="text-sm text-green-900 space-y-1">
						<li><strong>Query:</strong> {searchQuery || '(empty)'}</li>
						<li><strong>Folder Filter:</strong> {selectedFolderId || 'None'}</li>
						<li><strong>Tag Filters:</strong> {selectedTagIds.length > 0 ? selectedTagIds.join(', ') : 'None'}</li>
						<li><strong>Results:</strong> {searchResults.length} items</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Tag Modal Test -->
		<div class="mt-8 rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-bold text-gray-900">Tag Modal Component</h2>
				<button
					type="button"
					onclick={() => (showTagModal = true)}
					class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Open Tag Modal
				</button>
			</div>
			<p class="text-gray-600 mb-4">Click the button above to test the modal. Test creating, editing, and deleting tags.</p>

			<div class="rounded-lg bg-gray-50 p-4">
				<h3 class="font-semibold text-gray-900 mb-3">Current Tags:</h3>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
					{#each mockTags as tag}
						<div class="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
							<div
								class="h-4 w-4 rounded-full"
								style="background-color: {tag.color}"
							></div>
							<span class="text-sm font-medium text-gray-900">{tag.name}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Accessibility Test Info -->
		<div class="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
			<h2 class="mb-4 text-lg font-bold text-amber-900">♿ Accessibility Testing</h2>
			<ul class="space-y-2 text-sm text-amber-900">
				<li>✓ Folder Tree: Keyboard navigable (↑↓ to expand/collapse, Enter to select, Tab to move focus)</li>
				<li>✓ Search Bar: All form controls have labels, dropdown accessible via keyboard</li>
				<li>✓ Tag Modal: Modal dialog with proper roles, focus management, Escape to close</li>
				<li>✓ Color indicators: Always paired with text labels (no color-only meanings)</li>
				<li>✓ Focus indicators: Visible 2px blue rings on all interactive elements</li>
				<li>✓ Touch targets: All buttons/handles 44x44px or larger</li>
			</ul>
		</div>
	</div>
</div>

<!-- Tag Modal -->
<TagModal
	isOpen={showTagModal}
	tags={mockTags}
	selectedTags={selectedTagIds}
	onClose={() => (showTagModal = false)}
	onCreate={(name, color) => {
		console.log('Create tag:', { name, color });
	}}
	onUpdate={(id, name, color) => {
		console.log('Update tag:', { id, name, color });
	}}
	onDelete={(id) => {
		console.log('Delete tag:', id);
	}}
	onSelect={(id) => {
		selectedTagIds = [...selectedTagIds, id];
	}}
	onDeselect={(id) => {
		selectedTagIds = selectedTagIds.filter((tid) => tid !== id);
	}}
/>
