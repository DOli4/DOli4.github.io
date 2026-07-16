/**
 * Artifact links — things Dieter saves to reopen later (shared Claude
 * artifacts, dashboards, docs). Stored in localStorage: this is a static
 * site with no backend, so the list is private to the browser it was added
 * in. Home PC and work laptop each keep their own list.
 */

export type Artifact = {
  id: string;
  title: string;
  url: string;
  note?: string;
  addedAt: string; // yyyy-mm-dd
};

const KEY = "drill-artifacts";

export function loadArtifacts(): Artifact[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Artifact[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function save(list: Artifact[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Prepends https:// when the scheme is missing; rejects anything that still
 *  isn't a fetchable http(s) URL so junk can't become a dead card. */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.href;
  } catch {
    return null;
  }
}

export function addArtifact(title: string, url: string, note?: string): Artifact[] {
  const list = loadArtifacts();
  const item: Artifact = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim() || hostOf(url),
    url,
    note: note?.trim() || undefined,
    addedAt: new Date().toISOString().slice(0, 10),
  };
  const next = [item, ...list];
  save(next);
  return next;
}

export function removeArtifact(id: string): Artifact[] {
  const next = loadArtifacts().filter((a) => a.id !== id);
  save(next);
  return next;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
