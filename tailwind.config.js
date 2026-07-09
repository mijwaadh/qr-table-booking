/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#006c49",
        "primary-container": "#10b981",
        secondary: "#0058be",
        "secondary-container": "#2170e4",
        tertiary: "#a43a3a",
        "tertiary-container": "#fc7c78",
        surface: "#f9f9ff",
        "surface-bright": "#f9f9ff",
        "surface-container-low": "#f0f3ff",
        "surface-container-highest": "#dce2f3",
        "outline-variant": "#bbcabf",
        outline: "#6c7a71",
        "on-surface": "#151c27",
        "on-surface-variant": "#3c4a42",
        background: "#f9f9ff",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms")
  ],
}
