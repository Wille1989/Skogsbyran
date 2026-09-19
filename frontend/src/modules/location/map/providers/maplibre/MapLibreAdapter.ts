import type { MapBounds, ScreenPoint, Coordinates } from '../../types/types';
import { Map as LibreMap, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapAdapter, MapFactory, MapIssueListener } from '../../adapters/MapAdapter';
import { DEFAULT_VIEW } from '../../helpers/map';

import { lantmaterietBasemaps, type MapLibreBasemap } from '../lantmateriet/basemaps';

export function styleFor(layer: MapLibreBasemap): string | StyleSpecification {
    if (layer.kind === 'style') {
        return layer.url;
    }

    return {
        version: 8,
        sources: {
            basemap: {
                type: 'raster',
                tiles: [layer.tiles],
                tileSize: 256,
                maxzoom: layer.maxZoom,
                attribution: layer.attribution,
            },
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
    };
}

export const createMapLibreMap: MapFactory = async (element, onError) => {
    const layers = lantmaterietBasemaps({
        topographyStyle: import.meta.env.VITE_LANTMATERIET_TOPOGRAPHY_STYLE_URL,
        orthophotoTiles: import.meta.env.VITE_LANTMATERIET_ORTHOPHOTO_TILES_URL,
    });
    layers.push({
        id: 'openfreemap',
        label: 'Karta',
        kind: 'style',
        url: import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty',
    });

    return new MapLibreAdapter(element, layers, onError);
};

class MapLibreAdapter implements MapAdapter {
    private map: LibreMap;
    private basemap: string;
    private layerFailed = false;
    readonly basemaps: MapLibreBasemap[];

    constructor(element: HTMLElement, layers: MapLibreBasemap[], onError: MapIssueListener) {
        this.basemaps = layers;
        this.basemap = layers[0].id;
        this.map = new LibreMap({
            container: element,
            style: styleFor(layers[0]),
            center: [DEFAULT_VIEW.center.lng, DEFAULT_VIEW.center.lat],
            zoom: DEFAULT_VIEW.zoom,
            dragRotate: false,
            pitchWithRotate: false,
            touchPitch: false,
            maxPitch: 0,
            cooperativeGestures: true,
            attributionControl: { compact: true },
        });
        this.map.touchZoomRotate.disableRotation();
        this.map.on('error', () => {
            this.layerFailed = true;
            onError({
                kind: 'layer',
                message:
                    'Kartlagret kunde inte laddas. Kontrollera anslutning och behörighet till baskartan.',
            });
        });
        // Clear a previous layer error only after a new layer finishes loading.
        this.map.on('idle', () => {
            if (!this.layerFailed && this.map.isStyleLoaded()) {
                onError(null);
            }
        });
    }

    getBasemap() {
        return this.basemap;
    }

    setBasemap(id: string) {
        const layer = this.basemaps.find((item) => item.id === id);
        if (!layer) {
            throw new Error('Okänd baskarta.');
        }
        this.layerFailed = false;
        this.map.setStyle(styleFor(layer));
        this.basemap = id;
    }

    getCenter(): Coordinates {
        const point = this.map.getCenter();

        return { lat: point.lat, lng: point.lng };
    }

    setCenter(position: Coordinates) {
        this.map.jumpTo({ center: [position.lng, position.lat] });
    }

    getZoom() {
        return this.map.getZoom();
    }

    setZoom(zoom: number) {
        this.map.easeTo({ zoom: Math.max(0, Math.min(22, zoom)) });
    }

    fitBounds(bounds: MapBounds) {
        this.map.fitBounds(
            [
                [bounds.west, bounds.south],
                [bounds.east, bounds.north],
            ],
            { padding: 48, maxZoom: 18, duration: 0 },
        );
    }

    project(position: Coordinates): ScreenPoint {
        const point = this.map.project([position.lng, position.lat]);

        return { x: point.x, y: point.y };
    }

    unproject(point: ScreenPoint): Coordinates {
        const position = this.map.unproject([point.x, point.y]);

        return { lat: position.lat, lng: position.lng };
    }

    onClick(listener: (position: Coordinates) => void) {
        const callback = (event: { lngLat: { lat: number; lng: number } }) =>
            listener({ lat: event.lngLat.lat, lng: event.lngLat.lng });
        this.map.on('click', callback);

        return () => {
            this.map.off('click', callback);
        };
    }

    onViewChange(listener: () => void) {
        this.map.on('render', listener);

        return () => {
            this.map.off('render', listener);
        };
    }

    setPanEnabled(enabled: boolean) {
        if (enabled) {
            this.map.dragPan.enable();
        } else {
            this.map.dragPan.disable();
        }
    }

    resize() {
        this.map.resize();
    }

    destroy() {
        this.map.remove();
    }
}
