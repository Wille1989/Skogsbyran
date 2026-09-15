import { useEffect, useRef, useState } from "react";
import type { Coordinates } from "../data/types";
import type { PropertyLocationPayload } from "../../types";

export type SelectedAddress = Pick<PropertyLocationPayload, "address" | "postalCode" | "city" | "municipality" | "countryCode" | "googlePlaceId"> & {
  position: Coordinates;
};

export function MapAddressSearch({ onSelect }: { onSelect: (address: SelectedAddress) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onSelect);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { callback.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    let selection = 0;
    const autocomplete = new google.maps.places.PlaceAutocompleteElement({ includedRegionCodes: ["se"] });
    autocomplete.placeholder = "Sök adress eller plats";
    autocomplete.setAttribute("aria-label", "Sök adress eller plats");
    const select = async (event: google.maps.places.PlacePredictionSelectEvent): Promise<void> => {
      const current = ++selection;
      setError(null);
      try {
        const place = event.placePrediction.toPlace();
        await place.fetchFields({ fields: ["location", "formattedAddress", "addressComponents", "id"] });
        if (disposed || current !== selection) return;
        if (!place.location) {
          setError("Platsen saknar koordinater. Välj ett annat sökresultat.");
          return;
        }
        const component = (type: string, short = false): string => {
          const entry = place.addressComponents?.find(item => item.types.includes(type));
          return (short ? entry?.shortText : entry?.longText) ?? "";
        };
        callback.current({
          position: place.location.toJSON(), address: place.formattedAddress ?? "",
          postalCode: component("postal_code"), city: component("postal_town") || component("locality"),
          municipality: component("administrative_area_level_2"), countryCode: component("country", true), googlePlaceId: place.id,
        });
      } catch {
        if (!disposed && current === selection) setError("Adressen kunde inte hämtas. Försök igen.");
      }
    };
    const fail = (): void => setError("Adressökningen kunde inte laddas. Försök igen eller välj plats i kartan.");
    autocomplete.addEventListener("gmp-select", select);
    autocomplete.addEventListener("gmp-error", fail);
    host.current?.append(autocomplete);
    return () => {
      disposed = true;
      autocomplete.removeEventListener("gmp-select", select);
      autocomplete.removeEventListener("gmp-error", fail);
      autocomplete.remove();
    };
  }, []);
  return <div className="map-address-search"><div ref={host} />{error && <p role="alert" className="form-error">{error}</p>}</div>;
}
