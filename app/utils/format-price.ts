const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatCurrencyValue(value: number): string {
  return currencyFormatter
    .format(value)
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ");
}

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

  return formatCurrencyValue(amount);
}

export function formatPricePerSqm(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return formatCurrencyValue(value);
}
