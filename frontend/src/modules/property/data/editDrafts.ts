import type { ResponseProperty } from "@/modules/property/data/types";
import type { PendingDocument } from "@/modules/document/types";
import type { PropertyLocationDraft, PropertyLocationPayload } from "@/modules/location/types";
import { buildLocationPayload, createDefaultLocationDraft } from "@/modules/location/types";
import type { PropertyArea, PropertyAreaDraft, PropertyAreaPayload } from "@/modules/location/map/data/types";
import { buildAreaPayload } from "@/modules/location/map/data/areaDraft";

export type EditableAreaDraft = PropertyAreaDraft & {
  id?: string;
};

export type EditableDocumentDraft = {
  documentId: string;
  title: string;
  originalTitle: string;
  originalName: string;
  url: string;
  isRemoved: boolean;
};

export type EditPropertyInput = {
  propertyId: string;
  details: ResponseProperty["details"];
  initialDetails: ResponseProperty["details"];
  imageChanges: {
    newImages: import("@/modules/image/data/types").NewImageFile[];
    updatedImages: import("@/modules/image/data/types").UpdateImageInput[];
    removedImageIds: string[];
  };
  location: PropertyLocationDraft;
  initialLocation: ResponseProperty["location"];
  areas: EditableAreaDraft[];
  initialAreas: PropertyArea[];
  documents: EditableDocumentDraft[];
  pendingDocuments: PendingDocument[];
  onAreaCreated?: (draft: EditableAreaDraft, saved: PropertyArea) => void;
};

export function locationDraftFromProperty(property: ResponseProperty): PropertyLocationDraft {
  const location = property.location;

  if (!location) {
    return createDefaultLocationDraft();
  }

  return {
    address: location.address,
    postalCode: location.postalCode,
    city: location.city,
    municipality: location.municipality,
    countryCode: location.countryCode,
    latitude: location.latitude,
    longitude: location.longitude,
    googlePlaceId: location.googlePlaceId,
    pois: location.pois.map((poi) => ({
      uiId: poi.id ?? crypto.randomUUID(),
      id: poi.id,
      name: poi.name,
      description: poi.description,
      latitude: poi.latitude,
      longitude: poi.longitude,
    })),
  };
}

export function areaDraftsFromProperty(property: ResponseProperty): EditableAreaDraft[] {
  return property.areas.map((area) => ({
    id: area.id,
    name: area.name,
    polygon: area.polygon,
  }));
}

export function documentDraftsFromProperty(property: ResponseProperty): EditableDocumentDraft[] {
  return property.documents.map((document) => ({
    documentId: document.documentId,
    title: document.title || document.originalName,
    originalTitle: document.title || document.originalName,
    originalName: document.originalName,
    url: document.url,
    isRemoved: false,
  }));
}

export function changedDetails(
  initialDetails: ResponseProperty["details"],
  currentDetails: ResponseProperty["details"],
): Partial<ResponseProperty["details"]> {
  const patch = Object.fromEntries(
    Object.entries(currentDetails).filter(([key, value]) =>
      initialDetails[key as keyof typeof initialDetails] !== value
    ),
  ) as Partial<ResponseProperty["details"]>;
  if ("scheduledListingStatus" in patch || "scheduledStatusAt" in patch) {
    patch.scheduledListingStatus = currentDetails.scheduledListingStatus;
    patch.scheduledStatusAt = currentDetails.scheduledStatusAt;
  }
  return patch;
}

export function changedLocationPayload(
  initialLocation: ResponseProperty["location"],
  currentLocation: PropertyLocationDraft,
): PropertyLocationPayload | null {
  const currentPayload = buildLocationPayload(currentLocation);
  const initialPayload = initialLocation
    ? {
        ...initialLocation,
        pois: initialLocation.pois.map((poi) => ({
          id: poi.id,
          name: poi.name,
          description: poi.description,
          latitude: poi.latitude,
          longitude: poi.longitude,
        })),
      }
    : null;

  if (JSON.stringify(initialPayload) === JSON.stringify(currentPayload)) {
    return null;
  }

  return currentPayload ?? {
    address: "",
    postalCode: "",
    city: "",
    municipality: "",
    countryCode: "SE",
    latitude: null,
    longitude: null,
    googlePlaceId: "",
    pois: [],
  };
}

export function areaChanges(initialAreas: PropertyArea[], currentAreas: EditableAreaDraft[]): {
  createdAreas: Array<{ draft: EditableAreaDraft; payload: PropertyAreaPayload }>;
  updatedAreas: Array<{ areaId: string; payload: PropertyAreaPayload }>;
  removedAreaIds: string[];
} {
  const currentPersistedIds = new Set(
    currentAreas
      .map((area) => area.id)
      .filter((areaId): areaId is string => typeof areaId === "string" && areaId !== ""),
  );
  const initialAreasById = new Map(initialAreas.map((area) => [area.id, area]));
  const createdAreas: Array<{ draft: EditableAreaDraft; payload: PropertyAreaPayload }> = [];
  const updatedAreas: Array<{ areaId: string; payload: PropertyAreaPayload }> = [];

  currentAreas.forEach((area) => {
    const payload = buildAreaPayload(area);

    if (!payload) {
      if (area.id) throw new Error("Ett sparat område får inte ha en tom polygon. Ta bort området om det ska raderas.");
      return;
    }

    if (!area.id) {
      createdAreas.push({ draft: area, payload });
      return;
    }

    const initialArea = initialAreasById.get(area.id);

    if (!initialArea || JSON.stringify(buildAreaPayload(initialArea)) !== JSON.stringify(payload)) {
      updatedAreas.push({
        areaId: area.id,
        payload,
      });
    }
  });

  return {
    createdAreas,
    updatedAreas,
    removedAreaIds: initialAreas
      .filter((area) => !currentPersistedIds.has(area.id))
      .map((area) => area.id),
  };
}

export function documentChanges(documents: EditableDocumentDraft[]): {
  renamedDocuments: Array<{ documentId: string; title: string }>;
  removedDocumentIds: string[];
} {
  return {
    renamedDocuments: documents
      .filter((document) => !document.isRemoved && document.title.trim() !== document.originalTitle)
      .map((document) => ({
        documentId: document.documentId,
        title: document.title.trim(),
      })),
    removedDocumentIds: documents
      .filter((document) => document.isRemoved)
      .map((document) => document.documentId),
  };
}
