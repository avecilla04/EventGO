import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx}'],
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: { '2xl': '1280px' },
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				// Paleta EventGo
				ink: {
					DEFAULT: '#15131D',
					soft: '#2A2735',
				},
				canvas: '#F7F6F3',
				line: '#E9E6EE',
				muted: {
					DEFAULT: '#6E6A7C',
					foreground: '#6E6A7C',
				},
				accent: {
					DEFAULT: '#FF5A3C',
					hover: '#F04A2C',
					soft: '#FFEDE8',
					foreground: '#FFFFFF',
				},
				// Tokens usados por los componentes de UI (shadcn)
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			boxShadow: {
				soft: '0 1px 2px rgba(21, 19, 29, 0.04), 0 8px 24px rgba(21, 19, 29, 0.06)',
				lift: '0 2px 4px rgba(21, 19, 29, 0.05), 0 18px 40px rgba(21, 19, 29, 0.12)',
				glow: '0 10px 30px rgba(255, 90, 60, 0.35)',
			},
		},
	},
	plugins: [tailwindAnimate],
};
