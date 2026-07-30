<script lang="ts">
	import type { Tag } from '$lib/types';

	interface Props {
		isOpen: boolean;
		tags?: Tag[];
		selectedTags?: number[];
		onClose?: () => void;
		onCreate?: (name: string, color: string) => void;
		onUpdate?: (tagId: number, name: string, color: string) => void;
		onDelete?: (tagId: number) => void;
		onSelect?: (tagId: number) => void;
		onDeselect?: (tagId: number) => void;
	}

	let {
		isOpen = false,
		tags = [],
		selectedTags = [],
		onClose = undefined,
		onCreate = undefined,
		onUpdate = undefined,
		onDelete = undefined,
		onSelect = undefined,
		onDeselect = undefined
	}: Props = $props();

	let newTagName = $state('');
	let newTagColor = $state('#3B82F6');
	let editingTagId: number | null = $state(null);
	let editingName = $state('');
	let editingColor = $state('');

	const defaultColors = [
		'#3B82F6',
		'#EF4444',
		'#10B981',
		'#F59E0B',
		'#8B5CF6',
		'#EC4899',
		'#06B6D4'
	];

	function handleCreateTag() {
		if (newTagName.trim()) {
			onCreate?.(newTagName, newTagColor);
			newTagName = '';
			newTagColor = '#3B82F6';
		}
	}

	function handleUpdateTag(tagId: number) {
		if (editingName.trim()) {
			onUpdate?.(tagId, editingName, editingColor);
			editingTagId = null;
			editingName = '';
			editingColor = '';
		}
	}

	function startEditTag(tag: Tag) {
		editingTagId = tag.id;
		editingName = tag.name;
		editingColor = tag.color;
	}

	function cancelEdit() {
		editingTagId = null;
		editingName = '';
		editingColor = '';
	}

	function handleSelectTag(tagId: number) {
		if (selectedTags.includes(tagId)) {
			onDeselect?.(tagId);
		} else {
			onSelect?.(tagId);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onClose?.();
		}
	}
</script>

{#if isOpen}
	<!-- Modal backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/50 transition-opacity"
		role="presentation"
		onclick={() => onClose?.()}
		onkeydown={handleKeyDown}
	></div>

	<!-- Modal dialog -->
	<div
		class="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg"
		role="dialog"
		aria-modal="true"
		aria-labelledby="tag-modal-title"
	>
		<!-- Header -->
		<div class="border-b border-gray-200 px-6 py-4">
			<div class="flex items-center justify-between">
				<h2 id="tag-modal-title" class="text-xl font-bold text-gray-900">Manage Tags</h2>
				<button
					type="button"
					class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					aria-label="Close modal"
					onclick={() => onClose?.()}
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="max-h-[60vh] overflow-y-auto px-6 py-4">
			<!-- Create new tag section -->
			<div class="mb-6">
				<h3 class="mb-3 text-lg font-semibold text-gray-900">Create New Tag</h3>
				<div class="space-y-3">
					<div>
						<label for="tag-name" class="block text-sm font-medium text-gray-700">Tag Name</label>
						<input
							id="tag-name"
							bind:value={newTagName}
							type="text"
							placeholder="e.g., High Priority"
							class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="tag-color-input" class="block text-sm font-medium text-gray-700"
								>Color (Hex)</label
							>
							<input
								id="tag-color-input"
								bind:value={newTagColor}
								type="text"
								placeholder="#3B82F6"
								class="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="tag-color-picker" class="block text-sm font-medium text-gray-700"
								>Pick Color</label
							>
							<input
								id="tag-color-picker"
								bind:value={newTagColor}
								type="color"
								class="mt-1 h-10 w-full cursor-pointer rounded-lg border border-gray-300"
							/>
						</div>
					</div>

					<!-- Quick color options -->
					<div class="flex flex-wrap gap-2">
						{#each defaultColors as color}
							<button
								type="button"
								class="h-10 w-10 rounded-lg border-2 transition-all hover:scale-110"
								class:border-gray-400={newTagColor !== color}
								class:border-gray-900={newTagColor === color}
								style="background-color: {color}"
								aria-label="Select color {color}"
								onclick={() => (newTagColor = color)}
								title={color}
							></button>
						{/each}
					</div>

					<button
						type="button"
						onclick={handleCreateTag}
						disabled={!newTagName.trim()}
						class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400"
					>
						Create Tag
					</button>
				</div>
			</div>

			<!-- Existing tags section -->
			<div>
				<h3 class="mb-3 text-lg font-semibold text-gray-900">Existing Tags ({tags.length})</h3>
				{#if tags.length === 0}
					<p class="text-sm text-gray-500">No tags created yet</p>
				{:else}
					<div class="space-y-2">
						{#each tags as tag (tag.id)}
							{#if editingTagId === tag.id}
								<!-- Edit mode -->
								<div class="rounded-lg border border-gray-300 bg-gray-50 p-3">
									<div class="space-y-3">
										<div>
											<label
												for="edit-tag-name-{tag.id}"
												class="block text-sm font-medium text-gray-700">Tag Name</label
											>
											<input
												id="edit-tag-name-{tag.id}"
												bind:value={editingName}
												type="text"
												class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
											/>
										</div>

										<div class="grid grid-cols-2 gap-3">
											<div>
												<label
													for="edit-tag-color-input-{tag.id}"
													class="block text-sm font-medium text-gray-700">Color (Hex)</label
												>
												<input
													id="edit-tag-color-input-{tag.id}"
													bind:value={editingColor}
													type="text"
													class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
												/>
											</div>
											<div>
												<label
													for="edit-tag-color-picker-{tag.id}"
													class="block text-sm font-medium text-gray-700">Pick Color</label
												>
												<input
													id="edit-tag-color-picker-{tag.id}"
													bind:value={editingColor}
													type="color"
													class="mt-1 h-10 w-full cursor-pointer rounded-lg border border-gray-300"
												/>
											</div>
										</div>

										<div class="flex gap-2">
											<button
												type="button"
												onclick={() => handleUpdateTag(tag.id)}
												class="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
											>
												Save
											</button>
											<button
												type="button"
												onclick={cancelEdit}
												class="flex-1 rounded-lg bg-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:outline-none"
											>
												Cancel
											</button>
										</div>
									</div>
								</div>
							{:else}
								<!-- Display mode -->
								<div
									class="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
								>
									<div class="flex items-center gap-3">
										<input
											type="checkbox"
											checked={selectedTags.includes(tag.id)}
											onchange={() => handleSelectTag(tag.id)}
											class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
										/>
										<div
											class="h-6 w-6 rounded-full border border-gray-300"
											style="background-color: {tag.color}"
											aria-label="Tag color: {tag.color}"
										></div>
										<div>
											<p class="text-sm font-medium text-gray-900">{tag.name}</p>
											<p class="text-xs text-gray-500">{tag.color}</p>
										</div>
									</div>

									<div class="flex gap-2">
										<button
											type="button"
											onclick={() => startEditTag(tag)}
											class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
											aria-label="Edit tag {tag.name}"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
										<button
											type="button"
											onclick={() => onDelete?.(tag.id)}
											class="rounded-lg p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
											aria-label="Delete tag {tag.name}"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Footer -->
		<div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
			<button
				type="button"
				onclick={() => onClose?.()}
				class="w-full rounded-lg bg-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:outline-none"
			>
				Close
			</button>
		</div>
	</div>
{/if}
