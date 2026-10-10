<script lang="ts">
	import { SITE, s3 } from '$lib/config';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';

	let {
		title,
		description,
		keywords = undefined,
		ogTitle = undefined,
		ogDescription = undefined,
		ogType = 'website',
		twitterCard = 'summary_large_image',
		jsonLd = null
	}: {
		title: string;
		description: string;
		keywords?: string;
		ogTitle?: string;
		ogDescription?: string;
		ogType?: string;
		twitterCard?: string;
		jsonLd?: object | null;
	} = $props();

	const scriptClose = '</scr' + 'ipt>';

	let urls = $derived(buildSeoUrls(page.url.pathname));
	let ogImage = $derived(SITE.ogImage ? s3(SITE.ogImage) : '');
	let jsonLdString = $derived(jsonLd ? JSON.stringify(jsonLd) : '');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if keywords}<meta name="keywords" content={keywords} />{/if}
	<link rel="canonical" href={urls.canonical} />
	<meta name="robots" content="index, follow" />

	<meta property="og:type" content={ogType} />
	<meta property="og:title" content={ogTitle ?? title} />
	<meta property="og:description" content={ogDescription ?? description} />
	<meta property="og:url" content={urls.canonical} />
	<meta property="og:site_name" content="Kira Tools" />
	<meta property="og:locale" content={urls.isRu ? 'ru_RU' : 'en_US'} />
	<meta property="og:locale:alternate" content={urls.isRu ? 'en_US' : 'ru_RU'} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:alt" content={title} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}

	<meta name="twitter:card" content={twitterCard} />
	<meta name="twitter:title" content={ogTitle ?? title} />
	<meta name="twitter:description" content={ogDescription ?? description} />
	{#if ogImage}<meta name="twitter:image" content={ogImage} />{/if}
	{#if SITE.twitter}
		<meta name="twitter:creator" content={SITE.twitter} />
		<meta name="twitter:site" content={SITE.twitter} />
	{/if}

	<link rel="alternate" hreflang="en" href={urls.enUrl} />
	<link rel="alternate" hreflang="ru" href={urls.ruUrl} />
	<link rel="alternate" hreflang="x-default" href={urls.enUrl} />

	{#if jsonLdString}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<script type="application/ld+json">${jsonLdString}${scriptClose}`}
	{/if}
</svelte:head>