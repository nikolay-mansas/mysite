<script lang='ts'>
	import { m } from '$lib/paraglide/messages';
	import {
		toHex,
		hexToBytes,
		nobleHmac,
		computeHmacSync,
		computeHmacAsync,
		sha224,
		sha256,
		sha384,
		sha512,
		sha3_224,
		sha3_256,
		sha3_384,
		sha3_512,
		blake2b,
		blake2s,
		ripemd160,
		sha1,
		md5
	} from '$lib/hashes';
	import { streebog256, streebog512 } from '@li0ard/gost';
	import { sm3, whirlpool } from 'hash-wasm';
	import CopyButton from './CopyButton.svelte';

	const te = new TextEncoder();

	const algoKeys = [
		'HMAC-SHA-256',
		'HMAC-SHA-512',
		'HMAC-SHA-384',
		'HMAC-SHA-224',
		'HMAC-SHA3-256',
		'HMAC-SHA3-512',
		'HMAC-SHA3-384',
		'HMAC-SHA3-224',
		'HMAC-BLAKE2b-512',
		'HMAC-BLAKE2b-256',
		'HMAC-BLAKE2s-256',
		'HMAC-MD5',
		'HMAC-SHA-1',
		'HMAC-RIPEMD-160',
		'HMAC-Streebog-256',
		'HMAC-Streebog-512',
		'HMAC-SM3',
		'HMAC-Whirlpool'
	];

	interface Props {
		initialInput?: string;
		initialKey?: string;
	}

	let {
		initialInput = 'Hello, world!',
		initialKey = 'secret'
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let hmacInput = $state(initialInput);
	// svelte-ignore state_referenced_locally
	let hmacKey = $state(initialKey);
	let results = $state<Record<string, string>>({});
	let busy = $state(false);
	let copiedKey = $state<string | null>(null);

	async function calculateAll(input: string, key: string): Promise<Record<string, string>> {
		const out: Record<string, string> = {};
		const keyBytes = te.encode(key);
		const dataBytes = te.encode(input);

		out['HMAC-SHA-256'] = toHex(nobleHmac(sha256, keyBytes, dataBytes));
		out['HMAC-SHA-512'] = toHex(nobleHmac(sha512, keyBytes, dataBytes));
		out['HMAC-SHA-384'] = toHex(nobleHmac(sha384, keyBytes, dataBytes));
		out['HMAC-SHA-224'] = toHex(nobleHmac(sha224, keyBytes, dataBytes));

		out['HMAC-SHA3-256'] = toHex(nobleHmac(sha3_256, keyBytes, dataBytes));
		out['HMAC-SHA3-512'] = toHex(nobleHmac(sha3_512, keyBytes, dataBytes));
		out['HMAC-SHA3-384'] = toHex(nobleHmac(sha3_384, keyBytes, dataBytes));
		out['HMAC-SHA3-224'] = toHex(nobleHmac(sha3_224, keyBytes, dataBytes));

		out['HMAC-BLAKE2b-512'] = toHex(
			computeHmacSync((b) => blake2b(b, { dkLen: 64 }), 128, keyBytes, dataBytes)
		);
		out['HMAC-BLAKE2b-256'] = toHex(
			computeHmacSync((b) => blake2b(b, { dkLen: 32 }), 128, keyBytes, dataBytes)
		);
		out['HMAC-BLAKE2s-256'] = toHex(
			computeHmacSync((b) => blake2s(b, { dkLen: 32 }), 64, keyBytes, dataBytes)
		);

		out['HMAC-MD5'] = toHex(nobleHmac(md5, keyBytes, dataBytes));
		out['HMAC-SHA-1'] = toHex(nobleHmac(sha1, keyBytes, dataBytes));
		out['HMAC-RIPEMD-160'] = toHex(nobleHmac(ripemd160, keyBytes, dataBytes));

		out['HMAC-Streebog-256'] = toHex(
			computeHmacSync(streebog256, 64, keyBytes, dataBytes)
		);
		out['HMAC-Streebog-512'] = toHex(
			computeHmacSync(streebog512, 64, keyBytes, dataBytes)
		);
		out['HMAC-SM3'] = toHex(
			await computeHmacAsync(
				async (b) => hexToBytes(await sm3(b)),
				64,
				keyBytes,
				dataBytes
			)
		);
		out['HMAC-Whirlpool'] = toHex(
			await computeHmacAsync(
				async (b) => hexToBytes(await whirlpool(b)),
				64,
				keyBytes,
				dataBytes
			)
		);

		return out;
	}

	async function compute() {
		busy = true;
		try {
			results = await calculateAll(hmacInput, hmacKey);
		} catch (e) {
			results = { __error: String((e as Error).message ?? e) };
		} finally {
			busy = false;
		}
	}

	$effect(() => {
		const currentInput = hmacInput;
		const currentKey = hmacKey;
		let cancelled = false;

		const timer = setTimeout(async () => {
			if (cancelled) return;
			try {
				const computed = await calculateAll(currentInput, currentKey);
				if (!cancelled) results = computed;
			} catch (e) {
				if (!cancelled) results = { __error: String((e as Error).message ?? e) };
			}
		}, 120);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});

	async function copy(text: string, key: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedKey = key;
			setTimeout(() => {
				if (copiedKey === key) copiedKey = null;
			}, 1200);
		} catch {
			/* clipboard blocked */
		}
	}

	function clearAll() {
		hmacInput = '';
		hmacKey = '';
		results = {};
	}

	async function copyAll() {
		const lines = algoKeys
			.filter((k) => results[k])
			.map((k) => `${k}: ${results[k]}`)
			.join('\n');
		await copy(lines, 'all');
	}
