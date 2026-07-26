<script lang="ts">
	import { s3, type Project } from '$lib/config';
	import { m } from '$lib/paraglide/messages';
	import ProjectModal from './ProjectModal.svelte';	

	let { project }: { project: Project } = $props();

	let modalOpen = $state(false);
	let imageOk = $state(true);

	const t = (key: string) => (m as Record<string, () => string>)[key]?.() ?? '';

	const imageUrl = $derived(project.image ? s3(project.image) : '');
	const roleLabel = $derived(
		project.role === 'solo' ? m.work_role_solo() : m.work_role_team()
	);
</script>

<article
	class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/40"
>
	{#if imageUrl && imageOk}
		<div class="relative aspect-16/10 overflow-hidden bg-surface-hover">
			<img
				src={imageUrl}
				alt={t(project.titleKey)}
				loading="lazy"
				decoding="async"
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				onerror={() => (imageOk = false)}
			/>
		</div>
	{/if}

	<div class="flex flex-1 flex-col p-5 sm:p-6">
		<div class="mb-3 flex items-center gap-2 text-xs">
			<span
				class="rounded-full border border-border px-2 py-0.5 font-medium {project.role ===
				'solo'
					? 'text-accent'
					: 'text-muted'}"
			>
				{roleLabel}
			</span>
			<span class="font-mono text-muted">{project.year}</span>
		</div>

		<h3 class="text-lg font-semibold text-foreground">
			{t(project.titleKey)}
		</h3>

		<p class="mt-2 text-sm leading-relaxed text-muted">
			{t(project.shortKey)}
		</p>

		{#if project.tags.length}
			<ul class="mt-4 flex flex-wrap gap-1.5">
				{#each project.tags as tag (tag)}
					<li
						class="rounded-md bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-muted"
					>
						{tag}
					</li>
				{/each}
			</ul>
		{/if}

		<div class="mt-auto flex items-center gap-4 pt-5">
			<button
				type="button"
				onclick={() => (modalOpen = true)}
				aria-haspopup="dialog"
				class="inline-flex items-center gap-1 text-sm font-medium text-accent transition-opacity hover:opacity-80"
			>
				{m.work_expand()}
				<svg
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M7 17 17 7M7 7h10v10" />
				</svg>
			</button>

			{#if project.link}
				<a
					href={project.link}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
				>
					{m.work_visit()}
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M7 17 17 7M7 7h10v10" />
					</svg>
				</a>
			{/if}
		</div>
	</div>
</article>

<ProjectModal {project} open={modalOpen} onClose={() => { modalOpen = false }} />
