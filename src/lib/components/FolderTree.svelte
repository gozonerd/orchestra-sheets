<script lang="ts">
	import type { Folder } from '$lib/types';

	interface Props {
		folders: Folder[];
		selectedFolderId?: number | null;
		onSelectFolder?: (folderId: number) => void;
		onRenameFolder?: (folderId: number, newName: string) => void;
		onDeleteFolder?: (folderId: number) => void;
		onMoveFolder?: (folderId: number, targetFolderId: number | null) => void;
		onDragStart?: (folderId: number, event: DragEvent) => void;
		onDragOver?: (event: DragEvent) => void;
		onDrop?: (folderId: number | null, event: DragEvent) => void;
	}

	let {
		folders = [],
		selectedFolderId = null,
		onSelectFolder = undefined,
		onRenameFolder = undefined,
		onDeleteFolder = undefined,
		onMoveFolder = undefined,
		onDragStart = undefined,
		onDragOver = undefined,
		onDrop = undefined
	}: Props = $props();

	// Track expanded state for folder nodes
	let expandedFolders = $state<Set<number>>(new Set());

	function toggleExpanded(folderId: number) {
		if (expandedFolders.has(folderId)) {
			expandedFolders.delete(folderId);
		} else {
			expandedFolders.add(folderId);
		}
		expandedFolders = expandedFolders; // Trigger reactivity
	}

	function handleKeyDown(
		e: KeyboardEvent,
		folderId: number,
		children: Folder[] | undefined
	) {
		if (e.key === 'ArrowRight' && children && children.length > 0) {
			e.preventDefault();
			if (!expandedFolders.has(folderId)) {
				toggleExpanded(folderId);
			}
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			if (expandedFolders.has(folderId)) {
				toggleExpanded(folderId);
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			onSelectFolder?.(folderId);
		}
	}

	function handleDragStart(folderId: number, event: DragEvent) {
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('folderId', String(folderId));
		}
		onDragStart?.(folderId, event);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		onDragOver?.(event);
	}

	function handleDrop(folderId: number | null, event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer) {
			const draggedFolderId = parseInt(event.dataTransfer.getData('folderId'), 10);
			if (draggedFolderId !== folderId) {
				onDrop?.(folderId, event);
				onMoveFolder?.(draggedFolderId, folderId);
			}
		}
	}
</script>

<nav
	class="flex h-full flex-col overflow-y-auto border-r border-gray-200 bg-white"
	role="navigation"
	aria-label="Folder navigation"
>
	<div class="p-4">
		<h2 class="text-lg font-semibold text-gray-900">Folders</h2>
	</div>

	<ul class="flex-1 space-y-1 px-2 py-4" role="tree">
		<!-- Root level folders -->
		{#each folders.filter((f) => !f.parentId) as folder (folder.id)}
			<li role="none">
				<div
					class="group flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-gray-100"
					role="treeitem"
					aria-expanded={expandedFolders.has(folder.id)}
					aria-selected={selectedFolderId === folder.id}
					tabindex={selectedFolderId === folder.id ? 0 : -1}
					draggable={true}
					ondragstart={(e) => handleDragStart(folder.id, e)}
					ondragover={handleDragOver}
					ondrop={(e) => handleDrop(folder.id, e)}
					onkeydown={(e) => handleKeyDown(e, folder.id, folder.children)}
					onclick={() => onSelectFolder?.(folder.id)}
				>
					<!-- Expand toggle for folders with children -->
					{#if folder.children && folder.children.length > 0}
						<button
							type="button"
							class="flex-shrink-0 p-1 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
							aria-label={expandedFolders.has(folder.id) ? 'Collapse folder' : 'Expand folder'}
							onclick={() => toggleExpanded(folder.id)}
						>
							<svg
								class="h-4 w-4 transition-transform"
								class:rotate-90={expandedFolders.has(folder.id)}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					{:else}
						<div class="w-6 flex-shrink-0"></div>
					{/if}

					<!-- Drag handle -->
					<div
						class="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
						title="Drag to move folder"
					>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" />
						</svg>
					</div>

					<!-- Folder icon and name -->
					<svg class="h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
						/>
					</svg>
					<span class="ml-2 flex-1 text-sm font-medium text-gray-900">{folder.name}</span>
				</div>

				<!-- Child folders (nested) -->
				{#if expandedFolders.has(folder.id) && folder.children && folder.children.length > 0}
					<ul role="group" class="ml-6 space-y-1">
						{#each folder.children as childFolder (childFolder.id)}
							<li role="none">
								<div
									class="group flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-gray-100"
									role="treeitem"
									aria-expanded={expandedFolders.has(childFolder.id)}
									aria-selected={selectedFolderId === childFolder.id}
									tabindex={selectedFolderId === childFolder.id ? 0 : -1}
									draggable={true}
									ondragstart={(e) => handleDragStart(childFolder.id, e)}
									ondragover={handleDragOver}
									ondrop={(e) => handleDrop(childFolder.id, e)}
									onkeydown={(e) => handleKeyDown(e, childFolder.id, childFolder.children)}
									onclick={() => onSelectFolder?.(childFolder.id)}
								>
									<!-- Expand toggle for nested folders with children -->
									{#if childFolder.children && childFolder.children.length > 0}
										<button
											type="button"
											class="flex-shrink-0 p-1 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
											aria-label={expandedFolders.has(childFolder.id) ? 'Collapse folder' : 'Expand folder'}
											onclick={() => toggleExpanded(childFolder.id)}
										>
											<svg
												class="h-4 w-4 transition-transform"
												class:rotate-90={expandedFolders.has(childFolder.id)}
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
											</svg>
										</button>
									{:else}
										<div class="w-6 flex-shrink-0"></div>
									{/if}

									<!-- Drag handle -->
									<div
										class="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
										title="Drag to move folder"
									>
										<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
											<path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" />
										</svg>
									</div>

									<!-- Folder icon and name -->
									<svg class="h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
										/>
									</svg>
									<span class="ml-2 flex-1 text-sm font-medium text-gray-900">{childFolder.name}</span>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>

	<!-- Create new folder button -->
	<div class="border-t border-gray-200 p-4">
		<button
			type="button"
			class="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Folder
		</button>
	</div>
</nav>

<style>
	:global([role='treeitem']) {
		cursor: pointer;
	}

	:global([role='treeitem']:focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>
