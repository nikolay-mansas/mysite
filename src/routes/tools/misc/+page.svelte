<script lang='ts'>
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MiscTool from '$lib/components/tools/MiscTool.svelte';

	let urls = $derived(buildSeoUrls(page.url.pathname));
	const faqs = [
		{ question: m.uuid_faq_q1, answer: m.uuid_faq_a1 },
		{ question: m.uuid_faq_q2, answer: m.uuid_faq_a2 },
		{ question: m.uuid_faq_q3, answer: m.uuid_faq_a3 },
		{ question: m.uuid_faq_q4, answer: m.uuid_faq_a4 },
		{ question: m.uuid_faq_q5, answer: m.uuid_faq_a5 }
	];

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: m.uuid_seo_app_name(),
				url: urls.canonical,
				applicationCategory: 'DeveloperApplication',
				operatingSystem: 'Any',
				description: m.uuid_meta_description(),
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: m.common_home(), item: urls.homeUrl },
					{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: urls.toolsUrl },
					{ '@type': 'ListItem', position: 3, name: m.uuid_breadcrumb_title(), item: urls.canonical }
				]
			},
			{
				'@type': 'FAQPage',
				mainEntity: [
					{ '@type': 'Question', name: m.uuid_faq_q1(), acceptedAnswer: { '@type': 'Answer', text: m.uuid_faq_a1() } },
					{ '@type': 'Question', name: m.uuid_faq_q2(), acceptedAnswer: { '@type': 'Answer', text: m.uuid_faq_a2() } },
					{ '@type': 'Question', name: m.uuid_faq_q3(), acceptedAnswer: { '@type': 'Answer', text: m.uuid_faq_a3() } },
					{ '@type': 'Question', name: m.uuid_faq_q4(), acceptedAnswer: { '@type': 'Answer', text: m.uuid_faq_a4() } },
					{ '@type': 'Question', name: m.uuid_faq_q5(), acceptedAnswer: { '@type': 'Answer', text: m.uuid_faq_a5() } }
				]
			}
		]
	});
</script>

<SeoHead
	title={m.uuid_seo_title({ heroName: m.hero_name() })}
	description={m.uuid_meta_description()}
	keywords={m.uuid_meta_keywords()}
	ogTitle={m.uuid_og_title()}
	jsonLd={jsonLd}
/>

<section class='mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6'>
	<nav aria-label={m.common_breadcrumb_aria()} class='mb-6 text-xs text-muted/70'>
		<a href={resolve(localizeHref('/') as Pathname)} class='hover:text-foreground'>{m.common_home()}</a>
		<span class='mx-2'>/</span>
		<a href={resolve(localizeHref('/tools') as Pathname)} class='hover:text-foreground'>{m.common_tools()}</a>
		<span class='mx-2'>/</span>
		<span class='text-foreground/80'>{m.uuid_breadcrumb_title()}</span>
	</nav>

	<header class='mb-8'>
		<h1 class='text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
			{m.uuid_h1()}
		</h1>
		<p class='mt-3 max-w-2xl text-pretty leading-relaxed text-muted'>
			{m.uuid_hero_description()}
		</p>
	</header>

	<MiscTool />

	<section class='mt-14 space-y-6'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.uuid_versions_heading()}</h2>
		<p class='leading-relaxed text-muted'>{m.uuid_versions_intro()}</p>

		<div class='grid grid-cols-1 gap-4 sm:grid-cols-2'>
			<div class='rounded-xl border border-border bg-surface-hover/30 p-4'>
				<h3 class='font-mono text-base font-semibold text-accent'>UUID v1</h3>
				<p class='mt-1.5 text-xs text-muted leading-relaxed'>{m.uuid_v1_desc()}</p>
			</div>
			<div class='rounded-xl border border-border bg-surface-hover/30 p-4'>
				<h3 class='font-mono text-base font-semibold text-accent'>UUID v3 & v5</h3>
				<p class='mt-1.5 text-xs text-muted leading-relaxed'>{m.uuid_v3_v5_desc()}</p>
			</div>
			<div class='rounded-xl border border-border bg-surface-hover/30 p-4'>
				<h3 class='font-mono text-base font-semibold text-accent'>UUID v4</h3>
				<p class='mt-1.5 text-xs text-muted leading-relaxed'>{m.uuid_v4_desc()}</p>
			</div>
			<div class='rounded-xl border border-border bg-surface-hover/30 p-4'>
				<h3 class='font-mono text-base font-semibold text-accent'>UUID v7 (RFC 9562)</h3>
				<p class='mt-1.5 text-xs text-muted leading-relaxed'>{m.uuid_v7_desc()}</p>
			</div>
			<div class='rounded-xl border border-border bg-surface-hover/30 p-4'>
				<h3 class='font-mono text-base font-semibold text-accent'>UUID v6</h3>
				<p class='mt-1.5 text-xs text-muted leading-relaxed'>{m.uuid_v6_desc()}</p>
			</div>
			<div class='rounded-xl border border-border bg-surface-hover/30 p-4'>
				<h3 class='font-mono text-base font-semibold text-accent'>UUID v8</h3>
				<p class='mt-1.5 text-xs text-muted leading-relaxed'>{m.uuid_v8_desc()}</p>
			</div>
		</div>
	</section>

	<section class='mt-12 space-y-4'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.uuid_minecraft_heading()}</h2>
		<p class='leading-relaxed text-muted'>{m.uuid_minecraft_info()}</p>
	</section>

	<section class='mt-12 space-y-4'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.uuid_faq_heading()}</h2>
		<div class='space-y-3'>
			{#each faqs as faq (faq.question)}
				<details class='group rounded-xl border border-border bg-surface-hover/20 p-4 [&_summary::-webkit-details-marker]:hidden'>
					<summary class='flex cursor-pointer items-center justify-between font-medium text-foreground'>
						<span>{faq.question()}</span>
						<span class='transition group-open:rotate-180'>↓</span>
					</summary>
					<p class='mt-2 text-sm leading-relaxed text-muted'>{faq.answer()}</p>
				</details>
			{/each}
		</div>
	</section>

	<p class='mt-10 text-center text-xs text-muted/60'>{m.tools_privacy_note()}</p>
</section>