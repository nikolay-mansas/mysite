<script lang="ts">
	import { SOCIALS } from '$lib/config';
	import { m } from '$lib/paraglide/messages';
</script>

<section id="contact" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6">
	<div class="mb-10 max-w-2xl">
		<h2 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.contact_heading()}
		</h2>
		<p class="mt-3 text-pretty leading-relaxed text-muted">
			{m.contact_body()}
		</p>
	</div>

	<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		{#each SOCIALS as social (social.name)}
			{@const Icon = social.icon}
			<li>
				<a
					href={social.url}
					target={social.url.startsWith('mailto:') ? undefined : '_blank'}
					rel="noopener noreferrer"
					class="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40 hover:bg-surface-hover"
				>
					<span
						class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground"
					>
						<Icon class="h-5 w-5" />
					</span>
					<span class="min-w-0">
						<span class="block text-sm font-semibold text-foreground">
							{social.name}
						</span>
						<span class="block truncate text-sm text-muted">
							{social.handle}
						</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
