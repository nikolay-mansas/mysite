import { md5, sha1 } from "@noble/hashes/legacy.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";
import {
  argon2id,
  bcrypt as wasmBcrypt,
  scrypt as wasmScrypt,
  pbkdf2 as wasmPbkdf2,
  createSHA256,
  createSHA512,
  md4,
} from "hash-wasm";

const te = new TextEncoder();

const CRYPT_B64_CHARS =
  "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const CRYPT_B64 = CRYPT_B64_CHARS;

const BCRYPT_B64 =
  "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const MYSQL_SALT_CHARS = CRYPT_B64_CHARS;

const CRYPT_SALT_RE = /^[./A-Za-z0-9]+$/;
const BCRYPT_SALT_RE = /^(\$2[aby]\$\d{2}\$)?[./A-Za-z0-9]+$/;

const MAX_PHPASS_ITER = 1 << 24;

export function bytesToHex(b: Uint8Array): string {
  let out = "";
  for (let i = 0; i < b.length; i++) out += b[i].toString(16).padStart(2, "0");
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function clampInt(
  value: number | undefined,
  def: number,
  min: number,
  max: number,
): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function clampRounds(r: number | undefined): number {
  return clampInt(r, 5000, 1000, 999_999_999);
}

function sanitizeCryptSalt(
  input: string | undefined,
  maxLen: number,
): string | null {
  const s = input?.trim();
  if (!s) return null;
  if (!CRYPT_SALT_RE.test(s)) return null;
  return s.slice(0, maxLen);
}

function saltToBytes(
  input: string | undefined,
  defaultLen: number,
): Uint8Array {
  const s = input?.trim();
  if (!s) return randomBytes(defaultLen);
  if (/^[0-9a-f]+$/i.test(s) && s.length % 2 === 0) return hexToBytes(s);
  return te.encode(s);
}

function cryptB64Encode(bytes: Uint8Array, expectedLen?: number): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const v = b0 | (b1 << 8) | (b2 << 16);
    out += CRYPT_B64_CHARS[v & 0x3f];
    out += CRYPT_B64_CHARS[(v >> 6) & 0x3f];
    out += CRYPT_B64_CHARS[(v >> 12) & 0x3f];
    out += CRYPT_B64_CHARS[(v >> 18) & 0x3f];
  }
  const len = expectedLen ?? Math.ceil((bytes.length * 8) / 6);
  return out.slice(0, len);
}

const TRANSPOSE_256 = [
  20, 10, 0, 11, 1, 21, 2, 22, 12, 23, 13, 3, 14, 4, 24, 5, 25, 15, 26, 16, 6,
  17, 7, 27, 8, 28, 18, 29, 19, 9, 30, 31,
];
const TRANSPOSE_512 = [
  42, 21, 0, 1, 43, 22, 23, 2, 44, 45, 24, 3, 4, 46, 25, 26, 5, 47, 48, 27, 6,
  7, 49, 28, 29, 8, 50, 51, 30, 9, 10, 52, 31, 32, 11, 53, 54, 33, 12, 13, 55,
  34, 35, 14, 56, 57, 36, 15, 16, 58, 37, 38, 17, 59, 60, 39, 18, 19, 61, 40,
  41, 20, 62, 63,
];

function transposeBytes(bytes: Uint8Array, map: number[]): Uint8Array {
  const out = new Uint8Array(map.length);
  for (let i = 0; i < map.length; i++) out[i] = bytes[map[i]];
  return out;
}

export function bcryptSaltBytes(): Uint8Array {
  return randomBytes(16);
}

export function decodeBcryptSalt(saltStr: string): Uint8Array {
  const clean = saltStr.replace(/^\$2[aby]\$\d{2}\$/, "");
  const bytes = new Uint8Array(16);
  let bitPos = 0;
  for (let i = 0; i < clean.length && bitPos < 128; i++) {
    const idx = BCRYPT_B64.indexOf(clean[i]);
    if (idx < 0) continue;
    for (let b = 5; b >= 0 && bitPos < 128; b--) {
      if (idx & (1 << b)) bytes[bitPos >> 3] |= 1 << (7 - (bitPos & 7));
      bitPos++;
    }
  }
  return bytes;
}

export async function bcryptHash(
  password: string,
  opts: { cost?: number; salt?: string } = {},
): Promise<string> {
  const cost = clampInt(opts.cost, 10, 4, 20);

  const trimmed = opts.salt?.trim();
  const useUserSalt = !!trimmed && BCRYPT_SALT_RE.test(trimmed);
  const saltBytes = useUserSalt
    ? decodeBcryptSalt(trimmed!)
    : bcryptSaltBytes();

  return await wasmBcrypt({
    password,
    salt: saltBytes,
    costFactor: cost,
    outputType: "encoded",
  });
}

