/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f0f',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e0e0e0',
          textMuted: '#888888',
          table: '#1f1f1f',
        },
        success: '#4ade80',
        successBg: '#1b3a1b',
      },
    },
  },
  plugins: [],
}
