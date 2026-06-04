/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff9f0",
          100: "#fff0d6",
          200: "#ffdca8",
          300: "#ffc06e",
          400: "#ff9a2e",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        accent: {
          DEFAULT: "#deff9a",
          dim: "#b8d970",
        },
        surface: {
          900: "#09090b",
          800: "#18181b",
          700: "#27272a",
          600: "#3f3f46",
        },
      },
      fontFamily: {
        sans: ["var(--font-urbanist)", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.2s ease-out",
        "fade-in": "fadeIn 0.15s ease-in",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
