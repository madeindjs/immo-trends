const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatTrendMonthLabel(month: string | null | undefined): string {
  if (month == null || month === "") {
    return "—";
  }

  const [year, monthNum] = month.split("-");
  if (!year || !monthNum) {
    return month;
  }

  const date = new Date(`${year}-${monthNum}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
  }).format(date);
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
