/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",
        paper: "#F7F6F3",
        accent: "#2E6F63",
        muted: "#6B7280",
      },
    },
  },
  plugins: [],
};
