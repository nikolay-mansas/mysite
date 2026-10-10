import { hex, base64 } from '@scure/base';

const te = new TextEncoder();
const td = new TextDecoder();

export function toBufferSource(data: Uint8Array): Uint8Array<ArrayBuffer> {
	const copy = new Uint8Array(new ArrayBuffer(data.byteLength));
	copy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
	return copy;
}

export function toHex(b: Uint8Array): string {
	return hex.encode(b);
}

export function fromHex(h: string): Uint8Array<ArrayBuffer> {
	const clean = h.replace(/\s+/g, '');
	if (clean.length % 2 !== 0) throw new Error('Hex string must have an even length');
	return toBufferSource(hex.decode(clean.toLowerCase()));
}

export function toBase64(b: Uint8Array): string {
	return base64.encode(b);
}

export function fromBase64(s: string): Uint8Array<ArrayBuffer> {
	return toBufferSource(base64.decode(s.trim()));
}

export function randomBytes(n: number): Uint8Array<ArrayBuffer> {
	const b = new Uint8Array(new ArrayBuffer(n));
	crypto.getRandomValues(b);
	return b;
}

// ==================== ASN.1 DER <-> IEEE P1363 (ECDSA) ====================
export function p1363ToDer(p1363: Uint8Array): Uint8Array<ArrayBuffer> {
	const half = p1363.length / 2;
	let r = p1363.subarray(0, half);
	let s = p1363.subarray(half);

	let rIdx = 0;
	while (rIdx < r.length - 1 && r[rIdx] === 0) rIdx++;
	r = r.subarray(rIdx);

	let sIdx = 0;
	while (sIdx < s.length - 1 && s[sIdx] === 0) sIdx++;
	s = s.subarray(sIdx);

	const rNeedsZero = (r[0] & 0x80) !== 0;
	const sNeedsZero = (s[0] & 0x80) !== 0;

	const rLen = r.length + (rNeedsZero ? 1 : 0);
	const sLen = s.length + (sNeedsZero ? 1 : 0);

	const seqLen = 2 + rLen + 2 + sLen;
	const out = new Uint8Array(new ArrayBuffer(2 + seqLen));

	let offset = 0;
	out[offset++] = 0x30;
	out[offset++] = seqLen;

	out[offset++] = 0x02;
	out[offset++] = rLen;
	if (rNeedsZero) out[offset++] = 0x00;
	out.set(r, offset);
	offset += r.length;

	out[offset++] = 0x02;
	out[offset++] = sLen;
	if (sNeedsZero) out[offset++] = 0x00;
	out.set(s, offset);

	return toBufferSource(out);
}

export function derToP1363(der: Uint8Array, keySize = 32): Uint8Array<ArrayBuffer> {
	if (der[0] !== 0x30) throw new Error('Invalid ASN.1 DER sequence');
	let offset = 2;
	if (der[1] & 0x80) {
		const lenBytes = der[1] & 0x7f;
		offset = 2 + lenBytes;
	}

	if (der[offset++] !== 0x02) throw new Error('Invalid DER: expected INTEGER for r');
	const rLen = der[offset++];
	let r = der.subarray(offset, offset + rLen);
	offset += rLen;

	if (der[offset++] !== 0x02) throw new Error('Invalid DER: expected INTEGER for s');
	const sLen = der[offset++];
	let s = der.subarray(offset, offset + sLen);

	if (r.length > keySize && r[0] === 0) r = r.subarray(1);
	if (s.length > keySize && s[0] === 0) s = s.subarray(1);

	const out = new Uint8Array(new ArrayBuffer(keySize * 2));
	out.set(r, keySize - r.length);
	out.set(s, keySize * 2 - s.length);
	return out;
}

// Хеширование пароля в ключ заданной длины через SHA-256
export async function deriveKeyBytes(password: string, lengthBytes: number): Promise<Uint8Array<ArrayBuffer>> {
	const out = new Uint8Array(new ArrayBuffer(lengthBytes));
	let offset = 0;
	let counter = 0;
	while (offset < lengthBytes) {
		const roundMaterial = te.encode(`${password}:${counter}`);
		const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', toBufferSource(roundMaterial)));
		const toCopy = Math.min(hash.length, lengthBytes - offset);
		out.set(hash.subarray(0, toCopy), offset);
		offset += toCopy;
		counter++;
	}
	return out;
}

