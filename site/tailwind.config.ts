import type { Config } from "tailwindcss";

// Disciplined palette: ONE primary (indigo), ONE accent (sky), ONE alert/contrast
// (amber) used sparingly for the query vector + guardrail/alert semantics.
// Data visualizations use a blue→teal sequential ramp within the same cool family.
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5", // indigo-600
          dark: "#4338ca",
          light: "#6366f1",
        },
        accent: {
          DEFAULT: "#0ea5e9", // sky-500
          dark: "#0284c7",
        },
        alert: {
          DEFAULT: "#d97706", // amber-600 — used sparingly
          soft: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        dash: { to: { strokeDashoffset: "-1000" } },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "gradient-pan": "gradient-pan 14s ease infinite",
        float: "float 7s ease-in-out infinite",
        dash: "dash 22s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
