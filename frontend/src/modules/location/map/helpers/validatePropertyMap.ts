import type { ResponseProperty } from "@/modules/property/types/types";
import { isValidCoordinate } from "./areaDraft";

// Validate persisted geometry at the API boundary, before form hydration or Maps.
// Reject corrupt data instead of silently dropping points or swapping coordinates.
export function validatePropertyMap(property: ResponseProperty): void {
  if (!property || !Array.isArray(property.areas) || !property.areas.every(area =>
    area && typeof area.name === "string" && Array.isArray(area.polygon)
    && area.polygon.length >= 3 && area.polygon.every(isValidCoordinate)
    && new Set(area.polygon.map(point => point.lat + "," + point.lng)).size >= 3)) {
    throw new Error("Fastighetens sparade områden innehåller ofullständig eller ogiltig kartdata.");
  }
  const location = property.location;
  if (location == null) return;
  if ((location.latitude !== null || location.longitude !== null)
    && !isValidCoordinate({ lat: location.latitude, lng: location.longitude })) {
    throw new Error("Fastighetens sparade huvudposition har ogiltiga koordinater.");
  }
  if (!Array.isArray(location.pois) || !location.pois.every(poi => poi
    && typeof poi.name === "string" && poi.name.trim() !== ""
    && typeof poi.description === "string"
    && isValidCoordinate({ lat: poi.latitude, lng: poi.longitude }))) {
    throw new Error("Fastighetens sparade POI kunde inte läsas: namn eller koordinater saknas eller är ogiltiga.");
  }
}
