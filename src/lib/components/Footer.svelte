<script lang="ts">
	import { SOCIALS } from '$lib/config';
	import { m } from '$lib/paraglide/messages';
	import TechStackModal from './TechStackModal.svelte';

	const year = new Date().getFullYear();
	let techModalOpen = $state(false);
</script>

<footer class="border-t border-border/60">
	<div
		class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6"
	>
		<p class="text-sm text-muted">
			&copy; {year} {m.hero_name()}. {m.footer_rights()}
		</p>

		<div class="flex items-center gap-4">
			<button
				type="button"
				onclick={() => (techModalOpen = true)}
				class="cursor-pointer border-b border-dotted border-muted/50 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus:outline-none"
			>
				{m.footer_about_site()}
			</button>

			<ul class="flex items-center gap-2">
				{#each SOCIALS as social (social.name)}
					{@const Icon = social.icon}
					<li>
						<a
							href={social.url}
							target={social.url.startsWith('mailto:') ? undefined : '_blank'}
							rel="noopener noreferrer"
							aria-label={social.name}
							class="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/40 hover:text-foreground"
						>
							<Icon class="h-4 w-4" />
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</footer>

<TechStackModal open={techModalOpen} onClose={() => (techModalOpen = false)} />