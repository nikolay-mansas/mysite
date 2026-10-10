<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import HashTool from '$lib/components/tools/HashTool.svelte';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	const algoGroups = $derived([
		{
			id: 'sha2',
			name: m.hash_group_sha2(),
			algos: [
				{ id: 'sha256', name: 'SHA-256', bits: 256, desc: m.hash_algo_sha256_desc() },
				{ id: 'sha512', name: 'SHA-512', bits: 512, desc: m.hash_algo_sha512_desc() },
				{ id: 'sha384', name: 'SHA-384', bits: 384, desc: m.hash_algo_sha384_desc() }
			]
		},
		{
			id: 'legacy',
			name: m.hash_group_legacy(),
			algos: [
				{ id: 'md5', name: 'MD5', bits: 128, desc: m.hash_algo_md5_desc() },
				{ id: 'sha1', name: 'SHA-1', bits: 160, desc: m.hash_algo_sha1_desc() }
			]
		},
		{
			id: 'keccak_sha3',
			name: m.hash_group_sha3(),
			algos: [
				{ id: 'keccak256', name: 'Keccak-256', bits: 256, desc: m.hash_algo_keccak256_desc() },
				{ id: 'sha3-256', name: 'SHA3-256', bits: 256, desc: m.hash_algo_sha3_256_desc() },
				{ id: 'sha3-512', name: 'SHA3-512', bits: 512, desc: m.hash_algo_sha3_512_desc() },
				{ id: 'sha3-384', name: 'SHA3-384', bits: 384, desc: m.hash_algo_sha3_384_desc() },
				{ id: 'sha3-224', name: 'SHA3-224', bits: 224, desc: m.hash_algo_sha3_224_desc() }
			]
		},
		{
			id: 'blake',
			name: m.hash_group_blake(),
			algos: [
				{ id: 'blake2b-512', name: 'BLAKE2b-512', bits: 512, desc: m.hash_algo_blake2b_desc() },
				{ id: 'blake2b-256', name: 'BLAKE2b-256', bits: 256, desc: m.hash_algo_blake2b_256_desc() },
				{ id: 'blake2s-256', name: 'BLAKE2s-256', bits: 256, desc: m.hash_algo_blake2s_desc() }
			]
		},
		{
			id: 'non_cryptographic',
			name: m.hash_group_fast(),
			algos: [
				{ id: 'xxhash32', name: 'xxHash32', bits: 32, desc: m.hash_algo_xxhash32_desc() },
				{ id: 'murmurhash3-128', name: 'MurmurHash3-128', bits: 128, desc: m.hash_algo_murmur3_128_desc() },
				{ id: 'murmurhash3-32', name: 'MurmurHash3-32', bits: 32, desc: m.hash_algo_murmur3_32_desc() },
				{ id: 'murmurhash2-64', name: 'MurmurHash2-64', bits: 64, desc: m.hash_algo_murmur2_64_desc() },
				{ id: 'murmurhash2-32', name: 'MurmurHash2-32', bits: 32, desc: m.hash_algo_murmur2_32_desc() }
			]
		},
		{
			id: 'checksums',
			name: m.hash_group_checksums(),
			algos: [
				{ id: 'crc32', name: 'CRC-32', bits: 32, desc: m.hash_algo_crc32_desc() },
				{ id: 'crc64', name: 'CRC-64', bits: 64, desc: m.hash_algo_crc64_desc() },
				{ id: 'adler32', name: 'Adler-32', bits: 32, desc: m.hash_algo_adler32_desc() }
			]
		},
		{
			id: 'specialized',
			name: m.hash_group_specialized(),
			algos: [
				{ id: 'streebog-256', name: 'Streebog-256 (GOST R 34.11-2012)', bits: 256, desc: m.hash_algo_streebog256_desc() },
				{ id: 'streebog-512', name: 'Streebog-512 (GOST R 34.11-2012)', bits: 512, desc: m.hash_algo_streebog512_desc() },
				{ id: 'whirlpool', name: 'Whirlpool', bits: 512, desc: m.hash_algo_whirlpool_desc() },
				{ id: 'ripemd160', name: 'RIPEMD-160', bits: 160, desc: m.hash_algo_ripemd160_desc() }
			]
		}
	]);

	const allAlgos = $derived(algoGroups.flatMap((g) => g.algos));

	const faq = $derived([
		{ q: m.hash_faq_q1(), a: m.hash_faq_a1() },
		{ q: m.hash_faq_q2(), a: m.hash_faq_a2() },
		{ q: m.hash_faq_q3(), a: m.hash_faq_a3() },
		{ q: m.hash_faq_q4(), a: m.hash_faq_a4() },
		{ q: m.hash_faq_q5(), a: m.hash_faq_a5() },
		{ q: m.hash_faq_q6(), a: m.hash_faq_a6() },
		{ q: m.hash_faq_q7(), a: m.hash_faq_a7() },
		{ q: m.hash_faq_q8(), a: m.hash_faq_a8() },
		{ q: m.hash_faq_q9(), a: m.hash_faq_a9() },
		{ q: m.hash_faq_q10(), a: m.hash_faq_a10() }
	]);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: m.hash_seo_app_name(),
				url: urls.canonical,
				applicationCategory: 'DeveloperApplication',
				operatingSystem: 'Any',
				description: m.hash_meta_description(),
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				featureList: allAlgos.map((a) => a.name)
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: m.common_home(), item: urls.homeUrl },
					{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: urls.toolsUrl },
					{ '@type': 'ListItem', position: 3, name: m.hash_breadcrumb_title(), item: urls.canonical }
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
	title={m.hash_seo_title({ heroName: m.hero_name() })}
	description={m.hash_meta_description()}
	keywords={m.hash_meta_keywords()}
	ogTitle={m.hash_og_title()}
	jsonLd={jsonLd}
