<script lang="ts">
	import { SITE } from '$lib/config';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';
	import SeoHead from '$lib/components/SeoHead.svelte';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	const toolCards = $derived([
		{
			href: '/tools/hash',
			title: m.tool_hash_title(),
			desc: m.tools_hub_hash_desc(),
			tags: ['SHA-256', 'SHA-512', 'Keccak', 'Streebog', 'BLAKE2', 'xxHash', 'CRC32']
		},
		{
			href: '/tools/cipher',
			title: m.tools_tab_cipher(),
			desc: m.tools_hub_cipher_desc(),
			tags: ['AES-GCM', 'ChaCha20', 'RSA-2048', 'ML-KEM (Kyber)', 'ECDSA', 'Diffie-Hellman']
		},
		{
			href: '/tools/hmac',
			title: m.tool_hmac_title(),
			desc: m.tools_hub_hmac_desc(),
			tags: ['HMAC-SHA256', 'HMAC-SHA512', 'HMAC-SHA3', 'HMAC-Streebog', 'HMAC-SM3', 'JWT HS256']
		},
		{
			href: '/tools/encode',
			title: m.tool_encode_title(),
			desc: m.tools_hub_encode_desc(),
			tags: ['Base64', 'Base64 URL', 'Hex', 'Base32', 'URL percent', 'Binary', 'ROT13']
		},
		{
			href: '/tools/misc',
			title: m.uuid_breadcrumb_title(),
			desc: m.tools_hub_misc_desc(),
			tags: ['UUID v4', 'UUID v7', 'Minecraft UUID', 'UUID Inspector', 'RFC 9562']
		}
	]);

	const faq = $derived([
		{ q: m.tools_hub_faq_q1(), a: m.tools_hub_faq_a1() },
		{ q: m.tools_hub_faq_q2(), a: m.tools_hub_faq_a2() },
		{ q: m.tools_hub_faq_q3(), a: m.tools_hub_faq_a3() }
	]);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'CollectionPage',
				name: m.tools_hub_seo_app_name(),
				url: urls.canonical,
				description: m.tools_hub_meta_description(),
				hasPart: toolCards.map((g) => ({
					'@type': 'WebApplication',
					name: g.title,
					url: `${SITE.url}${urls.localePrefix}${g.href}`,
					applicationCategory: 'DeveloperApplication',
					operatingSystem: 'Any',
					offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
				}))
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: m.common_home(), item: urls.homeUrl },
					{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: urls.canonical }
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
	title={m.tools_hub_seo_title({ heroName: m.hero_name() })}
	description={m.tools_hub_meta_description()}
	keywords={m.tools_hub_meta_keywords()}
	ogTitle={m.tools_hub_og_title()}
	jsonLd={jsonLd}
/>

<section class="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6">
	<nav aria-label={m.common_breadcrumb_aria()} class="mb-6 text-xs text-muted/70">
		<a href={resolve(localizeHref('/') as Pathname)} class="hover:text-foreground">{m.common_home()}</a>
		<span class="mx-2">/</span>
		<span class="text-foreground/80">{m.common_tools()}</span>
	</nav>

	<header class="mb-10">
		<h1 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.tools_hub_h1()}
		</h1>
		<p class="mt-3 max-w-3xl text-pretty leading-relaxed text-muted">
			{m.tools_hub_hero()}
		</p>
	</header>

	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
		{#each toolCards as card (card.href)}
			<article>
				<a
					href={resolve(localizeHref(card.href) as Pathname)}
					class="group flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-hover hover:shadow-lg"
				>
					<div>
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold tracking-tight text-foreground group-hover:text-accent">
								{card.title}
							</h2>
							<span class="font-mono text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">→</span>
						</div>
						<p class="mt-2.5 text-sm leading-relaxed text-muted">{card.desc}</p>
					</div>

					<ul class="mt-5 flex flex-wrap gap-1.5" aria-label="Algorithms and formats">
						{#each card.tags as tag (tag)}
							<li class="rounded-md border border-border/60 bg-surface-hover/70 px-2 py-0.5 font-mono text-[11px] text-muted transition-colors group-hover:border-accent/20 group-hover:text-foreground">
								{tag}
							</li>
						{/each}
					</ul>
				</a>
			</article>
		{/each}
	</div>

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

	<p class="mt-12 text-center text-xs text-muted/60">{m.tools_privacy_note()}</p>
</section>