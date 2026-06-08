<template>
  <aside class="flex h-full w-96 max-w-[90vw] flex-col bg-base-100 shadow-xl">
    <header class="flex items-start justify-between gap-3 border-b border-base-300 p-4">
      <div class="min-w-0">
        <h2 class="truncate text-base font-semibold">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-sm text-base-content/70">
          {{ subtitle }}
        </p>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square shrink-0"
        aria-label="Fermer le détail"
        @click="emit('close')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="loading" class="flex items-center gap-3 text-sm">
        <span class="loading loading-spinner loading-sm" />
        <span>Chargement de la transaction…</span>
      </div>

      <div v-else-if="error" class="alert alert-error text-sm">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="sections.length > 0" class="flex flex-col gap-5">
        <section v-for="section in sections" :key="section.title">
          <h3 class="mb-2 text-sm font-semibold text-base-content/80">
            {{ section.title }}
          </h3>
          <dl class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-3 gap-y-2 text-sm">
            <template v-for="field in section.fields" :key="field.key">
              <dt class="text-base-content/70">
                {{ field.label }}
              </dt>
              <dd class="break-words">
                {{ field.value }}
              </dd>
            </template>
          </dl>
        </section>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { DvfRowDetail } from "../../types.ts";
import {
  buildDvfDetailSections,
  buildDvfDetailSubtitle,
  buildDvfDetailTitle,
} from "../utils/dvf-detail-fields.ts";

const props = defineProps<{
  row: DvfRowDetail | null;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const title = computed(() =>
  props.row ? buildDvfDetailTitle(props.row) : "Transaction DVF",
);

const subtitle = computed(() =>
  props.row ? buildDvfDetailSubtitle(props.row) : "",
);

const sections = computed(() =>
  props.row ? buildDvfDetailSections(props.row) : [],
);
</script>
