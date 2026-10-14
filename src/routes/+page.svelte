<script lang='ts'>
	import Hero from '$lib/components/Hero.svelte';
	import Work from '$lib/components/Work.svelte';
	import About from '$lib/components/About.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Experience from '$lib/components/Experience.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Services from '$lib/components/ServiceCta.svelte';
	import { SITE, PROJECTS, SOCIALS } from '$lib/config';
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	let jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
			'@type': 'WebSite',
			'@id': `${SITE.url}/#website`,
			url: SITE.url,
			name: 'Kira — Backend Python Developer',
			inLanguage: urls.isRu ? 'ru-RU' : 'en-US',
			potentialAction: {
				'@type': 'SearchAction',
				target: `${SITE.url}/blog?q={search_term_string}`,
				'query-input': 'required name=search_term_string'
			}
			},
			{
			'@type': 'ProfilePage',
			'@id': urls.canonical,
			url: urls.canonical,
			name: m.meta_title(),
			description: m.meta_description(),
			inLanguage: urls.isRu ? 'ru-RU' : 'en-US',
			mainEntity: {
				'@type': 'Person',
				name: m.hero_name(),
				jobTitle: m.hero_role(),
				description: m.meta_description(),
				url: urls.canonical,
				knowsAbout: [...new Set(PROJECTS.flatMap((p) => p.tags ?? []))],
				sameAs: SOCIALS.map((s) => s.url).filter((u) => !u.startsWith('mailto:')),
				worksFor: {
				'@type': 'Organization',
				name: 'Freelance / Self-employed'
				}
			}
			}
		]
	});
</script>

<SeoHead
	title={m.meta_title()}
	description={m.meta_description()}
	keywords={SITE.keywords}
	jsonLd={jsonLd}
/>

<Hero />
<Services />
<Work />
<About />
<Skills />
<Experience />
<Contact />
