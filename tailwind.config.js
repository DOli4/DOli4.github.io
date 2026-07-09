/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: '#0a0708',
        accent: '#ff2d42',
        ink: '#e8dcde',
      },
    },
  },
  plugins: [],
}

