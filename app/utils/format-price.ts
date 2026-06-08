const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPropertyPrice(
  value: string | number | null | undefined,
): string {
  if (value == null || value === "") {
    return "—";
  }

  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return currencyFormatter.format(amount);
}

export function formatPricePerSqm(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return currencyFormatter.format(value);
}
