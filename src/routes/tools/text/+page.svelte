<script lang='ts'>
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import TextTool from '$lib/components/tools/TextTool.svelte';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	const faq = $derived([
		{ q: m.text_faq_q1(), a: m.text_faq_a1() },
		{ q: m.text_faq_q2(), a: m.text_faq_a2() },
		{ q: m.text_faq_q3(), a: m.text_faq_a3() },
		{ q: m.text_faq_q4(), a: m.text_faq_a4() },
		{ q: m.text_faq_q5(), a: m.text_faq_a5() }
	]);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: m.text_seo_app_name(),
				url: urls.canonical,
				applicationCategory: 'UtilitiesApplication',
				operatingSystem: 'Any',
				description: m.text_meta_description(),
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: m.common_home(), item: urls.homeUrl },
					{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: urls.toolsUrl },
					{ '@type': 'ListItem', position: 3, name: m.text_breadcrumb_title(), item: urls.canonical }
				]
			},
			{
				'@type': 'FAQPage',
				mainEntity: faq.map((f) => ({
					'@type': 'Question',
					name: f.q,
					acceptedAnswer: { '@type': 'Answer', text: f.a }
				}))
			}
		]
	});
</script>

<SeoHead
	title={m.text_seo_title({ heroName: m.hero_name() })}
	description={m.text_meta_description()}
	keywords={m.text_meta_keywords()}
	ogTitle={m.text_og_title()}
	jsonLd={jsonLd}
/>

<section class='mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6'>
	<nav aria-label={m.common_breadcrumb_aria()} class='mb-6 text-xs text-muted/70'>
		<a href={resolve(localizeHref('/') as Pathname)} class='hover:text-foreground'>{m.common_home()}</a>
		<span class='mx-2'>/</span>
		<a href={resolve(localizeHref('/tools') as Pathname)} class='hover:text-foreground'>{m.common_tools()}</a>
		<span class='mx-2'>/</span>
		<span class='text-foreground/80'>{m.text_breadcrumb_title()}</span>
	</nav>

	<header class='mb-8'>
		<h1 class='text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
			{m.text_h1()}
		</h1>
		<p class='mt-3 max-w-3xl text-pretty leading-relaxed text-muted'>
			{m.text_hero_description()}
		</p>
	</header>

	<TextTool />

	<section class='mt-14 space-y-10'>
		<div class='border-b border-border/60 pb-6'>
			<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.text_guide_heading()}</h2>
			<p class='mt-3 max-w-3xl leading-relaxed text-muted'>{m.text_guide_intro()}</p>
		</div>
	</section>

	<section class='mt-14'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.text_faq_heading()}</h2>
		<div class='mt-6 space-y-3'>
			{#each faq as item (item.q)}
				<details class='group rounded-xl border border-border bg-surface p-4'>
					<summary class='cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden'>
						{item.q}
					</summary>
					<p class='mt-2.5 text-sm leading-relaxed text-muted'>{item.a}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class='mt-14'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.hash_related_tools_heading()}</h2>
		<ul class='mt-4 flex flex-wrap gap-2'>
			<li>
				<a class='inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground' href={resolve(localizeHref('/tools/hash') as Pathname)}>
					{m.tool_hash_title()}
				</a>
			</li>
			<li>
				<a class='inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground' href={resolve(localizeHref('/tools/encode') as Pathname)}>
					{m.tool_encode_title()}
				</a>
			</li>
			<li>
				<a class='inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground' href={resolve(localizeHref('/tools/uuid') as Pathname)}>
					{m.uuid_breadcrumb_title()}
				</a>
			</li>
		</ul>
	</section>

	<p class='mt-12 text-center text-xs text-muted/60'>{m.tools_privacy_note()}</p>
</section>