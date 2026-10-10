<script lang="ts">
	import { page } from '$app/state';
	import { getLocale, setLocale, locales, baseLocale } from '$lib/paraglide/runtime';

	type Locale = (typeof locales)[number];

	const labels: Record<Locale, string> = { en: 'EN', ru: 'RU' };

	function isLocale(value: string): value is Locale {
		return (locales as readonly string[]).includes(value);
	}

	function localeFromPath(pathname: string): Locale {
		const seg = pathname.split('/')[1] ?? '';
		return isLocale(seg) ? seg : (baseLocale as Locale);
	}

	let current = $derived.by(() => localeFromPath(page.url.pathname));

	$effect(() => {
		const target = localeFromPath(page.url.pathname);
		if (getLocale() !== target) {
			setLocale(target, { reload: false });
		}
	});

	function choose(locale: Locale) {
		if (locale === current) return;
		setLocale(locale);
	}
</script>

<div
	class="inline-flex items-center rounded-full border border-border bg-surface p-0.5"
	role="group"
	aria-label="Language"
>
	{#each locales as locale (locale)}
		<button
			type="button"
			onclick={() => choose(locale)}
			aria-pressed={current === locale}
			class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors {current === locale
				? 'bg-accent text-accent-foreground'
				: 'text-muted hover:text-foreground'}"
		>
			{labels[locale] ?? locale.toUpperCase()}
		</button>
	{/each}
</div>
