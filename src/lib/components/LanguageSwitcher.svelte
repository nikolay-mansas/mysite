<script lang="ts">
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime';

	let current = $derived(getLocale());

	const labels: Record<string, string> = { en: 'EN', ru: 'RU' };

	function choose(locale: string) {
		if (locale !== current) {
			setLocale(locale as (typeof locales)[number]);
		}
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
