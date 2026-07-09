import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";
export type Motion = "full" | "reduced";

export interface PlaygroundState {
  accent: string; // hex, e.g. "#ff2d42"
  theme: Theme;
  motion: Motion;
  setAccent: (hex: string) => void;
  setTheme: (theme: Theme) => void;
  setMotion: (motion: Motion) => void;
  reset: () => void;
}

const DEFAULTS = {
  accent: "#ff2d42",
  theme: "dark" as Theme,
  motion: "full" as Motion,
};

const STORAGE_KEY = "portfolio-playground-v1";

/** "#ff2d42" -> "255 45 66" (space-separated channels for rgb(var(--x))). */
function hexToChannels(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return "255 45 66";
  return `${r} ${g} ${b}`;
}

function loadPersisted(): Partial<typeof DEFAULTS> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<typeof DEFAULTS>) : {};
  } catch {
    return {};
  }
}

const PlaygroundContext = createContext<PlaygroundState | null>(null);

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted();
  const [accent, setAccentState] = useState(persisted.accent ?? DEFAULTS.accent);
  const [theme, setThemeState] = useState<Theme>(persisted.theme ?? DEFAULTS.theme);
  const [motion, setMotionState] = useState<Motion>(persisted.motion ?? DEFAULTS.motion);

  // Apply accent to the CSS variable.
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", hexToChannels(accent));
  }, [accent]);

  // Apply theme + motion as root data-attributes (CSS reads these).
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (motion === "reduced") {
      document.documentElement.setAttribute("data-motion", "reduced");
    } else {
      document.documentElement.removeAttribute("data-motion");
    }
  }, [motion]);

  // Persist everything.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accent, theme, motion }),
      );
    } catch {
      /* storage unavailable (private mode) — non-fatal, stay ephemeral */
    }
  }, [accent, theme, motion]);

  const setAccent = useCallback((hex: string) => setAccentState(hex), []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const setMotion = useCallback((m: Motion) => setMotionState(m), []);
  const reset = useCallback(() => {
    setAccentState(DEFAULTS.accent);
    setThemeState(DEFAULTS.theme);
    setMotionState(DEFAULTS.motion);
  }, []);

  const value = useMemo<PlaygroundState>(
    () => ({ accent, theme, motion, setAccent, setTheme, setMotion, reset }),
    [accent, theme, motion, setAccent, setTheme, setMotion, reset],
  );

  return (
    <PlaygroundContext.Provider value={value}>{children}</PlaygroundContext.Provider>
  );
}

export function usePlayground(): PlaygroundState {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error("usePlayground must be used within PlaygroundProvider");
  return ctx;
}
