<script lang="ts">
	import type { Folder, Tag, SearchResult } from '$lib/types';

	interface Props {
		query?: string;
		selectedFolderId?: number | null;
		selectedTagIds?: number[];
		folders?: Folder[];
		tags?: Tag[];
		results?: SearchResult[];
		isLoading?: boolean;
		onSearch?: (query: string, folderId: number | null, tagIds: number[]) => void;
		onFolderSelect?: (folderId: number | null) => void;
		onTagSelect?: (tagId: number) => void;
		onTagDeselect?: (tagId: number) => void;
		onResultSelect?: (result: SearchResult) => void;
	}

	let {
		query = '',
		selectedFolderId = null,
		selectedTagIds = [],
		folders = [],
		tags = [],
		results = [],
		isLoading = false,
		onSearch = undefined,
		onFolderSelect = undefined,
		onTagSelect = undefined,
		onTagDeselect = undefined,
		onResultSelect = undefined
	}: Props = $props();

	let showFolderDropdown = $state(false);
	let showTagDropdown = $state(false);
	let showResults = $state(false);

	function handleSearch() {
		onSearch?.(query, selectedFolderId, selectedTagIds);
		showResults = true;
	}

	function handleQueryChange() {
		if (query.trim()) {
			handleSearch();
		} else {
			showResults = false;
		}
	}

	function handleFolderSelect(folderId: number | null) {
		onFolderSelect?.(folderId);
		showFolderDropdown = false;
		handleSearch();
	}

	function handleTagToggle(tagId: number) {
		if (selectedTagIds.includes(tagId)) {
			onTagDeselect?.(tagId);
		} else {
			onTagSelect?.(tagId);
		}
		handleSearch();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSearch();
		}
	}

	function flattenFolders(
		folders: Folder[],
		prefix = ''
	): Array<{ folder: Folder; indent: string }> {
		const result: Array<{ folder: Folder; indent: string }> = [];
		for (const folder of folders) {
			result.push({ folder, indent: prefix });
			if (folder.children) {
				result.push(...flattenFolders(folder.children, prefix + '  '));
			}
		}
		return result;
	}

	const flatFolders = $derived(flattenFolders(folders));
</script>

<div class="space-y-4">
	<!-- Main search bar -->
	<div class="relative flex gap-2">
		<div class="flex-1">
			<input
				type="text"
				bind:value={query}
				onchange={handleQueryChange}
				onkeydown={handleKeyDown}
				placeholder="Search prompts by name or description..."
				class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				aria-label="Search prompts"
			/>
		</div>

		<button
			type="button"
			onclick={handleSearch}
			disabled={isLoading}
			class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400"
			aria-label="Search"
		>
			{#if isLoading}
				<svg class="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 5v.01M12 12v.01M12 19v.01M19 12a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			{:else}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			{/if}
		</button>
	</div>

	<!-- Filter pills -->
	<div class="flex flex-wrap items-center gap-3">
		<!-- Folder dropdown -->
		<div class="relative">
			<button
				type="button"
				onclick={() => (showFolderDropdown = !showFolderDropdown)}
				class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				aria-label="Filter by folder"
				aria-haspopup="listbox"
				aria-expanded={showFolderDropdown}
			>
				<svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
					/>
				</svg>
				{#if selectedFolderId}
					Folder: {folders.find((f) => f.id === selectedFolderId)?.name}
				{:else}
					All Folders
				{/if}
			</button>

			{#if showFolderDropdown}
				<div
					class="absolute top-full left-0 z-50 mt-2 w-48 rounded-lg border border-gray-300 bg-white shadow-lg"
					role="listbox"
				>
					<button
						type="button"
						onclick={() => handleFolderSelect(null)}
						class="w-full px-4 py-2 text-left text-sm first:rounded-t-lg hover:bg-gray-100"
						class:bg-blue-50={selectedFolderId === null}
						class:font-semibold={selectedFolderId === null}
					>
						All Folders
					</button>
					{#each flatFolders as { folder, indent }}
						<button
							type="button"
							onclick={() => handleFolderSelect(folder.id)}
							class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
							class:bg-blue-50={selectedFolderId === folder.id}
							class:font-semibold={selectedFolderId === folder.id}
							style="padding-left: {1 + 0.25 * indent.length}rem"
						>
							{indent}{folder.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Tag dropdown -->
		<div class="relative">
			<button
				type="button"
				onclick={() => (showTagDropdown = !showTagDropdown)}
				class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				aria-label="Filter by tags"
				aria-haspopup="listbox"
				aria-expanded={showTagDropdown}
			>
				<svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
					/>
				</svg>
				{#if selectedTagIds.length > 0}
					Tags: {selectedTagIds.length}
				{:else}
					All Tags
				{/if}
			</button>

			{#if showTagDropdown}
				<div
					class="absolute top-full left-0 z-50 mt-2 w-56 rounded-lg border border-gray-300 bg-white shadow-lg"
					role="listbox"
				>
					<div class="max-h-60 overflow-y-auto p-2">
						{#if tags.length === 0}
							<p class="px-4 py-2 text-sm text-gray-500">No tags available</p>
						{:else}
							{#each tags as tag}
								<label class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100">
									<input
										type="checkbox"
										checked={selectedTagIds.includes(tag.id)}
										onchange={() => handleTagToggle(tag.id)}
										class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
									/>
									<div
										class="h-4 w-4 rounded-full"
										style="background-color: {tag.color}"
										aria-label="Tag color: {tag.color}"
									></div>
									<span class="text-sm font-medium text-gray-900">{tag.name}</span>
								</label>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Search results dropdown -->
	{#if showResults && query.trim()}
		<div
			class="rounded-lg border border-gray-300 bg-white shadow-lg"
			role="region"
			aria-label="Search results"
		>
			{#if isLoading}
				<div class="flex items-center justify-center gap-2 px-4 py-8">
					<svg
						class="h-5 w-5 animate-spin text-blue-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span class="text-sm text-gray-600">Searching...</span>
				</div>
			{:else if results.length === 0}
				<div class="px-4 py-8 text-center">
					<p class="text-sm text-gray-600">No results found for "{query}"</p>
				</div>
			{:else}
				<div class="max-h-96 overflow-y-auto">
					{#each results as result (result.id)}
						<button
							type="button"
							onclick={() => onResultSelect?.(result)}
							class="w-full border-b border-gray-200 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset"
						>
							<p class="font-semibold text-gray-900">{result.name}</p>
							{#if result.description}
								<p class="mt-1 text-sm text-gray-600">{result.description}</p>
							{/if}
							<p class="mt-1 truncate text-xs text-gray-500">{result.contentPreview}</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
