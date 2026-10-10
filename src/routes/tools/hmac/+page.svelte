<script lang="ts">
	import { SITE } from '$lib/config';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import HmacTool from '$lib/components/tools/HmacTool.svelte';

	const canonical = `${SITE.url}/tools/hmac`;

	const algoGroups = [
		{
			id: 'sha2',
			name: m.hmac_group_sha2(),
			algos: [
				{ id: 'hmac-sha256', name: 'HMAC-SHA-256', bits: 256, desc: m.hmac_algo_sha256_desc() },
				{ id: 'hmac-sha512', name: 'HMAC-SHA-512', bits: 512, desc: m.hmac_algo_sha512_desc() },
				{ id: 'hmac-sha384', name: 'HMAC-SHA-384', bits: 384, desc: m.hmac_algo_sha384_desc() },
				{ id: 'hmac-sha224', name: 'HMAC-SHA-224', bits: 224, desc: m.hmac_algo_sha224_desc() },
			]
		},
		{
			id: 'sha3',
			name: m.hmac_group_sha3(),
			algos: [
				{ id: 'hmac-sha3-256', name: 'HMAC-SHA3-256', bits: 256, desc: m.hmac_algo_sha3_256_desc() },
				{ id: 'hmac-sha3-512', name: 'HMAC-SHA3-512', bits: 512, desc: m.hmac_algo_sha3_512_desc() },
				{ id: 'hmac-sha3-384', name: 'HMAC-SHA3-384', bits: 384, desc: m.hmac_algo_sha3_384_desc() },
				{ id: 'hmac-sha3-224', name: 'HMAC-SHA3-224', bits: 224, desc: m.hmac_algo_sha3_224_desc() },
			]
		},
		{
			id: 'blake',
			name: m.hmac_group_blake(),
			algos: [
				{ id: 'hmac-blake2b-512', name: 'HMAC-BLAKE2b-512', bits: 512, desc: m.hmac_algo_blake2b_512_desc() },
				{ id: 'hmac-blake2b-256', name: 'HMAC-BLAKE2b-256', bits: 256, desc: m.hmac_algo_blake2b_256_desc() },
				{ id: 'hmac-blake2s-256', name: 'HMAC-BLAKE2s-256', bits: 256, desc: m.hmac_algo_blake2s_256_desc() },
			]
		},
		{
			id: 'legacy',
			name: m.hmac_group_legacy_ripemd(),
			algos: [
				{ id: 'hmac-md5', name: 'HMAC-MD5', bits: 128, desc: m.hmac_algo_md5_desc() },
				{ id: 'hmac-sha1', name: 'HMAC-SHA-1', bits: 160, desc: m.hmac_algo_sha1_desc() },
				{ id: 'hmac-ripemd160', name: 'HMAC-RIPEMD-160', bits: 160, desc: m.hmac_algo_ripemd160_desc() },
			]
		},
		{
			id: 'specialized',
			name: m.hmac_group_specialized(),
			algos: [
				{ id: 'hmac-streebog256', name: 'HMAC-Streebog-256 (ГОСТ)', bits: 256, desc: m.hmac_algo_streebog256_desc() },
				{ id: 'hmac-streebog512', name: 'HMAC-Streebog-512 (ГОСТ)', bits: 512, desc: m.hmac_algo_streebog512_desc() },
				{ id: 'hmac-sm3', name: 'HMAC-SM3 (GB/T 32918)', bits: 256, desc: m.hmac_algo_sm3_desc() },
				{ id: 'hmac-whirlpool', name: 'HMAC-Whirlpool', bits: 512, desc: m.hmac_algo_whirlpool_desc() },
			]
		}
	];

	const allAlgos = algoGroups.flatMap((g) => g.algos);

	const faq = [
		{ q: m.hmac_faq_q1(), a: m.hmac_faq_a1() },
		{ q: m.hmac_faq_q2(), a: m.hmac_faq_a2() },
		{ q: m.hmac_faq_q3(), a: m.hmac_faq_a3() },
		{ q: m.hmac_faq_q4(), a: m.hmac_faq_a4() },
		{ q: m.hmac_faq_q5(), a: m.hmac_faq_a5() },
		{ q: m.hmac_faq_q6(), a: m.hmac_faq_a6() },
		{ q: m.hmac_faq_q7(), a: m.hmac_faq_a7() },
		{ q: m.hmac_faq_q8(), a: m.hmac_faq_a8() },
		{ q: m.hmac_faq_q9(), a: m.hmac_faq_a9() },
	];

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: m.hmac_seo_app_name(),
				url: canonical,
				applicationCategory: 'SecurityApplication',
				operatingSystem: 'Any',
				description: m.hmac_meta_description(),
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				featureList: allAlgos.map((a) => a.name),
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: m.common_home(), item: SITE.url },
					{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: `${SITE.url}/tools` },
					{ '@type': 'ListItem', position: 3, name: m.hmac_breadcrumb_title(), item: canonical },
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
	});
	const scriptClose = '</scr' + 'ipt>';
