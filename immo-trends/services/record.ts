import { CSVRow } from "../models";

export function getSurface(row: CSVRow) {
  return [1, 2, 3, 4, 5]
    .map((i) =>
      // @ts-ignore
      Number(row[`lot${i}_surface_carrez`] || 0)
    )
    .reduce((a, b) => a + b, 0);
}
