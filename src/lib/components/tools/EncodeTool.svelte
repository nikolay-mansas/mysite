<script lang='ts'>
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import {
		getCodec,
		getDefaultCodec,
		hasCodec,
		listCodecs,
	} from '$lib/codecs/registry';

	const codecs = listCodecs();

	let {
		defaultCodec = 'base64',
		initialInput = 'Hello, world!',
	}: { defaultCodec?: string; initialInput?: string } = $props();

	let codecId = $state(
		untrack(() => (hasCodec(defaultCodec) ? defaultCodec : getDefaultCodec().id))
	);
	let codecInput = $state(untrack(() => initialInput));
	let codecOutput = $state('');
	let codecError = $state('');
	let copiedIn = $state(false);
	let copiedOut = $state(false);
	let liveMode = $state(false);

	const currentCodec = $derived(getCodec(codecId) ?? getDefaultCodec());
	const isSelfInverse = $derived(currentCodec.selfInverse === true);

	const inputStats = $derived({
		chars: codecInput.length,
		bytes: new TextEncoder().encode(codecInput).length,
	});
	const outputStats = $derived({
		chars: codecOutput.length,
		bytes: new TextEncoder().encode(codecOutput).length,
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		const applyHash = () => {
			const hash = window.location.hash.replace(/^#/, '').toLowerCase();
			if (hasCodec(hash) && hash !== codecId) {
				codecId = hash;
			}
		};
		applyHash();
		window.addEventListener('hashchange', applyHash);
		return () => window.removeEventListener('hashchange', applyHash);
	});

	function selectCodec(id: string) {
		codecId = id;
		if (typeof window !== 'undefined') {
			history.replaceState(null, '', `#${id}`);
		}
		if (liveMode) runEncode();
	}

	function apply(fn: (input: string) => string) {
		codecError = '';
		try {
			codecOutput = fn(codecInput);
		} catch (e) {
			codecOutput = '';
			codecError = (e as Error)?.message || m.encode_error_invalid();
		}
	}

	function runEncode() {
		apply(currentCodec.encode);
	}

	function runDecode() {
		apply(currentCodec.decode);
	}

	$effect(() => {
		if (liveMode && codecInput) {
			runEncode();
		}
	});

	function swap() {
		if (!codecOutput) return;
		codecInput = codecOutput;
		codecOutput = '';
		codecError = '';
		if (liveMode) runEncode();
	}

	function clearAll() {
		codecInput = '';
		codecOutput = '';
		codecError = '';
	}

	async function copy(text: string, target: 'in' | 'out') {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			if (target === 'in') {
				copiedIn = true;
				setTimeout(() => (copiedIn = false), 1200);
			} else {
				copiedOut = true;
				setTimeout(() => (copiedOut = false), 1200);
			}
		} catch {
			/* clipboard blocked */
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
		e.preventDefault();
		if (e.shiftKey && !isSelfInverse) runDecode();
		else runEncode();
	}
</script>

<div class='rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm'>
	<div class='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
		<div class='flex-1'>
			<label
				for='codec-select'
				class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'
			>
				{m.tools_algorithm()}
			</label>
			<select
				id='codec-select'
				value={codecId}
				onchange={(e) => selectCodec(e.currentTarget.value)}
				class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent/60'
			>
				{#each codecs as c (c.id)}
					<option value={c.id}>{c.label}</option>
				{/each}
			</select>
		</div>

		<div class='flex items-center sm:pt-6'>
			<label class='inline-flex cursor-pointer items-center gap-2 text-xs text-muted select-none'>
				<input
					type='checkbox'
					bind:checked={liveMode}
					class='rounded border-border accent-accent'
				/>
				{m.encode_live_mode()}
			</label>
		</div>
	</div>

	<div class='mt-3 flex flex-wrap gap-1.5' aria-label={m.encode_nav_jump_aria()}>
		{#each codecs as c (c.id)}
			<button
				type='button'
				onclick={() => selectCodec(c.id)}
				class='rounded-md border px-2.5 py-1 text-xs transition-colors {codecId === c.id
					? 'border-accent bg-accent/10 font-medium text-foreground'
					: 'border-border/60 text-muted hover:border-accent/40 hover:text-foreground'}'
			>
				{c.label}
			</button>
		{/each}
	</div>

	<div class='mt-6 grid grid-cols-1 gap-5 md:grid-cols-2'>
		<div>
			<div class='mb-2 flex items-center justify-between text-xs'>
				<div class='flex items-center gap-2'>
					<label
						for='codec-input'
						class='font-medium uppercase tracking-widest text-muted/70'
					>
						{m.tools_input()}
					</label>
					{#if inputStats.chars > 0}
						<span class='text-[11px] text-muted/60'>
							({inputStats.chars} {m.encode_chars_label()} / {inputStats.bytes} {m.encode_bytes_label()})
						</span>
					{/if}
				</div>
				{#if codecInput}
					<button
						type='button'
						class='text-[11px] text-muted transition-colors hover:text-foreground'
						onclick={() => copy(codecInput, 'in')}
					>
						{copiedIn ? m.tools_copied() : m.tools_copy()}
					</button>
				{/if}
			</div>
			<textarea
				id='codec-input'
				bind:value={codecInput}
				onkeydown={onKeydown}
				rows='8'
				spellcheck='false'
				autocapitalize='off'
				placeholder={m.encode_input_placeholder()}
				class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'
			></textarea>
		</div>

		<div>
			<div class='mb-2 flex items-center justify-between text-xs'>
				<div class='flex items-center gap-2'>
					<label
						for='codec-output'
						class='font-medium uppercase tracking-widest text-muted/70'
					>
						{m.tools_output()}
					</label>
					{#if outputStats.chars > 0}
						<span class='text-[11px] text-muted/60'>
							({outputStats.chars} {m.encode_chars_label()} / {outputStats.bytes} {m.encode_bytes_label()})
						</span>
					{/if}
				</div>
				{#if codecOutput}
					<button
						type='button'
						class='text-[11px] text-muted transition-colors hover:text-foreground'
						onclick={() => copy(codecOutput, 'out')}
					>
						{copiedOut ? m.tools_copied() : m.tools_copy()}
					</button>
				{/if}
			</div>
			<textarea
				id='codec-output'
				readonly
				value={codecOutput}
				rows='8'
				spellcheck='false'
				placeholder={m.encode_output_placeholder()}
				class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground/90 outline-none'
			></textarea>
		</div>
	</div>

	<div class='mt-5 flex flex-wrap items-center gap-2'>
		<button
			type='button'
			class='rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90'
			onclick={runEncode}
			title={m.tools_shortcut_encode()}
		>
			{m.tools_encode()}
		</button>

		{#if !isSelfInverse}
			<button
				type='button'
				class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40'
				onclick={runDecode}
				title={m.tools_shortcut_decode()}
			>
				{m.tools_decode()}
			</button>
		{/if}

		<button
			type='button'
			class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 disabled:opacity-40'
			onclick={swap}
			disabled={!codecOutput}
		>
			{m.tools_swap()}
		</button>

		{#if codecInput || codecOutput}
			<button
				type='button'
				class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				onclick={clearAll}
			>
				{m.tools_clear()}
			</button>
		{/if}
	</div>

	{#if codecError}
		<p class='mt-3 break-all font-mono text-xs text-red-400' role='alert'>
			{codecError}
		</p>
	{/if}

	<div class='mt-4 border-t border-border/40 pt-3 text-[11px] text-muted'>
		<p>
			{#if isSelfInverse}
				{m.tools_hint_self_inverse()}
			{:else}
				{m.tools_hint_keyboard()}
			{/if}
		</p>
	</div>
</div>