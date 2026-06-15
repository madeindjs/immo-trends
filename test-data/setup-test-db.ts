import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const rootDir = path.join(import.meta.dirname, "..");

export function createSampleDb(): string {
  const dbPath = path.join(
    os.tmpdir(),
    `dvf-test-${process.pid}-${Date.now()}.sqlite3`,
  );
  const csvPath = path.join(rootDir, "test-data", "dvf.sample.csv");
  const initSqlPath = path.join(rootDir, "init.sql");
  const indexesSqlPath = path.join(rootDir, "indexes.sql");

  const initSql = fs.readFileSync(initSqlPath, "utf8");

  // Remove the generated year column and its indexes so the schema works
  // across SQLite versions that handle GENERATED columns differently.
  // The test CSV has 40 columns, matching the table without "year".
  let testInitSql = initSql
    .replace(
      /\s*"year" INTEGER GENERATED ALWAYS AS \(strftime\('%Y', date_mutation\)\) STORED,/,
      "",
    )
    .replace(
      /\s*CREATE INDEX idx_dvf_code_postal_type_local_year ON dvf\(code_postal, type_local, year\);/,
      "",
    )
    .replace(
      /\s*CREATE INDEX idx_dvf_year ON dvf\(year\);/,
      "",
    )
    .replace(
      /\.import -skip 1 -csv data\/dvf\.csv dvf/,
      `.import -skip 1 -csv ${csvPath} dvf`,
    )
    .replace(
      /\.read indexes\.sql/,
      fs.readFileSync(indexesSqlPath, "utf8"),
    );

  const tempSqlPath = path.join(
    os.tmpdir(),
    `dvf-test-init-${process.pid}-${Date.now()}.sql`,
  );
  fs.writeFileSync(tempSqlPath, testInitSql);

  try {
    execSync(`sqlite3 "${dbPath}" < "${tempSqlPath}"`, { stdio: "pipe" });
  } finally {
    fs.unlinkSync(tempSqlPath);
  }

  return dbPath;
}

export function removeSampleDb(dbPath: string): void {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}
