import { type Coordinates } from "../types/types";

export function calculateAreaSquareMeters(points: Coordinates[]): number {
  if (points.length < 3) {
    return 0;
  }

  const earthRadius = 6378137;
  const averageLatRadians =
    (points.reduce((sum, point) => sum + point.lat, 0) / points.length) * (Math.PI / 180);

  const projected = points.map((point) => {
    const lat = point.lat * (Math.PI / 180);
    const lng = point.lng * (Math.PI / 180);

    return {
      x: earthRadius * lng * Math.cos(averageLatRadians),
      y: earthRadius * lat,
    };
  });

  let area = 0;

  for (let index = 0; index < projected.length; index += 1) {
    const next = (index + 1) % projected.length;
    area += projected[index].x * projected[next].y - projected[next].x * projected[index].y;
  }

  return Math.abs(area) / 2;
}

