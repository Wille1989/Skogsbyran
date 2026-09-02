import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { googleMapsMapId, loadGoogleMaps } from "../map/data/googleMapsLoader";
import type { LocationPoiDraft, PropertyLocationDraft } from "./types";
import "./LocationEditor.css";

type LocationEditorProps = {
  value: PropertyLocationDraft;
  onChange: (value: PropertyLocationDraft) => void;
};

const DEFAULT_CENTER = {
  lat: 59.3293,
  lng: 18.0686,
};

function createUiId(): string {
  return crypto.randomUUID();
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

function readAddressComponent(place: google.maps.places.PlaceResult, type: string, useShortName = false): string {
  const component = place.address_components?.find((item) => item.types.includes(type));

  return component ? (useShortName ? component.short_name : component.long_name) : "";
}

export function LocationEditor({ value, onChange }: LocationEditorProps) {
  const mapElementId = useId().replace(/:/g, "");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const placeMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const poiMarkerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);

  useEffect(() => {
    let isCancelled = false;

    async function setup(): Promise<void> {
      try {
        const googleMaps = await loadGoogleMaps();

        if (isCancelled || !mapElementRef.current || !searchInputRef.current) {
          return;
        }

        const center =
          valueRef.current.latitude !== null && valueRef.current.longitude !== null
            ? { lat: valueRef.current.latitude, lng: valueRef.current.longitude }
            : DEFAULT_CENTER;

        const map = new googleMaps.maps.Map(mapElementRef.current, {
          center,
          zoom: valueRef.current.latitude !== null ? 12 : 6,
          mapId: googleMapsMapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          cameraControl: false,
        });

        mapRef.current = map;

        const autocomplete = new googleMaps.maps.places.Autocomplete(searchInputRef.current, {
          fields: ["address_components", "formatted_address", "geometry", "place_id", "name"],
          componentRestrictions: { country: "se" },
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const location = place.geometry?.location;

          if (!location) {
            return;
          }

          const next = {
            ...valueRef.current,
            address:
              place.formatted_address ??
              [readAddressComponent(place, "route"), readAddressComponent(place, "street_number")]
                .filter(Boolean)
                .join(" "),
            postalCode: readAddressComponent(place, "postal_code"),
            city:
              readAddressComponent(place, "postal_town") ||
              readAddressComponent(place, "locality"),
            municipality: readAddressComponent(place, "administrative_area_level_2"),
            countryCode: readAddressComponent(place, "country", true) || "SE",
            latitude: roundCoordinate(location.lat()),
            longitude: roundCoordinate(location.lng()),
            googlePlaceId: place.place_id ?? "",
          };

          onChangeRef.current(next);
          map.panTo({ lat: next.latitude ?? DEFAULT_CENTER.lat, lng: next.longitude ?? DEFAULT_CENTER.lng });
          map.setZoom(13);
        });

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) {
            return;
          }

          const nextPoi: LocationPoiDraft = {
            uiId: createUiId(),
            name: `POI ${valueRef.current.pois.length + 1}`,
            description: "",
            latitude: roundCoordinate(event.latLng.lat()),
            longitude: roundCoordinate(event.latLng.lng()),
          };

          onChangeRef.current({
            ...valueRef.current,
            pois: [...valueRef.current.pois, nextPoi],
          });
        });
      } catch (error) {
        if (!isCancelled) {
          setLoadError((error as Error).message || "Google Maps kunde inte laddas.");
        }
      }
    }

    void setup();

    return () => {
      isCancelled = true;
      if (placeMarkerRef.current) {
        placeMarkerRef.current.map = null;
      }
      poiMarkerRefs.current.forEach((marker) => {
        marker.map = null;
      });
      poiMarkerRefs.current = [];
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !window.google?.maps) {
      return;
    }

    if (placeMarkerRef.current) {
      placeMarkerRef.current.map = null;
    }

    if (value.latitude !== null && value.longitude !== null) {
      placeMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: value.latitude, lng: value.longitude },
        title: "Fastighetens plats",
      });
    }

    poiMarkerRefs.current.forEach((marker) => {
      marker.map = null;
    });
    poiMarkerRefs.current = value.pois.map((poi) =>
      new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: poi.latitude, lng: poi.longitude },
        title: poi.name,
      }),
    );
  }, [value.latitude, value.longitude, value.pois]);

  const updateField = (field: keyof PropertyLocationDraft) => (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({
      ...value,
      [field]: event.target.value,
    });
  };

  const updatePoi = (uiId: string, patch: Partial<LocationPoiDraft>): void => {
    onChange({
      ...value,
      pois: value.pois.map((poi) => (poi.uiId === uiId ? { ...poi, ...patch } : poi)),
    });
  };

  const removePoi = (uiId: string): void => {
    onChange({
      ...value,
      pois: value.pois.filter((poi) => poi.uiId !== uiId),
    });
  };

  return (
    <section className="location-editor form">
      <div className="create-section-copy">
        <strong>Plats och närliggande punkter</strong>
        <p>Sök adressen via Google Places. Klicka sedan i kartan för att lägga till POIs som skola, badplats eller väganslutning.</p>
      </div>

      <div className="location-grid">
        <div className="location-fields">
          <div className="form-field">
            <label htmlFor="property-location-search">Sök adress/plats</label>
            <input ref={searchInputRef} id="property-location-search" placeholder="Sök med Google Places" />
          </div>

          <div className="form-field">
            <label htmlFor="property-address">Adress</label>
            <input id="property-address" value={value.address} onChange={updateField("address")} />
          </div>

          <div className="location-field-row">
            <div className="form-field">
              <label htmlFor="property-postal-code">Postnummer</label>
              <input id="property-postal-code" value={value.postalCode} onChange={updateField("postalCode")} />
            </div>

            <div className="form-field">
              <label htmlFor="property-city">Ort</label>
              <input id="property-city" value={value.city} onChange={updateField("city")} />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="property-municipality">Kommun</label>
            <input id="property-municipality" value={value.municipality} onChange={updateField("municipality")} />
          </div>
        </div>

        <div className="location-map-shell">
          {loadError ? <p className="form-error">{loadError}</p> : null}
          <div id={mapElementId} ref={mapElementRef} className="location-map" />
        </div>
      </div>

      <div className="poi-list">
        {value.pois.map((poi) => (
          <article className="poi-card" key={poi.uiId}>
            <div className="location-field-row">
              <div className="form-field">
                <label htmlFor={`poi-name-${poi.uiId}`}>Namn</label>
                <input
                  id={`poi-name-${poi.uiId}`}
                  value={poi.name}
                  onChange={(event) => updatePoi(poi.uiId, { name: event.target.value })}
                />
              </div>

              <button type="button" className="button button-danger" onClick={() => removePoi(poi.uiId)}>
                Ta bort POI
              </button>
            </div>

            <div className="form-field">
              <label htmlFor={`poi-description-${poi.uiId}`}>Beskrivning</label>
              <input
                id={`poi-description-${poi.uiId}`}
                value={poi.description}
                onChange={(event) => updatePoi(poi.uiId, { description: event.target.value })}
                placeholder="Ex. 3 km till badplats"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
