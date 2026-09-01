import type {
    Coordinates,
    PropertyAreaDraft,
    PropertyAreaPayload,
} from "./types";

export const DEFAULT_AREA_MARKER: Coordinates = {
    lat: 59.3293,
    lng: 18.0686,
};

export function createDefaultAreaDraft(): PropertyAreaDraft {
    return {
        name: "Område 1",
        polygon: [],
        marker: DEFAULT_AREA_MARKER,
    };
}

export function roundCoordinate(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
}

export function buildAreaPayload(draft: PropertyAreaDraft): PropertyAreaPayload | null {
    if (draft.polygon.length < 3) {
        return null;
    }

    const marker = draft.marker ?? DEFAULT_AREA_MARKER;

    return {
    name:
    draft.name.trim() || "Område 1",

    polygon: draft.polygon.map((point) => ({
        lat: roundCoordinate(point.lat),
        lng: roundCoordinate(point.lng),
    })),

    marker: {
        lat: roundCoordinate(marker.lat),
        lng: roundCoordinate(marker.lng),
        },
    };
}