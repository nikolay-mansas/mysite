<script lang='ts'>
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MarkdownContent from '$lib/components/MarkdownContent.svelte';
	import RelatedPosts from '$lib/components/RelatedPosts.svelte';
	import ServiceCta from '$lib/components/ServiceCta.svelte';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';

	let { data } = $props();
	const { post, related } = $derived(data);

	const localeMap: Record<string, string> = { ru: 'ru-RU', de: 'de-DE', en: 'en-US' };
	const dateFmt = $derived(
		new Date(post.date).toLocaleDateString(localeMap[post.lang] ?? 'en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	const backHref = $derived(resolve(localizeHref('/blog') as Pathname));
	const canonical = $derived(buildSeoUrls(page.url.pathname).canonical);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description,
		datePublished: post.date,
		dateModified: post.updated ?? post.date,
		inLanguage: post.lang,
		keywords: post.tags.join(', '),
		author: { '@type': 'Person', name: m.hero_name() },
		publisher: { '@type': 'Person', name: m.hero_name() },
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
		url: canonical
	});
</script>

<SeoHead
	title={`${post.title} · ${m.blog_title()}`}
	description={post.description}
	keywords={post.tags.join(', ')}
	ogType='article'
	jsonLd={jsonLd}
/>

<svelte:head>
	<meta property='article:published_time' content={post.date} />
	{#if post.updated}
		<meta property='article:modified_time' content={post.updated} />
	{/if}
	{#each post.tags as tag (tag)}
		<meta property='article:tag' content={tag} />
	{/each}
</svelte:head>

<article class='mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-16'>
	<a
		href={backHref}
		class='mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground'
	>
		<svg
			class='h-4 w-4'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			stroke-width='2'
			stroke-linecap='round'
			stroke-linejoin='round'
			aria-hidden='true'
		>
			<path d='M19 12H5M12 19l-7-7 7-7' />
		</svg>
		{m.blog_back()}
	</a>

	<header class='mb-8 border-b border-border/60 pb-6'>
		<div class='mb-4 flex flex-wrap items-center gap-2 text-xs text-muted'>
			<time datetime={post.date} class='font-mono'>{dateFmt}</time>
			<span class='opacity-50'>·</span>
			<span>{m.blog_reading_time({ minutes: String(post.readingTime) })}</span>
		</div>

		<h1
			class='text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl'
		>
			{post.title}
		</h1>

		{#if post.description}
			<p class='mt-3 text-pretty leading-relaxed text-muted'>
				{post.description}
			</p>
		{/if}

		{#if post.tags.length}
			<ul class='mt-5 flex flex-wrap gap-1.5'>
				{#each post.tags as tag (tag)}
					<li class='rounded-md bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-muted'>
						{tag}
					</li>
				{/each}
			</ul>
		{/if}
	</header>

	<MarkdownContent
		html={post.html}
		copyLabel={m.blog_copy()}
		copiedLabel={m.blog_copied()}
		copyAriaLabel={m.blog_copy()}
	/>
</article>

<RelatedPosts posts={related} />
<ServiceCta />