</script>

<div class='rounded-2xl border border-border bg-surface p-5 sm:p-6'>
	<div class='grid grid-cols-1 gap-4 md:grid-cols-2'>
		<div>
			<div class='mb-2 flex items-center justify-between'>
				<label
					for='hmac-input'
					class='block text-xs font-medium uppercase tracking-widest text-muted/70'
				>
					{m.tools_input()}
				</label>
				{#if hmacInput}
					<button
						type='button'
						class='text-[11px] text-muted transition-colors hover:text-foreground'
						onclick={() => copy(hmacInput, '__in')}
					>
						{copiedKey === '__in' ? m.tools_copied() : m.tools_copy()}
					</button>
				{/if}
			</div>
			<textarea
				id='hmac-input'
				bind:value={hmacInput}
				rows='4'
				spellcheck='false'
				autocapitalize='off'
				placeholder='Message to authenticate...'
				class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'
			></textarea>
		</div>

		<div>
			<div class='mb-2 flex items-center justify-between'>
				<label
					for='hmac-key'
					class='block text-xs font-medium uppercase tracking-widest text-muted/70'
				>
					{m.tools_key()}
				</label>
				{#if hmacKey}
					<button
						type='button'
						class='text-[11px] text-muted transition-colors hover:text-foreground'
						onclick={() => copy(hmacKey, '__key')}
					>
						{copiedKey === '__key' ? m.tools_copied() : m.tools_copy()}
					</button>
				{/if}
			</div>
			<textarea
				id='hmac-key'
				bind:value={hmacKey}
				rows='4'
				spellcheck='false'
				autocapitalize='off'
				placeholder='Secret key...'
				class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'
			></textarea>
			<p class='mt-2 text-[11px] text-muted/60'>
				{m.hmac_key_hint()}
			</p>
		</div>
	</div>

	<div class='mt-4 flex flex-wrap gap-2'>
		<button
			type='button'
			disabled={busy}
			class='rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50'
			onclick={compute}
		>
			{busy ? m.hmac_computing() : m.tools_recompute()}
		</button>

		{#if Object.keys(results).length > 0 && !results['__error']}
			<button
				type='button'
				class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40'
				onclick={copyAll}
			>
				{copiedKey === 'all' ? m.tools_copied() : m.tools_copy_all()}
			</button>
		{/if}

		{#if hmacInput || hmacKey}
			<button
				type='button'
				class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				onclick={clearAll}
			>
				{m.tools_clear()}
			</button>
		{/if}
	</div>

	<div class='mt-6 space-y-2'>
		{#each algoKeys as keyName (keyName)}
			<div class='flex items-start gap-3 rounded-lg border border-border bg-surface-hover px-3 py-2'>
				<span class='w-40 shrink-0 pt-0.5 font-mono text-[11px] font-semibold uppercase text-accent'>
					{keyName}
				</span>
				<code class='flex-1 break-all font-mono text-xs text-foreground/80'>
					{results[keyName] ?? '—'}
				</code>
				{#if results[keyName]}
					<CopyButton
						text={results[keyName]}
						{keyName}
						{copiedKey}
					/>
				{/if}
			</div>
		{/each}

		{#if results['__error']}
			<p class='break-all font-mono text-xs text-red-400' role='alert'>{results['__error']}</p>
		{/if}
	</div>
</div>