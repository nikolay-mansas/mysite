<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { md5, toHex, webDigest } from '$lib/hashes';

	type ToolTab = 'generator' | 'decoder' | 'minecraft';
	type Version = 'v4' | 'v7' | 'v1' | 'v5' | 'v3';
	type NamespaceKey = 'dns' | 'url' | 'oid' | 'x500' | 'custom';

	let activeTab = $state<ToolTab>('generator');

	const te = new TextEncoder();

	const versions: { id: Version; label: string; hint: () => string }[] = [
		{ id: 'v4', label: 'v4', hint: () => m.uuid_v4_hint() },
		{ id: 'v7', label: 'v7', hint: () => m.uuid_v7_hint() },
		{ id: 'v1', label: 'v1', hint: () => m.uuid_v1_hint() },
		{ id: 'v5', label: 'v5', hint: () => m.uuid_v5_hint() },
		{ id: 'v3', label: 'v3', hint: () => m.uuid_v3_hint() },
	];

	const NAMESPACES: Record<Exclude<NamespaceKey, 'custom'>, string> = {
		dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
		url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
		oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
		x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
	};

	// --- Generator Settings ---
	let version = $state<Version>('v4');
	let quantity = $state(5);
	let uppercase = $state(false);
	let braces = $state(false);
	let noHyphens = $state(false);

	let namespace = $state<NamespaceKey>('dns');
	let customNamespace = $state('');
	let names = $state('example.com');

	let uuids = $state<string[]>([]);
	let busy = $state(false);
	let error = $state('');
	let copiedKey = $state<string | number | null>(null);

	const isNameBased = $derived(version === 'v3' || version === 'v5');

	// --- Minecraft Generator Settings ---
	let mcUsername = $state('Steve');
	let mcResult = $state<{
		uuid: string;
		trimmed: string;
		nbt: string;
		bigInt: string;
	} | null>(null);

	// --- Decoder Settings ---
	let decodeInput = $state('33af1b9e-c4d0-47ab-9f49-a0ee4ae2c65e');
	let decodeError = $state('');
	interface DecodedUuid {
		standard: string;
		singleInteger: string;
		version: string;
		variant: string;
		minecraftNbt: string;
		contents: { label: string; value: string }[];
	}
	let decoded = $state<DecodedUuid | null>(null);

	// ---------- Formatting Helpers ----------
	function formatUuid(raw: string): string {
		let s = raw;
		if (noHyphens) s = s.replace(/-/g, '');
		if (uppercase) s = s.toUpperCase();
		if (braces) s = `{${s}}`;
		return s;
	}

	function uuidToBytes(uuid: string): Uint8Array {
		const h = uuid.replace(/[{}-]/g, '').trim().toLowerCase();
		if (h.length !== 32) throw new Error(m.uuid_err_invalid_len());
		const b = new Uint8Array(16);
		for (let i = 0; i < 16; i++) {
			b[i] = parseInt(h.substring(i * 2, i * 2 + 2), 16);
		}
		return b;
	}

	function bytesToRaw(b: Uint8Array): string {
		const h = toHex(b.subarray(0, 16));
		return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
	}

	function bytesToColonHex(b: Uint8Array, upper = true): string {
		const arr: string[] = [];
		for (let i = 0; i < b.length; i++) {
			const s = b[i].toString(16).padStart(2, '0');
			arr.push(upper ? s.toUpperCase() : s);
		}
		return arr.join(':');
	}

	function bytesToBigInt(b: Uint8Array): bigint {
		let val = 0n;
		for (let i = 0; i < 16; i++) {
			val = (val << 8n) | BigInt(b[i]);
		}
		return val;
	}

	function bytesToNbtIntArray(b: Uint8Array): string {
		const view = new DataView(b.buffer, b.byteOffset, 16);
		const i1 = view.getInt32(0, false);
		const i2 = view.getInt32(4, false);
		const i3 = view.getInt32(8, false);
		const i4 = view.getInt32(12, false);
		return `[I; ${i1}, ${i2}, ${i3}, ${i4}]`;
	}

	function applyVersionVariant(b: Uint8Array, ver: number): Uint8Array {
		b[6] = (b[6] & 0x0f) | (ver << 4);
		b[8] = (b[8] & 0x3f) | 0x80;
		return b;
	}

	// ---------- Generators ----------
	function genV4(): string {
		const b = crypto.getRandomValues(new Uint8Array(16));
		applyVersionVariant(b, 4);
		return bytesToRaw(b);
	}

	function genV7(): string {
		const b = new Uint8Array(16);
		const ms = BigInt(Date.now());
		b[0] = Number((ms >> 40n) & 0xffn);
		b[1] = Number((ms >> 32n) & 0xffn);
		b[2] = Number((ms >> 24n) & 0xffn);
		b[3] = Number((ms >> 16n) & 0xffn);
		b[4] = Number((ms >> 8n) & 0xffn);
		b[5] = Number(ms & 0xffn);
		const r = crypto.getRandomValues(new Uint8Array(10));
		b.set(r, 6);
		applyVersionVariant(b, 7);
		return bytesToRaw(b);
	}

	const GREGORIAN_OFFSET = 0x01b21dd213814000n;

	function genV1(): string {
		const now = BigInt(Date.now()) * 10000n + GREGORIAN_OFFSET;
		const timeLow = Number(now & 0xffffffffn) >>> 0;
		const timeMid = Number((now >> 32n) & 0xffffn);
		const timeHi = Number((now >> 48n) & 0x0fffn);
		const clockSeq = crypto.getRandomValues(new Uint16Array(1))[0] & 0x3fff;
		const node = crypto.getRandomValues(new Uint8Array(6));
		node[0] = (node[0] | 0x01) & 0xff;

		const b = new Uint8Array(16);
		b[0] = (timeLow >>> 24) & 0xff;
		b[1] = (timeLow >>> 16) & 0xff;
		b[2] = (timeLow >>> 8) & 0xff;
		b[3] = timeLow & 0xff;
		b[4] = (timeMid >>> 8) & 0xff;
		b[5] = timeMid & 0xff;
		b[6] = ((timeHi >>> 8) & 0x0f) | 0x10;
		b[7] = timeHi & 0xff;
		b[8] = ((clockSeq >>> 8) & 0x3f) | 0x80;
		b[9] = clockSeq & 0xff;
		b.set(node, 10);
		return bytesToRaw(b);
	}

	function getNamespaceBytes(): Uint8Array {
		const nsUuid = namespace === 'custom' ? customNamespace.trim() : NAMESPACES[namespace];
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nsUuid)) {
			throw new Error('Invalid namespace UUID (expected xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
		}
		return uuidToBytes(nsUuid);
	}

	function genV3(name: string): string {
		const ns = getNamespaceBytes();
		const nameBytes = te.encode(name);
		const buf = new Uint8Array(ns.length + nameBytes.length);
		buf.set(ns, 0);
		buf.set(nameBytes, ns.length);
		const hash = md5(buf).slice(0, 16);
		applyVersionVariant(hash, 3);
		return bytesToRaw(hash);
	}

	async function genV5(name: string): Promise<string> {
		const ns = getNamespaceBytes();
		const nameBytes = te.encode(name);
		const buf = new Uint8Array(ns.length + nameBytes.length);
		buf.set(ns, 0);
		buf.set(nameBytes, ns.length);
		const hash = (await webDigest('SHA-1', buf)).slice(0, 16);
		applyVersionVariant(hash, 5);
		return bytesToRaw(hash);
	}

	function genMinecraftOffline(username: string): {
		uuid: string;
		trimmed: string;
		nbt: string;
		bigInt: string;
	} {
		const nameBytes = te.encode(`OfflinePlayer:${username.trim()}`);
		const hash = md5(nameBytes).slice(0, 16);
		applyVersionVariant(hash, 3);
		const raw = bytesToRaw(hash);
		return {
			uuid: raw,
			trimmed: raw.replace(/-/g, ''),
			nbt: bytesToNbtIntArray(hash),
			bigInt: bytesToBigInt(hash).toString(10),
		};
	}

	// ---------- Decoder Implementation ----------
	function parseAnyUuidInput(input: string): Uint8Array {
		const trimmed = input.trim();
		if (!trimmed) throw new Error(m.uuid_dec_err_empty());

		// Minecraft NBT Int Array: [I; -123, 456, 789, 1011]
		const nbtMatch = trimmed.match(/^\[\s*I\s*;\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\]$/i);
		if (nbtMatch) {
			const buf = new ArrayBuffer(16);
			const view = new DataView(buf);
			for (let i = 0; i < 4; i++) {
				view.setInt32(i * 4, parseInt(nbtMatch[i + 1], 10), false);
			}
			return new Uint8Array(buf);
		}

		// Decimal BigInt
		if (/^\d{30,39}$/.test(trimmed)) {
			let bi = BigInt(trimmed);
			const b = new Uint8Array(16);
			for (let i = 15; i >= 0; i--) {
				b[i] = Number(bi & 0xffn);
				bi >>= 8n;
			}
			return b;
		}

		// Standard or undashed hex
		const hexClean = trimmed.replace(/[{}-]/g, '').trim();
		if (/^[0-9a-fA-F]{32}$/.test(hexClean)) {
			return uuidToBytes(hexClean);
		}

		throw new Error(m.uuid_dec_err_unrecognized());
	}

	function runDecoder() {
		decodeError = '';
		decoded = null;
		try {
			const b = parseAnyUuidInput(decodeInput);
			const standard = bytesToRaw(b);
			const singleInteger = bytesToBigInt(b).toString(10);
			const minecraftNbt = bytesToNbtIntArray(b);

			const verNum = (b[6] >> 4) & 0x0f;
			let versionStr = `${verNum}`;
			switch (verNum) {
				case 1:
					versionStr = m.uuid_dec_ver_1();
					break;
				case 2:
					versionStr = m.uuid_dec_ver_2();
					break;
				case 3:
					versionStr = m.uuid_dec_ver_3();
					break;
				case 4:
					versionStr = m.uuid_dec_ver_4();
					break;
				case 5:
					versionStr = m.uuid_dec_ver_5();
					break;
				case 6:
					versionStr = m.uuid_dec_ver_6();
					break;
				case 7:
					versionStr = m.uuid_dec_ver_7();
					break;
				case 8:
					versionStr = m.uuid_dec_ver_8();
					break;
				default:
					versionStr = `${verNum} (${m.uuid_dec_ver_unknown()})`;
			}

			const vByte = b[8];
			let variantStr = m.uuid_dec_variant_dce();
			if ((vByte & 0x80) === 0) {
				variantStr = m.uuid_dec_variant_ncs();
			} else if ((vByte & 0xc0) === 0x80) {
				variantStr = m.uuid_dec_variant_dce();
			} else if ((vByte & 0xe0) === 0xc0) {
				variantStr = m.uuid_dec_variant_ms();
			} else {
				variantStr = m.uuid_dec_variant_reserved();
			}

			const contents: { label: string; value: string }[] = [];

			if (verNum === 1) {
				const timeLow = (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
				const timeMid = (b[4] << 8) | b[5];
				const timeHi = ((b[6] & 0x0f) << 8) | b[7];
				const timestamp =
					(BigInt(timeHi) << 48n) | (BigInt(timeMid) << 32n) | BigInt(timeLow >>> 0);
				const unix100Ns = timestamp - GREGORIAN_OFFSET;
				const unixMs = Number(unix100Ns / 10000n);
				const remainderFrac = (unix100Ns % 10000n).toString().padStart(4, '0');
				const d = new Date(unixMs);

				let timeFormatted = 'Invalid Date';
				if (!Number.isNaN(d.getTime())) {
					const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
					const y = d.getUTCFullYear();
					const mon = pad(d.getUTCMonth() + 1);
					const day = pad(d.getUTCDate());
					const h = pad(d.getUTCHours());
					const min = pad(d.getUTCMinutes());
					const s = pad(d.getUTCSeconds());
					const ms = pad(d.getUTCMilliseconds(), 3);
					timeFormatted = `${y}-${mon}-${day} ${h}:${min}:${s}.${ms}${remainderFrac.slice(0, 3)}.0 UTC`;
				}
				contents.push({ label: m.uuid_dec_field_time(), value: timeFormatted });

				const clockSeq = ((b[8] & 0x3f) << 8) | b[9];
				contents.push({
					label: m.uuid_dec_field_clock(),
					value: `${clockSeq} ${m.uuid_dec_sem_clock_rand()}`,
				});

				const nodeHex = bytesToColonHex(b.subarray(10, 16), false);
				const isMulticast = (b[10] & 0x01) === 1;
				contents.push({
					label: m.uuid_dec_field_node(),
					value: `${nodeHex} (${isMulticast ? m.uuid_dec_sem_node_rand() : m.uuid_dec_sem_node_unicast()})`,
				});
			} else if (verNum === 7) {
				const ms =
					(BigInt(b[0]) << 40n) |
					(BigInt(b[1]) << 32n) |
					(BigInt(b[2]) << 24n) |
					(BigInt(b[3]) << 16n) |
					(BigInt(b[4]) << 8n) |
					BigInt(b[5]);
				const d = new Date(Number(ms));
				contents.push({
					label: m.uuid_dec_field_time(),
					value: `${d.toISOString()} (Unix ms: ${ms})`,
				});
				contents.push({
					label: m.uuid_dec_field_contents(),
					value: `${bytesToColonHex(b, true)} ${m.uuid_dec_sem_v7()}`,
				});
			} else if (verNum === 4) {
				contents.push({
					label: m.uuid_dec_field_contents(),
					value: `${bytesToColonHex(b, true)} ${m.uuid_dec_sem_v4()}`,
				});
			} else if (verNum === 3 || verNum === 5) {
				contents.push({
					label: m.uuid_dec_field_contents(),
					value: `${bytesToColonHex(b, true)} ${m.uuid_dec_sem_named()}`,
				});
			} else {
				contents.push({
					label: m.uuid_dec_field_contents(),
					value: bytesToColonHex(b, true),
				});
			}

			decoded = {
				standard,
				singleInteger,
				version: versionStr,
				variant: variantStr,
				minecraftNbt,
				contents,
			};
		} catch (e) {
			decodeError = (e as Error).message || m.uuid_dec_err_unrecognized();
		}
	}

	// ---------- Actions ----------
	async function generate() {
		error = '';
		busy = true;
		try {
			const out: string[] = [];
			if (isNameBased) {
				const list = names
					.split('\n')
					.map((s) => s.trim())
					.filter(Boolean);
				if (list.length === 0) throw new Error(m.uuid_err_no_names());
				if (version === 'v3') {
					for (const n of list) out.push(formatUuid(genV3(n)));
				} else {
					for (const n of list) out.push(formatUuid(await genV5(n)));
				}
			} else {
				const n = Math.max(1, Math.min(1000, Number(quantity) || 1));
				const gen = version === 'v1' ? genV1 : version === 'v7' ? genV7 : genV4;
				for (let i = 0; i < n; i++) out.push(formatUuid(gen()));
			}
			uuids = out;
		} catch (e) {
			uuids = [];
			error = String((e as Error).message ?? e);
		} finally {
			busy = false;
		}
	}

	function generateMinecraft() {
		if (!mcUsername.trim()) {
			mcResult = null;
			return;
		}
		mcResult = genMinecraftOffline(mcUsername);
	}

	function setVersion(v: Version) {
		if (v === version) return;
		version = v;
		void generate();
	}

	function clearAll() {
		uuids = [];
		error = '';
	}

	async function copy(text: string, key: string | number) {
		if (!text) return;
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

	function download(format: 'txt' | 'json' | 'csv') {
		if (uuids.length === 0) return;
		let content: string;
		let mime: string;
		let ext: 'txt' | 'json' | 'csv';

		if (format === 'txt') {
			content = uuids.join('\n');
			mime = 'text/plain';
			ext = 'txt';
		} else if (format === 'json') {
			content = JSON.stringify(
				{ version, count: uuids.length, generatedAt: new Date().toISOString(), uuids },
				null,
				2
			);
			mime = 'application/json';
			ext = 'json';
		} else {
			content = 'uuid\n' + uuids.join('\n');
			mime = 'text/csv';
			ext = 'csv';
		}

		const blob = new Blob([content], { type: `${mime};charset=utf-8` });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `uuid-${version}-${uuids.length}-${Date.now()}.${ext}`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		void generate();
		generateMinecraft();
		runDecoder();
	});
</script>

<div class="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
	<div class="mb-6 flex border-b border-border/80">
		<button
			type="button"
			onclick={() => (activeTab = 'generator')}
			class="relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors {activeTab === 'generator'
				? 'border-b-2 border-accent font-semibold text-accent'
				: 'text-muted hover:text-foreground'}"
		>
			{m.uuid_tab_generator()}
		</button>
		<button
			type="button"
			onclick={() => {
				activeTab = 'decoder';
				runDecoder();
			}}
			class="relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors {activeTab === 'decoder'
				? 'border-b-2 border-accent font-semibold text-accent'
				: 'text-muted hover:text-foreground'}"
		>
			{m.uuid_tab_decoder()}
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'minecraft')}
			class="relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors {activeTab === 'minecraft'
				? 'border-b-2 border-accent font-semibold text-accent'
				: 'text-muted hover:text-foreground'}"
		>
			{m.uuid_tab_minecraft()}
		</button>
	</div>

	{#if activeTab === 'generator'}
		<div>
			<span class="mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70">
				{m.uuid_version_label()}
			</span>
			<div class="flex flex-wrap gap-1.5" role="radiogroup" aria-label="UUID version">
				{#each versions as v (v.id)}
					<button
						type="button"
						role="radio"
						aria-checked={version === v.id}
						onclick={() => setVersion(v.id)}
						class="rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors {version === v.id
							? 'border-accent bg-accent/10 font-semibold text-foreground'
							: 'border-border bg-surface-hover text-muted hover:text-foreground'}"
					>
						{v.label}
					</button>
				{/each}
			</div>
			<p class="mt-2 text-[12px] text-muted">
				{versions.find((v) => v.id === version)?.hint()}
			</p>
		</div>

		{#if isNameBased}
			<div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label
						for="uuid-ns"
						class="mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70"
					>
						{m.uuid_namespace_label()}
					</label>
					<select
						id="uuid-ns"
						bind:value={namespace}
						class="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground outline-none focus:border-accent/60"
					>
						<option value="dns">DNS — 6ba7b810-…</option>
						<option value="url">URL — 6ba7b811-…</option>
						<option value="oid">OID — 6ba7b812-…</option>
						<option value="x500">X.500 — 6ba7b814-…</option>
						<option value="custom">{m.uuid_custom_ns_option()}</option>
					</select>
					{#if namespace === 'custom'}
						<input
							type="text"
							bind:value={customNamespace}
							placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
							spellcheck="false"
							class="mt-2 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent/60"
						/>
					{/if}
				</div>
				<div>
					<label
						for="uuid-names"
						class="mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70"
					>
						{m.uuid_names_input_label()}
					</label>
					<textarea
						id="uuid-names"
						bind:value={names}
						rows="4"
						spellcheck="false"
						placeholder="example.com&#10;example.org&#10;user@example.com"
						class="w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60"
					></textarea>
				</div>
			</div>
		{:else}
			<div class="mt-5">
				<label
					for="uuid-qty"
					class="mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70"
				>
					{m.uuid_quantity_label()}
				</label>
				<input
					id="uuid-qty"
					type="number"
					min="1"
					max="1000"
					bind:value={quantity}
					class="w-32 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60"
				/>
			</div>
		{/if}

		<fieldset class="mt-5 flex flex-wrap gap-x-5 gap-y-2">
			<legend class="sr-only">Format</legend>
			<label class="inline-flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-foreground">
				<input type="checkbox" bind:checked={uppercase} class="accent-accent" />
				<span>{m.uuid_fmt_uppercase()}</span>
			</label>
			<label class="inline-flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-foreground">
				<input type="checkbox" bind:checked={braces} class="accent-accent" />
				<span>{m.uuid_fmt_braces()} <code class="font-mono text-xs">{'{…}'}</code></span>
			</label>
			<label class="inline-flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-foreground">
				<input type="checkbox" bind:checked={noHyphens} class="accent-accent" />
				<span>{m.uuid_fmt_no_hyphens()}</span>
			</label>
		</fieldset>

		<div class="mt-5 flex flex-wrap gap-2">
			<button
				type="button"
				disabled={busy}
				class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
				onclick={generate}
			>
				{busy ? m.uuid_btn_generating() : uuids.length ? m.uuid_btn_regenerate() : m.uuid_btn_generate()}
			</button>

			{#if uuids.length > 0}
				<button
					type="button"
					class="rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
					onclick={() => copy(uuids.join('\n'), 'all')}
				>
					{copiedKey === 'all' ? m.tools_copied() : m.uuid_btn_copy_all()}
				</button>
				<button
					type="button"
					class="rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
					onclick={() => download('txt')}
				>
					.txt
				</button>
				<button
					type="button"
					class="rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
					onclick={() => download('json')}
				>
					.json
				</button>
				<button
					type="button"
					class="rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
					onclick={() => download('csv')}
				>
					.csv
				</button>
				<button
					type="button"
					class="rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground"
					onclick={clearAll}
				>
					{m.tools_clear()}
				</button>
			{/if}
		</div>

		{#if error}
			<p class="mt-3 break-all font-mono text-xs text-red-400" role="alert">{error}</p>
		{/if}

		{#if uuids.length > 0}
			<div class="mt-5">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-medium uppercase tracking-widest text-muted/70">
						{uuids.length} UUID{uuids.length === 1 ? '' : 's'}
					</span>
					<span class="font-mono text-[11px] text-muted/60">
						{version}
						{#if isNameBased}· {namespace}{/if}
						{#if uppercase}· upper{/if}
						{#if braces}· braces{/if}
						{#if noHyphens}· no-hyphens{/if}
					</span>
				</div>
				<ul class="max-h-96 space-y-1.5 overflow-y-auto pr-1">
					{#each uuids as u, i (i)}
						<li
							class="flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5"
						>
							<code class="flex-1 break-all font-mono text-xs text-foreground/80">{u}</code>
							<button
								type="button"
								class="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground"
								onclick={() => copy(u, i)}
							>
								{copiedKey === i ? m.tools_copied() : m.tools_copy()}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}

	{#if activeTab === 'decoder'}
		<div class="space-y-4">
			<div>
				<label
					for="uuid-decode-input"
					class="mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70"
				>
					{m.uuid_dec_input_label()}
				</label>
				<div class="flex gap-2">
					<input
						id="uuid-decode-input"
						type="text"
						bind:value={decodeInput}
						oninput={runDecoder}
						placeholder="33af1b9e-c4d0-47ab-9f49-a0ee4ae2c65e or [I; ...]"
						spellcheck="false"
						class="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60"
					/>
					<button
						type="button"
						onclick={runDecoder}
						class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
					>
						{m.uuid_dec_btn_inspect()}
					</button>
				</div>
				<p class="mt-1 text-[11px] text-muted/70">
					{m.uuid_dec_input_hint()}
				</p>
			</div>

			{#if decodeError}
				<p class="font-mono text-xs text-red-400" role="alert">{decodeError}</p>
			{/if}

			{#if decoded}
				<div class="mt-4 rounded-xl border border-border/80 bg-surface-hover/60 p-4">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-xs font-bold uppercase tracking-wider text-accent">
							{m.uuid_dec_results_title()}
						</span>
						<button
							type="button"
							class="text-[11px] text-muted transition-colors hover:text-foreground"
							onclick={() => copy(decoded?.standard ?? '', 'dec-all')}
						>
							{copiedKey === 'dec-all' ? m.tools_copied() : m.tools_copy()}
						</button>
					</div>

					<dl class="space-y-2.5 font-mono text-xs">
						<div class="grid grid-cols-1 gap-1 border-b border-border/40 pb-2 sm:grid-cols-3 sm:gap-4">
							<dt class="font-sans font-medium text-muted">{m.uuid_dec_field_std()}</dt>
							<dd class="col-span-2 select-all font-semibold text-foreground">{decoded.standard}</dd>
						</div>

						<div class="grid grid-cols-1 gap-1 border-b border-border/40 pb-2 sm:grid-cols-3 sm:gap-4">
							<dt class="font-sans font-medium text-muted">{m.uuid_dec_field_int()}</dt>
							<dd class="col-span-2 select-all break-all text-foreground/90">{decoded.singleInteger}</dd>
						</div>

						<div class="grid grid-cols-1 gap-1 border-b border-border/40 pb-2 sm:grid-cols-3 sm:gap-4">
							<dt class="font-sans font-medium text-muted">{m.uuid_dec_field_version()}</dt>
							<dd class="col-span-2 font-medium text-foreground">{decoded.version}</dd>
						</div>

						<div class="grid grid-cols-1 gap-1 border-b border-border/40 pb-2 sm:grid-cols-3 sm:gap-4">
							<dt class="font-sans font-medium text-muted">{m.uuid_dec_field_variant()}</dt>
							<dd class="col-span-2 text-foreground/80">{decoded.variant}</dd>
						</div>

						{#each decoded.contents as item (item.label)}
							<div class="grid grid-cols-1 gap-1 border-b border-border/40 pb-2 sm:grid-cols-3 sm:gap-4">
								<dt class="font-sans font-medium text-muted">{item.label}</dt>
								<dd class="col-span-2 break-all text-foreground/90">{item.value}</dd>
							</div>
						{/each}

						<div class="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-3 sm:gap-4">
							<dt class="font-sans font-medium text-muted">{m.uuid_dec_field_mc_nbt()}</dt>
							<dd class="col-span-2 select-all break-all text-foreground/90">{decoded.minecraftNbt}</dd>
						</div>
					</dl>
				</div>
			{/if}
		</div>
	{/if}

	{#if activeTab === 'minecraft'}
		<div class="space-y-4">
			<div>
				<label
					for="mc-nick"
					class="mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70"
				>
					{m.uuid_mc_nick_label()}
				</label>
				<div class="flex gap-2">
					<input
						id="mc-nick"
						type="text"
						bind:value={mcUsername}
						oninput={generateMinecraft}
						placeholder="Steve"
						class="flex-1 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60"
					/>
					<button
						type="button"
						onclick={generateMinecraft}
						class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
					>
						{m.uuid_btn_generate()}
					</button>
				</div>
				<p class="mt-1 text-[11px] text-muted/70">
					{m.uuid_mc_nick_hint()}
				</p>
			</div>

			{#if mcResult}
				<div class="mt-5 space-y-3 rounded-xl border border-border bg-surface-hover/50 p-4">
					<div>
						<div class="mb-1 flex items-center justify-between text-xs text-muted">
							<span>{m.uuid_mc_res_hyphenated()}</span>
							<button
								type="button"
								class="hover:text-foreground"
								onclick={() => copy(mcResult?.uuid ?? '', 'mc-uuid')}
							>
								{copiedKey === 'mc-uuid' ? m.tools_copied() : m.tools_copy()}
							</button>
						</div>
						<code class="block select-all rounded border border-border bg-surface p-2 font-mono text-xs text-foreground">
							{mcResult.uuid}
						</code>
					</div>

					<div>
						<div class="mb-1 flex items-center justify-between text-xs text-muted">
							<span>{m.uuid_mc_res_trimmed()}</span>
							<button
								type="button"
								class="hover:text-foreground"
								onclick={() => copy(mcResult?.trimmed ?? '', 'mc-trimmed')}
							>
								{copiedKey === 'mc-trimmed' ? m.tools_copied() : m.tools_copy()}
							</button>
						</div>
						<code class="block select-all rounded border border-border bg-surface p-2 font-mono text-xs text-foreground/80">
							{mcResult.trimmed}
						</code>
					</div>

					<div>
						<div class="mb-1 flex items-center justify-between text-xs text-muted">
							<span>{m.uuid_mc_res_nbt()}</span>
							<button
								type="button"
								class="hover:text-foreground"
								onclick={() => copy(mcResult?.nbt ?? '', 'mc-nbt')}
							>
								{copiedKey === 'mc-nbt' ? m.tools_copied() : m.tools_copy()}
							</button>
						</div>
						<code class="block select-all rounded border border-border bg-surface p-2 font-mono text-xs text-foreground/90">
							{mcResult.nbt}
						</code>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>