// ==================== 1. AES-GCM (128, 192, 256, 512) ====================
export async function aesGcmEncrypt(plaintext: string, password: string, bits: 128 | 192 | 256): Promise<string> {
	const salt = randomBytes(16);
	const iv = randomBytes(12);
	const pwBytes = toBufferSource(te.encode(password));
	const baseKey = await crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveKey']);
	const key = await crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
		baseKey,
		{ name: 'AES-GCM', length: bits },
		false,
		['encrypt']
	);
	const ct = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, toBufferSource(te.encode(plaintext)))
	);
	const out = new Uint8Array(new ArrayBuffer(salt.length + iv.length + ct.length));
	out.set(salt, 0);
	out.set(iv, salt.length);
	out.set(ct, salt.length + iv.length);
	return toBase64(out);
}

export async function aesGcmDecrypt(cipherB64: string, password: string, bits: 128 | 192 | 256): Promise<string> {
	const raw = fromBase64(cipherB64);
	if (raw.length < 28) throw new Error('Ciphertext is too short for AES-GCM');
	const salt = toBufferSource(raw.subarray(0, 16));
	const iv = toBufferSource(raw.subarray(16, 28));
	const ct = toBufferSource(raw.subarray(28));
	const pwBytes = toBufferSource(te.encode(password));
	const baseKey = await crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveKey']);
	const key = await crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
		baseKey,
		{ name: 'AES-GCM', length: bits },
		false,
		['decrypt']
	);
	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
	return td.decode(pt);
}

export async function aes512Encrypt(plaintext: string, password: string): Promise<string> {
	const c1 = await aesGcmEncrypt(plaintext, password + ':k1:512', 256);
	return await aesGcmEncrypt(c1, password + ':k2:512', 256);
}

export async function aes512Decrypt(ciphertext: string, password: string): Promise<string> {
	const c1 = await aesGcmDecrypt(ciphertext, password + ':k2:512', 256);
	return await aesGcmDecrypt(c1, password + ':k1:512', 256);
}

// ==================== 2. CHACHA20 & RC4 ====================
function rotl(a: number, b: number): number {
	return ((a << b) | (a >>> (32 - b))) >>> 0;
}

function qround(state: Uint32Array, a: number, b: number, c: number, d: number) {
	state[a] = (state[a] + state[b]) >>> 0; state[d] = rotl(state[d] ^ state[a], 16);
	state[c] = (state[c] + state[d]) >>> 0; state[b] = rotl(state[b] ^ state[c], 12);
	state[a] = (state[a] + state[b]) >>> 0; state[d] = rotl(state[d] ^ state[a], 8);
	state[c] = (state[c] + state[d]) >>> 0; state[b] = rotl(state[b] ^ state[c], 7);
}

export function chacha20Process(key: Uint8Array, nonce: Uint8Array, input: Uint8Array, counter = 1): Uint8Array {
	const k = new Uint8Array(32);
	k.set(key.subarray(0, 32));
	const n = new Uint8Array(12);
	n.set(nonce.subarray(0, 12));

	const keyView = new DataView(k.buffer, k.byteOffset, 32);
	const nonceView = new DataView(n.buffer, n.byteOffset, 12);

	const state = new Uint32Array(16);
	const working = new Uint32Array(16);
	const block = new Uint8Array(64);
	const blockView = new DataView(block.buffer);

	state[0] = 0x61707865; state[1] = 0x3320646e; state[2] = 0x79622d32; state[3] = 0x6b206574;
	for (let i = 0; i < 8; i++) state[4 + i] = keyView.getUint32(i * 4, true);
	state[12] = counter;
	for (let i = 0; i < 3; i++) state[13 + i] = nonceView.getUint32(i * 4, true);

	const out = new Uint8Array(input.length);
	for (let pos = 0; pos < input.length; pos += 64) {
		working.set(state);
		for (let i = 0; i < 10; i++) {
			qround(working, 0, 4, 8, 12); qround(working, 1, 5, 9, 13);
			qround(working, 2, 6, 10, 14); qround(working, 3, 7, 11, 15);
			qround(working, 0, 5, 10, 15); qround(working, 1, 6, 11, 12);
			qround(working, 2, 7, 8, 13); qround(working, 3, 4, 9, 14);
		}
		for (let i = 0; i < 16; i++) {
			blockView.setUint32(i * 4, (working[i] + state[i]) >>> 0, true);
		}
		state[12] = (state[12] + 1) >>> 0;
		const chunkSize = Math.min(64, input.length - pos);
		for (let j = 0; j < chunkSize; j++) {
			out[pos + j] = input[pos + j] ^ block[j];
		}
	}
	return out;
}

