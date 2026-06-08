CREATE TABLE IF NOT EXISTS iris (
  code_iris TEXT PRIMARY KEY,
  insee_com TEXT NOT NULL,
  nom_com TEXT,
  nom_iris TEXT,
  typ_iris TEXT,
  min_lat REAL NOT NULL,
  max_lat REAL NOT NULL,
  min_lng REAL NOT NULL,
  max_lng REAL NOT NULL,
  geometry TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_iris_bbox
  ON iris(min_lat, max_lat, min_lng, max_lng);

CREATE INDEX IF NOT EXISTS idx_iris_insee ON iris(insee_com);
