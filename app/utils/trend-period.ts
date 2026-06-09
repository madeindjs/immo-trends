import type { DvfTrendGroupBy } from "../../types.ts";

export function getTrendPeriod(
  dateMutation: string,
  groupBy: DvfTrendGroupBy,
): string {
  const year = dateMutation.slice(0, 4);
  const month = dateMutation.slice(5, 7);

  if (groupBy === "year") {
    return year;
  }

  if (groupBy === "quarter") {
    const quarter = Math.floor((Number(month) - 1) / 3) + 1;
    return `${year}-Q${quarter}`;
  }

  return dateMutation.slice(0, 7);
}

export function matchesTrendPeriod(
  dateMutation: string,
  period: string,
  groupBy: DvfTrendGroupBy,
): boolean {
  return getTrendPeriod(dateMutation, groupBy) === period;
}

export const TREND_GROUP_BY_LABELS: Record<DvfTrendGroupBy, string> = {
  month: "Mois",
  quarter: "Trimestre",
  year: "Année",
};
