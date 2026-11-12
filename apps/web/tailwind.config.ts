import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tangerine: {
          DEFAULT: "#FF5C1F",
          50: "#FFF0EA",
          100: "#FFDCCD",
          500: "#FF5C1F",
          700: "#E8470F",
        },
        teal: {
          DEFAULT: "#00B8A9",
          50: "#E6F9F7",
          100: "#C2F0EB",
          500: "#00B8A9",
          700: "#00877C",
        },
        berry: {
          DEFAULT: "#FF3D8B",
          50: "#FFEBF3",
          100: "#FFD1E4",
          500: "#FF3D8B",
          700: "#D61F6B",
        },
        ink: "#0B2A2E",
        mist: "#EEFAF8",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        chip: "14px",
        input: "22px",
        card: "28px",
      },
    },
  },
  plugins: [],
};

export default config;

