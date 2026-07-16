/**
 * Encrypts the two drill tiers:
 *   drill-data/*.json       -> public/drills.enc       (personal, full password)
 *   drill-data/open/*.json  -> public/drills-open.enc  (professional, guest password)
 *
 * Two payloads, two independent keys. A guest password holder cannot decrypt
 * the personal payload — the separation is cryptographic, not an if-statement.
 * drill-data/ is gitignored plaintext (built by the 16:30 job); the .enc files
 * are committed ciphertext, safe to publish.
 *
 * Usage:  node scripts/encrypt-drills.mjs "<full-password>" "<guest-password>"
 */
import { webcrypto as crypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ITERATIONS = 600_000;

const fullPass = process.argv[2];
const guestPass = process.argv[3];
if (!fullPass || !guestPass) {
  console.error('Usage: node scripts/encrypt-drills.mjs "<full-password>" "<guest-password>"');
  process.exit(1);
}

function readDrills(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const drills = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    try {
      drills.push(JSON.parse(raw));
    } catch (err) {
      console.error(`Skipping ${path.join(dir, file)}: not valid JSON (${err.message})`);
    }
  }
  drills.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return drills;
}

async function encryptTo(outFile, drills, password) {
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
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(
    outFile,
    JSON.stringify({
      v: 1,
      kdf: { salt: b64(salt), iterations: ITERATIONS },
      iv: b64(iv),
      ct: b64(ct),
    }),
  );
}

const personal = readDrills(path.join(ROOT, "drill-data"));
const open = readDrills(path.join(ROOT, "drill-data", "open"));

if (personal.length === 0) {
  console.error("No personal drill files found - refusing to write an empty payload.");
  process.exit(1);
}

// Belt-and-braces: a professional drill must never carry the personal fields.
// If the generator slips, strip rather than publish.
for (const d of open) {
  delete d.askSenior;
}

await encryptTo(path.join(ROOT, "public", "drills.enc"), personal, fullPass);
// The guest payload is always written, even empty, so the frontend's fetch
// never 404s and the wrong-password path stays indistinguishable.
await encryptTo(path.join(ROOT, "public", "drills-open.enc"), open, guestPass);

console.log(
  `Encrypted ${personal.length} personal drill(s) -> public/drills.enc, ` +
    `${open.length} open drill(s) -> public/drills-open.enc`,
);
