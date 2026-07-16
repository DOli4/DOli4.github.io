import GlitchText from "./GlitchText";

/**
 * The site's title treatment v2 — replaces the full-width lamp band.
 * Glitch text over a soft radial glow, with an animated light-sweep
 * underline: the lamp's light, folded into the title itself.
 */
export default function NeonTitle({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <header className="neon">
      {eyebrow && <p className="neon-eyebrow">{eyebrow}</p>}
      <h1 className="neon-title">
        <GlitchText>{title}</GlitchText>
      </h1>
      <span className="neon-underline" aria-hidden />
      {sub && <p className="neon-sub">{sub}</p>}
    </header>
  );
}
