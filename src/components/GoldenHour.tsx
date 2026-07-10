import "./golden-hour.css";

/**
 * Golden-hour landing scene — a large, low sun sinking behind layered rolling
 * hills, with long grass swaying in the foreground. Original SVG; gentle motion
 * that pauses under prefers-reduced-motion. This is the bottom of the journey.
 */
export default function GoldenHour() {
  // A field of foreground grass blades, deterministic so it doesn't reflow.
  const blades = Array.from({ length: 60 }, (_, i) => {
    const x = (i / 59) * 1200 + ((i * 37) % 11) - 5;
    const h = 60 + ((i * 53) % 70);
    const lean = ((i * 29) % 14) - 7;
    const delay = (i % 7) * 0.4;
    return { x, h, lean, delay, i };
  });

  return (
    <svg
      className="golden"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="A golden-hour scene: a large low sun sinking behind rolling amber hills with long grass in the foreground."
    >
      <defs>
        <linearGradient id="gh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b4d74" />
          <stop offset="38%" stopColor="#c56f5e" />
          <stop offset="66%" stopColor="#eaa15a" />
          <stop offset="100%" stopColor="#f6cf72" />
        </linearGradient>
        <radialGradient id="gh-sun" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#fff6da" />
          <stop offset="30%" stopColor="#ffe6a6" />
          <stop offset="60%" stopColor="#ffcf7a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gh-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7e2" />
          <stop offset="70%" stopColor="#ffe9b0" />
          <stop offset="100%" stopColor="#ffd98a" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="1200" height="800" fill="url(#gh-sky)" />

      {/* Sun glow + disc, sitting low on the horizon */}
      <g className="gh-sun-group">
        <rect x="200" y="120" width="800" height="640" fill="url(#gh-sun)" />
        <circle cx="600" cy="470" r="120" fill="url(#gh-core)" />
      </g>

      {/* Drifting birds */}
      <g className="gh-birds" stroke="#5a3a3a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5">
        <path d="M360 210 q12 -10 24 0 q12 -10 24 0" />
        <path d="M430 240 q10 -8 20 0 q10 -8 20 0" />
        <path d="M300 260 q8 -7 16 0 q8 -7 16 0" />
      </g>

      {/* Rolling hills, back to front */}
      <path
        d="M0 520 C220 470 420 500 600 505 C820 511 1000 480 1200 515 L1200 800 L0 800 Z"
        fill="#d98f5e"
      />
      <path
        d="M0 580 C260 540 470 600 700 596 C920 592 1050 560 1200 585 L1200 800 L0 800 Z"
        fill="#b16f47"
        opacity="0.96"
      />
      <path
        d="M0 650 C240 615 430 665 660 668 C900 671 1050 640 1200 660 L1200 800 L0 800 Z"
        fill="#7f4f33"
      />
      <path
        d="M0 715 C260 690 470 730 720 730 C940 730 1060 705 1200 720 L1200 800 L0 800 Z"
        fill="#4f3222"
      />

      {/* Foreground grass */}
      <g className="gh-grass" stroke="#2a1a12" strokeWidth="3.2" strokeLinecap="round" fill="none">
        {blades.map((b) => (
          <path
            key={b.i}
            className="gh-blade"
            style={{ animationDelay: `${b.delay}s` }}
            d={`M${b.x} 800 Q ${b.x + b.lean} ${800 - b.h * 0.6} ${b.x + b.lean * 2} ${800 - b.h}`}
          />
        ))}
      </g>
    </svg>
  );
}
