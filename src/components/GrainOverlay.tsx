const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
      `<filter id='grain'>` +
      `<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch' result='noise'/>` +
      `<feColorMatrix in='noise' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0'/>` +
      `</filter>` +
      `<rect width='100%' height='100%' filter='url(#grain)'/>` +
      `</svg>`
  );

/**
 * Fixed, full-viewport film-grain texture layered over the page.
 * Purely decorative: no pointer events, no motion, so it degrades
 * gracefully under prefers-reduced-motion (there is nothing to reduce).
 *
 * z-50 reserves the top of the stack for this overlay. Any future
 * nav/modal/toast that must render above it should use a higher
 * explicit value (e.g. z-[60]+) rather than also reaching for z-50.
 */
function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        backgroundImage: `url("${GRAIN_SVG}")`,
        backgroundRepeat: "repeat",
        opacity: 0.1,
        mixBlendMode: "overlay",
      }}
    />
  );
}

export default GrainOverlay;
