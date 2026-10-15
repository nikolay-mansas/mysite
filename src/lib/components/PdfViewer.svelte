<script lang='ts'>
	import { m } from '$lib/paraglide/messages';

	let {
		src,
		title,
		downloadName
	}: {
		src: string;
		title: string;
		downloadName?: string;
	} = $props();

	let downloading = $state(false);
	let downloadError = $state(false);

	async function handleDownload(event: MouseEvent) {
		event.preventDefault();
		if (downloading) return;

		downloading = true;
		downloadError = false;

		try {
			const response = await fetch(src, { mode: 'cors' });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = downloadName ?? 'document.pdf';
			a.rel = 'noopener';
			document.body.appendChild(a);
			a.click();
			a.remove();

			setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
		} catch {
			downloadError = true;
			window.open(src, '_blank', 'noopener,noreferrer');
		} finally {
			downloading = false;
		}
	}
</script>

<div class='overflow-hidden rounded-2xl border border-border bg-surface'>
	<div
		class='flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5'
	>
		<h2 class='text-sm font-semibold tracking-tight text-foreground sm:text-base'>
			{title}
		</h2>

		<div class='flex items-center gap-2'>
			<a
				href={src}
				target='_blank'
				rel='external noopener noreferrer'
				class='inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'
			>
				<svg class='h-3.5 w-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>
					<path d='M7 17 17 7M7 7h10v10' />
				</svg>
				{m.pdf_open()}
			</a>

			<button
				type='button'
				onclick={handleDownload}
				disabled={downloading}
				class='inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-wait disabled:opacity-60'
			>
				{#if downloading}
					<svg
						class='h-3.5 w-3.5 animate-spin'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						stroke-width='2'
						stroke-linecap='round'
						stroke-linejoin='round'
						aria-hidden='true'
					>
						<path d='M21 12a9 9 0 1 1-6.22-8.56' />
					</svg>
				{:else}
					<svg class='h-3.5 w-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>
						<path d='M12 3v12m0 0-4-4m4 4 4-4M5 21h14' />
					</svg>
				{/if}
				{m.pdf_download()}
			</button>
		</div>
	</div>

	{#if downloadError}
		<p class='border-b border-border/60 bg-surface-hover/40 px-4 py-2 text-xs text-muted sm:px-5'>
			{m.pdf_download_fallback()}
		</p>
	{/if}

	<div class='relative bg-surface-hover'>
		<iframe
			{src}
			{title}
			class='h-[75vh] min-h-480px w-full border-0 sm:h-[80vh]'
			loading='lazy'
		></iframe>

		<noscript>
			<div class='p-6 text-sm text-muted'>
				{m.pdf_fallback()}
				<a href={src} class='text-accent underline' rel='external noopener noreferrer'>{m.pdf_open()}</a>.
			</div>
		</noscript>
	</div>

	<div class='border-t border-border/60 p-4 sm:hidden'>
		<p class='text-xs leading-relaxed text-muted'>
			{m.pdf_mobile_hint()}
		</p>
		<a
			href={src}
			target='_blank'
			rel='external noopener noreferrer'
			class='mt-3 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90'
		>
			{m.pdf_open()}
		</a>
	</div>
</div>