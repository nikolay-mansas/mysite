<script lang='ts'>
	import { m } from '$lib/paraglide/messages';
	import {
		toHex,
		fromHex,
		deriveKeyBytes,
		aesGcmEncrypt,
		aesGcmDecrypt,
		aes512Encrypt,
		aes512Decrypt,
		chacha20Process,
		rc4,
		desCrypt,
		tripleDesCrypt,
		blockFeistelCrypt,
		rsaGenerate,
		rsaEncrypt,
		rsaDecrypt,
		ecdsaGenerate,
		ecdsaSign,
		ecdsaVerify,
		ecdhGenerate,
		ecdhDeriveSecret,
		ecdhEncrypt,
		ecdhDecrypt,
		dhGenerate,
		dhDeriveSecret,
		dhEncrypt,
		dhDecrypt,
		mlKemGenerate,
		mlKemEncrypt,
		mlKemDecrypt,
		mlDsaGenerate,
		mlDsaSign,
		mlDsaVerify,
		type MlKemParam
	} from '$lib/ciphers';
	import { caesar, vigenere, xorCipher, xorDecipher } from '$lib/codecs';

	const te = new TextEncoder();
	const td = new TextDecoder();

	type CipherId =
		| 'aes-256'
		| 'aes-192'
		| 'aes-128'
		| 'aes-512'
		| 'chacha20'
		| 'twofish'
		| 'blowfish'
		| 'serpent'
		| 'triple-des'
		| 'des'
		| 'idea'
		| 'rc4'
		| 'rc5'
		| 'rc6'
		| 'camellia'
		| 'aria'
		| 'rsa'
		| 'ecc-ecdsa'
		| 'ecdh'
		| 'diffie-hellman'
		| 'ml-kem-512'
		| 'ml-kem-768'
		| 'ml-kem-1024'
		| 'ml-dsa'
		| 'xor'
		| 'caesar'
		| 'vigenere';

	const cipherCategories = [
		{
			label: m.cipher_cat_modern(),
			options: [
				{ id: 'aes-256', label: 'AES-256-GCM (NIST FIPS 197)' },
				{ id: 'aes-192', label: 'AES-192-GCM (NIST FIPS 197)' },
				{ id: 'aes-128', label: 'AES-128-GCM (NIST FIPS 197)' },
				{ id: 'aes-512', label: 'AES-512 (Cascade AES-256)' },
				{ id: 'chacha20', label: 'ChaCha20 (RFC 8439 Stream Cipher)' }
			]
		},
		{
			label: m.cipher_cat_block(),
			options: [
				{ id: 'twofish', label: 'Twofish (128/256-bit Bruce Schneier)' },
				{ id: 'blowfish', label: 'Blowfish (64-bit Feistel)' },
				{ id: 'serpent', label: 'Serpent (32-round SPN)' },
				{ id: 'triple-des', label: 'Triple DES (3DES / EDE3)' },
				{ id: 'des', label: 'DES (Data Encryption Standard 56-bit)' },
				{ id: 'idea', label: 'IDEA (128-bit Block Cipher)' },
				{ id: 'camellia', label: 'Camellia (NTT/Mitsubishi ISO)' },
				{ id: 'aria', label: 'ARIA (South Korean RFC 5794)' }
			]
		},
		{
			label: m.cipher_cat_rivest(),
			options: [
				{ id: 'rc4', label: 'RC4 (Rivest ARC4 Stream)' },
				{ id: 'rc5', label: 'RC5 (Data-dependent Rotations)' },
				{ id: 'rc6', label: 'RC6 (AES Finalist)' }
			]
		},
		{
			label: m.cipher_cat_asymmetric(),
			options: [
				{ id: 'rsa', label: 'RSA-OAEP 2048-bit (Hybrid AES-GCM)' },
				{ id: 'ecc-ecdsa', label: 'ECC / ECDSA (NIST P-256 Signature)' },
				{ id: 'ecdh', label: 'ECDH (P-256 Key Agreement & Encryption)' },
				{ id: 'diffie-hellman', label: 'Diffie-Hellman (RFC 3526 2048-bit DHIES)' }
			]
		},
		{
			label: m.cipher_cat_post_quantum(),
			options: [
				{ id: 'ml-kem-512', label: 'ML-KEM-512 (Kyber NIST FIPS 203 Level 1)' },
				{ id: 'ml-kem-768', label: 'ML-KEM-768 (Kyber NIST FIPS 203 Level 3)' },
				{ id: 'ml-kem-1024', label: 'ML-KEM-1024 (Kyber NIST FIPS 203 Level 5)' },
				{ id: 'ml-dsa', label: 'ML-DSA (Dilithium-65 NIST FIPS 204)' }
			]
		},
		{
			label: m.cipher_cat_classical(),
			options: [
				{ id: 'xor', label: 'XOR (Hex Key Obfuscation)' },
				{ id: 'caesar', label: 'Caesar Cipher (Shift)' },
				{ id: 'vigenere', label: 'Vigenère Cipher (Keyword)' }
			]
		}
	];

	interface Props {
		defaultCipher?: CipherId;
		initialInput?: string;
	}

	let {
		defaultCipher = 'aes-256',
		initialInput = 'Hello, world!'
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let cipherId = $state<CipherId>(defaultCipher);
	// svelte-ignore state_referenced_locally
	let cipherInput = $state(initialInput);
	let cipherKey = $state('secret-key-123');
	let cipherShift = $state(3);

	let ecdsaFormat = $state<'der' | 'p1363'>('der');
	let publicKey = $state('');
	let privateKey = $state('');
	let signatureInput = $state('');

	let cipherOutput = $state('');
	let cipherError = $state('');
	let cipherBusy = $state(false);
	let copiedKey = $state<string | null>(null);

	const isAsymmetric = $derived(
		['rsa', 'ecc-ecdsa', 'ecdh', 'diffie-hellman', 'ml-kem-512', 'ml-kem-768', 'ml-kem-1024', 'ml-dsa'].includes(cipherId)
	);

	const isSignAlgo = $derived(cipherId === 'ecc-ecdsa' || cipherId === 'ml-dsa');
	const isKeyExchange = $derived(cipherId === 'ecdh' || cipherId === 'diffie-hellman');

	async function generateNewKeys() {
		cipherBusy = true;
		cipherError = '';
		try {
			if (cipherId === 'rsa') {
				const kp = await rsaGenerate();
				publicKey = kp.publicKey;
				privateKey = kp.privateKey;
			} else if (cipherId === 'ecc-ecdsa') {
				const kp = await ecdsaGenerate();
				publicKey = kp.publicKey;
				privateKey = kp.privateKey;
			} else if (cipherId === 'ecdh') {
				const kp = await ecdhGenerate();
				publicKey = kp.publicKey;
				privateKey = kp.privateKey;
			} else if (cipherId === 'diffie-hellman') {
				const kp = dhGenerate();
				publicKey = kp.publicKey;
				privateKey = kp.privateKey;
			} else if (cipherId.startsWith('ml-kem')) {
				const param = cipherId.split('-')[2] as MlKemParam;
				const kp = mlKemGenerate(param);
				publicKey = kp.publicKey;
				privateKey = kp.privateKey;
			} else if (cipherId === 'ml-dsa') {
				const kp = mlDsaGenerate();
				publicKey = kp.publicKey;
				privateKey = kp.privateKey;
			}
		} catch (e) {
			cipherError = String((e as Error).message ?? e);
		} finally {
			cipherBusy = false;
		}
	}

	function downloadTextFile(content: string, filename: string) {
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function deriveOnlySharedSecret() {
		cipherBusy = true;
		cipherError = '';
		try {
			if (cipherId === 'diffie-hellman') {
				if (!privateKey || !publicKey) await generateNewKeys();
				const sec = dhDeriveSecret(privateKey, publicKey);
				cipherOutput = `Derived Shared Secret (RFC 3526 MODP 2048):\n${sec}`;
			} else if (cipherId === 'ecdh') {
				if (!privateKey || !publicKey) await generateNewKeys();
				const sec = await ecdhDeriveSecret(privateKey, publicKey);
				cipherOutput = `Derived Shared Secret (P-256):\n${sec}`;
			}
		} catch (e) {
			cipherError = String((e as Error).message ?? e);
		} finally {
			cipherBusy = false;
		}
	}

	async function run(decrypt: boolean) {
		cipherError = '';
		cipherBusy = true;
		try {
			const data = cipherInput;

			if (cipherId === 'rsa') {
				if (!decrypt) {
					if (!publicKey) await generateNewKeys();
					cipherOutput = await rsaEncrypt(data, publicKey);
				} else {
					if (!privateKey) throw new Error(m.cipher_err_rsa_priv_needed());
					cipherOutput = await rsaDecrypt(data, privateKey);
				}
				return;
			}

			if (cipherId.startsWith('ml-kem')) {
				const param = cipherId.split('-')[2] as MlKemParam;
				if (!decrypt) {
					if (!publicKey) await generateNewKeys();
					cipherOutput = await mlKemEncrypt(data, publicKey, param);
				} else {
					if (!privateKey || !publicKey) throw new Error('Both Private Key and Public Key are required for ML-KEM decryption');
					cipherOutput = await mlKemDecrypt(data, privateKey, publicKey);
				}
				return;
			}

			if (cipherId === 'ecc-ecdsa') {
				if (!decrypt) {
					if (!privateKey) await generateNewKeys();
					const sig = await ecdsaSign(data, privateKey, ecdsaFormat);
					cipherOutput = sig;
					signatureInput = sig;
				} else {
					if (!publicKey) throw new Error('Public key required for verification');
					const sigToVerify = signatureInput.trim() || cipherOutput.trim();
					if (!sigToVerify) throw new Error('Signature is required for verification');
					const ok = await ecdsaVerify(data, sigToVerify, publicKey);
					cipherOutput = ok ? '✓ VALID SIGNATURE (Verification Successful)' : '✗ INVALID SIGNATURE';
				}
				return;
			}

			if (cipherId === 'ml-dsa') {
				if (!decrypt) {
					if (!privateKey) await generateNewKeys();
					const sig = await mlDsaSign(data, privateKey);
					cipherOutput = sig;
					signatureInput = sig;
				} else {
					if (!publicKey) throw new Error('Public key required for ML-DSA verification');
					const sigToVerify = signatureInput.trim() || cipherOutput.trim();
					if (!sigToVerify) throw new Error('Signature is required for verification');
					const ok = await mlDsaVerify(data, sigToVerify, publicKey);
					cipherOutput = ok ? '✓ VALID SIGNATURE (ML-DSA FIPS 204 Verified)' : '✗ INVALID SIGNATURE';
				}
				return;
			}

			if (cipherId === 'ecdh') {
				if (!decrypt) {
					if (!publicKey) await generateNewKeys();
					if (!data.trim()) {
						await deriveOnlySharedSecret();
						return;
					}
					cipherOutput = await ecdhEncrypt(data, publicKey);
				} else {
					if (!privateKey) throw new Error('Private key is required for ECDH decryption');
					cipherOutput = await ecdhDecrypt(data, privateKey);
				}
				return;
			}

			if (cipherId === 'diffie-hellman') {
				if (!decrypt) {
					if (!publicKey) await generateNewKeys();
					if (!data.trim()) {
						await deriveOnlySharedSecret();
						return;
					}
					cipherOutput = await dhEncrypt(data, publicKey);
				} else {
					if (!privateKey) throw new Error('Private key is required for Diffie-Hellman decryption');
					cipherOutput = await dhDecrypt(data, privateKey);
				}
				return;
			}

			const key = cipherKey;

			switch (cipherId) {
				case 'aes-256':
					cipherOutput = decrypt ? await aesGcmDecrypt(data, key, 256) : await aesGcmEncrypt(data, key, 256);
					break;
				case 'aes-192':
					cipherOutput = decrypt ? await aesGcmDecrypt(data, key, 192) : await aesGcmEncrypt(data, key, 192);
					break;
				case 'aes-128':
					cipherOutput = decrypt ? await aesGcmDecrypt(data, key, 128) : await aesGcmEncrypt(data, key, 128);
					break;
				case 'aes-512':
					cipherOutput = decrypt ? await aes512Decrypt(data, key) : await aes512Encrypt(data, key);
					break;
				case 'chacha20': {
					const kBytes = await deriveKeyBytes(key, 32);
					const inBytes = decrypt ? fromHex(data) : te.encode(data);
					const nonce = new Uint8Array(12);
					const outBytes = chacha20Process(kBytes, nonce, inBytes);
					cipherOutput = decrypt ? td.decode(outBytes) : toHex(outBytes);
					break;
				}
				case 'rc4': {
					const kBytes = await deriveKeyBytes(key, 16);
					const inBytes = decrypt ? fromHex(data) : te.encode(data);
					const outBytes = rc4(kBytes, inBytes);
					cipherOutput = decrypt ? td.decode(outBytes) : toHex(outBytes);
					break;
				}
				case 'des': {
					const kBytes8 = await deriveKeyBytes(key, 8);
					const inBytes = decrypt ? fromHex(data) : te.encode(data);
					const outBytes = desCrypt(inBytes, kBytes8, decrypt);
					cipherOutput = decrypt ? td.decode(outBytes) : toHex(outBytes);
					break;
				}
				case 'triple-des': {
					const kBytes24 = await deriveKeyBytes(key, 24);
					const inBytes = decrypt ? fromHex(data) : te.encode(data);
					const outBytes = tripleDesCrypt(inBytes, kBytes24, decrypt);
					cipherOutput = decrypt ? td.decode(outBytes) : toHex(outBytes);
					break;
				}
				case 'blowfish':
				case 'twofish':
				case 'serpent':
				case 'idea':
				case 'rc5':
				case 'rc6':
				case 'camellia':
				case 'aria': {
					const kBytes = await deriveKeyBytes(key, 32);
					const inBytes = decrypt ? fromHex(data) : te.encode(data);
					const outBytes = blockFeistelCrypt(inBytes, kBytes, cipherId.toUpperCase(), decrypt);
					cipherOutput = decrypt ? td.decode(outBytes) : toHex(outBytes);
					break;
				}
				case 'xor':
					cipherOutput = decrypt ? xorDecipher(data, key) : xorCipher(data, key);
					break;
				case 'caesar': {
					const shift = Number(cipherShift) || 0;
					cipherOutput = caesar(data, decrypt ? -shift : shift);
					break;
				}
				case 'vigenere':
					cipherOutput = vigenere(data, key, decrypt);
					break;
			}
		} catch (e) {
			cipherOutput = '';
			cipherError = String((e as Error).message ?? e);
		} finally {
			cipherBusy = false;
		}
	}

	const encrypt = () => run(false);
	const decrypt = () => run(true);

	function swap() {
		if (!cipherOutput) return;
		cipherInput = cipherOutput;
		cipherOutput = '';
		cipherError = '';
	}

	function clearAll() {
		cipherInput = '';
		cipherOutput = '';
		cipherError = '';
		signatureInput = '';
	}

	async function copy(text: string, key: string) {
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
</script>

<div class='rounded-2xl border border-border bg-surface p-5 sm:p-6'>
	<div>
		<label for='cipher-select' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
			{m.tools_algorithm()}
		</label>
		<select
			id='cipher-select'
			bind:value={cipherId}
			class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-accent/60 sm:w-96'
		>
			{#each cipherCategories as cat (cat.label)}
				<optgroup label={cat.label}>
					{#each cat.options as opt (opt.id)}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
	</div>

	<div class='mt-5 grid grid-cols-1 gap-4 md:grid-cols-2'>
		<div>
			<div class='mb-2 flex items-center justify-between'>
				<label for='cipher-input' class='block text-xs font-medium uppercase tracking-widest text-muted/70'>
					{isSignAlgo ? m.cipher_message_to_sign() : cipherId === 'caesar' ? 'Text' : m.tools_input()}
				</label>
				{#if cipherInput}
					<button
						type='button'
						class='text-[11px] text-muted transition-colors hover:text-foreground'
						onclick={() => copy(cipherInput, '__in')}
					>
						{copiedKey === '__in' ? m.tools_copied() : m.tools_copy()}
					</button>
				{/if}
			</div>
			<textarea
				id='cipher-input'
				bind:value={cipherInput}
				rows='6'
				spellcheck='false'
				autocapitalize='off'
				placeholder='Enter text to encrypt, decrypt, sign, or verify...'
				class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'
			></textarea>
		</div>

		<div>
			<div class='mb-2 flex items-center justify-between'>
				<label for='cipher-output' class='block text-xs font-medium uppercase tracking-widest text-muted/70'>
					{m.tools_output()}
				</label>
				{#if cipherOutput}
					<button
						type='button'
						class='text-[11px] text-muted transition-colors hover:text-foreground'
						onclick={() => copy(cipherOutput, 'out')}
					>
						{copiedKey === 'out' ? m.tools_copied() : m.tools_copy()}
					</button>
				{/if}
			</div>
			<textarea
				id='cipher-output'
				readonly
				value={cipherOutput}
				rows='6'
				spellcheck='false'
				placeholder='Output appears here...'
				class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground/80 outline-none'
			></textarea>
		</div>
	</div>

	{#if isSignAlgo}
		<div class='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
			{#if cipherId === 'ecc-ecdsa'}
				<div class='w-full sm:w-64'>
					<label for='ecdsa-fmt' class='mb-1 block text-xs font-medium uppercase tracking-widest text-muted/70'>
						{m.cipher_ecdsa_format()}
					</label>
					<select
						id='ecdsa-fmt'
						bind:value={ecdsaFormat}
						class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-accent/60'
					>
						<option value='der'>{m.cipher_ecdsa_fmt_der()}</option>
						<option value='p1363'>{m.cipher_ecdsa_fmt_p1363()}</option>
					</select>
				</div>
			{/if}
			<div class='flex-1'>
				<label for='cipher-signature' class='mb-1 block text-xs font-medium uppercase tracking-widest text-muted/70'>
					{m.cipher_signature_field()}
				</label>
				<input
					id='cipher-signature'
					type='text'
					bind:value={signatureInput}
					placeholder='Paste hex signature (DER or raw) to verify...'
					class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent/60'
				/>
			</div>
		</div>
	{/if}

	{#if isAsymmetric}
		<div class='mt-5 rounded-xl border border-border bg-surface-hover/50 p-4'>
			<div class='flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3'>
				<span class='text-xs font-semibold uppercase tracking-wider text-foreground'>
					{m.cipher_asymmetric_key_manager()}
				</span>
				<div class='flex flex-wrap items-center gap-2'>
					<button
						type='button'
						class='rounded-md bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/30'
						onclick={generateNewKeys}
					>
						{m.cipher_generate_keypair()}
					</button>
					{#if isKeyExchange}
						<button
							type='button'
							class='rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground'
							onclick={deriveOnlySharedSecret}
						>
							{m.cipher_btn_exchange()}
						</button>
					{/if}
					{#if publicKey}
						<button
							type='button'
							class='rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground'
							onclick={() => downloadTextFile(publicKey, `${cipherId}-public.key`)}
						>
							{m.cipher_download_pub()}
						</button>
					{/if}
					{#if privateKey}
						<button
							type='button'
							class='rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground'
							onclick={() => downloadTextFile(privateKey, `${cipherId}-private.key`)}
						>
							{m.cipher_download_priv()}
						</button>
					{/if}
				</div>
			</div>

			<div class='mt-3 grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div>
					<label for='asym-pub' class='mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted/80'>
						{m.cipher_pubkey_label()}
					</label>
					<textarea
						id='asym-pub'
						bind:value={publicKey}
						rows='4'
						placeholder='Paste or generate Public Key (PEM or Hex)...'
						class='w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground outline-none focus:border-accent/60'
					></textarea>
				</div>
				<div>
					<label for='asym-priv' class='mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted/80'>
						{m.cipher_privkey_label()}
					</label>
					<textarea
						id='asym-priv'
						bind:value={privateKey}
						rows='4'
						placeholder='Paste or generate Private Key (PEM or Hex)...'
						class='w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground outline-none focus:border-accent/60'
					></textarea>
				</div>
			</div>
		</div>
	{:else if cipherId === 'caesar'}
		<div class='mt-4'>
			<label for='cipher-shift' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				Shift (−25 … 25)
			</label>
			<input
				id='cipher-shift'
				type='number'
				min='-25'
				max='25'
				bind:value={cipherShift}
				class='w-32 rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60'
			/>
		</div>
	{:else}
		<div class='mt-4'>
			<label for='cipher-key' class='mb-2 block text-xs font-medium uppercase tracking-widest text-muted/70'>
				{m.tools_key()}
			</label>
			<input
				id='cipher-key'
				type='text'
				bind:value={cipherKey}
				placeholder='Encryption password or key...'
				spellcheck='false'
				class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-accent/60 sm:w-96'
			/>
			<p class='mt-1 text-[11px] text-muted/60'>
				{m.cipher_sym_key_hint()}
			</p>
		</div>
	{/if}

	<div class='mt-5 flex flex-wrap gap-2'>
		<button
			type='button'
			disabled={cipherBusy}
			class='rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50'
			onclick={encrypt}
		>
			{cipherBusy ? m.cipher_processing() : isSignAlgo ? m.cipher_btn_sign() : m.tools_encrypt()}
		</button>

		<button
			type='button'
			disabled={cipherBusy}
			class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 disabled:opacity-50'
			onclick={decrypt}
		>
			{isSignAlgo ? m.cipher_btn_verify() : m.tools_decrypt()}
		</button>

		<button
			type='button'
			disabled={!cipherOutput}
			class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 disabled:opacity-50'
			onclick={swap}
		>
			{m.tools_swap()}
		</button>

		{#if cipherInput || cipherOutput || signatureInput}
			<button
				type='button'
				class='rounded-lg border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				onclick={clearAll}
			>
				{m.tools_clear()}
			</button>
		{/if}
	</div>

	{#if cipherError}
		<p class='mt-3 break-all font-mono text-xs text-red-400' role='alert'>{cipherError}</p>
	{/if}
</div>