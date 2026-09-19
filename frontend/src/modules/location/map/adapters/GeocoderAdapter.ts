import type { Coordinates } from '../data/types';
import type { MapBounds } from '../domain/map';

export type AddressSuggestion = { id: string; label: string };

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

export interface GeocoderAdapter {
    readonly autocomplete: boolean;
    readonly attribution: { label: string; url: string };
    search(query: string, signal: AbortSignal): Promise<AddressSuggestion[]>;
    resolve(suggestion: AddressSuggestion, signal: AbortSignal): Promise<AddressSearchResult>;
    dispose(): void;
}

export type GeocoderFactory = () => Promise<GeocoderAdapter>;
