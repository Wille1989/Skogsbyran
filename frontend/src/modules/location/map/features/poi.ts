import type { Coordinates } from '../data/types';
import type { LocationPoiDraft } from '../../types';
import { isValidCoordinate } from '../data/areaDraft';

export function createPoi(
    position: Coordinates,
    number: number,
    uiId = crypto.randomUUID(),
): LocationPoiDraft {
    if (!isValidCoordinate(position)) {
        throw new Error('Ogiltig POI-position.');
    }

    return {
        uiId,
        name: `POI ${number}`,
        description: '',
        latitude: position.lat,
        longitude: position.lng,
    };
}

export function updatePoi(
    pois: LocationPoiDraft[],
    uiId: string,
    patch: Partial<LocationPoiDraft>,
): LocationPoiDraft[] {
    return pois.map((poi) => (poi.uiId === uiId ? { ...poi, ...patch } : poi));
}

export function removePoi(pois: LocationPoiDraft[], uiId: string): LocationPoiDraft[] {
    return pois.filter((poi) => poi.uiId !== uiId);
}