/>

<section class="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6">
	<nav aria-label={m.common_breadcrumb_aria()} class="mb-6 text-xs text-muted/70">
		<a href={resolve(localizeHref('/') as Pathname)} class="hover:text-foreground">{m.common_home()}</a>
		<span class="mx-2">/</span>
		<a href={resolve(localizeHref('/tools') as Pathname)} class="hover:text-foreground">{m.common_tools()}</a>
		<span class="mx-2">/</span>
		<span class="text-foreground/80">{m.hash_breadcrumb_title()}</span>
	</nav>

	<header class="mb-8">
		<h1 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.hash_h1_title()}
		</h1>
		<p class="mt-3 max-w-3xl text-pretty leading-relaxed text-muted">
			{m.hash_hero_description()}
		</p>
	</header>

	<nav aria-label={m.hash_algo_nav_aria()} class="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-3 sm:p-4">
		<div class="text-xs font-semibold uppercase tracking-wider text-muted/70">{m.hash_quick_jump()}</div>
		<div class="flex flex-wrap gap-2">
			{#each algoGroups as group (group.id)}
				<div class="flex flex-wrap items-center gap-1.5 border-r border-border/60 pr-2 last:border-r-0">
					{#each group.algos as a (a.id)}
						<a href={`#${a.id}`} class="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground">
							{a.name}
						</a>
					{/each}
				</div>
			{/each}
		</div>
	</nav>

	<HashTool />

	<section class="mt-14 space-y-12">
		<div class="border-b border-border/60 pb-6">
			<h2 class="text-2xl font-bold tracking-tight text-foreground">{m.hash_guide_heading()}</h2>
			<p class="mt-3 max-w-3xl leading-relaxed text-muted">{m.hash_guide_intro()}</p>
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
								<span class="rounded bg-muted/10 px-2 py-0.5 text-xs text-muted">{a.bits} {m.hash_unit_bits()}</span>
							</div>
							<p class="mt-2 text-sm leading-relaxed text-muted">{a.desc}</p>
						</article>
					{/each}
				</div>
			</div>
		{/each}
	</section>

	<section class="mt-14">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">{m.hash_faq_heading()}</h2>
		<div class="mt-6 space-y-3">
			{#each faq as item (item.q)}
				<details class="group rounded-xl border border-border bg-surface p-4">
					<summary class="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">{item.q}</summary>
					<p class="mt-2.5 text-sm leading-relaxed text-muted">{item.a}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="mt-14">
		<h2 class="text-2xl font-bold tracking-tight text-foreground">{m.hash_related_tools_heading()}</h2>
		<ul class="mt-4 flex flex-wrap gap-2">
			<li>
				<a class="inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground" href={resolve(localizeHref('/tools/hmac') as Pathname)}>
					{m.tool_hmac_title()}
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