<script lang="ts">
	import FolderTree from '$lib/components/FolderTree.svelte';
	import TagModal from '$lib/components/TagModal.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import type { Folder, Tag, SearchResult } from '$lib/types';

	let { children } = $props();

	let folders = $state<Folder[]>([]);
	let tags = $state<Tag[]>([]);
	let selectedFolderId = $state<number | null>(null);
	let selectedTagIds = $state<number[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let showTagModal = $state(false);
	let isSidebarOpen = $state(true);

	// Load folders on mount
	async function loadFolders() {
		try {
			const response = await fetch('/api/folders');
			if (response.ok) {
				folders = await response.json();
			}
		} catch (err) {
			console.error('Failed to load folders:', err);
		}
	}

	// Load tags on mount
	async function loadTags() {
		try {
			const response = await fetch('/api/tags');
			if (response.ok) {
				const data = await response.json();
				tags = data.tags;
			}
		} catch (err) {
			console.error('Failed to load tags:', err);
		}
	}

	// Search prompts
	async function handleSearch(query: string, folderId: number | null, tagIds: number[]) {
		if (!query.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;
		try {
			const params = new URLSearchParams({ q: query });
			if (folderId) params.append('folderId', String(folderId));
			for (const tagId of tagIds) {
				params.append('tagId', String(tagId));
			}

			const response = await fetch(`/api/search?${params}`);
			if (response.ok) {
				const data = await response.json();
				searchResults = data.results;
			}
		} catch (err) {
			console.error('Search failed:', err);
		} finally {
			isSearching = false;
		}
	}

	// Create tag
	async function handleCreateTag(name: string, color: string) {
		try {
			const response = await fetch('/api/tags', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, color })
			});

			if (response.ok) {
				await loadTags();
			}
		} catch (err) {
			console.error('Failed to create tag:', err);
		}
	}

	// Update tag
	async function handleUpdateTag(tagId: number, name: string, color: string) {
		try {
			const response = await fetch(`/api/tags/${tagId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, color })
			});

			if (response.ok) {
				await loadTags();
			}
		} catch (err) {
			console.error('Failed to update tag:', err);
		}
	}

	// Delete tag
	async function handleDeleteTag(tagId: number) {
		if (confirm('Are you sure you want to delete this tag?')) {
			try {
				const response = await fetch(`/api/tags/${tagId}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					await loadTags();
				}
			} catch (err) {
				console.error('Failed to delete tag:', err);
			}
		}
	}

	// Move folder
	async function handleMoveFolder(folderId: number, targetFolderId: number | null) {
		try {
			const response = await fetch(`/api/folders/${folderId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ parentId: targetFolderId })
			});

			if (response.ok) {
				await loadFolders();
			}
		} catch (err) {
			console.error('Failed to move folder:', err);
		}
	}

	// Initialize on mount
	$effect(() => {
		loadFolders();
		loadTags();
	});
</script>

<div class="flex h-screen bg-gray-50">
	<!-- Sidebar toggle for mobile -->
	<button
		type="button"
		onclick={() => (isSidebarOpen = !isSidebarOpen)}
		class="fixed bottom-4 right-4 z-40 rounded-lg bg-blue-600 p-2 text-white md:hidden"
		aria-label="Toggle sidebar"
	>
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	</button>

	<!-- Sidebar -->
	{#if isSidebarOpen}
		<aside class="hidden w-64 bg-white md:block">
			<FolderTree
				{folders}
				{selectedFolderId}
				onSelectFolder={(id) => {
					selectedFolderId = id;
					handleSearch(searchQuery, id, selectedTagIds);
				}}
				onMoveFolder={handleMoveFolder}
			/>
		</aside>
	{/if}

	<!-- Main content -->
	<main class="flex-1 overflow-auto">
		<!-- Top bar with search and tag management -->
		<div class="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
			<div class="px-6 py-4">
				<div class="flex items-center justify-between gap-4 mb-4">
					<h1 class="text-2xl font-bold text-gray-900">Orchestra Sheets</h1>
					<button
						type="button"
						onclick={() => (showTagModal = true)}
						class="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
						aria-label="Manage tags"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
						Manage Tags
					</button>
				</div>

				<!-- Search bar -->
				<SearchBar
					query={searchQuery}
					{selectedFolderId}
					{selectedTagIds}
					{folders}
					{tags}
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
				/>
			</div>
		</div>

		<!-- Page content -->
		<div class="p-6">
			{@render children()}
		</div>
	</main>
</div>

<!-- Tag management modal -->
<TagModal
	isOpen={showTagModal}
	{tags}
	selectedTags={selectedTagIds}
	onClose={() => (showTagModal = false)}
	onCreate={handleCreateTag}
	onUpdate={handleUpdateTag}
	onDelete={handleDeleteTag}
	onSelect={(tId) => (selectedTagIds = [...selectedTagIds, tId])}
	onDeselect={(tId) => (selectedTagIds = selectedTagIds.filter((id) => id !== tId))}
/>
