<script lang="ts">
	import { PROJECTS } from '$lib/config';
	import { m } from '$lib/paraglide/messages';
	import ProjectCard from './ProjectCard.svelte';
</script>

<section id="work" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6">
	<div class="mb-10 max-w-2xl">
		<h2 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.work_heading()}
		</h2>
		<p class="mt-3 text-pretty leading-relaxed text-muted">
			{m.work_subheading()}
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each PROJECTS as project (project.id)}
			<ProjectCard {project} />
		{/each}
	</div>
</section>
