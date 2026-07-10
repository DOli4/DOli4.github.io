/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  // Preflight off: keep the site's hand-written calm styles untouched;
  // we only want Tailwind's utility classes for the shadcn/ui component.
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
