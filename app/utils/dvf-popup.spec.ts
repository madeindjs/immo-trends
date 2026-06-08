import assert from "node:assert";
import { describe, it } from "node:test";
import { buildDvfPopupContent } from "./dvf-popup.ts";

describe("buildDvfPopupContent", () => {
  it("formats the property price with Intl in popup HTML", () => {
    const html = buildDvfPopupContent({
      date_mutation: "2021-01-05",
      valeur_fonciere: "185000",
      type_local: "Maison",
      surface_reelle_bati: 97,
      code_postal: "01370",
      nom_commune: "Val-Revermont",
      adresse_numero: "5080",
      adresse_suffixe: "",
      adresse_nom_voie: "CHE DE VOGELAS",
    });

    assert.match(html, /<strong>185 000 €<\/strong>/);
    assert.match(html, /5 janvier 2021/);
    assert.match(html, /5080 CHE DE VOGELAS/);
    assert.match(html, /class="dvf-popup"/);
  });
});
