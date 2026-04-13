<script lang="ts">
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-8 px-4">
		<div class="text-center">
			<h1 class="text-3xl font-bold">Sign In</h1>
			<p class="mt-2 text-gray-600" id="signin-description">
				Choose a provider to authenticate with Orchestra Sheets
			</p>
		</div>

		<form method="POST" class="space-y-4" aria-describedby="signin-description">
			<button
				name="intent"
				value="github"
				type="submit"
				aria-label="Sign in with your GitHub account"
				class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-center font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				Sign in with GitHub
			</button>

			<button
				name="intent"
				value="google"
				type="submit"
				aria-label="Sign in with your Google account"
				class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-center font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				Sign in with Google
			</button>
		</form>
	</div>
</div>
