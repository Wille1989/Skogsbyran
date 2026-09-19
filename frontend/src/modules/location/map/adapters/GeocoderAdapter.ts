import type { AddressSuggestion, AddressSearchResult } from '../types/types';

export interface GeocoderAdapter {
    readonly autocomplete: boolean;
    readonly attribution: { label: string; url: string };
    search(query: string, signal: AbortSignal): Promise<AddressSuggestion[]>;
    resolve(suggestion: AddressSuggestion, signal: AbortSignal): Promise<AddressSearchResult>;
    dispose(): void;
}

export type GeocoderFactory = () => Promise<GeocoderAdapter>;
