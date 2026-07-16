import { useState } from "react";
import { LampHeader } from "../../components/ui/lamp";
import type { Tier } from "../../lib/drill-crypto";
import {
  hostOf,
  loadArtifacts,
  removeArtifact,
  visibleArtifacts,
  type Artifact,
} from "../../lib/artifacts";
import { ArtifactQuickAdd } from "./Dashboard";

/**
 * The vault: every saved link as a pressable card. Add here or on the
 * dashboard — same localStorage underneath, so they never disagree.
 * Guests (IAMUSER) never see artifacts tagged personal.
 */
export default function Artifacts({ tier }: { tier: Tier }) {
  const [allArtifacts, setAllArtifacts] = useState<Artifact[]>(loadArtifacts);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const artifacts = visibleArtifacts(allArtifacts, tier);

  return (
    <>
      <LampHeader
        eyebrow={`${artifacts.length} SAVED`}
        title="ARTIFACTS"
        sub="links worth keeping — shared Claude artifacts, docs, dashboards"
      />

      <div className="wrap drill-wrap dash-wrap">
        <section className="drill-sec">
          <h2 className="drill-h2">
            <span className="drill-num">01</span> Add one
          </h2>
          <p className="drill-hint">
            Paste any link. Stored in this browser only — your work laptop and home PC each keep
            their own list.
          </p>
          <ArtifactQuickAdd onChange={setAllArtifacts} tier={tier} />
        </section>

        <section className="drill-sec">
          <h2 className="drill-h2">
            <span className="drill-num">02</span> Open one
          </h2>
          {artifacts.length === 0 ? (
            <p className="drill-empty">Nothing saved yet. Paste your first link above.</p>
          ) : (
            <div className="art-grid">
              {artifacts.map((a) => (
                <article key={a.id} className="art-card">
                  <a
                    className="art-card-main"
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-hover
                  >
                    <p className="art-card-title">
                      {a.title}
                      {a.personal && <span className="art-tag">personal</span>}
                    </p>
                    <p className="art-card-host">{hostOf(a.url)}</p>
                    {a.note && <p className="art-card-note">{a.note}</p>}
                    <p className="art-card-open">open →</p>
                  </a>
                  <footer className="art-card-foot">
                    <span className="art-card-date">{a.addedAt}</span>
                    {confirmId === a.id ? (
                      <span className="art-confirm">
                        delete?{" "}
                        <button
                          className="art-del art-yes"
                          onClick={() => {
                            setAllArtifacts(removeArtifact(a.id));
                            setConfirmId(null);
                          }}
                        >
                          yes
                        </button>
                        <button className="art-del" onClick={() => setConfirmId(null)}>
                          no
                        </button>
                      </span>
                    ) : (
                      <button
                        className="art-del"
                        onClick={() => setConfirmId(a.id)}
                        aria-label={`Delete ${a.title}`}
                      >
                        delete
                      </button>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
