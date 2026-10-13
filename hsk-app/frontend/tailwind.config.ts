import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Chỉ bật dark mode khi có class="dark" — tránh tự kích hoạt theo system preference
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C3CE1",
          50: "#F3EEFF",
          100: "#E4D6FF",
          500: "#6C3CE1",
          600: "#5A2FBF",
          700: "#4B279E",
        },
        review: {
          DEFAULT: "#1B9E6E",
          500: "#1B9E6E",
          600: "#168A5F",
        },
        ai: {
          DEFAULT: "#117B62",
          500: "#117B62",
        },
        dark: {
          900: "#FFFBEA",   /* nền tổng (vàng kem) */
          800: "#FFF8D6",   /* surface / card */
          700: "#FFF3B0",   /* card hover / phần phụ */
          600: "#FDED8A",   /* accent nhạt */
          500: "#F5E270",   /* accent đậm hơn */
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        hanzi: ["var(--font-noto)", "Noto Sans SC", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
