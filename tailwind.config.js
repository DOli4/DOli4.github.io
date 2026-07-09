/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Driven by CSS custom properties (see src/index.css) so the visitor
        // playground can repaint the whole site at runtime and the theme can
        // flip dark/light. Values are space-separated RGB channels.
        base: 'rgb(var(--base) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
