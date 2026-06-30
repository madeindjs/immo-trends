/**
 * Calculate median from an array of numbers
 * @param array - Array of numbers
 * @returns Median value, or 0 if array is empty
 */
export function getMedian(array: number[]): number {
  if (array.length === 0) return 0;
  const sorted = array.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const lower = sorted[middle - 1];
    const upper = sorted[middle];
    if (lower === undefined || upper === undefined) {
      return 0;
    }
    return (lower + upper) / 2;
  }
  return sorted[middle] ?? 0;
}

/**
 * Price statistics for a set of values
 */
export interface PriceStats {
  prices: number[];
  median: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Calculate price statistics from an array of numbers
 * @param prices - Array of price values
 * @returns PriceStats object with all statistics, or null if no valid prices
 */
export function getPriceStats(prices: number[]): PriceStats | null {
  const validPrices = prices.filter((p) => p != null && !isNaN(p));
  if (validPrices.length === 0) return null;

  let min: number = validPrices[0]!;
  let max: number = validPrices[0]!;
  let sum = 0;
  for (const price of validPrices) {
    if (price < min) min = price;
    if (price > max) max = price;
    sum += price;
  }

  return {
    prices: validPrices,
    median: getMedian(validPrices),
    average: sum / validPrices.length,
    min,
    max,
    count: validPrices.length,
  };
}

/**
 * Calculate price per square meter from value and surface
 * @param valeurFonciere - Property value (string or number)
 * @param surfaceReelleBati - Surface in square meters
 * @returns Price per m², or null if inputs are invalid
 */
export function calculatePricePerSqm(
  valeurFonciere: string | number | null | undefined,
  surfaceReelleBati: number | null | undefined,
): number | null {
  if (
    valeurFonciere == null ||
    surfaceReelleBati == null ||
    surfaceReelleBati <= 0
  ) {
    return null;
  }
  const value = Number(valeurFonciere);
  if (isNaN(value) || value <= 0) return null;
  return value / surfaceReelleBati;
}
