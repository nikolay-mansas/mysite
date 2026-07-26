<script lang="ts">
	import { s3, type Project } from '$lib/config';
	import { m } from '$lib/paraglide/messages';

	let { project, open, onClose } = $props<{ project: Project; open: boolean; onClose: () => void }>();

	let imageOk = $state(true);

	const t = (key: string) => (m as Record<string, () => string>)[key]?.() ?? '';

	const imageUrl = $derived(project.image ? s3(project.image) : '');
	const roleLabel = $derived(
		project.role === 'solo' ? m.work_role_solo() : m.work_role_team()
	);
	const titleId = $derived(`${project.id}-modal-title`);
	const descId = $derived(`${project.id}-modal-desc`);

	$effect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onClose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={open ? onKeydown : undefined} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
		role="presentation"
		onclick={handleBackdropClick}
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={descId}
			tabindex="-1"
			class="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
		>
			<button
				type="button"
				onclick={onClose}
				aria-label={m.work_close()}
				class="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/70 text-muted backdrop-blur transition-colors hover:text-foreground"
			>
				<svg
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>

			<div class="overflow-y-auto">
				{#if imageUrl && imageOk}
					<div class="relative aspect-video w-full overflow-hidden bg-surface-hover">
						<img
							src={imageUrl}
							alt={t(project.titleKey)}
							decoding="async"
							class="h-full w-full object-cover"
							onerror={() => (imageOk = false)}
						/>
					</div>
				{/if}

				<div class="p-6 sm:p-8">
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

					<h2
						id={titleId}
						class="text-balance text-2xl font-bold tracking-tight text-foreground"
					>
						{t(project.titleKey)}
					</h2>

					<p class="mt-3 text-pretty leading-relaxed text-muted">
						{t(project.shortKey)}
					</p>

					<div class="mt-6">
						<h3
							class="mb-2 font-mono text-xs uppercase tracking-widest text-muted/70"
						>
							{m.work_about_project()}
						</h3>
						<p id={descId} class="text-pretty leading-relaxed text-foreground/90">
							{t(project.longKey)}
						</p>
					</div>

					{#if project.tags.length}
						<ul class="mt-6 flex flex-wrap gap-1.5">
							{#each project.tags as tag (tag)}
								<li
									class="rounded-md bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-muted"
								>
									{tag}
								</li>
							{/each}
						</ul>
					{/if}

					{#if project.link}
						<a
							href={project.link}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-7 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
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
		</div>
	</div>
{/if}