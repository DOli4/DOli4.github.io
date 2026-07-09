import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayground } from "./ThemeContext";

const PRESET_ACCENTS = [
  "#ff2d42", // signal red (default)
  "#ff7a00", // amber
  "#ffd400", // acid yellow
  "#00e5a0", // mint
  "#3b82f6", // blue
  "#a855f7", // violet
  "#ec4899", // magenta
  "#e8dcde", // mono / off-white
];

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`border px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
              value === opt.value
                ? "border-accent bg-accent text-base"
                : "border-ink/20 text-ink/70 hover:border-ink/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomizePanel() {
  const [open, setOpen] = useState(false);
  const { accent, theme, motion: motionPref, setAccent, setTheme, setMotion, reset } = usePlayground();

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Customize this site"
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 border border-accent bg-base/80 px-4 py-3 font-mono text-xs uppercase tracking-[0.15em] text-accent backdrop-blur transition-transform hover:-translate-y-0.5"
      >
        <span aria-hidden="true">✎</span> Customize
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-20 right-5 z-[60] w-[280px] border border-ink/15 bg-base/95 p-5 backdrop-blur-md shadow-2xl"
            role="dialog"
            aria-label="Site customization"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink">
                Make it yours
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink/50 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Accent */}
            <div className="mb-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
                Accent
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {PRESET_ACCENTS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setAccent(hex)}
                    aria-label={`Accent ${hex}`}
                    aria-pressed={accent.toLowerCase() === hex.toLowerCase()}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      accent.toLowerCase() === hex.toLowerCase()
                        ? "border-ink"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink/50">
                Custom
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-7 w-10 cursor-pointer border-0 bg-transparent"
                  aria-label="Custom accent color"
                />
              </label>
            </div>

            <Toggle
              label="Theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
            />

            <Toggle
              label="Motion"
              value={motionPref}
              onChange={setMotion}
              options={[
                { value: "full", label: "Full" },
                { value: "reduced", label: "Calm" },
              ]}
            />

            <button
              type="button"
              onClick={reset}
              className="mt-2 w-full border border-ink/20 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60 transition-colors hover:border-accent hover:text-accent"
            >
              Reset to default
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