</script>

<svelte:head>
	<title>{m.hmac_seo_title({ heroName: m.hero_name() })}</title>
	<meta name="description" content={m.hmac_meta_description()} />
	<meta name="keywords" content={m.hmac_meta_keywords()} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="index, follow" />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={m.hmac_og_title()} />
	<meta property="og:description" content={m.hmac_meta_description()} />
	<meta property="og:url" content={canonical} />

	<link rel="alternate" hreflang="en" href={canonical} />
	<link rel="alternate" hreflang="ru" href={`${SITE.url}/ru/tools/hmac`} />
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
		<span class="text-foreground/80">{m.hmac_breadcrumb_title()}</span>
	</nav>

	<header class="mb-8">
		<h1 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.hmac_h1_title()}
		</h1>
		<p class="mt-3 max-w-3xl text-pretty leading-relaxed text-muted">
			{m.hmac_hero_description()}
		</p>
	</header>

	<nav aria-label={m.hmac_algo_nav_aria()} class="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-3 sm:p-4">
		<div class="text-xs font-semibold uppercase tracking-wider text-muted/70">
			{m.hmac_quick_jump()}
		</div>
		<div class="flex flex-wrap gap-2">
			{#each algoGroups as group (group.id)}
				<div class="flex flex-wrap items-center gap-1.5 border-r border-border/60 pr-2 last:border-r-0">
					{#each group.algos as a (a.id)}
						<a
							href={`#${a.id}`}
							class="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground"
						>
							{a.name}
						</a>
					{/each}
				</div>
			{/each}
		</div>
	</nav>

	<HmacTool />

	<section class="mt-14 space-y-12">
		<div class="border-b border-border/60 pb-6">
			<h2 class="text-2xl font-bold tracking-tight text-foreground">
				{m.hmac_guide_heading()}
			</h2>
			<p class="mt-3 max-w-3xl leading-relaxed text-muted">
				{m.hmac_guide_intro()}
			</p>
			<pre class="mt-4 overflow-x-auto rounded-lg border border-border bg-surface-hover p-4 font-mono text-xs text-foreground/80"><code>HMAC(K, m) = H( (K ⊕ opad) ‖ H( (K ⊕ ipad) ‖ m ) )</code></pre>
		</div>

		{#each algoGroups as group (group.id)}
			<div class="space-y-6">
				<h3 class="border-l-2 border-accent pl-3 text-lg font-bold tracking-tight text-foreground">
					{group.name}
				</h3>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each group.algos as a (a.id)}
						<article id={a.id} class="scroll-mt-24 rounded-xl border border-border bg-surface p-4">
							<div class="flex items-center justify-between">
								<h4 class="font-mono text-base font-semibold text-foreground">{a.name}</h4>
								<span class="rounded bg-muted/10 px-2 py-0.5 text-xs text-muted">
									{a.bits} {m.hmac_unit_bits()}
								</span>
							</div>
							<p class="mt-2 text-sm leading-relaxed text-muted">
								{a.desc}
							</p>
						</article>
					{/each}
				</div>
			</div>
		{/each}
	</section>

	<section class="mt-14">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">
			{m.hmac_faq_heading()}
		</h2>
		<div class="mt-6 space-y-3">
			{#each faq as item (item.q)}
				<details class="group rounded-xl border border-border bg-surface p-4">
					<summary class="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">
						{item.q}
					</summary>
					<p class="mt-2.5 text-sm leading-relaxed text-muted">
						{item.a}
					</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="mt-14">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">
			{m.hmac_related_tools_heading()}
		</h2>
		<ul class="mt-4 flex flex-wrap gap-2">
			<li>
				<a class="inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground" href={resolve(localizeHref('/tools/hash') as Pathname)}>
					{m.tool_hash_title()}
				</a>
			</li>
			<li>
				<a class="inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground" href={resolve(localizeHref('/tools/encode') as Pathname)}>
					{m.tool_encode_title()}
				</a>
			</li>
			<li>
				<a class="inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground" href={resolve(localizeHref('/tools/cipher') as Pathname)}>
					{m.tool_cipher_title()}
				</a>
			</li>
		</ul>
	</section>

	<p class="mt-12 text-center text-xs text-muted/60">{m.tools_privacy_note()}</p>
</section>