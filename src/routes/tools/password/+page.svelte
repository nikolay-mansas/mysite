<script lang='ts'>
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import PasswordTool from '$lib/components/tools/PasswordTool.svelte';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	const sections = $derived([
		{ id: 'argon2id', name: 'Argon2id', tag: 'RFC 9106', desc: m.pwd_desc_argon2id() },
		{ id: 'bcrypt', name: 'bcrypt', tag: 'Blowfish', desc: m.pwd_desc_bcrypt() },
		{ id: 'scrypt', name: 'scrypt', tag: 'RFC 7914', desc: m.pwd_desc_scrypt() },
		{ id: 'pbkdf2', name: 'PBKDF2', tag: 'NIST SP 800-132', desc: m.pwd_desc_pbkdf2() },
		{ id: 'unix', name: 'SHA-crypt / MD5crypt / apr1 / phpass', tag: 'Unix / Apache / PHP', desc: m.pwd_desc_unix() },
		{ id: 'ntlm', name: 'NTLM', tag: 'Windows', desc: m.pwd_desc_ntlm() },
		{ id: 'scram', name: 'SCRAM-SHA-256', tag: 'RFC 7677', desc: m.pwd_desc_scram() },
		{ id: 'cram', name: 'CRAM-SHA-1', tag: 'RFC 2195', desc: m.pwd_desc_cram() },
		{ id: 'mysql', name: 'MySQL authentication', tag: 'caching_sha2 / native', desc: m.pwd_desc_mysql() }
	]);

	const faq = $derived([
		{ q: m.pwd_faq_q1(), a: m.pwd_faq_a1() },
		{ q: m.pwd_faq_q2(), a: m.pwd_faq_a2() },
		{ q: m.pwd_faq_q3(), a: m.pwd_faq_a3() },
		{ q: m.pwd_faq_q4(), a: m.pwd_faq_a4() }
	]);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				name: m.pwd_seo_app_name(),
				url: urls.canonical,
				applicationCategory: 'SecurityApplication',
				operatingSystem: 'Any',
				description: m.pwd_meta_description(),
				offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
				featureList: sections.map((s) => s.name)
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: m.common_home(), item: urls.homeUrl },
					{ '@type': 'ListItem', position: 2, name: m.common_tools(), item: urls.toolsUrl },
					{ '@type': 'ListItem', position: 3, name: m.pwd_breadcrumb_title(), item: urls.canonical }
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
	title={m.pwd_seo_title({ heroName: m.hero_name() })}
	description={m.pwd_meta_description()}
	keywords={m.pwd_meta_keywords()}
	ogTitle={m.pwd_og_title()}
	jsonLd={jsonLd}
/>

<section class='mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6'>
	<nav aria-label={m.common_breadcrumb_aria()} class='mb-6 text-xs text-muted/70'>
		<a href={resolve(localizeHref('/') as Pathname)} class='hover:text-foreground'>{m.common_home()}</a>
		<span class='mx-2'>/</span>
		<a href={resolve(localizeHref('/tools') as Pathname)} class='hover:text-foreground'>{m.common_tools()}</a>
		<span class='mx-2'>/</span>
		<span class='text-foreground/80'>{m.pwd_breadcrumb_title()}</span>
	</nav>

	<header class='mb-8'>
		<h1 class='text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
			{m.pwd_h1_title()}
		</h1>
		<p class='mt-3 max-w-3xl text-pretty leading-relaxed text-muted'>
			{m.pwd_hero_description()}
		</p>
	</header>

	<PasswordTool />

	<section class='mt-14 space-y-12'>
		<div class='border-b border-border/60 pb-6'>
			<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.pwd_guide_heading()}</h2>
			<p class='mt-3 max-w-3xl leading-relaxed text-muted'>{m.pwd_guide_intro()}</p>
		</div>

		<div class='grid gap-4 sm:grid-cols-2'>
			{#each sections as s (s.id)}
				<article id={s.id} class='scroll-mt-24 rounded-xl border border-border bg-surface p-4'>
					<div class='flex items-center justify-between'>
						<h3 class='font-mono text-base font-semibold text-foreground'>{s.name}</h3>
						<span class='rounded bg-muted/10 px-2 py-0.5 text-xs text-muted'>{s.tag}</span>
					</div>
					<p class='mt-2 text-sm leading-relaxed text-muted'>{s.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class='mt-14'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.pwd_faq_heading()}</h2>
		<div class='mt-6 space-y-3'>
			{#each faq as item (item.q)}
				<details class='rounded-xl border border-border bg-surface p-4'>
					<summary class='cursor-pointer list-none text-sm font-semibold text-foreground'>{item.q}</summary>
					<p class='mt-2.5 text-sm leading-relaxed text-muted'>{item.a}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class='mt-14'>
		<h2 class='text-2xl font-bold tracking-tight text-foreground'>{m.hash_related_tools_heading()}</h2>
		<ul class='mt-4 flex flex-wrap gap-2'>
			<li>
				<a class='inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground'
					href={resolve(localizeHref('/tools/hash') as Pathname)}>{m.tool_hash_title()}</a>
			</li>
			<li>
				<a class='inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground'
					href={resolve(localizeHref('/tools/hmac') as Pathname)}>{m.tool_hmac_title()}</a>
			</li>
			<li>
				<a class='inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground'
					href={resolve(localizeHref('/tools/cipher') as Pathname)}>{m.tool_cipher_title()}</a>
			</li>
		</ul>
	</section>

	<p class='mt-12 text-center text-xs text-muted/60'>{m.tools_privacy_note()}</p>
</section> 