export async function argon2idHash(
  password: string,
  opts: {
    memory?: number;
    iterations?: number;
    parallelism?: number;
    hashLength?: number;
    salt?: string;
  } = {},
): Promise<string> {
  const saltBytes = saltToBytes(opts.salt, 16);
  return await argon2id({
    password,
    salt: saltBytes,
    parallelism: clampInt(opts.parallelism, 1, 1, 255),
    iterations: clampInt(opts.iterations, 3, 1, 1024),
    memorySize: clampInt(opts.memory, 65536, 8, 1 << 21),
    hashLength: clampInt(opts.hashLength, 32, 4, 1024),
    outputType: "encoded",
  });
}

export async function scryptHash(
  password: string,
  opts: {
    N?: number;
    r?: number;
    p?: number;
    dkLen?: number;
    salt?: string;
  } = {},
): Promise<string> {
  const saltBytes = saltToBytes(opts.salt, 16);
  const saltHex = bytesToHex(saltBytes);
  const N = clampInt(opts.N, 16384, 2, 1 << 20);
  const r = clampInt(opts.r, 8, 1, 32);
  const p = clampInt(opts.p, 1, 1, 16);
  const dkLen = clampInt(opts.dkLen, 32, 1, 1024);
  const hash = await wasmScrypt({
    password,
    salt: saltBytes,
    costFactor: N,
    blockSize: r,
    parallelism: p,
    hashLength: dkLen,
    outputType: "hex",
  });
  return `$scrypt$ln=${Math.log2(N)},r=${r},p=${p}$${saltHex}$${hash}`;
}

export async function pbkdf2Hash(
  password: string,
  opts: {
    hash?: "SHA-256" | "SHA-512";
    iterations?: number;
    dkLen?: number;
    salt?: string;
  } = {},
): Promise<string> {
  const saltBytes = saltToBytes(opts.salt, 16);
  const saltHex = bytesToHex(saltBytes);
  const iterations = clampInt(opts.iterations, 600000, 1, 100_000_000);
  const hash = opts.hash ?? "SHA-256";
  const dkLen = clampInt(opts.dkLen, 32, 1, 1024);

  const hashFn = hash === "SHA-512" ? createSHA512() : createSHA256();

  const hashHex = await wasmPbkdf2({
    password,
    salt: saltBytes,
    iterations,
    hashFunction: hashFn,
    hashLength: dkLen,
    outputType: "hex",
  });
  return `pbkdf2-${hash.toLowerCase()}$${iterations}$${saltHex}$${hashHex}`;
}

export async function ntlmHash(password: string): Promise<string> {
  const buf = new Uint8Array(password.length * 2);
  for (let i = 0; i < password.length; i++) {
    const code = password.charCodeAt(i);
    buf[i * 2] = code & 0xff;
    buf[i * 2 + 1] = (code >> 8) & 0xff;
  }
  return (await md4(buf)).toUpperCase();
}

function md5cryptCore(password: string, salt: string, magic: string): string {
  const pw = te.encode(password);
  const saltBytes = te.encode(salt);

  const B = md5(concat(pw, saltBytes, pw));

  const aParts: Uint8Array[] = [pw, te.encode(magic), saltBytes];
  let cnt = pw.length;
  while (cnt > 16) {
    aParts.push(B);
    cnt -= 16;
  }
  aParts.push(B.subarray(0, cnt));

  for (cnt = pw.length; cnt > 0; cnt >>= 1) {
    if (cnt & 1) aParts.push(new Uint8Array([0]));
    else aParts.push(pw.subarray(0, 1));
  }
  let A = md5(concat(...aParts));

  for (let round = 0; round < 1000; round++) {
    const parts: Uint8Array[] = [];
    if (round & 1) parts.push(pw);
    else parts.push(A);
    if (round % 3) parts.push(saltBytes);
    if (round % 7) parts.push(pw);
    if (round & 1) parts.push(A);
    else parts.push(pw);
    A = md5(concat(...parts));
  }

  const map = [12, 6, 0, 13, 7, 1, 14, 8, 2, 15, 9, 3, 5, 10, 4, 11];
  const encoded = cryptB64Encode(transposeBytes(A, map), 22);
  return `${magic}${salt}$${encoded}`;
}

export function md5crypt(password: string, salt?: string): string {
  const s = sanitizeCryptSalt(salt, 8) ?? bytesToHex(randomBytes(4));
  return md5cryptCore(password, s, "$1$");
}

