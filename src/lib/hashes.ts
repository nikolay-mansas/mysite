import {
	sha3_224 as _sha3_224,
	sha3_256 as _sha3_256,
	sha3_384 as _sha3_384,
	sha3_512 as _sha3_512,
	keccak_256,
} from '@noble/hashes/sha3.js';
import { blake2b as _blake2b, blake2s as _blake2s } from '@noble/hashes/blake2.js';
import {
	ripemd160 as _ripemd160,
	sha1,
	md5 as _md5,
} from '@noble/hashes/legacy.js';
import { hmac as _hmac } from '@noble/hashes/hmac.js';
import { sha224, sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// ---------- utils ----------
export const toHex = bytesToHex;

export function hexToBytes(hex: string): Uint8Array {
	const clean = hex.length % 2 !== 0 ? '0' + hex : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < clean.length; i += 2) {
		bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
	}
	return bytes;
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
	let total = 0;
	for (const a of arrays) total += a.length;
	const res = new Uint8Array(total);
	let offset = 0;
	for (const a of arrays) {
		res.set(a, offset);
		offset += a.length;
	}
	return res;
}

export function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

// ---------- Web Crypto ----------
export async function webDigest(
	algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512',
	bytes: Uint8Array
): Promise<Uint8Array> {
	const buf = await crypto.subtle.digest(algo, bytes as unknown as BufferSource);
	return new Uint8Array(buf);
}

// ---------- HMAC ----------
type HmacAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

const HMAC_HASHES = {
	'SHA-1': sha1,
	'SHA-256': sha256,
	'SHA-384': sha384,
	'SHA-512': sha512,
} as const;

export async function hmac(
	algo: HmacAlgo,
	key: Uint8Array,
	data: Uint8Array
): Promise<Uint8Array> {
	return _hmac(HMAC_HASHES[algo], key, data);
}

export function computeHmacSync(
	hashFn: (data: Uint8Array) => Uint8Array,
	blockSize: number,
	key: Uint8Array,
	message: Uint8Array
): Uint8Array {
	let k = key;
	if (k.length > blockSize) {
		k = hashFn(k);
	}
	if (k.length < blockSize) {
		const padded = new Uint8Array(blockSize);
		padded.set(k);
		k = padded;
	}

	const oKeyPad = new Uint8Array(blockSize);
	const iKeyPad = new Uint8Array(blockSize);
	for (let i = 0; i < blockSize; i++) {
		oKeyPad[i] = k[i] ^ 0x5c;
		iKeyPad[i] = k[i] ^ 0x36;
	}

	const inner = hashFn(concatBytes(iKeyPad, message));
	return hashFn(concatBytes(oKeyPad, inner));
}

export async function computeHmacAsync(
	hashFn: (data: Uint8Array) => Promise<Uint8Array>,
	blockSize: number,
	key: Uint8Array,
	message: Uint8Array
): Promise<Uint8Array> {
	let k = key;
	if (k.length > blockSize) {
		k = await hashFn(k);
	}
	if (k.length < blockSize) {
		const padded = new Uint8Array(blockSize);
		padded.set(k);
		k = padded;
	}

	const oKeyPad = new Uint8Array(blockSize);
	const iKeyPad = new Uint8Array(blockSize);
	for (let i = 0; i < blockSize; i++) {
		oKeyPad[i] = k[i] ^ 0x5c;
		iKeyPad[i] = k[i] ^ 0x36;
	}

	const inner = await hashFn(concatBytes(iKeyPad, message));
	return await hashFn(concatBytes(oKeyPad, inner));
}

export const nobleHmac = _hmac;
export {
	sha224,
	sha256,
	sha384,
	sha512,
	_sha3_224 as sha3_224,
	_sha3_256 as sha3_256,
	_sha3_384 as sha3_384,
	_sha3_512 as sha3_512,
	keccak_256 as keccak256,
	_blake2b as blake2b,
	_blake2s as blake2s,
	_ripemd160 as ripemd160,
	sha1,
	_md5 as md5
};