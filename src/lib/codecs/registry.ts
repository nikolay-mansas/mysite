import {
	b64encode, b64decode,
	b64urlEncode, b64urlDecode,
	b32encode, b32decode,
	hexEncode, hexDecode,
	urlEncode, urlDecode,
	htmlEncode, htmlDecode,
	rot13,
	binaryEncode, binaryDecode,
	asciiEncode, asciiDecode,
} from '$lib/codecs';

export type Codec = {
	id: string;
	label: string;
	encode: (input: string) => string;
	decode: (input: string) => string;
	selfInverse?: boolean;
};

const registry = new Map<string, Codec>();
const order: string[] = [];

export function registerCodec(codec: Codec): void {
	if (registry.has(codec.id)) return;
	registry.set(codec.id, codec);
	order.push(codec.id);
}

export const getCodec = (id: string): Codec | undefined => registry.get(id);
export const hasCodec = (id: string): boolean => registry.has(id);
export const listCodecs = (): Codec[] => order.map((id) => registry.get(id)!);
export const getDefaultCodec = (): Codec => registry.get(order[0])!;

registerCodec({ id: 'base64',    label: 'Base64',            encode: b64encode,    decode: b64decode });
registerCodec({ id: 'base64url', label: 'Base64 URL',        encode: b64urlEncode, decode: b64urlDecode });
registerCodec({ id: 'base32',    label: 'Base32 (RFC 4648)', encode: b32encode,    decode: b32decode });
registerCodec({ id: 'hex',       label: 'Hex',               encode: hexEncode,    decode: hexDecode });
registerCodec({ id: 'url',       label: 'URL (percent)',     encode: urlEncode,    decode: urlDecode });
registerCodec({ id: 'html',      label: 'HTML entities',     encode: htmlEncode,   decode: htmlDecode });
registerCodec({ id: 'rot13',     label: 'ROT13',             encode: rot13,        decode: rot13, selfInverse: true });
registerCodec({ id: 'binary',    label: 'Binary (base 2)',   encode: binaryEncode, decode: binaryDecode });
registerCodec({ id: 'ascii',     label: 'ASCII decimal',     encode: asciiEncode,  decode: asciiDecode });