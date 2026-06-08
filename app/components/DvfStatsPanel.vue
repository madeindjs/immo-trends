<template>
  <section class="stats-panel bg-base-100 border-t border-base-300 shadow-lg">
    <button
      type="button"
      class="stats-panel-toggle flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      :aria-expanded="!collapsed"
      @click="collapsed = !collapsed"
    >
      <span class="text-sm font-semibold">Statistiques zone visible</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4 shrink-0 transition-transform"
        :class="{ 'rotate-180': collapsed }"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <div v-show="!collapsed" class="stats-panel-content px-4 pb-4">
      <p v-if="statusMessage" class="mb-3 text-sm text-base-content/70">
        {{ statusMessage }}
      </p>

      <template v-else>
        <div class="mb-4 grid grid-cols-3 gap-3">
          <div class="rounded-box bg-base-200 px-3 py-2">
            <p class="text-xs text-base-content/60">Min</p>
            <p class="flex min-h-5 items-center text-sm font-semibold">
              <span
                v-if="loading"
                class="loading loading-dots loading-sm"
                aria-label="Chargement"
              />
              <template v-else>
                {{ formatPricePerSqm(stats.minPricePerSqm) }}/m²
              </template>
            </p>
          </div>
          <div class="rounded-box bg-base-200 px-3 py-2">
            <p class="text-xs text-base-content/60">Médiane</p>
            <p class="flex min-h-5 items-center text-sm font-semibold">
              <span
                v-if="loading"
                class="loading loading-dots loading-sm"
                aria-label="Chargement"
              />
              <template v-else>
                {{ formatPricePerSqm(stats.medianPricePerSqm) }}/m²
              </template>
            </p>
          </div>
          <div class="rounded-box bg-base-200 px-3 py-2">
            <p class="text-xs text-base-content/60">Max</p>
            <p class="flex min-h-5 items-center text-sm font-semibold">
              <span
                v-if="loading"
                class="loading loading-dots loading-sm"
                aria-label="Chargement"
              />
              <template v-else>
                {{ formatPricePerSqm(stats.maxPricePerSqm) }}/m²
              </template>
            </p>
          </div>
        </div>

        <div
          v-if="loading"
          class="chart-container skeleton w-full rounded-box"
          aria-label="Chargement du graphique"
        />
        <ClientOnly v-else>
          <div class="chart-container">
            <canvas ref="chartCanvas" aria-label="Évolution du prix au m²" />
          </div>
        </ClientOnly>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from "chart.js";
import type { DvfMapStats, DvfPriceTrendPoint } from "../../types.ts";
import { formatPricePerSqm } from "../utils/format-price.ts";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
);

const collapsed = defineModel<boolean>("collapsed", { default: false });

const props = defineProps<{
  stats: DvfMapStats;
  trends: DvfPriceTrendPoint[];
  loading: boolean;
  error: string | null;
  zoomTooLow: boolean;
  filtersValid: boolean;
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"line"> | null = null;

const statusMessage = computed((): string | null => {
  if (props.loading) {
    return null;
  }

  if (props.error) {
    return props.error;
  }

  if (!props.filtersValid) {
    return "Ajustez les filtres pour afficher les statistiques.";
  }

  if (props.zoomTooLow) {
    return "Zoomez pour afficher les statistiques.";
  }

  if (
    props.stats.minPricePerSqm == null &&
    props.stats.medianPricePerSqm == null &&
    props.stats.maxPricePerSqm == null
  ) {
    return "Aucune transaction dans cette zone.";
  }

  return null;
});

function buildChartConfig(): ChartConfiguration<"line"> {
  const labels = props.trends.map((point) => String(point.year));

  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Médiane",
          data: props.trends.map((point) => point.medianPricePerSqm),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          tension: 0.2,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y;
              if (value == null || !Number.isFinite(value)) {
                return `${context.dataset.label}: —`;
              }

              return `${context.dataset.label}: ${formatPricePerSqm(value)}/m²`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Année",
          },
        },
        y: {
          title: {
            display: true,
            text: "Prix au m² (€)",
          },
          ticks: {
            callback(value) {
              return formatPricePerSqm(Number(value));
            },
          },
        },
      },
    },
  };
}

function destroyChart(): void {
  chart?.destroy();
  chart = null;
}

function renderChart(): void {
  const canvas = chartCanvas.value;
  if (!canvas || collapsed.value || props.loading || statusMessage.value) {
    destroyChart();
    return;
  }

  const config = buildChartConfig();

  if (chart) {
    chart.data = config.data!;
    chart.options = config.options ?? {};
    chart.update();
    return;
  }

  chart = new Chart(canvas, config);
}

watch(
  () => [props.trends, props.stats, props.loading, props.error, collapsed.value],
  () => {
    nextTick(() => {
      renderChart();
    });
  },
  { deep: true },
);

onMounted(() => {
  renderChart();
});

onBeforeUnmount(() => {
  destroyChart();
});
</script>

<style scoped>
.stats-panel-toggle:hover {
  background: color-mix(in oklab, var(--color-base-200) 60%, transparent);
}

.chart-container {
  height: 180px;
}
</style>
