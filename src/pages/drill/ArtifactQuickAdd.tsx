import { useState } from "react";
import type { Tier } from "../../lib/drill-crypto";
import { addArtifact, normalizeUrl, type Artifact } from "../../lib/artifacts";

/** The add-a-link form, shared by the artifacts vault page and the dashboard's
 *  artifacts node. `compact` tightens it for use inside a canvas node. */
export function ArtifactQuickAdd({
  onChange,
  tier,
  compact,
}: {
  onChange: (list: Artifact[]) => void;
  tier: Tier;
  compact?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [personal, setPersonal] = useState(false);
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = normalizeUrl(url);
    if (!clean) {
      setErr("That doesn't look like a link.");
      return;
    }
    setErr("");
    // Guests can save links for themselves, but only the full tier can mark
    // something personal — the concept doesn't exist in guest mode.
    onChange(addArtifact(title, clean, { personal: tier === "full" && personal }));
    setTitle("");
    setUrl("");
    setPersonal(false);
  }

  return (
    <form className={`art-add${compact ? " art-add-compact" : ""}`} onSubmit={submit}>
      <input
        className="gate-input art-in"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="name (optional)"
        aria-label="Artifact name"
      />
      <input
        className="gate-input art-in art-in-url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="paste the link"
        aria-label="Artifact link"
        required
      />
      {tier === "full" && (
        <label className={`art-personal${personal ? " is-on" : ""}`} data-hover>
          <input
            type="checkbox"
            checked={personal}
            onChange={(e) => setPersonal(e.target.checked)}
          />
          personal
        </label>
      )}
      <button className="gate-btn art-btn" disabled={!url.trim()}>
        Save
      </button>
      {err && <p className="gate-err">{err}</p>}
    </form>
  );
}
