<script lang='ts'>
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import {
		hashPassword,
		type PasswordAlgoId,
		type PasswordOptions
	} from '$lib/password-hashes';
	import CopyButton from './CopyButton.svelte';

	interface Props {
		defaultAlgo?: PasswordAlgoId;
		initialPassword?: string;
	}
	let { defaultAlgo = 'bcrypt', initialPassword = 'correct horse battery staple' }: Props = $props();

	const algoDefaults: Record<PasswordAlgoId, Partial<PasswordOptions>> = {
		'argon2id': { memory: 65536, iterations: 3, parallelism: 1, hashLength: 32 },
		'bcrypt': { cost: 10 },
		'scrypt': { N: 16384, r: 8, p: 1, hashLength: 32 },
		'pbkdf2-sha256': { iterations: 600000, hashLength: 32 },
		'pbkdf2-sha512': { iterations: 600000, hashLength: 32 },
		'sha256crypt': { rounds: 5000 },
		'sha512crypt': { rounds: 5000 },
		'phpass': { iterations: 8192 },
		'scram-sha-256': { iterations: 4096 },
		'cram-sha-1': {},
		'ntlm': {},
		'md5crypt': {},
		'apr1': {},
		'caching-sha2-password': {},
		'mysql-native-password': {}
	};

	const groups: { label: string; items: { id: PasswordAlgoId; label: string; hint: string }[] }[] = [
		{
			label: m.pwd_group_kdf(),
			items: [
				{ id: 'argon2id', label: 'Argon2id', hint: 'Memory-hard (RFC 9106)' },
				{ id: 'bcrypt', label: 'bcrypt ($2a$)', hint: 'Blowfish-based cost factor' },
				{ id: 'scrypt', label: 'scrypt (RFC 7914)', hint: 'N/r/p parameters' },
				{ id: 'pbkdf2-sha256', label: 'PBKDF2-HMAC-SHA-256', hint: 'NIST SP 800-132' },
				{ id: 'pbkdf2-sha512', label: 'PBKDF2-HMAC-SHA-512', hint: 'NIST SP 800-132' }
			]
		},
		{
			label: m.pwd_group_unix(),
			items: [
				{ id: 'sha512crypt', label: 'SHA-512crypt ($6$)', hint: 'glibc / Linux /etc/shadow' },
				{ id: 'sha256crypt', label: 'SHA-256crypt ($5$)', hint: 'glibc / Linux /etc/shadow' },
				{ id: 'md5crypt', label: 'MD5crypt ($1$)', hint: 'Legacy BSD / FreeBSD' },
				{ id: 'apr1', label: 'Apache MD5 ($apr1$)', hint: 'htpasswd -m' },
				{ id: 'phpass', label: 'phpass ($P$)', hint: 'phpBB2 / WordPress (legacy)' }
			]
		},
		{
			label: m.pwd_group_auth(),
			items: [
				{ id: 'ntlm', label: 'NTLM', hint: 'MD4 of UTF-16LE (Windows)' },
				{ id: 'scram-sha-256', label: 'SCRAM-SHA-256', hint: 'PostgreSQL / SASL storage' },
				{ id: 'cram-sha-1', label: 'CRAM-SHA-1', hint: 'HMAC-SHA-1 challenge response' },
				{ id: 'caching-sha2-password', label: 'MySQL caching_sha2_password', hint: 'MySQL 8+ default' },
				{ id: 'mysql-native-password', label: 'MySQL mysql_native_password', hint: 'SHA1-based' }
			]
		}
	];

	let algoId = $state<PasswordAlgoId>(untrack(() => defaultAlgo));
	let password = $state(untrack(() => initialPassword));
	let salt = $state('');
	let cost = $state(10);
	let memory = $state(65536);
	let iterations = $state(3);
	let parallelism = $state(1);
	let hashLength = $state(32);
	let N = $state(16384);
	let r = $state(8);
	let p = $state(1);
	let rounds = $state(5000);
	let challenge = $state('');
	let busy = $state(false);
	let output = $state('');
	let error = $state('');
	let copiedKey = $state<string | null>(null);

	const opts: PasswordOptions = $derived({
		salt: salt.trim() || undefined,
		cost,
		memory,
		iterations,
		parallelism,
		hashLength,
		N,
		r,
		p,
		rounds,
		challenge
	} as PasswordOptions);

	const showSalt = $derived(
		['bcrypt', 'argon2id', 'scrypt', 'pbkdf2-sha256', 'pbkdf2-sha512', 'md5crypt',
		'sha256crypt', 'sha512crypt', 'apr1', 'phpass', 'scram-sha-256'].includes(algoId)
	);
	const showChallenge = $derived(algoId === 'cram-sha-1');

	
	async function compute() {
    error = '';
    busy = true;
    try {
        if (algoId === 'cram-sha-1' && !challenge.trim()) {
            challenge = randomChallenge();
        }
        output = await hashPassword(algoId, password, opts);
		} catch (e) {
			output = '';
			error = (e as Error)?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function copy(text: string, key: string) {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copiedKey = key;
			setTimeout(() => (copiedKey === key ? (copiedKey = null) : null), 1200);
		} catch { /* clipboard blocked */ }
	}

	function randomChallenge(bytes = 24): string {
		const buf = new Uint8Array(bytes);
		crypto.getRandomValues(buf);
		return btoa(String.fromCharCode(...buf));
	}

	$effect(() => {
		const d = algoDefaults[algoId] ?? {};
		if (d.cost !== undefined) cost = d.cost;
		if (d.memory !== undefined) memory = d.memory;
		if (d.iterations !== undefined) iterations = d.iterations;
		if (d.parallelism !== undefined) parallelism = d.parallelism;
		if (d.hashLength !== undefined) hashLength = d.hashLength;
		if (d.N !== undefined) N = d.N;
		if (d.r !== undefined) r = d.r;
		if (d.p !== undefined) p = d.p;
		if (d.rounds !== undefined) rounds = d.rounds;
		if (algoId === 'cram-sha-1' && !challenge) {
			challenge = randomChallenge();
		}
	});
</script>

<div class='rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm'>
	<div class='grid grid-cols-1 gap-4 md:grid-cols-2'>
		<div>
			<label for='pwd-algo' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				{m.tools_algorithm()}
			</label>
			<select id='pwd-algo' bind:value={algoId}
				class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-foreground outline-none focus:border-accent/60'>
				{#each groups as g (g.label)}
					<optgroup label={g.label}>
						{#each g.items as it (it.id)}
							<option value={it.id}>{it.label}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
			<p class='mt-1 text-[11px] text-muted/60'>
				{groups.flatMap((g) => g.items).find((x) => x.id === algoId)?.hint}
			</p>
		</div>

		<div>
			<div class='mb-2 flex items-center justify-between'>
				<label for='pwd-input' class='block text-xs font-medium uppercase tracking-widest text-muted/70'>
					{m.pwd_password_label()}
				</label>
				{#if password}
					<button type='button' class='text-[11px] text-muted hover:text-foreground'
						onclick={() => copy(password, '__pw')}>
						{copiedKey === '__pw' ? m.tools_copied() : m.tools_copy()}
					</button>
				{/if}
			</div>
			<textarea id='pwd-input' bind:value={password} rows='3' spellcheck='false' autocapitalize='off'
				class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'></textarea>
		</div>
	</div>

	{#if showSalt}
		<div class='mt-4'>
			<label for='pwd-salt' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				{m.pwd_salt_label()}
			</label>
			<input id='pwd-salt' type='text' bind:value={salt} spellcheck='false'
				placeholder={m.pwd_salt_placeholder()}
				class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
		</div>
	{/if}

	{#if algoId === 'bcrypt'}
		<div class='mt-4'>
			<label for='pwd-cost' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				Cost factor (4–20)
			</label>
			<input id='pwd-cost' type='number' min='4' max='20' bind:value={cost}
				class='w-32 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
		</div>
	{:else if algoId === 'argon2id'}
		<div class='mt-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
			<label class='text-xs text-muted'>Memory (KiB)
				<input type='number' bind:value={memory} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
			<label class='text-xs text-muted'>Iterations
				<input type='number' bind:value={iterations} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
			<label class='text-xs text-muted'>Parallelism
				<input type='number' bind:value={parallelism} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
			<label class='text-xs text-muted'>Hash length (bytes)
				<input type='number' bind:value={hashLength} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
		</div>
	{:else if algoId === 'scrypt'}
		<div class='mt-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
			<label class='text-xs text-muted'>N (cost)
				<input type='number' bind:value={N} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
			<label class='text-xs text-muted'>r (blockSize)
				<input type='number' bind:value={r} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
			<label class='text-xs text-muted'>p (parallelism)
				<input type='number' bind:value={p} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
			<label class='text-xs text-muted'>dkLen
				<input type='number' bind:value={hashLength} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
		</div>
	{:else if algoId === 'pbkdf2-sha256' || algoId === 'pbkdf2-sha512'}
		<div class='mt-4 grid grid-cols-2 gap-3 md:grid-cols-3'>
			<label class='text-xs text-muted'>Iterations
				<input type='number' bind:value={iterations} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
			<label class='text-xs text-muted'>dkLen (bytes)
				<input type='number' bind:value={hashLength} class='mt-1 w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
			</label>
		</div>
	{:else if algoId === 'sha256crypt' || algoId === 'sha512crypt'}
		<div class='mt-4'>
			<label for='pwd-rounds' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				Rounds (1000–999999999)
			</label>
			<input id='pwd-rounds' type='number' min='1000' max='999999999' bind:value={rounds}
				class='w-40 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
		</div>
	{:else if algoId === 'phpass'}
		<div class='mt-4'>
			<label for='pwd-iter' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				Iterations
			</label>
			<input id='pwd-iter' type='number' min='16' max='1073741824' bind:value={iterations}
				class='w-40 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
		</div>
	{:else if algoId === 'scram-sha-256'}
		<div class='mt-4'>
			<label for='pwd-iter' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				Iterations
			</label>
			<input id='pwd-iter' type='number' min='1' bind:value={iterations}
				class='w-40 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
		</div>
	{:else if showChallenge}
		<div class='mt-4'>
			<div class='mb-2 flex items-center justify-between'>
				<label for='pwd-chal' class='block text-xs font-medium uppercase tracking-widest text-muted/70'>
					{m.pwd_challenge_label()}
				</label>
				<button type='button' class='text-[11px] text-muted hover:text-foreground'
					onclick={() => { challenge = randomChallenge(); }}>
					↻ {m.tools_generate()}
				</button>
			</div>
			<input id='pwd-chal' type='text' bind:value={challenge} spellcheck='false'
				class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60' />
		</div>
	{/if}

	<div class='mt-5 flex flex-wrap gap-2'>
		<button type='button' disabled={busy} onclick={compute}
			class='rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50'>
			{busy ? m.pwd_hashing() : m.pwd_hash_button()}
		</button>
		{#if output}
			<button type='button'
				class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40'
				onclick={() => copy(output, 'out')}>
				{copiedKey === 'out' ? m.tools_copied() : m.tools_copy()}
			</button>
			<button type='button'
				class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				onclick={() => { output = ''; error = ''; }}>
				{m.tools_clear()}
			</button>
		{/if}
	</div>

	{#if error}
		<p class='mt-3 break-all font-mono text-xs text-red-400' role='alert'>{error}</p>
	{/if}

	{#if output}
		<div class='mt-5 rounded-lg border border-border bg-surface-hover px-3 py-2'>
			<div class='mb-1 flex items-center justify-between text-xs text-muted'>
				<span class='font-semibold uppercase tracking-wider text-accent'>{m.pwd_result_label()}</span>
				<CopyButton text={output} keyName='out' {copiedKey} />
			</div>
			<code class='block select-all break-all font-mono text-xs text-foreground/90'>{output}</code>
		</div>
	{/if}
</div>