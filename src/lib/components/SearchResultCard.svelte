<script lang='ts'>
	import type { SearchResult } from '$lib/blog/types';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	let { post }: { post: SearchResult } = $props();

	const href = $derived(resolve(localizeHref(`/blog/${post.slug}`) as Pathname));

	const localeMap: Record<string, string> = { ru: 'ru-RU', de: 'de-DE', en: 'en-US' };
	const dateFmt = $derived(
		new Date(post.date).toLocaleDateString(localeMap[post.lang] ?? 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);
</script>

<article
	class='group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/40 sm:p-6'
>
	<div class='mb-2 flex flex-wrap items-center gap-2 text-xs text-muted'>
		<time datetime={post.date} class='font-mono'>{dateFmt}</time>
		<span class='opacity-50'>·</span>
		<span>{post.readingTime} min</span>
	</div>

	<h3 class='text-base font-semibold text-foreground sm:text-lg'>
		<a href={href} class='transition-colors hover:text-accent'>
			{post.title}
		</a>
	</h3>

	<p class='mt-2 line-clamp-3 text-sm leading-relaxed text-muted'>
		{post.excerpt}
	</p>
</article>