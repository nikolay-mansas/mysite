<script lang='ts'>
	import { m } from '$lib/paraglide/messages';
</script>

<section id='about' class='mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6'>
	<div class='rounded-2xl border border-border bg-surface p-6 sm:p-10'>
		<h2 class='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
			{m.about_heading()}
		</h2>
		<p class='mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted'>
			{m.about_body()}
		</p>
	</div>
</section>
