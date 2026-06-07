/**
 * Parse French date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
 */
export function parseDateFr(dateStr: string): string | undefined {
  if (!dateStr || !dateStr.includes("/")) return undefined;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return undefined;
  const day = parts[0].padStart(2, "0");
  const month = parts[1].padStart(2, "0");
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

/**
 * Parse French integer format (removes comma and decimal part)
 * French format: "185000,00" means 185000 (comma is decimal separator)
 */
export function parseIntFr(number: string): number | undefined {
  if (!number) return undefined;
  // Remove comma and everything after it (French integer format)
  const cleaned = number.split(",")[0];
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Parse French float format (replaces comma with dot)
 */
export function parseFloatFr(number: string): number | undefined {
  if (!number) return undefined;
  // Replace comma with dot for decimal
  const cleaned = number.replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
}
