import type { Coordinates, MapBounds, MapViewState } from '../data/types';

export const DEFAULT_VIEW: MapViewState = { center: { lat: 59.3293, lng: 18.0686 }, zoom: 6 };

export function boundsFor(points: readonly Coordinates[]): MapBounds | null {
    if (!points.length) {
        return null;
    }

    return points.reduce(
        (bounds, point) => ({
            north: Math.max(bounds.north, point.lat),
            south: Math.min(bounds.south, point.lat),
            east: Math.max(bounds.east, point.lng),
            west: Math.min(bounds.west, point.lng),
        }),
        { north: points[0].lat, south: points[0].lat, east: points[0].lng, west: points[0].lng },
    );
}
