/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zebra: {
          black: "#0a0a0a",
          white: "#f8f8f8",
          gray: "#d8d8d8"
        }
      },
      boxShadow: {
        zebra: "0 16px 40px rgba(0, 0, 0, 0.12)"
      }
    }
  },
  plugins: []
};