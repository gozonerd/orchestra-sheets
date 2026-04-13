<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-8 px-4">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-red-600">Authentication Error</h1>
			<p class="mt-2 text-gray-600">
				{#if $page.url.searchParams.has('error')}
					<span>{$page.url.searchParams.get('error')}</span>
				{:else}
					<span>An error occurred during authentication. Please try again.</span>
				{/if}
			</p>
		</div>

		<div class="space-y-4">
			<a
				href={resolve('/auth/signin')}
				class="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
			>
				Return to Sign In
			</a>
			<a
				href={resolve('/')}
				class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-center font-medium text-gray-700 hover:bg-gray-50"
			>
				Go to Home
			</a>
		</div>
	</div>
</div>
