<script lang='ts'>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import BlogCard from '$lib/components/BlogCard.svelte';
	import SearchResultCard from '$lib/components/SearchResultCard.svelte';
	import ServiceCta from '$lib/components/ServiceCta.svelte';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	let { data } = $props();

	const clearHref = $derived(resolve(localizeHref('/blog') as Pathname));
	const isSearch = $derived(data.mode === 'search');
</script>

<SeoHead
	title={isSearch ? `${m.blog_search_title()} · ${data.q}` : m.blog_title()}
	description={m.blog_description()}
	ogType='website'
/>

<svelte:head>
	{#if isSearch}
		<meta name='robots' content='noindex, follow' />
	{/if}
</svelte:head>

<section class='mx-auto max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pt-16'>
	<header class='mb-8'>
		<p class='mb-3 font-mono text-sm text-accent'>{m.blog_eyebrow()}</p>
		<h1
			class='text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl'
		>
			{m.blog_heading()}
		</h1>
		<p class='mt-3 max-w-2xl text-pretty leading-relaxed text-muted'>
			{m.blog_subheading()}
		</p>
	</header>

	<form action='' method='GET' role='search' class='mb-10'>
		<div class='relative'>
			<svg
				class='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted'
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				stroke-width='2'
				stroke-linecap='round'
				stroke-linejoin='round'
				aria-hidden='true'
			>
				<circle cx='11' cy='11' r='8' />
				<path d='m21 21-4.3-4.3' />
			</svg>
			<input
				type='search'
				name='q'
				value={data.q}
				placeholder={m.blog_search_placeholder()}
				aria-label={m.blog_search_placeholder()}
				autocomplete='off'
				spellcheck='false'
				class='w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20'
			/>
		</div>
	</form>

	{#if isSearch}
		<div class='mb-6 flex flex-wrap items-center justify-between gap-3'>
			<h2 class='text-base font-semibold text-foreground sm:text-lg'>
				{m.blog_search_results({ q: data.q })}
			</h2>
			<a
				href={clearHref}
				class='text-sm text-muted transition-colors hover:text-foreground'
			>
				{m.blog_clear()}
			</a>
		</div>

		{#if data.results.length}
			<ul class='grid grid-cols-1 gap-4 md:grid-cols-2'>
				{#each data.results as post (post.slug)}
					<li class='h-full'>
						<SearchResultCard {post} />
					</li>
				{/each}
			</ul>
		{:else}
			<p
				class='rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted'
			>
				{m.blog_no_results()}
			</p>
		{/if}
	{:else if data.posts.length}
		<ul class='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2'>
			{#each data.posts as post (post.slug)}
				<li class='h-full'>
					<BlogCard {post} />
				</li>
			{/each}
		</ul>
	{:else}
		<p class='rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted'>
			{m.blog_empty()}
		</p>
	{/if}
</section>

<ServiceCta />