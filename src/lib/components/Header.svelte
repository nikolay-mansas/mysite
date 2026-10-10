<script lang='ts'>
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import StatusBadge from './StatusBadge.svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	let open = $state(false);

	type NavLink = {
		href: string;
		label: () => string;
		kind: 'anchor' | 'page';
	};

	const links: NavLink[] = [
		{ href: '#work', label: () => m.nav_work(), kind: 'anchor' },
		{ href: '#about', label: () => m.nav_about(), kind: 'anchor' },
		{ href: '#skills', label: () => m.nav_skills(), kind: 'anchor' },
		{ href: '#experience', label: () => m.nav_experience(), kind: 'anchor' },
		{ href: '#contact', label: () => m.nav_contact(), kind: 'anchor' },
		{ href: '/tools', label: () => m.nav_tools(), kind: 'page' },
	];

	function close() {
		open = false;
	}
</script>

<header
	class='sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md'
>
	<div class='mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6'>
		<a
			href={resolve(localizeHref('/') as Pathname)}
			class='font-mono text-sm font-semibold tracking-tight text-foreground'
			onclick={close}
		>
			{m.hero_name()}
		</a>

		<nav class='hidden items-center gap-6 md:flex' aria-label='Primary'>
			{#each links as link (link.href)}
				<a
					href={link.kind === 'anchor'
						? resolve((localizeHref('/') + link.href) as Pathname)
						: resolve(localizeHref(link.href) as Pathname)}
					class={[
						'text-sm transition-colors hover:text-foreground',
						link.kind === 'page'
							? 'inline-flex items-center gap-1 font-medium text-foreground/80'
							: 'text-muted'
					]}
				>
					{link.label()}
					{#if link.kind === 'page'}
						<svg
							class='h-3 w-3 opacity-60'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							stroke-width='2'
							stroke-linecap='round'
							stroke-linejoin='round'
							aria-hidden='true'
						>
							<path d='M5 12h14M13 6l6 6-6 6' />
						</svg>
					{/if}
				</a>
			{/each}
		</nav>

		<div class='flex items-center gap-2'>
			<div class='hidden sm:block'>
				<StatusBadge />
			</div>
			<LanguageSwitcher />
			<button
				type='button'
				class='flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden'
				aria-label='Toggle menu'
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				<svg
					class='h-5 w-5'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					stroke-width='2'
					stroke-linecap='round'
				>
					{#if open}
						<path d='M18 6 6 18M6 6l12 12' />
					{:else}
						<path d='M4 7h16M4 12h16M4 17h16' />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	{#if open}
		<nav
			class='border-t border-border/60 px-4 py-3 md:hidden'
			aria-label='Mobile'
		>
			<ul class='flex flex-col gap-1'>
				{#each links as link (link.href)}
					<li>
						<a
							href={link.kind === 'anchor'
								? resolve((localizeHref('/') + link.href) as Pathname)
								: resolve(localizeHref(link.href) as Pathname)}
							onclick={close}
							class={[
								'flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface hover:text-foreground',
								link.kind === 'page'
									? 'font-medium text-foreground/80'
									: 'text-muted'
							]}
						>
							{link.label()}
							{#if link.kind === 'page'}
								<svg
									class='h-3 w-3 opacity-60'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									stroke-width='2'
									stroke-linecap='round'
									stroke-linejoin='round'
									aria-hidden='true'
								>
									<path d='M5 12h14M13 6l6 6-6 6' />
								</svg>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</header>
