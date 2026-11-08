import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-sans)"] },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: { DEFAULT: "hsl(var(--surface))", 2: "hsl(var(--surface-2))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", soft: "hsl(var(--primary-soft))" },
        ai: { DEFAULT: "hsl(var(--ai))", foreground: "hsl(var(--ai-foreground))", soft: "hsl(var(--ai-soft))", ink: "hsl(var(--ai-ink))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", soft: "hsl(var(--success-soft))" },
        warning: { DEFAULT: "hsl(var(--warning))", soft: "hsl(var(--warning-soft))" },
        danger: { DEFAULT: "hsl(var(--danger))", soft: "hsl(var(--danger-soft))" },
        ch: { 1: "hsl(var(--ch-1))", 2: "hsl(var(--ch-2))", 3: "hsl(var(--ch-3))", 4: "hsl(var(--ch-4))", 5: "hsl(var(--ch-5))", 6: "hsl(var(--ch-6))" },
        info: { DEFAULT: "hsl(var(--info))", soft: "hsl(var(--info-soft))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--foreground))" },
      },
      borderRadius: { field: "var(--r-field)", xl: "calc(var(--r-field) + 2px)", lg: "var(--radius)", md: "var(--r-field)", sm: "calc(var(--r-field) - 4px)" },
      boxShadow: { soft: "var(--shadow-soft)", lift: "var(--shadow-lift)" },
    },
  },
  plugins: [animate],
};
