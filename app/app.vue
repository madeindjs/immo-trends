<template>
  <ClientOnly>
    <div v-if="mapReady" class="map">
      <LMap
        v-model:zoom="zoom"
        v-model:center="center"
        :use-global-leaflet="false"
        @ready="onMapReady"
      >
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
          layer-type="base"
          name="OpenStreetMap"
        />
      </LMap>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Map } from "leaflet";

const STORAGE_KEY = "immo-trends.map";
const DEFAULT_ZOOM = 6;
const DEFAULT_CENTER: [number, number] = [46.6, 2.4];

type MapViewState = {
  zoom: number;
  center: [number, number];
};

function loadMapView(): MapViewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { zoom: DEFAULT_ZOOM, center: DEFAULT_CENTER };
    }

    const parsed = JSON.parse(raw) as Partial<MapViewState>;
    const lat = parsed.center?.[0];
    const lng = parsed.center?.[1];

    if (
      typeof parsed.zoom === "number" &&
      typeof lat === "number" &&
      typeof lng === "number"
    ) {
      return { zoom: parsed.zoom, center: [lat, lng] };
    }
  } catch {
    // ignore invalid stored state
  }

  return { zoom: DEFAULT_ZOOM, center: DEFAULT_CENTER };
}

function saveMapView(state: MapViewState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const mapReady = ref(false);
const zoom = ref(DEFAULT_ZOOM);
const center = ref<[number, number]>(DEFAULT_CENTER);

onMounted(() => {
  const saved = loadMapView();
  zoom.value = saved.zoom;
  center.value = saved.center;
  mapReady.value = true;
});

function onMapReady(map: Map): void {
  map.on("moveend", () => {
    const { lat, lng } = map.getCenter();
    saveMapView({
      zoom: map.getZoom(),
      center: [lat, lng],
    });
  });
}
</script>

<style>
html,
body,
#__nuxt {
  height: 100%;
  margin: 0;
}
</style>

<style scoped>
.map {
  height: 100vh;
  width: 100vw;
}
</style>
