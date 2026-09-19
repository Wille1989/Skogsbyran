import type { MapFilter, MapData } from '../types/types';

// Presentation only: never mutate the saved data or the form draft.
export function filterMapData(data: MapData, filter: MapFilter): MapData {
    return {
        polygons: filter === 'poi' ? [] : data.polygons,
        marker: filter === 'area' ? null : data.marker,
        pois: filter === 'area' ? [] : data.pois,
    };
}
