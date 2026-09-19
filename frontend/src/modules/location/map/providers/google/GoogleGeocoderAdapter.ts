import type { AddressSuggestion } from '../../data/types';
import type { GeocoderAdapter } from '../../adapters/GeocoderAdapter';
import { loadPlacesLibrary } from './loader';

export async function createGoogleGeocoder(): Promise<GeocoderAdapter> {
    await loadPlacesLibrary();
    let token = new google.maps.places.AutocompleteSessionToken();
    const predictions = new Map<string, google.maps.places.PlacePrediction>();

    return {
        autocomplete: true,
        attribution: { label: 'Google Maps', url: 'https://maps.google.com' },
        async search(query, signal) {
            const response =
                await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input: query,
                    includedRegionCodes: ['se'],
                    sessionToken: token,
                });
            signal.throwIfAborted();
            predictions.clear();

            return response.suggestions.flatMap(({ placePrediction }) => {
                if (!placePrediction) {
                    return [];
                }
                predictions.set(placePrediction.placeId, placePrediction);

                return [{ id: placePrediction.placeId, label: placePrediction.text.toString() }];
            });
        },
        async resolve(suggestion: AddressSuggestion, signal) {
            const prediction = predictions.get(suggestion.id);
            if (!prediction) {
                throw new Error('Sök igen och välj ett aktuellt sökresultat.');
            }
            const place = prediction.toPlace();
            await place.fetchFields({
                fields: ['location', 'formattedAddress', 'addressComponents', 'id', 'viewport'],
            });
            signal.throwIfAborted();
            token = new google.maps.places.AutocompleteSessionToken();
            if (!place.location) {
                throw new Error('Platsen saknar koordinater.');
            }
            const component = (type: string, short = false) => {
                const item = place.addressComponents?.find((entry) => entry.types.includes(type));

                return (short ? item?.shortText : item?.longText) ?? '';
            };

            return {
                label: suggestion.label,
                coordinates: place.location.toJSON(),
                bounds: place.viewport?.toJSON(),
                address: place.formattedAddress ?? suggestion.label,
                postalCode: component('postal_code'),
                city: component('postal_town') || component('locality'),
                municipality: component('administrative_area_level_2'),
                countryCode: component('country', true),
                source: { provider: 'google', id: place.id },
            };
        },
        dispose() {
            predictions.clear();
        },
    };
}
