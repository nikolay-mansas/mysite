<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { md5 } from 'pure-md5';
	import {
		sha3_224, sha3_256, sha3_384, sha3_512,
		keccak256, blake2b, blake2s, ripemd160,
		toHex, webDigest
	} from '$lib/hashes';
	import { xxHash32 } from 'js-xxhash';
	import { Adler32 } from '@hugoalh/adler32';
	import { whirlpool, crc32, crc64 } from 'hash-wasm';
	import { streebog256, streebog512 } from '@li0ard/gost';
	import { murmur3_32, murmur3_128, murmur2_64, murmur2_32_hex } from '@plus99/murmur-hash';
	import CopyButton from './CopyButton.svelte';

	const te = new TextEncoder();

	let hashInput = $state('Hello, world!');
	let hashResults = $state<Record<string, string>>({});
	let copiedKey = $state<string | null>(null);

	$effect(() => {
		const text = hashInput;
		let cancelled = false;
		(async () => {
			const bytes = te.encode(text);
			const out: Record<string, string> = {};
			const xxh32 = xxHash32(text, 0);
			try {
				out['MD5'] = md5(text);
				out['SHA-1'] = toHex(await webDigest('SHA-1', bytes));
				out['SHA-256'] = toHex(await webDigest('SHA-256', bytes));
				out['SHA-384'] = toHex(await webDigest('SHA-384', bytes));
				out['SHA-512'] = toHex(await webDigest('SHA-512', bytes));
				out['SHA3-224'] = toHex(sha3_224(bytes));
				out['SHA3-256'] = toHex(sha3_256(bytes));
				out['SHA3-384'] = toHex(sha3_384(bytes));
				out['SHA3-512'] = toHex(sha3_512(bytes));
				out['Keccak-256'] = toHex(keccak256(bytes));
				out['BLAKE2b-512'] = toHex(blake2b(bytes, { dkLen: 64 }));
				out['BLAKE2b-256'] = toHex(blake2b(bytes, { dkLen: 32 }));
				out['BLAKE2s-256'] = toHex(blake2s(bytes, { dkLen: 32 }));
				out['RIPEMD-160'] = toHex(ripemd160(bytes));
				out['Streebog-256'] = toHex(streebog256(bytes));
				out['Streebog-512'] = toHex(streebog512(bytes));
				out['MurmurHash3-32'] = toHex(new Uint8Array(new Uint32Array([murmur3_32(text)]).buffer));
				out['MurmurHash3-128'] = murmur3_128(text);
				out['MurmurHash2-32'] = murmur2_32_hex(text);
				out['MurmurHash2-64'] = murmur2_64(text);
				out['xxHash32'] = xxh32.toString(16).padStart(8, '0');
				out['Whirlpool'] = await whirlpool(bytes);
				out['CRC-32'] = await crc32(bytes);
				out['CRC-64'] = await crc64(bytes);
				out['Adler-32'] = new Adler32().update(text).hashHex();
			} catch (e) {	
				out['__error'] = String(e);
			}
			if (!cancelled) {
				hashResults = out;
			}
		})();
		return () => { cancelled = true; };
	});
</script>

<div class="rounded-2xl border border-border bg-surface p-5 sm:p-6">
	<label for="hash-input" class="mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70">
		{m.tools_input()}
	</label>
	<textarea
		id="hash-input"
		bind:value={hashInput}
		rows="4"
		spellcheck="false"
		class="w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60"
	></textarea>

	<div class="mt-5 space-y-2">
		{#each Object.entries(hashResults) as [name, hex] (name)}
			{#if name !== '__error'}
				<div class="flex items-start gap-3 rounded-lg border border-border bg-surface-hover px-3 py-2">
					<span class="w-28 shrink-0 pt-0.5 font-mono text-[11px] uppercase text-accent">{name}</span>
					<code class="flex-1 break-all font-mono text-xs text-foreground/80">{hex}</code>
					<CopyButton text={hex} keyName={name} copiedKey={copiedKey} />
				</div>
			{:else}
				<p class="text-sm text-red-400">{hex}</p>
			{/if}
		{/each}
	</div>
</div>