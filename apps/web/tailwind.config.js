/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",       // slate-900 — primary text
        paper: "#F5F6FA",      // app background
        surface: "#FFFFFF",    // card background
        border: "#E2E8F0",     // slate-200
        accent: "#4338CA",     // indigo-700 — primary brand
        "accent-light": "#EEF2FF",
        "accent-dark": "#3730A3",
        muted: "#64748B",      // slate-500
        success: "#059669",
        "success-light": "#ECFDF5",
        warning: "#D97706",
        "warning-light": "#FFFBEB",
        danger: "#DC2626",
        "danger-light": "#FEF2F2",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)",
        "card-hover": "0 4px 12px 0 rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
