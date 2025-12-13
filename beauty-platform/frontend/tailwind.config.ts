import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8b5cf6",
          foreground: "#f8fafc",
        },
        muted: "#f6f8fb",
      },
    },
  },
  plugins: [],
};

export default config;
