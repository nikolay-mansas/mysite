<script lang='ts'>
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import PdfViewer from '$lib/components/PdfViewer.svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { buildSeoUrls } from '$lib/seo';
	import { page } from '$app/state';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	const PDF_URL = 'https://mysite.s3.ddkira.ru/docs/privacy.pdf';

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		'@id': urls.canonical,
		url: urls.canonical,
		name: m.privacy_title(),
		description: m.privacy_description(),
		inLanguage: urls.isRu ? 'ru-RU' : 'en-US'
	});
</script>

<SeoHead
	title={m.privacy_title()}
	description={m.privacy_description()}
	jsonLd={jsonLd}
	ogType='article'
/>

<section class='mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 sm:pt-16'>
	<header class='mb-6'>
		<nav aria-label={m.common_breadcrumb_aria()} class='mb-4 text-xs text-muted'>
			<a href={resolve(localizeHref('/') as Pathname)} class='transition-colors hover:text-foreground'>
				{m.common_home()}
			</a>
			<span class='mx-2 opacity-50'>/</span>
			<span class='text-foreground'>{m.privacy_title()}</span>
		</nav>

		<p class='mb-3 font-mono text-sm text-accent'>{m.legal_eyebrow()}</p>
		<h1
			class='text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl'
		>
			{m.privacy_heading()}
		</h1>
		<p class='mt-3 max-w-2xl text-pretty leading-relaxed text-muted'>
			{m.privacy_description()}
		</p>
	</header>

	<PdfViewer
		src={PDF_URL}
		title={m.privacy_heading()}
		downloadName='Политика обработки персональных данных.pdf'
	/>
</section>