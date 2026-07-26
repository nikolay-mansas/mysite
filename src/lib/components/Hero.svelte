<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import StatusBadge from './StatusBadge.svelte';
</script>

<section id="top" class="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-24">
	<div class="mb-5 sm:hidden">
		<StatusBadge />
	</div>

	<p class="mb-3 font-mono text-sm text-accent">{m.hero_greeting()}</p>

	<h1
		class="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl"
	>
		{m.hero_name()}
	</h1>

	<p class="mt-3 text-xl font-medium text-muted sm:text-2xl">
		{m.hero_role()}
	</p>

	<p class="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
		{m.hero_tagline()}
	</p>

	<div class="mt-8 flex flex-wrap gap-3">
		<a
			href="#work"
			class="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
		>
			{m.hero_cta_work()}
		</a>
		<a
			href="#contact"
			class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
		>
			{m.hero_cta_contact()}
		</a>
	</div>
</section>
