import { base64, base64urlnopad, base32, hex } from "@scure/base";
import { encode as heEncode, decode as heDecode } from "he";
import { v4 as uuidv4Lib } from "uuid";

const te = new TextEncoder();
const td = new TextDecoder();

function toBytes(input: Uint8Array): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(input.length);
  const out = new Uint8Array(buf);
  out.set(input);
  return out;
}

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(n);
  const out = new Uint8Array(buf);
  crypto.getRandomValues(out);
  return out;
}

// ---------- Base64 ----------
export const b64encode = (s: string): string => base64.encode(te.encode(s));
export const b64decode = (s: string): string => td.decode(base64.decode(s));

// ---------- Base64 URL-safe (no padding) ----------
export const b64urlEncode = (s: string): string =>
  base64urlnopad.encode(te.encode(s));
export const b64urlDecode = (s: string): string =>
  td.decode(base64urlnopad.decode(s));

// ---------- Base32 (RFC 4648) ----------
export const b32encode = (s: string): string => base32.encode(te.encode(s));
export const b32decode = (s: string): string => td.decode(base32.decode(s));

// ---------- Hex ----------
export const hexEncode = (s: string): string => hex.encode(te.encode(s));
export const hexDecode = (s: string): string => td.decode(hex.decode(s));

// ---------- URL ----------
export const urlEncode = (s: string) => encodeURIComponent(s);
export const urlDecode = (s: string) => decodeURIComponent(s);

// ---------- HTML entities ----------
export const htmlEncode = (s: string): string => heEncode(s);
export const htmlDecode = (s: string): string => heDecode(s);

// ---------- ROT13 ----------
export function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

// ---------- Binary / ASCII decimal ----------
export function binaryEncode(s: string): string {
  return Array.from(te.encode(s), (b) => b.toString(2).padStart(8, "0")).join(
    " ",
  );
}
export function binaryDecode(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  const bytes = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    if (!/^[01]{1,8}$/.test(parts[i])) throw new Error("Invalid binary");
    const v = parseInt(parts[i], 2);
    if (v > 255) throw new Error("Invalid binary");
    bytes[i] = v;
  }
  return td.decode(bytes);
}
export function asciiEncode(s: string): string {
  return Array.from(te.encode(s)).join(" ");
}
export function asciiDecode(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  const bytes = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    const v = parseInt(parts[i], 10);
    if (Number.isNaN(v) || v < 0 || v > 255)
      throw new Error("Invalid ASCII code");
    bytes[i] = v;
  }
  return td.decode(bytes);
}

// ---------- Classical ciphers ----------
export function xorCipher(s: string, keyHex: string): string {
  const key = hexToBytes(keyHex);
  if (key.length === 0) throw new Error("Empty key");
  const bytes = te.encode(s);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++)
    out[i] = bytes[i] ^ key[i % key.length];
  return bytesToHex(out);
}
export function xorDecipher(s: string, keyHex: string): string {
  const key = hexToBytes(keyHex);
  if (key.length === 0) throw new Error("Empty key");
  const bytes = hexToBytes(s.trim());
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++)
    out[i] = bytes[i] ^ key[i % key.length];
  return td.decode(out);
}
export function caesar(s: string, shift: number): string {
  const n = ((shift % 26) + 26) % 26;
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + n) % 26) + base);
  });
}
export function vigenere(s: string, key: string, decrypt = false): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!k) throw new Error("Empty key");
  let ki = 0;
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    const kShift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    const shift = decrypt ? -kShift : kShift;
    return String.fromCharCode(
      ((((c.charCodeAt(0) - base + shift) % 26) + 26) % 26) + base,
    );
  });
}

// ---------- AES-GCM ----------
export async function aesEncrypt(
  plaintext: string,
  password: string,
): Promise<string> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const km = await crypto.subtle.importKey(
    "raw",
    te.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
    km,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      te.encode(plaintext),
    ),
  );
  const combined = new Uint8Array(salt.length + iv.length + ct.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ct, salt.length + iv.length);
  return bytesToBase64(combined);
}

export async function aesDecrypt(
  cipherB64: string,
  password: string,
): Promise<string> {
  const combined = base64ToBytes(cipherB64.trim());
  const salt = toBytes(combined.subarray(0, 16));
  const iv = toBytes(combined.subarray(16, 28));
  const ct = toBytes(combined.subarray(28));
  const km = await crypto.subtle.importKey(
    "raw",
    te.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
    km,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return td.decode(pt);
}

// ---------- UUID ----------
export function uuidv4(): string {
  return globalThis.crypto?.randomUUID?.() ?? uuidv4Lib();
}

// ---------- helpers ----------
function hexToBytes(hexStr: string): Uint8Array<ArrayBuffer> {
  const clean = hexStr.replace(/\s+/g, "");
  if (clean.length % 2) throw new Error("Odd-length hex");
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error("Invalid hex");
  return toBytes(hex.decode(clean.toLowerCase()));
}

function bytesToHex(b: Uint8Array): string {
  return hex.encode(b);
}

function bytesToBase64(b: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
