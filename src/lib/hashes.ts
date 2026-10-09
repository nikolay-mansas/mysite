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
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// ---------- utils ----------
export const toHex = bytesToHex;

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

// ---------- SHA-3 / Keccak ----------
export const sha3_224 = (b: Uint8Array) => _sha3_224(b);
export const sha3_256 = (b: Uint8Array) => _sha3_256(b);
export const sha3_384 = (b: Uint8Array) => _sha3_384(b);
export const sha3_512 = (b: Uint8Array) => _sha3_512(b);
export const keccak256 = (b: Uint8Array) => keccak_256(b);

// ---------- BLAKE2 ----------
export function blake2b(bytes: Uint8Array, outLen = 64): Uint8Array {
	return _blake2b(bytes, { dkLen: outLen });
}
export function blake2s(bytes: Uint8Array, outLen = 32): Uint8Array {
	return _blake2s(bytes, { dkLen: outLen });
}

// ---------- MD5 / RIPEMD-160 ----------
export function md5(bytes: Uint8Array): Uint8Array {
	return _md5(bytes);
}
export function ripemd160(bytes: Uint8Array): Uint8Array {
	return _ripemd160(bytes);
}