<template>
  <aside class="min-h-full w-80 bg-base-100 shadow-xl">
    <div class="flex flex-col gap-4 p-4">
      <h2 class="text-base font-semibold">Filtres</h2>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Type de bien</legend>
        <label class="label cursor-pointer justify-start gap-3">
          <input
            v-model="showAppartement"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">Appartement</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3">
          <input
            v-model="showMaison"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">Maison</span>
        </label>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Année</legend>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text mb-1">De</span>
            <input
              v-model.number="yearMin"
              type="number"
              class="input input-bordered input-sm w-full"
              :min="minYear"
              :max="maxYear"
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">À</span>
            <input
              v-model.number="yearMax"
              type="number"
              class="input input-bordered input-sm w-full"
              :min="minYear"
              :max="maxYear"
            />
          </label>
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Surface (m²)</legend>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text mb-1">De</span>
            <input
              v-model.number="surfaceMin"
              type="number"
              class="input input-bordered input-sm w-full"
              min="0"
              placeholder="Min"
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">À</span>
            <input
              v-model.number="surfaceMax"
              type="number"
              class="input input-bordered input-sm w-full"
              min="0"
              placeholder="Max"
            />
          </label>
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Surface du terrain (m²)</legend>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text mb-1">De</span>
            <input
              v-model.number="surfaceTerrainMin"
              type="number"
              class="input input-bordered input-sm w-full"
              min="0"
              placeholder="Min"
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">À</span>
            <input
              v-model.number="surfaceTerrainMax"
              type="number"
              class="input input-bordered input-sm w-full"
              min="0"
              placeholder="Max"
            />
          </label>
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Prix au m² (€)</legend>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text mb-1">De</span>
            <input
              v-model.number="pricePerSqmMin"
              type="number"
              class="input input-bordered input-sm w-full"
              min="0"
              placeholder="Min"
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">À</span>
            <input
              v-model.number="pricePerSqmMax"
              type="number"
              class="input input-bordered input-sm w-full"
              min="0"
              placeholder="Max"
            />
          </label>
        </div>
      </fieldset>

      <p v-if="!showAppartement && !showMaison" class="text-sm text-warning">
        Sélectionnez au moins un type de bien.
      </p>
      <p v-else-if="yearMin > yearMax" class="text-sm text-warning">
        L'année de début doit être antérieure ou égale à l'année de fin.
      </p>
      <p
        v-else-if="surfaceMin != null && surfaceMax != null && surfaceMin > surfaceMax"
        class="text-sm text-warning"
      >
        La surface minimale doit être inférieure ou égale à la surface maximale.
      </p>
      <p
        v-else-if="surfaceTerrainMin != null && surfaceTerrainMax != null && surfaceTerrainMin > surfaceTerrainMax"
        class="text-sm text-warning"
      >
        La surface de terrain minimale doit être inférieure ou égale à la surface de terrain maximale.
      </p>
      <p
        v-else-if="pricePerSqmMin != null && pricePerSqmMax != null && pricePerSqmMin > pricePerSqmMax"
        class="text-sm text-warning"
      >
        Le prix au m² minimal doit être inférieur ou égal au prix au m² maximal.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { DvfPointFilters } from "../composables/useDvfPoints.ts";

const minYear = 2014;
const maxYear = new Date().getFullYear();

const filters = defineModel<DvfPointFilters>({ required: true });

const showAppartement = ref(filters.value.typeLocals.includes("Appartement"));
const showMaison = ref(filters.value.typeLocals.includes("Maison"));
const yearMin = ref(filters.value.yearMin);
const yearMax = ref(filters.value.yearMax);
const surfaceMin = ref(filters.value.surfaceMin);
const surfaceMax = ref(filters.value.surfaceMax);
const surfaceTerrainMin = ref(filters.value.surfaceTerrainMin);
const surfaceTerrainMax = ref(filters.value.surfaceTerrainMax);
const pricePerSqmMin = ref(filters.value.pricePerSqmMin);
const pricePerSqmMax = ref(filters.value.pricePerSqmMax);

let isSyncingFromModel = false;

function normalizeOptionalNumber(value: number | null): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

function syncPanelFromModel(nextFilters: DvfPointFilters): void {
  isSyncingFromModel = true;
  showAppartement.value = nextFilters.typeLocals.includes("Appartement");
  showMaison.value = nextFilters.typeLocals.includes("Maison");
  yearMin.value = nextFilters.yearMin;
  yearMax.value = nextFilters.yearMax;
  surfaceMin.value = nextFilters.surfaceMin;
  surfaceMax.value = nextFilters.surfaceMax;
  surfaceTerrainMin.value = nextFilters.surfaceTerrainMin;
  surfaceTerrainMax.value = nextFilters.surfaceTerrainMax;
  pricePerSqmMin.value = nextFilters.pricePerSqmMin;
  pricePerSqmMax.value = nextFilters.pricePerSqmMax;
  nextTick(() => {
    isSyncingFromModel = false;
  });
}

watch(
  () => filters.value,
  (nextFilters) => {
    syncPanelFromModel(nextFilters);
  },
  { deep: true },
);

watch(
  [
    showAppartement,
    showMaison,
    yearMin,
    yearMax,
    surfaceMin,
    surfaceMax,
    surfaceTerrainMin,
    surfaceTerrainMax,
    pricePerSqmMin,
    pricePerSqmMax,
  ],
  () => {
    if (isSyncingFromModel) {
      return;
    }

    const typeLocals: string[] = [];
    if (showAppartement.value) {
      typeLocals.push("Appartement");
    }
    if (showMaison.value) {
      typeLocals.push("Maison");
    }

    filters.value = {
      typeLocals,
      yearMin: yearMin.value,
      yearMax: yearMax.value,
      surfaceMin: normalizeOptionalNumber(surfaceMin.value),
      surfaceMax: normalizeOptionalNumber(surfaceMax.value),
      surfaceTerrainMin: normalizeOptionalNumber(surfaceTerrainMin.value),
      surfaceTerrainMax: normalizeOptionalNumber(surfaceTerrainMax.value),
      pricePerSqmMin: normalizeOptionalNumber(pricePerSqmMin.value),
      pricePerSqmMax: normalizeOptionalNumber(pricePerSqmMax.value),
    };
  },
);
</script>
