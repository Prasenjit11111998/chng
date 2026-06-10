import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class", ".dark, .matrix"],
	content: ["./index.html", "./src/**/*.{html,js,jsx,ts,tsx}"],
	theme: {
		borderRadius: {
			none: "0px",
			xs: "0px",
			sm: "0px",
			DEFAULT: "0px",
			md: "0px",
			lg: "0px",
			xl: "0px",
			"2xl": "0px",
			"3xl": "0px",
			"2.5xl": "0px",
			full: "0px",
		},
		extend: {
			backgroundColor: {
				panel: "var(--bg-panel)",
				"panel-highlight": "var(--bg-panel-highlight)",
				separator: "var(--bg-separator)",
				button: "var(--bg-button)",
				"panel-alt": "var(--bg-button)",
				badge: "var(--bg-badge)",
			},
			borderColor: {
				separator: "var(--bg-separator)",
				button: "var(--bg-button)",
			},
			textColor: {
				foreground: "var(--fg)",
				muted: "var(--fg-muted)",
				accent: "var(--fg-accent)",
				failure: "var(--fg-failure)",
				success: "var(--fg-success)",
				"on-accent": "var(--fg-on-accent)",
				"on-badge": "var(--fg-on-badge)",
			},
			colors: {
				accent: "var(--accent)",
				"accent-alt": "var(--accent-alt)",
				"accent-pink": "var(--accent-pink)",
				"accent-pink-alt": "var(--accent-pink-alt)",
				"accent-red": "var(--accent-red)",
				"accent-red-alt": "var(--accent-red-alt)",
				"accent-purple-alt": "var(--accent-purple-alt)",
				"accent-purple": "var(--accent-purple)",
				"accent-blue": "var(--accent-blue)",
				"accent-blue-alt": "var(--accent-blue-alt)",
				"accent-green": "var(--accent-green)",
				"accent-green-alt": "var(--accent-green-alt)",
			},
			boxShadow: {
				panel: "var(--shadow-panel)",
			},
			fontFamily: {
				sans: ["var(--font-body)", "sans-serif"],
				display: "var(--font-display)",
				body: "var(--font-body)",
				mono: "var(--font-mono)",
			},
			blur: {
				xs: "2px",
			},
			borderRadius: {
				"2.5xl": "1.25rem",
			},
		},
	},

	plugins: [
		plugin(function ({ addVariant }) {
			addVariant("dynadark", [
				":root:not(.light).dark &",
				"@media (prefers-color-scheme: dark) { :root:not(.light) &",
			]);
		}),
	],
};
