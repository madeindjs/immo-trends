import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ["public", "*.csv"],
    },
  },
  build: {
    minify: false,
    sourcemap: true,
    watch: {},
  },
  optimizeDeps: {
    exclude: ["*.csv"],
  },
  plugins: [preact()],
});
