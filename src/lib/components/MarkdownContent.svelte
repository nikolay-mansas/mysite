<script lang='ts'>
	let {
		html,
		copyLabel = 'Copy',
		copiedLabel = 'Copied!',
		copyAriaLabel = 'Copy code'
	}: {
		html: string;
		copyLabel?: string;
		copiedLabel?: string;
		copyAriaLabel?: string;
	} = $props();

	let container = $state<HTMLDivElement | null>(null);

	const ICON_COPY = `<svg class="md-copy-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
	const ICON_CHECK = `<svg class="md-check-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

	async function copyText(text: string): Promise<boolean> {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
				return true;
			}
		} catch {
			/* fall through to legacy path */
		}
		try {
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.setAttribute('readonly', '');
			ta.style.position = 'fixed';
			ta.style.top = '-1000px';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			const ok = document.execCommand('copy');
			document.body.removeChild(ta);
			return ok;
		} catch {
			return false;
		}
	}

	$effect(() => {
		const el = container;
		const raw = html;
		if (!el || !raw) return;

		const cleanups: Array<() => void> = [];

		el.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
			if (pre.parentElement?.classList.contains('md-code-wrapper')) return;

			const wrapper = document.createElement('div');
			wrapper.className = 'md-code-wrapper';
			const lang = pre.getAttribute('data-lang');
			if (lang) wrapper.setAttribute('data-lang', lang);

			pre.parentNode?.insertBefore(wrapper, pre);
			wrapper.appendChild(pre);

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'md-copy-btn';
			btn.setAttribute('aria-label', copyAriaLabel);
			btn.setAttribute('title', copyAriaLabel);
			btn.innerHTML = `${ICON_COPY}${ICON_CHECK}<span class="md-copy-label">${copyLabel}</span>`;

			let timer: number | undefined;

			const onClick = async () => {
				const code = pre.querySelector('code');
				if (!code) return;
				const ok = await copyText(code.textContent ?? '');
				if (!ok) return;

				btn.classList.add('copied');
				const label = btn.querySelector<HTMLSpanElement>('.md-copy-label');
				if (label) label.textContent = copiedLabel;

				if (timer) window.clearTimeout(timer);
				timer = window.setTimeout(() => {
					btn.classList.remove('copied');
					if (label) label.textContent = copyLabel;
				}, 1800);
			};

			btn.addEventListener('click', onClick);
			wrapper.appendChild(btn);

			cleanups.push(() => {
				if (timer) window.clearTimeout(timer);
				btn.removeEventListener('click', onClick);
				btn.remove();
				if (wrapper.parentNode && pre.parentNode === wrapper) {
					wrapper.parentNode.insertBefore(pre, wrapper);
					wrapper.remove();
				}
			});
		});

		return () => {
			for (const fn of cleanups) fn();
		};
	});
</script>

<div class='md-content' bind:this={container}>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html html}
</div>

<style>
	.md-content {
		color: var(--color-muted);
		font-size: 1rem;
		line-height: 1.75;
		word-break: break-word;
	}

	.md-content :global(h1),
	.md-content :global(h2),
	.md-content :global(h3),
	.md-content :global(h4) {
		color: var(--color-foreground);
		font-weight: 700;
		letter-spacing: -0.01em;
		scroll-margin-top: 5rem;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}
	.md-content :global(h1) { font-size: 1.75rem; }
	.md-content :global(h2) { font-size: 1.4rem; }
	.md-content :global(h3) { font-size: 1.2rem; }
	.md-content :global(h4) { font-size: 1.05rem; }

	.md-content :global(p) {
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	.md-content :global(a) {
		color: var(--color-accent);
		text-decoration: underline;
		text-decoration-color: color-mix(in oklab, var(--color-accent) 40%, transparent);
		text-underline-offset: 3px;
		transition: text-decoration-color 0.15s ease;
	}
	.md-content :global(a:hover) {
		text-decoration-color: var(--color-accent);
	}

	.md-content :global(strong) { color: var(--color-foreground); font-weight: 600; }
	.md-content :global(em) { font-style: italic; }
	.md-content :global(del) { opacity: 0.6; }

	.md-content :global(ul),
	.md-content :global(ol) {
		margin: 1rem 0;
		padding-left: 1.25rem;
	}
	.md-content :global(ul) { list-style: disc; }
	.md-content :global(ol) { list-style: decimal; }
	.md-content :global(li) { margin: 0.35rem 0; }
	.md-content :global(li::marker) { color: var(--color-muted); }

	.md-content :global(blockquote) {
		border-left: 3px solid var(--color-accent);
		background-color: var(--color-surface);
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		color: var(--color-foreground);
		font-style: italic;
		margin: 1.25rem 0;
	}

	.md-content :global(hr) {
		border: 0;
		border-top: 1px solid var(--color-border);
		margin: 2rem 0;
	}

	.md-content :global(:not(pre) > code) {
		background-color: var(--color-surface-hover);
		color: var(--color-foreground);
		padding: 0.125rem 0.375rem;
		border-radius: 0.375rem;
		font-size: 0.875em;
		font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
	}

	.md-content :global(.md-code-wrapper) {
		position: relative;
		margin: 1.25rem 0;
	}

	.md-content :global(.md-code-wrapper[data-lang]::before) {
		content: attr(data-lang);
		position: absolute;
		top: 0.6rem;
		left: 0.85rem;
		z-index: 1;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
		opacity: 0.75;
		pointer-events: none;
		user-select: none;
	}

	.md-content :global(pre) {
		position: relative;
		background-color: var(--color-surface-hover);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 2.25rem 1.25rem 1rem;
		margin: 0;
		overflow-x: auto;
		font-size: 0.8125rem;
		line-height: 1.6;
		-webkit-overflow-scrolling: touch;
	}
	.md-content :global(pre code) {
		color: var(--color-foreground);
		font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
		font-size: inherit;
		background: none;
		padding: 0;
	}

	.md-content :global(.md-copy-btn) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.6rem;
		border-radius: 0.375rem;
		border: 1px solid var(--color-border);
		background-color: color-mix(in oklab, var(--color-surface) 85%, transparent);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		color: var(--color-muted);
		font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
		font-size: 0.7rem;
		font-weight: 500;
		line-height: 1;
		cursor: pointer;
		opacity: 0.85;
		transition:
			opacity 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease,
			background-color 0.15s ease,
			transform 0.05s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.md-content :global(.md-copy-btn:hover),
	.md-content :global(.md-copy-btn:focus-visible) {
		opacity: 1;
		color: var(--color-foreground);
		border-color: var(--color-accent);
		outline: none;
	}

	.md-content :global(.md-copy-btn:active) {
		transform: scale(0.97);
	}

	.md-content :global(.md-copy-btn.copied) {
		opacity: 1;
		color: var(--color-accent);
		border-color: var(--color-accent);
		background-color: color-mix(in oklab, var(--color-accent) 12%, var(--color-surface));
	}

	.md-content :global(.md-copy-btn .md-check-icon) { display: none; }
	.md-content :global(.md-copy-btn.copied .md-copy-icon) { display: none; }
	.md-content :global(.md-copy-btn.copied .md-check-icon) { display: inline-block; }

	@media (max-width: 480px) {
		.md-content :global(.md-copy-btn) {
			padding: 0.4rem;
		}
		.md-content :global(.md-copy-label) {
			display: none;
		}
	}

	.md-content :global(img) {
		display: block;
		max-width: 100%;
		height: auto;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		margin: 1.5rem 0;
	}
</style>