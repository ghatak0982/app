module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        border: "#D4C4B8",
        input: "#E5D5CA",
        ring: "#A05B3E",
        background: "#EAE0D5",
        foreground: "#4A3829",
        primary: {
          DEFAULT: "#A05B3E",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#E5D5CA",
          foreground: "#4A3829",
        },
        accent: {
          DEFAULT: "#8B5A3C",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#D84315",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F57C00",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#E5D5CA",
          foreground: "#8B7355",
        },
        popover: {
          DEFAULT: "#F5EDE4",
          foreground: "#4A3829",
        },
        card: {
          DEFAULT: "#F5EDE4",
          foreground: "#4A3829",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
