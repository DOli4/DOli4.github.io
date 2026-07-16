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
  /** Personal tier only — the professional payload never carries this. */
  askSenior?: string;
};

/** Which payload a password opened. "full" sees everything;
 *  "open" is the shareable guest tier: professional drills, no personal data. */
export type Tier = "full" | "open";

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

export async function fetchPayload(
  name: "drills.enc" | "drills-open.enc" = "drills.enc",
): Promise<Payload | null> {
  // Relative on purpose: the app lives at the site root under a hash route
  // ("/#/drill"), so "drills.enc" resolves to the site root on both
  // localhost and doli4.github.io without hardcoding either.
  const res = await fetch(name, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Payload;
}

/**
 * Tries the entered password against the personal payload first, then the
 * guest payload. Which one decrypts decides the tier — there is no password
 * list in the code, and a guest key mathematically cannot open the personal
 * ciphertext.
 */
export async function unlockAny(
  password: string,
): Promise<{ drills: Drill[]; tier: Tier } | "missing" | "wrong"> {
  const full = await fetchPayload("drills.enc");
  if (!full) return "missing";
  try {
    return { drills: await decryptDrills(full, password), tier: "full" };
  } catch {
    /* not the full-tier password — try guest */
  }
  const open = await fetchPayload("drills-open.enc");
  if (open) {
    try {
      return { drills: await decryptDrills(open, password), tier: "open" };
    } catch {
      /* not the guest password either */
    }
  }
  return "wrong";
}
