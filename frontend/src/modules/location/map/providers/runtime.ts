import type { MapRuntime } from '../data/types';

// Only this composition root selects dependencies. UI and features accept contracts.
const provider = import.meta.env.VITE_MAP_PROVIDER || 'google';

const geocoder =
    import.meta.env.VITE_GEOCODER_PROVIDER || (provider === 'google' ? 'google' : 'nominatim');

export const mapRuntime: MapRuntime = {
    async createMap(element, onError) {
        if (provider === 'google') {
            return (await import('./google/GoogleMapAdapter')).createGoogleMap(element, onError);
        }
        if (provider === 'maplibre') {
            return (await import('./maplibre/MapLibreAdapter')).createMapLibreMap(element, onError);
        }
        throw new Error('Okänd kartleverantör i konfigurationen.');
    },
    async createGeocoder() {
        if (geocoder === 'google' && provider === 'google') {
            return (await import('./google/GoogleGeocoderAdapter')).createGoogleGeocoder();
        }
        if (geocoder === 'nominatim') {
            return (await import('./nominatim/NominatimGeocoderAdapter')).createNominatimGeocoder();
        }
        throw new Error('Välj en geocoder som får användas med vald kartleverantör.');
    },
};
