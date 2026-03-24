/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "SF Pro Display", "Segoe UI", "sans-serif"],
            },
            colors: {
                hive: {
                    dark: "#0F172A",
                    darker: "#020617",
                },
            },
            boxShadow: {
                glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
                "glow-violet": "0 0 30px rgba(124, 58, 237, 0.25)",
                "glow-amber": "0 0 30px rgba(245, 158, 11, 0.25)",
            },
            animation: {
                "float": "float 6s ease-in-out infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
            },
        },
    },
    plugins: [],
};
