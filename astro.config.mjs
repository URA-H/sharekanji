// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://URA-H.github.io",
  base: "/sharekanji",
  vite: {
    plugins: [tailwindcss()],
  },
});
