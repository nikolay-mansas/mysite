<script lang="ts">
	import { resolve } from '$app/paths';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { Pathname } from '$app/types';
	import EncodeTool from '$lib/components/tools/EncodeTool.svelte';
	import { SITE } from '$lib/config';
	import { m } from '$lib/paraglide/messages';

	const canonical = `${SITE.url}/tools/encode`;

	const codecs = [
		{ id: 'base64', name: 'Base64', slug: 'base64', desc: () => m.encode_fmt_base64_desc() },
		{ id: 'base64url', name: 'Base64 URL', slug: 'base64url', desc: () => m.encode_fmt_base64url_desc() },
		{ id: 'base32', name: 'Base32 (RFC 4648)', slug: 'base32', desc: () => m.encode_fmt_base32_desc() },
		{ id: 'hex', name: 'Hex', slug: 'hex', desc: () => m.encode_fmt_hex_desc() },
		{ id: 'url', name: 'URL percent-encoding', slug: 'url', desc: () => m.encode_fmt_url_desc() },
		{ id: 'html', name: 'HTML entities', slug: 'html', desc: () => m.encode_fmt_html_desc() },
		{ id: 'rot13', name: 'ROT13', slug: 'rot13', desc: () => m.encode_fmt_rot13_desc() },
		{ id: 'binary', name: 'Binary (base 2)', slug: 'binary', desc: () => m.encode_fmt_binary_desc() },
		{ id: 'ascii', name: 'ASCII decimal', slug: 'ascii', desc: () => m.encode_fmt_ascii_desc() },
	];

	const faq = $derived([
		{ q: m.encode_faq_q1(), a: m.encode_faq_a1() },
		{ q: m.encode_faq_q2(), a: m.encode_faq_a2() },
		{ q: m.encode_faq_q3(), a: m.encode_faq_a3() },
		{ q: m.encode_faq_q4(), a: m.encode_faq_a4() },
	]);

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'WebApplication',
					name: m.encode_og_title(),
					url: canonical,
					applicationCategory: 'DeveloperApplication',
					operatingSystem: 'Any',
					description: m.encode_meta_description(),
					offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
					featureList: codecs.map((c) => c.name),
				},
				{
					'@type': 'BreadcrumbList',
					itemListElement: [
						{ '@type': 'ListItem', position: 1, name: m.common_home(), item: SITE.url },
						{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: `${SITE.url}/tools` },
						{ '@type': 'ListItem', position: 3, name: m.encode_breadcrumb_title(), item: canonical },
					],
				},
				{
					'@type': 'FAQPage',
					mainEntity: faq.map((f) => ({
						'@type': 'Question',
						name: f.q,
						acceptedAnswer: { '@type': 'Answer', text: f.a },
					})),
				},
			],
		})
	);
	const scriptClose = '</scr' + 'ipt>';
</script>

<svelte:head>
	<title>{m.encode_seo_title({ heroName: m.hero_name() })}</title>
	<meta name="description" content={m.encode_meta_description()} />
	<meta name="keywords" content={m.encode_meta_keywords()} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={m.encode_og_title()} />
	<meta property="og:description" content={m.encode_og_description()} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={m.encode_og_title()} />
	<meta name="twitter:description" content={m.encode_og_description()} />
	<link rel="alternate" hreflang="en" href={canonical} />
	<link rel="alternate" hreflang="ru" href={`${SITE.url}/ru/tools/encode`} />
	<link rel="alternate" hreflang="x-default" href={canonical} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}${scriptClose}`}
</svelte:head>

<section class="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6">
	<nav aria-label={m.common_breadcrumb_aria()} class="mb-6 text-xs text-muted/70">
		<a href={resolve(localizeHref('/') as Pathname)} class="hover:text-foreground">{m.common_home()}</a>
		<span class="mx-2">/</span>
		<a href={resolve(localizeHref('/tools') as Pathname)} class="hover:text-foreground">{m.common_tools()}</a>
		<span class="mx-2">/</span>
		<span class="text-foreground/80">{m.encode_breadcrumb_title()}</span>
	</nav>

	<header class="mb-8">
		<h1 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.encode_h1()}
		</h1>
		<p class="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
			{m.encode_hero_p1()} <strong class="text-foreground">Base64</strong>,
			<strong class="text-foreground">Base64 URL</strong>, <strong class="text-foreground">Base32</strong> (RFC 4648),
			<strong class="text-foreground">Hex</strong>, <strong class="text-foreground">URL percent</strong>,
			<strong class="text-foreground">HTML entities</strong>, <strong class="text-foreground">ROT13</strong>,
			<strong class="text-foreground">Binary</strong> и <strong class="text-foreground">ASCII decimal</strong>.
			{m.encode_hero_p2()}
		</p>
	</header>

	<nav aria-label={m.encode_nav_jump_aria()} class="mb-6 flex flex-wrap gap-1.5">
		{#each codecs as c (c.id)}
			<a
				href={`#${c.slug}`}
				class="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground"
			>
				{c.name}
			</a>
		{/each}
	</nav>

	<EncodeTool />

	<section class="mt-12 space-y-8">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">{m.encode_formats_heading()}</h2>

		{#each codecs as c (c.id)}
			<article id={c.slug} class="scroll-mt-20">
				<h3 class="text-xl font-semibold text-foreground">{c.name}</h3>
				<p class="mt-2 leading-relaxed text-muted">
					{c.desc()}
				</p>
			</article>
		{/each}
	</section>

	<section class="mt-12">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">{m.encode_faq_heading()}</h2>
		<div class="mt-5 space-y-3">
			{#each faq as item (item.q)}
				<details class="rounded-xl border border-border bg-surface p-4">
					<summary class="cursor-pointer list-none text-sm font-semibold text-foreground">{item.q}</summary>
					<p class="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="mt-12">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">{m.encode_related_heading()}</h2>
		<ul class="mt-4 flex flex-wrap gap-2">
			<li>
				<a
					class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground"
					href={resolve(localizeHref('/tools/hash') as Pathname)}
				>
					{m.encode_related_hash()}
				</a>
			</li>
			<li>
				<a
					class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground"
					href={resolve(localizeHref('/tools/cipher') as Pathname)}
				>
					{m.encode_related_cipher()}
				</a>
			</li>
			<li>
				<a
					class="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground"
					href={resolve(localizeHref('/tools/hmac') as Pathname)}
				>
					{m.encode_related_hmac()}
				</a>
			</li>
		</ul>
	</section>

	<p class="mt-10 text-center text-xs text-muted/60">{m.tools_privacy_note()}</p>
</section>