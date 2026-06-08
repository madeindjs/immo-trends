import { formatMutationDate } from "./format-date.ts";
import { formatPropertyPrice } from "./format-price.ts";

export type DvfPopupProperties = {
  date_mutation: string;
  valeur_fonciere: string;
  type_local: string;
  surface_reelle_bati: number | null;
  code_postal: string;
  nom_commune: string;
  adresse_numero: string;
  adresse_suffixe: string;
  adresse_nom_voie: string;
};

function formatAddress(properties: DvfPopupProperties): string {
  const numero = properties.adresse_numero
    ? `${properties.adresse_numero}${properties.adresse_suffixe ?? ""}`
    : "";
  const voie = properties.adresse_nom_voie || "";

  if (numero && voie) {
    return `${numero} ${voie}`;
  }

  return numero || voie || "—";
}

function formatSurface(surface: number | null): string {
  if (surface == null) {
    return "—";
  }

  return `${surface} m²`;
}

export function buildDvfPopupContent(properties: DvfPopupProperties): string {
  const lines = [
    `<strong>${formatPropertyPrice(properties.valeur_fonciere)}</strong>`,
    formatMutationDate(properties.date_mutation),
    properties.type_local || "—",
    formatAddress(properties),
    `${properties.code_postal} ${properties.nom_commune}`,
    `Surface: ${formatSurface(properties.surface_reelle_bati)}`,
  ];

  return `<div class="dvf-popup">${lines.join("<br>")}</div>`;
}
