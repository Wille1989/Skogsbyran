import type { AddressSearchResult } from '../adapters/GeocoderAdapter';
import type { PropertyLocationDraft } from '../../types';

// Compatibility boundary: the persisted API still names its optional source ID googlePlaceId.
export function locationFromAddress(
    location: PropertyLocationDraft,
    result: AddressSearchResult,
): PropertyLocationDraft {
    return {
        ...location,
        address: result.address,
        postalCode: result.postalCode,
        city: result.city,
        municipality: result.municipality,
        countryCode: result.countryCode,
        latitude: result.coordinates.lat,
        longitude: result.coordinates.lng,
        googlePlaceId: result.source?.provider === 'google' ? result.source.id : '',
    };
}
