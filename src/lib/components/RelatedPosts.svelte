<script lang='ts'>
	import type { BlogPost } from '$lib/blog/types';
	import BlogCard from './BlogCard.svelte';
	import { m } from '$lib/paraglide/messages';

	let { posts }: { posts: BlogPost[] } = $props();
</script>

{#if posts.length}
	<section class='mx-auto max-w-5xl px-4 pt-8 sm:px-6'>
		<h2
			class='mb-6 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl'
		>
			{m.blog_related()}
		</h2>
		<ul class='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
			{#each posts as post (post.slug)}
				<li class='h-full'>
					<BlogCard {post} />
				</li>
			{/each}
		</ul>
	</section>
{/if}