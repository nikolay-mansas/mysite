<script lang='ts'>
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { SOCIALS } from '$lib/config';
	import { m } from '$lib/paraglide/messages';
	import TechStackModal from './TechStackModal.svelte';
	import { openCookieSettings } from '$lib/consent';
	import { localizeHref } from '$lib/paraglide/runtime';

	const year = new Date().getFullYear();
	let techModalOpen = $state(false);

	const linkClass =
		'whitespace-nowrap cursor-pointer border-b border-dotted border-muted/40 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:text-accent sm:text-xs';
</script>

<footer class='border-t border-border/60'>
	<div
		class='mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:gap-4 sm:px-6 sm:py-5'
	>
		<div class='flex items-center gap-3'>
			<p class='whitespace-nowrap text-sm text-muted sm:text-xs'>
				&copy; {year} {m.hero_name()}
			</p>
			<span class='text-muted/30' aria-hidden='true'>·</span>
			<p class='whitespace-nowrap text-sm italic text-muted/50 sm:text-xs'>
				Kira is best!
			</p>
		</div>

		<div class='flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:justify-end sm:gap-x-3 sm:gap-y-2'>
			<button
				type='button'
				onclick={() => (techModalOpen = true)}
				class={linkClass}
			>
				{m.footer_about_site()}
			</button>

			<a href={resolve(localizeHref('/consent') as Pathname)} class={linkClass}>{m.footer_consent()}</a>

			<a href={resolve(localizeHref('/privacy') as Pathname)} class={linkClass}>{m.footer_privacy()}</a>

			<a href={resolve(localizeHref('/security') as Pathname)} class={linkClass}>{m.footer_security()}</a>

			<button type='button' onclick={openCookieSettings} class={linkClass}>
				{m.cookie_settings()}
			</button>

			<span class='hidden h-3 w-px bg-border/60 sm:block' aria-hidden='true'></span>

			<ul class='flex items-center gap-2'>
				{#each SOCIALS as social (social.name)}
					{@const Icon = social.icon}
					<li>
						<a
							href={social.url}
							target={social.url.startsWith('mailto:') ? undefined : '_blank'}
							rel='external noopener noreferrer'
							aria-label={social.name}
							class='flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/40 hover:text-foreground sm:h-7 sm:w-7 sm:rounded-md'
						>
							<Icon class='h-4 w-4 sm:h-3.5 sm:w-3.5' />
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</footer>

<TechStackModal open={techModalOpen} onClose={() => (techModalOpen = false)} />