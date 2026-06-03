import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        clay: {
          "bg-app": "var(--clay-bg-app)",
          "bg-panel": "var(--clay-bg-panel)",
          "bg-chat": "var(--clay-bg-chat)",
          "bg-header": "var(--clay-bg-header)",
          "bg-chat-hover": "var(--clay-bg-chat-hover)",
          "bg-chat-active": "var(--clay-bg-chat-active)",
          "msg-in": "var(--clay-msg-in)",
          "msg-out": "var(--clay-msg-out)",
          primary: "var(--clay-primary)"
        }
      },
      boxShadow: {
        'clay-sm': '4px 4px 8px rgba(0, 0, 0, 0.05), inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(0, 0, 0, 0.02)',
        'clay-md': '8px 8px 16px rgba(0, 0, 0, 0.05), inset 4px 4px 8px rgba(255, 255, 255, 0.8), inset -4px -4px 8px rgba(0, 0, 0, 0.02)',
        'clay-lg': '12px 12px 24px rgba(0, 0, 0, 0.05), inset 6px 6px 12px rgba(255, 255, 255, 0.8), inset -6px -6px 12px rgba(0, 0, 0, 0.02)',
        'clay-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.05), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',
        'clay-dark-sm': '4px 4px 8px rgba(0, 0, 0, 0.3), inset 2px 2px 4px rgba(255, 255, 255, 0.02), inset -2px -2px 4px rgba(0, 0, 0, 0.1)',
        'clay-dark-md': '8px 8px 16px rgba(0, 0, 0, 0.3), inset 4px 4px 8px rgba(255, 255, 255, 0.02), inset -4px -4px 8px rgba(0, 0, 0, 0.1)',
        'clay-dark-lg': '12px 12px 24px rgba(0, 0, 0, 0.3), inset 6px 6px 12px rgba(255, 255, 255, 0.02), inset -6px -6px 12px rgba(0, 0, 0, 0.1)',
        'clay-dark-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.02)'
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '4xl': '2rem'
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        },
        twinkle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        blob: "blob 7s infinite",
        twinkle: "twinkle 3s ease-in-out infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
} satisfies Config;

export default config;
