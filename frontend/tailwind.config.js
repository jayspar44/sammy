/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dawn Design System Palette
                primary: {
                    DEFAULT: colors.sky[500],
                    light: colors.sky[100],
                },
                secondary: {
                    DEFAULT: colors.amber[400],
                    light: colors.amber[50], // Note: Prompt said amber-50 for secondary backgrounds
                },
                accent: {
                    DEFAULT: colors.emerald[500],
                },
                neutral: {
                    800: colors.slate[800],
                    500: colors.slate[500],
                    50: colors.slate[50],
                },
                surface: colors.white,
            },
            borderRadius: {
                '2xl': '1rem', // Prompt says 2xl for buttons (usually 1rem is xl, but we can stick to standard or override if needed. Standard 2xl is 1.5rem. Prompt: "Rounded-3xl for Cards and rounded-2xl for Buttons". Tailwind standard 2xl is 1.5rem. )
                // Let's stick to standard Tailwind sizes but ensure they are used as requested.
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Assuming Inter is available or just standard sans
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                slideUp: 'slideUp 0.5s ease-out',
                fadeIn: 'fadeIn 0.5s ease-out',
            },
        },
    },
    plugins: [],
}
