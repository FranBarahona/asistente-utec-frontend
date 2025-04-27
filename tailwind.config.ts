import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
        // Using direct HSL values corresponding to the definitions in globals.css
        // This avoids potential issues with Tailwind resolving CSS variables during build.
        background: 'hsl(0 0% 100%)', // White (--background: 0 0% 100%;)
        foreground: 'hsl(0 0% 3.9%)', // (--foreground: 0 0% 3.9%;)
        card: {
          DEFAULT: 'hsl(0 0% 100%)', // (--card: 0 0% 100%;)
          foreground: 'hsl(0 0% 3.9%)' // (--card-foreground: 0 0% 3.9%;)
        },
        popover: {
          DEFAULT: 'hsl(0 0% 100%)', // (--popover: 0 0% 100%;)
          foreground: 'hsl(0 0% 3.9%)' // (--popover-foreground: 0 0% 3.9%;)
        },
        primary: {
          DEFAULT: 'hsl(0 0% 9%)', // (--primary: 0 0% 9%;)
          foreground: 'hsl(0 0% 98%)' // (--primary-foreground: 0 0% 98%;)
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 96.1%)', // Light Gray (--secondary: 0 0% 96.1%;)
          foreground: 'hsl(0 0% 9%)' // (--secondary-foreground: 0 0% 9%;)
        },
        muted: {
          DEFAULT: 'hsl(0 0% 96.1%)', // (--muted: 0 0% 96.1%;)
          foreground: 'hsl(0 0% 45.1%)' // (--muted-foreground: 0 0% 45.1%;)
        },
        accent: {
          DEFAULT: 'hsl(180 100% 25.1%)', // Teal (--accent: 180 100% 25.1%;)
          foreground: 'hsl(0 0% 98%)' // (--accent-foreground: 0 0% 98%;)
        },
        destructive: {
          DEFAULT: 'hsl(0 84.2% 60.2%)', // (--destructive: 0 84.2% 60.2%;)
          foreground: 'hsl(0 0% 98%)' // (--destructive-foreground: 0 0% 98%;)
        },
        border: 'hsl(0 0% 89.8%)', // (--border: 0 0% 89.8%;)
        input: 'hsl(0 0% 89.8%)', // (--input: 0 0% 89.8%;)
        ring: 'hsl(0 0% 3.9%)', // (--ring: 0 0% 3.9%;)
        chart: {
          '1': 'hsl(12 76% 61%)', // (--chart-1: 12 76% 61%;)
          '2': 'hsl(173 58% 39%)', // (--chart-2: 173 58% 39%;)
          '3': 'hsl(197 37% 24%)', // (--chart-3: 197 37% 24%;)
          '4': 'hsl(43 74% 66%)', // (--chart-4: 43 74% 66%;)
          '5': 'hsl(27 87% 67%)' // (--chart-5: 27 87% 67%;)
        },
        sidebar: {
          DEFAULT: 'hsl(0 0% 98%)', // (--sidebar-background: 0 0% 98%;)
          foreground: 'hsl(240 5.3% 26.1%)', // (--sidebar-foreground: 240 5.3% 26.1%;)
          primary: 'hsl(240 5.9% 10%)', // (--sidebar-primary: 240 5.9% 10%;)
          'primary-foreground': 'hsl(0 0% 98%)', // (--sidebar-primary-foreground: 0 0% 98%;)
          accent: 'hsl(240 4.8% 95.9%)', // (--sidebar-accent: 240 4.8% 95.9%;)
          'accent-foreground': 'hsl(240 5.9% 10%)', // (--sidebar-accent-foreground: 240 5.9% 10%;)
          border: 'hsl(220 13% 91%)', // (--sidebar-border: 220 13% 91%;)
          ring: 'hsl(217.2 91.2% 59.8%)' // (--sidebar-ring: 217.2 91.2% 59.8%;)
        }
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
