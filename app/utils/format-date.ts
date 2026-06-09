import type { DvfTrendGroupBy } from "../../types.ts";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatTrendPeriodLabel(
  period: string | null | undefined,
  groupBy: DvfTrendGroupBy,
): string {
  if (period == null || period === "") {
    return "—";
  }

  if (groupBy === "year") {
    return period;
  }

  if (groupBy === "quarter") {
    const match = /^(\d{4})-Q([1-4])$/.exec(period);
    if (!match) {
      return period;
    }

    return `T${match[2]} ${match[1]}`;
  }

  const [year, monthNum] = period.split("-");
  if (!year || !monthNum) {
    return period;
  }

  const date = new Date(`${year}-${monthNum}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return period;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTrendMonthLabel(month: string | null | undefined): string {
  return formatTrendPeriodLabel(month, "month");
}

export function formatMutationDate(
  dateMutation: string | null | undefined,
): string {
  if (dateMutation == null || dateMutation === "") {
    return "—";
  }

  const date = new Date(`${dateMutation}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateMutation;
  }

  return dateFormatter.format(date);
}
