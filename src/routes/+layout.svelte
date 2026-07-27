<script lang="ts">
	import '../app.css';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { SITE, s3 } from '$lib/config';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	let locale = $derived(getLocale());
	let title = $derived(m.meta_title());
	let description = $derived(m.meta_description());
	let ogImage = $derived(SITE.ogImage ? s3(SITE.ogImage) : '');
	let canonical = $derived(`${SITE.url}${localizeHref('/', { locale })}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:site_name" content="Kira backend developer" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={locale === 'ru' ? 'ru_RU' : 'en_US'} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	<meta property="og:image:alt" content="Kira backend developer" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if SITE.twitter}
		<meta name="twitter:creator" content={SITE.twitter} />
	{/if}
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}
	<meta name="twitter:site" content="@DDKira" />
	<meta name="keywords" content={SITE.keywords} />

	<link rel="alternate" hreflang="en" href={`${SITE.url}/`} />
	<link rel="alternate" hreflang="ru" href={`${SITE.url}/ru/`} />
	<link rel="alternate" hreflang="x-default" href={`${SITE.url}/`} />

	<meta name="robots" content="index, follow" />

	<link rel="preconnect" href="https://mysite.s3.ddkira.ru/" crossorigin="anonymous" />
	<link rel="dns-prefetch" href="https://mysite.s3.ddkira.ru/" crossorigin="anonymous" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
