<script lang="ts">
	import { page } from '$app/state';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	let status = $derived(page.status);
	let is404 = $derived(status === 404);
	let title = $derived(is404 ? m.error_404_title() : m.error_generic_title());
	let body = $derived(is404 ? m.error_404_body() : m.error_generic_body());
</script>

<svelte:head>
	<title>{status} - {title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section
	class="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6"
>
	<p
		class="select-none font-mono text-7xl font-bold leading-none tracking-tighter text-foreground sm:text-8xl"
	>
		{status}
	</p>

	<h1 class="mt-6 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
		{title}
	</h1>

	<p class="mt-3 max-w-md text-pretty leading-relaxed text-muted">
		{body}
	</p>

	<a
		href={localizeHref('/')}
		class="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
	>
		<svg
			class="h-4 w-4"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M19 12H5M12 19l-7-7 7-7" />
		</svg>
		{m.error_home()}
	</a>
</section>
