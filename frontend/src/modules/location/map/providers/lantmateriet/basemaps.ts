import type { Basemap } from '../../types/types';

export type StyleBasemap = Basemap & { kind: 'style'; url: string };

export type RasterBasemap = Basemap & {
    kind: 'raster';
    tiles: string;
    attribution: string;
    maxZoom: number;
};

export type MapLibreBasemap = StyleBasemap | RasterBasemap;

// Authenticated services must be exposed through an authorized tile/style proxy.
// No Lantmäteriet credentials or guessed public service URLs are shipped to the browser.
export function lantmaterietBasemaps(config: {
    topographyStyle?: string;
    orthophotoTiles?: string;
}): MapLibreBasemap[] {
    const layers: MapLibreBasemap[] = [];
    if (config.topographyStyle) {
        layers.push({
            id: 'lm-topography',
            label: 'Lantmäteriet – Topografisk',
            kind: 'style',
            url: config.topographyStyle,
        });
    }
    if (config.orthophotoTiles) {
        layers.push({
            id: 'lm-orthophoto',
            label: 'Lantmäteriet – Flygbild',
            kind: 'raster',
            tiles: config.orthophotoTiles,
            attribution: '© Lantmäteriet',
            maxZoom: 20,
        });
    }

    return layers;
}
