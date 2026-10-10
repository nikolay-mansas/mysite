<script lang="ts">
	import { SITE } from '$lib/config';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	const groups = [
		{
			href: '/tools/hash',
			title: 'Hash Generator',
			titleRu: 'Генератор хешей',
			desc: 'MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3, Keccak-256, BLAKE2b, BLAKE2s, RIPEMD-160',
			keywords: ['sha256 online', 'md5 generator', 'sha512 hash', 'blake2'],
		},
		{
			href: '/tools/encode',
			title: 'Encoder / Decoder',
			titleRu: 'Кодировщик / Декодер',
			desc: 'Base64, Base64 URL, Base32, Hex, URL percent, HTML entities, ROT13, Binary, ASCII',
			keywords: ['base64 encode', 'hex decode', 'url encode', 'rot13'],
		},
		{
			href: '/tools/cipher',
			title: 'Encryption & Ciphers',
			titleRu: 'Шифрование',
			desc: 'AES-256-GCM (PBKDF2), XOR, Caesar, Vigenère',
			keywords: ['aes 256 online', 'caesar cipher', 'vigenere', 'xor cipher'],
		},
		{
			href: '/tools/hmac',
			title: 'HMAC Generator',
			titleRu: 'Генератор HMAC',
			desc: 'HMAC-SHA1, HMAC-SHA256, HMAC-SHA384, HMAC-SHA512',
			keywords: ['hmac sha256 online', 'hmac generator'],
		},
		{
			href: '/tools/misc',
			title: 'Utilities',
			titleRu: 'Утилиты',
			desc: 'UUID v4 generator',
			keywords: ['uuid v4 generator', 'guid generator'],
		},
	];

	const canonical = `${SITE.url}/tools`;

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Free Online Developer Tools',
		url: canonical,
		description:
			'Free online developer tools: hash generators (MD5, SHA-256, SHA-512), encoders (Base64, Hex), ciphers (AES, XOR, Caesar), HMAC, UUID.',
		hasPart: groups.map((g) => ({
			'@type': 'WebApplication',
			name: g.title,
			url: `${SITE.url}${g.href}`,
			applicationCategory: 'DeveloperApplication',
			operatingSystem: 'Any',
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		})),
	});
	const scriptClose = '</scr' + 'ipt>';
</script>

<svelte:head>
	<title>Free Online Developer Tools — Hash, Base64, AES, HMAC | {m.hero_name()}</title>
	<meta
		name="description"
		content="Free browser-based developer tools: SHA-256, MD5, SHA-512 hash generators, Base64/Base32/Hex encoders, AES-256-GCM, XOR, Caesar, Vigenère ciphers, HMAC and UUID v4."
	/>
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Free Online Developer Tools — Hash, Base64, AES, HMAC" />
	<meta property="og:description" content="SHA-256 / MD5 / SHA-512 hashes, Base64 / Hex, AES-256-GCM, HMAC, UUID — всё работает в браузере, без отправки данных на сервер." />
	<meta property="og:url" content={canonical} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}${scriptClose}`}
</svelte:head>

<section class="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6">
	<nav aria-label="Breadcrumb" class="mb-6 text-xs text-muted/70">
		<a href={resolve(localizeHref('/') as Pathname)} class="hover:text-foreground">Home</a>
		<span class="mx-2">/</span>
		<span class="text-foreground/80">Tools</span>
	</nav>

	<header class="mb-10">
		<h1 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			Free Online Developer Tools
		</h1>
		<p class="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
			A collection of fast, privacy-first tools that run entirely in your browser.
			Compute <strong class="text-foreground">SHA-256</strong>, <strong class="text-foreground">MD5</strong>,
			<strong class="text-foreground">SHA-512</strong> hashes, encode and decode
			<strong class="text-foreground">Base64</strong>, <strong class="text-foreground">Hex</strong>,
			<strong class="text-foreground">Base32</strong>, encrypt with
			<strong class="text-foreground">AES-256-GCM</strong>, generate HMAC signatures and UUID v4.
			No data ever leaves your device.
		</p>
	</header>

	<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#each groups as g (g.href)}
			<li>
				<a
					href={resolve(localizeHref(g.href) as Pathname)}
					class="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/40 hover:bg-surface-hover"
				>
					<h2 class="text-lg font-semibold text-foreground group-hover:text-accent">{g.title}</h2>
					<p class="mt-2 text-sm leading-relaxed text-muted">{g.desc}</p>
					<ul class="mt-4 flex flex-wrap gap-1.5">
						{#each g.keywords as k (k)}
							<li class="rounded-md bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-muted">{k}</li>
						{/each}
					</ul>
				</a>
			</li>
		{/each}
	</ul>

	<p class="mt-10 text-center text-xs text-muted/60">
		{m.tools_privacy_note()}
	</p>
</section>