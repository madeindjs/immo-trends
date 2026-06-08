CREATE INDEX IF NOT EXISTS idx_dvf_map_filter
ON dvf(type_local, date_mutation, latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dvf_map_bbox
ON dvf(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dvf_code_iris ON dvf(code_iris);
