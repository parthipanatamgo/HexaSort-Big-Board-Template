import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    cssCodeSplit: false, // Force all CSS into one file
    assetsInlineLimit: 100000000, // Inline all assets (set very high)
    minify: true, // or true (Terser is default)
  },
});
