// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import Icons from "unplugin-icons/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  vite: {
    plugins: [Icons({ compiler: "astro" })],
  },
});
