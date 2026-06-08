<template>
  <ClientOnly>
    <div v-if="mapReady" class="map">
      <DvfFilterPanel v-model="filters" />

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

      <div v-if="statusToast" class="toast toast-bottom toast-end z-[1000]">
        <div :class="['alert', statusToast.alertClass]">
          <span
            v-if="statusToast.showSpinner"
            class="loading loading-spinner loading-sm"
          />
          <span>{{ statusToast.message }}</span>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { Feature, FeatureCollection, Point } from "geojson";
import type { GeoJSON, Map } from "leaflet";
import { MIN_FETCH_ZOOM } from "./composables/useDvfPoints.ts";
import { pricePerSqmToColor } from "./utils/dvf-color.ts";
import type { DvfMapPoint } from "../types.ts";
import { calculatePricePerSqm } from "../scripts/draw.utils.ts";
import type { DvfPointFilters } from "./composables/useDvfPoints.ts";

type LeafletModule = typeof import("leaflet/dist/leaflet-src.esm");

const STORAGE_KEY = "immo-trends.map";
const DEFAULT_ZOOM = 6;
const DEFAULT_CENTER: [number, number] = [46.6, 2.4];

type MapViewState = {
  zoom: number;
  center: [number, number];
};

type DvfFeatureProperties = {
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: string;
  type_local: string;
  surface_reelle_bati: number | null;
  code_postal: string;
  nom_commune: string;
  adresse_nom_voie: string;
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

function formatPrice(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toFeature(point: DvfMapPoint): Feature<Point, DvfFeatureProperties> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude],
    },
    properties: {
      id_mutation: point.id_mutation,
      date_mutation: point.date_mutation,
      valeur_fonciere: point.valeur_fonciere,
      type_local: point.type_local,
      surface_reelle_bati: point.surface_reelle_bati,
      code_postal: point.code_postal,
      nom_commune: point.nom_commune,
      adresse_nom_voie: point.adresse_nom_voie,
    },
  };
}

function buildPopupContent(properties: DvfFeatureProperties): string {
  const surface =
    properties.surface_reelle_bati === null
      ? "—"
      : `${properties.surface_reelle_bati} m²`;

  return [
    `<strong>${formatPrice(properties.valeur_fonciere)}</strong>`,
    properties.date_mutation,
    properties.type_local || "—",
    properties.adresse_nom_voie || "—",
    `${properties.code_postal} ${properties.nom_commune}`,
    `Surface: ${surface}`,
  ].join("<br>");
}

const mapReady = ref(false);
const zoom = ref(DEFAULT_ZOOM);
const center = ref<[number, number]>(DEFAULT_CENTER);
const mapInstance = shallowRef<Map | null>(null);
const leafletModule = shallowRef<LeafletModule | null>(null);
const dvfLayer = shallowRef<GeoJSON | null>(null);
const { points, stats, loading, error, truncated, cancelPending, scheduleFetch } =
  useDvfPoints();

const filters = ref<DvfPointFilters>({
  typeLocals: ["Appartement", "Maison"],
  yearMin: 2014,
  yearMax: new Date().getFullYear(),
});

function filtersAreValid(): boolean {
  return (
    filters.value.typeLocals.length > 0 &&
    filters.value.yearMin <= filters.value.yearMax
  );
}

function buildFeatureCollection(): FeatureCollection<
  Point,
  DvfFeatureProperties
> {
  return {
    type: "FeatureCollection",
    features: points.value.map(toFeature),
  };
}

async function getLeaflet(): Promise<LeafletModule> {
  if (!leafletModule.value) {
    leafletModule.value = await import("leaflet/dist/leaflet-src.esm");
  }

  return leafletModule.value;
}

async function renderPoints(): Promise<void> {
  const map = mapInstance.value;
  if (!map) {
    return;
  }

  const L = await getLeaflet();

  if (dvfLayer.value) {
    map.removeLayer(dvfLayer.value);
    dvfLayer.value = null;
  }

  if (points.value.length === 0) {
    return;
  }

  dvfLayer.value = L.geoJSON(buildFeatureCollection(), {
    pointToLayer(feature, latlng) {
      const properties = feature.properties as DvfFeatureProperties;
      const pricePerSqm = calculatePricePerSqm(
        properties.valeur_fonciere,
        properties.surface_reelle_bati,
      );
      const { fillColor, color } = pricePerSqmToColor(pricePerSqm, stats.value);

      return L.circleMarker(latlng, {
        radius: 5,
        color,
        weight: 1,
        fillColor,
        fillOpacity: 0.8,
      });
    },
    onEachFeature(feature, layer) {
      layer.bindPopup(
        buildPopupContent(feature.properties as DvfFeatureProperties),
      );
    },
  });

  dvfLayer.value.addTo(map);
}

type StatusToast = {
  message: string;
  alertClass: string;
  showSpinner?: boolean;
};

const statusToast = computed((): StatusToast | null => {
  if (loading.value) {
    return {
      message: "Chargement des transactions DVF…",
      alertClass: "alert-info",
      showSpinner: true,
    };
  }

  if (error.value) {
    return {
      message: error.value,
      alertClass: "alert-error",
    };
  }

  if (!filtersAreValid()) {
    return {
      message: "Ajustez les filtres pour afficher les transactions DVF.",
      alertClass: "alert-warning",
    };
  }

  if ((mapInstance.value?.getZoom() ?? zoom.value) < MIN_FETCH_ZOOM) {
    return {
      message: "Zoomez pour afficher les transactions DVF.",
      alertClass: "alert-warning",
    };
  }

  if (truncated.value) {
    return {
      message: `${points.value.length} transactions affichées (résultats tronqués).`,
      alertClass: "alert-success",
    };
  }

  if (points.value.length > 0) {
    return {
      message: `${points.value.length} transactions affichées.`,
      alertClass: "alert-success",
    };
  }

  return {
    message: "Aucune transaction DVF dans cette zone.",
    alertClass: "alert-info",
  };
});

function refreshPoints(): void {
  const map = mapInstance.value;
  if (!map) {
    return;
  }

  scheduleFetch(map.getBounds(), map.getZoom(), filters.value);
}

watch([points, stats], () => {
  void renderPoints();
});

watch(filters, () => {
  refreshPoints();
}, { deep: true });

onBeforeUnmount(() => {
  const map = mapInstance.value;
  if (map && dvfLayer.value) {
    map.removeLayer(dvfLayer.value);
  }
});

onMounted(() => {
  const saved = loadMapView();
  zoom.value = saved.zoom;
  center.value = saved.center;
  mapReady.value = true;
});

function onMapReady(map: Map): void {
  mapInstance.value = map;

  const handleViewportChange = () => {
    const { lat, lng } = map.getCenter();
    saveMapView({
      zoom: map.getZoom(),
      center: [lat, lng],
    });
    refreshPoints();
  };

  map.on("movestart", cancelPending);
  map.on("zoomstart", cancelPending);
  map.on("moveend", handleViewportChange);
  map.on("zoomend", handleViewportChange);
  refreshPoints();
  void renderPoints();
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
  position: relative;
}
</style>
