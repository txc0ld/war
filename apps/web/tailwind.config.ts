import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#000000',
          card: '#0A0A0A',
          elevated: '#1A1A1A',
          border: '#2A2A2A',
        },
        accent: {
          cyan: '#00F0FF',
          neon: '#CCFF00',
          red: '#FF3333',
          gold: '#FFD700',
          magenta: '#FF00FF',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E0E0E0',
          muted: '#999999',
          dim: '#666666',
        },
        grid: '#131313',
      },
      fontFamily: {
        mono: ["'Rubik Glitch'", "'JetBrains Mono'", 'monospace'],
        sans: ["'Plus Jakarta Sans'", "'Segoe UI'", 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse-slow 1.5s ease-in-out infinite',
        'scan-line': 'scan-line 2s linear infinite',
        glitch: 'glitch 0.3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
