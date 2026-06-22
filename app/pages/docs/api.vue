<template>
  <div class="docs-api-page flex flex-col h-full min-h-0 bg-base-100">
    <div class="px-6 py-4 border-b border-base-300 shrink-0">
      <h1 class="text-2xl font-bold">
        Documentation API
      </h1>
      <p class="text-sm opacity-70">
        Documentation interactive des endpoints REST DVF.
      </p>
    </div>
    <ClientOnly>
      <div class="flex-1 min-h-0 relative">
        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center z-10"
        >
          <span class="loading loading-spinner loading-lg" />
        </div>
        <div
          v-if="error"
          class="absolute inset-0 flex items-center justify-center text-error z-10"
        >
          {{ error }}
        </div>
        <div
          ref="swaggerContainer"
          class="swagger-ui-container absolute inset-0 overflow-auto"
        />
      </div>
      <template #fallback>
        <div class="flex-1 flex items-center justify-center">
          <span class="loading loading-spinner loading-lg" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "Documentation API · immo-trends",
  htmlAttrs: { lang: "fr" },
});

const swaggerContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const SWAGGER_CSS_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css";
const SWAGGER_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";

const PUBLIC_API_PATHS = new Set(["/api/dvf", "/api/dvf-trends"]);

async function loadSpec(): Promise<Record<string, unknown>> {
  const response = await fetch("/_openapi.json");
  if (!response.ok) {
    throw new Error(`Failed to load API spec: ${response.status}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

function filterSpec(spec: Record<string, unknown>): Record<string, unknown> {
  const paths = spec.paths as Record<string, unknown> | undefined;
  if (!paths) {
    return spec;
  }

  const filteredPaths: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(paths)) {
    if (PUBLIC_API_PATHS.has(path)) {
      filteredPaths[path] = value;
    }
  }

  return {
    ...spec,
    paths: filteredPaths,
    servers: [{ url: "/", description: "Current server" }],
  };
}

function loadStyleSheet(): void {
  const id = "swagger-ui-css";
  if (document.getElementById(id)) {
    return;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = SWAGGER_CSS_URL;
  document.head.appendChild(link);
}

async function initSwagger(): Promise<void> {
  const swaggerWindow = window as unknown as {
    SwaggerUIBundle?: ((config: Record<string, unknown>) => unknown) & {
      presets: { apis: unknown };
    };
  };

  const SwaggerUIBundle = swaggerWindow.SwaggerUIBundle;
  if (!SwaggerUIBundle || !swaggerContainer.value) {
    error.value = "Swagger UI n'a pas pu être initialisé.";
    loading.value = false;
    return;
  }

  try {
    const rawSpec = await loadSpec();
    const spec = filterSpec(rawSpec);

    SwaggerUIBundle({
      spec,
      domNode: swaggerContainer.value,
      presets: [
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        SwaggerUIBundle.presets.apis as unknown,
      ],
      layout: "BaseLayout",
    });
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : "Impossible de charger la spécification OpenAPI.";
  } finally {
    loading.value = false;
  }
}

function loadSwaggerScript(): void {
  loadStyleSheet();

  const id = "swagger-ui-script";
  const existingScript = document.getElementById(id);
  if (existingScript) {
    void initSwagger();
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.src = SWAGGER_SCRIPT_URL;
  script.async = true;
  script.onload = () => void initSwagger();
  script.onerror = () => {
    error.value = "Impossible de charger Swagger UI.";
    loading.value = false;
  };
  document.head.appendChild(script);
}

onMounted(() => {
  loadSwaggerScript();
});
</script>

<style scoped>
.swagger-ui-container :deep(.swagger-ui) {
  /* Allow Swagger UI to use the full width of the container. */
  max-width: none;
}
</style>