export function apr1(password: string, salt?: string): string {
  const s = sanitizeCryptSalt(salt, 8) ?? bytesToHex(randomBytes(4));
  return md5cryptCore(password, s, "$apr1$");
}

function shaCryptCore(
  password: string,
  salt: string,
  rounds: number,
  algo: "sha256" | "sha512",
): Uint8Array {
  const is256 = algo === "sha256";
  const H = is256 ? sha256 : sha512;
  const hashLen = is256 ? 32 : 64;
  const pw = te.encode(password);
  const saltBytes = te.encode(salt);
  const pwdLen = pw.length;
  const saltLen = saltBytes.length;

  const db = H(concat(pw, saltBytes, pw));

  const aParts: Uint8Array[] = [pw, saltBytes];
  let rem = pwdLen;
  while (rem > 0) {
    aParts.push(db.subarray(0, Math.min(rem, db.length)));
    rem -= db.length;
  }
  for (let i = pwdLen; i > 0; i >>= 1) {
    if (i & 1) aParts.push(db);
    else aParts.push(pw);
  }
  const da = H(concat(...aParts));

  const pwRep = new Uint8Array(pwdLen * pwdLen);
  for (let i = 0; i < pwdLen; i++) pwRep.set(pw, i * pwdLen);
  const dpHash = H(pwRep);

  const dp = new Uint8Array(pwdLen);
  for (let i = 0; i < pwdLen; i++) dp[i] = dpHash[i % hashLen];

  const saltRep = new Uint8Array(saltLen * (16 + da[0]));
  for (let i = 0; i < 16 + da[0]; i++) saltRep.set(saltBytes, i * saltLen);
  const dsHash = H(saltRep);

  const ds = new Uint8Array(saltLen);
  for (let i = 0; i < saltLen; i++) ds[i] = dsHash[i % hashLen];

  let dc = da;
  for (let i = 0; i < rounds; i++) {
    const parts: Uint8Array[] = [];
    if (i & 1) parts.push(dp);
    else parts.push(dc);
    if (i % 3) parts.push(ds);
    if (i % 7) parts.push(dp);
    if (i & 1) parts.push(dc);
    else parts.push(dp);
    dc = H(concat(...parts));
  }

  return dc;
}

function shaCrypt(
  password: string,
  salt: string,
  rounds: number,
  algo: "sha256" | "sha512",
): string {
  const is256 = algo === "sha256";
  const numId = is256 ? "5" : "6";
  const saltPrefix =
    rounds === 5000 ? `$${numId}$` : `$${numId}$rounds=${rounds}$`;

  const dc = shaCryptCore(password, salt, rounds, algo);
  const map = is256 ? TRANSPOSE_256 : TRANSPOSE_512;
  const expectedLen = is256 ? 43 : 86;
  const encoded = cryptB64Encode(transposeBytes(dc, map), expectedLen);
  return `${saltPrefix}${salt}$${encoded}`;
}

function sha256CryptDigest(
  password: string,
  salt: string,
  rounds: number,
): string {
  const dc = shaCryptCore(password, salt, rounds, "sha256");
  return cryptB64Encode(transposeBytes(dc, TRANSPOSE_256), 43);
}

export function sha256crypt(
  password: string,
  salt?: string,
  rounds = 5000,
): string {
  rounds = clampRounds(rounds);
  const s = sanitizeCryptSalt(salt, 16) ?? bytesToHex(randomBytes(8));
  return shaCrypt(password, s, rounds, "sha256");
}

export function sha512crypt(
  password: string,
  salt?: string,
  rounds = 5000,
): string {
  rounds = clampRounds(rounds);
  const s = sanitizeCryptSalt(salt, 16) ?? bytesToHex(randomBytes(8));
  return shaCrypt(password, s, rounds, "sha512");
}

function phpassSalt(): string {
  return cryptB64Encode(randomBytes(6), 8);
}

export function phpass(
  password: string,
  salt?: string,
  iterations = 8192,
): string {
  const iter = clampInt(iterations, 8192, 16, MAX_PHPASS_ITER);
  let log2 = 6;
  while (1 << log2 < iter && log2 < 31) log2++;
  const iterChar = CRYPT_B64[log2];

  const userSalt = sanitizeCryptSalt(salt, 8);
  const saltBody = userSalt && userSalt.length === 8 ? userSalt : phpassSalt();

  let h = md5(concat(te.encode(saltBody), te.encode(password)));
  for (let i = 0; i < iter; i++) h = md5(concat(h, te.encode(password)));

  return `$P$${iterChar}${saltBody}${cryptB64Encode(h, 22)}`;
}

