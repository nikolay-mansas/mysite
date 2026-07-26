<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	let { open, onClose } = $props<{ open: boolean; onClose: () => void }>();

	const techs = ['Svelte 5', 'Tailwind CSS', 'Paraglide', 'TypeScript', 'Vite', 'Git', 'CI/CD'];

	const version = import.meta.env.VITE_APP_VERSION;
    const buildTime = import.meta.env.VITE_BUILD_TIME;

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
			aria-labelledby="tech-stack-title"
			aria-describedby="tech-stack-desc"
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

			<div class="overflow-y-auto p-6 sm:p-8">
				<h2
					id="tech-stack-title"
					class="text-balance text-2xl font-bold tracking-tight text-foreground"
				>
					{m.tech_stack_title()}
				</h2>

				<p id="tech-stack-desc" class="mt-3 text-pretty leading-relaxed text-muted">
					{m.tech_stack_body()}
				</p>

				<ul class="mt-6 flex flex-wrap gap-1.5">
					{#each techs as tech (tech)}
						<li
							class="rounded-md bg-surface-hover px-2 py-0.5 font-mono text-[11px] text-muted"
						>
							{tech}
						</li>
					{/each}
				</ul>

				<div class="mt-6 border-t border-border/40 pt-4">
					<div class="flex flex-col gap-1.5 text-xs text-muted/60">
						<span class="flex items-center gap-1.5">
						<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
							<path d="M7 7h.01"/>
						</svg>
						<span class="font-medium text-muted/70">Version:</span>
						<span class="font-mono text-foreground/80">v{version}</span>
						</span>

						<span class="flex items-center gap-1.5">
						<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<polyline points="12 6 12 12 16 14"/>
						</svg>
						<span class="font-medium text-muted/70">Built:</span>
						<span>{new Date(buildTime).toLocaleString()}</span>
						</span>

						<span class="flex items-center gap-1.5">
						<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="2" y="2" width="20" height="20" rx="2.18"/>
							<line x1="8" y1="2" x2="8" y2="22"/>
							<line x1="16" y1="2" x2="16" y2="22"/>
							<line x1="2" y1="8" x2="22" y2="8"/>
							<line x1="2" y1="16" x2="22" y2="16"/>
						</svg>
						<span class="font-medium text-muted/70">Hosting:</span>
						<span>home data center</span>
						</span>

						<span class="flex items-center gap-1.5">
						<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 10a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5 5 5 0 0 0 5 5h6a5 5 0 0 0 5-5z"/>
							<path d="M6 14v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3"/>
						</svg>
						<span class="font-medium text-muted/70">CDN:</span>
						<span>self hosted s3 server</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}