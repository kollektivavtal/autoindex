import type { Config } from 'tailwindcss'

export default {
  content: ["./index.njk", "./agreements.njk", "./_includes/*.njk"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
