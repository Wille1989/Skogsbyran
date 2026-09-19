import { isValidCoordinate } from "../map/helpers/areaDraft";

export type LocationPoiDraft = {
  uiId: string;
  id?: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type PropertyLocationDraft = {
  address: string;
  postalCode: string;
  city: string;
  municipality: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string;
  pois: LocationPoiDraft[];
};

export type PropertyLocationPayload = {
  address: string;
  postalCode: string;
  city: string;
  municipality: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string;
  pois: Array<{
    id?: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
  }>;
};

export type PropertyLocationResponse = PropertyLocationPayload;

export const createDefaultLocationDraft = (): PropertyLocationDraft => ({
  address: "",
  postalCode: "",
  city: "",
  municipality: "",
  countryCode: "SE",
  latitude: null,
  longitude: null,
  googlePlaceId: "",
  pois: [],
});

export function buildLocationPayload(draft: PropertyLocationDraft): PropertyLocationPayload | null {
  if ((draft.latitude === null) !== (draft.longitude === null)
    || (draft.latitude !== null && draft.longitude !== null && !isValidCoordinate({ lat: draft.latitude, lng: draft.longitude }))) {
    throw new Error("Fastighetens position har ogiltiga koordinater.");
  }
  for (const poi of draft.pois) {
    if (!poi.name.trim() || poi.name.trim().length > 120) throw new Error("Varje POI behöver ett namn med högst 120 tecken.");
    if (!isValidCoordinate({ lat: poi.latitude, lng: poi.longitude })) throw new Error("En POI har ogiltiga koordinater.");
  }
  const hasLocation =
    draft.address.trim() !== "" ||
    draft.postalCode.trim() !== "" ||
    draft.city.trim() !== "" ||
    draft.municipality.trim() !== "" ||
    draft.latitude !== null ||
    draft.longitude !== null ||
    draft.googlePlaceId.trim() !== "" ||
    draft.pois.length > 0;

  if (!hasLocation) {
    return null;
  }

  return {
    address: draft.address.trim(),
    postalCode: draft.postalCode.trim(),
    city: draft.city.trim(),
    municipality: draft.municipality.trim(),
    countryCode: draft.countryCode.trim() || "SE",
    latitude: draft.latitude,
    longitude: draft.longitude,
    googlePlaceId: draft.googlePlaceId.trim(),
    pois: draft.pois
      .map((poi) => ({
        id: poi.id,
        name: poi.name.trim(),
        description: poi.description.trim(),
        latitude: poi.latitude,
        longitude: poi.longitude,
      })),
  };
}
