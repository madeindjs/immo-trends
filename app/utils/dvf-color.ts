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

const AVERAGE_INDEX = 5;

export type DvfMarkerColors = {
  fillColor: string;
  color: string;
};

function hasValidStats(stats: DvfMapStats): stats is {
  averagePricePerSqm: number;
  minPricePerSqm: number;
  maxPricePerSqm: number;
} {
  return (
    stats.averagePricePerSqm !== null &&
    stats.minPricePerSqm !== null &&
    stats.maxPricePerSqm !== null
  );
}

function scaleIndex(pricePerSqm: number, stats: DvfMapStats): number {
  const { averagePricePerSqm, minPricePerSqm, maxPricePerSqm } = stats;

  if (pricePerSqm <= averagePricePerSqm) {
    const range = averagePricePerSqm - minPricePerSqm;
    const t = range === 0 ? 0 : (averagePricePerSqm - pricePerSqm) / range;
    const offset = Math.round(t * (PRICE_SCALE_700.length - 1 - AVERAGE_INDEX));
    return Math.min(AVERAGE_INDEX + offset, PRICE_SCALE_700.length - 1);
  }

  const range = maxPricePerSqm - averagePricePerSqm;
  const t = range === 0 ? 0 : (pricePerSqm - averagePricePerSqm) / range;
  const offset = Math.round(t * AVERAGE_INDEX);
  return Math.max(AVERAGE_INDEX - offset, 0);
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