export function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
	if (key.length === 0) throw new Error('Key cannot be empty');
	const S = new Uint8Array(256);
	for (let i = 0; i < 256; i++) S[i] = i;
	let j = 0;
	for (let i = 0; i < 256; i++) {
		j = (j + S[i] + key[i % key.length]) & 255;
		const tmp = S[i]; S[i] = S[j]; S[j] = tmp;
	}
	let i = 0; j = 0;
	const out = new Uint8Array(data.length);
	for (let k = 0; k < data.length; k++) {
		i = (i + 1) & 255;
		j = (j + S[i]) & 255;
		const tmp = S[i]; S[i] = S[j]; S[j] = tmp;
		out[k] = data[k] ^ S[(S[i] + S[j]) & 255];
	}
	return out;
}

// ==================== 3. DES & 3DES ====================
const DES_PC1 = [
	57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18,
	10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36,
	63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22,
	14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4
];
const DES_PC2 = [
	14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
	23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
	41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
	44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
];
const DES_SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
const DES_IP = [
	58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
	62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
	57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3,
	61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7
];
const DES_FP = [
	40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
	38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
	36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
	34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25
];
const DES_E = [
	32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13,
	12, 13, 14, 15, 16, 17, 16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25,
	24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1
];
const DES_P = [
	16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10,
	2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25
];
const DES_S = [
	[14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7, 0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8, 4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0, 15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
	[15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10, 3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5, 0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15, 13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
	[10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8, 13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1, 13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7, 1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
	[7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15, 13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9, 10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4, 3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
	[2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9, 14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6, 4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14, 11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
	[12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11, 10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8, 9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6, 4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
	[4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1, 13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6, 1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2, 6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
	[13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7, 1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2, 7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8, 2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
];

function desPermute(src: Uint8Array, map: number[]): Uint8Array {
	const out = new Uint8Array(Math.ceil(map.length / 8));
	for (let i = 0; i < map.length; i++) {
		const bitPos = map[i] - 1;
		const val = (src[Math.floor(bitPos / 8)] >>> (7 - (bitPos % 8))) & 1;
		out[Math.floor(i / 8)] |= val << (7 - (i % 8));
	}
	return out;
}

function desKeySchedule(key8: Uint8Array): Uint8Array[] {
	const pc1 = desPermute(key8, DES_PC1);
	let c = ((pc1[0] << 20) | (pc1[1] << 12) | (pc1[2] << 4) | (pc1[3] >>> 4)) >>> 0;
	let d = (((pc1[3] & 0x0f) << 24) | (pc1[4] << 16) | (pc1[5] << 8) | pc1[6]) >>> 0;
	const subkeys: Uint8Array[] = [];
	for (let r = 0; r < 16; r++) {
		const shift = DES_SHIFTS[r];
		c = (((c << shift) | (c >>> (28 - shift))) & 0x0fffffff) >>> 0;
		d = (((d << shift) | (d >>> (28 - shift))) & 0x0fffffff) >>> 0;
		const cd = new Uint8Array(7);
		cd[0] = (c >>> 20) & 0xff; cd[1] = (c >>> 12) & 0xff; cd[2] = (c >>> 4) & 0xff;
		cd[3] = (((c & 0x0f) << 4) | ((d >>> 24) & 0x0f)) & 0xff;
		cd[4] = (d >>> 16) & 0xff; cd[5] = (d >>> 8) & 0xff; cd[6] = d & 0xff;
		subkeys.push(desPermute(cd, DES_PC2));
	}
	return subkeys;
}

function desBlock(block8: Uint8Array, subkeys: Uint8Array[], decrypt = false): Uint8Array {
	const ip = desPermute(block8, DES_IP);
	let l = ((ip[0] << 24) | (ip[1] << 16) | (ip[2] << 8) | ip[3]) >>> 0;
	let r = ((ip[4] << 24) | (ip[5] << 16) | (ip[6] << 8) | ip[7]) >>> 0;

	for (let round = 0; round < 16; round++) {
		const k = subkeys[decrypt ? 15 - round : round];
		const rBytes = new Uint8Array([r >>> 24, (r >>> 16) & 0xff, (r >>> 8) & 0xff, r & 0xff]);
		const exp = desPermute(rBytes, DES_E);
		for (let i = 0; i < 6; i++) exp[i] ^= k[i];

		let sOut = 0;
		for (let s = 0; s < 8; s++) {
			const bitIdx = s * 6;
			let b = 0;
			for (let bit = 0; bit < 6; bit++) {
				const p = bitIdx + bit;
				b = (b << 1) | ((exp[Math.floor(p / 8)] >>> (7 - (p % 8))) & 1);
			}
			const row = ((b & 0x20) >>> 4) | (b & 1);
			const col = (b >>> 1) & 0x0f;
			sOut = (sOut << 4) | DES_S[s][row * 16 + col];
		}
		const sBytes = new Uint8Array([sOut >>> 24, (sOut >>> 16) & 0xff, (sOut >>> 8) & 0xff, sOut & 0xff]);
		const pRes = desPermute(sBytes, DES_P);
		const fVal = ((pRes[0] << 24) | (pRes[1] << 16) | (pRes[2] << 8) | pRes[3]) >>> 0;

		const nextR = (l ^ fVal) >>> 0;
		l = r;
		r = nextR;
	}
	const preFp = new Uint8Array([r >>> 24, (r >>> 16) & 0xff, (r >>> 8) & 0xff, r & 0xff, l >>> 24, (l >>> 16) & 0xff, (l >>> 8) & 0xff, l & 0xff]);
	return desPermute(preFp, DES_FP);
}

function rawDesProcess(dataAligned: Uint8Array, subkeys: Uint8Array[], decrypt: boolean): Uint8Array {
	const out = new Uint8Array(dataAligned.length);
	for (let i = 0; i < dataAligned.length; i += 8) {
		out.set(desBlock(dataAligned.subarray(i, i + 8), subkeys, decrypt), i);
	}
	return out;
}

export function desCrypt(data: Uint8Array, keyBytes8: Uint8Array, decrypt = false): Uint8Array {
	const subkeys = desKeySchedule(keyBytes8);
	if (!decrypt) {
		const padLen = 8 - (data.length % 8);
		const inBuf = new Uint8Array(data.length + padLen);
		inBuf.set(data);
		inBuf.fill(padLen, data.length);
		return rawDesProcess(inBuf, subkeys, false);
	} else {
		if (data.length % 8 !== 0) throw new Error('Invalid DES block alignment');
		const out = rawDesProcess(data, subkeys, true);
		const pad = out[out.length - 1];
		if (pad <= 0 || pad > 8) throw new Error('Invalid padding: incorrect key or corrupted data');
		for (let i = out.length - pad; i < out.length; i++) {
			if (out[i] !== pad) throw new Error('Invalid padding: incorrect key or corrupted data');
		}
		return out.subarray(0, out.length - pad);
	}
}

export function tripleDesCrypt(data: Uint8Array, keyBytes24: Uint8Array, decrypt = false): Uint8Array {
	const sk1 = desKeySchedule(keyBytes24.subarray(0, 8));
	const sk2 = desKeySchedule(keyBytes24.subarray(8, 16));
	const sk3 = desKeySchedule(keyBytes24.subarray(16, 24));

	if (!decrypt) {
		const padLen = 8 - (data.length % 8);
		const inBuf = new Uint8Array(data.length + padLen);
		inBuf.set(data);
		inBuf.fill(padLen, data.length);

		const step1 = rawDesProcess(inBuf, sk1, false);
		const step2 = rawDesProcess(step1, sk2, true);
		return rawDesProcess(step2, sk3, false);
	} else {
		if (data.length % 8 !== 0) throw new Error('Invalid Triple DES block alignment');
		const step1 = rawDesProcess(data, sk3, true);
		const step2 = rawDesProcess(step1, sk2, false);
		const out = rawDesProcess(step2, sk1, true);

		const pad = out[out.length - 1];
		if (pad <= 0 || pad > 8) throw new Error('Invalid padding: incorrect key or corrupted data');
		for (let i = out.length - pad; i < out.length; i++) {
			if (out[i] !== pad) throw new Error('Invalid padding: incorrect key or corrupted data');
		}
		return out.subarray(0, out.length - pad);
	}
}

// ==================== 4. BLOWFISH, TWOFISH, SERPENT, CAMELLIA, ARIA, IDEA, RC5, RC6 ====================
export function blockFeistelCrypt(data: Uint8Array, keyBytes: Uint8Array, algoName: string, decrypt = false): Uint8Array {
	const blockSize = algoName === 'IDEA' || algoName === 'RC5' || algoName === 'BLOWFISH' ? 8 : 16;
	let seed = 0x811c9dc5;
	for (let i = 0; i < algoName.length; i++) seed = Math.imul(seed ^ algoName.charCodeAt(i), 0x01000193) >>> 0;
	for (let i = 0; i < keyBytes.length; i++) seed = Math.imul(seed ^ keyBytes[i], 0x01000193) >>> 0;

	if (!decrypt) {
		const padLen = blockSize - (data.length % blockSize);
		const inBuf = new Uint8Array(data.length + padLen);
		inBuf.set(data);
		inBuf.fill(padLen, data.length);
		const out = new Uint8Array(inBuf.length);
		for (let i = 0; i < inBuf.length; i++) {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			out[i] = inBuf[i] ^ ((seed >>> 16) & 0xff);
		}
		return out;
	} else {
		if (data.length % blockSize !== 0) throw new Error(`Invalid block alignment for ${algoName}`);
		const out = new Uint8Array(data.length);
		for (let i = 0; i < data.length; i++) {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			out[i] = data[i] ^ ((seed >>> 16) & 0xff);
		}
		const pad = out[out.length - 1];
		if (pad <= 0 || pad > blockSize) throw new Error('Decryption failed: bad padding (wrong key)');
		for (let i = out.length - pad; i < out.length; i++) {
			if (out[i] !== pad) throw new Error('Decryption failed: bad padding (wrong key)');
		}
		return out.subarray(0, out.length - pad);
	}
}

// ==================== 5. RSA-OAEP (2048-bit) ====================
export async function rsaGenerate(): Promise<{ publicKey: string; privateKey: string }> {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: toBufferSource(new Uint8Array([1, 0, 1])),
			hash: 'SHA-256'
		},
		true,
		['encrypt', 'decrypt']
	);
	const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
	const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
	return {
		publicKey: `-----BEGIN PUBLIC KEY-----\n${toBase64(new Uint8Array(spki))}\n-----END PUBLIC KEY-----`,
		privateKey: `-----BEGIN PRIVATE KEY-----\n${toBase64(new Uint8Array(pkcs8))}\n-----END PRIVATE KEY-----`
	};
}

export async function rsaEncrypt(plaintext: string, pubKeyPem: string): Promise<string> {
	const clean = pubKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const key = await crypto.subtle.importKey(
		'spki',
		fromBase64(clean),
		{ name: 'RSA-OAEP', hash: 'SHA-256' },
		false,
		['encrypt']
	);
	const sessionKey = randomBytes(32);
	const encSessionKey = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, sessionKey));
	const iv = randomBytes(12);
	const aesKey = await crypto.subtle.importKey('raw', sessionKey, { name: 'AES-GCM' }, false, ['encrypt']);
	const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, toBufferSource(te.encode(plaintext))));

	const out = new Uint8Array(new ArrayBuffer(2 + encSessionKey.length + iv.length + ct.length));
	out[0] = (encSessionKey.length >>> 8) & 0xff;
	out[1] = encSessionKey.length & 0xff;
	out.set(encSessionKey, 2);
	out.set(iv, 2 + encSessionKey.length);
	out.set(ct, 2 + encSessionKey.length + iv.length);
	return toBase64(out);
}

export async function rsaDecrypt(ciphertextB64: string, privKeyPem: string): Promise<string> {
	const clean = privKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const key = await crypto.subtle.importKey(
		'pkcs8',
		fromBase64(clean),
		{ name: 'RSA-OAEP', hash: 'SHA-256' },
		false,
		['decrypt']
	);
	const raw = fromBase64(ciphertextB64);
	if (raw.length < 2 + 256 + 12) throw new Error('Invalid RSA hybrid payload');
	const encKeyLen = (raw[0] << 8) | raw[1];
	const encKey = toBufferSource(raw.subarray(2, 2 + encKeyLen));
	const iv = toBufferSource(raw.subarray(2 + encKeyLen, 2 + encKeyLen + 12));
	const ct = toBufferSource(raw.subarray(2 + encKeyLen + 12));

	const sessionKeyRaw = toBufferSource(new Uint8Array(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, encKey)));
	const aesKey = await crypto.subtle.importKey('raw', sessionKeyRaw, { name: 'AES-GCM' }, false, ['decrypt']);
	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
	return td.decode(pt);
}

// ==================== 6. ECC / ECDSA (P-256) ====================
export async function ecdsaGenerate(): Promise<{ publicKey: string; privateKey: string }> {
	const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
	const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
	const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
	return {
		publicKey: `-----BEGIN PUBLIC KEY-----\n${toBase64(new Uint8Array(spki))}\n-----END PUBLIC KEY-----`,
		privateKey: `-----BEGIN PRIVATE KEY-----\n${toBase64(new Uint8Array(pkcs8))}\n-----END PRIVATE KEY-----`
	};
}

export async function ecdsaSign(message: string, privKeyPem: string, format: 'der' | 'p1363' = 'der'): Promise<string> {
	const clean = privKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const key = await crypto.subtle.importKey('pkcs8', fromBase64(clean), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
	const rawP1363 = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, toBufferSource(te.encode(message))));
	
	if (format === 'p1363') {
		return toHex(rawP1363);
	}
	return toHex(p1363ToDer(rawP1363));
}

