type Position = [number, number];
type Ring = Position[];
type PolygonCoordinates = Ring[];
type MultiPolygonCoordinates = PolygonCoordinates[];

export type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: PolygonCoordinates }
  | { type: "MultiPolygon"; coordinates: MultiPolygonCoordinates };

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0];
    const yi = ring[i]![1];
    const xj = ring[j]![0];
    const yj = ring[j]![1];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInPolygonCoordinates(
  lng: number,
  lat: number,
  coordinates: PolygonCoordinates,
): boolean {
  if (coordinates.length === 0) {
    return false;
  }

  if (!pointInRing(lng, lat, coordinates[0]!)) {
    return false;
  }

  for (let holeIndex = 1; holeIndex < coordinates.length; holeIndex++) {
    if (pointInRing(lng, lat, coordinates[holeIndex]!)) {
      return false;
    }
  }

  return true;
}

export function pointInGeoJsonGeometry(
  lng: number,
  lat: number,
  geometry: GeoJsonGeometry,
): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygonCoordinates(lng, lat, geometry.coordinates);
  }

  for (const polygon of geometry.coordinates) {
    if (pointInPolygonCoordinates(lng, lat, polygon)) {
      return true;
    }
  }

  return false;
}

export function computeGeometryBbox(geometry: GeoJsonGeometry): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const visitPosition = (position: Position): void => {
    const lng = position[0];
    const lat = position[1];
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  };

  const visitPolygon = (coordinates: PolygonCoordinates): void => {
    for (const ring of coordinates) {
      for (const position of ring) {
        visitPosition(position);
      }
    }
  };

  if (geometry.type === "Polygon") {
    visitPolygon(geometry.coordinates);
  } else {
    for (const polygon of geometry.coordinates) {
      visitPolygon(polygon);
    }
  }

  return { minLat, maxLat, minLng, maxLng };
}
