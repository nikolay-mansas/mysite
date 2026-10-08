<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Work from '$lib/components/Work.svelte';
	import About from '$lib/components/About.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Experience from '$lib/components/Experience.svelte';
	import { SITE, PROJECTS, SOCIALS } from '$lib/config';
	import { m } from '$lib/paraglide/messages';

	let jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Person',
			name: m.hero_name(),
			jobTitle: m.hero_role(),
			description: m.meta_description(),
			url: SITE.url,
			knowsAbout: PROJECTS.flatMap((p) => p.tags),
			sameAs: SOCIALS.map(s => s.url).filter(url => !url.startsWith('mailto:')),
			worksFor: {
				'@type': 'Organization',
				name: 'Freelance / Self-employed'
			}
		})
	);
	const scriptClose = '</scr' + 'ipt>';
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}${scriptClose}`}
</svelte:head>

<Hero />
<Work />
<About />
<Skills />
<Experience />
<Contact />
