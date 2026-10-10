<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Work from '$lib/components/Work.svelte';
	import About from '$lib/components/About.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Experience from '$lib/components/Experience.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { SITE, PROJECTS, SOCIALS } from '$lib/config';
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { buildSeoUrls } from '$lib/seo';

	let urls = $derived(buildSeoUrls(page.url.pathname));

	let jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: m.hero_name(),
		jobTitle: m.hero_role(),
		description: m.meta_description(),
		url: urls.canonical,
		knowsAbout: PROJECTS.flatMap((p) => p.tags),
		sameAs: SOCIALS.map((s) => s.url).filter((u) => !u.startsWith('mailto:')),
		worksFor: { '@type': 'Organization', name: 'Freelance / Self-employed' }
	});
</script>

<SeoHead
	title={m.meta_title()}
	description={m.meta_description()}
	keywords={SITE.keywords}
	jsonLd={jsonLd}
/>

<Hero />
<Work />
<About />
<Skills />
<Experience />
<Contact />
