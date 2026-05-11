/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        accent: {
          DEFAULT: "#a855f7",
          glow: "#c084fc",
        },
      },
    },
  },
  plugins: [],
};
