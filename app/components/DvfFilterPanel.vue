<template>
  <aside class="filter-panel card bg-base-100 shadow-xl">
    <div class="card-body gap-4 p-4">
      <h2 class="card-title text-base">Filtres</h2>

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

      <p v-if="!showAppartement && !showMaison" class="text-sm text-warning">
        Sélectionnez au moins un type de bien.
      </p>
      <p v-else-if="yearMin > yearMax" class="text-sm text-warning">
        L'année de début doit être antérieure ou égale à l'année de fin.
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

watch([showAppartement, showMaison, yearMin, yearMax], () => {
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
  };
});
</script>

<style scoped>
.filter-panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1000;
  width: 16rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}
</style>
