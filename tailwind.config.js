/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "class", // We will force dark mode
  theme: {
    extend: {
      colors: {
        // Modern slate palette
        bg: "#0f172a", // Slate 900
        surface: "#1e293b", // Slate 800
        primary: "#3b82f6", // Blue 500
        border: "#334155", // Slate 700
      },
    },
  },
  plugins: [],
};
