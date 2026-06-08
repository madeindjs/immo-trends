import assert from "node:assert";
import { describe, it } from "node:test";
import type { DvfRowDetail } from "../../types.ts";
import {
  buildDvfDetailSections,
  buildDvfDetailSubtitle,
  buildDvfDetailTitle,
  formatDvfDetailValue,
} from "./dvf-detail-fields.ts";

const sampleRow: DvfRowDetail = {
  rowid: 2,
  id_mutation: "2021-1",
  date_mutation: "2021-01-05",
  numero_disposition: "000001",
  nature_mutation: "Vente",
  valeur_fonciere: "185000",
  adresse_numero: "5080",
  adresse_suffixe: "",
  adresse_nom_voie: "CHE DE VOGELAS",
  adresse_code_voie: "0471",
  code_postal: "01370",
  code_commune: "01426",
  nom_commune: "Val-Revermont",
  code_departement: "01",
  ancien_code_commune: "",
  ancien_nom_commune: "",
  id_parcelle: "01426312ZC0122",
  ancien_id_parcelle: "",
  numero_volume: "",
  lot1_numero: "",
  lot1_surface_carrez: null,
  lot2_numero: "",
  lot2_surface_carrez: null,
  lot3_numero: "",
  lot3_surface_carrez: null,
  lot4_numero: "",
  lot4_surface_carrez: null,
  lot5_numero: "",
  lot5_surface_carrez: null,
  nombre_lots: 0,
  code_type_local: "1",
  type_local: "Maison",
  surface_reelle_bati: 97,
  nombre_pieces_principales: 5,
  code_nature_culture: "S",
  nature_culture: "sols",
  code_nature_culture_speciale: "",
  nature_culture_speciale: "",
  surface_terrain: 2410,
  longitude: 5.386107,
  latitude: 46.327101,
};

describe("formatDvfDetailValue", () => {
  it("formats prices, dates, surfaces, and empty values", () => {
    assert.strictEqual(formatDvfDetailValue("valeur_fonciere", "185000"), "185 000 €");
    assert.match(formatDvfDetailValue("date_mutation", "2021-01-05"), /5 janvier 2021/);
    assert.strictEqual(formatDvfDetailValue("surface_reelle_bati", 97), "97 m²");
    assert.strictEqual(formatDvfDetailValue("adresse_suffixe", ""), "—");
    assert.strictEqual(formatDvfDetailValue("longitude", 5.386107), "5.386107");
  });
});

describe("buildDvfDetailSections", () => {
  it("groups fields by section", () => {
    const sections = buildDvfDetailSections(sampleRow);
    const mutation = sections.find((section) => section.title === "Mutation");

    assert.ok(mutation);
    assert.ok(
      mutation!.fields.some(
        (field) => field.key === "valeur_fonciere" && field.value === "185 000 €",
      ),
    );
  });
});

describe("buildDvfDetailTitle", () => {
  it("uses the address when available", () => {
    assert.strictEqual(buildDvfDetailTitle(sampleRow), "5080 CHE DE VOGELAS");
    assert.strictEqual(buildDvfDetailSubtitle(sampleRow), "185 000 €");
  });
});
