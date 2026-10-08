<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let open = $state(false);

	const links = [
		{ href: '#work', label: () => m.nav_work() },
		{ href: '#about', label: () => m.nav_about() },
		{ href: '#skills', label: () => m.nav_skills() },
		{ href: '#experience', label: () => m.nav_experience() },
		{ href: '#contact', label: () => m.nav_contact() },
	];

	function close() {
		open = false;
	}
</script>

<header
	class="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md"
>
	<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
		<a
			href="#top"
			class="font-mono text-sm font-semibold tracking-tight text-foreground"
			onclick={close}
		>
			{m.hero_name()}
		</a>

		<nav class="hidden items-center gap-6 md:flex" aria-label="Primary">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="text-sm text-muted transition-colors hover:text-foreground"
				>
					{link.label()}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-2">
			<div class="hidden sm:block">
				<StatusBadge />
			</div>
			<LanguageSwitcher />
			<button
				type="button"
				class="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
				aria-label="Toggle menu"
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				<svg
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					{#if open}
						<path d="M18 6 6 18M6 6l12 12" />
					{:else}
						<path d="M4 7h16M4 12h16M4 17h16" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	{#if open}
		<nav
			class="border-t border-border/60 px-4 py-3 md:hidden"
			aria-label="Mobile"
		>
			<ul class="flex flex-col gap-1">
				{#each links as link (link.href)}
					<li>
						<a
							href={link.href}
							onclick={close}
							class="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
						>
							{link.label()}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</header>
