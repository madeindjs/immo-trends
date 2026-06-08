const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

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
