import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        muted: "#64748B",
        mist: "#F1F5F9",
        canvas: "#F8FAFC",
        line: "#E2E8F0",
        brand: {
          DEFAULT: "#4F46E5",
          dark: "#4338CA",
          soft: "#EEF2FF"
        },
        coral: "#F43F5E"
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
        card: "0 1px 3px rgba(15, 23, 42, 0.08)",
        lift: "0 12px 32px rgba(15, 23, 42, 0.12)"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.16s ease-out"
      }
    }
  },
  plugins: []
};

export default config;