export async function scramSha256(
  password: string,
  salt?: string,
  iterations = 4096,
): Promise<string> {
  const saltBytes = salt?.trim() ? te.encode(salt.trim()) : randomBytes(16);
  const saltB64 = btoa(String.fromCharCode(...saltBytes));
  const iters = clampInt(iterations, 4096, 1, 100_000_000);

  const hashFn = createSHA256();

  const saltedPassword = await wasmPbkdf2({
    password,
    salt: saltBytes,
    iterations: iters,
    hashFunction: hashFn,
    hashLength: 32,
    outputType: "binary",
  });
  const clientKey = hmac(sha256, saltedPassword, te.encode("Client Key"));
  const storedKey = sha256(clientKey);
  const serverKey = hmac(sha256, saltedPassword, te.encode("Server Key"));
  const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
  return `SCRAM-SHA-256$${iters}:${saltB64}$${toB64(storedKey)}:${toB64(serverKey)}`;
}

export async function cramSha1(
  password: string,
  challenge: string,
): Promise<string> {
  const mac = hmac(sha1, te.encode(password), te.encode(challenge));
  return btoa(String.fromCharCode(...mac));
}

export async function cachingSha2Password(password: string): Promise<string> {
  const saltBytes = randomBytes(20);
  const salt = Array.from(saltBytes)
    .map((b) => MYSQL_SALT_CHARS[b % MYSQL_SALT_CHARS.length])
    .join("");

  const digest = sha256CryptDigest(password, salt, 5000);
  return `$A$005$${salt}${digest}`;
}

export function cachingSha2PasswordHex(password: string): Promise<string> {
  return cachingSha2Password(password).then(
    (hash) =>
      "0x" +
      Array.from(te.encode(hash), (b) => b.toString(16).padStart(2, "0")).join(
        "",
      ),
  );
}

export async function mysqlNativePassword(password: string): Promise<string> {
  const inner = sha1(te.encode(password));
  const outer = sha1(inner);
  return "*" + bytesToHex(outer).toUpperCase();
}

export type PasswordAlgoId =
  | "bcrypt"
  | "argon2id"
  | "scrypt"
  | "pbkdf2-sha256"
  | "pbkdf2-sha512"
  | "ntlm"
  | "md5crypt"
  | "sha256crypt"
  | "sha512crypt"
  | "apr1"
  | "phpass"
  | "scram-sha-256"
  | "cram-sha-1"
  | "caching-sha2-password"
  | "mysql-native-password";

export interface PasswordOptions {
  salt?: string;
  cost?: number;
  memory?: number;
  iterations?: number;
  parallelism?: number;
  hashLength?: number;
  N?: number;
  r?: number;
  p?: number;
  rounds?: number;
  challenge?: string;
}

export async function hashPassword(
  algo: PasswordAlgoId,
  password: string,
  opts: PasswordOptions = {},
): Promise<string> {
  switch (algo) {
    case "bcrypt":
      return await bcryptHash(password, {
        cost: opts.cost ?? 10,
        salt: opts.salt,
      });
    case "argon2id":
      return await argon2idHash(password, {
        memory: opts.memory,
        iterations: opts.iterations,
        parallelism: opts.parallelism,
        hashLength: opts.hashLength,
        salt: opts.salt,
      });
    case "scrypt":
      return await scryptHash(password, {
        N: opts.N,
        r: opts.r,
        p: opts.p,
        dkLen: opts.hashLength,
        salt: opts.salt,
      });
    case "pbkdf2-sha256":
      return await pbkdf2Hash(password, {
        hash: "SHA-256",
        iterations: opts.iterations,
        dkLen: opts.hashLength,
        salt: opts.salt,
      });
    case "pbkdf2-sha512":
      return await pbkdf2Hash(password, {
        hash: "SHA-512",
        iterations: opts.iterations,
        dkLen: opts.hashLength,
        salt: opts.salt,
      });
    case "ntlm":
      return await ntlmHash(password);
    case "md5crypt":
      return md5crypt(password, opts.salt);
    case "sha256crypt":
      return sha256crypt(password, opts.salt, opts.rounds);
    case "sha512crypt":
      return sha512crypt(password, opts.salt, opts.rounds);
    case "apr1":
      return apr1(password, opts.salt);
    case "phpass":
      return phpass(password, opts.salt, opts.iterations ?? 8192);
    case "scram-sha-256":
      return await scramSha256(password, opts.salt, opts.iterations ?? 4096);
    case "cram-sha-1":
      return await cramSha1(password, opts.challenge ?? "");
    case "caching-sha2-password":
      return await cachingSha2PasswordHex(password);
    case "mysql-native-password":
      return await mysqlNativePassword(password);
  }
}
