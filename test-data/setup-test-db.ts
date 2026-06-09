import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const rootDir = path.join(import.meta.dirname, "..");

export function createSampleDb(): string {
  const dbPath = path.join(
    os.tmpdir(),
    `dvf-test-${process.pid}-${Date.now()}.sqlite3`,
  );
  const schema = (fs.readFileSync(path.join(rootDir, "init.sql"), "utf8").split(
    ".import",
  )[0] ?? "").trim();
  const csvPath = path.join(rootDir, "test-data", "dvf.sample.csv");

  const db = new DatabaseSync(dbPath);
  db.exec(schema);
  db.close();

  const indexesPath = path.join(rootDir, "indexes.sql");
  execSync(
    `sqlite3 "${dbPath}" ".mode csv" ".import ${csvPath} dvf" "DELETE FROM dvf WHERE type_local IS NULL;" ".read ${indexesPath}"`,
    { stdio: "pipe" },
  );

  return dbPath;
}

export function removeSampleDb(dbPath: string): void {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}
