import "./scene.css";

/**
 * Original hand-built hillside scene — a lone golden-canopy tree over layered
 * ridges and drifting clouds. Palette borrowed from a golden-hour hillside.
 * All motion is CSS and pauses under prefers-reduced-motion.
 */
export default function Scene() {
  return (
    <svg
      className="scene"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="An illustrated hillside at golden hour: a lone tree with a golden canopy stands on a grassy hill against layered mountains and a soft blue sky."
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sky-top)" />
          <stop offset="55%" stopColor="var(--sky-mid)" />
          <stop offset="100%" stopColor="var(--sky-haze)" />
        </linearGradient>
        <radialGradient id="sun" cx="78%" cy="34%" r="42%">
          <stop offset="0%" stopColor="#fff4d6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky + sun glow */}
      <rect width="1200" height="800" fill="url(#sky)" />
      <rect width="1200" height="800" fill="url(#sun)" />

      {/* Mountain ridges, far to near */}
      <path
        d="M0 340 L150 250 L320 330 L470 240 L640 320 L820 235 L1000 315 L1200 250 L1200 800 L0 800 Z"
        fill="var(--ridge-5)"
      />
      <path
        d="M0 400 L180 320 L360 400 L540 310 L720 400 L900 320 L1080 405 L1200 340 L1200 800 L0 800 Z"
        fill="var(--ridge-4)"
      />
      <path
        d="M0 470 L160 400 L340 480 L520 395 L700 485 L900 400 L1100 485 L1200 430 L1200 800 L0 800 Z"
        fill="var(--ridge-3)"
      />
      <path
        d="M0 545 L200 470 L400 560 L620 470 L820 560 L1040 480 L1200 545 L1200 800 L0 800 Z"
        fill="var(--ridge-2)"
      />
      <path
        d="M0 620 L240 555 L470 640 L720 550 L960 640 L1200 570 L1200 800 L0 800 Z"
        fill="var(--ridge-1)"
      />

      {/* Drifting clouds */}
      <g className="clouds" fill="var(--cloud)" opacity="0.92">
        <g className="cloud cloud-a">
          <ellipse cx="250" cy="150" rx="90" ry="26" />
          <ellipse cx="320" cy="140" rx="70" ry="22" />
          <ellipse cx="190" cy="160" rx="55" ry="18" />
        </g>
        <g className="cloud cloud-b">
          <ellipse cx="850" cy="110" rx="110" ry="30" />
          <ellipse cx="940" cy="122" rx="70" ry="22" />
          <ellipse cx="770" cy="122" rx="60" ry="18" />
        </g>
        <g className="cloud cloud-c">
          <ellipse cx="560" cy="200" rx="80" ry="22" />
          <ellipse cx="620" cy="208" rx="55" ry="16" />
        </g>
      </g>

      {/* Foreground hill */}
      <path
        d="M0 660 C260 600 430 690 640 700 C860 710 1010 660 1200 690 L1200 800 L0 800 Z"
        fill="var(--hill)"
      />
      <path
        d="M0 720 C260 680 470 745 700 748 C920 751 1040 715 1200 735 L1200 800 L0 800 Z"
        fill="var(--hill-deep)"
      />

      {/* The tree */}
      <g className="tree">
        {/* Trunk + forked branches */}
        <g fill="none" stroke="var(--bark)" strokeWidth="15" strokeLinecap="round">
          <path d="M470 700 L468 470" stroke="var(--bark-deep)" strokeWidth="19" />
          <path d="M468 500 L410 400" />
          <path d="M468 500 L520 405" />
          <path d="M468 470 L470 360" />
          <path d="M470 400 L430 350" strokeWidth="10" />
          <path d="M470 400 L512 355" strokeWidth="10" />
        </g>

        {/* Swaying canopy */}
        <g className="canopy">
          {/* Deep green inner foliage */}
          <g fill="var(--forest-deep)">
            <ellipse cx="470" cy="330" rx="95" ry="80" />
            <ellipse cx="410" cy="360" rx="60" ry="55" />
            <ellipse cx="535" cy="360" rx="60" ry="52" />
          </g>
          <g fill="var(--forest)">
            <ellipse cx="470" cy="300" rx="80" ry="70" />
            <ellipse cx="415" cy="335" rx="48" ry="44" />
            <ellipse cx="530" cy="335" rx="48" ry="42" />
          </g>

          {/* Golden outer canopy — clustered blobs */}
          <g fill="var(--canopy-deep)">
            <circle cx="470" cy="250" r="92" />
            <circle cx="380" cy="300" r="62" />
            <circle cx="560" cy="300" r="62" />
            <circle cx="430" cy="215" r="58" />
            <circle cx="525" cy="220" r="56" />
          </g>
          <g fill="var(--canopy)">
            <circle cx="470" cy="238" r="82" />
            <circle cx="388" cy="292" r="52" />
            <circle cx="556" cy="292" r="52" />
            <circle cx="432" cy="210" r="48" />
            <circle cx="522" cy="214" r="46" />
            <circle cx="470" cy="300" r="46" />
          </g>
        </g>
      </g>

      {/* Grass tufts on the hill */}
      <g stroke="var(--forest)" strokeWidth="3" strokeLinecap="round" opacity="0.55">
        <path d="M300 715 l-4 -16 M306 715 l0 -20 M312 715 l5 -16" fill="none" />
        <path d="M560 720 l-4 -16 M566 720 l0 -20 M572 720 l5 -16" fill="none" />
        <path d="M760 712 l-4 -16 M766 712 l0 -20 M772 712 l5 -16" fill="none" />
        <path d="M980 720 l-4 -16 M986 720 l0 -20 M992 720 l5 -16" fill="none" />
      </g>
    </svg>
  );
}
