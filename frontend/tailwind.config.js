/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2196F3',
                    dark: '#1976D2',
                    light: '#E3F2FD',
                },
                secondary: {
                    DEFAULT: '#4CAF50',
                    dark: '#388E3C',
                    light: '#E8F5E9',
                },
                accent: {
                    DEFAULT: '#FF9800',
                    dark: '#F57C00',
                    light: '#FFF3E0',
                },
                danger: {
                    DEFAULT: '#F44336',
                    dark: '#D32F2F',
                    light: '#FFEBEE',
                },
                purple: {
                    DEFAULT: '#9C27B0',
                    dark: '#7B1FA2',
                    light: '#F3E5F5',
                },
            },
        },
    },
    plugins: [],
}
