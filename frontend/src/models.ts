export enum DvfType {
  "Maison" = "Maison",
  "Dépendance" = "Dépendance",
  "Appartement" = "Appartement",
  "Unknown" = "",
}
export interface YearStat {
  count: Record<DvfType, number>;
  pricePerM2Median: Record<DvfType, number>;
  towns: string[];
  firstMutationDate: string;
  lastMutationDate: string;
}