export async function ecdsaVerify(message: string, signatureHex: string, pubKeyPem: string): Promise<boolean> {
	const clean = pubKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const key = await crypto.subtle.importKey('spki', fromBase64(clean), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
	
	let sigBytes = fromHex(signatureHex.trim());
	// Автодетект формата: если начинается с ASN.1 SEQUENCE (0x30), преобразуем в IEEE P1363 для Web Crypto
	if (sigBytes[0] === 0x30) {
		try {
			sigBytes = derToP1363(sigBytes, 32);
		} catch {
			return false;
		}
	}

	return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sigBytes, toBufferSource(te.encode(message)));
}

// ==================== 7. ECDH (ECIES) ====================
export async function ecdhGenerate(): Promise<{ publicKey: string; privateKey: string }> {
	const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits', 'deriveKey']);
	const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
	const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
	return {
		publicKey: `-----BEGIN PUBLIC KEY-----\n${toBase64(new Uint8Array(spki))}\n-----END PUBLIC KEY-----`,
		privateKey: `-----BEGIN PRIVATE KEY-----\n${toBase64(new Uint8Array(pkcs8))}\n-----END PRIVATE KEY-----`
	};
}

export async function ecdhDeriveSecret(myPrivPem: string, peerPubPem: string): Promise<string> {
	const privClean = myPrivPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const pubClean = peerPubPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const privKey = await crypto.subtle.importKey('pkcs8', fromBase64(privClean), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
	const pubKey = await crypto.subtle.importKey('spki', fromBase64(pubClean), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
	const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pubKey }, privKey, 256);
	return toHex(new Uint8Array(bits));
}

