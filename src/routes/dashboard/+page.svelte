<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	const { data }: Props = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-8">
		<div class="rounded-lg bg-white p-8 shadow">
			<h1 class="text-3xl font-bold">Welcome, {data.user?.name || 'User'}</h1>
			<p class="mt-2 text-gray-600">You are authenticated and viewing a protected route.</p>
			<p class="mt-4 text-sm text-gray-500">Email: {data.user?.email}</p>
		</div>
	</div>
</div>
