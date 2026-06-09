import type { DvfMapStats } from "../../types.ts";

const GRAY = "#9ca3af";

const PRICE_SCALE_700 = [
  "#440154",
  "#482777",
  "#3f4a8a",
  "#31678e",
  "#26838f",
  "#1f9d8a",
  "#6cce5a",
  "#b6de2b",
  "#fee825",
];

// .scale(["#fff33b", "#fdc70c", "#f3903f", "#ed683c", "#e93e3a"])
// .scale(["#93c47d", "#b1cf85", "#fbb021", "#f68838", "#ee3e32"])

const MEDIAN_INDEX = Math.floor(PRICE_SCALE_700.length / 2);

export type DvfMarkerColors = {
  fillColor: string;
  color: string;
};

type ValidDvfStats = {
  medianPricePerSqm: number;
  minPricePerSqm: number;
  maxPricePerSqm: number;
};

function hasValidStats(stats: DvfMapStats): stats is ValidDvfStats {
  return (
    stats.medianPricePerSqm !== null &&
    stats.minPricePerSqm !== null &&
    stats.maxPricePerSqm !== null
  );
}

function scaleIndex(pricePerSqm: number, stats: ValidDvfStats): number {
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

  const fillColor = PRICE_SCALE_700[scaleIndex(pricePerSqm, stats)] ?? GRAY;
  return { fillColor, color: "black" };
}
