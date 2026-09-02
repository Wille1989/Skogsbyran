export type LocationPoiDraft = {
  uiId: string;
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
    name: string;
    description: string;
    latitude: number;
    longitude: number;
  }>;
};

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
      .filter((poi) => poi.name.trim() !== "")
      .map((poi) => ({
        name: poi.name.trim(),
        description: poi.description.trim(),
        latitude: poi.latitude,
        longitude: poi.longitude,
      })),
  };
}