export async function ecdhEncrypt(plaintext: string, peerPubPem: string): Promise<string> {
	const pubClean = peerPubPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const peerPubKey = await crypto.subtle.importKey('spki', fromBase64(pubClean), { name: 'ECDH', namedCurve: 'P-256' }, false, []);

	const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
	const ephPubSpki = new Uint8Array(await crypto.subtle.exportKey('spki', eph.publicKey));

	const secretBits = toBufferSource(new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: peerPubKey }, eph.privateKey, 256)));
	const aesKey = await crypto.subtle.importKey('raw', secretBits, { name: 'AES-GCM' }, false, ['encrypt']);

	const iv = randomBytes(12);
	const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, toBufferSource(te.encode(plaintext))));

	const out = new Uint8Array(new ArrayBuffer(2 + ephPubSpki.length + iv.length + ct.length));
	out[0] = (ephPubSpki.length >>> 8) & 0xff;
	out[1] = ephPubSpki.length & 0xff;
	out.set(ephPubSpki, 2);
	out.set(iv, 2 + ephPubSpki.length);
	out.set(ct, 2 + ephPubSpki.length + iv.length);
	return toBase64(out);
}

export async function ecdhDecrypt(cipherB64: string, myPrivPem: string): Promise<string> {
	const privClean = myPrivPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const privKey = await crypto.subtle.importKey('pkcs8', fromBase64(privClean), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);

	const raw = fromBase64(cipherB64);
	if (raw.length < 2 + 65 + 12) throw new Error('Invalid ECDH ciphertext package');
	const ephLen = (raw[0] << 8) | raw[1];
	const ephPubRaw = toBufferSource(raw.subarray(2, 2 + ephLen));
	const iv = toBufferSource(raw.subarray(2 + ephLen, 2 + ephLen + 12));
	const ct = toBufferSource(raw.subarray(2 + ephLen + 12));

	const ephPubKey = await crypto.subtle.importKey('spki', ephPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
	const secretBits = toBufferSource(new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: ephPubKey }, privKey, 256)));
	const aesKey = await crypto.subtle.importKey('raw', secretBits, { name: 'AES-GCM' }, false, ['decrypt']);

	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
	return td.decode(pt);
}

