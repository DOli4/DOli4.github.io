/**
 * Encrypts drill-data/*.json -> public/drills.enc
 *
 * drill-data/ is gitignored plaintext (built by the 16:30 job).
 * public/drills.enc is committed ciphertext and safe to publish: without the
 * password it is noise, in the bundle and in the public repo alike.
 *
 * Usage:  node scripts/encrypt-drills.mjs "<password>"
 */
import { webcrypto as crypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "drill-data");
const OUT = path.join(ROOT, "public", "drills.enc");
const ITERATIONS = 600_000;

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/encrypt-drills.mjs \"<password>\"");
  process.exit(1);
}

if (!fs.existsSync(SRC)) {
  console.error(`No drill-data directory at ${SRC} - nothing to encrypt.`);
  process.exit(1);
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("No drill JSON files found - nothing to encrypt.");
  process.exit(1);
}

const drills = [];
for (const file of files) {
  const raw = fs.readFileSync(path.join(SRC, file), "utf8");
  try {
    drills.push(JSON.parse(raw));
  } catch (err) {
    console.error(`Skipping ${file}: not valid JSON (${err.message})`);
  }
}
if (drills.length === 0) {
  console.error("Every drill file failed to parse - refusing to write an empty payload.");
  process.exit(1);
}
drills.sort((a, b) => String(b.date).localeCompare(String(a.date)));

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const base = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveKey"],
);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  base,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);
const ct = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  new TextEncoder().encode(JSON.stringify(drills)),
);

const b64 = (buf) => Buffer.from(buf).toString("base64");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify({
    v: 1,
    kdf: { salt: b64(salt), iterations: ITERATIONS },
    iv: b64(iv),
    ct: b64(ct),
  }),
);

console.log(`Encrypted ${drills.length} drill(s) -> ${path.relative(ROOT, OUT)}`);
