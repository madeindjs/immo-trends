import { YearStat } from "../models";

export const fetchYearStat = (year: string, zipCode: string): Promise<YearStat> =>
  fetch(`/api/v1/stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ zipCode, year }),
  }).then((res) => res.json());