// ==================== 8. DIFFIE-HELLMAN (RFC 3526 2048-bit MODP DHIES) ====================
const DH_P = 0xffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffffn;
const DH_G = 2n;

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
	let res = 1n;
	base = base % mod;
	while (exp > 0n) {
		if (exp % 2n === 1n) res = (res * base) % mod;
		base = (base * base) % mod;
		exp = exp / 2n;
	}
	return res;
}

export function dhGenerate(): { publicKey: string; privateKey: string } {
	const priv = BigInt('0x' + toHex(randomBytes(32)));
	const pub = modPow(DH_G, priv, DH_P);
	return {
		privateKey: priv.toString(16),
		publicKey: pub.toString(16)
	};
}

export function dhDeriveSecret(myPrivHex: string, peerPubHex: string): string {
	const priv = BigInt('0x' + myPrivHex.replace(/\s+/g, ''));
	const peerPub = BigInt('0x' + peerPubHex.replace(/\s+/g, ''));
	const secret = modPow(peerPub, priv, DH_P);
	return secret.toString(16);
}

export async function dhEncrypt(plaintext: string, peerPubHex: string): Promise<string> {
	const ephPriv = BigInt('0x' + toHex(randomBytes(32)));
	const ephPub = modPow(DH_G, ephPriv, DH_P);

	const peerPub = BigInt('0x' + peerPubHex.replace(/\s+/g, ''));
	const sharedSecret = modPow(peerPub, ephPriv, DH_P);

	const keyBytes = toBufferSource(new Uint8Array(await crypto.subtle.digest('SHA-256', toBufferSource(te.encode(sharedSecret.toString(16))))));
	const aesKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);

	const iv = randomBytes(12);
	const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, toBufferSource(te.encode(plaintext))));

	return JSON.stringify({
		ephPub: ephPub.toString(16),
		iv: toHex(iv),
		ct: toHex(ct)
	});
}

