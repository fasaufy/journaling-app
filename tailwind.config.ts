import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { background: "#f5f5f5", card: "#ffffff", accent: "#195eff", heading: "#131313", body: "#5e5e5e", placeholder: "#9e9e9e", label: "#737373", input: "#fafafa", divider: "#dbdbdb" },
      borderRadius: { card: "32px" },
      boxShadow: { soft: "0 0 2px rgba(153, 153, 153, 0.18), 0 6px 18px rgba(153, 153, 153, 0.06)" },
    },
  },
  plugins: [],
};

export default config;