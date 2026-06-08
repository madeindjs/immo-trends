import type { DvfMapStats } from "../../types.ts";

const GRAY = "#9ca3af";

/** Tailwind 700 palette: red (expensive) → sky (cheap). */
const PRICE_SCALE_700 = [
  "#b91c1c", // red-700
  "#c2410c", // orange-700
  "#b45309", // amber-700
  "#a16207", // yellow-700
  "#4d7c0f", // lime-700
  "#15803d", // green-700
  "#047857", // emerald-700
  "#0f766e", // teal-700
  "#0e7490", // cyan-700
  "#0369a1", // sky-700
] as const;

const MEDIAN_INDEX = 5;

export type DvfMarkerColors = {
  fillColor: string;
  color: string;
};

function hasValidStats(stats: DvfMapStats): stats is {
  medianPricePerSqm: number;
  minPricePerSqm: number;
  maxPricePerSqm: number;
} {
  return (
    stats.medianPricePerSqm !== null &&
    stats.minPricePerSqm !== null &&
    stats.maxPricePerSqm !== null
  );
}

function scaleIndex(pricePerSqm: number, stats: DvfMapStats): number {
  const { medianPricePerSqm, minPricePerSqm, maxPricePerSqm } = stats;

  if (pricePerSqm <= medianPricePerSqm) {
    const range = medianPricePerSqm - minPricePerSqm;
    const t = range === 0 ? 0 : (medianPricePerSqm - pricePerSqm) / range;
    const offset = Math.round(t * (PRICE_SCALE_700.length - 1 - MEDIAN_INDEX));
    return Math.min(MEDIAN_INDEX + offset, PRICE_SCALE_700.length - 1);
  }

  const range = maxPricePerSqm - medianPricePerSqm;
  const t = range === 0 ? 0 : (pricePerSqm - medianPricePerSqm) / range;
  const offset = Math.round(t * MEDIAN_INDEX);
  return Math.max(MEDIAN_INDEX - offset, 0);
}

export function pricePerSqmToColor(
  pricePerSqm: number | null,
  stats: DvfMapStats,
): DvfMarkerColors {
  if (pricePerSqm === null || !hasValidStats(stats)) {
    return { fillColor: GRAY, color: GRAY };
  }

  const fillColor = PRICE_SCALE_700[scaleIndex(pricePerSqm, stats)];
  return { fillColor, color: fillColor };
}
