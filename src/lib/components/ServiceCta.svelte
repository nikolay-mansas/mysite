<script lang='ts'>
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<section class='mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6'>
	<div
		class='relative overflow-hidden rounded-2xl border border-accent/30 bg-surface p-6 sm:p-10'
	>
		<div
			class='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl'
			aria-hidden='true'
		></div>

		<div class='relative'>
			<p class='mb-3 font-mono text-xs uppercase tracking-widest text-accent'>
				{m.services_eyebrow()}
			</p>

			<h2
				class='max-w-2xl text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl'
			>
				{m.services_heading()}
			</h2>

			<p class='mt-3 max-w-2xl text-pretty leading-relaxed text-muted'>
				{m.services_body()}
			</p>

			<ul class='mt-5 flex flex-wrap gap-1.5'>
				{#each ['FastAPI', 'PostgreSQL', 'MongoDB', 'K8S', 'Self-hosting'] as tag (tag)}
					<li class='rounded-md bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-muted'>
						{tag}
					</li>
				{/each}
			</ul>

			<div class='mt-6 flex flex-wrap gap-3'>
				<a
					href={resolve(localizeHref('/#contact') as Pathname)}
					class='inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90'
				>
					{m.services_cta()}
				</a>
				<a
					href={resolve(localizeHref('/#work') as Pathname)}
					class='inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover'
				>
					{m.services_secondary()}
				</a>
			</div>
		</div>
	</div>
</section>