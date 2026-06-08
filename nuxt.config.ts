// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/leaflet"],
  vite: {
    plugins: [tailwindcss() as never],
  },
  css: ["~/assets/css/main.css"],
});