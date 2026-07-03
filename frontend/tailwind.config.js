/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./contexts/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        frost: "rgba(255,255,255,0.12)",
        neon: {
          cyan: "#23d7ff",
          pink: "#ff4ecd",
          green: "#6df2b8",
          amber: "#ffcf5a"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(35, 215, 255, 0.22)",
        glass: "0 24px 80px rgba(0,0,0,0.18)"
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: 0.55 },
          "50%": { opacity: 1 }
        }
      }
    }
  },
  plugins: []
};
