import type { Coordinates, PropertyAreaDraft, PropertyAreaPayload } from "./types";

export function createDefaultAreaDraft(): PropertyAreaDraft {
  return { name: "Område 1", polygon: [] };
}

export function isValidCoordinate(point: Coordinates): boolean {
  return Number.isFinite(point.lat) && Math.abs(point.lat) <= 90 && Number.isFinite(point.lng) && Math.abs(point.lng) <= 180;
}

export function buildAreaPayload(draft: PropertyAreaDraft): PropertyAreaPayload | null {
  if (!draft.polygon.length) return null;
  if (draft.polygon.length < 3 || !draft.polygon.every(isValidCoordinate)
    || new Set(draft.polygon.map(point => `${point.lat},${point.lng}`)).size < 3) {
    throw new Error("Varje polygon måste ha minst tre olika punkter med giltiga koordinater.");
  }
  if (!draft.name.trim()) throw new Error("Ange ett namn på varje område.");
  return { name: draft.name.trim(), polygon: draft.polygon.map(point => ({ lat: point.lat, lng: point.lng })) };
}
