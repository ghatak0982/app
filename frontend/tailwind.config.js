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
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#0066FF",
        background: "#F7F9FC",
        foreground: "#1C1F23",
        primary: {
          DEFAULT: "#0066FF",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F7F9FC",
          foreground: "#1C1F23",
        },
        accent: {
          DEFAULT: "#00C896",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F7F9FC",
          foreground: "#94A3B8",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1F23",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1F23",
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
