import type { Coordinates } from '../data/types';
import type { MapAdapter } from '../adapters/MapAdapter';
import { boundsFor, DEFAULT_VIEW } from '../domain/map';
import type { AddressSearchResult } from '../adapters/GeocoderAdapter';

export function fitProperty(map: MapAdapter, points: Coordinates[]) {
    const bounds = boundsFor(points);
    if (!bounds) {
        map.setCenter(DEFAULT_VIEW.center);
        map.setZoom(DEFAULT_VIEW.zoom);
    } else if (bounds.north === bounds.south && bounds.east === bounds.west) {
        map.setCenter(points[0]);
        map.setZoom(15);
    } else {
        map.fitBounds(bounds);
    }
}

export function showAddress(map: MapAdapter, result: AddressSearchResult) {
    if (result.bounds) {
        map.fitBounds(result.bounds);
    } else {
        map.setCenter(result.coordinates);
        map.setZoom(15);
    }
}
