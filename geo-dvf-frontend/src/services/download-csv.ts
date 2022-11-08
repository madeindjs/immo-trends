import { parse } from "csv-parse/browser/esm/sync";

export async function downloadCsv(zipCode: string, year: number) {
  const dep = zipCode.substring(0, 2);
  const response = await fetch(`/files.data.gouv.fr/geo-dvf/latest/csv/${year}/communes/${dep}/${zipCode}.csv`);

  const content = await response.text();

  return parse(content, { columns: true });
}
