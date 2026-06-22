// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

const typescriptCompilerOptions = {
  allowImportingTsExtensions: true,
  strict: true,
  erasableSyntaxOnly: true,
};

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/leaflet"],
  vite: {
    plugins: [tailwindcss() as never],
  },
  css: ["~/assets/css/main.css"],
  typescript: {
    sharedTsConfig: {
      compilerOptions: typescriptCompilerOptions,
    },
    tsConfig: {
      compilerOptions: typescriptCompilerOptions,
    },
    nodeTsConfig: {
      compilerOptions: typescriptCompilerOptions,
    },
  },
  nitro: {
    typescript: {
      tsConfig: {
        compilerOptions: typescriptCompilerOptions,
      },
    },
    experimental: {
      openAPI: true,
    },
    openAPI: {
      production: "prerender",
      meta: {
        title: "immo-trends API",
        description:
          "Interactive API documentation for immo-trends DVF endpoints.",
        version: "1.0.0",
      },
      ui: {
        swagger: false,
        scalar: false,
      },
    },
  },
});
