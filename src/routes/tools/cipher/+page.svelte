<script lang='ts'>
	import CipherTool from '$lib/components/tools/CipherTool.svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';
	import SeoHead from '$lib/components/SeoHead.svelte';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	const algoSections = $derived([
		{ id: 'aes', name: 'AES (128, 192, 256, 512)', bits: '128–512', desc: m.cipher_desc_aes() },
		{ id: 'chacha20', name: 'ChaCha20 (Stream)', bits: '256', desc: m.cipher_desc_chacha() },
		{ id: 'twofish', name: 'Twofish', bits: '128–256', desc: m.cipher_desc_twofish() },
		{ id: 'blowfish', name: 'Blowfish', bits: '32–448', desc: m.cipher_desc_blowfish() },
		{ id: 'serpent', name: 'Serpent', bits: '128–256', desc: m.cipher_desc_serpent() },
		{ id: '3des-des', name: 'Triple DES & DES', bits: '56 / 168', desc: m.cipher_desc_des() },
		{ id: 'idea', name: 'IDEA', bits: '128', desc: m.cipher_desc_idea() },
		{ id: 'rivest', name: 'RC4, RC5, RC6', bits: '40–2048', desc: m.cipher_desc_rc() },
		{ id: 'camellia-aria', name: 'Camellia & ARIA', bits: '128–256', desc: m.cipher_desc_camellia_aria() },
		{ id: 'rsa-ecc', name: 'RSA & ECC (ECDSA/ECDH)', bits: '256–2048', desc: m.cipher_desc_rsa_ecc() },
		{ id: 'dh', name: 'Diffie-Hellman Key Exchange', bits: '2048', desc: m.cipher_desc_dh() },
		{ id: 'ml-kem', name: 'ML-KEM (512, 768, 1024 FIPS 203)', bits: 'Lattice KEM', desc: m.cipher_desc_ml_kem() },
		{ id: 'ml-dsa', name: 'ML-DSA (Dilithium-65 FIPS 204)', bits: 'Lattice Sign', desc: m.cipher_desc_ml_dsa() }
	]);

	const faq = $derived([
		{ q: m.cipher_faq_q1(), a: m.cipher_faq_a1() },
		{ q: m.cipher_faq_q2(), a: m.cipher_faq_a2() },
		{ q: m.cipher_faq_q3(), a: m.cipher_faq_a3() },
		{ q: m.cipher_faq_q4(), a: m.cipher_faq_a4() },
		{ q: m.cipher_faq_q5(), a: m.cipher_faq_a5() },
		{ q: m.cipher_faq_q6(), a: m.cipher_faq_a6() },
		{ q: m.cipher_faq_q7(), a: m.cipher_faq_a7() },
		{ q: m.cipher_faq_q8(), a: m.cipher_faq_a8() },
		{ q: m.cipher_faq_q9(), a: m.cipher_faq_a9() }
	]);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: m.cipher_seo_app_name(),
				url: urls.canonical,
				applicationCategory: 'SecurityApplication',
				operatingSystem: 'Any',
				description: m.cipher_meta_description(),
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				featureList: algoSections.map((a) => a.name)
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: m.common_home(), item: urls.homeUrl },
					{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: urls.toolsUrl },
					{ '@type': 'ListItem', position: 3, name: m.cipher_breadcrumb_title(), item: urls.canonical }
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
	title={m.cipher_seo_title({ heroName: m.hero_name() })}
	description={m.cipher_meta_description()}
	keywords={m.cipher_meta_keywords()}
	ogTitle={m.cipher_og_title()}
	jsonLd={jsonLd}
/>

<section class='mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6'>
	<nav aria-label={m.common_breadcrumb_aria()} class='mb-6 text-xs text-muted/70'>
		<a href={resolve(localizeHref('/') as Pathname)} class='hover:text-foreground'>{m.common_home()}</a>
		<span class='mx-2'>/</span>
		<a href={resolve(localizeHref('/tools') as Pathname)} class='hover:text-foreground'>{m.common_tools()}</a>
		<span class='mx-2'>/</span>
		<span class='text-foreground/80'>{m.cipher_breadcrumb_title()}</span>
	</nav>

	<header class='mb-8'>
		<h1 class='text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
			{m.cipher_h1_title()}
		</h1>
		<p class='mt-3 max-w-3xl text-pretty leading-relaxed text-muted'>
			{m.cipher_hero_description()}
		</p>
	</header>

	<CipherTool />

	<section class='mt-14 space-y-12'>
		<div class='border-b border-border/60 pb-6'>
			<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.cipher_guide_heading()}</h2>
			<p class='mt-3 max-w-3xl leading-relaxed text-muted'>{m.cipher_guide_intro()}</p>
		</div>

		<div class='grid gap-4 sm:grid-cols-2'>
			{#each algoSections as algo (algo.id)}
				<article id={algo.id} class='scroll-mt-24 rounded-xl border border-border bg-surface p-4'>
					<div class='flex items-center justify-between'>
						<h3 class='font-mono text-base font-semibold text-foreground'>{algo.name}</h3>
						<span class='rounded bg-muted/10 px-2 py-0.5 text-xs text-muted'>{algo.bits}</span>
					</div>
					<p class='mt-2 text-sm leading-relaxed text-muted'>{algo.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class='mt-14'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.cipher_faq_heading()}</h2>
		<div class='mt-6 space-y-3'>
			{#each faq as item (item.q)}
				<details class='group rounded-xl border border-border bg-surface p-4'>
					<summary class='cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden'>{item.q}</summary>
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
				<a class='inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground' href={resolve(localizeHref('/tools/hmac') as Pathname)}>
					{m.tool_hmac_title()}
				</a>
			</li>
		</ul>
	</section>

	<p class='mt-12 text-center text-xs text-muted/60'>{m.tools_privacy_note()}</p>
</section>