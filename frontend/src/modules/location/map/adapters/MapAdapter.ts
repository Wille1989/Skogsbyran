import type { Coordinates, Basemap, MapBounds, ScreenPoint, MapIssue } from '../data/types';

// Only camera, projection and map input cross the engine boundary.
// Geometry, editing and POI rendering belong to the shared features/UI.
export interface MapAdapter {
    readonly basemaps: readonly Basemap[];
    getBasemap(): string;
    setBasemap(id: string): void;
    setCenter(position: Coordinates): void;
    getCenter(): Coordinates;
    setZoom(zoom: number): void;
    getZoom(): number;
    fitBounds(bounds: MapBounds): void;
    project(position: Coordinates): ScreenPoint | null;
    unproject(point: ScreenPoint): Coordinates | null;
    onClick(listener: (position: Coordinates) => void): () => void;
    onViewChange(listener: () => void): () => void;
    setPanEnabled(enabled: boolean): void;
    resize(): void;
    destroy(): void;
}

export type MapIssueListener = (issue: MapIssue | null) => void;

export type MapFactory = (element: HTMLElement, onIssue: MapIssueListener) => Promise<MapAdapter>;
