import type { PropertyLocationPayload } from '../../types';
import type { MapAdapter, MapFactory } from '../adapters/MapAdapter';
import type { GeocoderFactory } from '../adapters/GeocoderAdapter';

export type Coordinates = {
    lat: number;
    lng: number;
};

export type PropertyArea = {
    id: string;
    propertyId: string;
    name: string;
    polygon: Coordinates[];
    marker: Coordinates;
    areaSquareMeters: number;
    areaHectares: number;
    createdAt?: string;
    updatedAt?: string;
};

export type PropertyAreaCollection = {
    propertyId: string;
    totalAreaSquareMeters: number;
    areas: PropertyArea[];
};

export type PropertyAreaPayload = {
    name: string;
    polygon: Coordinates[];
};

export type PropertyAreaDraft = {
    name: string;
    polygon: Coordinates[];
};

// Camera and screen geometry.
export type ScreenPoint = {
    x: number;
    y: number;
};

export type MapBounds = {
    north: number;
    south: number;
    east: number;
    west: number;
};

export type Basemap = {
    id: string;
    label: string;
};

export type MapViewState = {
    center: Coordinates;
    zoom: number;
};

// Shared map input and editing state.
export type MapMode = 'polygon' | 'marker' | 'poi' | 'navigate';

export type PropertyMapOptions = {
    polygon: Coordinates[];
    otherPolygons?: Coordinates[][];
    marker: Coordinates | null;
    pois?: PropertyLocationPayload['pois'];
    mode?: MapMode;
    readOnly?: boolean;
    onPolygonChange?: (polygon: Coordinates[]) => void;
    onSetMarker?: (marker: Coordinates) => void;
    onAddPoi?: (position: Coordinates) => void;
    onMovePoi?: (index: number, position: Coordinates) => void;
};

export type MapFilter = 'all' | 'area' | 'poi';

export type MapData = {
    polygons: Coordinates[][];
    marker: Coordinates | null;
    pois: PropertyLocationPayload['pois'];
};

export type DrawingAction =
    | { type: 'add'; position: Coordinates }
    | { type: 'move'; index: number; position: Coordinates }
    | { type: 'insert'; index: number; position: Coordinates }
    | { type: 'remove'; index: number }
    | { type: 'clear' };

export type HandleInteraction = {
    map: MapAdapter;
    position: Coordinates;
    screen: ScreenPoint;
    onMove?: (position: Coordinates) => void;
    onStart?: () => void;
    onCancel?: () => void;
    onRemove?: () => void;
    onActivate?: () => void;
};

// Composition uses adapter contracts through type-only imports.
export type MapRuntime = {
    createMap: MapFactory;
    createGeocoder: GeocoderFactory;
};

// Provider-neutral address results.
export type AddressSuggestion = {
    id: string;
    label: string;
};

export type AddressSearchResult = {
    label: string;
    coordinates: Coordinates;
    bounds?: MapBounds;
    address: string;
    postalCode: string;
    city: string;
    municipality: string;
    countryCode: string;
    source?: { provider: string; id: string };
};

export type MapIssue = {
    kind: 'fatal' | 'layer';
    message: string;
};