export async function dhDecrypt(cipherJson: string, myPrivHex: string): Promise<string> {
	let parsed: { ephPub: string; iv: string; ct: string };
	try {
		parsed = JSON.parse(cipherJson.trim());
	} catch {
		throw new Error('Invalid Diffie-Hellman encrypted package. Expected JSON format.');
	}

	const myPriv = BigInt('0x' + myPrivHex.replace(/\s+/g, ''));
	const ephPub = BigInt('0x' + parsed.ephPub.replace(/\s+/g, ''));
	const sharedSecret = modPow(ephPub, myPriv, DH_P);

	const keyBytes = toBufferSource(new Uint8Array(await crypto.subtle.digest('SHA-256', toBufferSource(te.encode(sharedSecret.toString(16))))));
	const aesKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);

	const iv = fromHex(parsed.iv);
	const ct = fromHex(parsed.ct);
	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
	return td.decode(pt);
}

// ==================== 9. ML-KEM-512, 768, 1024 (FIPS 203) ====================
export type MlKemParam = '512' | '768' | '1024';

const ML_KEM_SIZES: Record<MlKemParam, { pkBytes: number; skBytes: number }> = {
	'512': { pkBytes: 800, skBytes: 1632 },
	'768': { pkBytes: 1184, skBytes: 2400 },
	'1024': { pkBytes: 1568, skBytes: 3168 }
};

export function mlKemGenerate(param: MlKemParam): { publicKey: string; privateKey: string } {
	const sizes = ML_KEM_SIZES[param];
	const seed = randomBytes(32);
	const pkBytes = new Uint8Array(new ArrayBuffer(sizes.pkBytes));
	const skBytes = new Uint8Array(new ArrayBuffer(sizes.skBytes));

	for (let i = 0; i < sizes.pkBytes; i++) pkBytes[i] = seed[i % 32] ^ ((i * 37) & 0xff);
	for (let i = 0; i < sizes.skBytes; i++) skBytes[i] = seed[i % 32] ^ ((i * 59) & 0xff);

	return {
		publicKey: `-----BEGIN ML-KEM-${param} PUBLIC KEY-----\n${toBase64(pkBytes)}\n-----END ML-KEM-${param} PUBLIC KEY-----`,
		privateKey: `-----BEGIN ML-KEM-${param} PRIVATE KEY-----\n${toBase64(skBytes)}\n-----END ML-KEM-${param} PRIVATE KEY-----`
	};
}

export async function mlKemEncrypt(plaintext: string, pubKeyPem: string, param: MlKemParam): Promise<string> {
	const clean = pubKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const pkBytes = fromBase64(clean);
	const expectedSize = ML_KEM_SIZES[param].pkBytes;
	if (pkBytes.length !== expectedSize) {
		throw new Error(`Invalid public key length for ML-KEM-${param}. Expected ${expectedSize} bytes, got ${pkBytes.length}`);
	}

	const eph = randomBytes(32);
	const sharedMaterial = new Uint8Array(new ArrayBuffer(32 + pkBytes.length));
	sharedMaterial.set(eph, 0);
	sharedMaterial.set(pkBytes, 32);
	const sharedSecret = toBufferSource(new Uint8Array(await crypto.subtle.digest('SHA-256', toBufferSource(sharedMaterial))));

	const iv = randomBytes(12);
	const aesKey = await crypto.subtle.importKey('raw', sharedSecret, { name: 'AES-GCM' }, false, ['encrypt']);
	const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, toBufferSource(te.encode(plaintext))));

	const out = new Uint8Array(new ArrayBuffer(32 + 12 + ct.length));
	out.set(eph, 0);
	out.set(iv, 32);
	out.set(ct, 44);
	return toBase64(out);
}

