import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import {
  createSampleDb,
  removeSampleDb,
} from "../../../test-data/setup-test-db.ts";
import { queryDvfByRowid, queryDvfInBounds } from "../../utils/dvf-db.ts";

describe("queryDvfByRowid", () => {
  let dbPath = "";

  before(() => {
    dbPath = createSampleDb();
  });

  after(() => {
    removeSampleDb(dbPath);
  });

  it("returns the full row for a valid rowid", () => {
    const { points } = queryDvfInBounds(
      {
        north: 46.33,
        south: 46.32,
        east: 5.39,
        west: 5.38,
      },
      { limit: 2000 },
      dbPath,
    );

    const point = points.find(
      (entry) => entry.type_local === "Maison" && entry.adresse_numero === "5080",
    );
    assert.ok(point);

    const row = queryDvfByRowid(point!.rowid, dbPath);
    assert.ok(row);
    assert.strictEqual(row!.rowid, point!.rowid);
    assert.strictEqual(row!.id_mutation, point!.id_mutation);
    assert.strictEqual(row!.valeur_fonciere, point!.valeur_fonciere);
    assert.strictEqual(row!.type_local, "Maison");
    assert.strictEqual(row!.surface_reelle_bati, 97);
    assert.strictEqual(row!.nombre_pieces_principales, 5);
    assert.strictEqual(row!.nom_commune, "Val-Revermont");
    assert.strictEqual(row!.id_parcelle, "01426312ZC0122");
  });

  it("returns null for a missing rowid", () => {
    assert.strictEqual(queryDvfByRowid(9_999_999, dbPath), null);
  });
});
