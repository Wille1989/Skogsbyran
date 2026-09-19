import type { AddressSearchResult, GeocoderAdapter } from '../../adapters/GeocoderAdapter';
import { isValidCoordinate } from '../../data/areaDraft';

function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Ogiltigt svar från adressökningen.');
    }

    return value as Record<string, unknown>;
}

export function parseNominatim(value: unknown): AddressSearchResult[] {
    if (!Array.isArray(value)) {
        throw new Error('Ogiltigt svar från adressökningen.');
    }

    return value.map((item) => {
        const row = record(item);
        const address = record(row.address);
        if (
            typeof row.lat !== 'string' ||
            !row.lat.trim() ||
            typeof row.lon !== 'string' ||
            !row.lon.trim()
        ) {
            throw new Error('Sökresultatet saknar koordinater.');
        }
        const coordinates = { lat: Number(row.lat), lng: Number(row.lon) };
        if (!isValidCoordinate(coordinates) || typeof row.display_name !== 'string') {
            throw new Error('Sökresultatet saknar giltiga koordinater.');
        }
        const text = (key: string) => (typeof address[key] === 'string' ? address[key] : '');

        return {
            label: row.display_name,
            address:
                [text('road'), text('house_number')].filter(Boolean).join(' ') || row.display_name,
            coordinates,
            postalCode: text('postcode'),
            city: text('city') || text('town') || text('village'),
            municipality: text('municipality') || text('city'),
            countryCode: text('country_code').toUpperCase(),
            source: { provider: 'nominatim', id: String(row.place_id) },
        };
    });
}

let lastRequest = 0;

const cache = new Map<string, AddressSearchResult[]>();

export async function createNominatimGeocoder(): Promise<GeocoderAdapter> {
    const endpoint =
        import.meta.env.VITE_GEOCODER_SEARCH_URL || 'https://nominatim.openstreetmap.org/search';
    let results: AddressSearchResult[] = [];

    return {
        autocomplete: false, // Public Nominatim explicitly forbids client-side autocomplete.
        attribution: { label: '© OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
        async search(query, signal) {
            const url = new URL(endpoint, window.location.origin);
            url.search = new URLSearchParams({
                q: query,
                format: 'jsonv2',
                addressdetails: '1',
                countrycodes: 'se',
                limit: '6',
            }).toString();
            const cached = cache.get(url.href);
            if (cached) {
                results = cached;
            } else {
                if (Date.now() - lastRequest < 1100) {
                    throw new Error('Vänta en sekund innan du söker igen.');
                }
                lastRequest = Date.now();
                const response = await fetch(url, { signal, credentials: 'omit' });
                if (!response.ok) {
                    throw new Error('Adressökningen kunde inte nås. Försök igen.');
                }
                const parsed = parseNominatim(await response.json());
                signal.throwIfAborted();
                results = parsed;
                if (cache.size >= 50) {
                    cache.clear();
                }
                cache.set(url.href, results);
            }
            signal.throwIfAborted();

            return results.map((item, index) => ({ id: String(index), label: item.label }));
        },
        async resolve(suggestion, signal) {
            signal.throwIfAborted();
            const result = results[Number(suggestion.id)];
            if (!result || result.label !== suggestion.label) {
                throw new Error('Sök igen och välj ett aktuellt sökresultat.');
            }

            return result;
        },
        dispose() {
            results = [];
        },
    };
}
