/**
 * Drill decryption.
 *
 * Why this exists: GitHub Pages is static, so there is no server to check a
 * password against. A JS "login" would be theatre — the data would already be
 * in the browser. So the drill payload is shipped as real AES-GCM ciphertext
 * and the password is the key. Without it, drills.enc is noise, both in the
 * bundle and in the public repo.
 *
 * The matching encryptor is scripts/encrypt-drills.mjs.
 */

export type DrillQuestion = {
  q: string;
  mustSay: string[];
  shape: string;
};

export type Drill = {
  date: string;
  focus: string;
  questions: DrillQuestion[];
  lingo: { natural: string; better: string }[];
  word: { term: string; meaning: string; sentence: string; giveaway: string };
  fromBefore: string[];
  askSenior: string;
};

type Payload = {
  v: number;
  kdf: { salt: string; iterations: number };
  iv: string;
  ct: string;
};

/** Returns ArrayBuffer, not Uint8Array: WebCrypto wants a BufferSource and
 *  TS 5.7 no longer widens Uint8Array<ArrayBufferLike> to one. */
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer, iterations: number) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

/** Throws on a wrong password — AES-GCM authentication fails, which is the check. */
export async function decryptDrills(payload: Payload, password: string): Promise<Drill[]> {
  const key = await deriveKey(password, b64ToBuf(payload.kdf.salt), payload.kdf.iterations);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBuf(payload.iv) },
    key,
    b64ToBuf(payload.ct),
  );
  const drills = JSON.parse(new TextDecoder().decode(plain)) as Drill[];
  // Newest first.
  return drills.sort((a, b) => b.date.localeCompare(a.date));
}

export async function fetchPayload(): Promise<Payload | null> {
  // Relative on purpose: the app lives at the site root under a hash route
  // ("/#/drill"), so "drills.enc" resolves to the site root on both
  // localhost and doli4.github.io without hardcoding either.
  const res = await fetch("drills.enc", { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Payload;
}