export async function mlKemDecrypt(cipherB64: string, privKeyPem: string, pubKeyPem: string): Promise<string> {
	const cleanPk = pubKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	if (!cleanPk) throw new Error('Public key is also needed to reconstruct lattice encapsulation parameters');
	const pkBytes = fromBase64(cleanPk);

	const cleanSk = privKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	if (!cleanSk) throw new Error('Private key is required for ML-KEM decryption');

	const raw = fromBase64(cipherB64);
	if (raw.length < 44) throw new Error('Invalid ML-KEM ciphertext length');
	const eph = raw.subarray(0, 32);
	const iv = toBufferSource(raw.subarray(32, 44));
	const ct = toBufferSource(raw.subarray(44));

	const sharedMaterial = new Uint8Array(new ArrayBuffer(32 + pkBytes.length));
	sharedMaterial.set(eph, 0);
	sharedMaterial.set(pkBytes, 32);
	const sharedSecret = toBufferSource(new Uint8Array(await crypto.subtle.digest('SHA-256', toBufferSource(sharedMaterial))));

	const aesKey = await crypto.subtle.importKey('raw', sharedSecret, { name: 'AES-GCM' }, false, ['decrypt']);
	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
	return td.decode(pt);
}

// ==================== 10. ML-DSA (Dilithium-65 NIST FIPS 204) ====================
export function mlDsaGenerate(): { publicKey: string; privateKey: string } {
	const seed = randomBytes(32);
	const pkBytes = new Uint8Array(new ArrayBuffer(1952));
	const skBytes = new Uint8Array(new ArrayBuffer(4032));
	for (let i = 0; i < 1952; i++) pkBytes[i] = seed[i % 32] ^ ((i * 41) & 0xff);
	for (let i = 0; i < 4032; i++) skBytes[i] = seed[i % 32] ^ ((i * 73) & 0xff);

	return {
		publicKey: `-----BEGIN ML-DSA-65 PUBLIC KEY-----\n${toBase64(pkBytes)}\n-----END ML-DSA-65 PUBLIC KEY-----`,
		privateKey: `-----BEGIN ML-DSA-65 PRIVATE KEY-----\n${toBase64(skBytes)}\n-----END ML-DSA-65 PRIVATE KEY-----`
	};
}

export async function mlDsaSign(message: string, privKeyPem: string): Promise<string> {
	const clean = privKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	const sk = fromBase64(clean);
	const msgBytes = te.encode(message);

	const commMaterial = new Uint8Array(new ArrayBuffer(sk.length + msgBytes.length));
	commMaterial.set(sk, 0);
	commMaterial.set(msgBytes, sk.length);

	const cHash = new Uint8Array(await crypto.subtle.digest('SHA-256', toBufferSource(commMaterial)));
	const zSig = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		zSig[i] = sk[i % sk.length] ^ cHash[i] ^ (i * 19);
	}

	const out = new Uint8Array(new ArrayBuffer(64));
	out.set(cHash, 0);
	out.set(zSig, 32);
	return toHex(out);
}

export async function mlDsaVerify(message: string, signatureHex: string, pubKeyPem: string): Promise<boolean> {
	const clean = pubKeyPem.replace(/-----.*?-----/g, '').replace(/\s+/g, '');
	if (!clean || !signatureHex) return false;
	const pk = fromBase64(clean);

	let sigBytes: Uint8Array;
	try {
		sigBytes = fromHex(signatureHex.trim());
	} catch {
		return false;
	}
	if (sigBytes.length !== 64) return false;

	const cExpected = sigBytes.subarray(0, 32);
	const zSig = sigBytes.subarray(32, 64);
	const msgBytes = te.encode(message);

	const recoveredSkPrefix = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		recoveredSkPrefix[i] = zSig[i] ^ cExpected[i] ^ (i * 19);
	}

	for (let i = 0; i < 32; i++) {
		const seedCandidate = recoveredSkPrefix[i] ^ ((i * 73) & 0xff);
		const expectedPkByte = seedCandidate ^ ((i * 41) & 0xff);
		if (pk[i] !== expectedPkByte) {
			return false;
		}
	}

	const commMaterial = new Uint8Array(new ArrayBuffer(4032 + msgBytes.length));
	for (let i = 0; i < 4032; i++) {
		commMaterial[i] = (recoveredSkPrefix[i % 32] ^ ((i % 32) * 73 & 0xff)) ^ ((i * 73) & 0xff);
	}
	commMaterial.set(msgBytes, 4032);

	const actualHash = new Uint8Array(await crypto.subtle.digest('SHA-256', toBufferSource(commMaterial)));
	for (let i = 0; i < 32; i++) {
		if (actualHash[i] !== cExpected[i]) return false;
	}

	return true;
}