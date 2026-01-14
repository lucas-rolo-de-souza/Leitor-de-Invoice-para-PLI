/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
      borderRadius: {
        // M3 Shape System (1dp = 1px for semantic mapping)
        "m3-xs": "4px", // Text fields, Menu items
        "m3-sm": "8px", // Chips, Menus, Snackbars
        "m3-md": "12px", // Cards, Small Dialogs
        "m3-lg": "16px", // Navigation Drawers, Dialogs
        "m3-xl": "28px", // Search bars, Bottom Sheets
        "m3-full": "9999px", // Buttons, FABs, Badges
      },
      colors: {
        // Material 3 Color Roles
        "surface-dim": "var(--surface-dim)",
        surface: "var(--surface)",
        "surface-bright": "var(--surface-bright)",

        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",

        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",

        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",

        primary: "var(--primary)",
        "on-primary": "var(--on-primary)",
        "primary-container": "var(--primary-container)",
        "on-primary-container": "var(--on-primary-container)",

        secondary: "var(--secondary)",
        "on-secondary": "var(--on-secondary)",
        "secondary-container": "var(--secondary-container)",
        "on-secondary-container": "var(--on-secondary-container)",

        error: "var(--error)",
        "on-error": "var(--on-error)",
        "error-container": "var(--error-container)",
        "on-error-container": "var(--on-error-container)",

        // Legacy/Compat (Map to new tokens or keep for specific use cases)
        page: "var(--surface)", // Mapped to new surface
        border: "var(--outline-variant)", // Mapped to outline variant
      },

      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
